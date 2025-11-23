package com.ticketmanager.repository;

import com.ticketmanager.model.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long>, JpaSpecificationExecutor<Ticket> {
    java.util.Optional<Ticket> findTopByTicketNumberStartingWithOrderByTicketNumberDesc(String prefix);

    java.util.List<Ticket> findByAssignedToIsNullAndStatusNot(com.ticketmanager.model.TicketStatus status);
}
