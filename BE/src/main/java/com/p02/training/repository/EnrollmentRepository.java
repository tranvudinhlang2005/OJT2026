package com.p02.training.repository;

import com.p02.training.entity.Enrollment;
import com.p02.training.entity.enums.EnrollmentStatus;
import com.p02.training.repository.projection.EnrollmentKeys;
import jakarta.persistence.LockModeType;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {

    /** TR12: the owner and class of an enrollment, read before the locks are taken. */
    @Query("select e.student.id as studentId, e.classOffering.id as classId from Enrollment e where e.id = :id")
    Optional<EnrollmentKeys> findKeysById(@Param("id") Long id);

    /** TR12: lock from spec 0.5. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Enrollment> findLockedById(Long id);

    /** TR10: the existing row, which re-enrolling reuses (D06). */
    Optional<Enrollment> findByStudent_IdAndClassOffering_Id(Long studentId, Long classId);

    /** TR05: a class that has ever had an enrollment can't be physically deleted. */
    boolean existsByClassOffering_Id(Long classId);

    /** TR05 cancel and TR16 complete: rows to move to a new status. */
    List<Enrollment> findByClassOffering_IdAndStatus(Long classId, EnrollmentStatus status);

    /** TR11 optional reconciliation of enrolled_count. */
    long countByClassOffering_IdAndStatus(Long classId, EnrollmentStatus status);

    /** TR13 roster: shows the student's code and name, so both are loaded in one query. */
    @EntityGraph(attributePaths = {"student", "student.user"})
    Page<Enrollment> findByClassOffering_IdAndStatusIn(Long classId, Collection<EnrollmentStatus> statuses,
            Pageable pageable);

    /** "My classes" with no status filter. */
    @EntityGraph(attributePaths = {"classOffering", "classOffering.course"})
    Page<Enrollment> findByStudent_Id(Long studentId, Pageable pageable);

    /** "My classes" with a status filter. */
    @EntityGraph(attributePaths = {"classOffering", "classOffering.course"})
    Page<Enrollment> findByStudent_IdAndStatus(Long studentId, EnrollmentStatus status, Pageable pageable);

    /** TR14, TR15: which students may appear in a request. */
    @Query("select e.student.id from Enrollment e where e.classOffering.id = :classId and e.status = :status")
    List<Long> findStudentIds(@Param("classId") Long classId, @Param("status") EnrollmentStatus status);

    /** TR14 ATTENDANCE_INCOMPLETE. */
    @Query("""
            select count(e) from Enrollment e
            where e.classOffering.id = :classId and e.status = :status
              and not exists (select 1 from Attendance a where a.student = e.student and a.session.id = :sessionId)
            """)
    long countWithoutAttendance(@Param("classId") Long classId, @Param("sessionId") Long sessionId,
            @Param("status") EnrollmentStatus status);

    /** TR15 GRADES_INCOMPLETE: students without both scores. */
    @Query("""
            select count(e) from Enrollment e
            where e.classOffering.id = :classId and e.status = :status
              and not exists (select 1 from AssessmentResult r
                              where r.student = e.student and r.classOffering = e.classOffering
                                and r.midtermScore is not null and r.finalScore is not null)
            """)
    long countWithoutBothScores(@Param("classId") Long classId, @Param("status") EnrollmentStatus status);

    /** TR18 total enrollments. COUNT(DISTINCT id) with no session join avoids double counting. */
    @Query("select count(distinct e.id) from Enrollment e join e.classOffering c where e.status in :statuses and "
            + DashboardFilter.ON_CLASS)
    long countForDashboard(@Param("statuses") Collection<EnrollmentStatus> statuses,
            @Param("semester") String semester, @Param("courseId") Long courseId,
            @Param("from") LocalDate from, @Param("to") LocalDate to);
}
