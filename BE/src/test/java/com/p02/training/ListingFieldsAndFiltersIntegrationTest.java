package com.p02.training;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.p02.training.common.ApiPaths;
import com.p02.training.entity.ClassOffering;
import com.p02.training.entity.Course;
import com.p02.training.entity.Room;
import com.p02.training.entity.User;
import com.p02.training.entity.enums.GradingStatus;
import com.p02.training.entity.enums.UserRole;
import com.p02.training.security.AuthCookies;
import com.p02.training.security.JwtService;
import jakarta.persistence.EntityManager;
import jakarta.servlet.http.Cookie;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * Fields and filters added to the Admin listings: UserResponse createdAt and failedLoginCount,
 * GET /rooms keyword and isActive, GET /classes gradingStatus with submittedAt and returnReason, and
 * the semester of GET /dashboard/classes. Full application against the test database; rolls back.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@EnabledIfEnvironmentVariable(named = "DB_PASSWORD", matches = ".+")
class ListingFieldsAndFiltersIntegrationTest {

    private static final LocalDate START = LocalDate.of(2031, 3, 10);
    private static final Instant SUBMITTED_AT = Instant.parse("2031-04-01T03:00:00Z");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private JwtService jwtService;

    private User admin;
    private Cookie adminToken;
    private String prefix;

    @BeforeEach
    void setUp() {
        prefix = "zq" + Long.toString(System.nanoTime() % 1_000_000_000L, 36);
        admin = persist(new User(prefix + ".admin", prefix + ".admin@test.local", "x".repeat(60), "Admin",
                UserRole.TRAINING_ADMIN));
        entityManager.flush();
        adminToken = new Cookie(AuthCookies.ACCESS_TOKEN, jwtService.issue(admin.getId(), admin.getTokenVersion()));
    }

    @Test
    void userResponseIncludesCreatedAtAndFailedLoginCount() throws Exception {
        User user = persist(new User(prefix + ".mgr", prefix + ".mgr@test.local", "x".repeat(60), "Manager",
                UserRole.TRAINING_MANAGER));
        user.setFailedLoginCount(3);
        entityManager.flush();

        mockMvc.perform(get(ApiPaths.USERS).param("keyword", prefix + ".mgr").cookie(adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.items[0].failedLoginCount").value(3))
                .andExpect(jsonPath("$.items[0].createdAt", notNullValue()))
                .andExpect(jsonPath("$.items[0].lockedUntil").hasJsonPath());
    }

    @Test
    void roomsFilterByCodeKeywordIgnoringCaseAndByStatus() throws Exception {
        persist(new Room(prefix.toUpperCase() + "-A1", 30));
        Room inactive = persist(new Room(prefix.toUpperCase() + "-B2", 40));
        inactive.setActive(false);
        persist(new Room("OTHER-" + prefix.toUpperCase().substring(2), 20));
        entityManager.flush();

        mockMvc.perform(get(ApiPaths.ROOMS).param("keyword", prefix).cookie(adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[*].code",
                        contains(prefix.toUpperCase() + "-A1", prefix.toUpperCase() + "-B2")));

        mockMvc.perform(get(ApiPaths.ROOMS).param("keyword", prefix + "-b").param("isActive", "false")
                        .cookie(adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[*].code", contains(prefix.toUpperCase() + "-B2")));

        mockMvc.perform(get(ApiPaths.ROOMS).param("keyword", prefix).param("isActive", "true").cookie(adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[*].code", contains(prefix.toUpperCase() + "-A1")));

        // Without parameters the list still works as before.
        mockMvc.perform(get(ApiPaths.ROOMS).cookie(adminToken)).andExpect(status().isOk());
    }

    @Test
    void classesFilterByGradingStatusAndShowSubmissionFields() throws Exception {
        Course course = persist(new Course(prefix + "C", "Course " + prefix, 3, 45));
        ClassOffering draft = classOffering(prefix + "-DRAFT", course);
        ClassOffering submitted = classOffering(prefix + "-SUB", course);
        submitted.setGradingStatus(GradingStatus.SUBMITTED);
        submitted.setSubmittedAt(SUBMITTED_AT);
        submitted.setSubmittedBy(admin);
        submitted.setReturnReason("Sai điểm giữa kỳ");
        entityManager.flush();

        mockMvc.perform(get(ApiPaths.CLASSES).param("keyword", prefix).param("gradingStatus", "SUBMITTED")
                        .cookie(adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.items[0].classCode").value(submitted.getClassCode()))
                .andExpect(jsonPath("$.items[0].gradingStatus").value("SUBMITTED"))
                .andExpect(jsonPath("$.items[0].submittedAt").value("2031-04-01T03:00:00Z"))
                .andExpect(jsonPath("$.items[0].returnReason").value("Sai điểm giữa kỳ"));

        mockMvc.perform(get(ApiPaths.CLASSES).param("keyword", prefix).cookie(adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[*].classCode",
                        containsInAnyOrder(draft.getClassCode(), submitted.getClassCode())));

        mockMvc.perform(get(ApiPaths.CLASSES).param("gradingStatus", "UNKNOWN").cookie(adminToken))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void dashboardClassesIncludeTheSemester() throws Exception {
        Course course = persist(new Course(prefix + "D", "Course " + prefix, 3, 45));
        classOffering(prefix + "-DASH", course);
        entityManager.flush();

        mockMvc.perform(get(ApiPaths.DASHBOARD + "/classes").param("courseId", course.getId().toString())
                        .cookie(adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.items[0].semester").value("2031-1"));
    }

    private ClassOffering classOffering(String code, Course course) {
        return persist(new ClassOffering(code, course, "2031-1", START, START.plusMonths(2), 30,
                START.minusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant(), admin));
    }

    private <T> T persist(T entity) {
        entityManager.persist(entity);
        return entity;
    }
}
