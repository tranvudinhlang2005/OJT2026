package com.p02.training.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.p02.training.exception.ApiException;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

class PasswordServiceTest {

    // Lowest BCrypt cost, to keep the test fast. Production uses the default.
    private final PasswordService service = new PasswordService(new BCryptPasswordEncoder(4));

    @Test
    void acceptsPasswordsMeetingTheTr01Rule() {
        assertThat(PasswordService.isStrong("Abcdefg1")).isTrue();
        assertThat(PasswordService.isStrong("A1" + "b".repeat(62))).isTrue();
    }

    @Test
    void rejectsPasswordsBreakingTheTr01Rule() {
        assertThat(PasswordService.isStrong(null)).isFalse();
        assertThat(PasswordService.isStrong("Abcdef1")).as("7 characters").isFalse();
        assertThat(PasswordService.isStrong("A1" + "b".repeat(63))).as("65 characters").isFalse();
        assertThat(PasswordService.isStrong("abcdefg1")).as("no upper case").isFalse();
        assertThat(PasswordService.isStrong("ABCDEFG1")).as("no lower case").isFalse();
        assertThat(PasswordService.isStrong("Abcdefgh")).as("no digit").isFalse();
    }

    @Test
    void rejectsPasswordsBcryptCannotHash() {
        // 30 three-byte characters plus "Aa1": 33 characters but 93 bytes.
        assertThat(PasswordService.isStrong("Aa1" + "Ạ".repeat(30))).isFalse();
    }

    @Test
    void weakPasswordIsA422WithItsOwnCode() {
        assertThatThrownBy(() -> service.requireStrong("weak"))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.status()).isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);
                    assertThat(ex.code()).isEqualTo("WEAK_PASSWORD");
                });
    }

    @Test
    void hashMatchesOnlyTheOriginalPassword() {
        String hash = service.hashStrong("Abcdefg1");

        assertThat(hash).startsWith("$2").doesNotContain("Abcdefg1");
        assertThat(service.matches("Abcdefg1", hash)).isTrue();
        assertThat(service.matches("Abcdefg2", hash)).isFalse();
        assertThat(service.matches(null, hash)).isFalse();
        assertThat(service.matches("x".repeat(100), hash)).as("over 72 bytes, no exception").isFalse();
    }
}
