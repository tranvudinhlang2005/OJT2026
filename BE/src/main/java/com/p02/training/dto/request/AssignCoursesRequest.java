package com.p02.training.dto.request;

import jakarta.validation.constraints.NotNull;
import java.util.List;

/**
 * TR03 {@code PUT /instructors/{id}/courses}: the complete set of courses the instructor may teach.
 * An empty list removes them all; repeated ids count once.
 */
public record AssignCoursesRequest(
        @NotNull(message = "Danh sách môn học không được để trống")
        List<@NotNull(message = "Mã môn học không được để trống") Long> courseIds) {
}
