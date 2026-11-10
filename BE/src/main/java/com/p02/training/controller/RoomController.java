package com.p02.training.controller;

import com.p02.training.common.ApiPaths;
import com.p02.training.dto.request.ChangeStatusRequest;
import com.p02.training.dto.request.RoomRequest;
import com.p02.training.dto.response.PageResponse;
import com.p02.training.dto.response.RoomResponse;
import com.p02.training.security.AuthenticatedUser;
import com.p02.training.service.RoomService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** TR06 room management. Training Admin only, including reads (SecurityConfig). */
@RestController
@RequestMapping(ApiPaths.ROOMS)
public class RoomController {

    private final RoomService roomService;

    public RoomController(RoomService roomService) {
        this.roomService = roomService;
    }

    @GetMapping
    public PageResponse<RoomResponse> listRooms(
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "page phải ≥ 0") int page,
            @RequestParam(defaultValue = "20") @Min(value = 1, message = "size phải từ 1 đến 100")
            @Max(value = 100, message = "size phải từ 1 đến 100") int size) {
        return roomService.listRooms(page, size);
    }

    @GetMapping("/{id}")
    public RoomResponse getRoom(@PathVariable Long id) {
        return roomService.getRoom(id);
    }

    @PostMapping
    public ResponseEntity<RoomResponse> createRoom(@Valid @RequestBody RoomRequest request,
            @AuthenticationPrincipal AuthenticatedUser currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED).body(roomService.createRoom(request, currentUser));
    }

    @PutMapping("/{id}")
    public RoomResponse updateRoom(@PathVariable Long id, @Valid @RequestBody RoomRequest request,
            @AuthenticationPrincipal AuthenticatedUser currentUser) {
        return roomService.updateRoom(id, request, currentUser);
    }

    @PatchMapping("/{id}/status")
    public RoomResponse changeStatus(@PathVariable Long id, @Valid @RequestBody ChangeStatusRequest request,
            @AuthenticationPrincipal AuthenticatedUser currentUser) {
        return roomService.changeStatus(id, request, currentUser);
    }
}
