package com.p02.training.security;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Duration;
import java.util.Optional;
import org.springframework.http.ResponseCookie;
import org.springframework.web.util.WebUtils;

/** The access-token cookie from spec 0.2: httpOnly, Secure, SameSite=Strict, lasting as long as the token. */
public final class AuthCookies {

    public static final String ACCESS_TOKEN = "ACCESS_TOKEN";

    private AuthCookies() {
    }

    public static ResponseCookie accessToken(String token) {
        return build(token, JwtService.TOKEN_LIFETIME);
    }

    /** Tells the browser to delete the cookie. */
    public static ResponseCookie cleared() {
        return build("", Duration.ZERO);
    }

    public static Optional<String> read(HttpServletRequest request) {
        Cookie cookie = WebUtils.getCookie(request, ACCESS_TOKEN);
        return cookie == null || cookie.getValue() == null || cookie.getValue().isEmpty()
                ? Optional.empty()
                : Optional.of(cookie.getValue());
    }

    private static ResponseCookie build(String value, Duration maxAge) {
        return ResponseCookie.from(ACCESS_TOKEN, value)
                .httpOnly(true)
                .secure(true)
                .sameSite("Strict")
                .path("/")
                .maxAge(maxAge)
                .build();
    }
}
