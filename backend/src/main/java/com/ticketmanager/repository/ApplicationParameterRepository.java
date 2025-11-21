package com.ticketmanager.repository;

import com.ticketmanager.model.ApplicationParameter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ApplicationParameterRepository extends JpaRepository<ApplicationParameter, Long> {
    Optional<ApplicationParameter> findByName(String name);
}
