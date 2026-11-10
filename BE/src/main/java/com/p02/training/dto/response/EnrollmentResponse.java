package com.p02.training.dto.response;

import com.p02.training.entity.ClassOffering;
import com.p02.training.entity.Enrollment;
import com.p02.training.entity.enums.ClassStatus;
import com.p02.training.entity.enums.EnrollmentStatus;
import java.time.Instant;
import java.time.LocalDate;

/**
 * One of the logged-in student's enrollments (TR10, TR12, "Lớp của tôi"), with the class details a
 * student needs to decide whether it can still be cancelled. Never another student's data.
 */
public record EnrollmentResponse(
        Long enrollmentId,
        Long classId,
        String classCode,
        String courseCode,
        String courseName,
        String semester,
        LocalDate startDate,
        LocalDate endDate,
        ClassStatus classStatus,
        Instant cancelDeadline,
        EnrollmentStatus status,
        Instant enrolledAt,
        Instant cancelledAt,
        Instant completedAt) {

    /** Expects the class and its course to be loaded, or loadable in the current transaction. */
    public static EnrollmentResponse from(Enrollment enrollment) {
        ClassOffering classOffering = enrollment.getClassOffering();
        return new EnrollmentResponse(enrollment.getId(), classOffering.getId(), classOffering.getClassCode(),
                classOffering.getCourse().getCode(), classOffering.getCourse().getName(), classOffering.getSemester(),
                classOffering.getStartDate(), classOffering.getEndDate(), classOffering.getStatus(),
                classOffering.getCancelDeadline(), enrollment.getStatus(), enrollment.getEnrolledAt(),
                enrollment.getCancelledAt(), enrollment.getCompletedAt());
    }
}
