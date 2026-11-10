package com.p02.training.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Authenticates a request from its access-token cookie. A missing, invalid, expired or revoked
 * token leaves the request anonymous, so protected endpoints answer 401 through the entry point.
 *
 * <p>Created inside {@link SecurityConfig}, not as a bean, so Spring Boot does not also register it
 * as a servlet filter. It runs before CsrfFilter so that a logged-in user's CSRF failure is a 403,
 * not a 401 (see {@link SecurityErrorHandler}).
 */
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final AccessTokenAuthenticator authenticator;

    public JwtAuthenticationFilter(AccessTokenAuthenticator authenticator) {
        this.authenticator = authenticator;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        if (SecurityContextHolder.getContext().getAuthentication() == null) {
            AuthCookies.read(request)
                    .flatMap(authenticator::authenticate)
                    .ifPresent(JwtAuthenticationFilter::setAuthentication);
        }
        chain.doFilter(request, response);
    }

    private static void setAuthentication(AuthenticatedUser user) {
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(UsernamePasswordAuthenticationToken.authenticated(user, null, user.authorities()));
        SecurityContextHolder.setContext(context);
    }
}
