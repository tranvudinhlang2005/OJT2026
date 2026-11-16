package com.p02.training.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * A class as returned by TR09, whose fields depend on the caller's role: {@link ClassResponse} for
 * Training Admins, {@link ClassSummaryResponse} for everyone else.
 */
@Schema(oneOf = {ClassResponse.class, ClassSummaryResponse.class})
public sealed interface ClassView permits ClassResponse, ClassSummaryResponse {
}
