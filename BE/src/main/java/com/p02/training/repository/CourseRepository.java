package com.p02.training.repository;

import com.p02.training.entity.Course;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface CourseRepository extends JpaRepository<Course, Long>, JpaSpecificationExecutor<Course> {

    /** TR02 COURSE_CODE_DUPLICATE on create. */
    boolean existsByCode(String code);

    /** TR02 COURSE_CODE_DUPLICATE on edit. */
    boolean existsByCodeAndIdNot(String code, Long excludedId);

    /**
     * TR03: a course newly assigned to an instructor must be active. Courses the instructor already
     * has may stay assigned after they become inactive (A-29).
     */
    List<Course> findByIdInAndActiveTrue(Collection<Long> ids);
}
