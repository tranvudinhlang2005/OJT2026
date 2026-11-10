package com.p02.training.repository;

import com.p02.training.entity.Session;
import com.p02.training.entity.enums.ClassStatus;
import com.p02.training.entity.enums.EnrollmentStatus;
import com.p02.training.repository.projection.ScheduleEntry;
import com.p02.training.repository.projection.SessionSlot;
import jakarta.persistence.LockModeType;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * The {@code find...Slots...} methods return candidates for TR08. They narrow sessions by date and
 * scope only: comparing times with the overlap rule in D08 belongs to the service.
 */
public interface SessionRepository extends JpaRepository<Session, Long> {

    String SLOT = """
            select s.id as sessionId, c.classCode as classCode, s.sessionDate as sessionDate,
                   s.startTime as startTime, s.endTime as endTime
            from Session s join s.classOffering c
            """;

    String SCHEDULE = """
            select s.sessionDate as sessionDate, s.startTime as startTime, s.endTime as endTime,
                   r.code as roomCode, c.classCode as classCode, co.name as courseName, s.topic as topic
            from Session s join s.room r join s.classOffering c join c.course co
            """;

    /**
     * TR06: the session's class id, read as a scalar before the locks are taken in the spec 0.5
     * order. Empty when the session does not exist.
     */
    @Query("select s.classOffering.id from Session s where s.id = :sessionId")
    Optional<Long> findClassIdById(@Param("sessionId") Long sessionId);

    /** TR06, TR14: lock from spec 0.5. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Session> findLockedById(Long id);

    /**
     * TR16 confirmation (A-25): locks every session of a class in ascending id order, after the
     * caller has locked the ClassOffering, so confirmation and unlocking cannot interleave or deadlock.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from Session s where s.classOffering.id = :classId order by s.id")
    List<Session> lockAllByClassId(@Param("classId") Long classId);

    /** TR05, TR06: a class's sessions in time order, with their rooms in one query. */
    @EntityGraph(attributePaths = "room")
    List<Session> findByClassOffering_IdOrderBySessionDateAscStartTimeAsc(Long classId);

    /** TR16 NO_SESSIONS and the session total in D15. */
    long countByClassOffering_Id(Long classId);

    /** TR16 SESSIONS_NOT_LOCKED. */
    long countByClassOffering_IdAndAttendanceLockedFalse(Long classId);

    /** TR05: physical delete of a class removes its sessions. */
    void deleteByClassOffering_Id(Long classId);

    /** TR05 capacity change: the smallest room among the class's sessions. Empty with no sessions. */
    @Query("select min(s.room.capacity) from Session s where s.classOffering.id = :classId")
    Optional<Integer> findSmallestRoomCapacity(@Param("classId") Long classId);

    /** TR06 ROOM_IN_USE. */
    boolean existsByRoom_IdAndSessionDateGreaterThanEqualAndClassOffering_StatusInAndClassOffering_DeletedAtIsNull(
            Long roomId, LocalDate fromDate, Collection<ClassStatus> statuses);

    /** TR08 checkSessionOverlapInClass. */
    @Query(SLOT + """
            where c.id = :classId and s.sessionDate = :date
              and (cast(:excludedSessionId as long) is null or s.id <> :excludedSessionId)
            """)
    List<SessionSlot> findSlotsInClass(@Param("classId") Long classId, @Param("date") LocalDate date,
            @Param("excludedSessionId") Long excludedSessionId);

    /** TR08 checkRoomConflict. */
    @Query(SLOT + """
            where s.room.id = :roomId and s.sessionDate = :date
              and c.status in :statuses and c.deletedAt is null
              and (cast(:excludedSessionId as long) is null or s.id <> :excludedSessionId)
            """)
    List<SessionSlot> findSlotsInRoom(@Param("roomId") Long roomId, @Param("date") LocalDate date,
            @Param("statuses") Collection<ClassStatus> statuses, @Param("excludedSessionId") Long excludedSessionId);

    /** TR08 checkInstructorConflict: the instructor's other classes on the given dates. */
    @Query(SLOT + """
            where c.instructor.id = :instructorId and s.sessionDate in :dates
              and c.status in :statuses and c.deletedAt is null and c.id <> :excludedClassId
            """)
    List<SessionSlot> findSlotsForInstructor(@Param("instructorId") Long instructorId,
            @Param("dates") Collection<LocalDate> dates, @Param("statuses") Collection<ClassStatus> statuses,
            @Param("excludedClassId") Long excludedClassId);

    /** TR08 checkStudentConflict: other classes the student has an enrollment in, on the given dates. */
    @Query(SLOT + """
            join Enrollment e on e.classOffering = c
            where e.student.id = :studentId and e.status = :enrollmentStatus
              and s.sessionDate in :dates and c.deletedAt is null and c.id <> :excludedClassId
            """)
    List<SessionSlot> findSlotsForStudent(@Param("studentId") Long studentId,
            @Param("enrollmentStatus") EnrollmentStatus enrollmentStatus, @Param("dates") Collection<LocalDate> dates,
            @Param("excludedClassId") Long excludedClassId);

    /** TR17: an instructor's schedule. The range is capped at 92 days by the service. */
    @Query(SCHEDULE + """
            where c.instructor.id = :instructorId and c.status in :statuses and c.deletedAt is null
              and s.sessionDate between :from and :to
            order by s.sessionDate, s.startTime
            """)
    List<ScheduleEntry> findInstructorSchedule(@Param("instructorId") Long instructorId,
            @Param("statuses") Collection<ClassStatus> statuses, @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    /** TR17: a student's schedule. The range is capped at 92 days by the service. */
    @Query(SCHEDULE + """
            join Enrollment e on e.classOffering = c
            where e.student.id = :studentId and e.status in :enrollmentStatuses
              and c.status in :statuses and c.deletedAt is null
              and s.sessionDate between :from and :to
            order by s.sessionDate, s.startTime
            """)
    List<ScheduleEntry> findStudentSchedule(@Param("studentId") Long studentId,
            @Param("enrollmentStatuses") Collection<EnrollmentStatus> enrollmentStatuses,
            @Param("statuses") Collection<ClassStatus> statuses, @Param("from") LocalDate from,
            @Param("to") LocalDate to);
}
