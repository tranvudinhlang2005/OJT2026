package com.p02.training.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.List;

/**
 * TR14 {@code PUT /sessions/{id}/attendance}: {@code {"version": n, "items": [{studentId, status, remarks}]}}.
 * {@code version} is the session's attendance version from the last GET (A-09). A student may appear
 * only once, which the service checks.
 */
public record UpdateAttendanceRequest(
        @NotNull(message = "version không được để trống")
        Integer version,

        @NotNull(message = "Danh sách điểm danh không được để trống")
        List<@Valid @NotNull(message = "Dòng điểm danh không được để trống") AttendanceItemRequest> items) {
}
