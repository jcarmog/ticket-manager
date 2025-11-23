package com.ticketmanager.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

import org.hibernate.envers.Audited;

@Entity
@Table(name = "ticket_actions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Audited
public class TicketAction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String description;

    @ManyToOne
    @JoinColumn(name = "ticket_id", nullable = false)
    @JsonIgnore
    private Ticket ticket;

    @ManyToOne
    @JoinColumn(name = "actor_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties("teams")
    private User actor;

    @CreationTimestamp
    private LocalDateTime timestamp;
}
