package com.p02.training.dto.request;

import jakarta.validation.constraints.NotNull;

/**
 * TR01 {@code PATCH /users/{id}/password}, an Admin resetting another user's password. Strength is
 * checked by the service (WEAK_PASSWORD). {@link #toString()} hides the password.
 */
public record ResetPasswordRequest(@NotNull(message = "Mật khẩu mới không được để trống") String newPassword) {

    @Override
    public String toString() {
        return "ResetPasswordRequest[newPassword=***]";
    }
}
