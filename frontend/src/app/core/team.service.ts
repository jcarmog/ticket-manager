import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from './auth.service';

export interface Team {
    id: number;
    name: string;
    description: string;
    leader: User;
    members: User[];
    active?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class TeamService {
    private apiUrl = 'http://localhost:8080/api/teams';

    constructor(private http: HttpClient) { }

    getTeams(includeInactive: boolean = false): Observable<Team[]> {
        return this.http.get<Team[]>(this.apiUrl, {
            params: { includeInactive: includeInactive.toString() },
            withCredentials: true
        });
    }

    createTeam(team: Partial<Team>): Observable<Team> {
        return this.http.post<Team>(this.apiUrl, team, { withCredentials: true });
    }

    updateTeam(id: number, team: Partial<Team>): Observable<Team> {
        return this.http.put<Team>(`${this.apiUrl}/${id}`, team, { withCredentials: true });
    }

    addMember(teamId: number, userId: number): Observable<Team> {
        return this.http.patch<Team>(`${this.apiUrl}/${teamId}/members`, {}, {
            params: { userId: userId.toString() },
            withCredentials: true
        });
    }
}
