package com.p02.training.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.p02.training.entity.ClassOffering;
import com.p02.training.entity.Course;
import com.p02.training.entity.Instructor;
import com.p02.training.entity.enums.ClassStatus;
import com.p02.training.entity.enums.GradingStatus;
import com.p02.training.entity.enums.UserRole;
import com.p02.training.security.AuthenticatedUser;
import java.time.Instant;
import java.time.LocalDate;
import org.springframework.lang.Nullable;

/**
 * A class as Instructors, Students and Managers see it in TR09: exactly the listed fields, without
 * weights, cancelReason and createdBy. availableSeats = maxCapacity − enrolledCount.
 * {@code gradingStatus} is present only for the Instructor assigned to the class (TR09/TR15); for
 * every other viewer it is null and left out of the JSON.
 */
public record ClassSummaryResponse(
        Long id,
        String classCode,
        String courseCode,
        String courseName,
        String semester,
        LocalDate startDate,
        LocalDate endDate,
        @Nullable String instructorName,
        int maxCapacity,
        int enrolledCount,
        int availableSeats,
        boolean isFull,
        ClassStatus status,
        Instant cancelDeadline,
        @Nullable @JsonInclude(JsonInclude.Include.NON_NULL) GradingStatus gradingStatus) implements ClassView {

    /**
     * Expects the course, instructor and instructor's user to be loaded, as the TR09 queries do.
     * gradingStatus is filled only when the viewer is the Instructor assigned to the class.
     */
    public static ClassSummaryResponse from(ClassOffering classOffering, @Nullable AuthenticatedUser viewer) {
        Course course = classOffering.getCourse();
        Instructor instructor = classOffering.getInstructor();
        int available = classOffering.getMaxCapacity() - classOffering.getEnrolledCount();
        return new ClassSummaryResponse(classOffering.getId(), classOffering.getClassCode(), course.getCode(),
                course.getName(), classOffering.getSemester(), classOffering.getStartDate(),
                classOffering.getEndDate(), instructor == null ? null : instructor.getUser().getFullName(),
                classOffering.getMaxCapacity(), classOffering.getEnrolledCount(), available, available <= 0,
                classOffering.getStatus(), classOffering.getCancelDeadline(),
                isAssignedInstructor(instructor, viewer) ? classOffering.getGradingStatus() : null);
    }

    private static boolean isAssignedInstructor(@Nullable Instructor instructor, @Nullable AuthenticatedUser viewer) {
        return viewer != null && viewer.role() == UserRole.INSTRUCTOR && instructor != null
                && instructor.getUser().getId().equals(viewer.id());
    }
}
