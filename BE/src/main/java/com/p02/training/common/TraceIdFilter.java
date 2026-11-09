package com.p02.training.common;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Gives each request a trace id that links an API error to its server logs. Runs before Spring
 * Security so that security errors carry one too. The id is always generated here. It is never
 * read from the client, which prevents log injection.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class TraceIdFilter extends OncePerRequestFilter {

    public static final String RESPONSE_HEADER = "X-Trace-Id";

    private static final String MDC_KEY = "traceId";

    /** Returns the current request's trace id, or a new one when called outside a request. */
    public static String currentTraceId() {
        String traceId = MDC.get(MDC_KEY);
        return traceId != null ? traceId : generate();
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String traceId = generate();
        MDC.put(MDC_KEY, traceId);
        response.setHeader(RESPONSE_HEADER, traceId);
        try {
            chain.doFilter(request, response);
        } finally {
            MDC.remove(MDC_KEY);
        }
    }

    private static String generate() {
        return UUID.randomUUID().toString();
    }
}
