import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { UserService } from '../../../core/user.service';
import { User } from '../../../core/auth.service';

@Component({
    selector: 'app-user-list',
    standalone: true,
    imports: [CommonModule, RouterLink, TableModule, ButtonModule, AvatarModule, TooltipModule, MenuModule],
    templateUrl: './user-list.component.html'
})
export class UserListComponent implements OnInit {
    users = signal<User[]>([]);
    showInactive = signal(false);

    constructor(private userService: UserService) { }

    ngOnInit() {
        this.loadUsers();
    }

    loadUsers() {
        this.userService.getUsers(this.showInactive()).subscribe(users => {
            this.users.set(users);
        });
    }

    toggleInactive() {
        this.showInactive.update(v => !v);
        this.loadUsers();
    }

    items: MenuItem[] = [];

    showMenu(menu: any, event: MouseEvent, user: User) {
        this.items = this.getUserActions(user);
        menu.toggle(event);
    }

    getUserActions(user: User): MenuItem[] {
        return [
            {
                label: 'Edit User',
                icon: 'pi pi-pencil',
                routerLink: ['/users', user.id]
            }
        ];
    }
}
