package com.p02.training.controller;

import com.p02.training.common.ApiPaths;
import com.p02.training.dto.request.ChangePasswordRequest;
import com.p02.training.dto.request.LoginRequest;
import com.p02.training.dto.response.AuthUserResponse;
import com.p02.training.security.AuthCookies;
import com.p02.training.security.AuthenticatedUser;
import com.p02.training.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** TR01 authentication endpoints. Access rules are in SecurityConfig. */
@RestController
@RequestMapping(ApiPaths.AUTH)
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /** Public. Issues the XSRF-TOKEN cookie the frontend must echo in X-XSRF-TOKEN (spec 0.2). */
    @GetMapping("/csrf")
    public ResponseEntity<Void> csrf(CsrfToken csrfToken) {
        // Reading the token makes the deferred repository write the cookie.
        csrfToken.getToken();
        return ResponseEntity.noContent().build();
    }

    /** Public, CSRF-protected. 200 {userId, fullName, role} and the httpOnly access-token cookie. */
    @PostMapping("/login")
    public ResponseEntity<AuthUserResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthService.LoginResult result = authService.login(request);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, AuthCookies.accessToken(result.token()).toString())
                .body(result.user());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@AuthenticationPrincipal AuthenticatedUser currentUser) {
        authService.logout(currentUser);
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, AuthCookies.cleared().toString())
                .build();
    }

    @GetMapping("/me")
    public AuthUserResponse me(@AuthenticationPrincipal AuthenticatedUser currentUser) {
        return AuthUserResponse.from(currentUser);
    }

    /** The change revokes every token, this one included, so the now-useless cookie is cleared. */
    @PatchMapping("/password")
    public ResponseEntity<Void> changePassword(@AuthenticationPrincipal AuthenticatedUser currentUser,
            @Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(currentUser, request);
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, AuthCookies.cleared().toString())
                .build();
    }
}
