import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';

import { ToastModule } from 'primeng/toast';

import { Router } from '@angular/router';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, ButtonModule, AvatarModule, MenuModule, ToastModule],
  templateUrl: './app-layout.component.html'
})
export class AppLayoutComponent {
  constructor(public authService: AuthService, private router: Router) { }

  navigateToProfile() {
    this.router.navigate(['/profile']);
  }

  getTeamNames(user: any): string {
    if (!user.teams || user.teams.length === 0) return '';
    return user.teams.map((t: any) => t.name).join(', ');
  }
}
