package com.p02.training.common;

import java.util.Locale;

/** Builds the LIKE pattern for a list's {@code keyword} filter. */
public final class SearchPatterns {

    /** Escape character to pass to {@code CriteriaBuilder.like(..., ESCAPE)}. */
    public static final char ESCAPE = '\\';

    private SearchPatterns() {
    }

    /** True when the keyword should filter at all. */
    public static boolean hasKeyword(String keyword) {
        return keyword != null && !keyword.isBlank();
    }

    /**
     * A lower-case "contains" pattern. {@code %}, {@code _} and the escape character in the keyword
     * are escaped, so they match literally instead of acting as wildcards.
     */
    public static String containsIgnoringCase(String keyword) {
        String escaped = keyword.trim().toLowerCase(Locale.ROOT)
                .replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");
        return "%" + escaped + "%";
    }
}
