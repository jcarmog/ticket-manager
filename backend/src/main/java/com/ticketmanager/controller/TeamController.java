package com.ticketmanager.controller;

import com.ticketmanager.model.Team;
import com.ticketmanager.service.TeamService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/teams")
@RequiredArgsConstructor
@Tag(name = "Teams", description = "Team management endpoints")
public class TeamController {

    private final TeamService teamService;

    @GetMapping
    @Operation(summary = "Get all teams", description = "Retrieve a list of all teams")
    public List<Team> getAllTeams(@RequestParam(required = false, defaultValue = "false") boolean includeInactive) {
        return teamService.getAllTeams(includeInactive);
    }

    @PostMapping
    @Operation(summary = "Create team", description = "Create a new team")
    public Team createTeam(@RequestBody Team team) {
        return teamService.createTeam(team);
    }

    @PatchMapping("/{id}/members")
    @Operation(summary = "Add member to team", description = "Add a user to a team")
    public Team addMember(@PathVariable Long id, @RequestParam Long userId) {
        return teamService.addMember(id, userId);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update team", description = "Update an existing team")
    public Team updateTeam(@PathVariable Long id, @RequestBody Team team) {
        return teamService.updateTeam(id, team);
    }
}
