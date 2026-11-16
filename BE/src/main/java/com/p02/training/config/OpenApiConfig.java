package com.p02.training.config;

import io.swagger.v3.core.jackson.ModelResolver;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI document served by springdoc ({@code /v3/api-docs}, public in the dev profile only; see
 * SecurityConfig and application.yml).
 *
 * <p>Java enums become named schemas ({@code $ref: UserRole}) instead of inline string lists, so
 * client generators such as openapi-typescript emit one shared union type per enum. Bean Validation
 * on record components ({@code @NotNull}, {@code @NotBlank}, {@code @Size}, {@code @Min},
 * {@code @Max}, {@code @Pattern}) is read by swagger-core and appears as {@code required},
 * {@code minLength}/{@code maxLength}, {@code minimum}/{@code maximum} and {@code pattern}.
 */
@Configuration(proxyBeanMethods = false)
public class OpenApiConfig {

    static {
        enableEnumsAsRef();
    }

    /** Idempotent; also called by tests that build schemas without a Spring context. */
    public static void enableEnumsAsRef() {
        ModelResolver.enumsAsRef = true;
    }

    @Bean
    public OpenAPI trainingManagementOpenApi() {
        return new OpenAPI().info(new Info()
                .title("P02 Training Management API")
                .version("v1")
                .description("Authentication uses the httpOnly ACCESS_TOKEN cookie from POST /api/v1/auth/login. "
                        + "Writes need the X-XSRF-TOKEN header echoing the XSRF-TOKEN cookie "
                        + "(GET /api/v1/auth/csrf)."));
    }
}
