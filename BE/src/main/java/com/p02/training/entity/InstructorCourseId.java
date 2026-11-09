package com.p02.training.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;

/** Composite primary key of {@link InstructorCourse}. */
@Embeddable
public class InstructorCourseId implements Serializable {

    @Column(name = "instructor_id", nullable = false)
    private Long instructorId;

    @Column(name = "course_id", nullable = false)
    private Long courseId;

    protected InstructorCourseId() {
    }

    public InstructorCourseId(Long instructorId, Long courseId) {
        this.instructorId = instructorId;
        this.courseId = courseId;
    }

    public Long getInstructorId() {
        return instructorId;
    }

    public Long getCourseId() {
        return courseId;
    }

    @Override
    public boolean equals(Object other) {
        return this == other || (other instanceof InstructorCourseId id
                && Objects.equals(instructorId, id.instructorId)
                && Objects.equals(courseId, id.courseId));
    }

    @Override
    public int hashCode() {
        return Objects.hash(instructorId, courseId);
    }
}
