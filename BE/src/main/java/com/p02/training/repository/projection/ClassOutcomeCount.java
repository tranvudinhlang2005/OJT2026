package com.p02.training.repository.projection;

/** PASSED and FAILED counts for one class (TR18). */
public interface ClassOutcomeCount {

    Long getClassId();

    long getPassed();

    long getFailed();
}
