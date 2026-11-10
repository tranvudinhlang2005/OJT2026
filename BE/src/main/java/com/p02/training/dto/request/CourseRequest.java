package com.p02.training.dto.request;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

/**
 * TR02 course body for {@code POST /courses} and {@code PUT /courses/{id}}.
 *
 * <p>The code is trimmed and upper-cased by the service, which then checks its length (at most 20).
 * The ranges of the thresholds and weights, and the rule that the weights add up to 1, are checked
 * by the service and reported with TR02's message. A null threshold or weight means the D13 default
 * on create and "unchanged" on update. {@code @Digits} matches the column scale, so no value is
 * silently rounded.
 */
public record CourseRequest(
        @NotBlank(message = "Mã Course không được để trống")
        String code,

        @NotBlank(message = "Tên Course không được để trống")
        @Size(max = 150, message = "Tên Course tối đa 150 ký tự")
        String name,

        @NotNull(message = "Số tín chỉ không được để trống")
        @Positive(message = "Số tín chỉ phải lớn hơn 0")
        Integer credits,

        @NotNull(message = "Số giờ không được để trống")
        @Positive(message = "Số giờ phải lớn hơn 0")
        Integer durationHours,

        @Digits(integer = 3, fraction = 2, message = "Tối đa 2 chữ số thập phân")
        BigDecimal minAttendancePct,

        @Digits(integer = 2, fraction = 2, message = "Tối đa 2 chữ số thập phân")
        BigDecimal passScore,

        @Digits(integer = 1, fraction = 2, message = "Tối đa 2 chữ số thập phân")
        BigDecimal midtermWeight,

        @Digits(integer = 1, fraction = 2, message = "Tối đa 2 chữ số thập phân")
        BigDecimal finalWeight) {
}
