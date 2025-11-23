package com.ticketmanager.service;

import com.ticketmanager.model.Team;
import com.ticketmanager.model.Ticket;
import com.ticketmanager.model.TicketAction;
import com.ticketmanager.model.TicketStatus;
import com.ticketmanager.model.User;
import com.ticketmanager.repository.TeamRepository;
import com.ticketmanager.repository.TicketActionRepository;
import com.ticketmanager.repository.TicketRepository;
import com.ticketmanager.repository.TicketSpecification;
import com.ticketmanager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class TicketService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final UserService userService;
    private final NotificationService notificationService;
    private final TicketActionRepository ticketActionRepository;
    private final EmailService emailService;

    public org.springframework.data.domain.Page<Ticket> getAllTickets(Long assignedTo, Long assignedTeam,
            LocalDate startDate, LocalDate endDate,
            Boolean assignedToMe, TicketStatus status, LocalDate statusChangedFrom,
            org.springframework.data.domain.Pageable pageable) {
        User currentUser = getCurrentUser();

        List<Long> teamIds = null;
        if (currentUser.getRole() != User.Role.ADMIN) {
            teamIds = currentUser.getTeams().stream().map(Team::getId).toList();
        }

        Specification<Ticket> spec = TicketSpecification.filterTickets(assignedTo, assignedTeam, startDate, endDate,
                assignedToMe, currentUser.getId(), status, teamIds, statusChangedFrom);
        return ticketRepository.findAll(spec, pageable);
    }

    public Ticket getTicket(Long id) {
        return ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
    }

    public Ticket createTicket(Ticket ticket) {
        User currentUser = getCurrentUser();

        // Generate Ticket Number
        String year = String.valueOf(java.time.Year.now().getValue());
        String prefix = year;
        String lastTicketNumber = ticketRepository.findTopByTicketNumberStartingWithOrderByTicketNumberDesc(prefix)
                .map(Ticket::getTicketNumber)
                .orElse(prefix + "000000");

        int sequence = Integer.parseInt(lastTicketNumber.substring(4)) + 1;
        String ticketNumber = prefix + String.format("%06d", sequence);
        ticket.setTicketNumber(ticketNumber);

        ticket.setCreatedBy(currentUser);
        ticket.setStatus(TicketStatus.OPEN);
        ticket.setStatusUpdatedAt(java.time.LocalDateTime.now());

        // Enforce Admin-only assignment during creation
        if (ticket.getAssignedTo() != null) {
            if (currentUser.getRole() != User.Role.ADMIN) {
                // If not admin, clear user assignment
                ticket.setAssignedTo(null);
            }
        }
        // Allow assignedTeam for everyone

        Ticket savedTicket = ticketRepository.save(ticket);
        logAction(savedTicket, "Ticket created", currentUser);

        // Send email if assigned to team
        if (savedTicket.getAssignedTeam() != null) {
            emailService.sendTicketAssignedToTeamEmail(savedTicket);
        }

        return savedTicket;
    }

    public Ticket updateTicket(Long id, Ticket ticketDetails) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        User currentUser = getCurrentUser();

        // Restrict editing of CLOSED tickets to Admins only
        if (ticket.getStatus() == TicketStatus.CLOSED && currentUser.getRole() != User.Role.ADMIN) {
            throw new RuntimeException("Only admins can edit closed tickets");
        }

        // Permission Check: Admin or Team Member
        boolean isTeamMember = isTeamMember(ticket, currentUser);

        if (currentUser.getRole() != User.Role.ADMIN && !isTeamMember) {
            throw new RuntimeException("You do not have permission to edit this ticket");
        }

        if (ticketDetails.getTitle() != null)
            ticket.setTitle(ticketDetails.getTitle());
        if (ticketDetails.getDescription() != null)
            ticket.setDescription(ticketDetails.getDescription());
        if (ticketDetails.getEstimatedTime() != null)
            ticket.setEstimatedTime(ticketDetails.getEstimatedTime());
        if (ticketDetails.getEstimatedFinishDate() != null)
            ticket.setEstimatedFinishDate(ticketDetails.getEstimatedFinishDate());

        Ticket savedTicket = ticketRepository.save(ticket);
        logAction(savedTicket, "Ticket details updated", currentUser);
        return savedTicket;
    }

    public Ticket addAction(Long id, String description) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        if (ticket.getStatus() != TicketStatus.IN_PROGRESS) {
            throw new RuntimeException("Actions can only be added when ticket is in progress");
        }

        User currentUser = getCurrentUser();

        boolean isTeamMember = isTeamMember(ticket, currentUser);

        if (currentUser.getRole() != User.Role.ADMIN && !isTeamMember) {
            throw new RuntimeException("You do not have permission to add actions to this ticket");
        }

        if (description == null || description.trim().isEmpty()) {
            throw new RuntimeException("Description is required");
        }

        TicketAction action = logAction(ticket, description, getCurrentUser());
        emailService.sendActionAddedEmail(ticket, action);

        return ticket;
    }

    public Ticket updateStatus(Long id, TicketStatus status) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
        TicketStatus oldStatus = ticket.getStatus();
        User currentUser = getCurrentUser();

        // Permission Check:
        // 1. Admin can do anything (except we might want to restrict some things, but
        // generally Admin is superuser)
        // 2. User can act if ticket is assigned to their team.
        // 3. Exception: If ticket is RESOLVED and User is Creator, they can change
        // status to CLOSED (Approve).

        boolean isTeamMember = isTeamMember(ticket, currentUser);

        boolean isCreator = ticket.getCreatedBy().getId().equals(currentUser.getId());

        // Check for "Approve" scenario (Creator closing resolved ticket)
        boolean isApproving = isCreator && oldStatus == TicketStatus.RESOLVED && status == TicketStatus.CLOSED;

        if (currentUser.getRole() != User.Role.ADMIN && !isTeamMember && !isApproving) {
            throw new RuntimeException("You do not have permission to update this ticket's status");
        }

        // Enforce Admin-only reopening
        if ((oldStatus == TicketStatus.RESOLVED || oldStatus == TicketStatus.CLOSED) &&
                (status == TicketStatus.OPEN || status == TicketStatus.IN_PROGRESS)) {
            if (currentUser.getRole() != User.Role.ADMIN) {
                throw new RuntimeException("Only admins can reopen tickets");
            }
        }

        // Enforce justification for PAUSED
        // ... (existing logic)

        ticket.setStatus(status);
        ticket.setStatusUpdatedAt(java.time.LocalDateTime.now());
        Ticket savedTicket = ticketRepository.save(ticket);
        logAction(savedTicket, "Status updated from " + oldStatus + " to " + status, getCurrentUser());
        return savedTicket;
    }

    public Ticket pauseTicket(Long id, String reason) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        if (ticket.getStatus() != TicketStatus.IN_PROGRESS) {
            throw new RuntimeException("Only tickets in progress can be paused");
        }

        if (reason == null || reason.trim().isEmpty()) {
            throw new RuntimeException("A justification is required to pause the ticket");
        }

        ticket.setStatus(TicketStatus.PAUSED);
        Ticket savedTicket = ticketRepository.save(ticket);
        logAction(savedTicket, "Ticket paused. Reason: " + reason, getCurrentUser());
        return savedTicket;
    }

    public Ticket assignTicket(Long id, Long userId) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
        User assignee = null;
        if (userId != null) {
            assignee = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
        }

        User currentUser = getCurrentUser();

        // Restrict assignment of CLOSED tickets to Admins only
        if (ticket.getStatus() == TicketStatus.CLOSED && currentUser.getRole() != User.Role.ADMIN) {
            throw new RuntimeException("Only admins can assign closed tickets");
        }

        if (currentUser.getRole() != User.Role.ADMIN) {
            if (userId != null && !currentUser.getId().equals(userId)) {
                // Allow user to assign to themselves ("get" the ticket)
                throw new RuntimeException("Only admins can assign tickets to others");
            }
            // If userId is null (unassign), we might want to restrict who can unassign.
            // Assuming for now that if you can edit, you can unassign?
            // Or maybe only Admin can unassign?
            // Requirement: "when a ticket is unsigned set null for assigned_to_id"
            // Let's assume Admin or the assigned user can unassign themselves?
            // For simplicity and matching typical "pick up" logic, let's allow Admin.
            // If a user wants to "release" a ticket, they are unassigning themselves.
            if (userId == null && ticket.getAssignedTo() != null
                    && !ticket.getAssignedTo().getId().equals(currentUser.getId())) {
                throw new RuntimeException("You can only unassign yourself");
            }
        }

        // If assigning to self, check estimation
        if (userId != null && currentUser.getId().equals(userId)) {
            // We can't check estimation here easily because we only have userId.
            // The estimation should be passed in.
            // We might need to update the method signature or handle it in updateTicket.
            // For now, we'll allow assignment, but frontend must prompt for estimation and
            // call updateTicket.
        }

        ticket.setAssignedTo(assignee);
        // ticket.setAssignedTeam(null); // Do NOT clear team assignment, so we can
        // unassign back to team
        Ticket savedTicket = ticketRepository.save(ticket);

        if (assignee != null) {
            logAction(savedTicket, "Assigned to user: " + assignee.getName(), currentUser);
            notificationService.createNotification(assignee, "Ticket #" + ticket.getTicketNumber() + " assigned to you",
                    ticket);
            emailService.sendTicketAssignedToUserEmail(savedTicket, assignee);
        } else {
            logAction(savedTicket, "Ticket unassigned", currentUser);
            // Enforce OPEN status when unassigned
            if (savedTicket.getStatus() != TicketStatus.OPEN) {
                savedTicket.setStatus(TicketStatus.OPEN);
                savedTicket.setStatusUpdatedAt(java.time.LocalDateTime.now());
                savedTicket = ticketRepository.save(savedTicket);
                logAction(savedTicket, "Status auto-updated to OPEN (Unassigned)", currentUser);
            }
        }

        return savedTicket;
    }

    public Ticket assignTicketToTeam(Long id, Long teamId) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found"));

        User currentUser = getCurrentUser();

        // Restrict assignment of CLOSED tickets to Admins only
        if (ticket.getStatus() == TicketStatus.CLOSED && currentUser.getRole() != User.Role.ADMIN) {
            throw new RuntimeException("Only admins can assign closed tickets");
        }

        if (currentUser.getRole() != User.Role.ADMIN) {
            // Logic: Can a regular user assign to a team? Assuming only Admin for now or
            // Team Leader?
            // Requirement says "admin can assign any ticket to anyone".
            // Let's restrict team assignment to Admin for now.
            throw new RuntimeException("Only admins can assign tickets to teams");
        }

        ticket.setAssignedTeam(team);
        ticket.setAssignedTo(null); // Clear user assignment if assigned to team
        Ticket savedTicket = ticketRepository.save(ticket);
        logAction(savedTicket, "Assigned to team: " + team.getName(), currentUser);

        // Notify all team members
        for (User member : team.getMembers()) {
            notificationService.createNotification(member,
                    "Ticket #" + ticket.getTicketNumber() + " assigned to your team " + team.getName(), ticket);
        }

        emailService.sendTicketAssignedToTeamEmail(savedTicket);

        return savedTicket;
    }

    private TicketAction logAction(Ticket ticket, String description, User actor) {
        TicketAction action = TicketAction.builder()
                .ticket(ticket)
                .description(description)
                .actor(actor)
                .build();
        return ticketActionRepository.save(action);
    }

    private User getCurrentUser() {
        OAuth2User oauth2User = (OAuth2User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String email = oauth2User.getAttribute("email");
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public void fixUnassignedTicketStatuses() {
        List<Ticket> tickets = ticketRepository.findByAssignedToIsNullAndStatusNot(TicketStatus.OPEN);
        User systemUser = userRepository.findByEmail("admin@admin.com") // Assuming an admin or system user exists, or
                                                                        // use current user if triggered via API
                .orElseThrow(() -> new RuntimeException("System user not found"));
        // Or better, use getCurrentUser() if triggered by admin

        for (Ticket ticket : tickets) {
            ticket.setStatus(TicketStatus.OPEN);
            ticket.setStatusUpdatedAt(java.time.LocalDateTime.now());
            Ticket savedTicket = ticketRepository.save(ticket);
            logAction(savedTicket, "System: Status corrected to OPEN (Unassigned)", systemUser);
        }
    }

    private boolean isTeamMember(Ticket ticket, User user) {
        if (ticket.getAssignedTeam() == null || user.getTeams() == null) {
            return false;
        }
        return user.getTeams().stream()
                .anyMatch(t -> t.getId().equals(ticket.getAssignedTeam().getId()));
    }
}
