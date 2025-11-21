package com.ticketmanager.repository;

import com.ticketmanager.model.Ticket;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class TicketSpecification {

    public static Specification<Ticket> filterTickets(Long assignedTo, Long assignedTeam, LocalDate startDate,
            LocalDate endDate, Boolean assignedToMe, Long currentUserId) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

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

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
