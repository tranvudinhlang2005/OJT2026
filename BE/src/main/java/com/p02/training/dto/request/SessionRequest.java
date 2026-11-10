package com.p02.training.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.time.LocalTime;

/**
 * TR06 session body for {@code POST /classes/{id}/sessions} and {@code PUT /sessions/{id}}. Times are
 * Vietnam local times (A-06), for example {@code "08:00"}. startTime &lt; endTime and the date range
 * of the class are checked by the service.
 */
public record SessionRequest(
        @NotNull(message = "Ngày học không được để trống")
        LocalDate sessionDate,

        @NotNull(message = "Giờ bắt đầu không được để trống")
        LocalTime startTime,

        @NotNull(message = "Giờ kết thúc không được để trống")
        LocalTime endTime,

        @NotNull(message = "Phòng học không được để trống")
        Long roomId,

        @Size(max = 200, message = "Chủ đề tối đa 200 ký tự")
        String topic) {
}
