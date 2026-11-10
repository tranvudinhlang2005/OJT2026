package com.p02.training.dto.request;

import jakarta.validation.constraints.NotNull;

/**
 * TR10 {@code POST /enrollments}. Only the class is accepted: any other field in the body, such as a
 * studentId, is ignored, because the student always comes from the session.
 */
public record EnrollRequest(@NotNull(message = "Lớp học không được để trống") Long classId) {
}
