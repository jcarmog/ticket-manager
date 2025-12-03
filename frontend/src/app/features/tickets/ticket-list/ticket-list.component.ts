import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
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
import { InputTextarea } from 'primeng/inputtextarea';
import { AvatarModule } from 'primeng/avatar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [CommonModule, RouterLink, TableModule, ButtonModule, TagModule, DialogModule, DropdownModule, FormsModule, TooltipModule, SelectButtonModule, AccordionModule, CalendarModule, InputTextModule, InputTextarea, AvatarModule, TranslateModule, MenuModule],
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

  // State per status
  ticketsByStatus: { [key: string]: Ticket[] } = {};
  totalRecordsByStatus: { [key: string]: number } = {};
  loadingByStatus: { [key: string]: boolean } = {};

  startDialogVisible = false;
  estimation = { time: '', date: null as Date | null };
  minDate = new Date();

  pauseDialogVisible = false;
  pauseReason = '';

  constructor(
    private ticketService: TicketService,
    private authService: AuthService,
    private teamService: TeamService,
    private translate: TranslateService
  ) {
    // Initialize state for each status
    this.ticketStatuses.forEach(status => {
      this.ticketsByStatus[status] = [];
      this.totalRecordsByStatus[status] = 0;
      this.loadingByStatus[status] = false;
    });
  }

  ngOnInit() {
    // Load teams based on user role
    if (this.isAdmin()) {
      // Admin sees all teams
      this.teamService.getTeams().subscribe(teams => this.teams.set(teams));
    } else {
      // Non-admin sees only their teams
      const user = this.currentUser();
      if (user && user.teams) {
        this.teams.set(user.teams as Team[]);
      }
    }

    this.translate.get(['TICKET_LIST.FILTER_ALL', 'TICKET_LIST.FILTER_MY']).subscribe(translations => {
      this.filterOptions = [
        { label: translations['TICKET_LIST.FILTER_ALL'], value: 'ALL' },
        { label: translations['TICKET_LIST.FILTER_MY'], value: 'MY' }
      ];
    });

    this.initializeTicketCounts();
  }

  // Helper to check admin role
  isAdmin(): boolean {
    return this.currentUser()?.role === 'ADMIN';
  }

  // Show team filter if admin OR if user belongs to more than one team
  shouldShowTeamFilter(): boolean {
    if (this.isAdmin()) {
      return true;
    }
    const user = this.currentUser();
    return (user?.teams?.length || 0) > 1;
  }

  initializeTicketCounts() {
    this.activeIndices = []; // Start with all collapsed
    this.ticketStatuses.forEach((status, index) => {
      // Reset tickets for this status when filters change
      this.ticketsByStatus[status] = [];
      this.loadingByStatus[status] = true;
      const filters: any = { status: status };
      if (this.currentFilter === 'MY') {
        filters.assignedToMe = true;
      }
      // Admin team filter
      if (this.isAdmin() && this.selectedTeamId) {
        filters.assignedTeam = this.selectedTeamId;
      }
      console.log('Filters for status', status, filters);
      if (status === 'RESOLVED' || status === 'CLOSED') {
        filters.statusChangedFrom = new Date().toISOString().split('T')[0];
      }

      // Fetch just 1 record to get the total count
      this.ticketService.getTickets(0, 1, filters, 'createdAt,desc').subscribe(pageData => {
        this.totalRecordsByStatus[status] = pageData.totalElements;
        this.loadingByStatus[status] = false;

        // If there are tickets, expand the tab
        if (pageData.totalElements > 0) {
          this.activeIndices = [...this.activeIndices, index];
          this.activeIndices.sort((a, b) => a - b);
        }
      });
    });
  }

  // Load tickets for a given status and pagination
  loadTicketsForStatus(status: string, page: number, size: number): void {
    this.loadingByStatus[status] = true;
    const filters: any = { status };
    if (this.currentFilter === 'MY') {
      filters.assignedToMe = true;
    }
    if (this.isAdmin() && this.selectedTeamId) {
      filters.assignedTeam = this.selectedTeamId;
    }
    if (status === 'RESOLVED' || status === 'CLOSED') {
      filters.statusChangedFrom = new Date().toISOString().split('T')[0];
    }
    const sort = 'createdAt,desc';
    this.ticketService.getTickets(page, size, filters, sort).subscribe(pageData => {
      this.ticketsByStatus[status] = pageData.content;
      this.totalRecordsByStatus[status] = pageData.totalElements;
      this.loadingByStatus[status] = false;
    });
  }

  // General loadTickets method handling initial load and pagination events
  loadTickets(event?: any, status?: string): void {
    // If called without args (e.g., after filter change), reload counts and first page for each status
    if (!event && !status) {
      this.initializeTicketCounts();
      this.ticketStatuses.forEach(s => this.loadTicketsForStatus(s, 0, 10));
      return;
    }
    // When pagination event occurs for a specific status tab
    if (event && status) {
      const page = event.first / event.rows;
      const size = event.rows;
      this.loadTicketsForStatus(status, page, size);
    }
  }

  getTicketsByStatus(status: string): Ticket[] {
    return this.ticketsByStatus[status] || [];
  }

  getStatusLabel(status: string): string {
    return TICKET_STATUS_DESCRIPTIONS[status] || status;
  }

  getPriorityLabel(priority: string): string {
    return TICKET_PRIORITY_DESCRIPTIONS[priority] || priority;
  }

  getSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    switch (status) {
      case 'OPEN': return 'info';
      case 'IN_PROGRESS': return 'warn';
      case 'PAUSED': return 'secondary';
      case 'RESOLVED': return 'success';
      case 'CLOSED': return 'contrast';
      default: return undefined;
    }
  }

  getPrioritySeverity(priority: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    switch (priority) {
      case 'CRITICAL': return 'danger';
      case 'HIGH': return 'warn';
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

    const year = this.estimation.date.getFullYear();
    const month = String(this.estimation.date.getMonth() + 1).padStart(2, '0');
    const day = String(this.estimation.date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

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
    const user = this.currentUser();
    if (!user) return false;

    // If assigned to me, I can unassign
    if (ticket.assignedTo?.id === user.id) return true;

    // If admin, can unassign anyone
    if (user.role === 'ADMIN' && ticket.assignedTo) return true;

    return false;
  }

  unassign(ticket: Ticket) {
    this.ticketService.assignTicket(ticket.id, undefined, undefined).subscribe(() => {
      this.loadTickets();
    });
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

  items: MenuItem[] = [];

  showMenu(menu: any, event: MouseEvent, ticket: Ticket) {
    this.items = this.getTicketActions(ticket);
    menu.toggle(event);
  }

  getTicketActions(ticket: Ticket): MenuItem[] {
    const actions: MenuItem[] = [];

    // View Action (Always available)
    actions.push({
      label: this.translate.instant('ACTIONS.VIEW'),
      icon: 'pi pi-eye',
      routerLink: ['/tickets', ticket.id]
    });

    // Start Action
    if (this.canStart(ticket)) {
      actions.push({
        label: this.translate.instant('ACTIONS.START'),
        icon: 'pi pi-play',
        command: () => this.startTicket(ticket)
      });
    }

    // Pause Action
    if (this.canPause(ticket)) {
      actions.push({
        label: this.translate.instant('ACTIONS.PAUSE'),
        icon: 'pi pi-pause',
        command: () => this.openPauseDialog(ticket)
      });
    }

    // Assign to Me Action
    if (this.canAssignToMe(ticket)) {
      actions.push({
        label: this.translate.instant('ACTIONS.ASSIGN_ME'),
        icon: 'pi pi-user-plus',
        command: () => this.assignToMe(ticket)
      });
    }

    // Unassign Action
    if (this.canUnassign(ticket)) {
      actions.push({
        label: this.translate.instant('ACTIONS.UNASSIGN'),
        icon: 'pi pi-user-minus',
        command: () => this.unassign(ticket)
      });
    }

    // Forward Action (Always available if not closed?) - logic from template was just always available
    actions.push({
      label: this.translate.instant('ACTIONS.FORWARD'),
      icon: 'pi pi-arrow-right',
      command: () => this.openForwardDialog(ticket)
    });

    return actions;
  }
}
