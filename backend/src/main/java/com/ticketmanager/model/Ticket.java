package com.ticketmanager.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.envers.Audited;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tickets")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Audited
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String ticketNumber;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.ORDINAL)
    private TicketStatus status;

    @Enumerated(EnumType.ORDINAL)
    private TicketPriority priority;

    private String estimatedTime;

    @com.fasterxml.jackson.annotation.JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate estimatedFinishDate;

    @ManyToOne
    @JoinColumn(name = "created_by_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties("team")
    private User createdBy;

    @ManyToOne
    @JoinColumn(name = "assigned_to_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties("team")
    private User assignedTo;

    @ManyToOne
    @JoinColumn(name = "assigned_team_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({ "members", "leader" })
    private Team assignedTeam;

    @OneToMany(mappedBy = "ticket", cascade = CascadeType.ALL)
    @Builder.Default
    private List<TicketAction> actions = new ArrayList<>();

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
