package com.p02.training.controller;

import com.p02.training.common.ApiPaths;
import com.p02.training.dto.response.DashboardClassResponse;
import com.p02.training.dto.response.DashboardSummaryResponse;
import com.p02.training.dto.response.GradeAuditLogResponse;
import com.p02.training.dto.response.PageResponse;
import com.p02.training.dto.response.SecurityAlertsResponse;
import com.p02.training.security.AuthenticatedUser;
import com.p02.training.service.DashboardService;
import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * TR18. Dashboard endpoints: Training Admin or Manager. Grade audit: Admin only; a Manager gets 403.
 * Rules are in SecurityConfig. All read-only: there is no endpoint to change or delete audit rows.
 * Dates are yyyy-MM-dd; page, size and date order are checked by the service.
 */
@RestController
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping(ApiPaths.DASHBOARD + "/summary")
    public DashboardSummaryResponse summary(
            @RequestParam(required = false) String semester,
            @RequestParam(required = false) Long courseId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @AuthenticationPrincipal AuthenticatedUser currentUser) {
        return dashboardService.summary(semester, courseId, from, to, currentUser);
    }

    @GetMapping(ApiPaths.DASHBOARD + "/classes")
    public PageResponse<DashboardClassResponse> classes(
            @RequestParam(required = false) String semester,
            @RequestParam(required = false) Long courseId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal AuthenticatedUser currentUser) {
        return dashboardService.classes(semester, courseId, page, size, currentUser);
    }

    @GetMapping(ApiPaths.DASHBOARD + "/security-alerts")
    public SecurityAlertsResponse securityAlerts(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @AuthenticationPrincipal AuthenticatedUser currentUser) {
        return dashboardService.securityAlerts(from, to, currentUser);
    }

    @GetMapping(ApiPaths.AUDIT + "/grade-logs")
    public PageResponse<GradeAuditLogResponse> gradeLogs(
            @RequestParam(required = false) Long classId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return dashboardService.gradeLogs(classId, from, to, page, size);
    }
}
