package com.p02.training.entity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.p02.training.entity.enums.AttendanceStatus;
import com.p02.training.entity.enums.ClassStatus;
import com.p02.training.entity.enums.EnrollmentStatus;
import com.p02.training.entity.enums.FinalStatus;
import com.p02.training.entity.enums.GradingStatus;
import com.p02.training.entity.enums.ScoreType;
import com.p02.training.entity.enums.SecurityAction;
import com.p02.training.entity.enums.StudentStatus;
import com.p02.training.entity.enums.UserRole;
import jakarta.persistence.EntityManager;
import jakarta.persistence.OptimisticLockException;
import jakarta.persistence.PersistenceException;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Map;
import org.hibernate.Hibernate;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

/**
 * Writes real rows through the entities. Every test runs in a transaction that rolls back, so the
 * test database keeps no rows. Identity sequences do advance, which is harmless.
 */
@SpringBootTest
@Transactional
@EnabledIfEnvironmentVariable(named = "DB_PASSWORD", matches = ".+")
class EntityPersistenceMappingTest {

    private static final LocalDate START = LocalDate.of(2030, 1, 10);
    private static final Instant DEADLINE = Instant.parse("2030-01-05T02:30:15.123456Z");
    private static final Instant NOW = Instant.parse("2030-01-01T00:00:00.654321Z");

    @Autowired
    private EntityManager entityManager;

    private int sequence;

    @Test
    void newEntitiesGetTheSameDefaultsAsTheDatabase() {
        User user = user(UserRole.STUDENT);
        Student student = persist(new Student(user, code("S")));
        Course course = course();
        Room room = persist(new Room(code("R"), 30));
        ClassOffering offering = offering(course, user);
        Session session = persist(new Session(offering, START, LocalTime.of(9, 0), LocalTime.of(10, 0), room));
        reload();

        User loadedUser = entityManager.find(User.class, user.getId());
        assertThat(loadedUser.isActive()).isTrue();
        assertThat(loadedUser.getFailedLoginCount()).isZero();
        assertThat(loadedUser.getTokenVersion()).isZero();
        assertThat(loadedUser.getCreatedAt()).isNotNull();
        assertThat(loadedUser.getUpdatedAt()).isNotNull();
        assertThat(entityManager.find(Student.class, student.getId()).getStatus()).isEqualTo(StudentStatus.ACTIVE);
        assertThat(entityManager.find(Room.class, room.getId()).isActive()).isTrue();

        Course loadedCourse = entityManager.find(Course.class, course.getId());
        assertThat(loadedCourse.isActive()).isTrue();
        assertThat(loadedCourse.getMinAttendancePct()).isEqualByComparingTo("80");
        assertThat(loadedCourse.getPassScore()).isEqualByComparingTo("5.0");
        assertThat(loadedCourse.getMidtermWeight()).isEqualByComparingTo("0.40");
        assertThat(loadedCourse.getFinalWeight()).isEqualByComparingTo("0.60");

        ClassOffering loaded = entityManager.find(ClassOffering.class, offering.getId());
        assertThat(loaded.getStatus()).isEqualTo(ClassStatus.DRAFT);
        assertThat(loaded.getGradingStatus()).isEqualTo(GradingStatus.DRAFT);
        assertThat(loaded.getEnrolledCount()).isZero();
        assertThat(loaded.getGradingVersion()).isZero();
        assertThat(loaded.getDeletedAt()).isNull();

        Session loadedSession = entityManager.find(Session.class, session.getId());
        assertThat(loadedSession.isAttendanceLocked()).isFalse();
        assertThat(loadedSession.getAttendanceVersion()).isZero();
    }

    @Test
    void timeAndDecimalValuesRoundTripExactly() {
        User user = user(UserRole.TRAINING_ADMIN);
        user.setLockedUntil(NOW);
        Room room = persist(new Room(code("R"), 30));
        ClassOffering offering = offering(course(), user);
        Session session = persist(new Session(offering, START, LocalTime.of(9, 30), LocalTime.of(11, 45), room));
        Enrollment enrollment = enrollment(user(UserRole.STUDENT), offering);
        AssessmentResult result = persist(new AssessmentResult(enrollment));
        result.setMidtermScore(new BigDecimal("10.00"));
        result.setFinalScore(new BigDecimal("7.25"));
        result.setTotalScore(new BigDecimal("8.35"));
        result.setAttendanceRate(new BigDecimal("100.00"));
        reload();

        assertThat(entityManager.find(User.class, user.getId()).getLockedUntil()).isEqualTo(NOW);
        assertThat(entityManager.find(ClassOffering.class, offering.getId()).getCancelDeadline()).isEqualTo(DEADLINE);
        Session loadedSession = entityManager.find(Session.class, session.getId());
        assertThat(loadedSession.getSessionDate()).isEqualTo(START);
        assertThat(loadedSession.getStartTime()).isEqualTo(LocalTime.of(9, 30));
        assertThat(loadedSession.getEndTime()).isEqualTo(LocalTime.of(11, 45));
        AssessmentResult loaded = entityManager.find(AssessmentResult.class, result.getId());
        assertThat(loaded.getMidtermScore()).isEqualTo(new BigDecimal("10.00"));
        assertThat(loaded.getFinalScore()).isEqualTo(new BigDecimal("7.25"));
        assertThat(loaded.getTotalScore()).isEqualTo(new BigDecimal("8.35"));
        assertThat(loaded.getAttendanceRate()).isEqualTo(new BigDecimal("100.00"));
        assertThat(loaded.getFinalStatus()).isEqualTo(FinalStatus.IN_PROGRESS);
    }

    @Test
    void enumsAreStoredAsTheirNames() {
        User user = user(UserRole.TRAINING_MANAGER);
        reload();

        Object role = entityManager.createNativeQuery("SELECT role FROM users WHERE id = :id")
                .setParameter("id", user.getId()).getSingleResult();
        assertThat(role).isEqualTo("TRAINING_MANAGER");
    }

    @Test
    void associationsLoadLazily() {
        User admin = user(UserRole.TRAINING_ADMIN);
        Enrollment enrollment = enrollment(user(UserRole.STUDENT), offering(course(), admin));
        AssessmentResult result = persist(new AssessmentResult(enrollment));
        reload();

        AssessmentResult loaded = entityManager.find(AssessmentResult.class, result.getId());
        assertThat(Hibernate.isInitialized(loaded.getStudent())).isFalse();
        assertThat(Hibernate.isInitialized(loaded.getClassOffering())).isFalse();
        assertThat(loaded.getStudent().getId()).isEqualTo(enrollment.getStudent().getId());
        assertThat(loaded.getClassOffering().getId()).isEqualTo(enrollment.getClassOffering().getId());
    }

    @Test
    void resultAndAuditLogTakeTheirKeyFromTheEnrollment() {
        User admin = user(UserRole.TRAINING_ADMIN);
        Enrollment enrollment = enrollment(user(UserRole.STUDENT), offering(course(), admin));

        AssessmentResult result = persist(new AssessmentResult(enrollment));
        GradeAuditLog log = persist(new GradeAuditLog(enrollment, ScoreType.MIDTERM, null, new BigDecimal("6.50"),
                admin, null, "2001:db8::1"));
        entityManager.flush();

        for (Long id : new Long[] {result.getId(), log.getId()}) {
            String table = id.equals(result.getId()) ? "assessment_result" : "grade_audit_log";
            Object[] row = (Object[]) entityManager
                    .createNativeQuery("SELECT student_id, class_id FROM " + table + " WHERE id = :id")
                    .setParameter("id", id).getSingleResult();
            assertThat(row[0]).isEqualTo(enrollment.getStudent().getId());
            assertThat(row[1]).isEqualTo(enrollment.getClassOffering().getId());
        }
    }

    @Test
    void compositeForeignKeyRejectsAResultWithNoEnrollment() {
        User admin = user(UserRole.TRAINING_ADMIN);
        Student student = persist(new Student(user(UserRole.STUDENT), code("S")));
        ClassOffering offering = offering(course(), admin);
        entityManager.flush();

        assertForeignKeyViolation("fk_ar_enrollment", () -> entityManager
                .createNativeQuery("INSERT INTO assessment_result (student_id, class_id) VALUES (:student, :class)")
                .setParameter("student", student.getId()).setParameter("class", offering.getId())
                .executeUpdate());
    }

    @Test
    void compositeForeignKeyRejectsAuditRowWithNoEnrollment() {
        User admin = user(UserRole.TRAINING_ADMIN);
        Student student = persist(new Student(user(UserRole.STUDENT), code("S")));
        ClassOffering offering = offering(course(), admin);
        entityManager.flush();

        assertForeignKeyViolation("fk_gal_enrollment", () -> entityManager
                .createNativeQuery("""
                        INSERT INTO grade_audit_log (student_id, class_id, score_type, changed_by)
                        VALUES (:student, :class, 'FINAL', :admin)
                        """)
                .setParameter("student", student.getId()).setParameter("class", offering.getId())
                .setParameter("admin", admin.getId())
                .executeUpdate());
    }

    @Test
    void jpaVersionIncrementsOnEveryUpdateIncludingSeatCount() {
        ClassOffering offering = offering(course(), user(UserRole.TRAINING_ADMIN));
        entityManager.flush();
        int before = offering.getVersion();

        offering.setEnrolledCount(1);
        entityManager.flush();

        assertThat(offering.getVersion()).isEqualTo(before + 1);
    }

    @Test
    void staleJpaVersionIsRejected() {
        ClassOffering offering = offering(course(), user(UserRole.TRAINING_ADMIN));
        entityManager.flush();
        entityManager.createNativeQuery("UPDATE class_offering SET version = version + 1 WHERE id = :id")
                .setParameter("id", offering.getId()).executeUpdate();

        offering.setSemester("2030-2");

        assertThatThrownBy(entityManager::flush).isInstanceOf(OptimisticLockException.class);
    }

    @Test
    void gradingAndAttendanceVersionsChangeOnlyWhenTheServiceSetsThem() {
        User admin = user(UserRole.TRAINING_ADMIN);
        ClassOffering offering = offering(course(), admin);
        Session session = persist(new Session(offering, START, LocalTime.of(9, 0), LocalTime.of(10, 0),
                persist(new Room(code("R"), 30))));
        entityManager.flush();

        offering.setSemester("2030-2");
        session.setTopic("Introduction");
        entityManager.flush();

        assertThat(offering.getGradingVersion()).isZero();
        assertThat(session.getAttendanceVersion()).isZero();
    }

    @Test
    void attendanceIsUniquePerSessionAndStudent() {
        User admin = user(UserRole.TRAINING_ADMIN);
        ClassOffering offering = offering(course(), admin);
        Session session = persist(new Session(offering, START, LocalTime.of(9, 0), LocalTime.of(10, 0),
                persist(new Room(code("R"), 30))));
        Student student = persist(new Student(user(UserRole.STUDENT), code("S")));
        persist(new Attendance(session, student, AttendanceStatus.LATE, admin, NOW));
        entityManager.flush();

        assertThatThrownBy(() -> {
            entityManager.persist(new Attendance(session, student, AttendanceStatus.PRESENT, admin, NOW));
            entityManager.flush();
        }).isInstanceOf(PersistenceException.class).rootCause().hasMessageContaining("uq_attendance_session_student");
    }

    @Test
    void reEnrollingReusesTheRowAndClearsTheCancelledTime() {
        Enrollment enrollment = enrollment(user(UserRole.STUDENT), offering(course(), user(UserRole.TRAINING_ADMIN)));
        entityManager.flush();

        enrollment.setStatus(EnrollmentStatus.CANCELLED);
        enrollment.setCancelledAt(NOW);
        entityManager.flush();
        enrollment.setStatus(EnrollmentStatus.ENROLLED);
        enrollment.setCancelledAt(null);
        entityManager.flush();
        reload();

        Enrollment loaded = entityManager.find(Enrollment.class, enrollment.getId());
        assertThat(loaded.getStatus()).isEqualTo(EnrollmentStatus.ENROLLED);
        assertThat(loaded.getCancelledAt()).isNull();
    }

    @Test
    void instructorCourseUsesCompositeKeyAndDeletingACourseRemovesItsRows() {
        Instructor instructor = persist(new Instructor(user(UserRole.INSTRUCTOR), code("I")));
        Course course = course();
        entityManager.flush();
        InstructorCourseId id = persist(new InstructorCourse(instructor, course)).getId();
        reload();

        InstructorCourse loaded = entityManager.find(InstructorCourse.class, id);
        assertThat(loaded.getInstructor().getId()).isEqualTo(instructor.getId());
        assertThat(loaded.getCourse().getId()).isEqualTo(course.getId());
        reload();

        entityManager.remove(entityManager.find(Course.class, course.getId()));
        reload();

        assertThat(entityManager.find(InstructorCourse.class, id)).isNull();
        assertThat(entityManager.find(Instructor.class, instructor.getId())).isNotNull();
    }

    @Test
    void securityLogStoresJsonWithoutAnAccount() {
        AppSecurityLog log = persist(new AppSecurityLog(SecurityAction.ASSIGN_INSTRUCTOR, null, "127.0.0.1",
                Map.of("oldInstructorId", 1, "newInstructorId", 2)));
        reload();

        AppSecurityLog loaded = entityManager.find(AppSecurityLog.class, log.getId());
        assertThat(loaded.getAction()).isEqualTo(SecurityAction.ASSIGN_INSTRUCTOR);
        assertThat(loaded.getUsername()).isNull();
        assertThat(loaded.getCreatedAt()).isNotNull();
        assertThat(loaded.getDetails()).containsEntry("newInstructorId", 2).containsEntry("oldInstructorId", 1);
    }

    private void assertForeignKeyViolation(String constraint, Runnable statement) {
        assertThatThrownBy(statement::run)
                .isInstanceOf(PersistenceException.class)
                .rootCause().hasMessageContaining(constraint);
    }

    private <T> T persist(T entity) {
        entityManager.persist(entity);
        return entity;
    }

    private void reload() {
        entityManager.flush();
        entityManager.clear();
    }

    private String code(String prefix) {
        return prefix + "T" + (++sequence);
    }

    private User user(UserRole role) {
        String name = code("user");
        return persist(new User(name, name + "@test.local", "x".repeat(60), "Test User", role));
    }

    private Course course() {
        return persist(new Course(code("C"), "Test Course", 3, 45));
    }

    private ClassOffering offering(Course course, User createdBy) {
        return persist(new ClassOffering(code("CL"), course, "2030-1", START, START.plusMonths(1), 30, DEADLINE, createdBy));
    }

    private Enrollment enrollment(User studentUser, ClassOffering offering) {
        return persist(new Enrollment(persist(new Student(studentUser, code("S"))), offering, NOW));
    }
}
