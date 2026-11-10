package com.p02.training.dto.response;

import com.p02.training.entity.Room;
import com.p02.training.entity.Session;
import java.time.LocalDate;
import java.time.LocalTime;

/**
 * A TR06 session. Times are Vietnam local times. {@code attendanceVersion} is not included: it
 * belongs to the TR14 attendance API (A-09).
 */
public record SessionResponse(
        Long id,
        Long classId,
        LocalDate sessionDate,
        LocalTime startTime,
        LocalTime endTime,
        Long roomId,
        String roomCode,
        String topic,
        boolean attendanceLocked) {

    /** Expects the room to be loaded already, or loadable in the current transaction. */
    public static SessionResponse from(Session session) {
        Room room = session.getRoom();
        return new SessionResponse(session.getId(), session.getClassOffering().getId(), session.getSessionDate(),
                session.getStartTime(), session.getEndTime(), room.getId(), room.getCode(), session.getTopic(),
                session.isAttendanceLocked());
    }
}
