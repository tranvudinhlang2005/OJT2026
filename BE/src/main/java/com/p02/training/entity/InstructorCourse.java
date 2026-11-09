package com.p02.training.entity;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

/**
 * A course an instructor may teach. TR03 replaces these rows as a set and never updates them, so
 * there are no timestamps. Deleting a course removes its rows through the database's own cascade
 * (A-18), because TR02's only delete condition is that no class uses the course.
 */
@Entity
@Table(name = "instructor_course")
public class InstructorCourse {

    @EmbeddedId
    private InstructorCourseId id;

    @MapsId("instructorId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "instructor_id", nullable = false)
    private Instructor instructor;

    @MapsId("courseId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Course course;

    protected InstructorCourse() {
    }

    public InstructorCourse(Instructor instructor, Course course) {
        this.id = new InstructorCourseId(instructor.getId(), course.getId());
        this.instructor = instructor;
        this.course = course;
    }

    public InstructorCourseId getId() {
        return id;
    }

    public Instructor getInstructor() {
        return instructor;
    }

    public Course getCourse() {
        return course;
    }
}
