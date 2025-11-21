package com.ticketmanager.controller;

import com.ticketmanager.model.User;
import com.ticketmanager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User management endpoints")
public class UserController {

    private final com.ticketmanager.service.UserService userService;

    @GetMapping
    @Operation(summary = "Get all users", description = "Retrieve a list of all users")
    public java.util.List<User> getAllUsers(
            @org.springframework.web.bind.annotation.RequestParam(required = false, defaultValue = "false") boolean includeInactive) {
        return userService.getAllUsers(includeInactive);
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user", description = "Retrieve the currently authenticated user")
    public User getCurrentUser(@AuthenticationPrincipal OAuth2User principal) {
        if (principal == null) {
            throw new RuntimeException("Not authenticated");
        }
        String email = principal.getAttribute("email");
        return userService.getCurrentUser(email);
    }

    @org.springframework.web.bind.annotation.PutMapping("/{id}")
    @Operation(summary = "Update user", description = "Update user details and team assignments")
    public User updateUser(@org.springframework.web.bind.annotation.PathVariable Long id,
            @org.springframework.web.bind.annotation.RequestBody UpdateUserRequest request) {
        return userService.updateUser(id, request.getUser(), request.getTeamIds());
    }

    @lombok.Data
    static class UpdateUserRequest {
        private User user;
        private java.util.List<Long> teamIds;
    }
}
