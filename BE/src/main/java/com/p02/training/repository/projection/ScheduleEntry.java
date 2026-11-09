package com.p02.training.repository.projection;

import java.time.LocalDate;
import java.time.LocalTime;

/** One row of a personal schedule (TR17). */
public interface ScheduleEntry {

    LocalDate getSessionDate();

    LocalTime getStartTime();

    LocalTime getEndTime();

    String getRoomCode();

    String getClassCode();

    String getCourseName();

    String getTopic();
}
