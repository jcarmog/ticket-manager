import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from './auth.service';
import { Team } from './team.service';
import { environment } from '../../environments/environment';

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'PAUSED' | 'RESOLVED' | 'CLOSED';

export interface TicketAction {
    id: number;
    description: string;
    timestamp: string;
    actor: User;
}

export interface Ticket {
    id: number;
    title: string;
    description: string;
    status: TicketStatus;
    createdBy: User;
    assignedTo?: User;
    assignedTeam?: Team;
    ticketNumber: string;
    priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    estimatedTime?: string;
    estimatedFinishDate?: string;
    createdAt: string;
    updatedAt: string;
    actions: TicketAction[];
}

export interface TicketFilters {
    assignedTo?: number;
    assignedTeam?: number;
    startDate?: string;
    endDate?: string;
    assignedToMe?: boolean;
    status?: TicketStatus;
    statusChangedFrom?: string;
}

export interface Page<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
}

@Injectable({
    providedIn: 'root'
})
export class TicketService {
    private apiUrl = `${environment.apiUrl}/tickets`;

    constructor(private http: HttpClient) { }

    getTickets(page: number, size: number, filters?: TicketFilters, sort?: string): Observable<Page<Ticket>> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        if (sort) {
            params = params.set('sort', sort);
        }

        if (filters) {
            if (filters.assignedTo) params = params.set('assignedTo', filters.assignedTo);
            if (filters.assignedTeam) params = params.set('assignedTeam', filters.assignedTeam);
            if (filters.startDate) params = params.set('startDate', filters.startDate);
            if (filters.endDate) params = params.set('endDate', filters.endDate);
            if (filters.assignedToMe) params = params.set('assignedToMe', filters.assignedToMe);
            if (filters.status) params = params.set('status', filters.status);
            if (filters.statusChangedFrom) params = params.set('statusChangedFrom', filters.statusChangedFrom);
        }
        return this.http.get<Page<Ticket>>(this.apiUrl, { params, withCredentials: true });
    }

    getTicket(id: number): Observable<Ticket> {
        return this.http.get<Ticket>(`${this.apiUrl}/${id}`, { withCredentials: true });
    }

    createTicket(ticket: Partial<Ticket>): Observable<Ticket> {
        return this.http.post<Ticket>(this.apiUrl, ticket, { withCredentials: true });
    }

    updateTicket(id: number, ticket: Partial<Ticket>): Observable<Ticket> {
        return this.http.put<Ticket>(`${this.apiUrl}/${id}`, ticket, { withCredentials: true });
    }

    updateStatus(id: number, status: TicketStatus): Observable<Ticket> {
        return this.http.patch<Ticket>(`${this.apiUrl}/${id}/status?status=${status}`, {}, { withCredentials: true });
    }

    assignTicket(id: number, userId?: number, teamId?: number): Observable<Ticket> {
        let params = new HttpParams();
        console.log(userId, teamId);
        if (userId) params = params.set('userId', userId);
        if (teamId) params = params.set('teamId', teamId);
        return this.http.patch<Ticket>(`${this.apiUrl}/${id}/assign`, {}, { params, withCredentials: true });
    }

    pauseTicket(id: number, reason: string): Observable<Ticket> {
        return this.http.put<Ticket>(`${this.apiUrl}/${id}/pause`, { reason }, { withCredentials: true });
    }

    addAction(id: number, description: string): Observable<Ticket> {
        return this.http.post<Ticket>(`${this.apiUrl}/${id}/actions`, { description }, { withCredentials: true });
    }
}

export const TICKET_STATUS_DESCRIPTIONS: { [key: string]: string } = {
    'OPEN': 'Open',
    'IN_PROGRESS': 'In Progress',
    'PAUSED': 'Paused',
    'RESOLVED': 'Resolved',
    'CLOSED': 'Closed'
};

export const TICKET_PRIORITY_DESCRIPTIONS: { [key: string]: string } = {
    'CRITICAL': 'Critical',
    'HIGH': 'High',
    'MEDIUM': 'Medium',
    'LOW': 'Low'
};
