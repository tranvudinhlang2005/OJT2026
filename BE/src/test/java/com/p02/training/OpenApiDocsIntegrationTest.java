package com.p02.training;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.p02.training.security.SecurityConfig;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/** springdoc's OpenAPI docs and Swagger UI are public in the dev profile only. */
class OpenApiDocsIntegrationTest {

    @Nested
    @SpringBootTest
    @AutoConfigureMockMvc
    @ActiveProfiles(SecurityConfig.DEV_PROFILE)
    @EnabledIfEnvironmentVariable(named = "DB_PASSWORD", matches = ".+")
    class DevProfile {

        @Autowired
        private MockMvc mockMvc;

        @Test
        void apiDocsAndSwaggerUiArePublic() throws Exception {
            mockMvc.perform(get("/v3/api-docs"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.openapi").exists())
                    .andExpect(jsonPath("$.paths['/api/v1/rooms']").exists())
                    // enums as shared schemas, Bean Validation as required / maxLength
                    .andExpect(jsonPath("$.components.schemas.UserRole.enum.length()").value(4))
                    .andExpect(jsonPath("$.components.schemas.CreateUserRequest.required").isArray())
                    .andExpect(jsonPath("$.components.schemas.CreateUserRequest.properties.email.maxLength").value(255))
                    .andExpect(jsonPath("$.components.schemas.ClassRequest.properties.semester.maxLength").value(20))
                    .andExpect(jsonPath("$.components.schemas.ClassView.oneOf.length()").value(2));
            mockMvc.perform(get("/swagger-ui/index.html")).andExpect(status().isOk());
        }
    }

    @Nested
    @SpringBootTest
    @AutoConfigureMockMvc
    @EnabledIfEnvironmentVariable(named = "DB_PASSWORD", matches = ".+")
    class WithoutDevProfile {

        @Autowired
        private MockMvc mockMvc;

        @Test
        void apiDocsAndSwaggerUiNeedAuthentication() throws Exception {
            mockMvc.perform(get("/v3/api-docs")).andExpect(status().isUnauthorized());
            mockMvc.perform(get("/v3/api-docs/swagger-config")).andExpect(status().isUnauthorized());
            mockMvc.perform(get("/swagger-ui/index.html")).andExpect(status().isUnauthorized());
        }
    }
}
