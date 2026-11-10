package com.p02.training.controller;

import com.p02.training.common.ApiPaths;
import com.p02.training.dto.request.ChangeRoleRequest;
import com.p02.training.dto.request.ChangeStatusRequest;
import com.p02.training.dto.request.CreateUserRequest;
import com.p02.training.dto.request.ResetPasswordRequest;
import com.p02.training.dto.request.UpdateUserRequest;
import com.p02.training.dto.response.PageResponse;
import com.p02.training.dto.response.UserResponse;
import com.p02.training.entity.enums.UserRole;
import com.p02.training.security.AuthenticatedUser;
import com.p02.training.service.UserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** TR01 account management. Training Admin only, enforced in SecurityConfig. */
@RestController
@RequestMapping(ApiPaths.USERS)
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public PageResponse<UserResponse> listUsers(
            @RequestParam(required = false) UserRole role,
            @RequestParam(name = "isActive", required = false) Boolean isActive,
            @RequestParam(required = false) @Size(max = 255, message = "Từ khóa tối đa 255 ký tự") String keyword,
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "page phải ≥ 0") int page,
            @RequestParam(defaultValue = "20") @Min(value = 1, message = "size phải từ 1 đến 100")
            @Max(value = 100, message = "size phải từ 1 đến 100") int size) {
        return userService.listUsers(role, isActive, keyword, page, size);
    }

    @PostMapping
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request,
            @AuthenticationPrincipal AuthenticatedUser currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.createUser(request, currentUser));
    }

    @PatchMapping("/{id}")
    public UserResponse updateUser(@PathVariable Long id, @Valid @RequestBody UpdateUserRequest request,
            @AuthenticationPrincipal AuthenticatedUser currentUser) {
        return userService.updateUser(id, request, currentUser);
    }

    @PatchMapping("/{id}/role")
    public UserResponse changeRole(@PathVariable Long id, @Valid @RequestBody ChangeRoleRequest request,
            @AuthenticationPrincipal AuthenticatedUser currentUser) {
        return userService.changeRole(id, request, currentUser);
    }

    @PatchMapping("/{id}/status")
    public UserResponse changeStatus(@PathVariable Long id, @Valid @RequestBody ChangeStatusRequest request,
            @AuthenticationPrincipal AuthenticatedUser currentUser) {
        return userService.changeStatus(id, request, currentUser);
    }

    @PatchMapping("/{id}/password")
    public ResponseEntity<Void> resetPassword(@PathVariable Long id, @Valid @RequestBody ResetPasswordRequest request,
            @AuthenticationPrincipal AuthenticatedUser currentUser) {
        userService.resetPassword(id, request, currentUser);
        return ResponseEntity.noContent().build();
    }
}
