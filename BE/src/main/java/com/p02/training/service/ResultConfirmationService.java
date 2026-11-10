package com.p02.training.service;

import com.p02.training.audit.SecurityAuditLogger;
import com.p02.training.dto.request.ReasonRequest;
import com.p02.training.dto.response.ClassResponse;
import com.p02.training.entity.AssessmentResult;
import com.p02.training.entity.ClassOffering;
import com.p02.training.entity.Enrollment;
import com.p02.training.entity.Session;
import com.p02.training.entity.enums.AttendanceStatus;
import com.p02.training.entity.enums.ClassStatus;
import com.p02.training.entity.enums.EnrollmentStatus;
import com.p02.training.entity.enums.FinalStatus;
import com.p02.training.entity.enums.GradingStatus;
import com.p02.training.entity.enums.SecurityAction;
import com.p02.training.exception.ApiException;
import com.p02.training.exception.ErrorCode;
import com.p02.training.repository.AssessmentResultRepository;
import com.p02.training.repository.AttendanceRepository;
import com.p02.training.repository.EnrollmentRepository;
import com.p02.training.repository.SessionRepository;
import com.p02.training.repository.UserRepository;
import com.p02.training.repository.projection.StudentAttendanceCount;
import com.p02.training.security.AuthenticatedUser;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * TR16 result return, confirmation and class completion, for Training Admins (SecurityConfig:
 * Instructors and Students get 403). Every operation locks the ClassOffering row first;
 * confirmation then locks every session of the class in ascending id order (A-25), the same order
 * as unlocking, so the two cannot race. Each operation is one transaction.
 */
@Service
public class ResultConfirmationService {

    static final int MIN_RETURN_REASON_LENGTH = 10;

    private final SessionRepository sessionRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AssessmentResultRepository resultRepository;
    private final AttendanceRepository attendanceRepository;
    private final UserRepository userRepository;
    private final ClassLockService locks;
    private final ResultService resultService;
    private final SecurityAuditLogger auditLogger;
    private final Clock clock;

    public ResultConfirmationService(SessionRepository sessionRepository, EnrollmentRepository enrollmentRepository,
            AssessmentResultRepository resultRepository, AttendanceRepository attendanceRepository,
            UserRepository userRepository, ClassLockService locks, ResultService resultService,
            SecurityAuditLogger auditLogger, Clock clock) {
        this.sessionRepository = sessionRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.resultRepository = resultRepository;
        this.attendanceRepository = attendanceRepository;
        this.userRepository = userRepository;
        this.locks = locks;
        this.resultService = resultService;
        this.auditLogger = auditLogger;
        this.clock = clock;
    }

    /**
     * {@code POST /classes/{id}/results/return}: SUBMITTED → DRAFT with a reason of at least 10
     * characters, stored in return_reason. submitted_at and submitted_by are kept (A-24).
     */
    @Transactional
    public ClassResponse returnResults(Long classId, ReasonRequest request, AuthenticatedUser actor) {
        String reason = request.reason().strip();
        if (reason.length() < MIN_RETURN_REASON_LENGTH) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR.status(), "REASON_REQUIRED",
                    "Vui lòng nhập lý do trả kết quả", Map.of("reason", List.of("Lý do phải có ít nhất 10 ký tự")));
        }
        ClassOffering classOffering = locks.lockClass(classId);
        requireSubmitted(classOffering);
        classOffering.setGradingStatus(GradingStatus.DRAFT);
        classOffering.setReturnReason(reason);
        resultService.logGradingChange(actor, classOffering, GradingStatus.SUBMITTED, GradingStatus.DRAFT,
                Map.of("reason", reason));
        return ClassResponse.from(classOffering);
    }

    /**
     * {@code POST /classes/{id}/results/confirm}. Locks ClassOffering, then all its sessions in id
     * order (A-25), and checks: grading SUBMITTED; at least one session; every session locked. For
     * each ENROLLED student: attendance_rate = (PRESENT + LATE) / sessions × 100 and total_score =
     * midterm × w1 + final × w2, both rounded HALF_UP to 2 places (D14, D15, A-28), with the weights
     * copied to the class at publication; PASSED if rate ≥ min_attendance_pct and total ≥ pass_score,
     * comparing the rounded values without rounding again, otherwise FAILED. Then CONFIRMED with
     * confirmed_at and confirmed_by.
     */
    @Transactional
    public ClassResponse confirm(Long classId, AuthenticatedUser actor) {
        ClassOffering classOffering = locks.lockClass(classId);
        List<Session> sessions = sessionRepository.lockAllByClassId(classId);

        requireSubmitted(classOffering);
        if (sessions.isEmpty()) {
            throw ApiException.conflict("NO_SESSIONS", "Không thể tính chuyên cần vì lớp chưa có buổi học");
        }
        long unlocked = sessions.stream().filter(session -> !session.isAttendanceLocked()).count();
        if (unlocked > 0) {
            throw ApiException.conflict("SESSIONS_NOT_LOCKED", "Còn " + unlocked + " buổi học chưa chốt điểm danh");
        }

        Map<Long, Long> attended = attendanceRepository
                .countAttendedByStudent(classId, EnumSet.of(AttendanceStatus.PRESENT, AttendanceStatus.LATE)).stream()
                .collect(Collectors.toMap(StudentAttendanceCount::getStudentId, StudentAttendanceCount::getAttended));
        Map<Long, AssessmentResult> results = resultRepository.findAllByClassOffering_Id(classId).stream()
                .collect(Collectors.toMap(result -> result.getStudent().getId(), Function.identity()));

        int passed = 0;
        int failed = 0;
        for (Enrollment enrollment : enrollmentRepository.findByClassOffering_IdAndStatus(classId,
                EnrollmentStatus.ENROLLED)) {
            Long studentId = enrollment.getStudent().getId();
            AssessmentResult result = results.get(studentId);
            if (result == null || result.getMidtermScore() == null || result.getFinalScore() == null) {
                // Submission guaranteed both scores; this only protects against inconsistent data.
                throw ApiException.conflict("GRADES_INCOMPLETE", "Còn học viên chưa đủ điểm");
            }
            BigDecimal rate = GradeCalculator.attendanceRate(attended.getOrDefault(studentId, 0L), sessions.size());
            BigDecimal total = GradeCalculator.totalScore(result.getMidtermScore(), result.getFinalScore(),
                    classOffering.getMidtermWeight(), classOffering.getFinalWeight());
            boolean pass = rate.compareTo(classOffering.getMinAttendancePct()) >= 0
                    && total.compareTo(classOffering.getPassScore()) >= 0;
            result.setAttendanceRate(rate);
            result.setTotalScore(total);
            result.setFinalStatus(pass ? FinalStatus.PASSED : FinalStatus.FAILED);
            if (pass) {
                passed++;
            } else {
                failed++;
            }
        }

        classOffering.setGradingStatus(GradingStatus.CONFIRMED);
        classOffering.setConfirmedAt(Instant.now(clock));
        classOffering.setConfirmedBy(userRepository.getReferenceById(actor.id()));
        Map<String, Object> extra = new LinkedHashMap<>();
        extra.put("passed", passed);
        extra.put("failed", failed);
        resultService.logGradingChange(actor, classOffering, GradingStatus.SUBMITTED, GradingStatus.CONFIRMED, extra);
        return ClassResponse.from(classOffering);
    }

    /**
     * {@code POST /classes/{id}/complete}: class IN_PROGRESS and grading CONFIRMED → CLOSED with
     * closed_at and closed_by. Every ENROLLED enrollment becomes COMPLETED with completed_at;
     * enrolled_count is unchanged (TR11). FAILED students do not prevent completion.
     */
    @Transactional
    public ClassResponse complete(Long classId, AuthenticatedUser actor) {
        ClassOffering classOffering = locks.lockClass(classId);
        if (classOffering.getStatus() != ClassStatus.IN_PROGRESS) {
            throw ApiException.conflict("CLASS_NOT_IN_PROGRESS", "Lớp không ở trạng thái đang học");
        }
        if (classOffering.getGradingStatus() != GradingStatus.CONFIRMED) {
            throw ApiException.conflict("GRADING_NOT_CONFIRMED", "Kết quả lớp chưa được xác nhận");
        }

        Instant now = Instant.now(clock);
        List<Enrollment> enrolled = enrollmentRepository.findByClassOffering_IdAndStatus(classId,
                EnrollmentStatus.ENROLLED);
        for (Enrollment enrollment : enrolled) {
            enrollment.setStatus(EnrollmentStatus.COMPLETED);
            enrollment.setCompletedAt(now);
        }
        classOffering.setStatus(ClassStatus.CLOSED);
        classOffering.setClosedAt(now);
        classOffering.setClosedBy(userRepository.getReferenceById(actor.id()));

        Map<String, Object> details = new LinkedHashMap<>();
        details.put("operation", "STATUS");
        details.put("classId", classOffering.getId());
        details.put("classCode", classOffering.getClassCode());
        details.put("fromStatus", ClassStatus.IN_PROGRESS.name());
        details.put("toStatus", ClassStatus.CLOSED.name());
        details.put("completedEnrollments", enrolled.size());
        auditLogger.record(SecurityAction.CLASS_STATUS_CHANGE, actor.username(), details);
        return ClassResponse.from(classOffering);
    }

    private static void requireSubmitted(ClassOffering classOffering) {
        if (classOffering.getGradingStatus() != GradingStatus.SUBMITTED) {
            throw ApiException.conflict("GRADING_NOT_SUBMITTED", "Kết quả chưa được nộp hoặc đã thay đổi trạng thái");
        }
    }
}
