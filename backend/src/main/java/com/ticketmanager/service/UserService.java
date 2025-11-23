package com.ticketmanager.service;

import com.ticketmanager.model.Team;
import com.ticketmanager.model.User;
import com.ticketmanager.repository.TeamRepository;
import com.ticketmanager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final TeamRepository teamRepository;

    public List<User> getAllUsers(boolean includeInactive) {
        if (includeInactive) {
            return userRepository.findAll();
        }
        return userRepository.findByActiveTrue();
    }

    public User getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Include teams where user is leader
        List<Team> ledTeams = teamRepository.findByLeader(user);
        user.getTeams().addAll(ledTeams);

        return user;
    }

    @Transactional
    public User updateUser(Long id, User userDetails, List<Long> teamIds) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Only update fields that are not null
        if (userDetails.getName() != null) {
            user.setName(userDetails.getName());
        }
        if (userDetails.getRole() != null) {
            user.setRole(userDetails.getRole());
        }
        // Handle active field separately since it's a primitive boolean
        user.setActive(userDetails.isActive());

        // Update preferred language if provided
        if (userDetails.getPreferredLanguage() != null) {
            user.setPreferredLanguage(userDetails.getPreferredLanguage());
        }

        if (teamIds != null) {
            List<Team> teams = teamRepository.findAllById(teamIds);
            user.setTeams(new HashSet<>(teams));
        }

        return userRepository.save(user);
    }
}
