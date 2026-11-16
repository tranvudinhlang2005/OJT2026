package com.p02.training.dto.response;

import com.p02.training.entity.enums.ClassStatus;
import java.math.BigDecimal;
import java.util.Map;
import org.springframework.lang.Nullable;

/**
 * TR18 {@code GET /dashboard/summary}: aggregate figures only, never a student's name or score.
 *
 * <ul>
 *   <li>{@code classCountsByStatus}: every status, 0 when none.</li>
 *   <li>{@code totalEnrollments}: ENROLLED + COMPLETED, 0 when none.</li>
 *   <li>{@code fillRate}: SUM(enrolled_count) / SUM(max_capacity) of OPEN + IN_PROGRESS classes, a
 *       ratio from 0 to 1; null when there is no capacity ("Chưa có dữ liệu").</li>
 *   <li>{@code completionRate}: PASSED / (PASSED + FAILED) over CONFIRMED classes, a ratio; null when
 *       there are no confirmed results.</li>
 *   <li>{@code averageAttendanceRate}: AVG(attendance_rate) over CONFIRMED classes, in percent;
 *       null when there are no confirmed results.</li>
 * </ul>
 */
public record DashboardSummaryResponse(
        Map<ClassStatus, Long> classCountsByStatus,
        long totalEnrollments,
        @Nullable BigDecimal fillRate,
        @Nullable BigDecimal completionRate,
        @Nullable BigDecimal averageAttendanceRate) {
}
