package com.p02.training.controller;

import com.p02.training.common.ApiPaths;
import com.p02.training.dto.request.ChangeStatusRequest;
import com.p02.training.dto.request.CourseRequest;
import com.p02.training.dto.response.CourseResponse;
import com.p02.training.dto.response.PageResponse;
import com.p02.training.security.AuthenticatedUser;
import com.p02.training.service.CourseService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** TR02 course management. Reads: every logged-in role. Writes: Training Admin (SecurityConfig). */
@RestController
@RequestMapping(ApiPaths.COURSES)
public class CourseController {

    private final CourseService courseService;

    public CourseController(CourseService courseService) {
        this.courseService = courseService;
    }

    @GetMapping
    public PageResponse<CourseResponse> listCourses(
            @RequestParam(required = false) @Size(max = 255, message = "Từ khóa tối đa 255 ký tự") String keyword,
            @RequestParam(name = "isActive", required = false) Boolean isActive,
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "page phải ≥ 0") int page,
            @RequestParam(defaultValue = "20") @Min(value = 1, message = "size phải từ 1 đến 100")
            @Max(value = 100, message = "size phải từ 1 đến 100") int size,
            @AuthenticationPrincipal AuthenticatedUser currentUser) {
        return courseService.listCourses(keyword, isActive, page, size, currentUser);
    }

    @GetMapping("/{id}")
    public CourseResponse getCourse(@PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser currentUser) {
        return courseService.getCourse(id, currentUser);
    }

    @PostMapping
    public ResponseEntity<CourseResponse> createCourse(@Valid @RequestBody CourseRequest request,
            @AuthenticationPrincipal AuthenticatedUser currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED).body(courseService.createCourse(request, currentUser));
    }

    @PutMapping("/{id}")
    public CourseResponse updateCourse(@PathVariable Long id, @Valid @RequestBody CourseRequest request,
            @AuthenticationPrincipal AuthenticatedUser currentUser) {
        return courseService.updateCourse(id, request, currentUser);
    }

    @PatchMapping("/{id}/status")
    public CourseResponse changeStatus(@PathVariable Long id, @Valid @RequestBody ChangeStatusRequest request,
            @AuthenticationPrincipal AuthenticatedUser currentUser) {
        return courseService.changeStatus(id, request, currentUser);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCourse(@PathVariable Long id,
            @AuthenticationPrincipal AuthenticatedUser currentUser) {
        courseService.deleteCourse(id, currentUser);
        return ResponseEntity.noContent().build();
    }
}
