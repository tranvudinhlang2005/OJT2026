package com.p02.training.repository;

/**
 * The TR18 filter, shared by dashboard queries: class {@code c}, always without soft-deleted classes,
 * with optional semester, course and {@code start_date} range. Query methods that use it must declare
 * the named parameters. The casts tell PostgreSQL each parameter's type when its value is null.
 */
final class DashboardFilter {

    static final String ON_CLASS = """
            c.deletedAt is null
            and (cast(:semester as string) is null or c.semester = :semester)
            and (cast(:courseId as long) is null or c.course.id = :courseId)
            and (cast(:from as localdate) is null or c.startDate >= :from)
            and (cast(:to as localdate) is null or c.startDate <= :to)
            """;

    private DashboardFilter() {
    }
}
