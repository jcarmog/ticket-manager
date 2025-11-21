import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private apiUrl = 'http://localhost:8080/api/users';

    constructor(private http: HttpClient) { }

    getUsers(includeInactive: boolean = false): Observable<User[]> {
        return this.http.get<User[]>(this.apiUrl, {
            params: { includeInactive: includeInactive.toString() },
            withCredentials: true
        });
    }

    updateUser(id: number, user: Partial<User>, teamIds: number[]): Observable<User> {
        return this.http.put<User>(`${this.apiUrl}/${id}`, { user, teamIds }, { withCredentials: true });
    }
}
