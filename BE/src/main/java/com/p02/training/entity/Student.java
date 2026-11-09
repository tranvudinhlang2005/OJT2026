package com.p02.training.entity;

import com.p02.training.entity.enums.StudentStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;

/** Student profile. Its status is separate from the account's active flag (TR04). */
@Entity
@Table(name = "student")
public class Student extends AuditedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true, updatable = false)
    private User user;

    @Column(name = "student_code", nullable = false, length = 30)
    private String studentCode;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "homeroom_class", length = 50)
    private String homeroomClass;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private StudentStatus status = StudentStatus.ACTIVE;

    protected Student() {
    }

    public Student(User user, String studentCode) {
        this.user = user;
        this.studentCode = studentCode;
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public String getStudentCode() {
        return studentCode;
    }

    public void setStudentCode(String studentCode) {
        this.studentCode = studentCode;
    }

    public LocalDate getDateOfBirth() {
        return dateOfBirth;
    }

    public void setDateOfBirth(LocalDate dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }

    public String getHomeroomClass() {
        return homeroomClass;
    }

    public void setHomeroomClass(String homeroomClass) {
        this.homeroomClass = homeroomClass;
    }

    public StudentStatus getStatus() {
        return status;
    }

    public void setStatus(StudentStatus status) {
        this.status = status;
    }
}
