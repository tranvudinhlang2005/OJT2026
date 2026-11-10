package com.p02.training.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.p02.training.config.JwtProperties;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Component;

/**
 * Issues and verifies the HS256 access token from spec 0.2, with claims {@code sub} (user id),
 * {@code tv} (token_version), {@code iat} and {@code exp}.
 *
 * <p>Uses the JDK's HMAC-SHA256 so no JWT library is needed. Verification always recomputes the
 * signature with HS256 and this key, whatever the header says, so "alg": "none" or algorithm
 * substitution cannot pass; a header naming any other algorithm is rejected as well.
 */
@Component
public class JwtService {

    public static final Duration TOKEN_LIFETIME = Duration.ofMinutes(30);

    private static final String HMAC_ALGORITHM = "HmacSHA256";
    private static final String JWT_ALGORITHM = "HS256";
    // RFC 7518 3.2: an HS256 key must be at least as long as the hash output.
    private static final int MIN_SECRET_BYTES = 32;
    private static final int MAX_TOKEN_LENGTH = 2048;

    private static final Base64.Encoder ENCODER = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder DECODER = Base64.getUrlDecoder();
    private static final String ENCODED_HEADER =
            ENCODER.encodeToString("{\"alg\":\"HS256\",\"typ\":\"JWT\"}".getBytes(StandardCharsets.UTF_8));

    private final SecretKeySpec key;
    private final ObjectMapper objectMapper;
    private final Clock clock;

    public JwtService(JwtProperties properties, ObjectMapper objectMapper, Clock clock) {
        byte[] secret = properties.secret().getBytes(StandardCharsets.UTF_8);
        if (secret.length < MIN_SECRET_BYTES) {
            // Never include the value itself.
            throw new IllegalStateException("app.jwt.secret must be at least " + MIN_SECRET_BYTES + " bytes");
        }
        this.key = new SecretKeySpec(secret, HMAC_ALGORITHM);
        this.objectMapper = objectMapper;
        this.clock = clock;
    }

    public String issue(long userId, int tokenVersion) {
        Instant now = clock.instant();
        Map<String, Object> claims = new LinkedHashMap<>();
        claims.put("sub", Long.toString(userId));
        claims.put("tv", tokenVersion);
        claims.put("iat", now.getEpochSecond());
        claims.put("exp", now.plus(TOKEN_LIFETIME).getEpochSecond());
        try {
            String payload = ENCODER.encodeToString(objectMapper.writeValueAsBytes(claims));
            String signingInput = ENCODED_HEADER + "." + payload;
            return signingInput + "." + ENCODER.encodeToString(sign(signingInput));
        } catch (Exception ex) {
            throw new IllegalStateException("Could not issue access token", ex);
        }
    }

    /** Returns the claims of a well-formed, correctly signed, unexpired token, or empty otherwise. */
    public Optional<AccessTokenClaims> verify(String token) {
        if (token == null || token.isEmpty() || token.length() > MAX_TOKEN_LENGTH) {
            return Optional.empty();
        }
        int first = token.indexOf('.');
        int second = first < 0 ? -1 : token.indexOf('.', first + 1);
        if (second < 0 || token.indexOf('.', second + 1) >= 0) {
            return Optional.empty();
        }
        try {
            String signingInput = token.substring(0, second);
            byte[] actual = DECODER.decode(token.substring(second + 1));
            if (!MessageDigest.isEqual(sign(signingInput), actual)) {
                return Optional.empty();
            }
            JsonNode header = objectMapper.readTree(DECODER.decode(token.substring(0, first)));
            if (!JWT_ALGORITHM.equals(header.path("alg").asText(null))) {
                return Optional.empty();
            }
            JsonNode payload = objectMapper.readTree(DECODER.decode(token.substring(first + 1, second)));
            JsonNode sub = payload.get("sub");
            JsonNode tv = payload.get("tv");
            JsonNode exp = payload.get("exp");
            if (sub == null || !sub.isTextual() || tv == null || !tv.isInt()
                    || exp == null || !exp.isIntegralNumber()) {
                return Optional.empty();
            }
            Instant expiresAt = Instant.ofEpochSecond(exp.asLong());
            if (!clock.instant().isBefore(expiresAt)) {
                return Optional.empty();
            }
            return Optional.of(new AccessTokenClaims(Long.parseLong(sub.asText()), tv.asInt(), expiresAt));
        } catch (Exception ex) {
            // Malformed Base64, JSON or number: treated as no token. Never logged, it may be a real token.
            return Optional.empty();
        }
    }

    private byte[] sign(String signingInput) throws GeneralSecurityException {
        Mac mac = Mac.getInstance(HMAC_ALGORITHM);
        mac.init(key);
        return mac.doFinal(signingInput.getBytes(StandardCharsets.US_ASCII));
    }

    public record AccessTokenClaims(long userId, int tokenVersion, Instant expiresAt) {
    }
}
