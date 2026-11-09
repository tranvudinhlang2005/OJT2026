package com.p02.training.repository;

import com.p02.training.entity.GradeAuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

/** Append-only. TR18 has no API to edit or delete these rows, so services must never call delete. */
public interface GradeAuditLogRepository
        extends JpaRepository<GradeAuditLog, Long>, JpaSpecificationExecutor<GradeAuditLog> {

    /** TR18 audit list: shows class code, student code and who made the change, in one query. */
    @Override
    @EntityGraph(attributePaths = {"classOffering", "student", "changedBy"})
    Page<GradeAuditLog> findAll(Specification<GradeAuditLog> specification, Pageable pageable);
}
