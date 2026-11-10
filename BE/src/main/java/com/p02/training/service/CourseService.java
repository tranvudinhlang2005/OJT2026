package com.p02.training.service;

import com.p02.training.audit.SecurityAuditLogger;
import com.p02.training.common.SearchPatterns;
import com.p02.training.dto.request.ChangeStatusRequest;
import com.p02.training.dto.request.CourseRequest;
import com.p02.training.dto.response.CourseResponse;
import com.p02.training.dto.response.PageResponse;
import com.p02.training.entity.Course;
import com.p02.training.entity.enums.SecurityAction;
import com.p02.training.entity.enums.UserRole;
import com.p02.training.exception.ApiException;
import com.p02.training.exception.ErrorCode;
import com.p02.training.repository.ClassOfferingRepository;
import com.p02.training.repository.CourseRepository;
import com.p02.training.security.AuthenticatedUser;
import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * TR02 course management. Every role reads (non-Admins see active courses only); only Training
 * Admins write, which SecurityConfig enforces. Every write logs COURSE_CHANGE in its transaction.
 *
 * <p>Changing thresholds or weights never affects published classes: they keep the copy taken at
 * publication (D13).
 */
@Service
public class CourseService {

    static final int MAX_CODE_LENGTH = 20;

    private static final String COURSE_CODE_DUPLICATE = "COURSE_CODE_DUPLICATE";
    private static final String COURSE_CODE_DUPLICATE_MESSAGE = "Mã Course đã tồn tại";
    private static final String COURSE_IN_USE = "COURSE_IN_USE";
    private static final String COURSE_IN_USE_MESSAGE =
            "Course đã được sử dụng, không thể xóa. Hãy chọn Ngừng sử dụng";
    private static final String INVALID_COURSE_MESSAGE = "Thông tin Course chưa hợp lệ";

    // D13 defaults, used on create when a value is not given (the same as the V1 column defaults).
    private static final BigDecimal DEFAULT_MIN_ATTENDANCE_PCT = new BigDecimal("80.00");
    private static final BigDecimal DEFAULT_PASS_SCORE = new BigDecimal("5.00");
    private static final BigDecimal DEFAULT_MIDTERM_WEIGHT = new BigDecimal("0.40");
    private static final BigDecimal DEFAULT_FINAL_WEIGHT = new BigDecimal("0.60");

    private static final BigDecimal HUNDRED = new BigDecimal("100");
    private static final BigDecimal TEN = BigDecimal.TEN;

    private final CourseRepository courseRepository;
    private final ClassOfferingRepository classOfferingRepository;
    private final SecurityAuditLogger auditLogger;

    public CourseService(CourseRepository courseRepository, ClassOfferingRepository classOfferingRepository,
            SecurityAuditLogger auditLogger) {
        this.courseRepository = courseRepository;
        this.classOfferingRepository = classOfferingRepository;
        this.auditLogger = auditLogger;
    }

    /**
     * {@code GET /courses?keyword=&isActive=}. Admins see every course; other roles only active ones,
     * whatever isActive says. The keyword matches code or name, ignoring case. Sorted by code,
     * because TR02 defines no sort field.
     */
    @Transactional(readOnly = true)
    public PageResponse<CourseResponse> listCourses(String keyword, Boolean isActive, int page, int size,
            AuthenticatedUser viewer) {
        boolean admin = isAdmin(viewer);
        Specification<Course> specification = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (!admin) {
                predicates.add(cb.isTrue(root.get("active")));
            }
            if (isActive != null) {
                predicates.add(cb.equal(root.get("active"), isActive));
            }
            if (SearchPatterns.hasKeyword(keyword)) {
                String pattern = SearchPatterns.containsIgnoringCase(keyword);
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("code")), pattern, SearchPatterns.ESCAPE),
                        cb.like(cb.lower(root.get("name")), pattern, SearchPatterns.ESCAPE)));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
        PageRequest pageable = PageRequest.of(page, size, Sort.by("code").and(Sort.by("id")));
        return PageResponse.of(courseRepository.findAll(specification, pageable), CourseResponse::from);
    }

    /** {@code GET /courses/{id}}. An inactive course is 404 for non-Admins, who cannot see it (spec 0.4). */
    @Transactional(readOnly = true)
    public CourseResponse getCourse(Long id, AuthenticatedUser viewer) {
        Course course = findCourse(id);
        if (!course.isActive() && !isAdmin(viewer)) {
            throw notFound();
        }
        return CourseResponse.from(course);
    }

    /** {@code POST /courses}. */
    @Transactional
    public CourseResponse createCourse(CourseRequest request, AuthenticatedUser actor) {
        String code = normalizeCode(request.code());
        validateRanges(request);
        Course course = new Course(code, request.name(), request.credits(), request.durationHours());
        applyThresholds(course, request,
                DEFAULT_MIN_ATTENDANCE_PCT, DEFAULT_PASS_SCORE, DEFAULT_MIDTERM_WEIGHT, DEFAULT_FINAL_WEIGHT);

        if (courseRepository.existsByCode(code)) {
            throw duplicateCode();
        }
        saveAndFlush(course);
        log(actor, "CREATE", course);
        return CourseResponse.from(course);
    }

    /** {@code PUT /courses/{id}}. A null threshold or weight keeps its current value. */
    @Transactional
    public CourseResponse updateCourse(Long id, CourseRequest request, AuthenticatedUser actor) {
        String code = normalizeCode(request.code());
        validateRanges(request);
        Course course = findCourse(id);
        applyThresholds(course, request, course.getMinAttendancePct(), course.getPassScore(),
                course.getMidtermWeight(), course.getFinalWeight());

        if (courseRepository.existsByCodeAndIdNot(code, id)) {
            throw duplicateCode();
        }
        course.setCode(code);
        course.setName(request.name());
        course.setCredits(request.credits());
        course.setDurationHours(request.durationHours());
        saveAndFlush(course);
        log(actor, "UPDATE", course);
        return CourseResponse.from(course);
    }

    /**
     * {@code PATCH /courses/{id}/status}. false is "Ngừng sử dụng": the course stays in history but
     * new classes cannot use it (checked by TR05). true makes it usable again.
     */
    @Transactional
    public CourseResponse changeStatus(Long id, ChangeStatusRequest request, AuthenticatedUser actor) {
        Course course = findCourse(id);
        course.setActive(request.isActive());
        log(actor, "STATUS", course);
        return CourseResponse.from(course);
    }

    /**
     * {@code DELETE /courses/{id}}: only when no class refers to the course, including cancelled,
     * closed and soft-deleted ones. Its InstructorCourse rows are removed by the database (A-18).
     */
    @Transactional
    public void deleteCourse(Long id, AuthenticatedUser actor) {
        Course course = findCourse(id);
        if (classOfferingRepository.existsByCourse_Id(id)) {
            throw inUse();
        }
        log(actor, "DELETE", course);
        try {
            courseRepository.delete(course);
            courseRepository.flush();
        } catch (DataIntegrityViolationException ex) {
            // A class was created for this course after the check above.
            throw inUse();
        }
    }

    private Course findCourse(Long id) {
        return courseRepository.findById(id).orElseThrow(CourseService::notFound);
    }

    /** Trims and upper-cases the code (TR02), then checks it is not empty and at most 20 characters. */
    private static String normalizeCode(String rawCode) {
        String code = rawCode.trim().toUpperCase(Locale.ROOT);
        if (code.isEmpty() || code.length() > MAX_CODE_LENGTH) {
            throw ApiException.validation("code", "Mã Course từ 1 đến 20 ký tự");
        }
        return code;
    }

    /**
     * Checks the TR02 ranges of the thresholds and weights that were sent, before anything is loaded
     * (spec 0.3: input before existence). Failures are a 422 VALIDATION_ERROR with TR02's message.
     */
    private static void validateRanges(CourseRequest request) {
        Map<String, List<String>> problems = new LinkedHashMap<>();
        checkRange(problems, "minAttendancePct", request.minAttendancePct(), HUNDRED, "Phải nằm trong khoảng 0–100");
        checkRange(problems, "passScore", request.passScore(), TEN, "Phải nằm trong khoảng 0–10");
        checkRange(problems, "midtermWeight", request.midtermWeight(), BigDecimal.ONE, "Phải nằm trong khoảng 0–1");
        checkRange(problems, "finalWeight", request.finalWeight(), BigDecimal.ONE, "Phải nằm trong khoảng 0–1");
        if (!problems.isEmpty()) {
            throw invalidCourse(problems);
        }
    }

    /**
     * Resolves each threshold and weight (the sent value, or the fallback: D13 default on create,
     * current value on update), checks that the weights add up to 1, and sets them.
     */
    private static void applyThresholds(Course course, CourseRequest request, BigDecimal minAttendanceFallback,
            BigDecimal passScoreFallback, BigDecimal midtermFallback, BigDecimal finalFallback) {
        BigDecimal midterm = valueOr(request.midtermWeight(), midtermFallback);
        BigDecimal finalWeight = valueOr(request.finalWeight(), finalFallback);
        if (midterm.add(finalWeight).compareTo(BigDecimal.ONE) != 0) {
            String message = "Tổng trọng số giữa kỳ và cuối kỳ phải bằng 1";
            Map<String, List<String>> problems = new LinkedHashMap<>();
            problems.put("midtermWeight", List.of(message));
            problems.put("finalWeight", List.of(message));
            throw invalidCourse(problems);
        }
        course.setMinAttendancePct(valueOr(request.minAttendancePct(), minAttendanceFallback));
        course.setPassScore(valueOr(request.passScore(), passScoreFallback));
        course.setMidtermWeight(midterm);
        course.setFinalWeight(finalWeight);
    }

    private static void checkRange(Map<String, List<String>> problems, String field, BigDecimal value,
            BigDecimal max, String message) {
        if (value != null && (value.compareTo(BigDecimal.ZERO) < 0 || value.compareTo(max) > 0)) {
            problems.put(field, List.of(message));
        }
    }

    private static ApiException invalidCourse(Map<String, List<String>> problems) {
        ErrorCode errorCode = ErrorCode.VALIDATION_ERROR;
        return new ApiException(errorCode.status(), errorCode.name(), INVALID_COURSE_MESSAGE, problems);
    }

    private void saveAndFlush(Course course) {
        try {
            courseRepository.saveAndFlush(course);
        } catch (DataIntegrityViolationException ex) {
            // Another request took the same code after the duplicate check.
            throw duplicateCode();
        }
    }

    private void log(AuthenticatedUser actor, String operation, Course course) {
        Map<String, Object> details = new LinkedHashMap<>();
        details.put("operation", operation);
        details.put("courseId", course.getId());
        details.put("code", course.getCode());
        if ("STATUS".equals(operation)) {
            details.put("isActive", course.isActive());
        }
        auditLogger.record(SecurityAction.COURSE_CHANGE, actor.username(), details);
    }

    private static boolean isAdmin(AuthenticatedUser user) {
        return user != null && user.role() == UserRole.TRAINING_ADMIN;
    }

    private static BigDecimal valueOr(BigDecimal value, BigDecimal fallback) {
        return value != null ? value : fallback;
    }

    private static ApiException notFound() {
        return new ApiException(ErrorCode.NOT_FOUND);
    }

    private static ApiException duplicateCode() {
        return ApiException.conflict(COURSE_CODE_DUPLICATE, COURSE_CODE_DUPLICATE_MESSAGE);
    }

    private static ApiException inUse() {
        return ApiException.conflict(COURSE_IN_USE, COURSE_IN_USE_MESSAGE);
    }
}
