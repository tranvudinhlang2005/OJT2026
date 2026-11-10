package com.p02.training.service;

import com.p02.training.dto.response.ScheduleItemResponse;
import com.p02.training.entity.Instructor;
import com.p02.training.entity.enums.ClassStatus;
import com.p02.training.entity.enums.EnrollmentStatus;
import com.p02.training.exception.ApiException;
import com.p02.training.exception.ErrorCode;
import com.p02.training.repository.InstructorRepository;
import com.p02.training.repository.SessionRepository;
import com.p02.training.repository.StudentRepository;
import com.p02.training.repository.projection.ScheduleEntry;
import com.p02.training.security.AuthenticatedUser;
import java.time.Clock;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * TR17 personal schedule: {@code GET /me/schedule?from=&to=}, for Students and Instructors only
 * (SecurityConfig; Admins and Managers get 403). The person always comes from the session; there is
 * no id parameter.
 */
@Service
public class ScheduleService {

    static final long MAX_RANGE_DAYS = 92;

    /** Classes whose sessions appear in a schedule. */
    private static final Set<ClassStatus> SCHEDULE_CLASS_STATUSES =
            EnumSet.of(ClassStatus.OPEN, ClassStatus.IN_PROGRESS, ClassStatus.CLOSED);
    private static final Set<EnrollmentStatus> SCHEDULE_ENROLLMENT_STATUSES =
            EnumSet.of(EnrollmentStatus.ENROLLED, EnrollmentStatus.COMPLETED);
    private static final String INVALID_RANGE_MESSAGE = "Khoảng thời gian không hợp lệ";

    private final SessionRepository sessionRepository;
    private final StudentRepository studentRepository;
    private final InstructorRepository instructorRepository;
    private final Clock clock;

    public ScheduleService(SessionRepository sessionRepository, StudentRepository studentRepository,
            InstructorRepository instructorRepository, Clock clock) {
        this.sessionRepository = sessionRepository;
        this.studentRepository = studentRepository;
        this.instructorRepository = instructorRepository;
        this.clock = clock;
    }

    /**
     * The caller's sessions between {@code from} and {@code to} inclusive, ordered by date and time.
     * With neither date, the current week (Monday to Sunday, Vietnam time). Both dates must be given
     * together, with from ≤ to and at most 92 days apart (422 otherwise).
     *
     * <p>Student: classes where they have an ENROLLED or COMPLETED enrollment. Instructor: classes
     * assigned to them. In both cases only OPEN, IN_PROGRESS and CLOSED classes, never soft-deleted.
     */
    @Transactional(readOnly = true)
    public List<ScheduleItemResponse> mySchedule(LocalDate from, LocalDate to, AuthenticatedUser viewer) {
        LocalDate start = from;
        LocalDate end = to;
        if (start == null && end == null) {
            LocalDate today = LocalDate.now(clock);
            start = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
            end = start.plusDays(6);
        } else if (start == null || end == null) {
            throw invalidRange(start == null ? "from" : "to", "Cần nhập cả from và to");
        }
        if (start.isAfter(end)) {
            throw invalidRange("from", "from phải trước hoặc bằng to");
        }
        if (ChronoUnit.DAYS.between(start, end) > MAX_RANGE_DAYS) {
            throw invalidRange("to", "Khoảng cách tối đa " + MAX_RANGE_DAYS + " ngày");
        }

        List<ScheduleEntry> entries = switch (viewer.role()) {
            case STUDENT -> sessionRepository.findStudentSchedule(
                    studentRepository.findIdByUserId(viewer.id()).orElseThrow(ScheduleService::notFound),
                    SCHEDULE_ENROLLMENT_STATUSES, SCHEDULE_CLASS_STATUSES, start, end);
            case INSTRUCTOR -> sessionRepository.findInstructorSchedule(
                    instructorRepository.findByUser_Id(viewer.id()).map(Instructor::getId)
                            .orElseThrow(ScheduleService::notFound),
                    SCHEDULE_CLASS_STATUSES, start, end);
            // Unreachable behind SecurityConfig, which allows only the two roles above.
            case TRAINING_ADMIN, TRAINING_MANAGER -> throw new ApiException(ErrorCode.FORBIDDEN);
        };
        return entries.stream().map(ScheduleItemResponse::from).toList();
    }

    private static ApiException invalidRange(String field, String detail) {
        ErrorCode errorCode = ErrorCode.VALIDATION_ERROR;
        return new ApiException(errorCode.status(), errorCode.name(), INVALID_RANGE_MESSAGE,
                Map.of(field, List.of(detail)));
    }

    private static ApiException notFound() {
        return new ApiException(ErrorCode.NOT_FOUND);
    }
}
