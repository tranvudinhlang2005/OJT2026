package com.p02.training.repository;

import com.p02.training.entity.InstructorCourse;
import com.p02.training.entity.InstructorCourseId;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Eligibility checks (TR05, TR07) use the inherited {@code existsById} with an
 * {@link InstructorCourseId}.
 */
public interface InstructorCourseRepository extends JpaRepository<InstructorCourse, InstructorCourseId> {

    /** TR03: an instructor's courses, loaded in one query. */
    @EntityGraph(attributePaths = "course")
    List<InstructorCourse> findById_InstructorId(Long instructorId);

    /**
     * TR03: removes the courses taken off an instructor. Services should delete only the removed rows
     * and insert only the new ones: Hibernate runs inserts before deletes in a flush, so deleting and
     * re-adding the same pair would break the primary key.
     */
    void deleteById_InstructorIdAndId_CourseIdIn(Long instructorId, Collection<Long> courseIds);
}
