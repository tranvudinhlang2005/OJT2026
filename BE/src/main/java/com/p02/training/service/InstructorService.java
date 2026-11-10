package com.p02.training.service;

import com.p02.training.audit.SecurityAuditLogger;
import com.p02.training.common.SearchPatterns;
import com.p02.training.dto.request.AssignCoursesRequest;
import com.p02.training.dto.request.ChangeStatusRequest;
import com.p02.training.dto.request.UpdateInstructorRequest;
import com.p02.training.dto.response.CourseSummaryResponse;
import com.p02.training.dto.response.InstructorDetailResponse;
import com.p02.training.dto.response.InstructorSummaryResponse;
import com.p02.training.dto.response.MyInstructorProfileResponse;
import com.p02.training.dto.response.PageResponse;
import com.p02.training.entity.Course;
import com.p02.training.entity.Instructor;
import com.p02.training.entity.InstructorCourse;
import com.p02.training.entity.User;
import com.p02.training.entity.enums.ClassStatus;
import com.p02.training.entity.enums.SecurityAction;
import com.p02.training.exception.ApiException;
import com.p02.training.exception.ErrorCode;
import com.p02.training.repository.ClassOfferingRepository;
import com.p02.training.repository.CourseRepository;
import com.p02.training.repository.InstructorCourseRepository;
import com.p02.training.repository.InstructorRepository;
import com.p02.training.security.AuthenticatedUser;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * TR03 instructor management. Profiles are created with the account in TR01; TR03 only updates
 * them. Admins read and write; an instructor reads only their own profile (/me). Roles are enforced
 * in SecurityConfig. Every write locks the Instructor row first (spec 0.5) and logs
 * INSTRUCTOR_CHANGE in its transaction.
 */
@Service
public class InstructorService {

    private static final String INSTRUCTOR_CODE_DUPLICATE = "INSTRUCTOR_CODE_DUPLICATE";
    private static final String INSTRUCTOR_CODE_DUPLICATE_MESSAGE = "Mã giảng viên đã tồn tại";
    private static final String INSTRUCTOR_COURSE_IN_USE = "INSTRUCTOR_COURSE_IN_USE";
    private static final String INVALID_COURSES_MESSAGE = "Môn học không hợp lệ";

    /** Classes that keep a course assigned to their instructor (TR03). */
    private static final Set<ClassStatus> CLASS_STATUSES_IN_USE =
            EnumSet.of(ClassStatus.DRAFT, ClassStatus.OPEN, ClassStatus.IN_PROGRESS);

    private final InstructorRepository instructorRepository;
    private final InstructorCourseRepository instructorCourseRepository;
    private final CourseRepository courseRepository;
    private final ClassOfferingRepository classOfferingRepository;
    private final SecurityAuditLogger auditLogger;

    public InstructorService(InstructorRepository instructorRepository,
            InstructorCourseRepository instructorCourseRepository, CourseRepository courseRepository,
            ClassOfferingRepository classOfferingRepository, SecurityAuditLogger auditLogger) {
        this.instructorRepository = instructorRepository;
        this.instructorCourseRepository = instructorCourseRepository;
        this.courseRepository = courseRepository;
        this.classOfferingRepository = classOfferingRepository;
        this.auditLogger = auditLogger;
    }

    /**
     * {@code GET /instructors?keyword=&isActive=&courseId=}. keyword matches the instructor code, full
     * name, username or email, ignoring case; isActive filters the profile flag; courseId keeps
     * instructors who may teach that course. Sorted by instructor code, because TR03 defines no
     * sort field. Accounts are loaded in the same query.
     */
    @Transactional(readOnly = true)
    public PageResponse<InstructorSummaryResponse> listInstructors(String keyword, Boolean isActive, Long courseId,
            int page, int size) {
        Specification<Instructor> specification = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (isActive != null) {
                predicates.add(cb.equal(root.get("active"), isActive));
            }
            if (SearchPatterns.hasKeyword(keyword)) {
                String pattern = SearchPatterns.containsIgnoringCase(keyword);
                Join<Instructor, User> user = root.join("user");
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("instructorCode")), pattern, SearchPatterns.ESCAPE),
                        cb.like(cb.lower(user.get("fullName")), pattern, SearchPatterns.ESCAPE),
                        cb.like(cb.lower(user.get("username")), pattern, SearchPatterns.ESCAPE),
                        cb.like(cb.lower(user.get("email")), pattern, SearchPatterns.ESCAPE)));
            }
            if (courseId != null) {
                Subquery<Integer> teaches = query.subquery(Integer.class);
                Root<InstructorCourse> link = teaches.from(InstructorCourse.class);
                teaches.select(cb.literal(1)).where(
                        cb.equal(link.get("instructor"), root),
                        cb.equal(link.get("course").get("id"), courseId));
                predicates.add(cb.exists(teaches));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
        PageRequest pageable = PageRequest.of(page, size, Sort.by("instructorCode").and(Sort.by("id")));
        return PageResponse.of(instructorRepository.findAll(specification, pageable), InstructorSummaryResponse::from);
    }

    /** {@code GET /instructors/{id}} for Admins: profile, account and courses. */
    @Transactional(readOnly = true)
    public InstructorDetailResponse getInstructor(Long id) {
        Instructor instructor = instructorRepository.findById(id).orElseThrow(InstructorService::notFound);
        return InstructorDetailResponse.from(instructor, coursesOf(id));
    }

    /**
     * {@code GET /instructors/me}: the logged-in instructor's own profile. 404 if the account has no
     * profile, which TR01 normally prevents.
     */
    @Transactional(readOnly = true)
    public MyInstructorProfileResponse getMyProfile(AuthenticatedUser currentUser) {
        Instructor instructor = instructorRepository.findByUser_Id(currentUser.id())
                .orElseThrow(InstructorService::notFound);
        return MyInstructorProfileResponse.from(instructor, coursesOf(instructor.getId()));
    }

    /** {@code PUT /instructors/{id}}: code, department and phone. */
    @Transactional
    public InstructorDetailResponse updateInstructor(Long id, UpdateInstructorRequest request, AuthenticatedUser actor) {
        Instructor instructor = lockInstructor(id);
        if (instructorRepository.existsByInstructorCodeAndIdNot(request.instructorCode(), id)) {
            throw duplicateCode();
        }
        instructor.setInstructorCode(request.instructorCode());
        instructor.setDepartment(request.department());
        instructor.setPhone(request.phone());
        try {
            instructorRepository.flush();
        } catch (DataIntegrityViolationException ex) {
            // Another request took the same code after the check above.
            throw duplicateCode();
        }

        Map<String, Object> details = new LinkedHashMap<>();
        details.put("operation", "UPDATE");
        details.put("instructorId", id);
        details.put("instructorCode", instructor.getInstructorCode());
        auditLogger.record(SecurityAction.INSTRUCTOR_CHANGE, actor.username(), details);
        return InstructorDetailResponse.from(instructor, coursesOf(id));
    }

    /**
     * {@code PUT /instructors/{id}/courses}: replaces the set of courses the instructor may teach
     * (TR03, decision A-29 on inactive courses).
     *
     * <ul>
     *   <li>Every id must be an existing course (422).</li>
     *   <li>A course the instructor already has is kept even if it is now inactive, so an unchanged
     *       list is always accepted.</li>
     *   <li>A course that is not yet assigned must be active (422): an inactive course is never newly
     *       assigned.</li>
     *   <li>Any assigned course, active or inactive, can be removed unless the instructor teaches one
     *       of its DRAFT, OPEN or IN_PROGRESS classes (409 INSTRUCTOR_COURSE_IN_USE, naming the codes).</li>
     * </ul>
     *
     * <p>Which ids are "already assigned" is decided only from the database, under the Instructor row
     * lock, never from the request; so a request cannot pass a new inactive course off as an existing
     * one, and two concurrent requests for the same instructor cannot interleave. Only the difference
     * is written: removed rows are deleted, new rows inserted.
     */
    @Transactional
    public InstructorDetailResponse assignCourses(Long id, AssignCoursesRequest request, AuthenticatedUser actor) {
        Set<Long> requested = new LinkedHashSet<>(request.courseIds());
        // Input before existence (spec 0.3): an id that is not a course at all is never valid.
        requireExistingCourses(requested);

        Instructor instructor = lockInstructor(id);
        Set<Long> current = instructorCourseRepository.findById_InstructorId(id).stream()
                .map(link -> link.getId().getCourseId())
                .collect(Collectors.toCollection(LinkedHashSet::new));

        Set<Long> removed = new LinkedHashSet<>(current);
        removed.removeAll(requested);
        Set<Long> added = new LinkedHashSet<>(requested);
        added.removeAll(current);

        // Only new assignments must be active; kept ones are not re-checked (A-29).
        Map<Long, Course> addedCourses = loadActiveCourses(added);

        if (!removed.isEmpty()) {
            List<String> codesInUse = classOfferingRepository.findCourseCodesInUse(id, removed, CLASS_STATUSES_IN_USE);
            if (!codesInUse.isEmpty()) {
                throw ApiException.conflict(INSTRUCTOR_COURSE_IN_USE, "Giảng viên đang phụ trách lớp của môn "
                        + String.join(", ", codesInUse.stream().sorted().toList()) + ", không thể gỡ");
            }
            instructorCourseRepository.deleteById_InstructorIdAndId_CourseIdIn(id, removed);
        }
        if (!added.isEmpty()) {
            try {
                instructorCourseRepository.saveAll(added.stream()
                        .map(courseId -> new InstructorCourse(instructor, addedCourses.get(courseId)))
                        .toList());
                instructorCourseRepository.flush();
            } catch (DataIntegrityViolationException ex) {
                // A requested course was deleted (TR02) after it was checked. Concurrent changes to
                // this instructor are already excluded by the Instructor row lock.
                throw invalidCourses("Môn học không tồn tại hoặc đã ngừng sử dụng");
            }
        }

        Map<String, Object> details = new LinkedHashMap<>();
        details.put("operation", "COURSES");
        details.put("instructorId", id);
        details.put("addedCourseIds", List.copyOf(added));
        details.put("removedCourseIds", List.copyOf(removed));
        auditLogger.record(SecurityAction.INSTRUCTOR_CHANGE, actor.username(), details);
        return InstructorDetailResponse.from(instructor, coursesOf(id));
    }

    /**
     * {@code PATCH /instructors/{id}/status}. false is "Ngừng nhận lớp": classes already taught stay
     * as they are, but the instructor cannot be assigned more (checked by TR05/TR07). Logging in is
     * TR01's concern and is not changed.
     */
    @Transactional
    public InstructorDetailResponse changeStatus(Long id, ChangeStatusRequest request, AuthenticatedUser actor) {
        Instructor instructor = lockInstructor(id);
        instructor.setActive(request.isActive());

        Map<String, Object> details = new LinkedHashMap<>();
        details.put("operation", "STATUS");
        details.put("instructorId", id);
        details.put("isActive", instructor.isActive());
        auditLogger.record(SecurityAction.INSTRUCTOR_CHANGE, actor.username(), details);
        return InstructorDetailResponse.from(instructor, coursesOf(id));
    }

    /** Fails with 422 VALIDATION_ERROR naming every id that is not an existing course. */
    private void requireExistingCourses(Set<Long> courseIds) {
        if (courseIds.isEmpty()) {
            return;
        }
        Set<Long> existing = courseRepository.findAllById(courseIds).stream()
                .map(Course::getId)
                .collect(Collectors.toSet());
        List<Long> missing = courseIds.stream().filter(courseId -> !existing.contains(courseId)).toList();
        if (!missing.isEmpty()) {
            throw invalidCourses("Môn học không tồn tại: " + joinIds(missing));
        }
    }

    /**
     * Loads the courses about to be newly assigned, all of which must be active, or fails with 422
     * VALIDATION_ERROR naming the inactive (or meanwhile deleted) ids.
     */
    private Map<Long, Course> loadActiveCourses(Set<Long> courseIds) {
        if (courseIds.isEmpty()) {
            return Map.of();
        }
        Map<Long, Course> courses = courseRepository.findByIdInAndActiveTrue(courseIds).stream()
                .collect(Collectors.toMap(Course::getId, Function.identity()));
        List<Long> invalid = courseIds.stream().filter(courseId -> !courses.containsKey(courseId)).toList();
        if (!invalid.isEmpty()) {
            throw invalidCourses("Môn học đã ngừng sử dụng, không thể phân công mới: " + joinIds(invalid));
        }
        return courses;
    }

    private static String joinIds(List<Long> ids) {
        return ids.stream().map(String::valueOf).collect(Collectors.joining(", "));
    }

    /** 422 VALIDATION_ERROR with TR03's message "Môn học không hợp lệ" and the detail on courseIds. */
    private static ApiException invalidCourses(String detail) {
        ErrorCode errorCode = ErrorCode.VALIDATION_ERROR;
        return new ApiException(errorCode.status(), errorCode.name(), INVALID_COURSES_MESSAGE,
                Map.of("courseIds", List.of(detail)));
    }

    private List<CourseSummaryResponse> coursesOf(Long instructorId) {
        return instructorCourseRepository.findById_InstructorId(instructorId).stream()
                .map(link -> CourseSummaryResponse.from(link.getCourse()))
                .sorted(Comparator.comparing(CourseSummaryResponse::code))
                .toList();
    }

    private Instructor lockInstructor(Long id) {
        return instructorRepository.findLockedById(id).orElseThrow(InstructorService::notFound);
    }

    private static ApiException notFound() {
        return new ApiException(ErrorCode.NOT_FOUND);
    }

    private static ApiException duplicateCode() {
        return ApiException.conflict(INSTRUCTOR_CODE_DUPLICATE, INSTRUCTOR_CODE_DUPLICATE_MESSAGE);
    }
}
