package com.p02.training;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.p02.training.common.ApiPaths;
import com.p02.training.entity.ClassOffering;
import com.p02.training.entity.Course;
import com.p02.training.entity.Instructor;
import com.p02.training.entity.Student;
import com.p02.training.entity.User;
import com.p02.training.entity.enums.ClassStatus;
import com.p02.training.entity.enums.EnrollmentStatus;
import com.p02.training.entity.enums.UserRole;
import com.p02.training.security.AuthCookies;
import com.p02.training.security.JwtService;
import com.p02.training.security.SecurityConfig;
import jakarta.persistence.EntityManager;
import jakarta.servlet.http.Cookie;
import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.support.TransactionTemplate;

@SpringBootTest
@AutoConfigureMockMvc
@EnabledIfEnvironmentVariable(named = "DB_PASSWORD", matches = ".+")
class EnrollmentCapacityConcurrencyIntegrationTest {

    private static final int REQUESTS = 10;

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private TransactionTemplate transactions;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private Clock clock;

    @Test
    void onlyOneOfTenConcurrentEnrollmentsCanTakeTheLastSeat() throws Exception {
        Fixture fixture = transactions.execute(status -> prepareFixture());
        assertThat(fixture).isNotNull();
        try {
            List<Outcome> outcomes = enrollConcurrently(fixture);
            assertThat(outcomes.stream().filter(outcome -> outcome.status() == HttpStatus.CREATED.value()).count())
                    .isEqualTo(1);
            assertThat(outcomes.stream().filter(outcome -> outcome.status() == HttpStatus.CONFLICT.value())
                    .map(Outcome::code)).containsExactlyElementsOf(Collections.nCopies(REQUESTS - 1, "CLASS_FULL"));
            transactions.executeWithoutResult(status -> {
                ClassOffering saved = entityManager.find(ClassOffering.class, fixture.classId());
                assertThat(saved.getEnrolledCount()).isEqualTo(saved.getMaxCapacity()).isEqualTo(1);
                long enrolled = entityManager.createQuery(
                                "select count(e) from Enrollment e where e.classOffering.id = :id and e.status = :status",
                                Long.class)
                        .setParameter("id", fixture.classId()).setParameter("status", EnrollmentStatus.ENROLLED)
                        .getSingleResult();
                assertThat(enrolled).isEqualTo(1);
            });
        } finally {
            transactions.executeWithoutResult(status -> cleanFixture(fixture));
        }
    }

    private List<Outcome> enrollConcurrently(Fixture fixture) throws Exception {
        CountDownLatch ready = new CountDownLatch(REQUESTS);
        CountDownLatch start = new CountDownLatch(1);
        try (ExecutorService executor = Executors.newFixedThreadPool(REQUESTS)) {
            List<Future<Outcome>> requests = new ArrayList<>();
            for (User studentAccount : fixture.studentAccounts()) {
                requests.add(executor.submit(() -> {
                    ready.countDown();
                    if (!start.await(10, TimeUnit.SECONDS)) {
                        throw new IllegalStateException("Enrollment workers did not start in time");
                    }
                    return enroll(fixture.classId(), studentAccount);
                }));
            }
            boolean allReady = ready.await(10, TimeUnit.SECONDS);
            start.countDown();
            assertThat(allReady).isTrue();

            List<Outcome> outcomes = new ArrayList<>();
            for (Future<Outcome> request : requests) {
                outcomes.add(request.get(30, TimeUnit.SECONDS));
            }
            return outcomes;
        }
    }

    private Outcome enroll(Long classId, User studentAccount) throws Exception {
        String csrf = UUID.randomUUID().toString();
        Cookie access = new Cookie(AuthCookies.ACCESS_TOKEN,
                jwtService.issue(studentAccount.getId(), studentAccount.getTokenVersion()));
        var reply = mockMvc.perform(post(ApiPaths.ENROLLMENTS)
                        .cookie(access, new Cookie("XSRF-TOKEN", csrf)).header(SecurityConfig.CSRF_HEADER, csrf)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"classId\":" + classId + "}"))
                .andReturn().getResponse();
        String code = reply.getStatus() == HttpStatus.CREATED.value() ? null
                : objectMapper.readTree(reply.getContentAsString()).path("code").asText();
        return new Outcome(reply.getStatus(), code);
    }

    private Fixture prepareFixture() {
        String prefix = "seat" + UUID.randomUUID().toString().substring(0, 8);
        User admin = newUser(prefix + ".admin", UserRole.TRAINING_ADMIN);
        User teacher = newUser(prefix + ".teacher", UserRole.INSTRUCTOR);
        Instructor instructor = persist(new Instructor(teacher, prefix + "-IN"));
        Course course = persist(new Course(prefix, "Last-seat test", 3, 45));
        LocalDate start = LocalDate.now(clock).plusDays(7);
        ClassOffering offering = new ClassOffering(prefix + "-CL", course, "REVIEW", start, start.plusWeeks(1),
                1, start.minusDays(1).atStartOfDay(clock.getZone()).toInstant(), admin);
        offering.setInstructor(instructor);
        offering.setStatus(ClassStatus.OPEN);
        offering.setMinAttendancePct(course.getMinAttendancePct());
        offering.setPassScore(course.getPassScore());
        offering.setMidtermWeight(course.getMidtermWeight());
        offering.setFinalWeight(course.getFinalWeight());
        persist(offering);
        List<User> studentAccounts = new ArrayList<>();
        List<Long> studentIds = new ArrayList<>();
        for (int i = 0; i < REQUESTS; i++) {
            User account = newUser(prefix + ".student" + i, UserRole.STUDENT);
            Student student = persist(new Student(account, prefix + "-S" + i));
            studentAccounts.add(account);
            studentIds.add(student.getId());
        }
        return new Fixture(offering.getId(), course.getId(), instructor.getId(), teacher.getId(), admin.getId(),
                studentAccounts, studentIds);
    }

    private void cleanFixture(Fixture fixture) {
        List<String> actors = fixture.studentAccounts().stream().map(User::getUsername).toList();
        entityManager.createQuery("delete from AppSecurityLog a where a.username in :actors")
                .setParameter("actors", actors).executeUpdate();
        entityManager.createQuery("delete from Enrollment e where e.classOffering.id = :id")
                .setParameter("id", fixture.classId()).executeUpdate();
        entityManager.remove(entityManager.getReference(ClassOffering.class, fixture.classId()));
        entityManager.remove(entityManager.getReference(Course.class, fixture.courseId()));
        entityManager.remove(entityManager.getReference(Instructor.class, fixture.instructorId()));
        for (Long studentId : fixture.studentIds()) {
            entityManager.remove(entityManager.getReference(Student.class, studentId));
        }
        entityManager.flush();
        entityManager.remove(entityManager.getReference(User.class, fixture.teacherId()));
        entityManager.remove(entityManager.getReference(User.class, fixture.adminId()));
        for (User studentAccount : fixture.studentAccounts()) {
            entityManager.remove(entityManager.getReference(User.class, studentAccount.getId()));
        }
    }

    private User newUser(String username, UserRole role) {
        return persist(new User(username, username + "@test.local", "x".repeat(60), "Enrollment Fixture", role));
    }

    private <T> T persist(T entity) {
        entityManager.persist(entity);
        return entity;
    }

    private record Fixture(Long classId, Long courseId, Long instructorId, Long teacherId, Long adminId,
            List<User> studentAccounts, List<Long> studentIds) {}

    private record Outcome(int status, String code) {}
}
