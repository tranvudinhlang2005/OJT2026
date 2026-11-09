package com.p02.training.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

/** Instructor profile. Its active flag is separate from the account's (TR03). */
@Entity
@Table(name = "instructor")
public class Instructor extends AuditedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true, updatable = false)
    private User user;

    @Column(name = "instructor_code", nullable = false, length = 30)
    private String instructorCode;

    @Column(name = "department", length = 100)
    private String department;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    protected Instructor() {
    }

    public Instructor(User user, String instructorCode) {
        this.user = user;
        this.instructorCode = instructorCode;
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public String getInstructorCode() {
        return instructorCode;
    }

    public void setInstructorCode(String instructorCode) {
        this.instructorCode = instructorCode;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
