package com.p02.training.entity;

import com.p02.training.entity.enums.AttendanceStatus;
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
import java.time.Instant;

/**
 * One attendance record per student per session. The status has no default, because a default would
 * hide missing attendance and affect the rate (D15, D16).
 */
@Entity
@Table(name = "attendance")
public class Attendance extends AuditedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false, updatable = false)
    private Session session;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false, updatable = false)
    private Student student;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 10)
    private AttendanceStatus status;

    @Column(name = "remarks", length = 255)
    private String remarks;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "marked_by", nullable = false)
    private User markedBy;

    @Column(name = "marked_at", nullable = false)
    private Instant markedAt;

    protected Attendance() {
    }

    public Attendance(Session session, Student student, AttendanceStatus status, User markedBy, Instant markedAt) {
        this.session = session;
        this.student = student;
        this.status = status;
        this.markedBy = markedBy;
        this.markedAt = markedAt;
    }

    public Long getId() {
        return id;
    }

    public Session getSession() {
        return session;
    }

    public Student getStudent() {
        return student;
    }

    public AttendanceStatus getStatus() {
        return status;
    }

    public void setStatus(AttendanceStatus status) {
        this.status = status;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public User getMarkedBy() {
        return markedBy;
    }

    public void setMarkedBy(User markedBy) {
        this.markedBy = markedBy;
    }

    public Instant getMarkedAt() {
        return markedAt;
    }

    public void setMarkedAt(Instant markedAt) {
        this.markedAt = markedAt;
    }
}
