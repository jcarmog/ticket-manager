package com.ticketmanager.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.envers.Audited;

@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Audited
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String name;

    private String avatarUrl;

    @Enumerated(EnumType.STRING)
    private Role role;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "user_teams", joinColumns = @JoinColumn(name = "user_id"), inverseJoinColumns = @JoinColumn(name = "team_id"))
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({ "members", "leader" })
    @Builder.Default
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private java.util.Set<Team> teams = new java.util.HashSet<>();

    @Getter
    public enum Role {
        ADMIN("Administrator"),
        USER("User");

        private final String description;

        Role(String description) {
            this.description = description;
        }
    }
}
