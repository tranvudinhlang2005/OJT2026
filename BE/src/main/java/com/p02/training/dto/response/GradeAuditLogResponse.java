package com.p02.training.dto.response;

import com.p02.training.entity.GradeAuditLog;
import com.p02.training.entity.enums.ScoreType;
import java.math.BigDecimal;
import java.time.Instant;

/**
 * One score change for TR18 {@code GET /audit/grade-logs} (Admin only, read-only): changedAt,
 * classCode, studentCode, scoreType, oldScore, newScore, changedBy (the username) and reason.
 */
public record GradeAuditLogResponse(
        Instant changedAt,
        String classCode,
        String studentCode,
        ScoreType scoreType,
        BigDecimal oldScore,
        BigDecimal newScore,
        String changedBy,
        String reason) {

    /** Expects the class, student and user to be loaded, as the audit query does. */
    public static GradeAuditLogResponse from(GradeAuditLog log) {
        return new GradeAuditLogResponse(log.getChangedAt(), log.getClassOffering().getClassCode(),
                log.getStudent().getStudentCode(), log.getScoreType(), log.getOldScore(), log.getNewScore(),
                log.getChangedBy().getUsername(), log.getReason());
    }
}
