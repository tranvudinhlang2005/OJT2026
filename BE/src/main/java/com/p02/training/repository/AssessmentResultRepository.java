package com.p02.training.repository;

import com.p02.training.entity.AssessmentResult;
import com.p02.training.entity.enums.FinalStatus;
import com.p02.training.entity.enums.GradingStatus;
import com.p02.training.repository.projection.ClassOutcomeCount;
import com.p02.training.repository.projection.OutcomeTotals;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AssessmentResultRepository extends JpaRepository<AssessmentResult, Long> {

    String OUTCOMES = """
            sum(case when r.finalStatus = com.p02.training.entity.enums.FinalStatus.PASSED then 1 else 0 end) as passed,
            sum(case when r.finalStatus = com.p02.training.entity.enums.FinalStatus.FAILED then 1 else 0 end) as failed
            """;

    /** TR15 list: shows student details, so they are loaded in one query. */
    @EntityGraph(attributePaths = {"student", "student.user"})
    Page<AssessmentResult> findByClassOffering_Id(Long classId, Pageable pageable);

    /** TR16 confirmation: every result in the class. */
    List<AssessmentResult> findAllByClassOffering_Id(Long classId);

    /** TR15 save: the rows named in a request. */
    List<AssessmentResult> findByClassOffering_IdAndStudent_IdIn(Long classId, Collection<Long> studentIds);

    /** TR15 student view. The service passes CONFIRMED, as D20 requires. */
    @EntityGraph(attributePaths = {"classOffering", "classOffering.course"})
    Page<AssessmentResult> findByStudent_IdAndClassOffering_GradingStatusAndClassOffering_DeletedAtIsNull(
            Long studentId, GradingStatus gradingStatus, Pageable pageable);

    /** TR18 summary: completion and average attendance across matching classes. */
    @Query("select " + OUTCOMES + ", avg(r.attendanceRate) as averageAttendanceRate "
            + "from AssessmentResult r join r.classOffering c where c.gradingStatus = :gradingStatus and "
            + DashboardFilter.ON_CLASS)
    OutcomeTotals sumOutcomesForDashboard(@Param("gradingStatus") GradingStatus gradingStatus,
            @Param("semester") String semester, @Param("courseId") Long courseId,
            @Param("from") LocalDate from, @Param("to") LocalDate to);

    /**
     * TR18 summary for Managers (D21, A-32): the same aggregate as {@link #sumOutcomesForDashboard},
     * but only over classes that each have at least {@code minResults} confirmed results (PASSED or
     * FAILED). A smaller class contributes to neither the counts nor the attendance average, so no
     * combination of filters can reveal its figures. The per-class count is a correlated subquery,
     * evaluated per class inside the same filtered query.
     */
    @Query("select " + OUTCOMES + ", avg(r.attendanceRate) as averageAttendanceRate "
            + "from AssessmentResult r join r.classOffering c where c.gradingStatus = :gradingStatus and "
            + DashboardFilter.ON_CLASS + """
             and (select count(r2) from AssessmentResult r2
                  where r2.classOffering = c and r2.finalStatus in :countedStatuses) >= :minResults
            """)
    OutcomeTotals sumOutcomesForDashboardOverClassesWithAtLeast(@Param("gradingStatus") GradingStatus gradingStatus,
            @Param("countedStatuses") Collection<FinalStatus> countedStatuses, @Param("minResults") long minResults,
            @Param("semester") String semester, @Param("courseId") Long courseId,
            @Param("from") LocalDate from, @Param("to") LocalDate to);

    /** TR18 per-class completion for one page of classes, in one query. */
    @Query("select r.classOffering.id as classId, " + OUTCOMES + """
            from AssessmentResult r
            where r.classOffering.id in :classIds and r.classOffering.gradingStatus = :gradingStatus
            group by r.classOffering.id
            """)
    List<ClassOutcomeCount> countOutcomesByClass(@Param("classIds") Collection<Long> classIds,
            @Param("gradingStatus") GradingStatus gradingStatus);
}
