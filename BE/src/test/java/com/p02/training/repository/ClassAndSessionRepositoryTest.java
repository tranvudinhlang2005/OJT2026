package com.p02.training.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.p02.training.entity.ClassOffering;
import com.p02.training.entity.Enrollment;
import com.p02.training.entity.Instructor;
import com.p02.training.entity.Room;
import com.p02.training.entity.Session;
import com.p02.training.entity.Student;
import com.p02.training.entity.User;
import com.p02.training.entity.enums.ClassStatus;
import com.p02.training.entity.enums.EnrollmentStatus;
import com.p02.training.entity.enums.UserRole;
import com.p02.training.repository.projection.CapacityTotals;
import com.p02.training.repository.projection.ClassStatusCount;
import com.p02.training.repository.projection.ScheduleEntry;
import com.p02.training.repository.projection.SessionSlot;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

class ClassAndSessionRepositoryTest extends RepositoryTestSupport {

    private static final List<ClassStatus> SCHEDULABLE = List.of(ClassStatus.DRAFT, ClassStatus.OPEN, ClassStatus.IN_PROGRESS);
    private static final List<ClassStatus> PUBLIC = List.of(ClassStatus.OPEN, ClassStatus.IN_PROGRESS, ClassStatus.CLOSED);
    private static final LocalDate DAY = TestData.START;

    @Autowired
    private ClassOfferingRepository classes;

    @Autowired
    private SessionRepository sessions;

    @Autowired
    private InstructorRepository instructors;

    @Autowired
    private StudentRepository students;

    @Autowired
    private RoomRepository rooms;

    @Autowired
    private EnrollmentRepository enrollments;

    private User admin;
    private Instructor instructor;
    private Room room;

    @BeforeEach
    void createCommonRows() {
        admin = data.user(UserRole.TRAINING_ADMIN);
        instructor = data.instructor();
        room = data.room(40);
    }

    /**
     * Uses rows with no child rows: a foreign key check takes a key-share lock on the parent row,
     * which would set the same marker this test reads.
     */
    @Test
    void everyLockedLookupFromSpec05TakesARowLock() {
        Instructor lockableInstructor = data.instructor();
        Student lockableStudent = data.student();
        Room lockableRoom = data.room(10);
        ClassOffering lockableClass = data.draftClass(data.course(), admin);
        ClassOffering parent = data.draftClass(data.course(), admin);
        Session lockableSession = data.session(parent, room, DAY, 9, 10);
        Enrollment lockableEnrollment = data.enrollment(data.student(), parent);
        data.flushAndClear();

        assertLocks("instructor", lockableInstructor.getId(), () -> instructors.findLockedById(lockableInstructor.getId()));
        assertLocks("student", lockableStudent.getId(), () -> students.findLockedById(lockableStudent.getId()));
        assertLocks("room", lockableRoom.getId(), () -> rooms.findLockedById(lockableRoom.getId()));
        assertLocks("class_offering", lockableClass.getId(), () -> classes.findLockedById(lockableClass.getId()));
        assertLocks("session", lockableSession.getId(), () -> sessions.findLockedById(lockableSession.getId()));
        assertLocks("enrollment", lockableEnrollment.getId(), () -> enrollments.findLockedById(lockableEnrollment.getId()));
    }

    private void assertLocks(String table, Long id, Runnable lookup) {
        assertThat(lockedByThisTransaction(table, id)).as(table + " before the lookup").isFalse();
        lookup.run();
        assertThat(lockedByThisTransaction(table, id)).as(table + " after the lookup").isTrue();
    }

    @Test
    void classDetailLoadsWithoutFurtherQueriesAndHidesSoftDeleted() {
        ClassOffering offering = data.classWithStatus(ClassStatus.OPEN, instructor, admin);

        long statements = countStatements(() -> {
            ClassOffering loaded = classes.findWithDetailsByIdAndDeletedAtIsNull(offering.getId()).orElseThrow();
            assertThat(loaded.getCourse().getName()).isNotNull();
            assertThat(loaded.getInstructor().getUser().getFullName()).isNotNull();
            return loaded;
        });
        assertThat(statements).isEqualTo(1);

        softDelete(offering);
        assertThat(classes.findWithDetailsByIdAndDeletedAtIsNull(offering.getId())).isEmpty();
    }

    @Test
    void classListLoadsNamesWithoutNPlusOneIncludingNoInstructor() {
        data.classWithStatus(ClassStatus.OPEN, instructor, admin);
        data.classWithStatus(ClassStatus.OPEN, data.instructor(), admin);
        data.draftClass(data.course(), admin);

        long statements = countStatements(() -> {
            Page<ClassOffering> page = classes.findAll((Specification<ClassOffering>) null,
                    PageRequest.of(0, 20, Sort.by("course.name")));
            assertThat(page.getContent()).hasSize(3);
            page.getContent().forEach(offering -> {
                assertThat(offering.getCourse().getName()).isNotNull();
                if (offering.getInstructor() != null) {
                    assertThat(offering.getInstructor().getUser().getFullName()).isNotNull();
                }
            });
            return page;
        });

        assertThat(statements).isLessThanOrEqualTo(2);
    }

    @Test
    void courseInUseChecksSeeEveryClass() {
        ClassOffering offering = data.draftClass(data.course(), admin);
        data.flushAndClear();

        assertThat(classes.existsByCourse_Id(offering.getCourse().getId())).isTrue();
        assertThat(classes.existsByClassCode(offering.getClassCode())).isTrue();
        assertThat(classes.existsByClassCodeAndIdNot(offering.getClassCode(), offering.getId())).isFalse();
    }

    @Test
    void courseCodesInUseCoverOnlyActiveClassesOfTheInstructor() {
        ClassOffering teaching = data.classWithStatus(ClassStatus.OPEN, instructor, admin);
        ClassOffering closed = data.classWithStatus(ClassStatus.CANCELLED, instructor, admin);
        ClassOffering otherInstructor = data.classWithStatus(ClassStatus.OPEN, data.instructor(), admin);
        data.flushAndClear();

        List<String> codes = classes.findCourseCodesInUse(instructor.getId(),
                List.of(teaching.getCourse().getId(), closed.getCourse().getId(), otherInstructor.getCourse().getId()),
                SCHEDULABLE);

        assertThat(codes).containsExactly(teaching.getCourse().getCode());
    }

    @Test
    void classSlotsCanExcludeTheSessionBeingEdited() {
        ClassOffering offering = data.draftClass(data.course(), admin);
        Session first = data.session(offering, room, DAY, 9, 10);
        Session second = data.session(offering, room, DAY, 10, 11);
        data.session(offering, room, DAY.plusDays(1), 9, 10);
        data.flushAndClear();

        assertThat(sessions.findSlotsInClass(offering.getId(), DAY, null)).extracting(SessionSlot::getSessionId)
                .containsExactlyInAnyOrder(first.getId(), second.getId());
        assertThat(sessions.findSlotsInClass(offering.getId(), DAY, first.getId())).extracting(SessionSlot::getSessionId)
                .containsExactly(second.getId());
    }

    @Test
    void roomSlotsFollowTheScopeInD09() {
        Session draft = data.session(data.draftClass(data.course(), admin), room, DAY, 9, 10);
        Session open = data.session(data.classWithStatus(ClassStatus.OPEN, instructor, admin), room, DAY, 10, 11);
        data.session(data.classWithStatus(ClassStatus.CANCELLED, instructor, admin), room, DAY, 9, 10);
        ClassOffering deleted = data.draftClass(data.course(), admin);
        data.session(deleted, room, DAY, 9, 10);
        data.session(data.draftClass(data.course(), admin), data.room(10), DAY, 9, 10);
        softDelete(deleted);

        List<SessionSlot> slots = sessions.findSlotsInRoom(room.getId(), DAY, SCHEDULABLE, null);

        assertThat(slots).extracting(SessionSlot::getSessionId).containsExactlyInAnyOrder(draft.getId(), open.getId());
        assertThat(slots.get(0).getClassCode()).isNotNull();
        assertThat(slots.get(0).getStartTime()).isNotNull();
        assertThat(sessions.findSlotsInRoom(room.getId(), DAY, SCHEDULABLE, draft.getId()))
                .extracting(SessionSlot::getSessionId).containsExactly(open.getId());
    }

    @Test
    void instructorSlotsCoverTheirOtherClassesOnTheGivenDates() {
        ClassOffering target = data.classWithStatus(ClassStatus.OPEN, instructor, admin);
        ClassOffering other = data.classWithStatus(ClassStatus.IN_PROGRESS, instructor, admin);
        data.session(target, room, DAY, 9, 10);
        Session expected = data.session(other, room, DAY, 13, 14);
        data.session(other, room, DAY.plusDays(5), 13, 14);
        data.session(data.classWithStatus(ClassStatus.OPEN, data.instructor(), admin), room, DAY, 15, 16);
        data.flushAndClear();

        assertThat(sessions.findSlotsForInstructor(instructor.getId(), List.of(DAY), SCHEDULABLE, target.getId()))
                .extracting(SessionSlot::getSessionId).containsExactly(expected.getId());
    }

    @Test
    void studentSlotsCoverOnlyEnrolledClasses() {
        Student student = data.student();
        ClassOffering target = data.classWithStatus(ClassStatus.OPEN, instructor, admin);
        ClassOffering enrolled = data.classWithStatus(ClassStatus.OPEN, instructor, admin);
        ClassOffering cancelledEnrollment = data.classWithStatus(ClassStatus.OPEN, instructor, admin);
        data.session(target, room, DAY, 9, 10);
        Session expected = data.session(enrolled, room, DAY, 13, 14);
        data.session(cancelledEnrollment, room, DAY, 15, 16);
        data.enrollment(student, enrolled);
        Enrollment cancelled = data.enrollment(student, cancelledEnrollment);
        cancelled.setStatus(EnrollmentStatus.CANCELLED);
        cancelled.setCancelledAt(TestData.NOW);
        data.flushAndClear();

        assertThat(sessions.findSlotsForStudent(student.getId(), EnrollmentStatus.ENROLLED, List.of(DAY), target.getId()))
                .extracting(SessionSlot::getSessionId).containsExactly(expected.getId());
    }

    @Test
    void roomInUseLooksFromTheGivenDateForward() {
        data.session(data.draftClass(data.course(), admin), room, DAY, 9, 10);
        data.flushAndClear();

        assertThat(sessions.existsByRoom_IdAndSessionDateGreaterThanEqualAndClassOffering_StatusInAndClassOffering_DeletedAtIsNull(
                room.getId(), DAY, SCHEDULABLE)).isTrue();
        assertThat(sessions.existsByRoom_IdAndSessionDateGreaterThanEqualAndClassOffering_StatusInAndClassOffering_DeletedAtIsNull(
                room.getId(), DAY.plusDays(1), SCHEDULABLE)).isFalse();
    }

    @Test
    void sessionCountsAndSmallestRoomSupportTheConfirmAndCapacityChecks() {
        ClassOffering offering = data.draftClass(data.course(), admin);
        assertThat(sessions.findSmallestRoomCapacity(offering.getId())).isEmpty();

        data.session(offering, room, DAY, 9, 10);
        Session locked = data.session(offering, data.room(25), DAY.plusDays(1), 9, 10);
        locked.setAttendanceLocked(true);
        locked.setLockedBy(admin);
        locked.setLockedAt(TestData.NOW);
        data.flushAndClear();

        assertThat(sessions.countByClassOffering_Id(offering.getId())).isEqualTo(2);
        assertThat(sessions.countByClassOffering_IdAndAttendanceLockedFalse(offering.getId())).isEqualTo(1);
        assertThat(sessions.findSmallestRoomCapacity(offering.getId())).contains(25);
    }

    @Test
    void classSessionsComeInTimeOrderWithRoomsInOneQuery() {
        ClassOffering offering = data.draftClass(data.course(), admin);
        Session later = data.session(offering, data.room(10), DAY.plusDays(1), 9, 10);
        Session earlier = data.session(offering, data.room(20), DAY, 9, 10);

        long statements = countStatements(() -> {
            List<Session> rows = sessions.findByClassOffering_IdOrderBySessionDateAscStartTimeAsc(offering.getId());
            assertThat(rows).extracting(Session::getId).containsExactly(earlier.getId(), later.getId());
            rows.forEach(row -> assertThat(row.getRoom().getCode()).isNotNull());
            return rows;
        });

        assertThat(statements).isEqualTo(1);
    }

    @Test
    void deletingAClassesSessionsLeavesOtherClassesAlone() {
        ClassOffering offering = data.draftClass(data.course(), admin);
        ClassOffering other = data.draftClass(data.course(), admin);
        data.session(offering, room, DAY, 9, 10);
        data.session(other, room, DAY, 11, 12);
        data.flushAndClear();

        sessions.deleteByClassOffering_Id(offering.getId());
        data.flushAndClear();

        assertThat(sessions.countByClassOffering_Id(offering.getId())).isZero();
        assertThat(sessions.countByClassOffering_Id(other.getId())).isEqualTo(1);
    }

    @Test
    void instructorScheduleIsOrderedAndRespectsStatusAndRange() {
        ClassOffering open = data.classWithStatus(ClassStatus.OPEN, instructor, admin);
        data.session(open, room, DAY, 13, 14).setTopic("Second");
        data.session(open, room, DAY, 9, 10).setTopic("First");
        data.session(open, room, DAY.plusDays(40), 9, 10);
        data.session(data.draftClass(data.course(), admin), room, DAY, 15, 16);
        ClassOffering draft = data.classWithStatus(ClassStatus.DRAFT, instructor, admin);
        data.session(draft, room, DAY, 17, 18);
        data.flushAndClear();

        List<ScheduleEntry> schedule = sessions.findInstructorSchedule(instructor.getId(), PUBLIC, DAY, DAY.plusDays(7));

        assertThat(schedule).extracting(ScheduleEntry::getTopic).containsExactly("First", "Second");
        ScheduleEntry first = schedule.get(0);
        assertThat(first.getStartTime()).isEqualTo(LocalTime.of(9, 0));
        assertThat(first.getRoomCode()).isEqualTo(room.getCode());
        assertThat(first.getClassCode()).isEqualTo(open.getClassCode());
        assertThat(first.getCourseName()).isNotNull();
    }

    @Test
    void studentScheduleUsesEnrollmentStatus() {
        Student student = data.student();
        ClassOffering enrolled = data.classWithStatus(ClassStatus.OPEN, instructor, admin);
        ClassOffering cancelled = data.classWithStatus(ClassStatus.OPEN, instructor, admin);
        data.session(enrolled, room, DAY, 9, 10).setTopic("Mine");
        data.session(cancelled, room, DAY, 11, 12);
        data.enrollment(student, enrolled);
        Enrollment gone = data.enrollment(student, cancelled);
        gone.setStatus(EnrollmentStatus.CANCELLED);
        gone.setCancelledAt(TestData.NOW);
        data.flushAndClear();

        assertThat(sessions.findStudentSchedule(student.getId(),
                List.of(EnrollmentStatus.ENROLLED, EnrollmentStatus.COMPLETED), PUBLIC, DAY, DAY))
                .extracting(ScheduleEntry::getTopic).containsExactly("Mine");
    }

    @Test
    void dashboardStatusCountsWorkWithNoFiltersAndEachFilter() {
        ClassOffering open = data.classWithStatus(ClassStatus.OPEN, instructor, admin);
        data.classWithStatus(ClassStatus.OPEN, instructor, admin);
        ClassOffering otherSemester = data.draftClass(data.course(), admin);
        otherSemester.setSemester("2031-1");
        ClassOffering deleted = data.draftClass(data.course(), admin);
        softDelete(deleted);
        data.flushAndClear();

        assertThat(statusCounts(null, null, null, null))
                .containsEntry(ClassStatus.OPEN, 2L).containsEntry(ClassStatus.DRAFT, 1L);
        assertThat(statusCounts("2031-1", null, null, null)).containsOnlyKeys(ClassStatus.DRAFT);
        assertThat(statusCounts(null, open.getCourse().getId(), null, null)).containsOnly(Map.entry(ClassStatus.OPEN, 1L));
        assertThat(statusCounts(null, null, DAY.plusDays(1), null)).isEmpty();
        assertThat(statusCounts(null, null, null, DAY.minusDays(1))).isEmpty();
        assertThat(statusCounts(null, null, DAY, DAY).get(ClassStatus.OPEN)).isEqualTo(2L);
    }

    @Test
    void dashboardCapacityTotalsCoverRequestedStatusesAndCanBeEmpty() {
        ClassOffering open = data.classWithStatus(ClassStatus.OPEN, instructor, admin);
        open.setEnrolledCount(5);
        data.classWithStatus(ClassStatus.DRAFT, instructor, admin);
        data.flushAndClear();
        List<ClassStatus> filled = List.of(ClassStatus.OPEN, ClassStatus.IN_PROGRESS);

        CapacityTotals totals = classes.sumCapacityForDashboard(filled, null, null, null, null);
        assertThat(totals.getEnrolled()).isEqualTo(5);
        assertThat(totals.getCapacity()).isEqualTo(30);

        CapacityTotals empty = classes.sumCapacityForDashboard(filled, "no-such-semester", null, null, null);
        assertThat(empty.getEnrolled()).isNull();
        assertThat(empty.getCapacity()).isNull();
    }

    private Map<ClassStatus, Long> statusCounts(String semester, Long courseId, LocalDate from, LocalDate to) {
        return classes.countByStatusForDashboard(semester, courseId, from, to).stream()
                .collect(Collectors.toMap(ClassStatusCount::getStatus, ClassStatusCount::getTotal, Long::sum));
    }

    /** No application code can soft-delete, so this writes the column directly to test the filters. */
    private void softDelete(ClassOffering offering) {
        data.flushAndClear();
        entityManager.createNativeQuery("UPDATE class_offering SET deleted_at = now() WHERE id = :id")
                .setParameter("id", offering.getId()).executeUpdate();
    }

    /** A row lock taken by this transaction sets the row's xmax to its transaction id. */
    private boolean lockedByThisTransaction(String table, Long id) {
        return (Boolean) entityManager.createNativeQuery(
                "SELECT xmax::text::bigint = txid_current() % 4294967296 FROM " + table + " WHERE id = :id")
                .setParameter("id", id).getSingleResult();
    }
}
