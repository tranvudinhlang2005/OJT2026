package com.p02.training.exception;

import com.p02.training.dto.response.ApiErrorResponse;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Path;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.TypeMismatchException;
import org.springframework.context.MessageSourceResolvable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.validation.method.ParameterValidationResult;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

/**
 * Turns every error from the MVC layer into the spec 0.4 format. Exception messages are never
 * copied into a response, except {@link ApiException} and validation messages, which are written
 * for the client. Malformed requests return 422 instead of 400, as decided in D01.
 */
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiErrorResponse> handleApiException(ApiException ex) {
        return ResponseEntity.status(ex.status())
                .body(ApiErrorResponse.of(ex.code(), ex.getMessage(), ex.details()));
    }

    // Without the two handlers below, the catch-all would turn security exceptions from
    // method-level checks into 500 responses.
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiErrorResponse> handleAccessDenied(AccessDeniedException ex) {
        return respond(ErrorCode.FORBIDDEN);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiErrorResponse> handleAuthentication(AuthenticationException ex) {
        return respond(ErrorCode.UNAUTHENTICATED);
    }

    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<ApiErrorResponse> handleOptimisticLock(ObjectOptimisticLockingFailureException ex) {
        return respond(ErrorCode.VERSION_CONFLICT);
    }

    // Raised by @Validated method validation, which ResponseEntityExceptionHandler does not cover.
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiErrorResponse> handleConstraintViolation(ConstraintViolationException ex) {
        Map<String, List<String>> details = new LinkedHashMap<>();
        ex.getConstraintViolations().forEach(violation ->
                addDetail(details, leafName(violation.getPropertyPath()), violation.getMessage()));
        ErrorCode errorCode = ErrorCode.VALIDATION_ERROR;
        return ResponseEntity.status(errorCode.status())
                .body(ApiErrorResponse.of(errorCode.name(), errorCode.message(), details));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleUnexpected(Exception ex) {
        log.error("Unhandled exception", ex);
        return respond(ErrorCode.INTERNAL_ERROR);
    }

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex,
            HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        Map<String, List<String>> details = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(error -> addDetail(details, error.getField(), error.getDefaultMessage()));
        return validationError(ex, details, headers, request);
    }

    @Override
    protected ResponseEntity<Object> handleHandlerMethodValidationException(HandlerMethodValidationException ex,
            HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        Map<String, List<String>> details = new LinkedHashMap<>();
        for (ParameterValidationResult result : ex.getParameterValidationResults()) {
            String parameter = result.getMethodParameter().getParameterName();
            for (MessageSourceResolvable error : result.getResolvableErrors()) {
                String field = error instanceof FieldError fieldError ? fieldError.getField() : parameter;
                addDetail(details, field, error.getDefaultMessage());
            }
        }
        return validationError(ex, details, headers, request);
    }

    @Override
    protected ResponseEntity<Object> handleTypeMismatch(TypeMismatchException ex, HttpHeaders headers,
            HttpStatusCode status, WebRequest request) {
        Map<String, List<String>> details = new LinkedHashMap<>();
        addDetail(details, ex.getPropertyName(), "Giá trị không đúng định dạng");
        return validationError(ex, details, headers, request);
    }

    @Override
    protected ResponseEntity<Object> handleMissingServletRequestParameter(MissingServletRequestParameterException ex,
            HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        Map<String, List<String>> details = new LinkedHashMap<>();
        addDetail(details, ex.getParameterName(), "Thiếu tham số bắt buộc");
        return validationError(ex, details, headers, request);
    }

    /** Every other MVC exception ends here, including malformed JSON and unknown paths. */
    @Override
    protected ResponseEntity<Object> handleExceptionInternal(Exception ex, Object body, HttpHeaders headers,
            HttpStatusCode statusCode, WebRequest request) {
        if (statusCode.is5xxServerError()) {
            log.error("MVC infrastructure error", ex);
        }
        ErrorCode errorCode = toErrorCode(statusCode);
        return super.handleExceptionInternal(ex, ApiErrorResponse.of(errorCode), headers, errorCode.status(), request);
    }

    private ResponseEntity<Object> validationError(Exception ex, Map<String, List<String>> details,
            HttpHeaders headers, WebRequest request) {
        ErrorCode errorCode = ErrorCode.VALIDATION_ERROR;
        ApiErrorResponse body = ApiErrorResponse.of(errorCode.name(), errorCode.message(), details);
        return super.handleExceptionInternal(ex, body, headers, errorCode.status(), request);
    }

    private static ErrorCode toErrorCode(HttpStatusCode statusCode) {
        HttpStatus status = HttpStatus.resolve(statusCode.value());
        if (status == null || status.is5xxServerError()) {
            return ErrorCode.INTERNAL_ERROR;
        }
        return switch (status) {
            case NOT_FOUND -> ErrorCode.NOT_FOUND;
            case METHOD_NOT_ALLOWED -> ErrorCode.METHOD_NOT_ALLOWED;
            case NOT_ACCEPTABLE -> ErrorCode.NOT_ACCEPTABLE;
            case UNSUPPORTED_MEDIA_TYPE -> ErrorCode.UNSUPPORTED_MEDIA_TYPE;
            default -> ErrorCode.VALIDATION_ERROR;
        };
    }

    private static ResponseEntity<ApiErrorResponse> respond(ErrorCode errorCode) {
        return ResponseEntity.status(errorCode.status()).body(ApiErrorResponse.of(errorCode));
    }

    /** Turns a path like "createClass.request.name" into "name", which hides internal method names. */
    private static String leafName(Path path) {
        String leaf = "";
        for (Path.Node node : path) {
            leaf = node.getName() == null ? leaf : node.getName();
        }
        return leaf;
    }

    private static void addDetail(Map<String, List<String>> details, String field, String message) {
        details.computeIfAbsent(field, key -> new ArrayList<>()).add(message);
    }
}
