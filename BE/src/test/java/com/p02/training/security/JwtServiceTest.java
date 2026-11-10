package com.p02.training.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.p02.training.config.JwtProperties;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Base64;
import org.junit.jupiter.api.Test;

class JwtServiceTest {

    private static final String SECRET = "unit-test-secret-that-is-at-least-32-bytes";
    private static final Instant NOW = Instant.parse("2026-11-10T03:00:00Z");

    private final ObjectMapper objectMapper = new ObjectMapper();

    private JwtService service(String secret, Instant now) {
        return new JwtService(new JwtProperties(secret), objectMapper, Clock.fixed(now, ZoneOffset.UTC));
    }

    @Test
    void issuedTokenVerifiesWithItsClaims() {
        String token = service(SECRET, NOW).issue(42L, 7);

        JwtService.AccessTokenClaims claims = service(SECRET, NOW).verify(token).orElseThrow();
        assertThat(claims.userId()).isEqualTo(42L);
        assertThat(claims.tokenVersion()).isEqualTo(7);
        assertThat(claims.expiresAt()).isEqualTo(NOW.plus(Duration.ofMinutes(30)));
    }

    @Test
    void headerIsHs256AndPayloadHasOnlyTheSpecClaims() throws Exception {
        String[] parts = service(SECRET, NOW).issue(42L, 7).split("\\.");

        assertThat(objectMapper.readTree(decode(parts[0])).get("alg").asText()).isEqualTo("HS256");
        assertThat(objectMapper.readTree(decode(parts[1])).fieldNames())
                .toIterable().containsExactly("sub", "tv", "iat", "exp");
    }

    @Test
    void tokenIsRejectedAtExpiry() {
        String token = service(SECRET, NOW).issue(1L, 0);

        assertThat(service(SECRET, NOW.plus(Duration.ofMinutes(30)).minusSeconds(1)).verify(token)).isPresent();
        assertThat(service(SECRET, NOW.plus(Duration.ofMinutes(30))).verify(token)).isEmpty();
    }

    @Test
    void tokenSignedWithAnotherKeyIsRejected() {
        String token = service("another-secret-that-is-also-32-bytes-long", NOW).issue(1L, 0);

        assertThat(service(SECRET, NOW).verify(token)).isEmpty();
    }

    @Test
    void modifiedPayloadIsRejected() {
        String[] parts = service(SECRET, NOW).issue(1L, 0).split("\\.");
        String forgedPayload = encode("{\"sub\":\"2\",\"tv\":0,\"iat\":0,\"exp\":9999999999}");

        assertThat(service(SECRET, NOW).verify(parts[0] + "." + forgedPayload + "." + parts[2])).isEmpty();
    }

    @Test
    void unsignedAlgNoneTokenIsRejected() {
        String token = encode("{\"alg\":\"none\",\"typ\":\"JWT\"}") + "."
                + encode("{\"sub\":\"1\",\"tv\":0,\"iat\":0,\"exp\":9999999999}") + ".";

        assertThat(service(SECRET, NOW).verify(token)).isEmpty();
    }

    @Test
    void malformedTokensAreRejected() {
        JwtService service = service(SECRET, NOW);

        assertThat(service.verify(null)).isEmpty();
        assertThat(service.verify("")).isEmpty();
        assertThat(service.verify("abc")).isEmpty();
        assertThat(service.verify("a.b.c.d")).isEmpty();
        assertThat(service.verify("!!.??.**")).isEmpty();
        assertThat(service.verify("x".repeat(5000))).isEmpty();
    }

    @Test
    void shortSecretStopsStartupWithoutRevealingIt() {
        assertThatThrownBy(() -> service("too-short", NOW))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageNotContaining("too-short");
    }

    @Test
    void propertiesNeverPrintTheSecret() {
        assertThat(new JwtProperties(SECRET).toString()).doesNotContain(SECRET);
    }

    private static byte[] decode(String part) {
        return Base64.getUrlDecoder().decode(part);
    }

    private static String encode(String json) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(json.getBytes(StandardCharsets.UTF_8));
    }
}
