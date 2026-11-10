package com.p02.training.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.p02.training.audit.SecurityAuditLogger;
import com.p02.training.common.ApiPaths;
import com.p02.training.config.AppProperties;
import com.p02.training.dto.response.AuthUserResponse;
import com.p02.training.dto.response.PageResponse;
import com.p02.training.entity.enums.SecurityAction;
import com.p02.training.entity.enums.UserRole;
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
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

/** TR01 web security wiring, with services mocked: cookie authentication, role rule, CSRF, rate limit. */
@WebMvcTest
@EnableConfigurationProperties(AppProperties.class)
@Import({SecurityConfig.class, SecurityErrorHandler.class, LoginRateLimiter.class})
@TestPropertySource(properties = "app.cors.allowed-origin=https://frontend.test")
class AuthWebSecurityTest {

    private static final String ADMIN_TOKEN = "admin-token";
    private static final String STUDENT_TOKEN = "student-token";
    private static final String CSRF = "csrf-value";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AccessTokenAuthenticator authenticator;

    @MockitoBean
    private SecurityAuditLogger auditLogger;

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

    @BeforeEach
    void setUp() {
        when(authenticator.authenticate(ADMIN_TOKEN)).thenReturn(Optional.of(
                new AuthenticatedUser(1L, "admin", "Admin", UserRole.TRAINING_ADMIN)));
        when(authenticator.authenticate(STUDENT_TOKEN)).thenReturn(Optional.of(
                new AuthenticatedUser(2L, "student", "Student", UserRole.STUDENT)));
    }

    @Test
    void csrfEndpointIsPublicAndIssuesTheCookie() throws Exception {
        mockMvc.perform(get(ApiPaths.CSRF))
                .andExpect(status().isNoContent())
                .andExpect(cookie().exists("XSRF-TOKEN"));
    }

    @Test
    void loginSetsSecureHttpOnlyStrictCookieAndNeverReturnsTheToken() throws Exception {
        when(authService.login(any())).thenReturn(new AuthService.LoginResult("the-jwt",
                new AuthUserResponse(1L, "Admin", UserRole.TRAINING_ADMIN)));

        MvcResult result = mockMvc.perform(withCsrf(post(ApiPaths.LOGIN))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"admin\",\"password\":\"Secret123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(1))
                .andExpect(jsonPath("$.fullName").value("Admin"))
                .andExpect(jsonPath("$.role").value("TRAINING_ADMIN"))
                .andReturn();

        String setCookie = result.getResponse().getHeaders(HttpHeaders.SET_COOKIE).stream()
                .filter(header -> header.startsWith(AuthCookies.ACCESS_TOKEN + "="))
                .findFirst().orElseThrow();
        assertThat(setCookie).contains("HttpOnly", "Secure", "SameSite=Strict", "Max-Age=1800", "Path=/");
        assertThat(result.getResponse().getContentAsString()).doesNotContain("the-jwt");
    }

    @Test
    void blankLoginFieldsAre422() throws Exception {
        mockMvc.perform(withCsrf(post(ApiPaths.LOGIN))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"\",\"password\":\"\"}"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.details.username").isArray())
                .andExpect(jsonPath("$.details.password").isArray());
    }

    @Test
    void thirtyFirstLoginInAMinuteIs429() throws Exception {
        // Its own address, so other tests' logins in this shared context do not count.
        for (int i = 0; i < 30; i++) {
            mockMvc.perform(loginFrom("10.9.9.9")).andExpect(status().isUnprocessableEntity());
        }
        mockMvc.perform(loginFrom("10.9.9.9"))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value("TOO_MANY_REQUESTS"));
    }

    @Test
    void meReturnsTheUserLoadedFromTheCookie() throws Exception {
        mockMvc.perform(get(ApiPaths.AUTH + "/me").cookie(token(STUDENT_TOKEN)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(2))
                .andExpect(jsonPath("$.role").value("STUDENT"));
    }

    @Test
    void unknownOrRevokedTokenIs401() throws Exception {
        mockMvc.perform(get(ApiPaths.AUTH + "/me").cookie(token("revoked")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
    }

    @Test
    void adminCanListUsers() throws Exception {
        when(userService.listUsers(isNull(), isNull(), isNull(), eq(0), eq(20)))
                .thenReturn(new PageResponse<>(List.of(), 0, 20, 0, 0));

        mockMvc.perform(get(ApiPaths.USERS).cookie(token(ADMIN_TOKEN)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isArray());
    }

    @Test
    void nonAdminIs403AndTheRefusalIsLogged() throws Exception {
        mockMvc.perform(get(ApiPaths.USERS).cookie(token(STUDENT_TOKEN)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));

        verify(auditLogger).recordIndependently(eq(SecurityAction.ACCESS_DENIED), eq("student"), anyMap());
        verify(userService, never()).listUsers(any(), any(), any(), anyInt(), anyInt());
    }

    @Test
    void anonymousUserListIs401() throws Exception {
        mockMvc.perform(get(ApiPaths.USERS))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void loggedInWriteWithoutCsrfIs403CsrfAndIsNotAnAccessDeniedEvent() throws Exception {
        mockMvc.perform(post(ApiPaths.AUTH + "/logout").cookie(token(ADMIN_TOKEN)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("CSRF_INVALID"));

        verify(auditLogger, never()).recordIndependently(any(), any(), anyMap());
        verify(authService, never()).logout(any());
    }

    @Test
    void logoutClearsTheCookie() throws Exception {
        mockMvc.perform(withCsrf(post(ApiPaths.AUTH + "/logout")).cookie(token(ADMIN_TOKEN)))
                .andExpect(status().isNoContent())
                .andExpect(cookie().maxAge(AuthCookies.ACCESS_TOKEN, 0));
    }

    @Test
    void pageSizeOver100Is422() throws Exception {
        mockMvc.perform(get(ApiPaths.USERS).param("size", "101").cookie(token(ADMIN_TOKEN)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    private static MockHttpServletRequestBuilder withCsrf(MockHttpServletRequestBuilder builder) {
        return builder.cookie(csrfCookie()).header(SecurityConfig.CSRF_HEADER, CSRF);
    }

    private static MockHttpServletRequestBuilder loginFrom(String ip) {
        return withCsrf(post(ApiPaths.LOGIN))
                .with(request -> {
                    request.setRemoteAddr(ip);
                    return request;
                })
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}");
    }

    private static Cookie csrfCookie() {
        return new Cookie("XSRF-TOKEN", CSRF);
    }

    private static Cookie token(String value) {
        return new Cookie(AuthCookies.ACCESS_TOKEN, value);
    }
}
