package com.p02.training.repository;

import com.p02.training.entity.Instructor;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;

public interface InstructorRepository extends JpaRepository<Instructor, Long>, JpaSpecificationExecutor<Instructor> {

    /** TR03 list: loads each instructor's account in one query, because the list shows the name. */
    @Override
    @EntityGraph(attributePaths = "user")
    Page<Instructor> findAll(Specification<Instructor> specification, Pageable pageable);

    /** Finds the Instructor for the logged-in user (TR03, TR13, TR14, TR15, TR17). */
    Optional<Instructor> findByUser_Id(Long userId);

    /** TR05, TR06, TR07: lock from spec 0.5. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Instructor> findLockedById(Long id);

    /** TR01, TR03 INSTRUCTOR_CODE_DUPLICATE on create. */
    boolean existsByInstructorCode(String instructorCode);

    /** TR03 INSTRUCTOR_CODE_DUPLICATE on edit. */
    boolean existsByInstructorCodeAndIdNot(String instructorCode, Long excludedId);
}
