package com.ticketmanager.repository;

import com.ticketmanager.model.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TeamRepository extends JpaRepository<Team, Long> {
    java.util.List<Team> findByActiveTrue();

    java.util.List<Team> findByLeader(com.ticketmanager.model.User leader);
}
