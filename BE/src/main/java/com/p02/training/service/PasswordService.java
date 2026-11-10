package com.p02.training.service;

import com.p02.training.exception.ApiException;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Password strength (TR01) and BCrypt hashing. No method logs or returns a raw password.
 *
 * <p>Strength: 8–64 characters, with an upper-case letter, a lower-case letter and a digit. BCrypt
 * cannot hash more than 72 bytes, which 64 multi-byte characters can exceed, so such a password is
 * also rejected as WEAK_PASSWORD instead of failing with a 500 (rule taken from the approved A-23
 * design in database-design.md section 12).
 */
@Service
public class PasswordService {

    static final int MIN_LENGTH = 8;
    static final int MAX_LENGTH = 64;
    static final int BCRYPT_MAX_BYTES = 72;

    private static final String WEAK_PASSWORD = "WEAK_PASSWORD";
    private static final String WEAK_PASSWORD_MESSAGE = "Mật khẩu phải từ 8 ký tự, có chữ hoa, chữ thường và số";

    private final PasswordEncoder passwordEncoder;

    public PasswordService(PasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
    }

    /** Throws WEAK_PASSWORD (422) unless the password meets the TR01 rule. */
    public void requireStrong(String rawPassword) {
        if (!isStrong(rawPassword)) {
            throw ApiException.unprocessable(WEAK_PASSWORD, WEAK_PASSWORD_MESSAGE);
        }
    }

    /** Checks strength, then returns the BCrypt hash. */
    public String hashStrong(String rawPassword) {
        requireStrong(rawPassword);
        return passwordEncoder.encode(rawPassword);
    }

    /**
     * Returns whether the password matches the hash. Input BCrypt cannot hash never matches: every
     * stored password passed {@link #requireStrong}, so none of them is over 72 bytes.
     */
    public boolean matches(String rawPassword, String passwordHash) {
        if (rawPassword == null || passwordHash == null || !fitsBcrypt(rawPassword)) {
            return false;
        }
        return passwordEncoder.matches(rawPassword, passwordHash);
    }

    /** A hash of a random value, for the unknown-username path of login, which must still run BCrypt. */
    public String randomHash() {
        return passwordEncoder.encode(UUID.randomUUID().toString());
    }

    static boolean isStrong(String password) {
        if (password == null || !fitsBcrypt(password)) {
            return false;
        }
        int length = password.codePointCount(0, password.length());
        if (length < MIN_LENGTH || length > MAX_LENGTH) {
            return false;
        }
        return password.codePoints().anyMatch(Character::isUpperCase)
                && password.codePoints().anyMatch(Character::isLowerCase)
                && password.codePoints().anyMatch(Character::isDigit);
    }

    private static boolean fitsBcrypt(String password) {
        return password.getBytes(StandardCharsets.UTF_8).length <= BCRYPT_MAX_BYTES;
    }
}
