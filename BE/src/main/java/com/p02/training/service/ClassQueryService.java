package com.p02.training.service;

import com.p02.training.common.SearchPatterns;
import com.p02.training.dto.response.ClassResponse;
import com.p02.training.dto.response.ClassSummaryResponse;
import com.p02.training.dto.response.ClassView;
import com.p02.training.dto.response.PageResponse;
import com.p02.training.entity.ClassOffering;
import com.p02.training.entity.Course;
import com.p02.training.entity.Instructor;
import com.p02.training.entity.enums.ClassStatus;
import com.p02.training.entity.enums.UserRole;
import com.p02.training.exception.ApiException;
import com.p02.training.exception.ErrorCode;
import com.p02.training.repository.ClassOfferingRepository;
import com.p02.training.repository.InstructorRepository;
import com.p02.training.security.AuthenticatedUser;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * TR09 class list and detail for every role. The role's scope is added to the query by the backend
 * and cannot be widened by the client; filters can only narrow it (a Student or Manager sending
 * status=DRAFT gets an empty result, not an error). The total is counted after the scope.
 *
 * <ul>
 *   <li>Admin: every class that is not soft-deleted.</li>
 *   <li>Instructor: OPEN, IN_PROGRESS and CLOSED classes, plus their own classes in any status
 *       except CANCELLED.</li>
 *   <li>Student: OPEN classes starting after today (open for registration).</li>
 *   <li>Manager: OPEN, IN_PROGRESS and CLOSED classes.</li>
 * </ul>
 */
@Service
public class ClassQueryService {

    /** Published classes. */
    private static final Set<ClassStatus> PUBLISHED =
            EnumSet.of(ClassStatus.OPEN, ClassStatus.IN_PROGRESS, ClassStatus.CLOSED);

    /** Sort whitelist (TR09): request name → entity path. */
    private static final Map<String, String> SORTABLE =
            Map.of("startDate", "startDate", "classCode", "classCode", "courseName", "course.name");

    static final int MAX_PAGE_SIZE = 100;
    private static final String INVALID_PARAMETERS_MESSAGE = "Bộ lọc hoặc tham số sắp xếp không hợp lệ";

    private final ClassOfferingRepository classOfferingRepository;
    private final InstructorRepository instructorRepository;
    private final Clock clock;

    public ClassQueryService(ClassOfferingRepository classOfferingRepository, InstructorRepository instructorRepository,
            Clock clock) {
        this.classOfferingRepository = classOfferingRepository;
        this.instructorRepository = instructorRepository;
        this.clock = clock;
    }

    /** The filters of {@code GET /classes}. Every field is optional. */
    public record ClassFilter(String keyword, Long courseId, String semester, ClassStatus status, Long instructorId) {
    }

    /**
     * {@code GET /classes}. keyword matches the class code or the course code or name, ignoring
     * case. sort accepts startDate, classCode or courseName, optionally followed by ",asc" or
     * ",desc"; the default is startDate ascending. Invalid sort, page or size is 422.
     */
    @Transactional(readOnly = true)
    public PageResponse<ClassView> listClasses(ClassFilter filter, int page, int size, String sort,
            AuthenticatedUser viewer) {
        Sort order = parseSort(sort);
        if (page < 0 || size < 1 || size > MAX_PAGE_SIZE) {
            throw invalidParameters(page < 0 ? "page" : "size", "page ≥ 0, size từ 1 đến " + MAX_PAGE_SIZE);
        }
        Scope scope = scopeOf(viewer);
        Specification<ClassOffering> specification = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.isNull(root.get("deletedAt")));
            predicates.add(scope.toPredicate(root, cb));
            addFilters(filter, root, cb, predicates);
            return cb.and(predicates.toArray(Predicate[]::new));
        };
        PageRequest pageable = PageRequest.of(page, size, order.and(Sort.by("id")));
        return PageResponse.of(classOfferingRepository.findAll(specification, pageable),
                classOffering -> toView(classOffering, viewer));
    }

    /** {@code GET /classes/{id}}. A class outside the caller's scope is 404 "Không tìm thấy lớp học". */
    @Transactional(readOnly = true)
    public ClassView getClass(Long id, AuthenticatedUser viewer) {
        ClassOffering classOffering = classOfferingRepository.findWithDetailsByIdAndDeletedAtIsNull(id)
                .orElseThrow(ClassQueryService::classNotFound);
        if (!scopeOf(viewer).contains(classOffering)) {
            throw classNotFound();
        }
        return toView(classOffering, viewer);
    }

    // --- scope ------------------------------------------------------------------------------------

    /** The role's scope, both as a query predicate and as an in-memory check, so list and detail agree. */
    private record Scope(UserRole role, Long ownInstructorId, LocalDate today) {

        Predicate toPredicate(Root<ClassOffering> root, CriteriaBuilder cb) {
            return switch (role) {
                case TRAINING_ADMIN -> cb.conjunction();
                case TRAINING_MANAGER -> root.get("status").in(PUBLISHED);
                case STUDENT -> cb.and(cb.equal(root.get("status"), ClassStatus.OPEN),
                        cb.greaterThan(root.get("startDate"), today));
                case INSTRUCTOR -> ownInstructorId == null
                        ? root.get("status").in(PUBLISHED)
                        : cb.or(root.get("status").in(PUBLISHED), cb.and(
                                cb.equal(root.get("instructor").get("id"), ownInstructorId),
                                cb.notEqual(root.get("status"), ClassStatus.CANCELLED)));
            };
        }

        boolean contains(ClassOffering classOffering) {
            ClassStatus status = classOffering.getStatus();
            return switch (role) {
                case TRAINING_ADMIN -> true;
                case TRAINING_MANAGER -> PUBLISHED.contains(status);
                case STUDENT -> status == ClassStatus.OPEN && classOffering.getStartDate().isAfter(today);
                case INSTRUCTOR -> PUBLISHED.contains(status)
                        || (ownInstructorId != null && status != ClassStatus.CANCELLED
                            && classOffering.getInstructor() != null
                            && Objects.equals(classOffering.getInstructor().getId(), ownInstructorId));
            };
        }
    }

    private Scope scopeOf(AuthenticatedUser viewer) {
        if (viewer == null) {
            // Unreachable behind SecurityConfig; the narrowest scope is the safe default.
            return new Scope(UserRole.STUDENT, null, LocalDate.now(clock));
        }
        Long ownInstructorId = viewer.role() == UserRole.INSTRUCTOR
                ? instructorRepository.findByUser_Id(viewer.id()).map(Instructor::getId).orElse(null)
                : null;
        return new Scope(viewer.role(), ownInstructorId, LocalDate.now(clock));
    }

    // --- filters, sort, mapping ------------------------------------------------------------------

    private static void addFilters(ClassFilter filter, Root<ClassOffering> root, CriteriaBuilder cb,
            List<Predicate> predicates) {
        if (filter.courseId() != null) {
            predicates.add(cb.equal(root.get("course").get("id"), filter.courseId()));
        }
        if (filter.semester() != null && !filter.semester().isBlank()) {
            predicates.add(cb.equal(root.get("semester"), filter.semester().trim()));
        }
        if (filter.status() != null) {
            predicates.add(cb.equal(root.get("status"), filter.status()));
        }
        if (filter.instructorId() != null) {
            predicates.add(cb.equal(root.get("instructor").get("id"), filter.instructorId()));
        }
        if (SearchPatterns.hasKeyword(filter.keyword())) {
            String pattern = SearchPatterns.containsIgnoringCase(filter.keyword());
            Join<ClassOffering, Course> course = root.join("course", JoinType.INNER);
            predicates.add(cb.or(
                    cb.like(cb.lower(root.get("classCode")), pattern, SearchPatterns.ESCAPE),
                    cb.like(cb.lower(course.get("code")), pattern, SearchPatterns.ESCAPE),
                    cb.like(cb.lower(course.get("name")), pattern, SearchPatterns.ESCAPE)));
        }
    }

    /** Parses "field" or "field,asc|desc" against the whitelist. */
    private static Sort parseSort(String sort) {
        if (sort == null || sort.isBlank()) {
            return Sort.by(Sort.Direction.ASC, "startDate");
        }
        String[] parts = sort.split(",", -1);
        String path = SORTABLE.get(parts[0].trim());
        if (path == null || parts.length > 2) {
            throw invalidParameters("sort", "Chỉ nhận startDate, classCode hoặc courseName, kèm ,asc hoặc ,desc");
        }
        if (parts.length == 1) {
            return Sort.by(Sort.Direction.ASC, path);
        }
        return switch (parts[1].trim().toLowerCase(Locale.ROOT)) {
            case "asc" -> Sort.by(Sort.Direction.ASC, path);
            case "desc" -> Sort.by(Sort.Direction.DESC, path);
            default -> throw invalidParameters("sort", "Hướng sắp xếp chỉ nhận asc hoặc desc");
        };
    }

    private static ClassView toView(ClassOffering classOffering, AuthenticatedUser viewer) {
        return viewer != null && viewer.role() == UserRole.TRAINING_ADMIN
                ? ClassResponse.from(classOffering)
                : ClassSummaryResponse.from(classOffering);
    }

    private static ApiException invalidParameters(String field, String detail) {
        ErrorCode errorCode = ErrorCode.VALIDATION_ERROR;
        return new ApiException(errorCode.status(), errorCode.name(), INVALID_PARAMETERS_MESSAGE,
                Map.of(field, List.of(detail)));
    }

    private static ApiException classNotFound() {
        return new ApiException(ErrorCode.NOT_FOUND.status(), ErrorCode.NOT_FOUND.name(), "Không tìm thấy lớp học",
                Map.of());
    }
}
