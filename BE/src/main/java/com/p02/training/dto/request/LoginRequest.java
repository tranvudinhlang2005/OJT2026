package com.p02.training.dto.request;

import jakarta.validation.constraints.NotBlank;

/** TR01 login: both fields must not be empty. {@link #toString()} hides the password. */
public record LoginRequest(
        @NotBlank(message = "Tên đăng nhập không được để trống") String username,
        @NotBlank(message = "Mật khẩu không được để trống") String password) {

    @Override
    public String toString() {
        return "LoginRequest[username=" + username + ", password=***]";
    }
}
