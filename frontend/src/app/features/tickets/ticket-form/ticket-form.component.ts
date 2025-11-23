import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { TicketService, TicketStatus, TICKET_STATUS_DESCRIPTIONS, TICKET_PRIORITY_DESCRIPTIONS } from '../../../core/ticket.service';
import { UserService } from '../../../core/user.service';
import { TeamService, Team } from '../../../core/team.service';
import { User, AuthService } from '../../../core/auth.service';
import { EditorModule } from 'primeng/editor';
import { CalendarModule } from 'primeng/calendar';
import { AutoCompleteModule, AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { DialogModule } from 'primeng/dialog';
import { AccordionModule } from 'primeng/accordion';
import { TicketAction } from '../../../core/ticket.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-ticket-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterLink,
    InputTextModule,
    InputTextareaModule,
    DropdownModule,
    ButtonModule,
    EditorModule,
    CalendarModule,
    AutoCompleteModule,
    DialogModule,
    AccordionModule,
    TranslateModule
  ],

  templateUrl: './ticket-form.component.html'
})
export class TicketFormComponent implements OnInit {
  ticketForm: FormGroup;
  isEditMode = signal(false);
  loading = signal(false);
  users = signal<User[]>([]);
  teams = signal<Team[]>([]);
  ticketId: number | null = null;
  currentUser = this.authService.currentUser;

  ticketActions: TicketAction[] = [];
  showActionDialog = false;
  newActionDescription = '';

  statuses: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'PAUSED', 'RESOLVED', 'CLOSED'];

  priorityOptions: { label: string, value: string }[] = [];

  filteredUsers: User[] = [];
  filteredTeams: Team[] = [];

  constructor(
    private fb: FormBuilder,
    private ticketService: TicketService,
    private userService: UserService,
    private teamService: TeamService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private translate: TranslateService
  ) {
    this.ticketForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      status: ['OPEN', Validators.required],
      priority: ['MEDIUM', Validators.required],
      estimatedTime: [''],
      estimatedFinishDate: [null],
      assignedTo: [null],
      assignedTeam: [null, Validators.required]
    });
  }

  ngOnInit() {
    // this.authService.currentUser is a signal, not an observable.
    // We can just read it directly or use an effect if we needed to react to changes.
    // But here we just need to load users and teams.
    this.loadUsersAndTeams();

    const keys = Object.keys(TICKET_PRIORITY_DESCRIPTIONS);
    const translationKeys = keys.map(key => `TICKET.PRIORITY_LABEL.${key}`);

    this.translate.get(translationKeys).subscribe(translations => {
      this.priorityOptions = keys.map(key => ({
        label: translations[`TICKET.PRIORITY_LABEL.${key}`],
        value: key
      }));
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.ticketId = +id;
      this.isEditMode.set(true);
      this.loadTicket(this.ticketId);
    }
  }

  loadUsersAndTeams() {
    this.userService.getUsers().subscribe(users => this.users.set(users));
    this.teamService.getTeams().subscribe(teams => this.teams.set(teams));
  }

  loadTicket(id: number) {
    this.loading.set(true);
    this.ticketService.getTicket(id).subscribe({
      next: (ticket) => {
        this.ticketForm.patchValue({
          title: ticket.title,
          description: ticket.description,
          status: ticket.status,
          priority: ticket.priority,
          estimatedTime: ticket.estimatedTime,
          estimatedFinishDate: ticket.estimatedFinishDate ? new Date(ticket.estimatedFinishDate) : null,
          assignedTo: ticket.assignedTo, // AutoComplete expects object
          assignedTeam: ticket.assignedTeam // AutoComplete expects object
        });
        this.creatorId = ticket.createdBy?.id;
        this.ticketActions = (ticket.actions || []).sort((a, b) => {
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });
        this.loading.set(false);

        // Disable form if not allowed to edit
        if (!this.canEdit()) {
          this.ticketForm.disable();
          // Re-enable status if canClose? No, status is part of form.
          // If canClose, we might want to allow just the status change to CLOSED?
          // Or provide a specific button "Approve/Close".
        }
      },
      error: () => {
        this.loading.set(false);
        this.router.navigate(['/tickets']);
      }
    });
  }

  onSubmit() {
    if (this.ticketForm.invalid) return;

    this.loading.set(true);
    const formValue = this.ticketForm.value;

    // Format date to yyyy-MM-dd
    let formattedDate = null;
    if (formValue.estimatedFinishDate instanceof Date) {
      const year = formValue.estimatedFinishDate.getFullYear();
      const month = String(formValue.estimatedFinishDate.getMonth() + 1).padStart(2, '0');
      const day = String(formValue.estimatedFinishDate.getDate()).padStart(2, '0');
      formattedDate = `${year}-${month}-${day}`;
    } else {
      formattedDate = formValue.estimatedFinishDate;
    }

    const ticketData = {
      ...formValue,
      estimatedFinishDate: formattedDate
      // If creating, we might not send ID. If editing, we use the ID from route.
    };

    if (this.isEditMode() && this.ticketId) {
      this.ticketService.updateTicket(this.ticketId, ticketData).subscribe({
        next: () => {
          // Handle assignment updates separately as they use different endpoints
          const assignmentUpdates = [];

          if (formValue.assignedTo !== undefined) { // Check if touched/changed? For now just send if present
            // Actually, the form value is null if cleared.
            // We should probably check if it changed, but for simplicity let's re-assign.
            // Wait, assignTicket handles both user and team.
            // If assignedTo is set, we assign to user. If assignedTeam is set, we assign to team.
            // But we can't have both? Backend logic:
            // if (userId) assign to user (clears team)
            // else if (teamId) assign to team (clears user)

            if (formValue.assignedTo) {
              const userId = formValue.assignedTo.id || formValue.assignedTo;
              assignmentUpdates.push(this.ticketService.assignTicket(this.ticketId!, userId, undefined));
            } else if (formValue.assignedTeam) {
              const teamId = formValue.assignedTeam.id || formValue.assignedTeam;
              assignmentUpdates.push(this.ticketService.assignTicket(this.ticketId!, undefined, teamId));
            }
          }

          // Handle status update
          if (formValue.status) {
            assignmentUpdates.push(this.ticketService.updateStatus(this.ticketId!, formValue.status));
          }

          if (assignmentUpdates.length > 0) {
            // Use forkJoin or just subscribe sequentially? 
            // Let's just chain them or use Promise.all equivalent if we convert to promise.
            // Simple approach:
            // We can't easily forkJoin because they are observables.
            // Let's just do it sequentially for safety or parallel.
            // Parallel is fine.
            // But we need to import forkJoin.
            // Let's just navigate back after a short delay or use a helper.
            // Actually, let's just navigate back immediately, the updates will happen in background? No, race condition.

            // Let's just do one by one for now to be safe.
            // Or better, just navigate back.
            // I'll implement a simple chain.

            let completed = 0;
            const checkDone = () => {
              completed++;
              if (completed === assignmentUpdates.length) {
                this.router.navigate(['/tickets']);
              }
            };

            assignmentUpdates.forEach(obs => obs.subscribe({ next: checkDone, error: checkDone }));
          } else {
            this.router.navigate(['/tickets']);
          }
        },
        error: () => this.loading.set(false)
      });
    } else {
      this.ticketService.createTicket(ticketData).subscribe({
        next: (newTicket) => {
          // Handle assignment if selected
          // For creation, backend now handles assignedTeam. 
          // assignedTo is still admin only and handled by backend if present.
          // So we don't need explicit assignTicket call here anymore.
          this.router.navigate(['/tickets']);
        },
        error: () => this.loading.set(false)
      });
    }
  }

  isAdmin(): boolean {
    return this.currentUser()?.role === 'ADMIN';
  }

  showEstimationFields(): boolean {
    // Show if assigning to self (which is handled by "Assign to me" button in list, but here maybe if user selects themselves?)
    // Or if user is editing a ticket assigned to them.
    // Requirement: "When a User assign himself a ticket he must estimate a time/days and date to finish it"
    // In the form, if they select themselves in "Assignee" (only admin can do that here), or if they are editing.
    // But wait, non-admins can't see assignment fields.
    // So non-admins can only estimate if they "get" the ticket via the list button.
    // However, if they are editing a ticket assigned to them, they might want to update estimation.

    const assignedTo = this.ticketForm.get('assignedTo')?.value;
    const currentUserId = this.currentUser()?.id;

    // If assignedTo is an object (from autocomplete) or ID?
    // AutoComplete with field="name" binds the object by default unless optionValue is set.
    // I removed optionValue, so it should be object.

    const assignedToId = assignedTo?.id || assignedTo; // Handle both just in case

    return assignedToId === currentUserId;
  }

  filterUsers(event: AutoCompleteCompleteEvent) {
    const query = event.query.toLowerCase();
    this.filteredUsers = this.users().filter(user => user.name.toLowerCase().includes(query));
  }

  filterTeams(event: AutoCompleteCompleteEvent) {
    const query = event.query.toLowerCase();
    this.filteredTeams = this.teams().filter(team => team.name.toLowerCase().includes(query));
  }

  canAddAction(): boolean {
    if (!this.isEditMode() || this.ticketForm.get('status')?.value !== 'IN_PROGRESS') {
      return false;
    }
    // Check permissions: Admin or Team Member
    const assignedTeam = this.ticketForm.get('assignedTeam')?.value;
    const userTeams = this.currentUser()?.teams || [];

    if (this.isAdmin()) return true;

    const assignedTeamId = assignedTeam?.id || assignedTeam;
    return !!(assignedTeamId && userTeams.some(t => t.id === assignedTeamId));
  }

  canEdit(): boolean {
    if (this.isAdmin()) return true;

    const assignedTeam = this.ticketForm.get('assignedTeam')?.value;
    const userTeams = this.currentUser()?.teams || [];
    const assignedTeamId = assignedTeam?.id || assignedTeam;

    return !!(assignedTeamId && userTeams.some(t => t.id === assignedTeamId));
  }

  canClose(): boolean {
    // Creator can close if resolved
    // Admin can always close (via edit or status change)
    if (this.isAdmin()) return true;

    const status = this.ticketForm.get('status')?.value;
    if (status !== 'RESOLVED') return false;

    // We need to check if current user is creator.
    // We don't have creator info in form directly, need to check ticket object or store it.
    // Let's store creatorId when loading ticket.
    return this.creatorId === this.currentUser()?.id;
  }

  creatorId: number | null = null;

  saveAction() {
    if (this.ticketId && this.newActionDescription.trim()) {
      this.ticketService.addAction(this.ticketId, this.newActionDescription).subscribe({
        next: (updatedTicket) => {
          this.showActionDialog = false;
          this.newActionDescription = '';
          // Reload ticket to get updated actions
          this.loadTicket(this.ticketId!);
        }
      });
    }
  }

  approveTicket() {
    if (this.ticketId) {
      this.loading.set(true);
      this.ticketService.updateStatus(this.ticketId, 'CLOSED').subscribe({
        next: () => this.router.navigate(['/tickets']),
        error: () => this.loading.set(false)
      });
    }
  }
}
