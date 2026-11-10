package com.p02.training.dto.response;

import com.p02.training.entity.User;
import com.p02.training.entity.enums.UserRole;
import java.time.Instant;

/**
 * An account as Admins see it in TR01. Never contains the password hash, failed-login count or
 * token version.
 */
public record UserResponse(
        Long id,
        String username,
        String email,
        String fullName,
        UserRole role,
        boolean isActive,
        Instant lockedUntil) {

    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getUsername(), user.getEmail(), user.getFullName(),
                user.getRole(), user.isActive(), user.getLockedUntil());
    }
}
