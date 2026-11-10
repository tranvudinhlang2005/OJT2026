package com.p02.training.repository.projection;

/**
 * An enrollment's owner and class, read without loading the entity (TR12), so the rows can then be
 * locked in the spec 0.5 order and read fresh.
 */
public interface EnrollmentKeys {

    Long getStudentId();

    Long getClassId();
}
