package com.p02.training.controller;

import com.p02.training.common.ApiPaths;
import com.p02.training.dto.request.ReasonRequest;
import com.p02.training.dto.request.UpdateResultsRequest;
import com.p02.training.dto.response.ClassResponse;
import com.p02.training.dto.response.ClassResultsResponse;
import com.p02.training.security.AuthenticatedUser;
import com.p02.training.service.ResultConfirmationService;
import com.p02.training.service.ResultService;
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
 * TR15 results and TR16 confirmation and completion. View: Admin or Instructor; save and submit:
 * Instructor; return, confirm and complete: Admin (SecurityConfig). The service then limits an
 * instructor to their assigned classes.
 */
@RestController
@RequestMapping(ApiPaths.CLASSES)
public class ResultController {

    private final ResultService resultService;
    private final ResultConfirmationService confirmationService;

    public ResultController(ResultService resultService, ResultConfirmationService confirmationService) {
        this.resultService = resultService;
        this.confirmationService = confirmationService;
    }

    // --- TR15 -------------------------------------------------------------------------------------

    @GetMapping("/{id}/results")
    public ClassResultsResponse getResults(@PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser currentUser) {
        return resultService.getResults(id, currentUser);
    }

    @PutMapping("/{id}/results")
    public ClassResultsResponse updateResults(@PathVariable Long id, @Valid @RequestBody UpdateResultsRequest request,
            @AuthenticationPrincipal AuthenticatedUser currentUser) {
        return resultService.updateResults(id, request, currentUser);
    }

    @PostMapping("/{id}/results/submit")
    public ClassResultsResponse submit(@PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser currentUser) {
        return resultService.submit(id, currentUser);
    }

    // --- TR16 -------------------------------------------------------------------------------------

    @PostMapping("/{id}/results/return")
    public ClassResponse returnResults(@PathVariable Long id, @Valid @RequestBody ReasonRequest request,
            @AuthenticationPrincipal AuthenticatedUser currentUser) {
        return confirmationService.returnResults(id, request, currentUser);
    }

    @PostMapping("/{id}/results/confirm")
    public ClassResponse confirm(@PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser currentUser) {
        return confirmationService.confirm(id, currentUser);
    }

    @PostMapping("/{id}/complete")
    public ClassResponse complete(@PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser currentUser) {
        return confirmationService.complete(id, currentUser);
    }
}
