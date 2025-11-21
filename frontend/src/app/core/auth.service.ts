import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of, map } from 'rxjs';

export interface User {
    id: number;
    email: string;
    name: string;
    avatarUrl?: string;
    role: 'ADMIN' | 'USER';
    teams?: { id: number; name: string }[];
    active?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = 'http://localhost:8080/api/users/me';
    currentUser = signal<User | null>(null);
    private initialized = false;

    constructor(private http: HttpClient) { }

    checkAuth(): Observable<boolean> {
        if (this.initialized) {
            return of(!!this.currentUser());
        }

        return this.http.get<User>(this.apiUrl, { withCredentials: true }).pipe(
            tap(user => {
                this.currentUser.set(user);
                this.initialized = true;
            }),
            map(() => true),
            catchError(() => {
                this.currentUser.set(null);
                this.initialized = true;
                return of(false);
            })
        );
    }

    login(provider: string = 'google'): void {
        window.location.href = `http://localhost:8080/oauth2/authorization/${provider}`;
    }

    logout(): void {
        this.currentUser.set(null);
        this.initialized = false;
        // Call logout endpoint if needed
    }
}
