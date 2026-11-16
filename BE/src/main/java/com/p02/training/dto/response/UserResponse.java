package com.p02.training.dto.response;

import com.p02.training.entity.User;
import com.p02.training.entity.enums.UserRole;
import java.time.Instant;
import org.springframework.lang.Nullable;

/**
 * An account as Admins see it in TR01. Never contains the password hash or token version.
 * {@code failedLoginCount} lets Admins see accounts close to the TR01 lockout.
 */
public record UserResponse(
        Long id,
        String username,
        String email,
        String fullName,
        UserRole role,
        boolean isActive,
        @Nullable Instant lockedUntil,
        Instant createdAt,
        int failedLoginCount) {

    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getUsername(), user.getEmail(), user.getFullName(),
                user.getRole(), user.isActive(), user.getLockedUntil(),
                user.getCreatedAt(), user.getFailedLoginCount());
    }
}
