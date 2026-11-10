package com.p02.training.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.p02.training.entity.enums.SecurityAction;
import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * TR18 {@code GET /dashboard/security-alerts}: counts of LOGIN_FAILED, ACCOUNT_LOCKED and
 * ACCESS_DENIED between {@code from} (inclusive) and {@code to} (exclusive). {@code recentEvents},
 * the 20 most recent of those events, is present for Admins only; Managers see counts only.
 */
public record SecurityAlertsResponse(
        Instant from,
        Instant to,
        Map<SecurityAction, Long> counts,
        @JsonInclude(JsonInclude.Include.NON_NULL) List<Event> recentEvents) {

    /** Time, action, username and IP. The event's details are not included. */
    public record Event(Instant createdAt, SecurityAction action, String username, String ipAddress) {
    }
}
