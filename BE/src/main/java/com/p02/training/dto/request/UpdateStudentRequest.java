package com.p02.training.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

/**
 * TR04 {@code PUT /students/{id}}: student code, date of birth and homeroom class. A full
 * replacement, so a null date of birth or homeroom class clears it. "Before today" is checked by the
 * service in the business time zone (spec 0.1). Lengths follow the V1 columns; homeroom class is
 * free text (A-14).
 */
public record UpdateStudentRequest(
        @NotBlank(message = "Mã học viên không được để trống")
        @Size(max = 30, message = "Mã học viên tối đa 30 ký tự")
        String studentCode,

        LocalDate dateOfBirth,

        @Size(max = 50, message = "Lớp sinh hoạt tối đa 50 ký tự")
        String homeroomClass) {
}
