import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../../core/auth.service';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './profile.component.html'
})
export class ProfileComponent implements OnInit {
    user = signal<User | null>(null);

    constructor(private authService: AuthService) { }

    ngOnInit() {
        const user = this.authService.currentUser();
        console.log('ProfileComponent user:', user);
        this.user.set(user);
    }
}
