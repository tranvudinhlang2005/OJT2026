package com.p02.training.repository.projection;

import java.time.LocalDate;
import java.time.LocalTime;

/** A session considered by the conflict checks in TR08. The overlap rule (D08) belongs to the service. */
public interface SessionSlot {

    Long getSessionId();

    String getClassCode();

    LocalDate getSessionDate();

    LocalTime getStartTime();

    LocalTime getEndTime();
}
