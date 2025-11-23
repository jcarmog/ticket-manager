import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
import { AuthService, User } from '../../core/auth.service';
import { TeamService } from '../../core/team.service';
import { UserService } from '../../core/user.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, ButtonModule, TranslateModule, DropdownModule, FormsModule],
    templateUrl: './profile.component.html'
})
export class ProfileComponent implements OnInit {
    user = signal<User | null>(null);

    language: string = 'pt-BR';
    languageOptions = [
        { label: 'Português', value: 'pt-BR' },
        { label: 'English', value: 'en-US' }
    ];

    constructor(
        private authService: AuthService,
        private teamService: TeamService,
        private translate: TranslateService,
        private userService: UserService
    ) {
        const savedLang = localStorage.getItem('preferredLanguage');
        if (savedLang) {
            this.language = savedLang;
        } else {
            this.language = this.translate.currentLang || 'pt-BR';
        }
    }

    onLanguageChange() {
        this.translate.use(this.language);
        localStorage.setItem('preferredLanguage', this.language);

        // Save to backend
        const currentUser = this.authService.currentUser();
        if (currentUser) {
            this.userService.updateUser(currentUser.id, { preferredLanguage: this.language }, []).subscribe({
                next: (updatedUser) => {
                    console.log('Language preference saved to backend');
                },
                error: (error) => {
                    console.error('Failed to save language preference:', error);
                }
            });
        }
    }
    ngOnInit() {
        const user = this.authService.currentUser();
        console.log('ProfileComponent user:', user);
        this.user.set(user);
    }
}
