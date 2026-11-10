package com.p02.training.service;

import com.p02.training.audit.SecurityAuditLogger;
import com.p02.training.dto.response.ClassStudentResponse;
import com.p02.training.dto.response.PageResponse;
import com.p02.training.entity.ClassOffering;
import com.p02.training.entity.enums.EnrollmentStatus;
import com.p02.training.entity.enums.SecurityAction;
import com.p02.training.entity.enums.UserRole;
import com.p02.training.exception.ApiException;
import com.p02.training.exception.ErrorCode;
import com.p02.training.repository.ClassOfferingRepository;
import com.p02.training.repository.EnrollmentRepository;
import com.p02.training.security.AuthenticatedUser;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * TR13 class roster: {@code GET /classes/{id}/students}. Training Admins and Instructors only
 * (SecurityConfig: Students and Managers get 403 with ACCESS_DENIED). An instructor must be the
 * class's assigned instructor, otherwise 403 with ACCESS_DENIED (SEC-TC-201).
 */
@Service
public class ClassRosterService {

    /** What instructors always see, and what Admins see by default. */
    private static final Set<EnrollmentStatus> DEFAULT_STATUSES =
            EnumSet.of(EnrollmentStatus.ENROLLED, EnrollmentStatus.COMPLETED);
    private static final String ALL = "ALL";
    private static final String SORT_FIELD = "studentCode";
    private static final String INVALID_PARAMETERS_MESSAGE = "Bộ lọc hoặc tham số sắp xếp không hợp lệ";

    private final ClassOfferingRepository classOfferingRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final SecurityAuditLogger auditLogger;

    public ClassRosterService(ClassOfferingRepository classOfferingRepository,
            EnrollmentRepository enrollmentRepository, SecurityAuditLogger auditLogger) {
        this.classOfferingRepository = classOfferingRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.auditLogger = auditLogger;
    }

    /**
     * Returns enrollmentId, studentId, studentCode, fullName, enrollmentStatus and enrolledAt, paged
     * after filtering. Instructors always get ENROLLED and COMPLETED and the status parameter is
     * ignored. Admins get the same by default, everything with {@code status=ALL}, or one status
     * (ENROLLED, CANCELLED, COMPLETED). sort accepts only studentCode, optionally ",asc" or ",desc".
     */
    @Transactional(readOnly = true)
    public PageResponse<ClassStudentResponse> listStudents(Long classId, String status, int page, int size,
            String sort, AuthenticatedUser viewer) {
        Sort order = parseSort(sort);
        ClassOffering classOffering = classOfferingRepository.findWithDetailsByIdAndDeletedAtIsNull(classId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
        boolean admin = viewer != null && viewer.role() == UserRole.TRAINING_ADMIN;
        if (!admin && !isAssignedInstructor(classOffering, viewer)) {
            Map<String, Object> details = new LinkedHashMap<>();
            details.put("resource", "classStudents");
            details.put("classId", classId);
            auditLogger.recordIndependently(SecurityAction.ACCESS_DENIED, viewer == null ? null : viewer.username(),
                    details);
            throw new ApiException(ErrorCode.FORBIDDEN);
        }

        Set<EnrollmentStatus> statuses = admin ? adminStatuses(status) : DEFAULT_STATUSES;
        PageRequest pageable = PageRequest.of(page, size, order.and(Sort.by("id")));
        return PageResponse.of(enrollmentRepository.findByClassOffering_IdAndStatusIn(classId, statuses, pageable),
                ClassStudentResponse::from);
    }

    private static boolean isAssignedInstructor(ClassOffering classOffering, AuthenticatedUser viewer) {
        return viewer != null && viewer.role() == UserRole.INSTRUCTOR
                && classOffering.getInstructor() != null
                && classOffering.getInstructor().getUser().getId().equals(viewer.id());
    }

    private static Set<EnrollmentStatus> adminStatuses(String status) {
        if (status == null || status.isBlank()) {
            return DEFAULT_STATUSES;
        }
        String value = status.trim().toUpperCase(Locale.ROOT);
        if (ALL.equals(value)) {
            return EnumSet.allOf(EnrollmentStatus.class);
        }
        try {
            return EnumSet.of(EnrollmentStatus.valueOf(value));
        } catch (IllegalArgumentException ex) {
            throw invalidParameters("status", "Chỉ nhận ENROLLED, CANCELLED, COMPLETED hoặc ALL");
        }
    }

    private static Sort parseSort(String sort) {
        Sort.Order order = Sort.Order.asc("student.studentCode");
        if (sort == null || sort.isBlank()) {
            return Sort.by(order);
        }
        String[] parts = sort.split(",", -1);
        if (!SORT_FIELD.equals(parts[0].trim()) || parts.length > 2) {
            throw invalidParameters("sort", "Chỉ nhận studentCode, kèm ,asc hoặc ,desc");
        }
        if (parts.length == 1) {
            return Sort.by(order);
        }
        return switch (parts[1].trim().toLowerCase(Locale.ROOT)) {
            case "asc" -> Sort.by(order);
            case "desc" -> Sort.by(Sort.Order.desc("student.studentCode"));
            default -> throw invalidParameters("sort", "Hướng sắp xếp chỉ nhận asc hoặc desc");
        };
    }

    private static ApiException invalidParameters(String field, String detail) {
        ErrorCode errorCode = ErrorCode.VALIDATION_ERROR;
        return new ApiException(errorCode.status(), errorCode.name(), INVALID_PARAMETERS_MESSAGE,
                Map.of(field, List.of(detail)));
    }
}
