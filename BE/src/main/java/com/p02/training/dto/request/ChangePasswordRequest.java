package com.p02.training.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * TR01 self-service password change. The strength of {@code newPassword} is checked by the service
 * and reported as WEAK_PASSWORD. {@link #toString()} hides both passwords.
 */
public record ChangePasswordRequest(
        @NotBlank(message = "Mật khẩu hiện tại không được để trống") String oldPassword,
        @NotNull(message = "Mật khẩu mới không được để trống") String newPassword) {

    @Override
    public String toString() {
        return "ChangePasswordRequest[oldPassword=***, newPassword=***]";
    }
}
