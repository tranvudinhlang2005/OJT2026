package com.p02.training.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** TR06 room body for {@code POST /rooms} and {@code PUT /rooms/{id}}: a unique code and capacity ≥ 1. */
public record RoomRequest(
        @NotBlank(message = "Mã phòng không được để trống")
        @Size(max = 30, message = "Mã phòng tối đa 30 ký tự")
        String code,

        @NotNull(message = "Sức chứa không được để trống")
        @Min(value = 1, message = "Sức chứa phải từ 1 trở lên")
        Integer capacity) {
}
