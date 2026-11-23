package com.p02.training.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.p02.training.audit.SecurityAuditLogger;
import com.p02.training.dto.request.AttendanceItemRequest;
import com.p02.training.dto.request.ResultItemRequest;
import com.p02.training.dto.request.UpdateAttendanceRequest;
import com.p02.training.dto.request.UpdateResultsRequest;
import com.p02.training.entity.ClassOffering;
import com.p02.training.entity.Session;
import com.p02.training.entity.enums.AttendanceStatus;
import com.p02.training.entity.enums.ClassStatus;
import com.p02.training.entity.enums.EnrollmentStatus;
import com.p02.training.entity.enums.GradingStatus;
import com.p02.training.entity.enums.UserRole;
import com.p02.training.exception.ApiException;
import com.p02.training.repository.AssessmentResultRepository;
import com.p02.training.repository.AttendanceRepository;
import com.p02.training.repository.ClassOfferingRepository;
import com.p02.training.repository.EnrollmentRepository;
import com.p02.training.repository.GradeAuditLogRepository;
import com.p02.training.repository.SessionRepository;
import com.p02.training.repository.StudentRepository;
import com.p02.training.repository.UserRepository;
import com.p02.training.security.AuthenticatedUser;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

class ClassScopedStudentLookupTest {

    private static final long CLASS_ID = 12L;
    private static final long SESSION_ID = 23L;
    private static final long UNRECOGNIZED_ROSTER_ID = 34L;
    private static final Clock CLOCK = Clock.fixed(Instant.parse("2026-11-24T09:00:00Z"),
            ZoneId.of("Asia/Ho_Chi_Minh"));
    private static final AuthenticatedUser INSTRUCTOR =
            new AuthenticatedUser(1L, "fixture-instructor", "Fixture Instructor", UserRole.INSTRUCTOR);

    private final StudentRepository students = mock(StudentRepository.class);
    private final EnrollmentRepository enrollments = mock(EnrollmentRepository.class);
    private final ClassOfferingRepository classes = mock(ClassOfferingRepository.class);
    private final ClassLockService locks = mock(ClassLockService.class);
    private final ClassAccessGuard access = mock(ClassAccessGuard.class);
    private final UserRepository users = mock(UserRepository.class);
    private final SecurityAuditLogger audit = mock(SecurityAuditLogger.class);

    @Test
    void attendanceRejectsUnknownRosterEntryWithoutLookingUpStudentProfile() {
        SessionRepository sessions = mock(SessionRepository.class);
        Session session = mock(Session.class);
        ClassOffering offering = activeClass();
        AttendanceRepository attendance = mock(AttendanceRepository.class);
        when(sessions.findClassIdById(SESSION_ID)).thenReturn(Optional.of(CLASS_ID));
        when(classes.findWithDetailsByIdAndDeletedAtIsNull(CLASS_ID)).thenReturn(Optional.of(offering));
        when(sessions.findLockedById(SESSION_ID)).thenReturn(Optional.of(session));
        when(session.getSessionDate()).thenReturn(LocalDate.now(CLOCK));
        when(enrollments.findStudentIds(CLASS_ID, EnrollmentStatus.ENROLLED)).thenReturn(List.of());
        AttendanceService service = new AttendanceService(sessions, classes, attendance, enrollments, students, users,
                locks, access, audit, CLOCK);
        UpdateAttendanceRequest request = new UpdateAttendanceRequest(0,
                List.of(new AttendanceItemRequest(UNRECOGNIZED_ROSTER_ID, AttendanceStatus.PRESENT, null)));

        assertThatThrownBy(() -> service.updateAttendance(SESSION_ID, request, INSTRUCTOR))
                .isInstanceOfSatisfying(ApiException.class, ClassScopedStudentLookupTest::assertRosterConflict);
        verifyNoInteractions(students, attendance);
    }

    @Test
    void gradingRejectsUnknownRosterEntryWithoutLookingUpStudentProfile() {
        AssessmentResultRepository results = mock(AssessmentResultRepository.class);
        GradeAuditLogRepository gradeAudit = mock(GradeAuditLogRepository.class);
        ClassOffering offering = activeClass();
        when(offering.getGradingStatus()).thenReturn(GradingStatus.DRAFT);
        when(locks.lockClass(CLASS_ID)).thenReturn(offering);
        when(enrollments.findByClassOffering_IdAndStatus(CLASS_ID, EnrollmentStatus.ENROLLED)).thenReturn(List.of());
        ResultService service = new ResultService(classes, enrollments, results, gradeAudit, students, users, locks,
                access, audit, CLOCK);
        UpdateResultsRequest request = new UpdateResultsRequest(0,
                List.of(new ResultItemRequest(UNRECOGNIZED_ROSTER_ID, BigDecimal.ONE, BigDecimal.ONE, null)));

        assertThatThrownBy(() -> service.updateResults(CLASS_ID, request, INSTRUCTOR))
                .isInstanceOfSatisfying(ApiException.class, ClassScopedStudentLookupTest::assertRosterConflict);
        verifyNoInteractions(students, results, gradeAudit);
    }

    private static ClassOffering activeClass() {
        ClassOffering offering = mock(ClassOffering.class);
        when(offering.getId()).thenReturn(CLASS_ID);
        when(offering.getStatus()).thenReturn(ClassStatus.IN_PROGRESS);
        return offering;
    }

    private static void assertRosterConflict(ApiException failure) {
        assertThat(failure.status()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(failure.code()).isEqualTo("STUDENT_NOT_IN_CLASS");
    }
}
