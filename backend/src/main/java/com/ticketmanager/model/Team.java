package com.ticketmanager.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.util.ArrayList;
import java.util.List;
import org.hibernate.envers.Audited;

@Data
@Entity
@Table(name = "teams")
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Audited
public class Team {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @OneToOne
    @JoinColumn(name = "leader_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties("team")
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private User leader;

    @ManyToMany(mappedBy = "teams")
    @Builder.Default
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties("teams")
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private List<User> members = new ArrayList<>();
}
