package com.p02.training.exception;

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
