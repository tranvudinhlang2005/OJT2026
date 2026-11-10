package com.p02.training.dto.request;

import jakarta.validation.constraints.NotNull;

/**
 * TR05 {@code POST /classes/{id}/cancel}. The reason must have at least 10 characters (D11),
 * counted after trimming, which the service checks.
 */
public record CancelClassRequest(@NotNull(message = "Lý do hủy lớp không được để trống") String reason) {
}
