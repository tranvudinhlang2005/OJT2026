package com.p02.training.repository.projection;

/** Sessions a student attended in a class, used for the rate in D15. */
public interface StudentAttendanceCount {

    Long getStudentId();

    long getAttended();
}
