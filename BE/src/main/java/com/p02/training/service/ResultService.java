package com.p02.training.service;

import com.p02.training.audit.SecurityAuditLogger;
import com.p02.training.dto.request.ResultItemRequest;
import com.p02.training.dto.request.UpdateResultsRequest;
import com.p02.training.dto.response.ClassResultsResponse;
import com.p02.training.dto.response.MyResultResponse;
import com.p02.training.dto.response.PageResponse;
import com.p02.training.entity.AssessmentResult;
import com.p02.training.entity.ClassOffering;
import com.p02.training.entity.Enrollment;
import com.p02.training.entity.GradeAuditLog;
import com.p02.training.entity.Student;
import com.p02.training.entity.User;
import com.p02.training.entity.enums.ClassStatus;
import com.p02.training.entity.enums.EnrollmentStatus;
import com.p02.training.entity.enums.FinalStatus;
import com.p02.training.entity.enums.GradingStatus;
import com.p02.training.entity.enums.ScoreType;
import com.p02.training.entity.enums.SecurityAction;
import com.p02.training.exception.ApiException;
import com.p02.training.exception.ErrorCode;
import com.p02.training.repository.AssessmentResultRepository;
import com.p02.training.repository.ClassOfferingRepository;
import com.p02.training.repository.EnrollmentRepository;
import com.p02.training.repository.GradeAuditLogRepository;
import com.p02.training.repository.StudentRepository;
import com.p02.training.repository.UserRepository;
import com.p02.training.security.AuthenticatedUser;
import com.p02.training.security.ClientIp;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
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
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * TR15 score entry and submission. Admins and the assigned instructor read a class's results; only
 * the assigned instructor saves and submits (SEC-TC-202: anyone else gets 403 + ACCESS_DENIED). A
 * student reads only their own results, and only once CONFIRMED (D20).
 *
 * <p>Writes lock the ClassOffering row, compare the client's version with grading_version, and
 * write one GradeAuditLog row per changed score in the same transaction (D18). Scores may be
 * cleared while DRAFT (A-27); totals use {@link GradeCalculator} (A-28).
 */
@Service
public class ResultService {

    /** Students listed on a result sheet: those in the class now, and after completion. */
    private static final Set<EnrollmentStatus> LISTED = EnumSet.of(EnrollmentStatus.ENROLLED, EnrollmentStatus.COMPLETED);

    private final ClassOfferingRepository classOfferingRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AssessmentResultRepository resultRepository;
    private final GradeAuditLogRepository gradeAuditLogRepository;
    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final ClassLockService locks;
    private final ClassAccessGuard accessGuard;
    private final SecurityAuditLogger auditLogger;
    private final Clock clock;

    public ResultService(ClassOfferingRepository classOfferingRepository, EnrollmentRepository enrollmentRepository,
            AssessmentResultRepository resultRepository, GradeAuditLogRepository gradeAuditLogRepository,
            StudentRepository studentRepository, UserRepository userRepository, ClassLockService locks,
            ClassAccessGuard accessGuard, SecurityAuditLogger auditLogger, Clock clock) {
        this.classOfferingRepository = classOfferingRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.resultRepository = resultRepository;
        this.gradeAuditLogRepository = gradeAuditLogRepository;
        this.studentRepository = studentRepository;
        this.userRepository = userRepository;
        this.locks = locks;
        this.accessGuard = accessGuard;
        this.auditLogger = auditLogger;
        this.clock = clock;
    }

    /** {@code GET /classes/{id}/results}: Admin or the assigned instructor. */
    @Transactional(readOnly = true)
    public ClassResultsResponse getResults(Long classId, AuthenticatedUser viewer) {
        ClassOffering classOffering = classOfferingRepository.findWithDetailsByIdAndDeletedAtIsNull(classId)
                .orElseThrow(ResultService::notFound);
        accessGuard.requireAdminOrAssigned(classOffering, viewer, "results");
        return sheet(classOffering);
    }

    /**
     * {@code PUT /classes/{id}/results}: the assigned instructor. Locks the ClassOffering, then
     * checks: class IN_PROGRESS; grading DRAFT; version equals grading_version; every student has an
     * ENROLLED enrollment. For every score that changes: a reason is required when the old value is
     * not null (D18, A-27), and a GradeAuditLog row records old, new, type, user, reason and IP. The
     * total is recalculated (null unless both scores exist, A-27), final_status stays IN_PROGRESS,
     * and grading_version goes up by 1.
     */
    @Transactional
    public ClassResultsResponse updateResults(Long classId, UpdateResultsRequest request, AuthenticatedUser viewer) {
        requireNoDuplicateStudents(request.items());
        ClassOffering classOffering = locks.lockClass(classId);
        accessGuard.requireAssigned(classOffering, viewer, "results");
        requireEditable(classOffering);
        if (request.version() != classOffering.getGradingVersion()) {
            throw new ApiException(ErrorCode.VERSION_CONFLICT);
        }

        Map<Long, Enrollment> enrolled = enrollmentRepository
                .findByClassOffering_IdAndStatus(classId, EnrollmentStatus.ENROLLED).stream()
                .collect(Collectors.toMap(enrollment -> enrollment.getStudent().getId(), Function.identity()));
        for (ResultItemRequest item : request.items()) {
            if (!enrolled.containsKey(item.studentId())) {
                throw ApiException.conflict("STUDENT_NOT_IN_CLASS",
                        "Học viên " + studentLabel(item.studentId()) + " không thuộc lớp này");
            }
        }

        List<Long> studentIds = request.items().stream().map(ResultItemRequest::studentId).toList();
        Map<Long, AssessmentResult> results = studentIds.isEmpty() ? Map.of()
                : resultRepository.findByClassOffering_IdAndStudent_IdIn(classId, studentIds).stream()
                        .collect(Collectors.toMap(result -> result.getStudent().getId(), Function.identity()));
        User changer = userRepository.getReferenceById(viewer.id());
        String ip = ClientIp.current();

        for (ResultItemRequest item : request.items()) {
            Enrollment enrollment = enrolled.get(item.studentId());
            AssessmentResult result = results.get(item.studentId());
            BigDecimal oldMidterm = result == null ? null : result.getMidtermScore();
            BigDecimal oldFinal = result == null ? null : result.getFinalScore();
            boolean midtermChanged = !GradeCalculator.sameScore(oldMidterm, item.midtermScore());
            boolean finalChanged = !GradeCalculator.sameScore(oldFinal, item.finalScore());
            if (!midtermChanged && !finalChanged) {
                continue;
            }
            String reason = item.reason() == null || item.reason().isBlank() ? null : item.reason().strip();
            if (reason == null && ((midtermChanged && oldMidterm != null) || (finalChanged && oldFinal != null))) {
                throw new ApiException(ErrorCode.VALIDATION_ERROR.status(), "REASON_REQUIRED",
                        "Vui lòng nhập lý do sửa điểm cho học viên " + enrollment.getStudent().getStudentCode(),
                        Map.of("reason", List.of("Bắt buộc khi sửa hoặc xóa điểm đã có")));
            }

            if (result == null) {
                result = resultRepository.save(new AssessmentResult(enrollment));
            }
            if (midtermChanged) {
                gradeAuditLogRepository.save(new GradeAuditLog(enrollment, ScoreType.MIDTERM, oldMidterm,
                        item.midtermScore(), changer, reason, ip));
                result.setMidtermScore(item.midtermScore());
            }
            if (finalChanged) {
                gradeAuditLogRepository.save(new GradeAuditLog(enrollment, ScoreType.FINAL, oldFinal,
                        item.finalScore(), changer, reason, ip));
                result.setFinalScore(item.finalScore());
            }
            result.setTotalScore(GradeCalculator.totalScore(result.getMidtermScore(), result.getFinalScore(),
                    classOffering.getMidtermWeight(), classOffering.getFinalWeight()));
            result.setFinalStatus(FinalStatus.IN_PROGRESS);
        }
        classOffering.setGradingVersion(classOffering.getGradingVersion() + 1);
        return sheet(classOffering);
    }

    /**
     * {@code POST /classes/{id}/results/submit}: the assigned instructor. Locks the ClassOffering;
     * requires the class IN_PROGRESS, grading DRAFT and every ENROLLED student with both scores. Then
     * DRAFT → SUBMITTED with submitted_at and submitted_by, logged as GRADING_STATUS_CHANGE.
     */
    @Transactional
    public ClassResultsResponse submit(Long classId, AuthenticatedUser viewer) {
        ClassOffering classOffering = locks.lockClass(classId);
        accessGuard.requireAssigned(classOffering, viewer, "results");
        requireEditable(classOffering);
        long incomplete = enrollmentRepository.countWithoutBothScores(classId, EnrollmentStatus.ENROLLED);
        if (incomplete > 0) {
            throw ApiException.conflict("GRADES_INCOMPLETE", "Còn " + incomplete + " học viên chưa đủ điểm");
        }
        classOffering.setGradingStatus(GradingStatus.SUBMITTED);
        classOffering.setSubmittedAt(Instant.now(clock));
        classOffering.setSubmittedBy(userRepository.getReferenceById(viewer.id()));
        logGradingChange(viewer, classOffering, GradingStatus.DRAFT, GradingStatus.SUBMITTED);
        return sheet(classOffering);
    }

    /**
     * {@code GET /students/me/results}: the logged-in student's results in classes whose results are
     * CONFIRMED (D20), newest class first. Classes and courses are loaded in the same query.
     */
    @Transactional(readOnly = true)
    public PageResponse<MyResultResponse> myResults(AuthenticatedUser viewer, int page, int size) {
        Long studentId = studentRepository.findIdByUserId(viewer.id()).orElseThrow(ResultService::notFound);
        PageRequest pageable = PageRequest.of(page, size,
                Sort.by(Sort.Direction.DESC, "classOffering.startDate").and(Sort.by(Sort.Direction.DESC, "id")));
        return PageResponse.of(resultRepository.findByStudent_IdAndClassOffering_GradingStatusAndClassOffering_DeletedAtIsNull(
                studentId, GradingStatus.CONFIRMED, pageable), MyResultResponse::from);
    }

    /** Logs a grading status change; shared with TR16. */
    void logGradingChange(AuthenticatedUser actor, ClassOffering classOffering, GradingStatus from, GradingStatus to) {
        logGradingChange(actor, classOffering, from, to, Map.of());
    }

    void logGradingChange(AuthenticatedUser actor, ClassOffering classOffering, GradingStatus from, GradingStatus to,
            Map<String, Object> extra) {
        Map<String, Object> details = new LinkedHashMap<>();
        details.put("classId", classOffering.getId());
        details.put("classCode", classOffering.getClassCode());
        details.put("fromStatus", from.name());
        details.put("toStatus", to.name());
        details.putAll(extra);
        auditLogger.record(SecurityAction.GRADING_STATUS_CHANGE, actor.username(), details);
    }

    /** Edits and submission need the class IN_PROGRESS and its results DRAFT (TR15). */
    private static void requireEditable(ClassOffering classOffering) {
        if (classOffering.getStatus() != ClassStatus.IN_PROGRESS) {
            throw ApiException.conflict("CLASS_NOT_IN_PROGRESS", "Lớp không ở trạng thái đang học");
        }
        if (classOffering.getGradingStatus() != GradingStatus.DRAFT) {
            throw ApiException.conflict("GRADING_NOT_EDITABLE", "Kết quả không còn ở trạng thái cho phép chỉnh sửa");
        }
    }

    private static void requireNoDuplicateStudents(List<ResultItemRequest> items) {
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

    private String studentLabel(Long studentId) {
        return studentRepository.findById(studentId).map(Student::getStudentCode).orElse(String.valueOf(studentId));
    }

    /**
     * The result sheet: every ENROLLED or COMPLETED student, with their result if any, ordered by
     * student code. Two queries: the roster with students and users, and the class's results.
     */
    private ClassResultsResponse sheet(ClassOffering classOffering) {
        Map<Long, AssessmentResult> results = resultRepository.findAllByClassOffering_Id(classOffering.getId()).stream()
                .collect(Collectors.toMap(result -> result.getStudent().getId(), Function.identity()));
        List<ClassResultsResponse.Item> items = new ArrayList<>();
        for (Enrollment enrollment : enrollmentRepository
                .findByClassOffering_IdAndStatusIn(classOffering.getId(), LISTED, Pageable.unpaged()).getContent()) {
            Student student = enrollment.getStudent();
            AssessmentResult result = results.get(student.getId());
            items.add(new ClassResultsResponse.Item(student.getId(), student.getStudentCode(),
                    student.getUser().getFullName(), enrollment.getStatus(),
                    result == null ? null : result.getMidtermScore(),
                    result == null ? null : result.getFinalScore(),
                    result == null ? null : result.getTotalScore(),
                    result == null ? null : result.getAttendanceRate(),
                    result == null ? null : result.getFinalStatus()));
        }
        items.sort(Comparator.comparing(ClassResultsResponse.Item::studentCode));
        return new ClassResultsResponse(classOffering.getId(), classOffering.getClassCode(),
                classOffering.getGradingStatus(), classOffering.getGradingVersion(), classOffering.getMidtermWeight(),
                classOffering.getFinalWeight(), classOffering.getSubmittedAt(), classOffering.getConfirmedAt(),
                classOffering.getReturnReason(), items);
    }

    private static ApiException notFound() {
        return new ApiException(ErrorCode.NOT_FOUND);
    }
}
