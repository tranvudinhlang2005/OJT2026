package com.p02.training;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.p02.training.common.ApiPaths;
import com.p02.training.config.ActiveAdminStartupCheck;
import com.p02.training.entity.User;
import com.p02.training.entity.enums.UserRole;
import com.p02.training.repository.UserRepository;
import com.p02.training.security.AuthCookies;
import com.p02.training.security.JwtService;
import com.p02.training.security.SecurityConfig;
import jakarta.persistence.EntityManager;
import jakarta.servlet.http.Cookie;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.context.ApplicationContext;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

/**
 * How Training Admins come to exist: never created by the application or through POST /users, only
 * inserted in the database (scripts/create-first-admin.sql) or promoted from TRAINING_MANAGER by
 * another Admin. Full application against the test database; every test rolls back.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@ExtendWith(OutputCaptureExtension.class)
@EnabledIfEnvironmentVariable(named = "DB_PASSWORD", matches = ".+")
class AdminProvisioningIntegrationTest {

    private static final String CSRF = "csrf-value";
    private static final String PASSWORD = "Manager123";
    private static final Path FIRST_ADMIN_SCRIPT = Path.of("scripts", "create-first-admin.sql");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository users;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private JdbcTemplate jdbc;

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private ActiveAdminStartupCheck startupCheck;

    @Autowired
    private ApplicationContext context;

    private int sequence;
    private User adminA;

    @BeforeEach
    void createActingAdmin() {
        adminA = user(UserRole.TRAINING_ADMIN);
    }

    // ---- 1. Startup ---------------------------------------------------------------------------

    @Test
    void startupWithNoActiveAdminOnlyWarnsAndCreatesNothing(CapturedOutput output) {
        jdbc.update("UPDATE users SET is_active = FALSE WHERE role = 'TRAINING_ADMIN'");
        long adminRows = countAdminRows();

        startupCheck.run(null);

        assertThat(countAdminRows()).isEqualTo(adminRows);
        assertThat(users.countByRoleAndActiveTrue(UserRole.TRAINING_ADMIN)).isZero();
        assertThat(output).contains(ActiveAdminStartupCheck.NO_ACTIVE_ADMIN_WARNING);
        assertThat(Arrays.stream(context.getBeanDefinitionNames())
                .map(name -> context.getType(name))
                .filter(type -> type != null && type.getName().contains("bootstrap")))
                .isEmpty();
    }

    // ---- 2. First Admin from the SQL script -----------------------------------------------------

    @Test
    void firstAdminScriptCreatesAnAdminWhosePgcryptoHashBcryptAccepts() throws IOException {
        jdbc.update("UPDATE users SET is_active = FALSE WHERE role = 'TRAINING_ADMIN'");

        jdbc.execute(firstAdminScript("first.admin", "first.admin@test.local", "FirstAdmin1"));

        Map<String, Object> row = jdbc.queryForMap(
                "SELECT role, is_active, password_hash FROM users WHERE username = 'first.admin'");
        assertThat(row.get("role")).isEqualTo("TRAINING_ADMIN");
        assertThat(row.get("is_active")).isEqualTo(true);
        String hash = (String) row.get("password_hash");
        assertThat(hash).startsWith("$2a$10$");
        assertThat(passwordEncoder.matches("FirstAdmin1", hash)).isTrue();
        assertThat(passwordEncoder.matches("firstadmin1", hash)).isFalse();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM app_security_log WHERE action = 'USER_CREATE' "
                + "AND details ->> 'username' = 'first.admin'", Long.class)).isEqualTo(1);
    }

    @Test
    void firstAdminScriptRefusesWhenAnActiveAdminExists() {
        assertThatThrownBy(() -> jdbc.execute(firstAdminScript("second.admin", "second@test.local", "SecondAdmin1")))
                .hasMessageContaining("Đã có TRAINING_ADMIN đang hoạt động");
    }

    @Test
    void firstAdminScriptRefusesAWeakPassword() {
        jdbc.update("UPDATE users SET is_active = FALSE WHERE role = 'TRAINING_ADMIN'");

        assertThatThrownBy(() -> jdbc.execute(firstAdminScript("weak.admin", "weak@test.local", "alllowercase1")))
                .hasMessageContaining("Mật khẩu phải từ 8–64 ký tự");
    }

    // ---- 3. No Admin through POST /users --------------------------------------------------------

    @Test
    void createUserWithAdminRoleIsRefusedAndCreatesNothing() throws Exception {
        String body = """
                {"username":"new.admin","email":"new.admin@test.local","password":"Admin12345",
                 "fullName":"New Admin","role":"TRAINING_ADMIN"}""";

        mockMvc.perform(withCsrf(post(ApiPaths.USERS)).cookie(tokenOf(adminA))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("ROLE_CHANGE_NOT_ALLOWED"))
                .andExpect(jsonPath("$.message").value("Không thể tạo trực tiếp tài khoản Training Admin. "
                        + "Hãy tạo tài khoản Training Manager rồi để Admin khác cấp quyền."));

        assertThat(users.existsByUsernameIgnoringCase("new.admin")).isFalse();
    }

    // ---- 4. Promotion by another Admin ----------------------------------------------------------

    @Test
    void adminPromotesManagerWhoMustSignInAgainAsAdmin() throws Exception {
        User managerB = user(UserRole.TRAINING_MANAGER);
        Cookie oldTokenOfB = tokenOf(managerB);
        int oldTokenVersion = managerB.getTokenVersion();

        changeRole(adminA, managerB, UserRole.TRAINING_ADMIN)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("TRAINING_ADMIN"));

        // token_version + 1: B's existing session no longer works.
        assertThat(managerB.getTokenVersion()).isEqualTo(oldTokenVersion + 1);
        mockMvc.perform(get(ApiPaths.AUTH + "/me").cookie(oldTokenOfB)).andExpect(status().isUnauthorized());

        MvcResult login = mockMvc.perform(withCsrf(post(ApiPaths.LOGIN))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"" + managerB.getUsername() + "\",\"password\":\"" + PASSWORD + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("TRAINING_ADMIN"))
                .andReturn();
        Cookie newTokenOfB = login.getResponse().getCookie(AuthCookies.ACCESS_TOKEN);
        mockMvc.perform(get(ApiPaths.USERS).cookie(newTokenOfB)).andExpect(status().isOk());

        entityManager.flush();
        Map<String, Object> log = jdbc.queryForMap("""
                SELECT username, details ->> 'username' AS target, details ->> 'oldRole' AS old_role,
                       details ->> 'newRole' AS new_role
                FROM app_security_log WHERE action = 'ROLE_CHANGE' AND (details ->> 'userId')::bigint = ?
                """, managerB.getId());
        assertThat(log).containsEntry("username", adminA.getUsername())
                .containsEntry("target", managerB.getUsername())
                .containsEntry("old_role", "TRAINING_MANAGER")
                .containsEntry("new_role", "TRAINING_ADMIN");
    }

    @Test
    void nonAdminsCannotChangeRoles() throws Exception {
        User target = user(UserRole.TRAINING_MANAGER);
        for (UserRole role : new UserRole[] {UserRole.TRAINING_MANAGER, UserRole.INSTRUCTOR, UserRole.STUDENT}) {
            changeRole(user(role), target, UserRole.TRAINING_ADMIN)
                    .andExpect(status().isForbidden());
        }
        assertThat(target.getRole()).isEqualTo(UserRole.TRAINING_MANAGER);
    }

    @Test
    void adminCannotChangeTheirOwnRole() throws Exception {
        user(UserRole.TRAINING_ADMIN); // so LAST_ADMIN is not what refuses the demotion
        for (UserRole role : new UserRole[] {UserRole.TRAINING_ADMIN, UserRole.TRAINING_MANAGER}) {
            changeRole(adminA, adminA, role)
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.code").value("SELF_MODIFICATION"));
        }
        assertThat(adminA.getRole()).isEqualTo(UserRole.TRAINING_ADMIN);
    }

    @Test
    void studentsAndInstructorsCannotBePromotedToAdmin() throws Exception {
        for (UserRole role : new UserRole[] {UserRole.STUDENT, UserRole.INSTRUCTOR}) {
            User target = user(role);
            changeRole(adminA, target, UserRole.TRAINING_ADMIN)
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.code").value("ROLE_CHANGE_NOT_ALLOWED"));
            assertThat(target.getRole()).isEqualTo(role);
        }
    }

    @Test
    void lockedManagerCannotBePromoted() throws Exception {
        User locked = user(UserRole.TRAINING_MANAGER);
        locked.setActive(false);

        changeRole(adminA, locked, UserRole.TRAINING_ADMIN)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("USER_INACTIVE"));
        assertThat(locked.getRole()).isEqualTo(UserRole.TRAINING_MANAGER);
    }

    // ---- helpers -------------------------------------------------------------------------------

    private ResultActions changeRole(User actor, User target, UserRole role)
            throws Exception {
        return mockMvc.perform(withCsrf(patch(ApiPaths.USERS + "/" + target.getId() + "/role"))
                .cookie(tokenOf(actor))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"role\":\"" + role.name() + "\"}"));
    }

    private User user(UserRole role) {
        String name = "prov." + role.name().toLowerCase() + "." + (++sequence);
        User user = new User(name, name + "@test.local", passwordEncoder.encode(PASSWORD), "Name " + name, role);
        return users.saveAndFlush(user);
    }

    private Cookie tokenOf(User user) {
        return new Cookie(AuthCookies.ACCESS_TOKEN, jwtService.issue(user.getId(), user.getTokenVersion()));
    }

    private static MockHttpServletRequestBuilder withCsrf(MockHttpServletRequestBuilder builder) {
        return builder.cookie(new Cookie("XSRF-TOKEN", CSRF)).header(SecurityConfig.CSRF_HEADER, CSRF);
    }

    private long countAdminRows() {
        return jdbc.queryForObject("SELECT COUNT(*) FROM users WHERE role = 'TRAINING_ADMIN'", Long.class);
    }

    private static String firstAdminScript(String username, String email, String password) throws IOException {
        String script = Files.readString(FIRST_ADMIN_SCRIPT, StandardCharsets.UTF_8);
        return replaceOnce(replaceOnce(replaceOnce(script,
                "v_username  TEXT := 'admin';", "v_username  TEXT := '" + username + "';"),
                "v_email     TEXT := 'admin@example.com';", "v_email     TEXT := '" + email + "';"),
                "v_password  TEXT := 'CHANGE_ME';", "v_password  TEXT := '" + password + "';");
    }

    private static String replaceOnce(String text, String target, String replacement) {
        assertThat(text).contains(target);
        return text.replace(target, replacement);
    }
}
