package com.p02.training.repository;

import com.p02.training.entity.Student;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;

public interface StudentRepository extends JpaRepository<Student, Long>, JpaSpecificationExecutor<Student> {

    /** TR04 list: loads each student's account in one query, because the list shows the name. */
    @Override
    @EntityGraph(attributePaths = "user")
    Page<Student> findAll(Specification<Student> specification, Pageable pageable);

    /** Finds the Student for the logged-in user (TR04, TR10, TR12, TR17). */
    Optional<Student> findByUser_Id(Long userId);

    /** TR10, TR12: lock from spec 0.5. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Student> findLockedById(Long id);

    /** TR01, TR04 STUDENT_CODE_DUPLICATE on create. */
    boolean existsByStudentCode(String studentCode);

    /** TR04 STUDENT_CODE_DUPLICATE on edit. */
    boolean existsByStudentCodeAndIdNot(String studentCode, Long excludedId);
}
