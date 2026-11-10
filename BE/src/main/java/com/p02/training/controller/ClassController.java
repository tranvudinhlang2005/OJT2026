package com.p02.training.controller;

import com.p02.training.common.ApiPaths;
import com.p02.training.dto.request.AssignInstructorRequest;
import com.p02.training.dto.request.CancelClassRequest;
import com.p02.training.dto.request.ChangeCapacityRequest;
import com.p02.training.dto.request.ClassRequest;
import com.p02.training.dto.request.SessionRequest;
import com.p02.training.dto.response.ClassResponse;
import com.p02.training.dto.response.ClassStudentResponse;
import com.p02.training.dto.response.ClassView;
import com.p02.training.dto.response.PageResponse;
import com.p02.training.dto.response.SessionResponse;
import com.p02.training.entity.enums.ClassStatus;
import com.p02.training.security.AuthenticatedUser;
import com.p02.training.service.ClassInstructorService;
import com.p02.training.service.ClassQueryService;
import com.p02.training.service.ClassRosterService;
import com.p02.training.service.ClassService;
import com.p02.training.service.SessionService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.util.List;
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

/**
 * Class endpoints: TR05 lifecycle, TR06 sessions of a class, TR07 instructor assignment, TR09 list
 * and detail, TR13 roster. Every write is Training Admin only; TR09 and reading a class's sessions
 * are open to every role, scoped by the service; the roster is Admin or Instructor. Rules are in
 * SecurityConfig.
 */
@RestController
@RequestMapping(ApiPaths.CLASSES)
public class ClassController {

    private final ClassService classService;
    private final ClassInstructorService classInstructorService;
    private final SessionService sessionService;
    private final ClassQueryService classQueryService;
    private final ClassRosterService classRosterService;

    public ClassController(ClassService classService, ClassInstructorService classInstructorService,
            SessionService sessionService, ClassQueryService classQueryService,
            ClassRosterService classRosterService) {
        this.classService = classService;
        this.classInstructorService = classInstructorService;
        this.sessionService = sessionService;
        this.classQueryService = classQueryService;
        this.classRosterService = classRosterService;
    }

    // --- TR09 -------------------------------------------------------------------------------------

    /** page, size and sort are checked by the service, which reports them with TR09's message. */
    @GetMapping
    public PageResponse<ClassView> listClasses(
            @RequestParam(required = false) @Size(max = 255, message = "Từ khóa tối đa 255 ký tự") String keyword,
            @RequestParam(required = false) Long courseId,
            @RequestParam(required = false) String semester,
            @RequestParam(required = false) ClassStatus status,
            @RequestParam(required = false) Long instructorId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sort,
            @AuthenticationPrincipal AuthenticatedUser currentUser) {
        return classQueryService.listClasses(
                new ClassQueryService.ClassFilter(keyword, courseId, semester, status, instructorId),
                page, size, sort, currentUser);
    }

    @GetMapping("/{id}")
    public ClassView getClass(@PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser currentUser) {
        return classQueryService.getClass(id, currentUser);
    }

    // --- TR13 -------------------------------------------------------------------------------------

    @GetMapping("/{id}/students")
    public PageResponse<ClassStudentResponse> listStudents(@PathVariable Long id,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "page phải ≥ 0") int page,
            @RequestParam(defaultValue = "20") @Min(value = 1, message = "size phải từ 1 đến 100")
            @Max(value = 100, message = "size phải từ 1 đến 100") int size,
            @RequestParam(required = false) String sort,
            @AuthenticationPrincipal AuthenticatedUser currentUser) {
        return classRosterService.listStudents(id, status, page, size, sort, currentUser);
    }

    // --- TR05 -------------------------------------------------------------------------------------

    @PostMapping
    public ResponseEntity<ClassResponse> createClass(@Valid @RequestBody ClassRequest request,
            @AuthenticationPrincipal AuthenticatedUser currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED).body(classService.createClass(request, currentUser));
    }

    @PutMapping("/{id}")
    public ClassResponse updateClass(@PathVariable Long id, @Valid @RequestBody ClassRequest request,
            @AuthenticationPrincipal AuthenticatedUser currentUser) {
        return classService.updateClass(id, request, currentUser);
    }

    @PatchMapping("/{id}/capacity")
    public ClassResponse changeCapacity(@PathVariable Long id, @Valid @RequestBody ChangeCapacityRequest request,
            @AuthenticationPrincipal AuthenticatedUser currentUser) {
        return classService.changeCapacity(id, request, currentUser);
    }

    @PostMapping("/{id}/publish")
    public ClassResponse publish(@PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser currentUser) {
        return classService.publish(id, currentUser);
    }

    @PostMapping("/{id}/unpublish")
    public ClassResponse unpublish(@PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser currentUser) {
        return classService.unpublish(id, currentUser);
    }

    @PostMapping("/{id}/start")
    public ClassResponse start(@PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser currentUser) {
        return classService.start(id, currentUser);
    }

    @PostMapping("/{id}/cancel")
    public ClassResponse cancel(@PathVariable Long id, @Valid @RequestBody CancelClassRequest request,
            @AuthenticationPrincipal AuthenticatedUser currentUser) {
        return classService.cancel(id, request, currentUser);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteClass(@PathVariable Long id,
            @AuthenticationPrincipal AuthenticatedUser currentUser) {
        classService.deleteClass(id, currentUser);
        return ResponseEntity.noContent().build();
    }

    // --- TR06 -------------------------------------------------------------------------------------

    @GetMapping("/{id}/sessions")
    public List<SessionResponse> listSessions(@PathVariable Long id,
            @AuthenticationPrincipal AuthenticatedUser currentUser) {
        return sessionService.listSessions(id, currentUser);
    }

    @PostMapping("/{id}/sessions")
    public ResponseEntity<SessionResponse> addSession(@PathVariable Long id, @Valid @RequestBody SessionRequest request,
            @AuthenticationPrincipal AuthenticatedUser currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED).body(sessionService.addSession(id, request, currentUser));
    }

    // --- TR07 -------------------------------------------------------------------------------------

    @PutMapping("/{id}/instructor")
    public ClassResponse assignInstructor(@PathVariable Long id, @Valid @RequestBody AssignInstructorRequest request,
            @AuthenticationPrincipal AuthenticatedUser currentUser) {
        return classInstructorService.assignInstructor(id, request, currentUser);
    }
}
