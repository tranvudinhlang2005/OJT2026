package com.p02.training.repository;

import com.p02.training.entity.ClassOffering;
import com.p02.training.entity.enums.ClassStatus;
import com.p02.training.repository.projection.CapacityTotals;
import com.p02.training.repository.projection.ClassStatusCount;
import jakarta.persistence.LockModeType;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ClassOfferingRepository
        extends JpaRepository<ClassOffering, Long>, JpaSpecificationExecutor<ClassOffering> {

    /**
     * TR09 and TR18 lists. The list shows course and instructor names, so they are loaded in one
     * query. These are to-one associations, so paging still happens in the database.
     */
    @Override
    @EntityGraph(attributePaths = {"course", "instructor", "instructor.user"})
    Page<ClassOffering> findAll(Specification<ClassOffering> specification, Pageable pageable);

    /** TR09 detail. A soft-deleted class counts as not found (spec 0.4). */
    @EntityGraph(attributePaths = {"course", "instructor", "instructor.user"})
    Optional<ClassOffering> findWithDetailsByIdAndDeletedAtIsNull(Long id);

    /** TR05, TR06, TR07, TR10, TR12, TR15, TR16: lock from spec 0.5. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<ClassOffering> findLockedById(Long id);

    /**
     * TR05, TR06: the class's current instructor id, read as a scalar so no entity enters the
     * persistence context. Services read it before locking the instructor and then the class
     * (spec 0.5), and compare it with the locked row. Empty when the class has no instructor or
     * does not exist.
     */
    @Query("select i.id from ClassOffering c left join c.instructor i where c.id = :classId")
    Optional<Long> findInstructorIdById(@Param("classId") Long classId);

    /** TR05 CLASS_CODE_DUPLICATE on create. */
    boolean existsByClassCode(String classCode);

    /** TR05 CLASS_CODE_DUPLICATE on edit. */
    boolean existsByClassCodeAndIdNot(String classCode, Long excludedId);

    /** TR02 COURSE_IN_USE. */
    boolean existsByCourse_Id(Long courseId);

    /** TR03 INSTRUCTOR_COURSE_IN_USE: the codes of removed courses this instructor still teaches. */
    @Query("""
            select distinct c.course.code from ClassOffering c
            where c.instructor.id = :instructorId and c.course.id in :courseIds
              and c.status in :statuses and c.deletedAt is null
            """)
    List<String> findCourseCodesInUse(@Param("instructorId") Long instructorId,
            @Param("courseIds") Collection<Long> courseIds, @Param("statuses") Collection<ClassStatus> statuses);

    /** TR18: number of classes in each status. */
    @Query("select c.status as status, count(c) as total from ClassOffering c where "
            + DashboardFilter.ON_CLASS + " group by c.status")
    List<ClassStatusCount> countByStatusForDashboard(@Param("semester") String semester,
            @Param("courseId") Long courseId, @Param("from") LocalDate from, @Param("to") LocalDate to);

    /** TR18 fill rate. */
    @Query("select sum(c.enrolledCount) as enrolled, sum(c.maxCapacity) as capacity from ClassOffering c where "
            + DashboardFilter.ON_CLASS + " and c.status in :statuses")
    CapacityTotals sumCapacityForDashboard(@Param("statuses") Collection<ClassStatus> statuses,
            @Param("semester") String semester, @Param("courseId") Long courseId,
            @Param("from") LocalDate from, @Param("to") LocalDate to);
}
