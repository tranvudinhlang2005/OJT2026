package com.p02.training.dto.response;

import com.p02.training.entity.ClassOffering;
import com.p02.training.entity.Course;
import com.p02.training.entity.Instructor;
import com.p02.training.entity.enums.ClassStatus;
import java.time.Instant;
import java.time.LocalDate;

/**
 * A class as Instructors, Students and Managers see it in TR09: exactly the listed fields, without
 * cancelReason and createdBy. availableSeats = maxCapacity − enrolledCount.
 */
public record ClassSummaryResponse(
        Long id,
        String classCode,
        String courseCode,
        String courseName,
        String semester,
        LocalDate startDate,
        LocalDate endDate,
        String instructorName,
        int maxCapacity,
        int enrolledCount,
        int availableSeats,
        boolean isFull,
        ClassStatus status,
        Instant cancelDeadline) implements ClassView {

    /** Expects the course, instructor and instructor's user to be loaded, as the TR09 queries do. */
    public static ClassSummaryResponse from(ClassOffering classOffering) {
        Course course = classOffering.getCourse();
        Instructor instructor = classOffering.getInstructor();
        int available = classOffering.getMaxCapacity() - classOffering.getEnrolledCount();
        return new ClassSummaryResponse(classOffering.getId(), classOffering.getClassCode(), course.getCode(),
                course.getName(), classOffering.getSemester(), classOffering.getStartDate(),
                classOffering.getEndDate(), instructor == null ? null : instructor.getUser().getFullName(),
                classOffering.getMaxCapacity(), classOffering.getEnrolledCount(), available, available <= 0,
                classOffering.getStatus(), classOffering.getCancelDeadline());
    }
}
