package com.p02.training.dto.response;

import com.p02.training.entity.enums.EnrollmentStatus;
import com.p02.training.entity.enums.FinalStatus;
import com.p02.training.entity.enums.GradingStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import org.springframework.lang.Nullable;

/**
 * A class's results (TR15), for Admins and the assigned instructor. {@code version} is the class's
 * grading_version, to send back with the next save (A-09); the JPA version is never exposed.
 * {@code returnReason} keeps the last reason an Admin gave when returning the results (A-24).
 */
public record ClassResultsResponse(
        Long classId,
        String classCode,
        GradingStatus gradingStatus,
        int version,
        @Nullable BigDecimal midtermWeight,
        @Nullable BigDecimal finalWeight,
        @Nullable Instant submittedAt,
        @Nullable Instant confirmedAt,
        @Nullable String returnReason,
        List<Item> items) {

    /** One student. Scores are null until entered; the rate and outcome are set at confirmation. */
    @Schema(name = "ClassResultItem")
    public record Item(
            Long studentId,
            String studentCode,
            String fullName,
            EnrollmentStatus enrollmentStatus,
            @Nullable BigDecimal midtermScore,
            @Nullable BigDecimal finalScore,
            @Nullable BigDecimal totalScore,
            @Nullable BigDecimal attendanceRate,
            @Nullable FinalStatus finalStatus) {
    }
}
