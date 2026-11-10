package com.p02.training.service;

import com.p02.training.audit.SecurityAuditLogger;
import com.p02.training.dto.request.CancelClassRequest;
import com.p02.training.dto.request.ChangeCapacityRequest;
import com.p02.training.dto.request.ClassRequest;
import com.p02.training.dto.response.ClassResponse;
import com.p02.training.entity.ClassOffering;
import com.p02.training.entity.Course;
import com.p02.training.entity.Enrollment;
import com.p02.training.entity.Instructor;
import com.p02.training.entity.InstructorCourseId;
import com.p02.training.entity.Room;
import com.p02.training.entity.Session;
import com.p02.training.entity.User;
import com.p02.training.entity.enums.ClassStatus;
import com.p02.training.entity.enums.EnrollmentStatus;
import com.p02.training.entity.enums.SecurityAction;
import com.p02.training.exception.ApiException;
import com.p02.training.exception.ErrorCode;
import com.p02.training.repository.ClassOfferingRepository;
import com.p02.training.repository.CourseRepository;
import com.p02.training.repository.EnrollmentRepository;
import com.p02.training.repository.InstructorCourseRepository;
import com.p02.training.repository.SessionRepository;
import com.p02.training.repository.UserRepository;
import com.p02.training.security.AuthenticatedUser;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * TR05 class creation and lifecycle (spec 2.2, D10-D12), for Training Admins (SecurityConfig).
 *
 * <p>Every write locks the class row before reading it; publishing locks the instructor first
 * (spec 0.5). Data changes log CLASS_CHANGE and status transitions log CLASS_STATUS_CHANGE, in the
 * same transaction. "Today" and "now" use the business clock (Vietnam time, spec 0.1).
 */
@Service
public class ClassService {

    private static final String CLASS_CODE_DUPLICATE = "CLASS_CODE_DUPLICATE";
    private static final String COURSE_INACTIVE = "COURSE_INACTIVE";
    private static final String CLASS_NOT_EDITABLE = "CLASS_NOT_EDITABLE";
    private static final String CLASS_NOT_READY = "CLASS_NOT_READY";
    private static final String INSTRUCTOR_NOT_ELIGIBLE = "INSTRUCTOR_NOT_ELIGIBLE";
    private static final String ROOM_TOO_SMALL = "ROOM_TOO_SMALL";
    private static final String CAPACITY_BELOW_ENROLLED = "CAPACITY_BELOW_ENROLLED";
    private static final String CLASS_HAS_ENROLLMENT = "CLASS_HAS_ENROLLMENT";
    private static final String CLASS_NOT_STARTED_YET = "CLASS_NOT_STARTED_YET";
    private static final String CLASS_NOT_CANCELLABLE = "CLASS_NOT_CANCELLABLE";
    private static final String CLASS_NOT_DELETABLE = "CLASS_NOT_DELETABLE";

    static final int MIN_CANCEL_REASON_LENGTH = 10;

    private static final Set<ClassStatus> CAPACITY_EDITABLE = EnumSet.of(ClassStatus.DRAFT, ClassStatus.OPEN);
    private static final Set<ClassStatus> CANCELLABLE = EnumSet.of(ClassStatus.DRAFT, ClassStatus.OPEN);
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final ClassOfferingRepository classOfferingRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final SessionRepository sessionRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final InstructorCourseRepository instructorCourseRepository;
    private final ClassLockService locks;
    private final ScheduleConflictService conflicts;
    private final SecurityAuditLogger auditLogger;
    private final Clock clock;

    public ClassService(ClassOfferingRepository classOfferingRepository, CourseRepository courseRepository,
            UserRepository userRepository, SessionRepository sessionRepository,
            EnrollmentRepository enrollmentRepository, InstructorCourseRepository instructorCourseRepository,
            ClassLockService locks, ScheduleConflictService conflicts, SecurityAuditLogger auditLogger, Clock clock) {
        this.classOfferingRepository = classOfferingRepository;
        this.courseRepository = courseRepository;
        this.userRepository = userRepository;
        this.sessionRepository = sessionRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.instructorCourseRepository = instructorCourseRepository;
        this.locks = locks;
        this.conflicts = conflicts;
        this.auditLogger = auditLogger;
        this.clock = clock;
    }

    /** {@code POST /classes}: a new DRAFT class with enrolled_count 0 and created_by = the Admin. */
    @Transactional
    public ClassResponse createClass(ClassRequest request, AuthenticatedUser actor) {
        validateDates(request);
        Course course = existingCourse(request.courseId());
        requireActive(course);
        if (classOfferingRepository.existsByClassCode(request.classCode())) {
            throw duplicateCode();
        }
        User creator = userRepository.getReferenceById(actor.id());
        ClassOffering classOffering = new ClassOffering(request.classCode(), course, request.semester(),
                request.startDate(), request.endDate(), request.maxCapacity(),
                request.cancelDeadline().toInstant(), creator);
        saveAndFlush(classOffering);
        logChange(actor, "CREATE", classOffering);
        return ClassResponse.from(classOffering);
    }

    /** {@code PUT /classes/{id}}: only while DRAFT, with the same rules as creation. */
    @Transactional
    public ClassResponse updateClass(Long id, ClassRequest request, AuthenticatedUser actor) {
        validateDates(request);
        Course course = existingCourse(request.courseId());
        ClassOffering classOffering = locks.lockClass(id);
        requireDraft(classOffering, "Lớp đã công bố, không thể sửa thông tin này");
        requireActive(course);
        if (classOfferingRepository.existsByClassCodeAndIdNot(request.classCode(), id)) {
            throw duplicateCode();
        }
        classOffering.setClassCode(request.classCode());
        classOffering.setCourse(course);
        classOffering.setSemester(request.semester());
        classOffering.setStartDate(request.startDate());
        classOffering.setEndDate(request.endDate());
        classOffering.setMaxCapacity(request.maxCapacity());
        classOffering.setCancelDeadline(request.cancelDeadline().toInstant());
        saveAndFlush(classOffering);
        logChange(actor, "UPDATE", classOffering);
        return ClassResponse.from(classOffering);
    }

    /**
     * {@code PATCH /classes/{id}/capacity} (DRAFT or OPEN). The new maximum may not be below the
     * number enrolled, nor above the smallest room among the class's sessions.
     */
    @Transactional
    public ClassResponse changeCapacity(Long id, ChangeCapacityRequest request, AuthenticatedUser actor) {
        ClassOffering classOffering = locks.lockClass(id);
        if (!CAPACITY_EDITABLE.contains(classOffering.getStatus())) {
            throw ApiException.conflict(CLASS_NOT_EDITABLE, "Lớp không còn cho phép đổi sĩ số");
        }
        int newCapacity = request.maxCapacity();
        if (newCapacity < classOffering.getEnrolledCount()) {
            throw ApiException.conflict(CAPACITY_BELOW_ENROLLED,
                    "Sĩ số tối đa không được nhỏ hơn số học viên đã đăng ký (" + classOffering.getEnrolledCount() + ")");
        }
        sessionsOf(id).stream()
                .map(Session::getRoom)
                .min(Comparator.comparingInt(Room::getCapacity))
                .filter(smallest -> newCapacity > smallest.getCapacity())
                .ifPresent(smallest -> {
                    throw roomTooSmall(smallest);
                });

        int oldCapacity = classOffering.getMaxCapacity();
        classOffering.setMaxCapacity(newCapacity);
        Map<String, Object> details = baseDetails("CAPACITY", classOffering);
        details.put("oldMaxCapacity", oldCapacity);
        details.put("newMaxCapacity", newCapacity);
        auditLogger.record(SecurityAction.CLASS_CHANGE, actor.username(), details);
        return ClassResponse.from(classOffering);
    }

    /**
     * {@code POST /classes/{id}/publish}: DRAFT → OPEN. Locks Instructor → ClassOffering, re-reads
     * and checks, in this order: DRAFT; course active; at least one session, all within the class
     * dates; an instructor who is active, whose account is active and who may teach the course; no
     * instructor or room conflict (TR08); every room large enough; start date after today and
     * cancellation deadline after now. Then copies the course's thresholds and weights (D13).
     */
    @Transactional
    public ClassResponse publish(Long id, AuthenticatedUser actor) {
        Long instructorId = locks.currentInstructorId(id);
        Instructor instructor = locks.lockInstructor(instructorId);
        ClassOffering classOffering = locks.lockClass(id);
        locks.requireSameInstructor(classOffering, instructorId);

        requireDraft(classOffering, "Lớp không ở trạng thái nháp, không thể công bố");
        Course course = classOffering.getCourse();
        requireActive(course);

        List<Session> sessions = sessionsOf(id);
        if (sessions.isEmpty() || instructor == null) {
            throw notReady("Chưa thể công bố: lớp chưa có lịch học hoặc giảng viên");
        }
        for (Session session : sessions) {
            if (session.getSessionDate().isBefore(classOffering.getStartDate())
                    || session.getSessionDate().isAfter(classOffering.getEndDate())) {
                throw notReady("Chưa thể công bố: buổi học ngày " + session.getSessionDate().format(DATE)
                        + " nằm ngoài thời gian của lớp");
            }
        }

        boolean eligible = instructor.isActive() && instructor.getUser().isActive()
                && instructorCourseRepository.existsById(new InstructorCourseId(instructor.getId(), course.getId()));
        if (!eligible) {
            throw ApiException.conflict(INSTRUCTOR_NOT_ELIGIBLE, "Giảng viên chưa đủ điều kiện dạy môn này");
        }

        List<ScheduleConflictService.Slot> slots = sessions.stream().map(ScheduleConflictService.Slot::of).toList();
        conflicts.requireNoInstructorConflict(conflicts.checkInstructorConflict(instructor.getId(), slots, id));
        for (Session session : sessions) {
            conflicts.requireNoRoomConflict(session.getRoom().getCode(),
                    conflicts.checkRoomConflict(session.getRoom().getId(), ScheduleConflictService.Slot.of(session),
                            session.getId()));
        }
        for (Session session : sessions) {
            if (session.getRoom().getCapacity() < classOffering.getMaxCapacity()) {
                throw roomTooSmall(session.getRoom());
            }
        }

        if (!classOffering.getStartDate().isAfter(LocalDate.now(clock))) {
            throw notReady("Chưa thể công bố: ngày khai giảng phải sau hôm nay");
        }
        if (!classOffering.getCancelDeadline().isAfter(Instant.now(clock))) {
            throw notReady("Chưa thể công bố: hạn hủy đăng ký đã qua");
        }

        classOffering.setMinAttendancePct(course.getMinAttendancePct());
        classOffering.setPassScore(course.getPassScore());
        classOffering.setMidtermWeight(course.getMidtermWeight());
        classOffering.setFinalWeight(course.getFinalWeight());
        transition(actor, classOffering, ClassStatus.OPEN, Map.of());
        return ClassResponse.from(classOffering);
    }

    /** {@code POST /classes/{id}/unpublish}: OPEN → DRAFT, only while nobody is enrolled (D12). */
    @Transactional
    public ClassResponse unpublish(Long id, AuthenticatedUser actor) {
        ClassOffering classOffering = locks.lockClass(id);
        requireOpen(classOffering);
        if (classOffering.getEnrolledCount() > 0) {
            throw ApiException.conflict(CLASS_HAS_ENROLLMENT, "Lớp đã có học viên đăng ký, không thể gỡ công bố");
        }
        transition(actor, classOffering, ClassStatus.DRAFT, Map.of());
        return ClassResponse.from(classOffering);
    }

    /** {@code POST /classes/{id}/start}: OPEN → IN_PROGRESS once today ≥ start date (D10); sets started_at. */
    @Transactional
    public ClassResponse start(Long id, AuthenticatedUser actor) {
        ClassOffering classOffering = locks.lockClass(id);
        requireOpen(classOffering);
        if (LocalDate.now(clock).isBefore(classOffering.getStartDate())) {
            throw ApiException.conflict(CLASS_NOT_STARTED_YET, "Chưa đến ngày khai giảng");
        }
        classOffering.setStartedAt(Instant.now(clock));
        transition(actor, classOffering, ClassStatus.IN_PROGRESS, Map.of());
        return ClassResponse.from(classOffering);
    }

    /**
     * {@code POST /classes/{id}/cancel}: DRAFT or OPEN → CANCELLED with a reason of at least 10
     * characters (D11). In the same transaction every ENROLLED enrollment becomes CANCELLED with
     * cancelled_at, and enrolled_count becomes 0.
     */
    @Transactional
    public ClassResponse cancel(Long id, CancelClassRequest request, AuthenticatedUser actor) {
        String reason = request.reason().strip();
        if (reason.length() < MIN_CANCEL_REASON_LENGTH) {
            throw ApiException.validation("reason", "Lý do hủy lớp phải có ít nhất 10 ký tự");
        }
        ClassOffering classOffering = locks.lockClass(id);
        if (!CANCELLABLE.contains(classOffering.getStatus())) {
            throw ApiException.conflict(CLASS_NOT_CANCELLABLE, "Lớp đã bắt đầu, không thể hủy");
        }

        Instant now = Instant.now(clock);
        List<Enrollment> enrolled = enrollmentRepository.findByClassOffering_IdAndStatus(id, EnrollmentStatus.ENROLLED);
        for (Enrollment enrollment : enrolled) {
            enrollment.setStatus(EnrollmentStatus.CANCELLED);
            enrollment.setCancelledAt(now);
        }
        classOffering.setEnrolledCount(0);
        classOffering.setCancelReason(reason);

        Map<String, Object> extra = new LinkedHashMap<>();
        extra.put("reason", reason);
        extra.put("cancelledEnrollments", enrolled.size());
        transition(actor, classOffering, ClassStatus.CANCELLED, extra);
        return ClassResponse.from(classOffering);
    }

    /**
     * {@code DELETE /classes/{id}}: physical delete of a DRAFT class that has never had an enrollment
     * (A-07), together with its sessions.
     */
    @Transactional
    public void deleteClass(Long id, AuthenticatedUser actor) {
        ClassOffering classOffering = locks.lockClass(id);
        if (classOffering.getStatus() != ClassStatus.DRAFT || enrollmentRepository.existsByClassOffering_Id(id)) {
            throw notDeletable();
        }
        logChange(actor, "DELETE", classOffering);
        try {
            sessionRepository.deleteByClassOffering_Id(id);
            classOfferingRepository.delete(classOffering);
            classOfferingRepository.flush();
        } catch (DataIntegrityViolationException ex) {
            // Data referring to the class appeared after the checks above.
            throw notDeletable();
        }
    }

    // --- validation -----------------------------------------------------------------------------

    /** TR05 date rules, as input validation (422). */
    private void validateDates(ClassRequest request) {
        Map<String, List<String>> problems = new LinkedHashMap<>();
        LocalDate today = LocalDate.now(clock);
        if (!request.startDate().isAfter(today)) {
            problems.put("startDate", List.of("Ngày bắt đầu phải sau ngày hôm nay"));
        }
        if (!request.endDate().isAfter(request.startDate())) {
            problems.put("endDate", List.of("Ngày kết thúc phải sau ngày bắt đầu"));
        }
        // D05, compared on the Vietnam date as the database CHECK does (A-08).
        LocalDate deadlineDate = request.cancelDeadline().atZoneSameInstant(clock.getZone()).toLocalDate();
        if (deadlineDate.isAfter(request.startDate())) {
            problems.put("cancelDeadline", List.of("Hạn hủy đăng ký không được sau ngày bắt đầu"));
        }
        if (!problems.isEmpty()) {
            ErrorCode errorCode = ErrorCode.VALIDATION_ERROR;
            throw new ApiException(errorCode.status(), errorCode.name(), errorCode.message(), problems);
        }
    }

    /** The course must exist (422, it is input) — whether it is active is a business rule (409). */
    private Course existingCourse(Long courseId) {
        return courseRepository.findById(courseId)
                .orElseThrow(() -> ApiException.validation("courseId", "Môn học không tồn tại"));
    }

    private static void requireActive(Course course) {
        if (!course.isActive()) {
            throw ApiException.conflict(COURSE_INACTIVE, "Môn học đã ngừng sử dụng");
        }
    }

    private static void requireDraft(ClassOffering classOffering, String message) {
        if (classOffering.getStatus() != ClassStatus.DRAFT) {
            throw ApiException.conflict(CLASS_NOT_EDITABLE, message);
        }
    }

    private static void requireOpen(ClassOffering classOffering) {
        if (classOffering.getStatus() != ClassStatus.OPEN) {
            throw ApiException.conflict(CLASS_NOT_EDITABLE, "Lớp không ở trạng thái đang mở đăng ký");
        }
    }

    // --- helpers --------------------------------------------------------------------------------

    private List<Session> sessionsOf(Long classId) {
        return sessionRepository.findByClassOffering_IdOrderBySessionDateAscStartTimeAsc(classId);
    }

    private void saveAndFlush(ClassOffering classOffering) {
        try {
            classOfferingRepository.saveAndFlush(classOffering);
        } catch (DataIntegrityViolationException ex) {
            // Another request took the same class code after the duplicate check.
            throw duplicateCode();
        }
    }

    private void transition(AuthenticatedUser actor, ClassOffering classOffering, ClassStatus target,
            Map<String, Object> extra) {
        ClassStatus from = classOffering.getStatus();
        classOffering.setStatus(target);
        Map<String, Object> details = baseDetails("STATUS", classOffering);
        details.put("fromStatus", from.name());
        details.put("toStatus", target.name());
        details.putAll(extra);
        auditLogger.record(SecurityAction.CLASS_STATUS_CHANGE, actor.username(), details);
    }

    private void logChange(AuthenticatedUser actor, String operation, ClassOffering classOffering) {
        auditLogger.record(SecurityAction.CLASS_CHANGE, actor.username(), baseDetails(operation, classOffering));
    }

    private static Map<String, Object> baseDetails(String operation, ClassOffering classOffering) {
        Map<String, Object> details = new LinkedHashMap<>();
        details.put("operation", operation);
        details.put("classId", classOffering.getId());
        details.put("classCode", classOffering.getClassCode());
        return details;
    }

    private static ApiException roomTooSmall(Room room) {
        return ApiException.conflict(ROOM_TOO_SMALL, "Phòng " + room.getCode() + " chỉ chứa " + room.getCapacity() + " người");
    }

    private static ApiException notReady(String message) {
        return ApiException.conflict(CLASS_NOT_READY, message);
    }

    private static ApiException duplicateCode() {
        return ApiException.conflict(CLASS_CODE_DUPLICATE, "Mã lớp đã tồn tại");
    }

    private static ApiException notDeletable() {
        return ApiException.conflict(CLASS_NOT_DELETABLE, "Lớp đã có dữ liệu, hãy dùng Hủy lớp");
    }
}
