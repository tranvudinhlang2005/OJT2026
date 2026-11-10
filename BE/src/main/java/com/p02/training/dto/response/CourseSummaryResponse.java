package com.p02.training.dto.response;

import com.p02.training.entity.Course;

/** A course as listed among an instructor's teachable courses (TR03). */
public record CourseSummaryResponse(Long id, String code, String name, boolean isActive) {

    public static CourseSummaryResponse from(Course course) {
        return new CourseSummaryResponse(course.getId(), course.getCode(), course.getName(), course.isActive());
    }
}
