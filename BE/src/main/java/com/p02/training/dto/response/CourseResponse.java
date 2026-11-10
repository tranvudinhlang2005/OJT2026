package com.p02.training.dto.response;

import com.p02.training.entity.Course;
import java.math.BigDecimal;

/** A TR02 course. The same fields for every role; non-Admins only ever receive active courses. */
public record CourseResponse(
        Long id,
        String code,
        String name,
        int credits,
        int durationHours,
        BigDecimal minAttendancePct,
        BigDecimal passScore,
        BigDecimal midtermWeight,
        BigDecimal finalWeight,
        boolean isActive) {

    public static CourseResponse from(Course course) {
        return new CourseResponse(course.getId(), course.getCode(), course.getName(), course.getCredits(),
                course.getDurationHours(), course.getMinAttendancePct(), course.getPassScore(),
                course.getMidtermWeight(), course.getFinalWeight(), course.isActive());
    }
}
