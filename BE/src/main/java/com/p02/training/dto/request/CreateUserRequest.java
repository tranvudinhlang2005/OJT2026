package com.p02.training.dto.request;

import com.p02.training.entity.enums.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * TR01 account creation by an Admin.
 *
 * <p>The password's strength is checked by the service and reported as WEAK_PASSWORD. The service
 * also requires {@code studentCode} for STUDENT and {@code instructorCode} for INSTRUCTOR. Lengths
 * without a spec rule follow the V1 columns. {@link #toString()} hides the password.
 */
public record CreateUserRequest(
        @NotNull(message = "Tên đăng nhập không được để trống")
        @Pattern(regexp = "^[a-z0-9._]{4,50}$",
                message = "Tên đăng nhập 4–50 ký tự, chỉ gồm a-z, 0-9, dấu chấm và gạch dưới")
        String username,

        @NotBlank(message = "Email không được để trống")
        @Email(message = "Email không đúng định dạng")
        @Size(max = 255, message = "Email tối đa 255 ký tự")
        String email,

        @NotNull(message = "Mật khẩu không được để trống")
        String password,

        @NotBlank(message = "Họ tên không được để trống")
        @Size(max = 255, message = "Họ tên tối đa 255 ký tự")
        String fullName,

        @NotNull(message = "Vai trò không được để trống")
        UserRole role,

        @Size(max = 30, message = "Mã học viên tối đa 30 ký tự")
        @Pattern(regexp = ".*\\S.*", message = "Mã học viên không được để trống")
        String studentCode,

        @Size(max = 30, message = "Mã giảng viên tối đa 30 ký tự")
        @Pattern(regexp = ".*\\S.*", message = "Mã giảng viên không được để trống")
        String instructorCode) {

    @Override
    public String toString() {
        return "CreateUserRequest[username=" + username + ", email=" + email + ", password=***, fullName="
                + fullName + ", role=" + role + ", studentCode=" + studentCode + ", instructorCode="
                + instructorCode + "]";
    }
}
