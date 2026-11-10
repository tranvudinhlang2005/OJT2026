package com.p02.training.service;

import com.p02.training.audit.SecurityAuditLogger;
import com.p02.training.dto.request.AttendanceItemRequest;
import com.p02.training.dto.request.ReasonRequest;
import com.p02.training.dto.request.UpdateAttendanceRequest;
import com.p02.training.dto.response.AttendanceSheetResponse;
import com.p02.training.entity.Attendance;
import com.p02.training.entity.ClassOffering;
import com.p02.training.entity.Enrollment;
import com.p02.training.entity.Session;
import com.p02.training.entity.Student;
import com.p02.training.entity.User;
import com.p02.training.entity.enums.ClassStatus;
import com.p02.training.entity.enums.EnrollmentStatus;
import com.p02.training.entity.enums.GradingStatus;
import com.p02.training.entity.enums.SecurityAction;
import com.p02.training.exception.ApiException;
import com.p02.training.exception.ErrorCode;
import com.p02.training.repository.AttendanceRepository;
import com.p02.training.repository.ClassOfferingRepository;
import com.p02.training.repository.EnrollmentRepository;
import com.p02.training.repository.SessionRepository;
import com.p02.training.repository.StudentRepository;
import com.p02.training.repository.UserRepository;
import com.p02.training.security.AuthenticatedUser;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * TR14 attendance. The assigned instructor views, saves and locks a session's attendance; an Admin
 * views and unlocks. Roles are enforced in SecurityConfig; "assigned" is checked here from the
 * session's user (403 + ACCESS_DENIED otherwise).
 *
 * <p>Locks: saving and locking take the Session row (TR14 text). Unlocking takes ClassOffering, then
 * Session (A-25), the same order as TR16 confirmation, so the two cannot race. Unlocking never
 * clears locked_by or locked_at, and a later lock keeps the last unlock_reason (A-24).
 */
@Service
public class AttendanceService {

    static final int MIN_UNLOCK_REASON_LENGTH = 10;

    /** Students listed on an attendance sheet: those in the class now, and after completion. */
    private static final Set<EnrollmentStatus> LISTED = EnumSet.of(EnrollmentStatus.ENROLLED, EnrollmentStatus.COMPLETED);

    private final SessionRepository sessionRepository;
    private final ClassOfferingRepository classOfferingRepository;
    private final AttendanceRepository attendanceRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final ClassLockService locks;
    private final ClassAccessGuard accessGuard;
    private final SecurityAuditLogger auditLogger;
    private final Clock clock;

    public AttendanceService(SessionRepository sessionRepository, ClassOfferingRepository classOfferingRepository,
            AttendanceRepository attendanceRepository, EnrollmentRepository enrollmentRepository,
            StudentRepository studentRepository, UserRepository userRepository, ClassLockService locks,
            ClassAccessGuard accessGuard, SecurityAuditLogger auditLogger, Clock clock) {
        this.sessionRepository = sessionRepository;
        this.classOfferingRepository = classOfferingRepository;
        this.attendanceRepository = attendanceRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.studentRepository = studentRepository;
        this.userRepository = userRepository;
        this.locks = locks;
        this.accessGuard = accessGuard;
        this.auditLogger = auditLogger;
        this.clock = clock;
    }

    /** {@code GET /sessions/{id}/attendance}: Admin or the assigned instructor. */
    @Transactional(readOnly = true)
    public AttendanceSheetResponse getAttendance(Long sessionId, AuthenticatedUser viewer) {
        ClassOffering classOffering = classOfSession(sessionId);
        accessGuard.requireAdminOrAssigned(classOffering, viewer, "attendance");
        Session session = sessionRepository.findById(sessionId).orElseThrow(AttendanceService::notFound);
        return sheet(classOffering, session);
    }

    /**
     * {@code PUT /sessions/{id}/attendance}: the assigned instructor. Locks the Session, then checks:
     * class IN_PROGRESS; session not locked; session date not after today; version equals
     * attendance_version; every student has an ENROLLED enrollment in this class. Upserts the
     * marks with marked_by and marked_at, adds 1 to attendance_version and logs ATTENDANCE_UPDATE
     * with the values before and after.
     */
    @Transactional
    public AttendanceSheetResponse updateAttendance(Long sessionId, UpdateAttendanceRequest request,
            AuthenticatedUser viewer) {
        requireNoDuplicateStudents(request.items());
        ClassOffering classOffering = classOfSession(sessionId);
        accessGuard.requireAssigned(classOffering, viewer, "attendance");
        Session session = sessionRepository.findLockedById(sessionId).orElseThrow(AttendanceService::notFound);

        requireRecordable(classOffering, session);
        if (request.version() != session.getAttendanceVersion()) {
            throw new ApiException(ErrorCode.VERSION_CONFLICT);
        }
        Set<Long> enrolled = new HashSet<>(
                enrollmentRepository.findStudentIds(classOffering.getId(), EnrollmentStatus.ENROLLED));
        for (AttendanceItemRequest item : request.items()) {
            if (!enrolled.contains(item.studentId())) {
                throw ApiException.conflict("STUDENT_NOT_IN_CLASS",
                        "Học viên " + studentLabel(item.studentId()) + " không còn trong danh sách lớp");
            }
        }

        Map<Long, Attendance> existing = attendanceRepository.findBySession_Id(sessionId).stream()
                .collect(Collectors.toMap(attendance -> attendance.getStudent().getId(), Function.identity()));
        User marker = userRepository.getReferenceById(viewer.id());
        Instant now = Instant.now(clock);
        List<Map<String, Object>> changes = new ArrayList<>();
        for (AttendanceItemRequest item : request.items()) {
            Attendance attendance = existing.get(item.studentId());
            Map<String, Object> before = attendance == null ? null : mark(attendance.getStatus().name(), attendance.getRemarks());
            if (attendance == null) {
                Student student = studentRepository.getReferenceById(item.studentId());
                attendance = new Attendance(session, student, item.status(), marker, now);
                attendance.setRemarks(item.remarks());
                attendanceRepository.save(attendance);
            } else {
                attendance.setStatus(item.status());
                attendance.setRemarks(item.remarks());
                attendance.setMarkedBy(marker);
                attendance.setMarkedAt(now);
            }
            Map<String, Object> change = new LinkedHashMap<>();
            change.put("studentId", item.studentId());
            change.put("before", before);
            change.put("after", mark(item.status().name(), item.remarks()));
            changes.add(change);
        }
        session.setAttendanceVersion(session.getAttendanceVersion() + 1);

        Map<String, Object> details = sessionDetails(classOffering, session);
        details.put("version", session.getAttendanceVersion());
        details.put("changes", changes);
        auditLogger.record(SecurityAction.ATTENDANCE_UPDATE, viewer.username(), details);
        return sheet(classOffering, session);
    }

    /**
     * {@code POST /sessions/{id}/lock}: the assigned instructor. The same conditions as saving, and
     * every ENROLLED student of the class must already have a mark (D16). Sets locked_by and
     * locked_at and logs SESSION_LOCK.
     */
    @Transactional
    public AttendanceSheetResponse lockSession(Long sessionId, AuthenticatedUser viewer) {
        ClassOffering classOffering = classOfSession(sessionId);
        accessGuard.requireAssigned(classOffering, viewer, "attendance");
        Session session = sessionRepository.findLockedById(sessionId).orElseThrow(AttendanceService::notFound);

        requireRecordable(classOffering, session);
        long missing = enrollmentRepository.countWithoutAttendance(classOffering.getId(), sessionId,
                EnrollmentStatus.ENROLLED);
        if (missing > 0) {
            throw ApiException.conflict("ATTENDANCE_INCOMPLETE", "Còn " + missing + " học viên chưa được điểm danh");
        }
        session.setAttendanceLocked(true);
        session.setLockedBy(userRepository.getReferenceById(viewer.id()));
        session.setLockedAt(Instant.now(clock));
        auditLogger.record(SecurityAction.SESSION_LOCK, viewer.username(), sessionDetails(classOffering, session));
        return sheet(classOffering, session);
    }

    /**
     * {@code POST /sessions/{id}/unlock}: Admin, with a reason of at least 10 characters (D16).
     * Locks ClassOffering → Session (A-25), then requires the class not CLOSED and its results not
     * CONFIRMED. Unlocking a session that is not locked changes nothing and logs nothing.
     */
    @Transactional
    public AttendanceSheetResponse unlockSession(Long sessionId, ReasonRequest request, AuthenticatedUser viewer) {
        String reason = request.reason().strip();
        if (reason.length() < MIN_UNLOCK_REASON_LENGTH) {
            throw ApiException.validation("reason", "Lý do mở khóa phải có ít nhất 10 ký tự");
        }
        Long classId = sessionRepository.findClassIdById(sessionId).orElseThrow(AttendanceService::notFound);
        ClassOffering classOffering = locks.lockClass(classId);
        Session session = sessionRepository.findLockedById(sessionId).orElseThrow(AttendanceService::notFound);

        if (classOffering.getStatus() == ClassStatus.CLOSED) {
            throw ApiException.conflict("CLASS_NOT_IN_PROGRESS", "Lớp không ở trạng thái đang học");
        }
        if (classOffering.getGradingStatus() == GradingStatus.CONFIRMED) {
            throw ApiException.conflict("GRADING_CONFIRMED", "Kết quả lớp đã xác nhận, không thể mở khóa");
        }
        if (session.isAttendanceLocked()) {
            session.setAttendanceLocked(false);
            session.setUnlockReason(reason);
            Map<String, Object> details = sessionDetails(classOffering, session);
            details.put("reason", reason);
            auditLogger.record(SecurityAction.SESSION_UNLOCK, viewer.username(), details);
        }
        return sheet(classOffering, session);
    }

    // --- helpers --------------------------------------------------------------------------------

    /**
     * The session's class, with its instructor and user, for the permission check. The session row
     * itself is not loaded here, so a later locking query reads it fresh.
     */
    private ClassOffering classOfSession(Long sessionId) {
        Long classId = sessionRepository.findClassIdById(sessionId).orElseThrow(AttendanceService::notFound);
        return classOfferingRepository.findWithDetailsByIdAndDeletedAtIsNull(classId)
                .orElseThrow(AttendanceService::notFound);
    }

    /** Class IN_PROGRESS, session not locked, session date not after today (TR14). */
    private void requireRecordable(ClassOffering classOffering, Session session) {
        if (classOffering.getStatus() != ClassStatus.IN_PROGRESS) {
            throw ApiException.conflict("CLASS_NOT_IN_PROGRESS", "Lớp không ở trạng thái đang học");
        }
        if (session.isAttendanceLocked()) {
            throw ApiException.conflict("SESSION_LOCKED", "Buổi học đã chốt, không thể sửa điểm danh");
        }
        if (session.getSessionDate().isAfter(LocalDate.now(clock))) {
            throw ApiException.conflict("SESSION_NOT_STARTED", "Buổi học chưa diễn ra");
        }
    }

    private static void requireNoDuplicateStudents(List<AttendanceItemRequest> items) {
        Set<Long> seen = new HashSet<>();
        Set<Long> repeated = new LinkedHashSet<>();
        items.forEach(item -> {
            if (!seen.add(item.studentId())) {
                repeated.add(item.studentId());
            }
        });
        if (!repeated.isEmpty()) {
            throw ApiException.validation("items", "Học viên bị lặp trong cùng yêu cầu: "
                    + repeated.stream().map(String::valueOf).collect(Collectors.joining(", ")));
        }
    }

    /** The student's code for an error message, or the id if there is no such student. */
    private String studentLabel(Long studentId) {
        return studentRepository.findById(studentId).map(Student::getStudentCode).orElse(String.valueOf(studentId));
    }

    /**
     * The sheet: every ENROLLED or COMPLETED student of the class, plus anyone marked in this
     * session, ordered by student code. Two queries, each loading students and users together.
     */
    private AttendanceSheetResponse sheet(ClassOffering classOffering, Session session) {
        Map<Long, AttendanceSheetResponse.Item> items = new LinkedHashMap<>();
        Map<Long, Attendance> marks = attendanceRepository.findBySession_Id(session.getId()).stream()
                .collect(Collectors.toMap(attendance -> attendance.getStudent().getId(), Function.identity()));
        for (Enrollment enrollment : enrollmentRepository
                .findByClassOffering_IdAndStatusIn(classOffering.getId(), LISTED, Pageable.unpaged()).getContent()) {
            Student student = enrollment.getStudent();
            items.put(student.getId(), item(student, enrollment.getStatus(), marks.get(student.getId())));
        }
        marks.forEach((studentId, attendance) ->
                items.computeIfAbsent(studentId, id -> item(attendance.getStudent(), null, attendance)));

        List<AttendanceSheetResponse.Item> sorted = new ArrayList<>(items.values());
        sorted.sort(Comparator.comparing(AttendanceSheetResponse.Item::studentCode));
        return new AttendanceSheetResponse(session.getId(), classOffering.getId(), classOffering.getClassCode(),
                session.getSessionDate(), session.getStartTime(), session.getEndTime(), session.isAttendanceLocked(),
                session.getLockedAt(), session.getUnlockReason(), session.getAttendanceVersion(), sorted);
    }

    private static AttendanceSheetResponse.Item item(Student student, EnrollmentStatus enrollmentStatus,
            Attendance attendance) {
        return new AttendanceSheetResponse.Item(student.getId(), student.getStudentCode(),
                student.getUser().getFullName(), enrollmentStatus,
                attendance == null ? null : attendance.getStatus(),
                attendance == null ? null : attendance.getRemarks(),
                attendance == null ? null : attendance.getMarkedAt());
    }

    private static Map<String, Object> mark(String status, String remarks) {
        Map<String, Object> value = new LinkedHashMap<>();
        value.put("status", status);
        value.put("remarks", remarks);
        return value;
    }

    private static Map<String, Object> sessionDetails(ClassOffering classOffering, Session session) {
        Map<String, Object> details = new LinkedHashMap<>();
        details.put("sessionId", session.getId());
        details.put("classId", classOffering.getId());
        details.put("classCode", classOffering.getClassCode());
        details.put("sessionDate", session.getSessionDate().toString());
        return details;
    }

    private static ApiException notFound() {
        return new ApiException(ErrorCode.NOT_FOUND);
    }
}
