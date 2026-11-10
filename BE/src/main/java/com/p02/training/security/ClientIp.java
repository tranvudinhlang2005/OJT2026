package com.p02.training.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * The client address used for the login rate limit (A-26), security logs and the grade audit log:
 * the direct remote address. This class never reads X-Forwarded-For or similar headers, because any
 * client can set them to get a fresh rate-limit window per request.
 *
 * <p>{@code server.forward-headers-strategy} is explicitly {@code none} in application.yml, so the
 * container does not rewrite the remote address either. Trusted-proxy support is opt-in: set it
 * to {@code native} and restrict {@code server.tomcat.remoteip.internal-proxies} to the proxy's own
 * address, and Tomcat then reports the client address that proxy forwarded.
 */
public final class ClientIp {

    /** Length of {@code app_security_log.ip_address}, which fits IPv6 (A-20). */
    private static final int MAX_LENGTH = 45;

    private ClientIp() {
    }

    public static String of(HttpServletRequest request) {
        String address = request.getRemoteAddr();
        if (address == null) {
            return null;
        }
        return address.length() > MAX_LENGTH ? address.substring(0, MAX_LENGTH) : address;
    }

    /** The address of the request being handled on this thread, or null outside a request. */
    public static String current() {
        RequestAttributes attributes = RequestContextHolder.getRequestAttributes();
        if (attributes instanceof ServletRequestAttributes servletAttributes) {
            return of(servletAttributes.getRequest());
        }
        return null;
    }
}
