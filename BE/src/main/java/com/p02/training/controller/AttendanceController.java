package com.p02.training.controller;

import com.p02.training.common.ApiPaths;
import com.p02.training.dto.request.ReasonRequest;
import com.p02.training.dto.request.UpdateAttendanceRequest;
import com.p02.training.dto.response.AttendanceSheetResponse;
import com.p02.training.security.AuthenticatedUser;
import com.p02.training.service.AttendanceService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * TR14 attendance. View: Admin or Instructor; save and lock: Instructor; unlock: Admin
 * (SecurityConfig). The service then limits an instructor to their assigned classes.
 */
@RestController
@RequestMapping(ApiPaths.SESSIONS)
public class AttendanceController {

    private final AttendanceService attendanceService;

    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @GetMapping("/{id}/attendance")
    public AttendanceSheetResponse getAttendance(@PathVariable Long id,
            @AuthenticationPrincipal AuthenticatedUser currentUser) {
        return attendanceService.getAttendance(id, currentUser);
    }

    @PutMapping("/{id}/attendance")
    public AttendanceSheetResponse updateAttendance(@PathVariable Long id,
            @Valid @RequestBody UpdateAttendanceRequest request,
            @AuthenticationPrincipal AuthenticatedUser currentUser) {
        return attendanceService.updateAttendance(id, request, currentUser);
    }

    @PostMapping("/{id}/lock")
    public AttendanceSheetResponse lockSession(@PathVariable Long id,
            @AuthenticationPrincipal AuthenticatedUser currentUser) {
        return attendanceService.lockSession(id, currentUser);
    }

    @PostMapping("/{id}/unlock")
    public AttendanceSheetResponse unlockSession(@PathVariable Long id, @Valid @RequestBody ReasonRequest request,
            @AuthenticationPrincipal AuthenticatedUser currentUser) {
        return attendanceService.unlockSession(id, request, currentUser);
    }
}
