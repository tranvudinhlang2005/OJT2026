package com.p02.training.entity;

import com.p02.training.entity.enums.ScoreType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Immutable;

/**
 * One row per score change (D18). Append-only: {@code @Immutable} and the absence of setters mean
 * application code cannot change a row.
 *
 * <p>{@code student_id} and {@code class_id} form the composite foreign key {@code fk_gal_enrollment}
 * to {@code enrollment}, for the same reason as {@link AssessmentResult}. It cannot reference the
 * result, because TR15 writes this row before the result exists.
 */
@Entity
@Immutable
@Table(name = "grade_audit_log")
public class GradeAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false, updatable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "class_id", nullable = false, updatable = false)
    private ClassOffering classOffering;

    @Enumerated(EnumType.STRING)
    @Column(name = "score_type", nullable = false, length = 10, updatable = false)
    private ScoreType scoreType;

    @Column(name = "old_score", precision = 4, scale = 2, updatable = false)
    private BigDecimal oldScore;

    @Column(name = "new_score", precision = 4, scale = 2, updatable = false)
    private BigDecimal newScore;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "changed_by", nullable = false, updatable = false)
    private User changedBy;

    @Column(name = "reason", columnDefinition = "text", updatable = false)
    private String reason;

    @Column(name = "ip_address", length = 45, updatable = false)
    private String ipAddress;

    @CreationTimestamp
    @Column(name = "changed_at", nullable = false, updatable = false)
    private Instant changedAt;

    protected GradeAuditLog() {
    }

    public GradeAuditLog(Enrollment enrollment, ScoreType scoreType, BigDecimal oldScore, BigDecimal newScore,
            User changedBy, String reason, String ipAddress) {
        this.student = enrollment.getStudent();
        this.classOffering = enrollment.getClassOffering();
        this.scoreType = scoreType;
        this.oldScore = oldScore;
        this.newScore = newScore;
        this.changedBy = changedBy;
        this.reason = reason;
        this.ipAddress = ipAddress;
    }

    public Long getId() {
        return id;
    }

    public Student getStudent() {
        return student;
    }

    public ClassOffering getClassOffering() {
        return classOffering;
    }

    public ScoreType getScoreType() {
        return scoreType;
    }

    public BigDecimal getOldScore() {
        return oldScore;
    }

    public BigDecimal getNewScore() {
        return newScore;
    }

    public User getChangedBy() {
        return changedBy;
    }

    public String getReason() {
        return reason;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public Instant getChangedAt() {
        return changedAt;
    }
}
