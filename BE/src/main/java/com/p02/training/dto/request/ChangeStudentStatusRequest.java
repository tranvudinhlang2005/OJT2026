package com.p02.training.dto.request;

import com.p02.training.entity.enums.StudentStatus;
import jakarta.validation.constraints.NotNull;

/** TR04 {@code PATCH /students/{id}/status}: ACTIVE, SUSPENDED or INACTIVE. */
public record ChangeStudentStatusRequest(@NotNull(message = "Trạng thái không được để trống") StudentStatus status) {
}
