import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { ButtonModule } from 'primeng/button';
import { UserService } from '../../../core/user.service';
import { User } from '../../../core/auth.service';
import { TeamService, Team } from '../../../core/team.service';

@Component({
    selector: 'app-user-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterLink,
        InputTextModule,
        DropdownModule,
        MultiSelectModule,
        ButtonModule
    ],
    templateUrl: './user-form.component.html'
})
export class UserFormComponent implements OnInit {
    userForm: FormGroup;
    loading = signal(false);
    teams = signal<Team[]>([]);
    userId: number | null = null;
    roles = ['ADMIN', 'USER'];

    constructor(
        private fb: FormBuilder,
        private userService: UserService,
        private teamService: TeamService,
        private router: Router,
        private route: ActivatedRoute
    ) {
        this.userForm = this.fb.group({
            name: ['', Validators.required],
            email: [''],
            role: ['', Validators.required],
            teams: [[]],
            active: [true]
        });
    }

    ngOnInit() {
        this.loadTeams();
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.userId = +id;
            this.loadUser(this.userId);
        }
    }

    loadTeams() {
        // Load ALL teams so we can assign even inactive ones if needed, or just active?
        // Usually for assignment we want active teams.
        this.teamService.getTeams(false).subscribe(teams => this.teams.set(teams));
    }

    loadUser(id: number) {
        this.loading.set(true);
        // We need to fetch ALL users to find this one if it's inactive
        this.userService.getUsers(true).subscribe(users => {
            const user = users.find(u => u.id === id);
            if (user) {
                this.userForm.patchValue({
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    teams: user.teams?.map(t => t.id) || [],
                    active: user.active
                });
            }
            this.loading.set(false);
        });
    }

    onSubmit() {
        if (this.userForm.invalid) return;

        this.loading.set(true);
        const formValue = this.userForm.value;

        const userData: Partial<User> = {
            name: formValue.name,
            role: formValue.role,
            active: formValue.active
        };
        const teamIds = formValue.teams;

        if (this.userId) {
            this.userService.updateUser(this.userId, userData, teamIds).subscribe({
                next: () => {
                    this.router.navigate(['/users']);
                },
                error: () => {
                    this.loading.set(false);
                }
            });
        }
    }
}
