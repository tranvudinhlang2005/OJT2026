package com.p02.training.controller;

import com.p02.training.common.ApiPaths;
import com.p02.training.dto.request.SessionRequest;
import com.p02.training.dto.response.SessionResponse;
import com.p02.training.security.AuthenticatedUser;
import com.p02.training.service.SessionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** TR06 edit and delete of a single session. Training Admin only (SecurityConfig). */
@RestController
@RequestMapping(ApiPaths.SESSIONS)
public class SessionController {

    private final SessionService sessionService;

    public SessionController(SessionService sessionService) {
        this.sessionService = sessionService;
    }

    @PutMapping("/{id}")
    public SessionResponse updateSession(@PathVariable Long id, @Valid @RequestBody SessionRequest request,
            @AuthenticationPrincipal AuthenticatedUser currentUser) {
        return sessionService.updateSession(id, request, currentUser);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSession(@PathVariable Long id,
            @AuthenticationPrincipal AuthenticatedUser currentUser) {
        sessionService.deleteSession(id, currentUser);
        return ResponseEntity.noContent().build();
    }
}
