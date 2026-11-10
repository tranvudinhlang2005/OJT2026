package com.p02.training.service;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * The grading arithmetic shared by TR15 and TR16, so both round the same way (A-28: HALF_UP, 2
 * decimal places).
 */
public final class GradeCalculator {

    public static final int SCALE = 2;
    public static final RoundingMode ROUNDING = RoundingMode.HALF_UP;

    private static final BigDecimal HUNDRED = new BigDecimal("100");

    private GradeCalculator() {
    }

    /**
     * D14: round(midterm × midtermWeight + final × finalWeight, 2). Null when either score is null
     * (A-27).
     */
    public static BigDecimal totalScore(BigDecimal midterm, BigDecimal finalScore, BigDecimal midtermWeight,
            BigDecimal finalWeight) {
        if (midterm == null || finalScore == null) {
            return null;
        }
        return midterm.multiply(midtermWeight).add(finalScore.multiply(finalWeight)).setScale(SCALE, ROUNDING);
    }

    /** D15: (PRESENT + LATE) / total sessions × 100, rounded to 2 places. totalSessions must be > 0. */
    public static BigDecimal attendanceRate(long attended, long totalSessions) {
        return BigDecimal.valueOf(attended).multiply(HUNDRED)
                .divide(BigDecimal.valueOf(totalSessions), SCALE, ROUNDING);
    }

    /** True if the two scores are both null or numerically equal (5 equals 5.00). */
    public static boolean sameScore(BigDecimal a, BigDecimal b) {
        return a == null ? b == null : b != null && a.compareTo(b) == 0;
    }
}
