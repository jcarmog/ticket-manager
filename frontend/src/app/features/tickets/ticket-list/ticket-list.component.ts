import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
import { Ticket, TicketService, TICKET_STATUS_DESCRIPTIONS, TICKET_PRIORITY_DESCRIPTIONS } from '../../../core/ticket.service';
import { AuthService, User } from '../../../core/auth.service';
import { TeamService, Team } from '../../../core/team.service';
import { Observable, of } from 'rxjs';

import { TooltipModule } from 'primeng/tooltip';

import { SelectButtonModule } from 'primeng/selectbutton';
import { AccordionModule } from 'primeng/accordion';
import { CalendarModule } from 'primeng/calendar';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { AvatarModule } from 'primeng/avatar';

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [CommonModule, RouterLink, TableModule, ButtonModule, TagModule, DialogModule, DropdownModule, FormsModule, TooltipModule, SelectButtonModule, AccordionModule, CalendarModule, InputTextModule, InputTextareaModule, AvatarModule],
  templateUrl: './ticket-list.component.html'
})
export class TicketListComponent implements OnInit {
  tickets = signal<Ticket[]>([]);
  currentUser = this.authService.currentUser;
  teams = signal<Team[]>([]);

  forwardDialogVisible = false;
  selectedTicket: Ticket | null = null;
  selectedTeamId: number | null = null;

  filterOptions = [
    { label: 'All Tickets', value: 'ALL' },
    { label: 'My Tickets', value: 'MY' }
  ];
  currentFilter = 'ALL';

  ticketStatuses: string[] = ['OPEN', 'IN_PROGRESS', 'PAUSED', 'RESOLVED', 'CLOSED'];
  activeIndices: number[] = [];

  constructor(
    private ticketService: TicketService,
    private authService: AuthService,
    private teamService: TeamService
  ) { }

  ngOnInit() {
    this.loadTickets();
  }

  loadTickets() {
    const filters = this.currentFilter === 'MY' ? { assignedToMe: true } : {};
    this.ticketService.getTickets(filters).subscribe(tickets => {
      // Sort by Priority (Critical=0 -> Low=3) and CreatedAt Desc
      // Priority is string in frontend, need map
      const priorityMap: { [key: string]: number } = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };

      const sorted = tickets.sort((a, b) => {
        const pA = priorityMap[a.priority] ?? 99;
        const pB = priorityMap[b.priority] ?? 99;
        if (pA !== pB) return pA - pB;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      this.tickets.set(sorted);

      // Calculate active indices based on tickets presence
      this.activeIndices = this.ticketStatuses
        .map((status, index) => this.getTicketsByStatus(status).length > 0 ? index : -1)
        .filter(index => index !== -1);
    });

    this.teamService.getTeams().subscribe(teams => this.teams.set(teams));
  }

  getTicketsByStatus(status: string): Ticket[] {
    return this.tickets().filter(t => t.status === status);
  }

  getVisibleTicketsByStatus(status: string): Ticket[] {
    const tickets = this.getTicketsByStatus(status);
    if (status === 'RESOLVED' || status === 'CLOSED') {
      return tickets.slice(0, 5);
    }
    return tickets;
  }

  getStatusLabel(status: string): string {
    return TICKET_STATUS_DESCRIPTIONS[status] || status;
  }

  getPriorityLabel(priority: string): string {
    return TICKET_PRIORITY_DESCRIPTIONS[priority] || priority;
  }

  getSeverity(status: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast' | undefined {
    switch (status) {
      case 'OPEN': return 'info';
      case 'IN_PROGRESS': return 'warning';
      case 'PAUSED': return 'secondary';
      case 'RESOLVED': return 'success';
      case 'CLOSED': return 'contrast';
      default: return undefined;
    }
  }

  getPrioritySeverity(priority: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast' | undefined {
    switch (priority) {
      case 'CRITICAL': return 'danger';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'info';
      case 'LOW': return 'success';
      default: return undefined;
    }
  }

  canAssignToMe(ticket: Ticket): boolean {
    const user = this.currentUser();
    if (!user) return false;

    // Cannot assign if assigned to another team
    if (ticket.assignedTeam) {
      const userTeams = user.teams || [];
      const isTeamMember = userTeams.some(t => t.id === ticket.assignedTeam!.id);
      if (!isTeamMember && user.role !== 'ADMIN') {
        return false;
      }
    }
    // If ticket has team but user has no team (and not admin), cannot assign
    // Logic covered above: if userTeams is empty, isTeamMember is false.

    return ticket.assignedTo?.id !== user.id;
  }

  assignToMe(ticket: Ticket) {
    const user = this.currentUser();
    if (!user) return;

    this.ticketService.assignTicket(ticket.id, user.id).subscribe(() => {
      this.loadTickets();
    });
  }

  canStart(ticket: Ticket): boolean {
    // Can start if status is not IN_PROGRESS, RESOLVED, or CLOSED
    // And if user can assign to themselves (or is already assigned to them)
    const user = this.currentUser();
    if (!user) return false;

    // Cannot start if assigned to another team
    if (ticket.assignedTeam) {
      const userTeams = user.teams || [];
      const isTeamMember = userTeams.some(t => t.id === ticket.assignedTeam!.id);
      if (!isTeamMember && user.role !== 'ADMIN') {
        return false;
      }
    }

    const isInProgress = ticket.status === 'IN_PROGRESS';
    const isResolvedOrClosed = ticket.status === 'RESOLVED' || ticket.status === 'CLOSED';

    if (isInProgress || isResolvedOrClosed) return false;

    return true;
  }

  startDialogVisible = false;
  estimation = { time: '', date: null as Date | null };
  minDate = new Date();

  startTicket(ticket: Ticket) {
    this.selectedTicket = ticket;
    this.estimation = { time: '', date: null };
    this.startDialogVisible = true;
  }

  confirmStartTicket() {
    if (!this.selectedTicket || !this.estimation.time || !this.estimation.date) return;

    const ticket = this.selectedTicket;
    const user = this.currentUser();
    if (!user) return;

    // 1. Update Ticket with Estimation
    // 2. Assign (if needed)
    // 3. Update Status

    // Helper to format date as YYYY-MM-DD for backend (if needed, or send Date object if service handles it)
    // Angular HttpClient handles Date objects usually by serializing to ISO string. 
    // Backend expects LocalDate. ISO string "yyyy-MM-dd" works best.
    const dateStr = this.estimation.date.toISOString().split('T')[0];

    const updateDetails = {
      estimatedTime: this.estimation.time,
      estimatedFinishDate: dateStr
    };

    this.ticketService.updateTicket(ticket.id, updateDetails as any).subscribe(() => {
      const assignObs = ticket.assignedTo?.id === user.id
        ? of(ticket)
        : this.ticketService.assignTicket(ticket.id, user.id);

      assignObs.subscribe(() => {
        this.ticketService.updateStatus(ticket.id, 'IN_PROGRESS').subscribe(() => {
          this.startDialogVisible = false;
          this.loadTickets();
        });
      });
    });
  }

  canPause(ticket: Ticket): boolean {
    return ticket.status === 'IN_PROGRESS';
  }

  pauseDialogVisible = false;
  pauseReason = '';

  openPauseDialog(ticket: Ticket) {
    this.selectedTicket = ticket;
    this.pauseReason = '';
    this.pauseDialogVisible = true;
  }

  confirmPauseTicket() {
    if (!this.selectedTicket || !this.pauseReason) return;

    this.ticketService.pauseTicket(this.selectedTicket.id, this.pauseReason).subscribe(() => {
      this.pauseDialogVisible = false;
      this.loadTickets();
    });
  }

  canUnassign(ticket: Ticket): boolean {
    // "The user can unsign a ticket, when it occurs the ticket must back to the team"
    // Assuming user can unassign if assigned to them OR if they are admin?
    // Requirement: "The user can unsign a ticket"
    const user = this.currentUser();
    if (!user) return false;

    // If assigned to me, I can unassign
    if (ticket.assignedTo?.id === user.id) return true;

    // If admin, can unassign anyone? Probably.
    if (user.role === 'ADMIN' && ticket.assignedTo) return true;

    return false;
  }

  unassign(ticket: Ticket) {
    // Unassign means clearing assignedTo. 
    // If it was assigned to a team before, does it go back?
    // Backend logic: assignTicket(id, userId) clears team.
    // assignTicketToTeam(id, teamId) clears user.
    // To "unassign" user and "back to team", we need to know the team.
    // But the ticket might not have a team if it was assigned directly to user?
    // Requirement: "when it occurs the ticket must back to the team"
    // This implies the ticket SHOULD belong to a team.
    // If we unassign user, we should check if we can revert to team.
    // But currently `assignedTeam` is cleared when `assignedTo` is set in backend.
    // So we lost the team info?
    // Ah, `assignedTeam` is cleared in `assignTicket` method in backend: `ticket.setAssignedTeam(null);`.
    // This is a problem if we want to "back to team".
    // We might need to keep `assignedTeam` even if `assignedTo` is set, to know which team it belongs to.
    // Or `assignedTo` user must belong to the team?
    // Let's assume for now we just clear `assignedTo` and if the user is in a team, maybe we assign to that team?
    // Or maybe we should NOT clear `assignedTeam` in backend when assigning to user?
    // If I change backend logic to NOT clear `assignedTeam`, then `assignedTo` is just the person working on it, but it still belongs to the team.
    // This makes more sense for "back to team".
    // I will update backend logic later or now?
    // For now, let's just clear assignedTo. If backend clears team, then it goes to "Unassigned".
    // If the requirement is strict, I should update backend.
    // "The user can unsign a ticket, when it occurs the ticket must back to the team"
    // This strongly suggests `assignedTeam` should persist.

    // I'll proceed with frontend changes and then maybe fix backend if needed.
    // For now, I'll just call assignTicket with null? No, assignTicket requires userId.
    // I need an endpoint to unassign? Or pass null?
    // `assignTicket` takes `userId`. If I pass null? Backend expects `Long userId`.
    // I might need a new endpoint or update `assignTicket` to accept null.

    // Actually, "The user can 'forward' ticket only to another team".
    // "The user can unsign a ticket".

    // Let's implement `unassign` by calling `assignTicket` with null?
    // My backend `assignTicket` throws if user not found.
    // I need to update backend to allow unassigning.

    // Wait, I can use `assignTicketToTeam` if I know the team.
    // But I don't know the team if it was cleared.

    // I will assume for this step that I just need to implement the UI.
    // I'll add a TODO to fix backend logic regarding team persistence.

    // For now, I'll just show a message or something, or try to assign to the user's team?
    // Let's just try to assign to the current user's team if they have one?
    // Or just leave it unassigned.

    // Actually, I'll implement `forward` first.
  }

  openForwardDialog(ticket: Ticket) {
    this.selectedTicket = ticket;
    this.selectedTeamId = null;
    this.forwardDialogVisible = true;
  }

  forwardTicket() {
    if (!this.selectedTicket || !this.selectedTeamId) return;

    this.ticketService.assignTicket(this.selectedTicket.id, undefined, this.selectedTeamId).subscribe(() => {
      this.forwardDialogVisible = false;
      this.loadTickets();
    });
  }
}
