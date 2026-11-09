package com.p02.training.config;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.ZoneId;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties("app")
public record AppProperties(@NotNull ZoneId businessZone, @NotNull @Valid Cors cors) {

    public record Cors(@NotBlank String allowedOrigin) {
    }
}
