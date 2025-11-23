package com.ticketmanager.repository;

import com.ticketmanager.model.Ticket;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class TicketSpecification {

    public static Specification<Ticket> filterTickets(Long assignedTo, Long assignedTeam, LocalDate startDate,
            LocalDate endDate, Boolean assignedToMe, Long currentUserId, com.ticketmanager.model.TicketStatus status,
            List<Long> teamIds, LocalDate statusChangedFrom) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Visibility Restriction:
            // If teamIds is provided (meaning user is restricted to these teams),
            // they can see tickets where:
            // 1. Assigned to one of their teams
            // 2. Assigned to them personally
            // 3. Created by them? (Maybe, but requirement emphasizes team)
            // Let's stick to: Assigned to Team IN teamIds OR AssignedTo == currentUserId

            if (teamIds != null && !teamIds.isEmpty()) {
                Predicate teamMatch = root.get("assignedTeam").get("id").in(teamIds);
                Predicate userMatch = criteriaBuilder.equal(root.get("assignedTo").get("id"), currentUserId);
                // Also allow if they are the creator? "in tiket list, must show only ticket
                // belonging to a team that user belongs for"
                // Usually creator should see their tickets. Let's add creator too for
                // safety/usability.
                Predicate creatorMatch = criteriaBuilder.equal(root.get("createdBy").get("id"), currentUserId);

                predicates.add(criteriaBuilder.or(teamMatch, userMatch, creatorMatch));
            }

            if (assignedToMe != null && assignedToMe) {
                predicates.add(criteriaBuilder.equal(root.get("assignedTo").get("id"), currentUserId));
            } else if (assignedTo != null) {
                predicates.add(criteriaBuilder.equal(root.get("assignedTo").get("id"), assignedTo));
            }

            if (assignedTeam != null) {
                predicates.add(criteriaBuilder.equal(root.get("assignedTeam").get("id"), assignedTeam));
            }

            if (startDate != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("createdAt"), startDate.atStartOfDay()));
            }

            if (endDate != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("createdAt"), endDate.atTime(23, 59, 59)));
            }

            if (status != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }

            if (statusChangedFrom != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("statusUpdatedAt"),
                        statusChangedFrom.atStartOfDay()));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
