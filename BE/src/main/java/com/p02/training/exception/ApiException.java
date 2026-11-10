package com.p02.training.exception;

import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;

/** Raised by services for an expected failure. Its message is safe to show to the client. */
public class ApiException extends RuntimeException {

    private final HttpStatus status;
    private final String code;
    private final transient Map<String, ?> details;

    public ApiException(HttpStatus status, String code, String message, Map<String, ?> details) {
        super(message);
        this.status = status;
        this.code = code;
        this.details = details != null ? details : Map.of();
    }

    public ApiException(ErrorCode errorCode) {
        this(errorCode.status(), errorCode.name(), errorCode.message(), Map.of());
    }

    /** A business rule violation (HTTP 409) with a feature-specific code from spec part 4. */
    public static ApiException conflict(String code, String message) {
        return new ApiException(HttpStatus.CONFLICT, code, message, Map.of());
    }

    /** An input rejected with a feature-specific 422 code from spec part 4, such as WEAK_PASSWORD. */
    public static ApiException unprocessable(String code, String message) {
        return new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, code, message, Map.of());
    }

    /** VALIDATION_ERROR for a rule Bean Validation cannot express, with the field it concerns. */
    public static ApiException validation(String field, String message) {
        ErrorCode errorCode = ErrorCode.VALIDATION_ERROR;
        return new ApiException(errorCode.status(), errorCode.name(), errorCode.message(),
                Map.of(field, List.of(message)));
    }

    public HttpStatus status() {
        return status;
    }

    public String code() {
        return code;
    }

    public Map<String, ?> details() {
        return details;
    }
}
