package com.p02.training.controller;

import com.p02.training.common.ApiPaths;
import com.p02.training.dto.response.ScheduleItemResponse;
import com.p02.training.security.AuthenticatedUser;
import com.p02.training.service.ScheduleService;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** TR17 personal schedule. Student or Instructor only (SecurityConfig); there is no id parameter. */
@RestController
public class ScheduleController {

    private final ScheduleService scheduleService;

    public ScheduleController(ScheduleService scheduleService) {
        this.scheduleService = scheduleService;
    }

    @GetMapping(ApiPaths.MY_SCHEDULE)
    public List<ScheduleItemResponse> mySchedule(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @AuthenticationPrincipal AuthenticatedUser currentUser) {
        return scheduleService.mySchedule(from, to, currentUser);
    }
}
