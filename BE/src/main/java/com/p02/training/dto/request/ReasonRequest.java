package com.p02.training.dto.request;

import jakarta.validation.constraints.NotNull;

/**
 * A request whose only field is a reason: TR14 {@code POST /sessions/{id}/unlock} and TR16
 * {@code POST /classes/{id}/results/return}. Both require at least 10 characters after trimming,
 * which the service checks so it can use each feature's own error.
 */
public record ReasonRequest(@NotNull(message = "Lý do không được để trống") String reason) {
}
