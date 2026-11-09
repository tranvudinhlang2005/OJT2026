package com.p02.training.repository.projection;

/** Result totals for the dashboard summary (TR18). All are null when no result matches. */
public interface OutcomeTotals {

    Long getPassed();

    Long getFailed();

    Double getAverageAttendanceRate();
}
