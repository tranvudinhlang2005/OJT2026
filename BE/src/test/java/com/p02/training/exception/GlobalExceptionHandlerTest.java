package com.p02.training.exception;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Valid;
import jakarta.validation.Validation;
import jakarta.validation.ValidatorFactory;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import java.lang.reflect.Method;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

class GlobalExceptionHandlerTest {

    private static final String SENSITIVE = "SELECT password_hash FROM users";

    private final MockMvc mockMvc = buildMockMvc();

    private static MockMvc buildMockMvc() {
        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();
        return MockMvcBuilders.standaloneSetup(new TestController())
                .setControllerAdvice(new GlobalExceptionHandler())
                .setValidator(validator)
                .build();
    }

    @Test
    void invalidBodyReturns422WithFieldDetails() throws Exception {
        expectError(mockMvc.perform(post("/test/body")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"\"}")),
                422, "VALIDATION_ERROR")
                .andExpect(jsonPath("$.details.name[0]").value("name required"));
    }

    @Test
    void malformedJsonReturns422WithoutParserMessage() throws Exception {
        expectError(mockMvc.perform(post("/test/body")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{not json")),
                422, "VALIDATION_ERROR");
    }

    @Test
    void wrongParameterTypeReturns422() throws Exception {
        expectError(mockMvc.perform(get("/test/number").param("value", "abc")), 422, "VALIDATION_ERROR")
                .andExpect(jsonPath("$.details.value").isArray());
    }

    @Test
    void missingParameterReturns422() throws Exception {
        expectError(mockMvc.perform(get("/test/number")), 422, "VALIDATION_ERROR")
                .andExpect(jsonPath("$.details.value").isArray());
    }

    @Test
    void constraintOnControllerParameterReturns422WithFieldDetails() throws Exception {
        expectError(mockMvc.perform(get("/test/page").param("size", "101")), 422, "VALIDATION_ERROR")
                .andExpect(jsonPath("$.details.size[0]").value("size too large"));
    }

    @Test
    void methodValidationFailureReturns422WithLeafFieldName() throws Exception {
        String body = expectError(mockMvc.perform(get("/test/method-validation")), 422, "VALIDATION_ERROR")
                .andExpect(jsonPath("$.details.size[0]").value("size too large"))
                .andReturn().getResponse().getContentAsString();

        assertThat(body).doesNotContain("page.size");
    }

    @Test
    void wrongMethodKeepsStandardFormat() throws Exception {
        expectError(mockMvc.perform(post("/test/number")), 405, "METHOD_NOT_ALLOWED");
    }

    @Test
    void businessConflictReturnsItsOwnCodeAndMessage() throws Exception {
        expectError(mockMvc.perform(get("/test/conflict")), 409, "CLASS_FULL")
                .andExpect(jsonPath("$.message").value("Lớp học đã đủ sĩ số"));
    }

    @Test
    void sharedApiExceptionUsesSpecMessage() throws Exception {
        expectError(mockMvc.perform(get("/test/not-found")), 404, "NOT_FOUND")
                .andExpect(jsonPath("$.message").value("Không tìm thấy dữ liệu yêu cầu"));
    }

    @Test
    void accessDeniedIsNotSwallowedAs500() throws Exception {
        expectError(mockMvc.perform(get("/test/denied")), 403, "FORBIDDEN");
    }

    @Test
    void authenticationFailureIsNotSwallowedAs500() throws Exception {
        expectError(mockMvc.perform(get("/test/unauthenticated")), 401, "UNAUTHENTICATED");
    }

    @Test
    void optimisticLockFailureReturnsVersionConflict() throws Exception {
        expectError(mockMvc.perform(get("/test/stale")), 409, "VERSION_CONFLICT");
    }

    @Test
    void unexpectedExceptionNeverLeaksInternals() throws Exception {
        String body = expectError(mockMvc.perform(get("/test/boom")), 500, "INTERNAL_ERROR")
                .andExpect(jsonPath("$.message").value("Có lỗi xảy ra, vui lòng thử lại"))
                .andReturn().getResponse().getContentAsString();

        assertThat(body).doesNotContain(SENSITIVE, "IllegalStateException", "stackTrace");
    }

    private static ResultActions expectError(ResultActions result, int status, String code) throws Exception {
        return result
                .andExpect(status().is(status))
                .andExpect(jsonPath("$.code").value(code))
                .andExpect(jsonPath("$.message").isNotEmpty())
                .andExpect(jsonPath("$.details").isMap())
                .andExpect(jsonPath("$.traceId").isNotEmpty());
    }

    record TestBody(@NotBlank(message = "name required") String name) {
    }

    @RestController
    static class TestController {

        @PostMapping("/test/body")
        void body(@Valid @RequestBody TestBody body) {
        }

        @GetMapping("/test/number")
        void number(@RequestParam("value") int value) {
        }

        @GetMapping("/test/page")
        void page(@RequestParam("size") @Max(value = 100, message = "size too large") int size) {
        }

        @GetMapping("/test/method-validation")
        void methodValidation() throws NoSuchMethodException {
            Method page = TestController.class.getDeclaredMethod("page", int.class);
            try (ValidatorFactory factory = Validation.buildDefaultValidatorFactory()) {
                throw new ConstraintViolationException(factory.getValidator().forExecutables()
                        .validateParameters(this, page, new Object[] {101}));
            }
        }

        @GetMapping("/test/conflict")
        void conflict() {
            throw ApiException.conflict("CLASS_FULL", "Lớp học đã đủ sĩ số");
        }

        @GetMapping("/test/not-found")
        void notFound() {
            throw new ApiException(ErrorCode.NOT_FOUND);
        }

        @GetMapping("/test/denied")
        void denied() {
            throw new AccessDeniedException("denied");
        }

        @GetMapping("/test/unauthenticated")
        void unauthenticated() {
            throw new BadCredentialsException("bad");
        }

        @GetMapping("/test/stale")
        void stale() {
            throw new ObjectOptimisticLockingFailureException(Object.class, 1L);
        }

        @GetMapping("/test/boom")
        void boom() {
            throw new IllegalStateException(SENSITIVE);
        }
    }
}
