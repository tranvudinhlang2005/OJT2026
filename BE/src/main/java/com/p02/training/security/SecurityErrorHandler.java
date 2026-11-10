package com.p02.training.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.p02.training.audit.SecurityAuditLogger;
import com.p02.training.common.ApiPaths;
import com.p02.training.dto.response.ApiErrorResponse;
import com.p02.training.entity.enums.SecurityAction;
import com.p02.training.exception.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.csrf.CsrfException;
import org.springframework.stereotype.Component;

/**
 * Writes the standard error body for failures raised in the filter chain, outside MVC.
 *
 * <p>Spring's CSRF filter runs before authorization, but spec 0.3 checks the session (401) before
 * CSRF (403). An anonymous CSRF failure is therefore a 401, except on the public login endpoint,
 * which has no session to check. {@link JwtAuthenticationFilter} runs before CsrfFilter, so a
 * logged-in user is already known here.
 *
 * <p>A role refusal (403, not CSRF) is written to AppSecurityLog as ACCESS_DENIED, in its own
 * transaction (spec 0.3, 0.5).
 */
@Component
public class SecurityErrorHandler implements AuthenticationEntryPoint, AccessDeniedHandler {

    private static final int MAX_LOGGED_PATH_LENGTH = 255;

    private final ObjectMapper objectMapper;
    private final SecurityAuditLogger auditLogger;

    public SecurityErrorHandler(ObjectMapper objectMapper, SecurityAuditLogger auditLogger) {
        this.objectMapper = objectMapper;
        this.auditLogger = auditLogger;
    }

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
            AuthenticationException authException) throws IOException {
        writeError(response, ErrorCode.UNAUTHENTICATED);
    }

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
            AccessDeniedException accessDeniedException) throws IOException {
        ErrorCode errorCode = resolve(request, accessDeniedException);
        if (errorCode == ErrorCode.FORBIDDEN) {
            logAccessDenied(request);
        }
        writeError(response, errorCode);
    }

    /** Writes the spec 0.4 error body. Also used by {@link LoginRateLimitFilter}. */
    public void writeError(HttpServletResponse response, ErrorCode errorCode) throws IOException {
        response.setStatus(errorCode.status().value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        objectMapper.writeValue(response.getWriter(), ApiErrorResponse.of(errorCode));
    }

    private void logAccessDenied(HttpServletRequest request) {
        Map<String, Object> details = new LinkedHashMap<>();
        details.put("method", request.getMethod());
        details.put("path", truncate(request.getRequestURI()));
        auditLogger.recordIndependently(SecurityAction.ACCESS_DENIED, currentUsername(), details);
    }

    private static ErrorCode resolve(HttpServletRequest request, AccessDeniedException exception) {
        if (!(exception instanceof CsrfException)) {
            return ErrorCode.FORBIDDEN;
        }
        boolean publicEndpoint = ApiPaths.LOGIN.equals(request.getRequestURI());
        return isAuthenticated() || publicEndpoint ? ErrorCode.CSRF_INVALID : ErrorCode.UNAUTHENTICATED;
    }

    private static boolean isAuthenticated() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null
                && authentication.isAuthenticated()
                && !(authentication instanceof AnonymousAuthenticationToken);
    }

    /** Only a real account's username is logged (A-21). */
    private static String currentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.getPrincipal() instanceof AuthenticatedUser user
                ? user.username()
                : null;
    }

    private static String truncate(String value) {
        return value != null && value.length() > MAX_LOGGED_PATH_LENGTH
                ? value.substring(0, MAX_LOGGED_PATH_LENGTH)
                : value;
    }
}
