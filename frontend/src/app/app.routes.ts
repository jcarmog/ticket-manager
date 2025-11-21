import { Routes } from '@angular/router';
import { AppLayoutComponent } from './layout/app-layout.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { ProfileComponent } from './features/profile/profile.component';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
    {
        path: 'landing',
        loadComponent: () => import('./features/landing/landing-page.component').then(m => m.LandingPageComponent)
    },
    {
        path: '',
        component: AppLayoutComponent,
        canActivate: [authGuard],
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            { path: 'dashboard', component: DashboardComponent },
            {
                path: 'tickets',
                loadComponent: () => import('./features/tickets/ticket-list/ticket-list.component').then(m => m.TicketListComponent)
            },
            {
                path: 'tickets/new',
                loadComponent: () => import('./features/tickets/ticket-form/ticket-form.component').then(m => m.TicketFormComponent)
            },
            {
                path: 'tickets/:id',
                loadComponent: () => import('./features/tickets/ticket-form/ticket-form.component').then(m => m.TicketFormComponent)
            },
            {
                path: 'teams',
                loadComponent: () => import('./features/teams/team-list/team-list.component').then(m => m.TeamListComponent)
            },
            {
                path: 'teams/new',
                loadComponent: () => import('./features/teams/team-form/team-form.component').then(m => m.TeamFormComponent)
            },
            {
                path: 'teams/:id',
                loadComponent: () => import('./features/teams/team-form/team-form.component').then(m => m.TeamFormComponent)
            },
            {
                path: 'users',
                loadComponent: () => import('./features/users/user-list/user-list.component').then(m => m.UserListComponent)
            },
            {
                path: 'users/:id',
                loadComponent: () => import('./features/users/user-form/user-form.component').then(m => m.UserFormComponent)
            },
            {
                path: 'profile',
                loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent)
            }
        ]
    },
    { path: '**', redirectTo: '' }
];
