package com.p02.training.repository.projection;

/** Seat totals for the fill rate (TR18). Both are null when no class matches. */
public interface CapacityTotals {

    Long getEnrolled();

    Long getCapacity();
}
