package com.p02.training.common;

/**
 * API paths. The base path is a constant rather than server.servlet.context-path because a context
 * path would also scope cookies to it, and the frontend could then no longer read XSRF-TOKEN.
 */
public final class ApiPaths {

    public static final String V1 = "/api/v1";

    public static final String AUTH = V1 + "/auth";
    public static final String CSRF = AUTH + "/csrf";
    public static final String LOGIN = AUTH + "/login";

    public static final String USERS = V1 + "/users";
    public static final String COURSES = V1 + "/courses";
    public static final String INSTRUCTORS = V1 + "/instructors";
    public static final String MY_INSTRUCTOR_PROFILE = INSTRUCTORS + "/me";
    public static final String STUDENTS = V1 + "/students";
    public static final String MY_STUDENT_PROFILE = STUDENTS + "/me";
    public static final String CLASSES = V1 + "/classes";
    public static final String SESSIONS = V1 + "/sessions";
    public static final String ROOMS = V1 + "/rooms";
    public static final String ENROLLMENTS = V1 + "/enrollments";
    public static final String MY_ENROLLMENTS = MY_STUDENT_PROFILE + "/enrollments";
    public static final String MY_RESULTS = MY_STUDENT_PROFILE + "/results";
    public static final String MY_SCHEDULE = V1 + "/me/schedule";
    public static final String DASHBOARD = V1 + "/dashboard";
    public static final String AUDIT = V1 + "/audit";

    private ApiPaths() {
    }
}
