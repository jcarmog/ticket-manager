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

        user.setName(userDetails.getName());
        user.setRole(userDetails.getRole());
        user.setActive(userDetails.isActive());

        if (teamIds != null) {
            List<Team> teams = teamRepository.findAllById(teamIds);
            user.setTeams(new HashSet<>(teams));
        }

        return userRepository.save(user);
    }
}
