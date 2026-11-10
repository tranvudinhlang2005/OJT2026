package com.p02.training.service;

import com.p02.training.audit.SecurityAuditLogger;
import com.p02.training.entity.User;
import com.p02.training.entity.enums.SecurityAction;
import com.p02.training.exception.ApiException;
import com.p02.training.exception.ErrorCode;
import com.p02.training.repository.UserRepository;
import com.p02.training.security.AuthenticatedUser;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * The database side of login: failed-attempt counting, account locking (D03) and the success
 * update. Each method is a short transaction holding the user's row lock, so concurrent attempts
 * on one account are counted correctly. BCrypt runs in {@link AuthService}, before these are
 * called, so no database connection is held during hashing.
 */
@Service
public class LoginAttemptService {

    static final int MAX_FAILED_ATTEMPTS = 5;
    static final Duration LOCK_DURATION = Duration.ofMinutes(15);

    private final UserRepository userRepository;
    private final SecurityAuditLogger auditLogger;
    private final Clock clock;

    public LoginAttemptService(UserRepository userRepository, SecurityAuditLogger auditLogger, Clock clock) {
        this.userRepository = userRepository;
        this.auditLogger = auditLogger;
        this.clock = clock;
    }

    /**
     * A wrong password: failed_login_count + 1. On the fifth, sets locked_until = now + 15 minutes,
     * resets the count to 0 and logs ACCOUNT_LOCKED. An account that another attempt locked in the
     * meantime is left unchanged, so attempts during a lock do not count towards the next one.
     */
    @Transactional
    public void recordFailure(Long userId) {
        User user = userRepository.findLockedById(userId).orElse(null);
        Instant now = clock.instant();
        if (user == null || isLocked(user, now)) {
            return;
        }
        int failures = user.getFailedLoginCount() + 1;
        if (failures >= MAX_FAILED_ATTEMPTS) {
            Instant lockedUntil = now.plus(LOCK_DURATION);
            user.setFailedLoginCount(0);
            user.setLockedUntil(lockedUntil);
            Map<String, Object> details = new LinkedHashMap<>();
            details.put("userId", user.getId());
            details.put("lockedUntil", lockedUntil.toString());
            auditLogger.record(SecurityAction.ACCOUNT_LOCKED, user.getUsername(), details);
        } else {
            user.setFailedLoginCount(failures);
        }
    }

    /**
     * A correct password: resets failed_login_count and locked_until and logs LOGIN_SUCCESS. The row
     * is re-read under lock, and the login fails if the account was locked, deactivated or given a
     * new password after the password was checked.
     */
    @Transactional
    public LoginSuccess recordSuccess(Long userId, String verifiedPasswordHash) {
        User user = userRepository.findLockedById(userId).orElse(null);
        Instant now = clock.instant();
        if (user == null || !user.isActive() || isLocked(user, now)
                || !user.getPasswordHash().equals(verifiedPasswordHash)) {
            auditLogger.recordIndependently(SecurityAction.LOGIN_FAILED,
                    user == null ? null : user.getUsername(), Map.of("reason", "STATE_CHANGED"));
            throw new ApiException(ErrorCode.INVALID_CREDENTIALS);
        }
        user.setFailedLoginCount(0);
        user.setLockedUntil(null);
        auditLogger.record(SecurityAction.LOGIN_SUCCESS, user.getUsername(), Map.of("userId", user.getId()));
        return new LoginSuccess(AuthenticatedUser.from(user), user.getTokenVersion());
    }

    static boolean isLocked(User user, Instant now) {
        return user.getLockedUntil() != null && user.getLockedUntil().isAfter(now);
    }

    public record LoginSuccess(AuthenticatedUser user, int tokenVersion) {
    }
}
