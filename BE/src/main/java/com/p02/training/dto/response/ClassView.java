package com.p02.training.dto.response;

/**
 * A class as returned by TR09, whose fields depend on the caller's role: {@link ClassResponse} for
 * Training Admins, {@link ClassSummaryResponse} for everyone else.
 */
public sealed interface ClassView permits ClassResponse, ClassSummaryResponse {
}
