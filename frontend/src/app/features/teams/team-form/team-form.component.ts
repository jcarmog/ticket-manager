import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { MultiSelectModule } from 'primeng/multiselect';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { TeamService } from '../../../core/team.service';
import { UserService } from '../../../core/user.service';
import { User } from '../../../core/auth.service';

@Component({
  selector: 'app-team-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    InputTextModule,
    InputTextarea,
    MultiSelectModule,
    DropdownModule,
    ButtonModule
  ],
  templateUrl: './team-form.component.html'
})
export class TeamFormComponent implements OnInit {
  teamForm: FormGroup;
  loading = signal(false);
  users = signal<User[]>([]);

  teamId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private teamService: TeamService,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.teamForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      leader: [null],
      members: [[]],
      active: [true]
    });
  }

  ngOnInit() {
    this.loadUsers();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.teamId = +id;
      this.loadTeam(this.teamId);
    }
  }

  loadUsers() {
    this.userService.getUsers().subscribe(users => this.users.set(users));
  }

  loadTeam(id: number) {
    this.loading.set(true);
    // We need to fetch ALL teams to find this one if it's inactive
    this.teamService.getTeams(true).subscribe(teams => {
      const team = teams.find(t => t.id === id);
      if (team) {
        this.teamForm.patchValue({
          name: team.name,
          description: team.description,
          leader: team.leader,
          members: team.members.map(m => m.id),
          active: team.active
        });
      }
      this.loading.set(false);
    });
  }

  onSubmit() {
    if (this.teamForm.invalid) return;

    this.loading.set(true);
    const formValue = this.teamForm.value;
    const teamData = {
      name: formValue.name,
      description: formValue.description,
      leader: formValue.leader,
      active: formValue.active
    };

    if (this.teamId) {
      this.teamService.updateTeam(this.teamId, teamData).subscribe({
        next: () => this.handleMembers(this.teamId!),
        error: () => this.loading.set(false)
      });
    } else {
      this.teamService.createTeam(teamData).subscribe({
        next: (newTeam) => this.handleMembers(newTeam.id),
        error: () => this.loading.set(false)
      });
    }
  }

  handleMembers(teamId: number) {
    const formValue = this.teamForm.value;
    if (formValue.members && formValue.members.length > 0) {
      const memberIds: number[] = formValue.members;
      let completed = 0;
      const checkDone = () => {
        completed++;
        if (completed === memberIds.length) {
          this.router.navigate(['/teams']);
        }
      };

      memberIds.forEach(userId => {
        this.teamService.addMember(teamId, userId).subscribe({
          next: checkDone,
          error: checkDone
        });
      });
    } else {
      this.router.navigate(['/teams']);
    }
  }
}
