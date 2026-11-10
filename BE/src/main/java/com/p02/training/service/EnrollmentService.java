package com.p02.training.service;

import com.p02.training.audit.SecurityAuditLogger;
import com.p02.training.dto.request.EnrollRequest;
import com.p02.training.dto.response.EnrollmentResponse;
import com.p02.training.dto.response.PageResponse;
import com.p02.training.entity.ClassOffering;
import com.p02.training.entity.Enrollment;
import com.p02.training.entity.Student;
import com.p02.training.entity.enums.ClassStatus;
import com.p02.training.entity.enums.EnrollmentStatus;
import com.p02.training.entity.enums.SecurityAction;
import com.p02.training.entity.enums.StudentStatus;
import com.p02.training.exception.ApiException;
import com.p02.training.exception.ErrorCode;
import com.p02.training.repository.ClassOfferingRepository;
import com.p02.training.repository.EnrollmentRepository;
import com.p02.training.repository.StudentRepository;
import com.p02.training.repository.projection.EnrollmentKeys;
import com.p02.training.security.AuthenticatedUser;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * TR10 registration, TR12 cancellation and the student's own enrollment list, for Students only
 * (SecurityConfig). The student always comes from the session, never from the request.
 *
 * <p>Locks follow spec 0.5: Student → ClassOffering (TR10) and Student → ClassOffering → Enrollment
 * (TR12). Rows are never loaded before they are locked, so every check reads current data;
 * enrolled_count is compared and changed only under the ClassOffering lock (TR11).
 */
@Service
public class EnrollmentService {

    private static final DateTimeFormatter DEADLINE = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final StudentRepository studentRepository;
    private final ClassOfferingRepository classOfferingRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final ScheduleConflictService conflicts;
    private final ClassCapacityService capacity;
    private final SecurityAuditLogger auditLogger;
    private final Clock clock;

    public EnrollmentService(StudentRepository studentRepository, ClassOfferingRepository classOfferingRepository,
            EnrollmentRepository enrollmentRepository, ScheduleConflictService conflicts,
            ClassCapacityService capacity, SecurityAuditLogger auditLogger, Clock clock) {
        this.studentRepository = studentRepository;
        this.classOfferingRepository = classOfferingRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.conflicts = conflicts;
        this.capacity = capacity;
        this.auditLogger = auditLogger;
        this.clock = clock;
    }

    /**
     * {@code POST /enrollments} (TR10). Locks Student → ClassOffering, then checks in this order:
     * the student is ACTIVE; the class exists, is not soft-deleted and is visible to students (a
     * DRAFT class is 404, spec 0.4); it is OPEN and today is before its start date; no ENROLLED or
     * COMPLETED enrollment exists (a CANCELLED one is reused, D06); no schedule conflict with the
     * student's other classes (TR08); a seat is free (TR11). Then enrolls, adds 1 to
     * enrolled_count and logs ENROLL, all in one transaction.
     */
    @Transactional
    public EnrollmentResponse enroll(EnrollRequest request, AuthenticatedUser viewer) {
        Long studentId = ownStudentId(viewer);
        Student student = studentRepository.findLockedById(studentId).orElseThrow(EnrollmentService::notFound);
        Optional<ClassOffering> lockedClass = classOfferingRepository.findLockedById(request.classId());

        if (student.getStatus() != StudentStatus.ACTIVE) {
            throw ApiException.conflict("STUDENT_INACTIVE", "Tài khoản học viên đang bị tạm ngưng, không thể đăng ký");
        }
        ClassOffering classOffering = lockedClass
                .filter(found -> found.getDeletedAt() == null && found.getStatus() != ClassStatus.DRAFT)
                .orElseThrow(EnrollmentService::classNotFound);
        if (classOffering.getStatus() != ClassStatus.OPEN
                || !LocalDate.now(clock).isBefore(classOffering.getStartDate())) {
            throw ApiException.conflict("CLASS_NOT_OPEN", "Lớp học hiện không nhận đăng ký");
        }

        Optional<Enrollment> previous = enrollmentRepository.findByStudent_IdAndClassOffering_Id(studentId,
                classOffering.getId());
        if (previous.isPresent() && previous.get().getStatus() != EnrollmentStatus.CANCELLED) {
            throw duplicate();
        }
        conflicts.requireNoStudentConflict(conflicts.checkStudentConflict(studentId, classOffering.getId()));
        capacity.takeSeat(classOffering);

        Instant now = Instant.now(clock);
        Enrollment enrollment;
        if (previous.isPresent()) {
            // D06: re-enrolling reuses the cancelled row.
            enrollment = previous.get();
            enrollment.setStatus(EnrollmentStatus.ENROLLED);
            enrollment.setEnrolledAt(now);
            enrollment.setCancelledAt(null);
        } else {
            enrollment = new Enrollment(student, classOffering, now);
        }
        try {
            enrollmentRepository.saveAndFlush(enrollment);
        } catch (DataIntegrityViolationException ex) {
            // Fallback for uq_enrollment_student_class; the Student lock normally prevents it.
            throw duplicate();
        }

        Map<String, Object> details = details(enrollment, classOffering, studentId);
        details.put("reusedEnrollment", previous.isPresent());
        auditLogger.record(SecurityAction.ENROLL, viewer.username(), details);
        return EnrollmentResponse.from(enrollment);
    }

    /**
     * {@code POST /enrollments/{id}/cancel} (TR12). 404 if the enrollment does not exist; 403 and
     * ACCESS_DENIED if it belongs to another student. Then locks Student → ClassOffering →
     * Enrollment, re-reads, and checks: the enrollment is ENROLLED; the class is OPEN; now is not
     * after the cancellation deadline. Cancels, takes 1 from enrolled_count and logs CANCEL_ENROLL,
     * all in one transaction.
     */
    @Transactional
    public EnrollmentResponse cancel(Long enrollmentId, AuthenticatedUser viewer) {
        EnrollmentKeys keys = enrollmentRepository.findKeysById(enrollmentId).orElseThrow(EnrollmentService::notFound);
        Long studentId = studentRepository.findIdByUserId(viewer.id()).orElse(null);
        if (!keys.getStudentId().equals(studentId)) {
            Map<String, Object> details = new LinkedHashMap<>();
            details.put("resource", "enrollment");
            details.put("enrollmentId", enrollmentId);
            details.put("operation", "CANCEL");
            // Its own transaction, so the rollback of this one does not lose it (spec 0.5).
            auditLogger.recordIndependently(SecurityAction.ACCESS_DENIED, viewer.username(), details);
            throw new ApiException(ErrorCode.FORBIDDEN);
        }

        studentRepository.findLockedById(studentId).orElseThrow(EnrollmentService::notFound);
        ClassOffering classOffering = classOfferingRepository.findLockedById(keys.getClassId())
                .filter(found -> found.getDeletedAt() == null)
                .orElseThrow(EnrollmentService::notFound);
        Enrollment enrollment = enrollmentRepository.findLockedById(enrollmentId)
                .orElseThrow(EnrollmentService::notFound);

        switch (enrollment.getStatus()) {
            case CANCELLED -> throw ApiException.conflict("ENROLL_ALREADY_CANCELLED", "Đăng ký này đã được hủy trước đó");
            case COMPLETED -> throw ApiException.conflict("ENROLL_COMPLETED", "Không thể hủy lớp đã hoàn thành");
            case ENROLLED -> { }
        }
        if (classOffering.getStatus() != ClassStatus.OPEN) {
            throw ApiException.conflict("CLASS_ALREADY_STARTED", "Lớp đã bắt đầu, không thể hủy đăng ký");
        }
        Instant now = Instant.now(clock);
        if (now.isAfter(classOffering.getCancelDeadline())) {
            String deadline = classOffering.getCancelDeadline().atZone(clock.getZone()).format(DEADLINE);
            throw ApiException.conflict("CANCEL_DEADLINE_PASSED", "Đã quá hạn hủy đăng ký (" + deadline + ")");
        }

        enrollment.setStatus(EnrollmentStatus.CANCELLED);
        enrollment.setCancelledAt(now);
        capacity.releaseSeat(classOffering);
        auditLogger.record(SecurityAction.CANCEL_ENROLL, viewer.username(),
                details(enrollment, classOffering, studentId));
        return EnrollmentResponse.from(enrollment);
    }

    /**
     * {@code GET /students/me/enrollments?status=} ("Lớp của tôi"): the logged-in student's
     * enrollments, newest registration first. Classes and courses are loaded in the same query.
     */
    @Transactional(readOnly = true)
    public PageResponse<EnrollmentResponse> myEnrollments(AuthenticatedUser viewer, EnrollmentStatus status,
            int page, int size) {
        Long studentId = ownStudentId(viewer);
        PageRequest pageable = PageRequest.of(page, size,
                Sort.by(Sort.Direction.DESC, "enrolledAt").and(Sort.by(Sort.Direction.DESC, "id")));
        Page<Enrollment> enrollments = status == null
                ? enrollmentRepository.findByStudent_Id(studentId, pageable)
                : enrollmentRepository.findByStudent_IdAndStatus(studentId, status, pageable);
        return PageResponse.of(enrollments, EnrollmentResponse::from);
    }

    /** The logged-in student's profile id. 404 if the account has no profile, which TR01 prevents. */
    private Long ownStudentId(AuthenticatedUser viewer) {
        return studentRepository.findIdByUserId(viewer.id()).orElseThrow(EnrollmentService::notFound);
    }

    private static Map<String, Object> details(Enrollment enrollment, ClassOffering classOffering, Long studentId) {
        Map<String, Object> details = new LinkedHashMap<>();
        details.put("enrollmentId", enrollment.getId());
        details.put("studentId", studentId);
        details.put("classId", classOffering.getId());
        details.put("classCode", classOffering.getClassCode());
        details.put("enrolledCount", classOffering.getEnrolledCount());
        return details;
    }

    private static ApiException duplicate() {
        return ApiException.conflict("ENROLL_DUPLICATE", "Bạn đã đăng ký lớp này");
    }

    private static ApiException notFound() {
        return new ApiException(ErrorCode.NOT_FOUND);
    }

    private static ApiException classNotFound() {
        return new ApiException(ErrorCode.NOT_FOUND.status(), ErrorCode.NOT_FOUND.name(), "Không tìm thấy lớp học",
                Map.of());
    }
}
