package com.p02.training.dto.response;

import com.p02.training.common.TraceIdFilter;
import com.p02.training.exception.ErrorCode;
import java.util.Map;

/** Standard error body from spec 0.4. {@code details} is always an object, empty if unused. */
public record ApiErrorResponse(String code, String message, Map<String, ?> details, String traceId) {

    public static ApiErrorResponse of(String code, String message, Map<String, ?> details) {
        return new ApiErrorResponse(code, message, details, TraceIdFilter.currentTraceId());
    }

    public static ApiErrorResponse of(ErrorCode errorCode) {
        return of(errorCode.name(), errorCode.message(), Map.of());
    }
}
