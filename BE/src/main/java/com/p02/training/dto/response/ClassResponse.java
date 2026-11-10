package com.p02.training.dto.response;

import com.p02.training.entity.ClassOffering;
import com.p02.training.entity.Course;
import com.p02.training.entity.Instructor;
import com.p02.training.entity.enums.ClassStatus;
import com.p02.training.entity.enums.GradingStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

/**
 * A class as Training Admins see it in TR05-TR07 responses and in TR09. The thresholds and weights are the copy
 * taken at publication (D13), null while the class has never been published. The JPA
 * {@code version} column is never included (A-09).
 */
public record ClassResponse(
        Long id,
        String classCode,
        Long courseId,
        String courseCode,
        String courseName,
        String semester,
        LocalDate startDate,
        LocalDate endDate,
        Long instructorId,
        String instructorName,
        int maxCapacity,
        int enrolledCount,
        int availableSeats,
        boolean isFull,
        ClassStatus status,
        Instant cancelDeadline,
        String cancelReason,
        BigDecimal minAttendancePct,
        BigDecimal passScore,
        BigDecimal midtermWeight,
        BigDecimal finalWeight,
        GradingStatus gradingStatus,
        Instant startedAt,
        Long createdById) implements ClassView {

    /** Loads the course, instructor and creator ids lazily; call inside the transaction. */
    public static ClassResponse from(ClassOffering classOffering) {
        Course course = classOffering.getCourse();
        Instructor instructor = classOffering.getInstructor();
        int available = classOffering.getMaxCapacity() - classOffering.getEnrolledCount();
        return new ClassResponse(classOffering.getId(), classOffering.getClassCode(), course.getId(),
                course.getCode(), course.getName(), classOffering.getSemester(), classOffering.getStartDate(),
                classOffering.getEndDate(), instructor == null ? null : instructor.getId(),
                instructor == null ? null : instructor.getUser().getFullName(), classOffering.getMaxCapacity(),
                classOffering.getEnrolledCount(), available, available <= 0, classOffering.getStatus(),
                classOffering.getCancelDeadline(), classOffering.getCancelReason(),
                classOffering.getMinAttendancePct(), classOffering.getPassScore(), classOffering.getMidtermWeight(),
                classOffering.getFinalWeight(), classOffering.getGradingStatus(), classOffering.getStartedAt(),
                classOffering.getCreatedBy().getId());
    }
}
