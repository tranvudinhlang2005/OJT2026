package com.p02.training.controller;

import com.p02.training.common.ApiPaths;
import com.p02.training.dto.request.ChangeStudentStatusRequest;
import com.p02.training.dto.request.UpdateStudentRequest;
import com.p02.training.dto.response.EnrollmentResponse;
import com.p02.training.dto.response.MyResultResponse;
import com.p02.training.dto.response.MyStudentProfileResponse;
import com.p02.training.dto.response.PageResponse;
import com.p02.training.dto.response.StudentResponse;
import com.p02.training.entity.enums.EnrollmentStatus;
import com.p02.training.entity.enums.StudentStatus;
import com.p02.training.security.AuthenticatedUser;
import com.p02.training.service.EnrollmentService;
import com.p02.training.service.ResultService;
import com.p02.training.service.StudentService;
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
 * TR04 student management, plus TR10 "my enrollments" and TR15 "my results". {@code GET
 * /students/me}, {@code /students/me/enrollments} and {@code /students/me/results}: Student. Everything else: Training Admin (a
 * student calling /students/{id} gets 403). Both rules are in SecurityConfig. There is no create
 * endpoint: profiles are created with the account in TR01.
 */
@RestController
@RequestMapping(ApiPaths.STUDENTS)
public class StudentController {

    private final StudentService studentService;
    private final EnrollmentService enrollmentService;
    private final ResultService resultService;

    public StudentController(StudentService studentService, EnrollmentService enrollmentService,
            ResultService resultService) {
        this.studentService = studentService;
        this.enrollmentService = enrollmentService;
        this.resultService = resultService;
    }

    @GetMapping
    public PageResponse<StudentResponse> listStudents(
            @RequestParam(required = false) @Size(max = 255, message = "Từ khóa tối đa 255 ký tự") String keyword,
            @RequestParam(required = false) StudentStatus status,
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "page phải ≥ 0") int page,
            @RequestParam(defaultValue = "20") @Min(value = 1, message = "size phải từ 1 đến 100")
            @Max(value = 100, message = "size phải từ 1 đến 100") int size) {
        return studentService.listStudents(keyword, status, page, size);
    }

    @GetMapping("/me")
    public MyStudentProfileResponse getMyProfile(@AuthenticationPrincipal AuthenticatedUser currentUser) {
        return studentService.getMyProfile(currentUser);
    }

    /** TR10 "Lớp của tôi": the logged-in student's own enrollments, optionally of one status. */
    @GetMapping("/me/enrollments")
    public PageResponse<EnrollmentResponse> myEnrollments(
            @RequestParam(required = false) EnrollmentStatus status,
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "page phải ≥ 0") int page,
            @RequestParam(defaultValue = "20") @Min(value = 1, message = "size phải từ 1 đến 100")
            @Max(value = 100, message = "size phải từ 1 đến 100") int size,
            @AuthenticationPrincipal AuthenticatedUser currentUser) {
        return enrollmentService.myEnrollments(currentUser, status, page, size);
    }

    /** TR15: the logged-in student's own results, only for classes whose results are CONFIRMED (D20). */
    @GetMapping("/me/results")
    public PageResponse<MyResultResponse> myResults(
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "page phải ≥ 0") int page,
            @RequestParam(defaultValue = "20") @Min(value = 1, message = "size phải từ 1 đến 100")
            @Max(value = 100, message = "size phải từ 1 đến 100") int size,
            @AuthenticationPrincipal AuthenticatedUser currentUser) {
        return resultService.myResults(currentUser, page, size);
    }

    @GetMapping("/{id}")
    public StudentResponse getStudent(@PathVariable Long id) {
        return studentService.getStudent(id);
    }

    @PutMapping("/{id}")
    public StudentResponse updateStudent(@PathVariable Long id, @Valid @RequestBody UpdateStudentRequest request,
            @AuthenticationPrincipal AuthenticatedUser currentUser) {
        return studentService.updateStudent(id, request, currentUser);
    }

    @PatchMapping("/{id}/status")
    public StudentResponse changeStatus(@PathVariable Long id, @Valid @RequestBody ChangeStudentStatusRequest request,
            @AuthenticationPrincipal AuthenticatedUser currentUser) {
        return studentService.changeStatus(id, request, currentUser);
    }
}
