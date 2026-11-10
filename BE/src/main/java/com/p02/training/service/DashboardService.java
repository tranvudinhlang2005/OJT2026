package com.p02.training.service;

import com.p02.training.dto.response.DashboardClassResponse;
import com.p02.training.dto.response.DashboardSummaryResponse;
import com.p02.training.dto.response.GradeAuditLogResponse;
import com.p02.training.dto.response.PageResponse;
import com.p02.training.dto.response.SecurityAlertsResponse;
import com.p02.training.entity.ClassOffering;
import com.p02.training.entity.GradeAuditLog;
import com.p02.training.entity.enums.ClassStatus;
import com.p02.training.entity.enums.EnrollmentStatus;
import com.p02.training.entity.enums.FinalStatus;
import com.p02.training.entity.enums.GradingStatus;
import com.p02.training.entity.enums.SecurityAction;
import com.p02.training.entity.enums.UserRole;
import com.p02.training.exception.ApiException;
import com.p02.training.exception.ErrorCode;
import com.p02.training.repository.AppSecurityLogRepository;
import com.p02.training.repository.AssessmentResultRepository;
import com.p02.training.repository.ClassOfferingRepository;
import com.p02.training.repository.EnrollmentRepository;
import com.p02.training.repository.GradeAuditLogRepository;
import com.p02.training.repository.projection.ActionCount;
import com.p02.training.repository.projection.CapacityTotals;
import com.p02.training.repository.projection.ClassOutcomeCount;
import com.p02.training.repository.projection.ClassStatusCount;
import com.p02.training.repository.projection.OutcomeTotals;
import com.p02.training.security.AuthenticatedUser;
import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * TR18 dashboard, security alerts and grade audit. Dashboard endpoints are for Training Admins and
 * Managers, the grade audit for Admins only (SecurityConfig). Only aggregates are returned: no
 * student's name or individual score, except in the Admin-only grade audit.
 *
 * <p>Dashboard filters: from and to apply to the class's start_date; soft-deleted classes are always
 * excluded ({@code DashboardFilter}). Enrollments are counted with COUNT(DISTINCT id) without joining
 * sessions. Ratios are returned from 0 to 1 with 4 decimals, averages of attendance rates in percent
 * with 2 decimals, both rounded HALF_UP (A-28).
 */
@Service
public class DashboardService {

    /** D21: a Manager does not see a class's completion rate below this many confirmed results. */
    static final int MANAGER_MIN_CONFIRMED_RESULTS = 5;
    static final int MAX_PAGE_SIZE = 100;
    static final Duration DEFAULT_ALERT_PERIOD = Duration.ofDays(7);
    static final int RECENT_EVENTS = 20;

    private static final int RATIO_SCALE = 4;
    private static final Set<SecurityAction> ALERT_ACTIONS =
            EnumSet.of(SecurityAction.LOGIN_FAILED, SecurityAction.ACCOUNT_LOCKED, SecurityAction.ACCESS_DENIED);
    private static final Set<EnrollmentStatus> COUNTED_ENROLLMENTS =
            EnumSet.of(EnrollmentStatus.ENROLLED, EnrollmentStatus.COMPLETED);
    private static final Set<ClassStatus> FILL_RATE_STATUSES = EnumSet.of(ClassStatus.OPEN, ClassStatus.IN_PROGRESS);
    /** Results that count as confirmed results of a class (D21), the same as the per-class list. */
    private static final Set<FinalStatus> CONFIRMED_OUTCOMES = EnumSet.of(FinalStatus.PASSED, FinalStatus.FAILED);
    private static final String INVALID_FILTER_MESSAGE = "Bộ lọc không hợp lệ";

    private final ClassOfferingRepository classOfferingRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AssessmentResultRepository resultRepository;
    private final AppSecurityLogRepository securityLogRepository;
    private final GradeAuditLogRepository gradeAuditLogRepository;
    private final Clock clock;

    public DashboardService(ClassOfferingRepository classOfferingRepository, EnrollmentRepository enrollmentRepository,
            AssessmentResultRepository resultRepository, AppSecurityLogRepository securityLogRepository,
            GradeAuditLogRepository gradeAuditLogRepository, Clock clock) {
        this.classOfferingRepository = classOfferingRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.resultRepository = resultRepository;
        this.securityLogRepository = securityLogRepository;
        this.gradeAuditLogRepository = gradeAuditLogRepository;
        this.clock = clock;
    }

    /**
     * {@code GET /dashboard/summary?semester=&courseId=&from=&to=}: four aggregate queries.
     *
     * <p>completionRate and averageAttendanceRate (A-32, D21): an Admin gets them over every
     * confirmed class matching the filters; a Manager only over matching confirmed classes that each
     * have at least 5 confirmed results, so smaller classes are left out of both numerator and
     * denominator. Class counts, total enrollments and fill rate are the same for both roles.
     */
    @Transactional(readOnly = true)
    public DashboardSummaryResponse summary(String semester, Long courseId, LocalDate from, LocalDate to,
            AuthenticatedUser viewer) {
        requireOrderedDates(from, to);
        String semesterFilter = blankToNull(semester);

        Map<ClassStatus, Long> counts = new EnumMap<>(ClassStatus.class);
        for (ClassStatus status : ClassStatus.values()) {
            counts.put(status, 0L);
        }
        for (ClassStatusCount count : classOfferingRepository.countByStatusForDashboard(semesterFilter, courseId, from, to)) {
            counts.put(count.getStatus(), count.getTotal());
        }
        long enrollments = enrollmentRepository.countForDashboard(COUNTED_ENROLLMENTS, semesterFilter, courseId, from, to);

        CapacityTotals capacity = classOfferingRepository.sumCapacityForDashboard(FILL_RATE_STATUSES, semesterFilter,
                courseId, from, to);
        BigDecimal fillRate = capacity == null ? null : ratio(capacity.getEnrolled(), capacity.getCapacity());

        OutcomeTotals outcomes = isAdmin(viewer)
                ? resultRepository.sumOutcomesForDashboard(GradingStatus.CONFIRMED, semesterFilter, courseId, from, to)
                : resultRepository.sumOutcomesForDashboardOverClassesWithAtLeast(GradingStatus.CONFIRMED,
                        CONFIRMED_OUTCOMES, MANAGER_MIN_CONFIRMED_RESULTS, semesterFilter, courseId, from, to);
        BigDecimal completionRate = null;
        BigDecimal averageAttendance = null;
        if (outcomes != null) {
            long passed = outcomes.getPassed() == null ? 0 : outcomes.getPassed();
            long failed = outcomes.getFailed() == null ? 0 : outcomes.getFailed();
            completionRate = ratio(passed, passed + failed);
            averageAttendance = outcomes.getAverageAttendanceRate() == null ? null
                    : BigDecimal.valueOf(outcomes.getAverageAttendanceRate())
                            .setScale(GradeCalculator.SCALE, GradeCalculator.ROUNDING);
        }
        return new DashboardSummaryResponse(counts, enrollments, fillRate, completionRate, averageAttendance);
    }

    /**
     * {@code GET /dashboard/classes?semester=&courseId=&page=&size=}, sorted by class code. Completion
     * per class comes from one grouped query for the whole page. A Manager gets null for a class with
     * fewer than 5 confirmed results (D21); an Admin sees every value.
     */
    @Transactional(readOnly = true)
    public PageResponse<DashboardClassResponse> classes(String semester, Long courseId, int page, int size,
            AuthenticatedUser viewer) {
        requirePaging(page, size);
        String semesterFilter = blankToNull(semester);
        Specification<ClassOffering> specification = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.isNull(root.get("deletedAt")));
            if (semesterFilter != null) {
                predicates.add(cb.equal(root.get("semester"), semesterFilter));
            }
            if (courseId != null) {
                predicates.add(cb.equal(root.get("course").get("id"), courseId));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
        Page<ClassOffering> classes = classOfferingRepository.findAll(specification,
                PageRequest.of(page, size, Sort.by("classCode").and(Sort.by("id"))));

        List<Long> classIds = classes.getContent().stream().map(ClassOffering::getId).toList();
        Map<Long, ClassOutcomeCount> outcomes = classIds.isEmpty() ? Map.of()
                : resultRepository.countOutcomesByClass(classIds, GradingStatus.CONFIRMED).stream()
                        .collect(Collectors.toMap(ClassOutcomeCount::getClassId, Function.identity()));
        boolean manager = !isAdmin(viewer);

        return PageResponse.of(classes, classOffering -> {
            ClassOutcomeCount outcome = outcomes.get(classOffering.getId());
            BigDecimal completionRate = null;
            if (outcome != null) {
                long confirmed = outcome.getPassed() + outcome.getFailed();
                boolean hidden = manager && confirmed < MANAGER_MIN_CONFIRMED_RESULTS;
                completionRate = hidden ? null : ratio(outcome.getPassed(), confirmed);
            }
            return new DashboardClassResponse(classOffering.getId(), classOffering.getClassCode(),
                    classOffering.getCourse().getName(), classOffering.getStatus(), classOffering.getEnrolledCount(),
                    classOffering.getMaxCapacity(), completionRate);
        });
    }

    /**
     * {@code GET /dashboard/security-alerts?from=&to=}. from and to are Vietnam dates: the period runs
     * from the start of {@code from} to the end of {@code to}. Without them, the last 7 days up to
     * now. Both must be given together. Admins also get the 20 most recent of these events.
     */
    @Transactional(readOnly = true)
    public SecurityAlertsResponse securityAlerts(LocalDate from, LocalDate to, AuthenticatedUser viewer) {
        Instant[] period = period(from, to);
        Map<SecurityAction, Long> counts = new EnumMap<>(SecurityAction.class);
        ALERT_ACTIONS.forEach(action -> counts.put(action, 0L));
        for (ActionCount count : securityLogRepository.countByAction(ALERT_ACTIONS, period[0], period[1])) {
            counts.put(count.getAction(), count.getTotal());
        }
        List<SecurityAlertsResponse.Event> recent = null;
        if (isAdmin(viewer)) {
            recent = securityLogRepository
                    .findTop20ByActionInAndCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtDescIdDesc(
                            ALERT_ACTIONS, period[0], period[1]).stream()
                    .map(log -> new SecurityAlertsResponse.Event(log.getCreatedAt(), log.getAction(), log.getUsername(),
                            log.getIpAddress()))
                    .toList();
        }
        return new SecurityAlertsResponse(period[0], period[1], counts, recent);
    }

    /**
     * {@code GET /audit/grade-logs?classId=&from=&to=&page=&size=}: Admin only, read-only, newest
     * first. from and to are Vietnam dates on the change time. Class, student and user are loaded in
     * the same query.
     */
    @Transactional(readOnly = true)
    public PageResponse<GradeAuditLogResponse> gradeLogs(Long classId, LocalDate from, LocalDate to, int page, int size) {
        requirePaging(page, size);
        requireOrderedDates(from, to);
        Instant start = from == null ? null : startOf(from);
        Instant end = to == null ? null : startOf(to.plusDays(1));
        Specification<GradeAuditLog> specification = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (classId != null) {
                predicates.add(cb.equal(root.get("classOffering").get("id"), classId));
            }
            if (start != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("changedAt"), start));
            }
            if (end != null) {
                predicates.add(cb.lessThan(root.get("changedAt"), end));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
        PageRequest pageable = PageRequest.of(page, size,
                Sort.by(Sort.Direction.DESC, "changedAt").and(Sort.by(Sort.Direction.DESC, "id")));
        return PageResponse.of(gradeAuditLogRepository.findAll(specification, pageable), GradeAuditLogResponse::from);
    }

    // --- helpers --------------------------------------------------------------------------------

    private Instant[] period(LocalDate from, LocalDate to) {
        if (from == null && to == null) {
            Instant now = Instant.now(clock);
            return new Instant[] {now.minus(DEFAULT_ALERT_PERIOD), now};
        }
        if (from == null || to == null) {
            throw invalidFilter(from == null ? "from" : "to", "Cần nhập cả from và to");
        }
        requireOrderedDates(from, to);
        return new Instant[] {startOf(from), startOf(to.plusDays(1))};
    }

    private Instant startOf(LocalDate date) {
        return date.atStartOfDay(clock.getZone()).toInstant();
    }

    private static void requireOrderedDates(LocalDate from, LocalDate to) {
        if (from != null && to != null && from.isAfter(to)) {
            throw invalidFilter("from", "from phải trước hoặc bằng to");
        }
    }

    private static void requirePaging(int page, int size) {
        if (page < 0 || size < 1 || size > MAX_PAGE_SIZE) {
            throw invalidFilter(page < 0 ? "page" : "size", "page ≥ 0, size từ 1 đến " + MAX_PAGE_SIZE);
        }
    }

    /** numerator / denominator with 4 decimals, HALF_UP; null when the denominator is 0 or null. */
    private static BigDecimal ratio(Long numerator, Long denominator) {
        if (numerator == null || denominator == null || denominator == 0) {
            return null;
        }
        return BigDecimal.valueOf(numerator).divide(BigDecimal.valueOf(denominator), RATIO_SCALE, RoundingMode.HALF_UP);
    }

    /** Anyone else who reaches the dashboard (a Manager) gets the restricted view. */
    private static boolean isAdmin(AuthenticatedUser viewer) {
        return viewer != null && viewer.role() == UserRole.TRAINING_ADMIN;
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static ApiException invalidFilter(String field, String detail) {
        ErrorCode errorCode = ErrorCode.VALIDATION_ERROR;
        return new ApiException(errorCode.status(), errorCode.name(), INVALID_FILTER_MESSAGE,
                Map.of(field, List.of(detail)));
    }
}
