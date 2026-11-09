package com.p02.training.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.p02.training.common.ApiPaths;
import com.p02.training.dto.response.ApiErrorResponse;
import com.p02.training.exception.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
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
 * Writes the standard error body for 401 and 403 failures raised in the filter chain, outside MVC.
 *
 * <p>Spring's CSRF filter runs before authorization, but spec 0.3 checks the session (401) before
 * CSRF (403). An anonymous CSRF failure is therefore a 401, except on the public login endpoint,
 * which has no session to check. TR01's JWT filter must run before CsrfFilter, or logged-in users
 * would look anonymous here. ACCESS_DENIED logging is added here with AppSecurityLog.
 */
@Component
public class SecurityErrorHandler implements AuthenticationEntryPoint, AccessDeniedHandler {

    private final ObjectMapper objectMapper;

    public SecurityErrorHandler(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
            AuthenticationException authException) throws IOException {
        write(response, ErrorCode.UNAUTHENTICATED);
    }

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
            AccessDeniedException accessDeniedException) throws IOException {
        write(response, resolve(request, accessDeniedException));
    }

    private void write(HttpServletResponse response, ErrorCode errorCode) throws IOException {
        response.setStatus(errorCode.status().value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        objectMapper.writeValue(response.getWriter(), ApiErrorResponse.of(errorCode));
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
}
