import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { NotificationService } from '../core/notification.service';
import { Notification } from '../core/notification.model';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { BadgeModule } from 'primeng/badge';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';

import { Router } from '@angular/router';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, ButtonModule, AvatarModule, MenuModule, ToastModule, OverlayPanelModule, BadgeModule, TranslateModule, TooltipModule],
  templateUrl: './app-layout.component.html'
})
export class AppLayoutComponent implements OnInit, OnDestroy {
  notifications = signal<Notification[]>([]);
  sidebarCollapsed = signal<boolean>(false);
  mobileSidebarOpen = signal<boolean>(false);
  private pollingInterval: any;

  toggleSidebar() {
    // On desktop (md and up), we toggle the collapsed state
    // On mobile, we toggle the visibility
    if (window.innerWidth >= 768) {
      this.sidebarCollapsed.update(v => !v);
    } else {
      this.mobileSidebarOpen.update(v => !v);
    }
  }

  closeMobileSidebar() {
    this.mobileSidebarOpen.set(false);
  }

  constructor(
    public authService: AuthService,
    private router: Router,
    private notificationService: NotificationService,
    private translate: TranslateService
  ) { }

  ngOnInit() {
    const savedLang = localStorage.getItem('preferredLanguage');
    if (savedLang) {
      this.translate.use(savedLang);
    }

    this.loadNotifications();
    this.pollingInterval = setInterval(() => {
      this.loadNotifications();
    }, 30000); // Poll every 30 seconds
  }

  ngOnDestroy() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  loadNotifications() {
    if (this.authService.currentUser()) {
      this.notificationService.getUnreadNotifications().subscribe(notifications => {
        this.notifications.set(notifications);
      });
    }
  }

  markAsRead(notification: Notification) {
    this.notificationService.markAsRead(notification.id).subscribe(() => {
      this.notifications.update(current => current.filter(n => n.id !== notification.id));
      // Navigate to ticket if needed
      if (notification.ticket) {
        this.router.navigate(['/tickets', notification.ticket.id]);
      }
    });
  }

  navigateToProfile() {
    this.router.navigate(['/profile']);
  }

  getTeamNames(user: any): string {
    if (!user.teams || user.teams.length === 0) return '';
    return user.teams.map((t: any) => t.name).join(', ');
  }
}
