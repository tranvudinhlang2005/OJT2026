package com.p02.training.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.p02.training.entity.AppSecurityLog;
import com.p02.training.entity.AssessmentResult;
import com.p02.training.entity.Attendance;
import com.p02.training.entity.ClassOffering;
import com.p02.training.entity.Enrollment;
import com.p02.training.entity.GradeAuditLog;
import com.p02.training.entity.Instructor;
import com.p02.training.entity.Room;
import com.p02.training.entity.Session;
import com.p02.training.entity.Student;
import com.p02.training.entity.User;
import com.p02.training.entity.enums.AttendanceStatus;
import com.p02.training.entity.enums.ClassStatus;
import com.p02.training.entity.enums.EnrollmentStatus;
import com.p02.training.entity.enums.FinalStatus;
import com.p02.training.entity.enums.GradingStatus;
import com.p02.training.entity.enums.ScoreType;
import com.p02.training.entity.enums.SecurityAction;
import com.p02.training.entity.enums.UserRole;
import com.p02.training.repository.projection.ActionCount;
import com.p02.training.repository.projection.ClassOutcomeCount;
import com.p02.training.repository.projection.OutcomeTotals;
import com.p02.training.repository.projection.StudentAttendanceCount;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

class EnrollmentAndResultRepositoryTest extends RepositoryTestSupport {

    private static final List<EnrollmentStatus> ROSTER = List.of(EnrollmentStatus.ENROLLED, EnrollmentStatus.COMPLETED);
    private static final List<SecurityAction> ALERTS =
            List.of(SecurityAction.LOGIN_FAILED, SecurityAction.ACCOUNT_LOCKED, SecurityAction.ACCESS_DENIED);

    @Autowired
    private EnrollmentRepository enrollments;

    @Autowired
    private AttendanceRepository attendance;

    @Autowired
    private AssessmentResultRepository results;

    @Autowired
    private GradeAuditLogRepository gradeLogs;

    @Autowired
    private AppSecurityLogRepository securityLogs;

    private User admin;
    private Instructor instructor;
    private Room room;
    private ClassOffering offering;

    @BeforeEach
    void createCommonRows() {
        admin = data.user(UserRole.TRAINING_ADMIN);
        instructor = data.instructor();
        room = data.room(40);
        offering = data.classWithStatus(ClassStatus.IN_PROGRESS, instructor, admin);
    }

    @Test
    void existingEnrollmentIsFoundForReuse() {
        Student student = data.student();
        Enrollment enrollment = data.enrollment(student, offering);
        data.flushAndClear();

        assertThat(enrollments.findByStudent_IdAndClassOffering_Id(student.getId(), offering.getId()))
                .get().extracting(Enrollment::getId).isEqualTo(enrollment.getId());
        assertThat(enrollments.findByStudent_IdAndClassOffering_Id(data.student().getId(), offering.getId())).isEmpty();
    }

    @Test
    void aClassThatEverHadAnEnrollmentIsDetectedEvenIfCancelled() {
        ClassOffering empty = data.draftClass(data.course(), admin);
        cancel(data.enrollment(data.student(), offering));
        data.flushAndClear();

        assertThat(enrollments.existsByClassOffering_Id(offering.getId())).isTrue();
        assertThat(enrollments.existsByClassOffering_Id(empty.getId())).isFalse();
    }

    @Test
    void statusQueriesSupportCancelCompleteAndReconciliation() {
        Enrollment active = data.enrollment(data.student(), offering);
        cancel(data.enrollment(data.student(), offering));
        data.flushAndClear();

        assertThat(enrollments.findByClassOffering_IdAndStatus(offering.getId(), EnrollmentStatus.ENROLLED))
                .extracting(Enrollment::getId).containsExactly(active.getId());
        assertThat(enrollments.countByClassOffering_IdAndStatus(offering.getId(), EnrollmentStatus.CANCELLED)).isEqualTo(1);
        assertThat(enrollments.findStudentIds(offering.getId(), EnrollmentStatus.ENROLLED))
                .containsExactly(active.getStudent().getId());
    }

    @Test
    void rosterIsFilteredPagedSortedAndHasNoNPlusOne() {
        Student first = data.student();
        Student second = data.student();
        data.enrollment(first, offering);
        data.enrollment(second, offering);
        cancel(data.enrollment(data.student(), offering));

        long statements = countStatements(() -> {
            Page<Enrollment> page = enrollments.findByClassOffering_IdAndStatusIn(offering.getId(), ROSTER,
                    PageRequest.of(0, 1, Sort.by(Sort.Direction.DESC, "student.studentCode")));
            assertThat(page.getTotalElements()).isEqualTo(2);
            assertThat(page.getContent()).hasSize(1);
            assertThat(page.getContent().get(0).getStudent().getUser().getFullName()).isNotNull();
            return page;
        });

        assertThat(statements).as("one page query and one count query").isEqualTo(2);
    }

    @Test
    void myClassesFilterByStatusWithClassAndCourseInOneQuery() {
        Student student = data.student();
        data.enrollment(student, offering);
        cancel(data.enrollment(student, data.classWithStatus(ClassStatus.OPEN, instructor, admin)));

        long statements = countStatements(() -> {
            Page<Enrollment> all = enrollments.findByStudent_Id(student.getId(), PageRequest.of(0, 20));
            assertThat(all.getContent()).hasSize(2);
            all.getContent().forEach(row -> assertThat(row.getClassOffering().getCourse().getName()).isNotNull());
            return all;
        });
        assertThat(statements).isEqualTo(1);

        assertThat(enrollments.findByStudent_IdAndStatus(student.getId(), EnrollmentStatus.CANCELLED, PageRequest.of(0, 20)))
                .hasSize(1);
    }

    @Test
    void missingAttendanceIsCountedForEnrolledStudentsOnly() {
        Session session = data.session(offering, room, TestData.START, 9, 10);
        Student marked = data.student();
        data.enrollment(marked, offering);
        data.enrollment(data.student(), offering);
        cancel(data.enrollment(data.student(), offering));
        data.persist(new Attendance(session, marked, AttendanceStatus.ABSENT, admin, TestData.NOW));
        data.flushAndClear();

        assertThat(enrollments.countWithoutAttendance(offering.getId(), session.getId(), EnrollmentStatus.ENROLLED)).isEqualTo(1);
    }

    @Test
    void attendanceMarksLoadWithStudentsInOneQuery() {
        Session session = data.session(offering, room, TestData.START, 9, 10);
        data.persist(new Attendance(session, data.student(), AttendanceStatus.PRESENT, admin, TestData.NOW));
        data.persist(new Attendance(session, data.student(), AttendanceStatus.ABSENT, admin, TestData.NOW));

        long statements = countStatements(() -> {
            List<Attendance> marks = attendance.findBySession_Id(session.getId());
            assertThat(marks).hasSize(2);
            marks.forEach(mark -> assertThat(mark.getStudent().getUser().getFullName()).isNotNull());
            return marks;
        });

        assertThat(statements).isEqualTo(1);
    }

    @Test
    void attendedSessionsCountOnlyTheRequestedStatusesPerStudent() {
        Session first = data.session(offering, room, TestData.START, 9, 10);
        Session second = data.session(offering, room, TestData.START.plusDays(1), 9, 10);
        Student present = data.student();
        Student absent = data.student();
        data.persist(new Attendance(first, present, AttendanceStatus.PRESENT, admin, TestData.NOW));
        data.persist(new Attendance(second, present, AttendanceStatus.LATE, admin, TestData.NOW));
        data.persist(new Attendance(first, absent, AttendanceStatus.ABSENT, admin, TestData.NOW));
        data.flushAndClear();

        List<StudentAttendanceCount> counts = attendance.countAttendedByStudent(offering.getId(),
                List.of(AttendanceStatus.PRESENT, AttendanceStatus.LATE));

        assertThat(counts).hasSize(1);
        assertThat(counts.get(0).getStudentId()).isEqualTo(present.getId());
        assertThat(counts.get(0).getAttended()).isEqualTo(2);
    }

    @Test
    void studentsWithoutBothScoresAreCounted() {
        Enrollment complete = data.enrollment(data.student(), offering);
        Enrollment partial = data.enrollment(data.student(), offering);
        data.enrollment(data.student(), offering);
        score(complete, "7.00", "8.00");
        score(partial, "7.00", null);
        data.flushAndClear();

        assertThat(enrollments.countWithoutBothScores(offering.getId(), EnrollmentStatus.ENROLLED)).isEqualTo(2);
    }

    @Test
    void classResultsLoadPagedAndByRequestedStudents() {
        Enrollment first = data.enrollment(data.student(), offering);
        Enrollment second = data.enrollment(data.student(), offering);
        score(first, "7.00", "8.00");
        score(second, "6.00", "5.00");

        long statements = countStatements(() -> {
            Page<AssessmentResult> page = results.findByClassOffering_Id(offering.getId(), PageRequest.of(0, 20));
            assertThat(page.getContent()).hasSize(2);
            page.getContent().forEach(row -> assertThat(row.getStudent().getUser().getFullName()).isNotNull());
            return page;
        });
        assertThat(statements).isEqualTo(1);

        assertThat(results.findAllByClassOffering_Id(offering.getId())).hasSize(2);
        assertThat(results.findByClassOffering_IdAndStudent_IdIn(offering.getId(), List.of(first.getStudent().getId())))
                .extracting(row -> row.getStudent().getId()).containsExactly(first.getStudent().getId());
    }

    @Test
    void studentResultsOnlyIncludeTheRequestedGradingStatus() {
        Student student = data.student();
        score(data.enrollment(student, offering), "7.00", "8.00");
        ClassOffering confirmed = data.classWithStatus(ClassStatus.IN_PROGRESS, instructor, admin);
        data.confirmGrading(confirmed, admin);
        score(data.enrollment(student, confirmed), "9.00", "9.00");
        data.flushAndClear();

        Page<AssessmentResult> page = results.findByStudent_IdAndClassOffering_GradingStatusAndClassOffering_DeletedAtIsNull(
                student.getId(), GradingStatus.CONFIRMED, PageRequest.of(0, 20));

        assertThat(page.getContent()).extracting(row -> row.getClassOffering().getId()).containsExactly(confirmed.getId());
    }

    @Test
    void dashboardOutcomesCoverOnlyConfirmedClasses() {
        data.confirmGrading(offering, admin);
        outcome(data.enrollment(data.student(), offering), FinalStatus.PASSED, "100.00");
        outcome(data.enrollment(data.student(), offering), FinalStatus.FAILED, "50.00");
        ClassOffering notConfirmed = data.classWithStatus(ClassStatus.IN_PROGRESS, instructor, admin);
        outcome(data.enrollment(data.student(), notConfirmed), FinalStatus.PASSED, "10.00");
        data.flushAndClear();

        OutcomeTotals totals = results.sumOutcomesForDashboard(GradingStatus.CONFIRMED, null, null, null, null);

        assertThat(totals.getPassed()).isEqualTo(1);
        assertThat(totals.getFailed()).isEqualTo(1);
        assertThat(totals.getAverageAttendanceRate()).isEqualTo(75.0);
    }

    @Test
    void dashboardOutcomesAreNullWhenNothingMatches() {
        OutcomeTotals totals = results.sumOutcomesForDashboard(GradingStatus.CONFIRMED, "no-such-semester", null, null, null);

        assertThat(totals.getPassed()).isNull();
        assertThat(totals.getFailed()).isNull();
        assertThat(totals.getAverageAttendanceRate()).isNull();
    }

    @Test
    void perClassOutcomesUseOneQueryForAPageOfClasses() {
        data.confirmGrading(offering, admin);
        outcome(data.enrollment(data.student(), offering), FinalStatus.PASSED, "90.00");
        outcome(data.enrollment(data.student(), offering), FinalStatus.PASSED, "90.00");
        ClassOffering second = data.classWithStatus(ClassStatus.IN_PROGRESS, instructor, admin);
        data.confirmGrading(second, admin);
        outcome(data.enrollment(data.student(), second), FinalStatus.FAILED, "40.00");

        long statements = countStatements(() -> {
            Map<Long, ClassOutcomeCount> counts = new java.util.HashMap<>();
            results.countOutcomesByClass(List.of(offering.getId(), second.getId()), GradingStatus.CONFIRMED)
                    .forEach(row -> counts.put(row.getClassId(), row));
            assertThat(counts.get(offering.getId()).getPassed()).isEqualTo(2);
            assertThat(counts.get(offering.getId()).getFailed()).isZero();
            assertThat(counts.get(second.getId()).getFailed()).isEqualTo(1);
            return counts;
        });

        assertThat(statements).isEqualTo(1);
    }

    @Test
    void dashboardEnrollmentCountRespectsStatusesAndFilters() {
        data.enrollment(data.student(), offering);
        cancel(data.enrollment(data.student(), offering));
        data.flushAndClear();
        LocalDate start = offering.getStartDate();

        assertThat(enrollments.countForDashboard(ROSTER, null, null, null, null)).isEqualTo(1);
        assertThat(enrollments.countForDashboard(ROSTER, offering.getSemester(), null, start, start)).isEqualTo(1);
        assertThat(enrollments.countForDashboard(ROSTER, "no-such-semester", null, null, null)).isZero();
    }

    @Test
    void gradeLogsAreFilteredAndLoadWithoutNPlusOne() {
        Enrollment first = data.enrollment(data.student(), offering);
        Enrollment second = data.enrollment(data.student(), offering);
        data.persist(new GradeAuditLog(first, ScoreType.MIDTERM, null, new BigDecimal("6.00"), admin, null, "127.0.0.1"));
        data.persist(new GradeAuditLog(second, ScoreType.FINAL, new BigDecimal("5.00"), new BigDecimal("6.00"), admin, "Fix", "127.0.0.1"));
        data.persist(new GradeAuditLog(data.enrollment(data.student(), data.classWithStatus(ClassStatus.OPEN, instructor, admin)),
                ScoreType.FINAL, null, new BigDecimal("8.00"), admin, null, "127.0.0.1"));
        Long classId = offering.getId();
        Specification<GradeAuditLog> inClass = (root, query, builder) ->
                builder.equal(root.get("classOffering").get("id"), classId);

        long statements = countStatements(() -> {
            Page<GradeAuditLog> page = gradeLogs.findAll(inClass, PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "changedAt")));
            assertThat(page.getTotalElements()).isEqualTo(2);
            page.getContent().forEach(row -> {
                assertThat(row.getClassOffering().getClassCode()).isNotNull();
                assertThat(row.getStudent().getStudentCode()).isNotNull();
                assertThat(row.getChangedBy().getFullName()).isNotNull();
            });
            return page;
        });

        assertThat(statements).isLessThanOrEqualTo(2);
    }

    @Test
    void securityCountsGroupByActionWithinTheRange() {
        Instant now = Instant.now();
        data.persist(new AppSecurityLog(SecurityAction.LOGIN_FAILED, null, "127.0.0.1", null));
        data.persist(new AppSecurityLog(SecurityAction.LOGIN_FAILED, "someone", "127.0.0.1", null));
        data.persist(new AppSecurityLog(SecurityAction.ACCESS_DENIED, "someone", "127.0.0.1", null));
        data.persist(new AppSecurityLog(SecurityAction.LOGIN_SUCCESS, "someone", "127.0.0.1", null));
        data.flushAndClear();
        Instant from = now.minus(1, ChronoUnit.HOURS);
        Instant to = now.plus(1, ChronoUnit.HOURS);

        Map<SecurityAction, Long> counts = new java.util.HashMap<>();
        securityLogs.countByAction(ALERTS, from, to).forEach(row -> counts.put(row.getAction(), row.getTotal()));

        assertThat(counts).containsOnly(Map.entry(SecurityAction.LOGIN_FAILED, 2L), Map.entry(SecurityAction.ACCESS_DENIED, 1L));
        assertThat(securityLogs.countByAction(ALERTS, to, to.plus(1, ChronoUnit.HOURS))).extracting(ActionCount::getTotal).isEmpty();
    }

    @Test
    void recentSecurityEventsAreLimitedToTwentyNewestFirst() {
        Instant now = Instant.now();
        AppSecurityLog last = null;
        for (int i = 0; i < 25; i++) {
            last = data.persist(new AppSecurityLog(SecurityAction.ACCESS_DENIED, "user" + i, "127.0.0.1", null));
        }
        data.flushAndClear();

        List<AppSecurityLog> recent = securityLogs
                .findTop20ByActionInAndCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtDescIdDesc(
                        ALERTS, now.minus(1, ChronoUnit.HOURS), now.plus(1, ChronoUnit.HOURS));

        assertThat(recent).hasSize(20);
        assertThat(recent).extracting(AppSecurityLog::getCreatedAt).isSortedAccordingTo(java.util.Comparator.reverseOrder());
        assertThat(last).isNotNull();
    }

    private void cancel(Enrollment enrollment) {
        enrollment.setStatus(EnrollmentStatus.CANCELLED);
        enrollment.setCancelledAt(TestData.NOW);
    }

    private void score(Enrollment enrollment, String midterm, String finalScore) {
        AssessmentResult result = data.persist(new AssessmentResult(enrollment));
        result.setMidtermScore(new BigDecimal(midterm));
        result.setFinalScore(finalScore == null ? null : new BigDecimal(finalScore));
    }

    private void outcome(Enrollment enrollment, FinalStatus status, String attendanceRate) {
        AssessmentResult result = data.persist(new AssessmentResult(enrollment));
        result.setFinalStatus(status);
        result.setAttendanceRate(new BigDecimal(attendanceRate));
    }
}
