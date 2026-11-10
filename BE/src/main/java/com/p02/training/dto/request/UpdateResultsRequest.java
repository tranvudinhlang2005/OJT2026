package com.p02.training.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.List;

/**
 * TR15 {@code PUT /classes/{id}/results}: {@code {"version": n, "items": [{studentId, midtermScore,
 * finalScore, reason}]}}. {@code version} is the class's grading version from the last GET (A-09).
 * A student may appear only once, which the service checks.
 */
public record UpdateResultsRequest(
        @NotNull(message = "version không được để trống")
        Integer version,

        @NotNull(message = "Danh sách điểm không được để trống")
        List<@Valid @NotNull(message = "Dòng điểm không được để trống") ResultItemRequest> items) {
}
