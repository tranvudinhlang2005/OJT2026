package com.p02.training.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;

/** Course catalog. Thresholds and weights default to D13 and are copied to a class on publish. */
@Entity
@Table(name = "course")
public class Course extends AuditedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    @Column(name = "code", nullable = false, length = 20)
    private String code;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "credits", nullable = false)
    private int credits;

    @Column(name = "duration_hours", nullable = false)
    private int durationHours;

    @Column(name = "min_attendance_pct", nullable = false, precision = 5, scale = 2)
    private BigDecimal minAttendancePct = new BigDecimal("80.00");

    @Column(name = "pass_score", nullable = false, precision = 4, scale = 2)
    private BigDecimal passScore = new BigDecimal("5.00");

    @Column(name = "midterm_weight", nullable = false, precision = 3, scale = 2)
    private BigDecimal midtermWeight = new BigDecimal("0.40");

    @Column(name = "final_weight", nullable = false, precision = 3, scale = 2)
    private BigDecimal finalWeight = new BigDecimal("0.60");

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    protected Course() {
    }

    public Course(String code, String name, int credits, int durationHours) {
        this.code = code;
        this.name = name;
        this.credits = credits;
        this.durationHours = durationHours;
    }

    public Long getId() {
        return id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getCredits() {
        return credits;
    }

    public void setCredits(int credits) {
        this.credits = credits;
    }

    public int getDurationHours() {
        return durationHours;
    }

    public void setDurationHours(int durationHours) {
        this.durationHours = durationHours;
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

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
