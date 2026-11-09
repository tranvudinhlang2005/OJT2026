package com.p02.training.repository;

import com.p02.training.entity.ClassOffering;
import com.p02.training.entity.Course;
import com.p02.training.entity.Enrollment;
import com.p02.training.entity.Instructor;
import com.p02.training.entity.Room;
import com.p02.training.entity.Session;
import com.p02.training.entity.Student;
import com.p02.training.entity.User;
import com.p02.training.entity.enums.ClassStatus;
import com.p02.training.entity.enums.GradingStatus;
import com.p02.training.entity.enums.UserRole;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneOffset;

/** Builds rows inside a test's transaction, which rolls back. Values satisfy the V1 constraints. */
final class TestData {

    static final LocalDate START = LocalDate.of(2030, 1, 10);
    static final Instant NOW = Instant.parse("2030-01-01T00:00:00Z");

    private final EntityManager entityManager;
    private int sequence;

    TestData(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    <T> T persist(T entity) {
        entityManager.persist(entity);
        return entity;
    }

    void flushAndClear() {
        entityManager.flush();
        entityManager.clear();
    }

    String unique(String prefix) {
        return prefix + (++sequence);
    }

    User user(UserRole role) {
        String name = unique("user");
        return persist(new User(name, name + "@test.local", "x".repeat(60), "Name " + name, role));
    }

    Student student() {
        return persist(new Student(user(UserRole.STUDENT), unique("ST")));
    }

    Instructor instructor() {
        return persist(new Instructor(user(UserRole.INSTRUCTOR), unique("IN")));
    }

    Course course() {
        return persist(new Course(unique("CO"), "Course " + sequence, 3, 45));
    }

    Room room(int capacity) {
        return persist(new Room(unique("RO"), capacity));
    }

    ClassOffering draftClass(Course course, User createdBy) {
        return persist(new ClassOffering(unique("CL"), course, "2030-1", START, START.plusMonths(1), 30,
                START.minusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant(), createdBy));
    }

    /** A class in the given status, with the columns V1's CHECK constraints require for it. */
    ClassOffering classWithStatus(ClassStatus status, Instructor instructor, User createdBy) {
        ClassOffering offering = draftClass(course(), createdBy);
        offering.setInstructor(instructor);
        offering.setStatus(status);
        offering.setMinAttendancePct(new BigDecimal("80.00"));
        offering.setPassScore(new BigDecimal("5.00"));
        offering.setMidtermWeight(new BigDecimal("0.40"));
        offering.setFinalWeight(new BigDecimal("0.60"));
        if (status == ClassStatus.IN_PROGRESS) {
            offering.setStartedAt(NOW);
        }
        if (status == ClassStatus.CANCELLED) {
            offering.setCancelReason("Cancelled for a test");
        }
        return offering;
    }

    void confirmGrading(ClassOffering offering, User confirmedBy) {
        offering.setGradingStatus(GradingStatus.CONFIRMED);
        offering.setConfirmedAt(NOW);
        offering.setConfirmedBy(confirmedBy);
    }

    Session session(ClassOffering offering, Room room, LocalDate date, int startHour, int endHour) {
        return persist(new Session(offering, date, LocalTime.of(startHour, 0), LocalTime.of(endHour, 0), room));
    }

    Enrollment enrollment(Student student, ClassOffering offering) {
        return persist(new Enrollment(student, offering, NOW));
    }
}
