package com.p02.training.dto.response;

import com.p02.training.entity.enums.AttendanceStatus;
import com.p02.training.entity.enums.EnrollmentStatus;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * A session's attendance (TR14). {@code version} is the session's attendance_version, to send back
 * with the next save (A-09). Each item is a student of the class; {@code status} is null until the
 * student is marked. {@code unlockReason} keeps the last unlock reason (A-24).
 */
public record AttendanceSheetResponse(
        Long sessionId,
        Long classId,
        String classCode,
        LocalDate sessionDate,
        LocalTime startTime,
        LocalTime endTime,
        boolean attendanceLocked,
        Instant lockedAt,
        String unlockReason,
        int version,
        List<Item> items) {

    /** One student's mark. Only the student's code and name: no email, birth date or phone. */
    public record Item(
            Long studentId,
            String studentCode,
            String fullName,
            EnrollmentStatus enrollmentStatus,
            AttendanceStatus status,
            String remarks,
            Instant markedAt) {
    }
}
