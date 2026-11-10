package com.p02.training.security;

import com.p02.training.entity.User;
import com.p02.training.entity.enums.UserRole;
import java.security.Principal;
import java.util.List;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

/**
 * The logged-in account, rebuilt from the database on every request (spec 0.2). The role always
 * comes from the {@code users} row, never from the token or the client. Holds no credential.
 */
public record AuthenticatedUser(Long id, String username, String fullName, UserRole role) implements Principal {

    public static final String ROLE_PREFIX = "ROLE_";

    public static AuthenticatedUser from(User user) {
        return new AuthenticatedUser(user.getId(), user.getUsername(), user.getFullName(), user.getRole());
    }

    public List<GrantedAuthority> authorities() {
        return List.of(new SimpleGrantedAuthority(ROLE_PREFIX + role.name()));
    }

    @Override
    public String getName() {
        return username;
    }
}
