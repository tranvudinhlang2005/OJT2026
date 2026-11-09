package com.p02.training.entity.enums;

/**
 * The 24 actions in spec 0.6. This enum is the only control on the action column: by decision A-21b
 * the database has no CHECK, so a rejected insert can never lose a security event.
 */
public enum SecurityAction {
    LOGIN_SUCCESS, LOGIN_FAILED, ACCOUNT_LOCKED, LOGOUT, PASSWORD_CHANGE,
    USER_CREATE, USER_UPDATE, ROLE_CHANGE, USER_STATUS_CHANGE,
    COURSE_CHANGE, INSTRUCTOR_CHANGE, STUDENT_CHANGE, ROOM_CHANGE,
    CLASS_CHANGE, CLASS_STATUS_CHANGE, SESSION_CHANGE, ASSIGN_INSTRUCTOR,
    ENROLL, CANCEL_ENROLL,
    ATTENDANCE_UPDATE, SESSION_LOCK, SESSION_UNLOCK, GRADING_STATUS_CHANGE,
    ACCESS_DENIED
}
