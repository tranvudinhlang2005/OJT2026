package com.p02.training.controller;

import com.p02.training.common.ApiPaths;
import com.p02.training.dto.request.EnrollRequest;
import com.p02.training.dto.response.EnrollmentResponse;
import com.p02.training.security.AuthenticatedUser;
import com.p02.training.service.EnrollmentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** TR10 registration and TR12 cancellation. Student only (SecurityConfig). */
@RestController
@RequestMapping(ApiPaths.ENROLLMENTS)
public class EnrollmentController {

    private final EnrollmentService enrollmentService;

    public EnrollmentController(EnrollmentService enrollmentService) {
        this.enrollmentService = enrollmentService;
    }

    /** 201 with the registration. */
    @PostMapping
    public ResponseEntity<EnrollmentResponse> enroll(@Valid @RequestBody EnrollRequest request,
            @AuthenticationPrincipal AuthenticatedUser currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED).body(enrollmentService.enroll(request, currentUser));
    }

    /** 200 with the cancelled registration. */
    @PostMapping("/{id}/cancel")
    public EnrollmentResponse cancel(@PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser currentUser) {
        return enrollmentService.cancel(id, currentUser);
    }
}
