package com.p02.training.entity;

import com.p02.training.entity.enums.ClassStatus;
import com.p02.training.entity.enums.GradingStatus;
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
import jakarta.persistence.Version;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

/**
 * A class, with its lifecycle, seats, grading rules copied at publish, and class-level grading state.
 *
 * <p>{@code version} is the JPA version: an internal safety net that changes on every update and must
 * never reach a DTO. Services must load this row with its lock first, or {@code enrolled_count}
 * changes can raise a false conflict. {@code gradingVersion} is a separate counter that services
 * compare and increment for TR15, and it reaches clients as {@code version} (A-09).
 *
 * <p>{@code deleted_at} has no setter because the MVP has no soft-delete action (A-07), so it stays
 * null. Queries still filter on it.
 */
@Entity
@Table(name = "class_offering")
public class ClassOffering extends AuditedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    @Column(name = "class_code", nullable = false, length = 30)
    private String classCode;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Column(name = "semester", nullable = false, length = 20)
    private String semester;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "instructor_id")
    private Instructor instructor;

    @Column(name = "max_capacity", nullable = false)
    private int maxCapacity;

    @Column(name = "enrolled_count", nullable = false)
    private int enrolledCount = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ClassStatus status = ClassStatus.DRAFT;

    @Column(name = "cancel_deadline", nullable = false)
    private Instant cancelDeadline;

    @Column(name = "cancel_reason", columnDefinition = "text")
    private String cancelReason;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by", nullable = false, updatable = false)
    private User createdBy;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @Column(name = "min_attendance_pct", precision = 5, scale = 2)
    private BigDecimal minAttendancePct;

    @Column(name = "pass_score", precision = 4, scale = 2)
    private BigDecimal passScore;

    @Column(name = "midterm_weight", precision = 3, scale = 2)
    private BigDecimal midtermWeight;

    @Column(name = "final_weight", precision = 3, scale = 2)
    private BigDecimal finalWeight;

    @Enumerated(EnumType.STRING)
    @Column(name = "grading_status", nullable = false, length = 20)
    private GradingStatus gradingStatus = GradingStatus.DRAFT;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submitted_by")
    private User submittedBy;

    @Column(name = "confirmed_at")
    private Instant confirmedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "confirmed_by")
    private User confirmedBy;

    @Column(name = "return_reason", columnDefinition = "text")
    private String returnReason;

    @Column(name = "grading_version", nullable = false)
    private int gradingVersion = 0;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "closed_at")
    private Instant closedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "closed_by")
    private User closedBy;

    @Version
    @Column(name = "version", nullable = false)
    private int version;

    protected ClassOffering() {
    }

    public ClassOffering(String classCode, Course course, String semester, LocalDate startDate, LocalDate endDate,
            int maxCapacity, Instant cancelDeadline, User createdBy) {
        this.classCode = classCode;
        this.course = course;
        this.semester = semester;
        this.startDate = startDate;
        this.endDate = endDate;
        this.maxCapacity = maxCapacity;
        this.cancelDeadline = cancelDeadline;
        this.createdBy = createdBy;
    }

    public Long getId() {
        return id;
    }

    public String getClassCode() {
        return classCode;
    }

    public void setClassCode(String classCode) {
        this.classCode = classCode;
    }

    public Course getCourse() {
        return course;
    }

    public void setCourse(Course course) {
        this.course = course;
    }

    public String getSemester() {
        return semester;
    }

    public void setSemester(String semester) {
        this.semester = semester;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public Instructor getInstructor() {
        return instructor;
    }

    public void setInstructor(Instructor instructor) {
        this.instructor = instructor;
    }

    public int getMaxCapacity() {
        return maxCapacity;
    }

    public void setMaxCapacity(int maxCapacity) {
        this.maxCapacity = maxCapacity;
    }

    public int getEnrolledCount() {
        return enrolledCount;
    }

    public void setEnrolledCount(int enrolledCount) {
        this.enrolledCount = enrolledCount;
    }

    public ClassStatus getStatus() {
        return status;
    }

    public void setStatus(ClassStatus status) {
        this.status = status;
    }

    public Instant getCancelDeadline() {
        return cancelDeadline;
    }

    public void setCancelDeadline(Instant cancelDeadline) {
        this.cancelDeadline = cancelDeadline;
    }

    public String getCancelReason() {
        return cancelReason;
    }

    public void setCancelReason(String cancelReason) {
        this.cancelReason = cancelReason;
    }

    public User getCreatedBy() {
        return createdBy;
    }

    public Instant getDeletedAt() {
        return deletedAt;
    }

    public BigDecimal getMinAttendancePct() {
        return minAttendancePct;
    }

    public void setMinAttendancePct(BigDecimal minAttendancePct) {
        this.minAttendancePct = minAttendancePct;
    }

    public BigDecimal getPassScore() {
        return passScore;
    }

    public void setPassScore(BigDecimal passScore) {
        this.passScore = passScore;
    }

    public BigDecimal getMidtermWeight() {
        return midtermWeight;
    }

    public void setMidtermWeight(BigDecimal midtermWeight) {
        this.midtermWeight = midtermWeight;
    }

    public BigDecimal getFinalWeight() {
        return finalWeight;
    }

    public void setFinalWeight(BigDecimal finalWeight) {
        this.finalWeight = finalWeight;
    }

    public GradingStatus getGradingStatus() {
        return gradingStatus;
    }

    public void setGradingStatus(GradingStatus gradingStatus) {
        this.gradingStatus = gradingStatus;
    }

    public Instant getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(Instant submittedAt) {
        this.submittedAt = submittedAt;
    }

    public User getSubmittedBy() {
        return submittedBy;
    }

    public void setSubmittedBy(User submittedBy) {
        this.submittedBy = submittedBy;
    }

    public Instant getConfirmedAt() {
        return confirmedAt;
    }

    public void setConfirmedAt(Instant confirmedAt) {
        this.confirmedAt = confirmedAt;
    }

    public User getConfirmedBy() {
        return confirmedBy;
    }

    public void setConfirmedBy(User confirmedBy) {
        this.confirmedBy = confirmedBy;
    }

    public String getReturnReason() {
        return returnReason;
    }

    public void setReturnReason(String returnReason) {
        this.returnReason = returnReason;
    }

    public int getGradingVersion() {
        return gradingVersion;
    }

    public void setGradingVersion(int gradingVersion) {
        this.gradingVersion = gradingVersion;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(Instant startedAt) {
        this.startedAt = startedAt;
    }

    public Instant getClosedAt() {
        return closedAt;
    }

    public void setClosedAt(Instant closedAt) {
        this.closedAt = closedAt;
    }

    public User getClosedBy() {
        return closedBy;
    }

    public void setClosedBy(User closedBy) {
        this.closedBy = closedBy;
    }

    public int getVersion() {
        return version;
    }
}
