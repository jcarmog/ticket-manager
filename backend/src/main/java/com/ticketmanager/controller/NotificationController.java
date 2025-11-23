package com.ticketmanager.controller;

import com.ticketmanager.model.Notification;
import com.ticketmanager.model.User;
import com.ticketmanager.service.NotificationService;
import com.ticketmanager.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "Notification management APIs")
public class NotificationController {

    private final NotificationService notificationService;
    private final UserService userService;

    @GetMapping
    @Operation(summary = "Get unread notifications", description = "Retrieve unread notifications for the current user")
    public ResponseEntity<List<Notification>> getUnreadNotifications() {
        org.springframework.security.oauth2.core.user.OAuth2User oauth2User = (org.springframework.security.oauth2.core.user.OAuth2User) org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication().getPrincipal();
        String email = oauth2User.getAttribute("email");
        User currentUser = userService.getCurrentUser(email);
        return ResponseEntity.ok(notificationService.getUnreadNotifications(currentUser));
    }

    @PutMapping("/{id}/read")
    @Operation(summary = "Mark notification as read", description = "Mark a specific notification as read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok().build();
    }
}
