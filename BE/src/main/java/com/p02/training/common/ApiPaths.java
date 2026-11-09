package com.p02.training.common;

/**
 * API paths. The base path is a constant rather than server.servlet.context-path because a context
 * path would also scope cookies to it, and the frontend could then no longer read XSRF-TOKEN.
 */
public final class ApiPaths {

    public static final String V1 = "/api/v1";
    public static final String LOGIN = V1 + "/auth/login";

    private ApiPaths() {
    }
}
