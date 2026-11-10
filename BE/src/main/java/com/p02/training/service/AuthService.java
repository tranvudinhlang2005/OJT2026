package com.p02.training.service;

import com.p02.training.audit.SecurityAuditLogger;
import com.p02.training.dto.request.ChangePasswordRequest;
import com.p02.training.dto.request.LoginRequest;
import com.p02.training.dto.response.AuthUserResponse;
import com.p02.training.entity.User;
import com.p02.training.entity.enums.SecurityAction;
import com.p02.training.exception.ApiException;
import com.p02.training.exception.ErrorCode;
import com.p02.training.repository.UserRepository;
import com.p02.training.security.AuthenticatedUser;
import com.p02.training.security.JwtService;
import java.time.Clock;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** TR01 login, logout and self-service password change. */
@Service
public class AuthService {

    private static final String OLD_PASSWORD_INCORRECT = "OLD_PASSWORD_INCORRECT";
    private static final String OLD_PASSWORD_INCORRECT_MESSAGE = "Mật khẩu hiện tại không đúng";

    private final UserRepository userRepository;
    private final PasswordService passwordService;
    private final LoginAttemptService loginAttemptService;
    private final JwtService jwtService;
    private final SecurityAuditLogger auditLogger;
    private final Clock clock;
    private final String unknownUserHash;

    public AuthService(UserRepository userRepository, PasswordService passwordService,
            LoginAttemptService loginAttemptService, JwtService jwtService, SecurityAuditLogger auditLogger,
            Clock clock) {
        this.userRepository = userRepository;
        this.passwordService = passwordService;
        this.loginAttemptService = loginAttemptService;
        this.jwtService = jwtService;
        this.auditLogger = auditLogger;
        this.clock = clock;
        // Generated per start, so there is no fixed credential. Same cost as real hashes.
        this.unknownUserHash = passwordService.randomHash();
    }

    /**
     * TR01 login flow. Every failure is the same 401 INVALID_CREDENTIALS (D03). Not transactional
     * itself: BCrypt runs outside any transaction, the counters are updated in
     * {@link LoginAttemptService}, and LOGIN_FAILED is written in its own transaction (spec 0.5).
     * The IP rate limit runs earlier, in the security filter chain.
     */
    public LoginResult login(LoginRequest request) {
        Optional<User> found = userRepository.findByUsernameIgnoringCase(request.username());
        if (found.isEmpty()) {
            // Same BCrypt work as a real account, so response time does not reveal the username.
            passwordService.matches(request.password(), unknownUserHash);
            // Never the typed username: it may be a mistyped password (A-21).
            auditLogger.recordIndependently(SecurityAction.LOGIN_FAILED, null, Map.of("reason", "UNKNOWN_USER"));
            throw invalidCredentials();
        }

        User user = found.get();
        // Always run BCrypt, even for locked or inactive accounts, to keep timing uniform.
        boolean passwordMatches = passwordService.matches(request.password(), user.getPasswordHash());

        if (!user.isActive() || LoginAttemptService.isLocked(user, clock.instant())) {
            String reason = user.isActive() ? "LOCKED" : "INACTIVE";
            auditLogger.recordIndependently(SecurityAction.LOGIN_FAILED, user.getUsername(), Map.of("reason", reason));
            throw invalidCredentials();
        }
        if (!passwordMatches) {
            auditLogger.recordIndependently(SecurityAction.LOGIN_FAILED, user.getUsername(),
                    Map.of("reason", "BAD_PASSWORD"));
            loginAttemptService.recordFailure(user.getId());
            throw invalidCredentials();
        }

        LoginAttemptService.LoginSuccess success = loginAttemptService.recordSuccess(user.getId(), user.getPasswordHash());
        String token = jwtService.issue(success.user().id(), success.tokenVersion());
        return new LoginResult(token, AuthUserResponse.from(success.user()));
    }

    /** TR01 logout: token_version + 1, which revokes every token of this user, and LOGOUT. */
    @Transactional
    public void logout(AuthenticatedUser currentUser) {
        User user = lockCurrentUser(currentUser);
        user.setTokenVersion(user.getTokenVersion() + 1);
        auditLogger.record(SecurityAction.LOGOUT, user.getUsername(), Map.of("userId", user.getId()));
    }

    /**
     * TR01 self-service change: check the current password, then the new one's strength, then
     * token_version + 1 and PASSWORD_CHANGE. Every session of the user ends, including this one.
     */
    @Transactional
    public void changePassword(AuthenticatedUser currentUser, ChangePasswordRequest request) {
        User user = lockCurrentUser(currentUser);
        if (!passwordService.matches(request.oldPassword(), user.getPasswordHash())) {
            throw ApiException.unprocessable(OLD_PASSWORD_INCORRECT, OLD_PASSWORD_INCORRECT_MESSAGE);
        }
        user.setPasswordHash(passwordService.hashStrong(request.newPassword()));
        user.setTokenVersion(user.getTokenVersion() + 1);
        auditLogger.record(SecurityAction.PASSWORD_CHANGE, user.getUsername(), Map.of("userId", user.getId()));
    }

    private User lockCurrentUser(AuthenticatedUser currentUser) {
        // The filter loaded this user moments ago; absence means it was removed in between.
        return userRepository.findLockedById(currentUser.id())
                .orElseThrow(() -> new ApiException(ErrorCode.UNAUTHENTICATED));
    }

    private static ApiException invalidCredentials() {
        return new ApiException(ErrorCode.INVALID_CREDENTIALS);
    }

    /** The token goes only into the cookie. {@link #toString()} hides it. */
    public record LoginResult(String token, AuthUserResponse user) {

        @Override
        public String toString() {
            return "LoginResult[token=***, user=" + user + "]";
        }
    }
}
