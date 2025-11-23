package com.ticketmanager.controller;

import com.ticketmanager.model.Ticket;
import com.ticketmanager.model.TicketStatus;
import com.ticketmanager.service.TicketService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springdoc.core.annotations.ParameterObject;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
@Tag(name = "Tickets", description = "Ticket management endpoints")
public class TicketController {

    private final TicketService ticketService;

    @GetMapping
    @Operation(summary = "Get all tickets", description = "Retrieve a list of tickets with optional filters")
    public ResponseEntity<Page<Ticket>> getAllTickets(
            @RequestParam(required = false) Long assignedTo,
            @RequestParam(required = false) Long assignedTeam,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(required = false) Boolean assignedToMe,
            @RequestParam(required = false) TicketStatus status,
            @RequestParam(required = false) LocalDate statusChangedFrom,
            @ParameterObject Pageable pageable) {
        return ResponseEntity.ok(ticketService.getAllTickets(assignedTo, assignedTeam, startDate, endDate, assignedToMe,
                status, statusChangedFrom, pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get ticket by ID", description = "Retrieve a ticket by its ID")
    public Ticket getTicket(@PathVariable Long id) {
        return ticketService.getTicket(id);
    }

    @PostMapping
    @Operation(summary = "Create ticket", description = "Create a new ticket")
    public Ticket createTicket(@RequestBody Ticket ticket) {
        return ticketService.createTicket(ticket);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update ticket", description = "Update an existing ticket")
    public Ticket updateTicket(@PathVariable Long id, @RequestBody Ticket ticket) {
        return ticketService.updateTicket(id, ticket);
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update ticket status", description = "Update the status of a ticket")
    public Ticket updateStatus(@PathVariable Long id, @RequestParam TicketStatus status) {
        return ticketService.updateStatus(id, status);
    }

    @PatchMapping("/{id}/assign")
    @Operation(summary = "Assign ticket", description = "Assign a ticket to a user or a team")
    public Ticket assignTicket(@PathVariable Long id, @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Long teamId) {
        if (teamId != null) {
            return ticketService.assignTicketToTeam(id, teamId);
        } else {
            // If userId is null, it means unassign
            return ticketService.assignTicket(id, userId);
        }
    }

    @PutMapping("/{id}/pause")
    public ResponseEntity<Ticket> pauseTicket(@PathVariable Long id,
            @RequestBody com.ticketmanager.dto.PauseTicketRequest request) {
        return ResponseEntity.ok(ticketService.pauseTicket(id, request.getReason()));
    }

    @PostMapping("/{id}/actions")
    public ResponseEntity<Ticket> addAction(@PathVariable Long id,
            @RequestBody com.ticketmanager.dto.AddActionRequest request) {
        return ResponseEntity.ok(ticketService.addAction(id, request.getDescription()));
    }

    @PostMapping("/fix-unassigned-status")
    @Operation(summary = "Fix unassigned ticket statuses", description = "Fixes tickets that are unassigned but not in OPEN status")
    public ResponseEntity<Void> fixUnassignedTicketStatuses() {
        ticketService.fixUnassignedTicketStatuses();
        return ResponseEntity.ok().build();
    }
}
