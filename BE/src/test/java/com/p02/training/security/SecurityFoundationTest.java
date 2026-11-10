package com.p02.training.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.p02.training.TrainingManagementApplication;
import com.p02.training.audit.SecurityAuditLogger;
import com.p02.training.common.ApiPaths;
import com.p02.training.common.TraceIdFilter;
import com.p02.training.config.AppProperties;
import com.p02.training.service.AttendanceService;
import com.p02.training.service.AuthService;
import com.p02.training.service.ClassInstructorService;
import com.p02.training.service.ClassQueryService;
import com.p02.training.service.ClassRosterService;
import com.p02.training.service.ClassService;
import com.p02.training.service.CourseService;
import com.p02.training.service.DashboardService;
import com.p02.training.service.EnrollmentService;
import com.p02.training.service.InstructorService;
import com.p02.training.service.ResultConfirmationService;
import com.p02.training.service.ResultService;
import com.p02.training.service.RoomService;
import com.p02.training.service.ScheduleService;
import com.p02.training.service.SessionService;
import com.p02.training.service.StudentService;
import com.p02.training.service.UserService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@WebMvcTest
@EnableConfigurationProperties(AppProperties.class)
@Import({SecurityConfig.class, SecurityErrorHandler.class, LoginRateLimiter.class})
@TestPropertySource(properties = "app.cors.allowed-origin=https://frontend.test")
class SecurityFoundationTest {

    private static final String ANY_ENDPOINT = ApiPaths.V1 + "/anything";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // Collaborators of the security filters and of every controller (TR01-TR03). With no
    // access-token cookie the authenticator is never asked, so these tests still exercise only
    // the security baseline.
    @MockitoBean
    private AccessTokenAuthenticator accessTokenAuthenticator;

    @MockitoBean
    private SecurityAuditLogger securityAuditLogger;

    @MockitoBean
    private AuthService authService;

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private CourseService courseService;

    @MockitoBean
    private InstructorService instructorService;

    @MockitoBean
    private StudentService studentService;

    @MockitoBean
    private ClassService classService;

    @MockitoBean
    private ClassInstructorService classInstructorService;

    @MockitoBean
    private SessionService sessionService;

    @MockitoBean
    private RoomService roomService;

    @MockitoBean
    private ClassQueryService classQueryService;

    @MockitoBean
    private ClassRosterService classRosterService;

    @MockitoBean
    private EnrollmentService enrollmentService;

    @MockitoBean
    private AttendanceService attendanceService;

    @MockitoBean
    private ResultService resultService;

    @MockitoBean
    private ResultConfirmationService resultConfirmationService;

    @MockitoBean
    private ScheduleService scheduleService;

    @MockitoBean
    private DashboardService dashboardService;

    @Test
    void anonymousRequestReturns401InStandardFormat() throws Exception {
        MvcResult result = mockMvc.perform(get(ANY_ENDPOINT))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"))
                .andExpect(jsonPath("$.message").value("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại"))
                .andExpect(jsonPath("$.details").isMap())
                .andReturn();

        String traceId = result.getResponse().getHeader(TraceIdFilter.RESPONSE_HEADER);
        assertThat(traceId).isNotBlank();
        assertThat(result.getResponse().getContentAsString()).contains(traceId);
    }

    @Test
    void anonymousWriteWithoutCsrfIs401BecauseSessionIsCheckedFirst() throws Exception {
        mockMvc.perform(post(ANY_ENDPOINT))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
    }

    @Test
    void loginWithoutCsrfIs403() throws Exception {
        mockMvc.perform(post(ApiPaths.LOGIN))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("CSRF_INVALID"));
    }

    @Test
    void authenticatedWriteWithoutCsrfIs403() throws Exception {
        mockMvc.perform(post(ANY_ENDPOINT).with(user("demo")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("CSRF_INVALID"));
    }

    @Test
    void mismatchedCsrfHeaderIs403() throws Exception {
        mockMvc.perform(post(ANY_ENDPOINT).with(user("demo"))
                        .cookie(new Cookie("XSRF-TOKEN", "cookie-value"))
                        .header(SecurityConfig.CSRF_HEADER, "other-value"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("CSRF_INVALID"));
    }

    @Test
    void matchingDoubleSubmitTokenPassesCsrf() throws Exception {
        mockMvc.perform(post(ANY_ENDPOINT).with(user("demo"))
                        .cookie(new Cookie("XSRF-TOKEN", "same-value"))
                        .header(SecurityConfig.CSRF_HEADER, "same-value"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));
    }

    @Test
    void csrfCookieIsReadableSecureAndStrict() throws Exception {
        mockMvc.perform(post(ApiPaths.LOGIN))
                .andExpect(cookie().exists("XSRF-TOKEN"))
                .andExpect(cookie().httpOnly("XSRF-TOKEN", false))
                .andExpect(cookie().secure("XSRF-TOKEN", true))
                .andExpect(cookie().sameSite("XSRF-TOKEN", "Strict"))
                .andExpect(cookie().path("XSRF-TOKEN", "/"));
    }

    @Test
    void corsAllowsOnlyTheFrontendOrigin() throws Exception {
        mockMvc.perform(options(ANY_ENDPOINT)
                        .header(HttpHeaders.ORIGIN, "https://frontend.test")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "https://frontend.test"))
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS, "true"));

        mockMvc.perform(options(ANY_ENDPOINT)
                        .header(HttpHeaders.ORIGIN, "https://evil.test")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST"))
                .andExpect(status().isForbidden())
                .andExpect(header().doesNotExist(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN));
    }

    @Test
    void corsPermitsOnlyTheExpectedHeadersAndExposesTraceId() throws Exception {
        mockMvc.perform(options(ANY_ENDPOINT)
                        .header(HttpHeaders.ORIGIN, "https://frontend.test")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, SecurityConfig.CSRF_HEADER))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_HEADERS, SecurityConfig.CSRF_HEADER));

        mockMvc.perform(options(ANY_ENDPOINT)
                        .header(HttpHeaders.ORIGIN, "https://frontend.test")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "X-Not-Allowed"))
                .andExpect(status().isForbidden());

        mockMvc.perform(get(ANY_ENDPOINT).header(HttpHeaders.ORIGIN, "https://frontend.test"))
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_EXPOSE_HEADERS, TraceIdFilter.RESPONSE_HEADER));
    }

    @Test
    void httpBasicIsNotAccepted() throws Exception {
        mockMvc.perform(get(ANY_ENDPOINT).header(HttpHeaders.AUTHORIZATION, "Basic ZGVtbzpkZW1v"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"))
                .andExpect(header().doesNotExist(HttpHeaders.WWW_AUTHENTICATE));
    }

    @Test
    void noDefaultLoginPageExists() throws Exception {
        mockMvc.perform(get("/login"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
    }

    @Test
    void noDefaultLogoutEndpointExists() throws Exception {
        mockMvc.perform(post("/logout").with(user("demo"))
                        .cookie(new Cookie("XSRF-TOKEN", "same-value"))
                        .header(SecurityConfig.CSRF_HEADER, "same-value"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));
    }

    @Test
    void requestsDoNotCreateAnHttpSession() throws Exception {
        MvcResult result = mockMvc.perform(get(ANY_ENDPOINT)).andReturn();

        assertThat(result.getRequest().getSession(false)).isNull();
        assertThat(result.getResponse().getCookie("JSESSIONID")).isNull();
    }

    @Test
    void traceIdIsAlwaysGeneratedByTheServer() throws Exception {
        MvcResult result = mockMvc.perform(get(ANY_ENDPOINT).header(TraceIdFilter.RESPONSE_HEADER, "client-value"))
                .andReturn();

        String traceId = result.getResponse().getHeader(TraceIdFilter.RESPONSE_HEADER);
        assertThat(traceId).isNotBlank().isNotEqualTo("client-value");
        assertThat(result.getResponse().getContentAsString()).doesNotContain("client-value");
    }

    @Test
    void defaultSpringSecurityUserStaysDisabled() {
        SpringBootApplication application =
                TrainingManagementApplication.class.getAnnotation(SpringBootApplication.class);

        assertThat(application.exclude()).contains(UserDetailsServiceAutoConfiguration.class);
    }

    @Test
    void passwordEncoderIsBcrypt() {
        assertThat(passwordEncoder.encode("Demo12345")).startsWith("$2");
    }
}
