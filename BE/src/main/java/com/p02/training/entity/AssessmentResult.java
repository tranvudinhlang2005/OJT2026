package com.p02.training.entity;

import com.p02.training.entity.enums.FinalStatus;
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

/**
 * Scores and outcome for one enrollment.
 *
 * <p>{@code student_id} and {@code class_id} together form the composite foreign key
 * {@code fk_ar_enrollment} to {@code enrollment (student_id, class_id)}, enforced by the database
 * (A-10). There is deliberately no {@code Enrollment} field: Hibernate cannot load an association
 * through non-primary-key columns lazily, so it would add a query for every result on a class roster.
 * The only constructor takes an {@code Enrollment}, so application code cannot build a mismatched pair.
 *
 * <p>The foreign key proves an enrollment exists, not that it is ENROLLED, which services must check.
 */
@Entity
@Table(name = "assessment_result")
public class AssessmentResult extends AuditedEntity {

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

    @Column(name = "midterm_score", precision = 4, scale = 2)
    private BigDecimal midtermScore;

    @Column(name = "final_score", precision = 4, scale = 2)
    private BigDecimal finalScore;

    @Column(name = "total_score", precision = 4, scale = 2)
    private BigDecimal totalScore;

    @Column(name = "attendance_rate", precision = 5, scale = 2)
    private BigDecimal attendanceRate;

    @Enumerated(EnumType.STRING)
    @Column(name = "final_status", nullable = false, length = 20)
    private FinalStatus finalStatus = FinalStatus.IN_PROGRESS;

    protected AssessmentResult() {
    }

    public AssessmentResult(Enrollment enrollment) {
        this.student = enrollment.getStudent();
        this.classOffering = enrollment.getClassOffering();
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

    public BigDecimal getMidtermScore() {
        return midtermScore;
    }

    public void setMidtermScore(BigDecimal midtermScore) {
        this.midtermScore = midtermScore;
    }

    public BigDecimal getFinalScore() {
        return finalScore;
    }

    public void setFinalScore(BigDecimal finalScore) {
        this.finalScore = finalScore;
    }

    public BigDecimal getTotalScore() {
        return totalScore;
    }

    public void setTotalScore(BigDecimal totalScore) {
        this.totalScore = totalScore;
    }

    public BigDecimal getAttendanceRate() {
        return attendanceRate;
    }

    public void setAttendanceRate(BigDecimal attendanceRate) {
        this.attendanceRate = attendanceRate;
    }

    public FinalStatus getFinalStatus() {
        return finalStatus;
    }

    public void setFinalStatus(FinalStatus finalStatus) {
        this.finalStatus = finalStatus;
    }
}
