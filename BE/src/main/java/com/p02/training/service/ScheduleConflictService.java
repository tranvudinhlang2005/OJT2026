package com.p02.training.service;

import com.p02.training.entity.Session;
import com.p02.training.entity.enums.ClassStatus;
import com.p02.training.entity.enums.EnrollmentStatus;
import com.p02.training.exception.ApiException;
import com.p02.training.repository.SessionRepository;
import com.p02.training.repository.projection.SessionSlot;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * TR08 schedule conflict checks: an internal service with no API, used by TR05 (publish), TR06,
 * TR07 and TR10.
 *
 * <p>Only sessions on the same date are compared. Two sessions overlap when
 * {@code startA < endB && endA > startB} (D08), so back-to-back sessions do not. Cancelled and
 * soft-deleted classes, cancelled enrollments and the record being edited are always ignored; for
 * rooms and instructors only DRAFT, OPEN and IN_PROGRESS classes count (D09).
 *
 * <p>Must run inside the caller's transaction, after it has taken the row locks in the spec 0.5
 * order, so the answer stays true until commit.
 */
@Service
@Transactional(propagation = Propagation.MANDATORY)
public class ScheduleConflictService {

    /** D09: classes whose sessions occupy a room or an instructor. */
    static final Set<ClassStatus> SCHEDULED_STATUSES =
            EnumSet.of(ClassStatus.DRAFT, ClassStatus.OPEN, ClassStatus.IN_PROGRESS);

    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("HH:mm");

    private final SessionRepository sessionRepository;

    public ScheduleConflictService(SessionRepository sessionRepository) {
        this.sessionRepository = sessionRepository;
    }

    /** A time slot to check: a date and a start and end time, with no identity. */
    public record Slot(LocalDate date, LocalTime startTime, LocalTime endTime) {

        public static Slot of(Session session) {
            return new Slot(session.getSessionDate(), session.getStartTime(), session.getEndTime());
        }
    }

    /** One conflicting session: the result format TR08 defines. */
    public record Conflict(String classCode, LocalDate sessionDate, LocalTime startTime, LocalTime endTime) {

        static Conflict of(SessionSlot slot) {
            return new Conflict(slot.getClassCode(), slot.getSessionDate(), slot.getStartTime(), slot.getEndTime());
        }
    }

    /** checkSessionOverlapInClass: other sessions of the same class (TR06). */
    public List<Conflict> checkSessionOverlapInClass(Long classId, Slot slot, Long excludedSessionId) {
        return overlapping(sessionRepository.findSlotsInClass(classId, slot.date(), excludedSessionId), List.of(slot));
    }

    /** checkRoomConflict: sessions in the same room and date, of DRAFT/OPEN/IN_PROGRESS classes (TR05, TR06). */
    public List<Conflict> checkRoomConflict(Long roomId, Slot slot, Long excludedSessionId) {
        return overlapping(sessionRepository.findSlotsInRoom(roomId, slot.date(), SCHEDULED_STATUSES, excludedSessionId),
                List.of(slot));
    }

    /**
     * checkInstructorConflict: sessions of the instructor's other DRAFT/OPEN/IN_PROGRESS classes
     * (TR05, TR06, TR07).
     */
    public List<Conflict> checkInstructorConflict(Long instructorId, Collection<Slot> slots, Long excludedClassId) {
        if (slots.isEmpty()) {
            return List.of();
        }
        List<SessionSlot> candidates = sessionRepository.findSlotsForInstructor(instructorId, datesOf(slots),
                SCHEDULED_STATUSES, excludedClassId);
        return overlapping(candidates, slots);
    }

    /**
     * checkStudentConflict: sessions of the other classes where the student has an ENROLLED
     * enrollment, against every session of the given class (TR10).
     */
    public List<Conflict> checkStudentConflict(Long studentId, Long classId) {
        List<Slot> slots = sessionRepository.findByClassOffering_IdOrderBySessionDateAscStartTimeAsc(classId).stream()
                .map(Slot::of)
                .toList();
        if (slots.isEmpty()) {
            return List.of();
        }
        List<SessionSlot> candidates = sessionRepository.findSlotsForStudent(studentId, EnrollmentStatus.ENROLLED,
                datesOf(slots), classId);
        return overlapping(candidates, slots);
    }

    /** 409 SESSION_OVERLAP if the list is not empty (TR06). */
    public void requireNoSessionOverlap(List<Conflict> conflicts) {
        if (!conflicts.isEmpty()) {
            throw conflict("SESSION_OVERLAP",
                    "Buổi học bị trùng với buổi " + when(conflicts.get(0)) + " của lớp này", conflicts);
        }
    }

    /** 409 ROOM_CONFLICT if the list is not empty (TR05, TR06). */
    public void requireNoRoomConflict(String roomCode, List<Conflict> conflicts) {
        if (!conflicts.isEmpty()) {
            Conflict first = conflicts.get(0);
            throw conflict("ROOM_CONFLICT",
                    "Phòng " + roomCode + " đã có lớp " + first.classCode() + " vào " + when(first), conflicts);
        }
    }

    /** 409 SCHEDULE_CONFLICT for an instructor if the list is not empty (TR05, TR06, TR07). */
    public void requireNoInstructorConflict(List<Conflict> conflicts) {
        if (!conflicts.isEmpty()) {
            Conflict first = conflicts.get(0);
            throw conflict("SCHEDULE_CONFLICT",
                    "Giảng viên đã có lịch dạy lớp " + first.classCode() + " vào " + when(first), conflicts);
        }
    }

    /**
     * 409 SCHEDULE_CONFLICT for a student (TR10) if the list is not empty. The list comes from
     * {@link #checkStudentConflict}, so it only names the student's own classes (TR08).
     */
    public void requireNoStudentConflict(List<Conflict> conflicts) {
        if (!conflicts.isEmpty()) {
            Conflict first = conflicts.get(0);
            throw conflict("SCHEDULE_CONFLICT",
                    "Lịch học bị trùng với lớp " + first.classCode() + " vào " + when(first), conflicts);
        }
    }

    /** D08: true if the two time ranges on the same date overlap; touching ranges do not. */
    static boolean overlaps(LocalTime startA, LocalTime endA, LocalTime startB, LocalTime endB) {
        return startA.isBefore(endB) && endA.isAfter(startB);
    }

    private static List<Conflict> overlapping(List<SessionSlot> candidates, Collection<Slot> slots) {
        List<Conflict> conflicts = new ArrayList<>();
        for (SessionSlot candidate : candidates) {
            boolean clash = slots.stream().anyMatch(slot -> slot.date().equals(candidate.getSessionDate())
                    && overlaps(slot.startTime(), slot.endTime(), candidate.getStartTime(), candidate.getEndTime()));
            if (clash) {
                conflicts.add(Conflict.of(candidate));
            }
        }
        conflicts.sort(Comparator.comparing(Conflict::sessionDate).thenComparing(Conflict::startTime));
        return conflicts;
    }

    private static Set<LocalDate> datesOf(Collection<Slot> slots) {
        Set<LocalDate> dates = new LinkedHashSet<>();
        slots.forEach(slot -> dates.add(slot.date()));
        return dates;
    }

    private static String when(Conflict conflict) {
        return conflict.sessionDate().format(DATE) + " " + conflict.startTime().format(TIME) + "-"
                + conflict.endTime().format(TIME);
    }

    /**
     * The conflicts go in {@code details.conflicts}. Only Admins receive these errors (TR05-TR07),
     * and they may see every class (TR08). TR10 must send a student only their own classes.
     */
    private static ApiException conflict(String code, String message, List<Conflict> conflicts) {
        Map<String, Object> details = new LinkedHashMap<>();
        details.put("conflicts", conflicts);
        return new ApiException(HttpStatus.CONFLICT, code, message, details);
    }
}
