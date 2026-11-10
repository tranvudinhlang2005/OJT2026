package com.p02.training.dto.response;

import com.p02.training.repository.projection.ScheduleEntry;
import java.time.LocalDate;
import java.time.LocalTime;

/** One session in a personal schedule (TR17). Times are Vietnam local times (A-06). */
public record ScheduleItemResponse(
        LocalDate sessionDate,
        LocalTime startTime,
        LocalTime endTime,
        String roomCode,
        String classCode,
        String courseName,
        String topic) {

    public static ScheduleItemResponse from(ScheduleEntry entry) {
        return new ScheduleItemResponse(entry.getSessionDate(), entry.getStartTime(), entry.getEndTime(),
                entry.getRoomCode(), entry.getClassCode(), entry.getCourseName(), entry.getTopic());
    }
}
