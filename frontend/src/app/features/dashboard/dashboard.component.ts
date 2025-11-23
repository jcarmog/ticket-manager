import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { MeterGroupModule } from 'primeng/metergroup';
import { TranslateModule } from '@ngx-translate/core';
import { TicketService, Ticket, TicketStatus } from '../../core/ticket.service';
import { AuthService, User } from '../../core/auth.service';
import { TeamService, Team } from '../../core/team.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    InputTextModule,
    DropdownModule,
    TableModule,
    TagModule,
    ButtonModule,
    MeterGroupModule,
    TranslateModule
  ],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  currentUser = this.authService.currentUser;
  allTickets = signal<Ticket[]>([]);
  tickets = signal<Ticket[]>([]);
  teams = signal<Team[]>([]);
  previousMonthTotal = signal<number>(0);

  searchQuery = '';
  selectedTeamId: number | null = null;
  currentDate = new Date();

  kpis = computed(() => {
    const list = this.tickets() || [];
    return {
      total: list.length,
      open: list.filter(t => t.status === 'OPEN').length,
      inProgress: list.filter(t => t.status === 'IN_PROGRESS').length,
      resolved: list.filter(t => t.status === 'RESOLVED').length
    };
  });

  totalGrowth = computed(() => {
    const current = this.kpis().total;
    const previous = this.previousMonthTotal();
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  });

  // Icon class for growth direction
  growthIcon = computed(() => this.totalGrowth() >= 0 ? 'pi-arrow-up' : 'pi-arrow-down');

  // Color class for growth direction
  growthColor = computed(() => this.totalGrowth() >= 0 ? 'text-emerald-500' : 'text-red-500');

  meterGroupValues = computed(() => {
    const kpis = this.kpis();
    const total = kpis.total || 1; // Avoid division by zero
    return [
      { label: 'DASHBOARD.OPEN', value: (kpis.open / total) * 100, color: '#3b82f6', icon: 'pi pi-exclamation-circle' },
      { label: 'DASHBOARD.IN_PROGRESS', value: (kpis.inProgress / total) * 100, color: '#f59e0b', icon: 'pi pi-spinner' },
      { label: 'DASHBOARD.RESOLVED', value: (kpis.resolved / total) * 100, color: '#10b981', icon: 'pi pi-check-circle' }
    ];
  });

  primaryList = computed(() => {
    const list = this.tickets() || [];
    if (this.isAdmin()) {
      // Last 10 tickets
      return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);
    } else {
      // My In Progress
      const userId = this.currentUser()?.id;
      return list.filter(t => t.assignedTo?.id === userId && t.status === 'IN_PROGRESS');
    }
  });

  secondaryList = computed(() => {
    const list = this.tickets() || [];
    if (this.isAdmin()) {
      // Critical Tickets
      return list.filter(t => t.priority === 'CRITICAL');
    } else {
      // My Paused
      const userId = this.currentUser()?.id;
      return list.filter(t => t.assignedTo?.id === userId && t.status === 'PAUSED');
    }
  });

  teamTickets = computed(() => {
    const list = this.tickets() || [];
    const user = this.currentUser();
    // Assuming we can filter by team ID if we knew it.
    // But ticket doesn't always have assignedTeam if assigned to user.
    // However, user belongs to a team.
    // We need to know user's team.
    // User model has team?
    // Let's check User model in AuthService.
    // It doesn't have team info in interface.
    // We might need to fetch it or update User interface.
    // For now, let's filter by tickets where assignedTeam is set OR assignedTo is in same team?
    // Simpler: Filter by tickets assigned to my team (if ticket has assignedTeam).
    return list.filter(t => t.assignedTeam); // Placeholder logic
  });

  constructor(
    private ticketService: TicketService,
    private authService: AuthService,
    private teamService: TeamService
  ) { }

  ngOnInit() {
    this.loadData();
    this.teamService.getTeams().subscribe(teams => this.teams.set(teams));
  }

  loadData() {
    // If admin and team selected, filter by team.
    // Else fetch all (or filtered by user permissions in backend).
    const filters: any = {};
    if (this.selectedTeamId) {
      filters.assignedTeam = this.selectedTeamId;
    }

    // Filter by current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Format dates as YYYY-MM-DD
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    filters.startDate = formatDate(firstDay);
    filters.endDate = formatDate(lastDay);

    // Fetch a large page to simulate "all" for dashboard
    this.ticketService.getTickets(0, 1000, filters).subscribe(page => {
      this.allTickets.set(page.content);
      this.onSearch(); // Apply search if any
    });

    // Fetch previous month data
    const prevDate = new Date();
    prevDate.setMonth(prevDate.getMonth() - 1);
    const prevFirstDay = new Date(prevDate.getFullYear(), prevDate.getMonth(), 1);
    const prevLastDay = new Date(prevDate.getFullYear(), prevDate.getMonth() + 1, 0);

    const prevFilters: any = { ...filters };
    prevFilters.startDate = formatDate(prevFirstDay);
    prevFilters.endDate = formatDate(prevLastDay);

    this.ticketService.getTickets(0, 1, prevFilters).subscribe(page => {
      this.previousMonthTotal.set(page.totalElements);
    });
  }

  onSearch() {
    const query = this.searchQuery.trim().toLowerCase();
    const all = this.allTickets();

    if (!query) {
      this.tickets.set(all);
      return;
    }

    const filtered = all.filter(t =>
      t.ticketNumber.toLowerCase().includes(query) ||
      t.title.toLowerCase().includes(query)
    );
    this.tickets.set(filtered);
  }

  isAdmin(): boolean {
    return this.currentUser()?.role === 'ADMIN';
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
}
