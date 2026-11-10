package com.p02.training.dto.response;

import com.p02.training.entity.enums.ClassStatus;
import java.math.BigDecimal;

/**
 * One class on TR18 {@code GET /dashboard/classes}: classCode, courseName, status, enrolled/max and
 * completionRate (PASSED / (PASSED + FAILED), a ratio). completionRate is null until the class's
 * results are CONFIRMED, and for Managers also when the class has fewer than 5 confirmed results
 * (D21).
 */
public record DashboardClassResponse(
        Long classId,
        String classCode,
        String courseName,
        ClassStatus status,
        int enrolledCount,
        int maxCapacity,
        BigDecimal completionRate) {
}
