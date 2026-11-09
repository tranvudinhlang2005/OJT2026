package com.p02.training.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.p02.training.entity.AppSecurityLog;
import com.p02.training.entity.AssessmentResult;
import com.p02.training.entity.Attendance;
import com.p02.training.entity.ClassOffering;
import com.p02.training.entity.Course;
import com.p02.training.entity.Enrollment;
import com.p02.training.entity.GradeAuditLog;
import com.p02.training.entity.Instructor;
import com.p02.training.entity.InstructorCourse;
import com.p02.training.entity.InstructorCourseId;
import com.p02.training.entity.Room;
import com.p02.training.entity.Session;
import com.p02.training.entity.Student;
import com.p02.training.entity.User;
import com.p02.training.entity.enums.UserRole;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.repository.support.Repositories;

class AccountAndCatalogRepositoryTest extends RepositoryTestSupport {

    @Autowired
    private ApplicationContext applicationContext;

    @Autowired
    private UserRepository users;

    @Autowired
    private StudentRepository students;

    @Autowired
    private InstructorRepository instructors;

    @Autowired
    private CourseRepository courses;

    @Autowired
    private InstructorCourseRepository instructorCourses;

    @Autowired
    private RoomRepository rooms;

    @Test
    void everyEntityHasARepository() {
        Repositories repositories = new Repositories(applicationContext);

        assertThat(List.of(User.class, Student.class, Instructor.class, Course.class, InstructorCourse.class,
                Room.class, ClassOffering.class, Session.class, Enrollment.class, Attendance.class,
                AssessmentResult.class, GradeAuditLog.class, AppSecurityLog.class))
                .allSatisfy(entity -> assertThat(repositories.hasRepositoryFor(entity)).isTrue());
    }

    @Test
    void usernameAndEmailLookupsIgnoreCase() {
        User user = data.user(UserRole.TRAINING_ADMIN);
        data.flushAndClear();

        assertThat(users.findByUsernameIgnoringCase(user.getUsername().toUpperCase())).isPresent();
        assertThat(users.findByUsernameIgnoringCase("missing")).isEmpty();
        assertThat(users.existsByUsernameIgnoringCase(user.getUsername().toUpperCase())).isTrue();
        assertThat(users.existsByEmailIgnoringCase(user.getEmail().toUpperCase())).isTrue();
        assertThat(users.existsByEmailIgnoringCase("missing@test.local")).isFalse();
    }

    @Test
    void emailDuplicateCheckCanExcludeTheUserBeingEdited() {
        User first = data.user(UserRole.STUDENT);
        User second = data.user(UserRole.STUDENT);
        data.flushAndClear();

        assertThat(users.existsByEmailIgnoringCaseAndIdNot(first.getEmail(), first.getId())).isFalse();
        assertThat(users.existsByEmailIgnoringCaseAndIdNot(first.getEmail(), second.getId())).isTrue();
    }

    @Test
    void lastAdminCountSkipsInactiveAdminsButBootstrapCheckDoesNot() {
        assertThat(users.existsByRole(UserRole.TRAINING_ADMIN)).isFalse();

        User inactive = data.user(UserRole.TRAINING_ADMIN);
        inactive.setActive(false);
        data.flushAndClear();

        assertThat(users.countByRoleAndActiveTrue(UserRole.TRAINING_ADMIN)).isZero();
        assertThat(users.existsByRole(UserRole.TRAINING_ADMIN)).isTrue();

        data.user(UserRole.TRAINING_ADMIN);
        data.flushAndClear();

        assertThat(users.countByRoleAndActiveTrue(UserRole.TRAINING_ADMIN)).isEqualTo(1);
    }

    @Test
    void usersCanBeFilteredPagedAndSortedBySpecification() {
        data.user(UserRole.STUDENT);
        data.user(UserRole.STUDENT);
        data.user(UserRole.INSTRUCTOR);
        data.flushAndClear();
        Specification<User> students = (root, query, builder) -> builder.equal(root.get("role"), UserRole.STUDENT);

        Page<User> page = users.findAll(students, PageRequest.of(0, 1, Sort.by(Sort.Direction.DESC, "username")));

        assertThat(page.getTotalElements()).isEqualTo(2);
        assertThat(page.getContent()).hasSize(1);
        assertThat(page.getContent().get(0).getRole()).isEqualTo(UserRole.STUDENT);
    }

    @Test
    void profilesAreFoundFromTheLoggedInUser() {
        Student student = data.student();
        Instructor instructor = data.instructor();
        Long studentUser = student.getUser().getId();
        Long instructorUser = instructor.getUser().getId();
        data.flushAndClear();

        assertThat(students.findByUser_Id(studentUser)).get().extracting(Student::getId).isEqualTo(student.getId());
        assertThat(instructors.findByUser_Id(instructorUser)).get().extracting(Instructor::getId).isEqualTo(instructor.getId());
        assertThat(students.findByUser_Id(instructorUser)).isEmpty();
    }

    @Test
    void codeDuplicateChecksCanExcludeTheRowBeingEdited() {
        Student student = data.student();
        Instructor instructor = data.instructor();
        Course course = data.course();
        Room room = data.room(20);
        data.flushAndClear();

        assertThat(students.existsByStudentCode(student.getStudentCode())).isTrue();
        assertThat(students.existsByStudentCodeAndIdNot(student.getStudentCode(), student.getId())).isFalse();
        assertThat(instructors.existsByInstructorCode(instructor.getInstructorCode())).isTrue();
        assertThat(instructors.existsByInstructorCodeAndIdNot(instructor.getInstructorCode(), instructor.getId())).isFalse();
        assertThat(courses.existsByCode(course.getCode())).isTrue();
        assertThat(courses.existsByCodeAndIdNot(course.getCode(), course.getId())).isFalse();
        assertThat(rooms.existsByCode(room.getCode())).isTrue();
        assertThat(rooms.existsByCodeAndIdNot(room.getCode(), room.getId())).isFalse();
    }

    @Test
    void onlyActiveCoursesAreReturned() {
        Course active = data.course();
        Course inactive = data.course();
        inactive.setActive(false);
        data.flushAndClear();

        assertThat(courses.findByIdInAndActiveTrue(List.of(active.getId(), inactive.getId())))
                .extracting(Course::getId).containsExactly(active.getId());
    }

    @Test
    void studentListLoadsAccountsWithoutNPlusOne() {
        data.student();
        data.student();
        data.student();

        long statements = countStatements(() -> {
            Page<Student> page = students.findAll((Specification<Student>) null, PageRequest.of(0, 2));
            page.getContent().forEach(student -> student.getUser().getFullName());
            return page;
        });

        assertThat(statements).as("one page query and one count query").isEqualTo(2);
    }

    @Test
    void compositeKeySupportsEligibilityCheck() {
        Instructor instructor = data.instructor();
        Course assigned = data.course();
        Course other = data.course();
        entityManager.flush();
        data.persist(new InstructorCourse(instructor, assigned));
        data.flushAndClear();

        assertThat(instructorCourses.existsById(new InstructorCourseId(instructor.getId(), assigned.getId()))).isTrue();
        assertThat(instructorCourses.existsById(new InstructorCourseId(instructor.getId(), other.getId()))).isFalse();
        assertThat(instructorCourses.findById(new InstructorCourseId(instructor.getId(), assigned.getId()))).isPresent();
    }

    @Test
    void instructorCoursesLoadWithoutNPlusOne() {
        Instructor instructor = data.instructor();
        Course first = data.course();
        Course second = data.course();
        entityManager.flush();
        data.persist(new InstructorCourse(instructor, first));
        data.persist(new InstructorCourse(instructor, second));

        long statements = countStatements(() -> {
            List<InstructorCourse> rows = instructorCourses.findById_InstructorId(instructor.getId());
            assertThat(rows).extracting(row -> row.getCourse().getCode())
                    .containsExactlyInAnyOrder(first.getCode(), second.getCode());
            return rows;
        });

        assertThat(statements).isEqualTo(1);
    }

    @Test
    void courseSetChangeDeletesOnlyRemovedRowsAndInsertsNewOnes() {
        Instructor instructor = data.instructor();
        Course kept = data.course();
        Course removed = data.course();
        Course added = data.course();
        entityManager.flush();
        instructorCourses.saveAll(List.of(new InstructorCourse(instructor, kept), new InstructorCourse(instructor, removed)));
        data.flushAndClear();

        instructorCourses.deleteById_InstructorIdAndId_CourseIdIn(instructor.getId(), List.of(removed.getId()));
        instructorCourses.save(new InstructorCourse(entityManager.getReference(Instructor.class, instructor.getId()),
                entityManager.getReference(Course.class, added.getId())));
        data.flushAndClear();

        assertThat(instructorCourses.findById_InstructorId(instructor.getId()))
                .extracting(row -> row.getId().getCourseId())
                .containsExactlyInAnyOrder(kept.getId(), added.getId());
    }

    @Test
    void roomsArePagedAndSorted() {
        Room first = data.room(10);
        Room second = data.room(20);
        data.flushAndClear();

        Page<Room> page = rooms.findAll(PageRequest.of(0, 50, Sort.by(Sort.Direction.DESC, "capacity")));

        assertThat(page.getContent()).extracting(Room::getId).containsSubsequence(second.getId(), first.getId());
    }
}
