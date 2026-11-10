package com.p02.training.controller;

import com.p02.training.common.ApiPaths;
import com.p02.training.dto.request.AssignCoursesRequest;
import com.p02.training.dto.request.ChangeStatusRequest;
import com.p02.training.dto.request.UpdateInstructorRequest;
import com.p02.training.dto.response.InstructorDetailResponse;
import com.p02.training.dto.response.InstructorSummaryResponse;
import com.p02.training.dto.response.MyInstructorProfileResponse;
import com.p02.training.dto.response.PageResponse;
import com.p02.training.security.AuthenticatedUser;
import com.p02.training.service.InstructorService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * TR03 instructor management. {@code GET /instructors/me}: Instructor. Everything else: Training
 * Admin. Both rules are in SecurityConfig. There is no create endpoint: profiles are created with
 * the account in TR01.
 */
@RestController
@RequestMapping(ApiPaths.INSTRUCTORS)
public class InstructorController {

    private final InstructorService instructorService;

    public InstructorController(InstructorService instructorService) {
        this.instructorService = instructorService;
    }

    @GetMapping
    public PageResponse<InstructorSummaryResponse> listInstructors(
            @RequestParam(required = false) @Size(max = 255, message = "Từ khóa tối đa 255 ký tự") String keyword,
            @RequestParam(name = "isActive", required = false) Boolean isActive,
            @RequestParam(required = false) Long courseId,
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "page phải ≥ 0") int page,
            @RequestParam(defaultValue = "20") @Min(value = 1, message = "size phải từ 1 đến 100")
            @Max(value = 100, message = "size phải từ 1 đến 100") int size) {
        return instructorService.listInstructors(keyword, isActive, courseId, page, size);
    }

    @GetMapping("/me")
    public MyInstructorProfileResponse getMyProfile(@AuthenticationPrincipal AuthenticatedUser currentUser) {
        return instructorService.getMyProfile(currentUser);
    }

    @GetMapping("/{id}")
    public InstructorDetailResponse getInstructor(@PathVariable Long id) {
        return instructorService.getInstructor(id);
    }

    @PutMapping("/{id}")
    public InstructorDetailResponse updateInstructor(@PathVariable Long id,
            @Valid @RequestBody UpdateInstructorRequest request,
            @AuthenticationPrincipal AuthenticatedUser currentUser) {
        return instructorService.updateInstructor(id, request, currentUser);
    }

    @PutMapping("/{id}/courses")
    public InstructorDetailResponse assignCourses(@PathVariable Long id, @Valid @RequestBody AssignCoursesRequest request,
            @AuthenticationPrincipal AuthenticatedUser currentUser) {
        return instructorService.assignCourses(id, request, currentUser);
    }

    @PatchMapping("/{id}/status")
    public InstructorDetailResponse changeStatus(@PathVariable Long id, @Valid @RequestBody ChangeStatusRequest request,
            @AuthenticationPrincipal AuthenticatedUser currentUser) {
        return instructorService.changeStatus(id, request, currentUser);
    }
}
