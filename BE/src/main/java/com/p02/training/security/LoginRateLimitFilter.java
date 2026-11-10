package com.p02.training.security;

import com.p02.training.common.ApiPaths;
import com.p02.training.exception.ErrorCode;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Applies {@link LoginRateLimiter} to {@code POST /api/v1/auth/login} and to nothing else (A-26).
 *
 * <p>Runs after CsrfFilter, following spec 0.3, and before the body is read or validated,
 * following TR01's login flow. The path is matched the way Spring MVC routes it, so an encoded
 * variant of the login path cannot reach the login handler without being counted. A refusal is a
 * 429 TOO_MANY_REQUESTS in the standard error format, with a Retry-After header in seconds.
 *
 * <p>Logs nothing: it never reads the request body, cookies or credentials. Created inside
 * {@link SecurityConfig}, not as a bean, so it is not also registered as a servlet filter.
 */
public class LoginRateLimitFilter extends OncePerRequestFilter {

    private static final RequestMatcher LOGIN =
            PathPatternRequestMatcher.withDefaults().matcher(HttpMethod.POST, ApiPaths.LOGIN);

    private final LoginRateLimiter rateLimiter;
    private final SecurityErrorHandler errorHandler;

    public LoginRateLimitFilter(LoginRateLimiter rateLimiter, SecurityErrorHandler errorHandler) {
        this.rateLimiter = rateLimiter;
        this.errorHandler = errorHandler;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !LOGIN.matches(request);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        LoginRateLimiter.Decision decision = rateLimiter.acquire(ClientIp.of(request));
        if (!decision.allowed()) {
            response.setHeader(HttpHeaders.RETRY_AFTER, Long.toString(decision.retryAfterSeconds()));
            errorHandler.writeError(response, ErrorCode.TOO_MANY_REQUESTS);
            return;
        }
        chain.doFilter(request, response);
    }
}
