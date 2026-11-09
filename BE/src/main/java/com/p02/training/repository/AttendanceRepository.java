package com.p02.training.repository;

import com.p02.training.entity.Attendance;
import com.p02.training.entity.enums.AttendanceStatus;
import com.p02.training.repository.projection.StudentAttendanceCount;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    /** TR14: a session's marks, for viewing and upserting, with student details in one query. */
    @EntityGraph(attributePaths = {"student", "student.user"})
    List<Attendance> findBySession_Id(Long sessionId);

    /** TR16 and D15: sessions each student attended, in one query for the whole class. */
    @Query("""
            select a.student.id as studentId, count(a) as attended from Attendance a
            where a.session.classOffering.id = :classId and a.status in :statuses
            group by a.student.id
            """)
    List<StudentAttendanceCount> countAttendedByStudent(@Param("classId") Long classId,
            @Param("statuses") Collection<AttendanceStatus> statuses);
}
