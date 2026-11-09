package com.p02.training.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

/**
 * A scheduled class session. This is not Hibernate's {@code org.hibernate.Session}.
 *
 * <p>Date and times are Vietnam local values (A-06). {@code attendanceVersion} is not a JPA version:
 * services compare and increment it for TR14, and it reaches clients as {@code version} (A-09).
 */
@Entity
@Table(name = "session")
public class Session extends AuditedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "class_id", nullable = false, updatable = false)
    private ClassOffering classOffering;

    @Column(name = "session_date", nullable = false)
    private LocalDate sessionDate;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @Column(name = "topic", length = 200)
    private String topic;

    @Column(name = "attendance_locked", nullable = false)
    private boolean attendanceLocked = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "locked_by")
    private User lockedBy;

    @Column(name = "locked_at")
    private Instant lockedAt;

    @Column(name = "unlock_reason", columnDefinition = "text")
    private String unlockReason;

    @Column(name = "attendance_version", nullable = false)
    private int attendanceVersion = 0;

    protected Session() {
    }

    public Session(ClassOffering classOffering, LocalDate sessionDate, LocalTime startTime, LocalTime endTime,
            Room room) {
        this.classOffering = classOffering;
        this.sessionDate = sessionDate;
        this.startTime = startTime;
        this.endTime = endTime;
        this.room = room;
    }

    public Long getId() {
        return id;
    }

    public ClassOffering getClassOffering() {
        return classOffering;
    }

    public LocalDate getSessionDate() {
        return sessionDate;
    }

    public void setSessionDate(LocalDate sessionDate) {
        this.sessionDate = sessionDate;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }

    public Room getRoom() {
        return room;
    }

    public void setRoom(Room room) {
        this.room = room;
    }

    public String getTopic() {
        return topic;
    }

    public void setTopic(String topic) {
        this.topic = topic;
    }

    public boolean isAttendanceLocked() {
        return attendanceLocked;
    }

    public void setAttendanceLocked(boolean attendanceLocked) {
        this.attendanceLocked = attendanceLocked;
    }

    public User getLockedBy() {
        return lockedBy;
    }

    public void setLockedBy(User lockedBy) {
        this.lockedBy = lockedBy;
    }

    public Instant getLockedAt() {
        return lockedAt;
    }

    public void setLockedAt(Instant lockedAt) {
        this.lockedAt = lockedAt;
    }

    public String getUnlockReason() {
        return unlockReason;
    }

    public void setUnlockReason(String unlockReason) {
        this.unlockReason = unlockReason;
    }

    public int getAttendanceVersion() {
        return attendanceVersion;
    }

    public void setAttendanceVersion(int attendanceVersion) {
        this.attendanceVersion = attendanceVersion;
    }
}
