package com.p02.training.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** TR01 {@code PATCH /users/{id}}: full name and email. A null field is left unchanged. */
public record UpdateUserRequest(
        @Size(max = 255, message = "Họ tên tối đa 255 ký tự")
        @Pattern(regexp = ".*\\S.*", message = "Họ tên không được để trống")
        String fullName,

        @Email(message = "Email không đúng định dạng")
        @Size(max = 255, message = "Email tối đa 255 ký tự")
        @Pattern(regexp = ".*\\S.*", message = "Email không được để trống")
        String email) {
}
