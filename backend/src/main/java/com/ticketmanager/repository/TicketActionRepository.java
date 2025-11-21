package com.ticketmanager.repository;

import com.ticketmanager.model.TicketAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TicketActionRepository extends JpaRepository<TicketAction, Long> {
}
