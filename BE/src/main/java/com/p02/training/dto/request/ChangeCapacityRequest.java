package com.p02.training.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/** TR05 {@code PATCH /classes/{id}/capacity} (DRAFT or OPEN). */
public record ChangeCapacityRequest(
        @NotNull(message = "Sĩ số tối đa không được để trống")
        @Min(value = 1, message = "Sĩ số tối đa từ 1 đến 500")
        @Max(value = 500, message = "Sĩ số tối đa từ 1 đến 500")
        Integer maxCapacity) {
}
