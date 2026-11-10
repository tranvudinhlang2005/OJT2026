package com.p02.training.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.time.OffsetDateTime;

/**
 * TR05 class body for {@code POST /classes} and {@code PUT /classes/{id}} (DRAFT only). The date
 * rules (startDate after today, endDate after startDate, cancelDeadline no later than startDate in
 * Vietnam time) and the course checks are applied by the service. {@code cancelDeadline} is an
 * ISO-8601 date-time with an offset, for example {@code 2026-12-01T17:00:00+07:00}.
 */
public record ClassRequest(
        @NotBlank(message = "Mã lớp không được để trống")
        @Size(max = 30, message = "Mã lớp tối đa 30 ký tự")
        String classCode,

        @NotNull(message = "Môn học không được để trống")
        Long courseId,

        @NotBlank(message = "Học kỳ không được để trống")
        @Size(max = 20, message = "Học kỳ tối đa 20 ký tự")
        String semester,

        @NotNull(message = "Ngày bắt đầu không được để trống")
        LocalDate startDate,

        @NotNull(message = "Ngày kết thúc không được để trống")
        LocalDate endDate,

        @NotNull(message = "Sĩ số tối đa không được để trống")
        @Min(value = 1, message = "Sĩ số tối đa từ 1 đến 500")
        @Max(value = 500, message = "Sĩ số tối đa từ 1 đến 500")
        Integer maxCapacity,

        @NotNull(message = "Hạn hủy đăng ký không được để trống")
        OffsetDateTime cancelDeadline) {
}
