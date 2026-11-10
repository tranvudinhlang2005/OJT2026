package com.p02.training.dto.request;

import com.p02.training.entity.enums.AttendanceStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** One mark in a TR14 attendance save. */
public record AttendanceItemRequest(
        @NotNull(message = "Học viên không được để trống")
        Long studentId,

        @NotNull(message = "Trạng thái điểm danh phải là PRESENT, ABSENT hoặc LATE")
        AttendanceStatus status,

        @Size(max = 255, message = "Ghi chú tối đa 255 ký tự")
        String remarks) {
}
