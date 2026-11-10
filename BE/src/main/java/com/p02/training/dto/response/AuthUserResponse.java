package com.p02.training.dto.response;

import com.p02.training.entity.enums.UserRole;
import com.p02.training.security.AuthenticatedUser;

/** TR01 login response {userId, fullName, role}, also returned by {@code GET /auth/me}. */
public record AuthUserResponse(Long userId, String fullName, UserRole role) {

    public static AuthUserResponse from(AuthenticatedUser user) {
        return new AuthUserResponse(user.id(), user.fullName(), user.role());
    }
}
