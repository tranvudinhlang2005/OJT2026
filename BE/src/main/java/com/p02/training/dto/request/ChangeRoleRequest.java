package com.p02.training.dto.request;

import com.p02.training.entity.enums.UserRole;
import jakarta.validation.constraints.NotNull;

/** TR01 {@code PATCH /users/{id}/role}. Which changes are allowed is decided by D04 in the service. */
public record ChangeRoleRequest(@NotNull(message = "Vai trò không được để trống") UserRole role) {
}
