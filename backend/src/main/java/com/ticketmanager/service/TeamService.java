package com.ticketmanager.service;

import com.ticketmanager.model.Team;
import com.ticketmanager.model.User;
import com.ticketmanager.repository.TeamRepository;
import com.ticketmanager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TeamService {

    private final TeamRepository teamRepository;
    private final UserRepository userRepository;

    public List<Team> getAllTeams(boolean includeInactive) {
        if (includeInactive) {
            return teamRepository.findAll();
        }
        return teamRepository.findByActiveTrue();
    }

    public Team createTeam(Team team) {
        if (team.getLeader() != null && team.getLeader().getId() != null) {
            User leader = userRepository.findById(team.getLeader().getId())
                    .orElseThrow(() -> new RuntimeException("Leader not found"));
            team.setLeader(leader);
            if (!team.getMembers().contains(leader)) {
                team.getMembers().add(leader);
            }
        }
        return teamRepository.save(team);
    }

    public Team addMember(Long teamId, Long userId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.getTeams().add(team);
        userRepository.save(user);

        return team;
    }

    public Team updateTeam(Long id, Team teamDetails) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Team not found"));

        if (teamDetails.getName() != null) {
            team.setName(teamDetails.getName());
        }
        if (teamDetails.getDescription() != null) {
            team.setDescription(teamDetails.getDescription());
        }
        if (teamDetails.getLeader() != null && teamDetails.getLeader().getId() != null) {
            User leader = userRepository.findById(teamDetails.getLeader().getId())
                    .orElseThrow(() -> new RuntimeException("Leader not found"));
            team.setLeader(leader);
            if (!team.getMembers().contains(leader)) {
                team.getMembers().add(leader);
            }
        }

        return teamRepository.save(team);
    }
}
