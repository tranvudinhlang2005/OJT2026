package com.p02.training.dto.request;

import jakarta.validation.constraints.NotNull;

/** TR07 {@code PUT /classes/{id}/instructor}: the class's single main instructor (MVP). */
public record AssignInstructorRequest(@NotNull(message = "Giảng viên không được để trống") Long instructorId) {
}
