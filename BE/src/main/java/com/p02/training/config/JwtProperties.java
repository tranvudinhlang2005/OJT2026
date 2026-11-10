package com.p02.training.config;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * Signing key for the HS256 access token (spec 0.2). It comes only from the environment and has no
 * default. {@link #toString()} hides it, so it cannot reach a log through this object.
 */
@Validated
@ConfigurationProperties("app.jwt")
public record JwtProperties(@NotBlank String secret) {

    @Override
    public String toString() {
        return "JwtProperties[secret=***]";
    }
}
