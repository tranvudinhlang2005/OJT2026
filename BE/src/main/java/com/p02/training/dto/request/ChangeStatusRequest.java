package com.p02.training.dto.request;

import jakarta.validation.constraints.NotNull;

/**
 * Body of the status endpoints: TR01 {@code PATCH /users/{id}/status} (false locks the account,
 * true unlocks it), TR02 {@code PATCH /courses/{id}/status} and TR03
 * {@code PATCH /instructors/{id}/status} (false stops use, true resumes it).
 */
public record ChangeStatusRequest(@NotNull(message = "Trạng thái không được để trống") Boolean isActive) {
}
