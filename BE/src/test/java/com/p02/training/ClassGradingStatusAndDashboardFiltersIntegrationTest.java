package com.p02.training;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.p02.training.common.ApiPaths;
import com.p02.training.entity.ClassOffering;
import com.p02.training.entity.Course;
import com.p02.training.entity.Instructor;
import com.p02.training.entity.Student;
import com.p02.training.entity.User;
import com.p02.training.entity.enums.ClassStatus;
import com.p02.training.entity.enums.GradingStatus;
import com.p02.training.entity.enums.UserRole;
import com.p02.training.repository.TestData;
import com.p02.training.security.AuthCookies;
import com.p02.training.security.JwtService;
import jakarta.persistence.EntityManager;
import jakarta.servlet.http.Cookie;
import java.math.BigDecimal;
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
 * IA fixes: gradingStatus in ClassSummaryResponse only for the assigned Instructor (TR09/TR15), the
 * from/to filter of GET /dashboard/classes and GET /dashboard/semesters (TR18). Full application
 * against the test database; rolls back.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@EnabledIfEnvironmentVariable(named = "DB_PASSWORD", matches = ".+")
class ClassGradingStatusAndDashboardFiltersIntegrationTest {

    private static final LocalDate START = LocalDate.of(2032, 3, 10);

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private JwtService jwtService;

    private TestData testData;
    private String prefix;
    private User admin;
    private Course course;
    private Instructor classInstructor;

    @BeforeEach
    void setUp() {
        testData = new TestData(entityManager);
        prefix = "zg" + Long.toString(System.nanoTime() % 1_000_000_000L, 36);
        admin = user("admin", UserRole.TRAINING_ADMIN);
        course = persist(new Course(prefix + "C", "Course " + prefix, 3, 45));
        classInstructor = testData.instructor();
    }

    @Test
    void onlyTheAssignedInstructorSeesGradingStatus() throws Exception {
        Instructor assigned = testData.instructor();
        Instructor other = testData.instructor();
        ClassOffering classOffering = openClass(prefix + "-G", "2032-HK1", START, assigned);
        classOffering.setGradingStatus(GradingStatus.SUBMITTED);
        User student = user("st", UserRole.STUDENT);
        persist(new Student(student, prefix.toUpperCase() + "ST"));
        User manager = user("mgr", UserRole.TRAINING_MANAGER);
        entityManager.flush();
        String id = classOffering.getId().toString();

        Cookie own = token(assigned.getUser());
        mockMvc.perform(get(ApiPaths.CLASSES).param("instructorId", assigned.getId().toString()).cookie(own))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].classCode").value(classOffering.getClassCode()))
                .andExpect(jsonPath("$.items[0].gradingStatus").value("SUBMITTED"));
        mockMvc.perform(get(ApiPaths.CLASSES + "/" + id).cookie(own))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.gradingStatus").value("SUBMITTED"));

        for (User viewer : new User[] {other.getUser(), student, manager}) {
            Cookie cookie = token(viewer);
            mockMvc.perform(get(ApiPaths.CLASSES).param("instructorId", assigned.getId().toString()).cookie(cookie))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.items[0].classCode").value(classOffering.getClassCode()))
                    .andExpect(jsonPath("$.items[0].gradingStatus").doesNotExist());
            mockMvc.perform(get(ApiPaths.CLASSES + "/" + id).cookie(cookie))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.gradingStatus").doesNotExist());
        }
    }

    @Test
    void dashboardClassesApplyTheSameDateFilterAsTheSummary() throws Exception {
        ClassOffering before = openClass(prefix + "-A", "2032-HK1", START.minusDays(1), classInstructor);
        ClassOffering first = openClass(prefix + "-B", "2032-HK1", START, classInstructor);
        ClassOffering last = openClass(prefix + "-C", "2032-HK1", START.plusDays(30), classInstructor);
        ClassOffering after = openClass(prefix + "-D", "2032-HK1", START.plusDays(31), classInstructor);
        entityManager.flush();
        Cookie cookie = token(admin);
        String courseId = course.getId().toString();
        String from = START.toString();
        String to = START.plusDays(30).toString();

        mockMvc.perform(get(ApiPaths.DASHBOARD + "/classes").param("courseId", courseId)
                        .param("from", from).param("to", to).cookie(cookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.items[*].classCode",
                        containsInAnyOrder(first.getClassCode(), last.getClassCode())));
        mockMvc.perform(get(ApiPaths.DASHBOARD + "/summary").param("courseId", courseId)
                        .param("from", from).param("to", to).cookie(cookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.classCountsByStatus.OPEN").value(2));

        mockMvc.perform(get(ApiPaths.DASHBOARD + "/classes").param("courseId", courseId).cookie(cookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[*].classCode", contains(before.getClassCode(), first.getClassCode(),
                        last.getClassCode(), after.getClassCode())));

        mockMvc.perform(get(ApiPaths.DASHBOARD + "/classes").param("from", to).param("to", from).cookie(cookie))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    void dashboardSemestersListDistinctSemestersNewestFirstWithoutDeletedClasses() throws Exception {
        openClass(prefix + "-S1", "2097-HK2", START, classInstructor);
        openClass(prefix + "-S2", "2098-HK1", START, classInstructor);
        openClass(prefix + "-S3", "2098-HK1", START, classInstructor);
        openClass(prefix + "-S4", "2098-HK2", START, classInstructor);
        ClassOffering deleted = openClass(prefix + "-S5", "2099-HK1", START, classInstructor);
        entityManager.flush();
        entityManager.createNativeQuery("UPDATE class_offering SET deleted_at = now() WHERE id = :id")
                .setParameter("id", deleted.getId()).executeUpdate();

        mockMvc.perform(get(ApiPaths.DASHBOARD + "/semesters").cookie(token(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0]").value("2098-HK2"))
                .andExpect(jsonPath("$[1]").value("2098-HK1"))
                .andExpect(jsonPath("$[2]").value("2097-HK2"))
                .andExpect(jsonPath("$", not(hasItem("2099-HK1"))));
        mockMvc.perform(get(ApiPaths.DASHBOARD + "/semesters").cookie(token(user("mgr", UserRole.TRAINING_MANAGER))))
                .andExpect(status().isOk());

        mockMvc.perform(get(ApiPaths.DASHBOARD + "/semesters").cookie(token(user("st", UserRole.STUDENT))))
                .andExpect(status().isForbidden());
        mockMvc.perform(get(ApiPaths.DASHBOARD + "/semesters").cookie(token(testData.instructor().getUser())))
                .andExpect(status().isForbidden());
    }

    private ClassOffering openClass(String code, String semester, LocalDate start, Instructor instructor) {
        ClassOffering offering = persist(new ClassOffering(code, course, semester, start, start.plusMonths(2), 30,
                start.minusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant(), admin));
        offering.setInstructor(instructor);
        offering.setStatus(ClassStatus.OPEN);
        offering.setMinAttendancePct(new BigDecimal("80.00"));
        offering.setPassScore(new BigDecimal("5.00"));
        offering.setMidtermWeight(new BigDecimal("0.40"));
        offering.setFinalWeight(new BigDecimal("0.60"));
        return offering;
    }

    private User user(String name, UserRole role) {
        User user = persist(new User(prefix + "." + name, prefix + "." + name + "@test.local", "x".repeat(60),
                "Name " + name, role));
        entityManager.flush();
        return user;
    }

    private Cookie token(User user) {
        return new Cookie(AuthCookies.ACCESS_TOKEN, jwtService.issue(user.getId(), user.getTokenVersion()));
    }

    private <T> T persist(T entity) {
        entityManager.persist(entity);
        return entity;
    }
}
