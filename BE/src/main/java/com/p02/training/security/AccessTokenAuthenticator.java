package com.p02.training.security;

import com.p02.training.repository.UserRepository;
import java.util.Optional;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Turns an access token into the current user, as spec 0.2 requires on every request: verify the
 * token, load the user from the database, and accept it only if the account is active and the
 * token's {@code tv} still equals {@code users.token_version}.
 */
@Component
public class AccessTokenAuthenticator {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public AccessTokenAuthenticator(JwtService jwtService, UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public Optional<AuthenticatedUser> authenticate(String token) {
        return jwtService.verify(token)
                .flatMap(claims -> userRepository.findById(claims.userId())
                        .filter(user -> user.isActive())
                        .filter(user -> user.getTokenVersion() == claims.tokenVersion()))
                .map(AuthenticatedUser::from);
    }
}
