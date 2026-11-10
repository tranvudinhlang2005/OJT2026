package com.p02.training.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * TR03 {@code PUT /instructors/{id}}: code, department and phone. A full replacement, so a null
 * department or phone clears it. Lengths follow the V1 columns; department and phone have no
 * format rule (A-14).
 */
public record UpdateInstructorRequest(
        @NotBlank(message = "Mã giảng viên không được để trống")
        @Size(max = 30, message = "Mã giảng viên tối đa 30 ký tự")
        String instructorCode,

        @Size(max = 100, message = "Khoa tối đa 100 ký tự")
        String department,

        @Size(max = 20, message = "Số điện thoại tối đa 20 ký tự")
        String phone) {
}
