import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Notification } from './notification.model';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private apiUrl = `${environment.apiUrl}/notifications`;

    constructor(private http: HttpClient) { }

    getUnreadNotifications(): Observable<Notification[]> {
        return this.http.get<Notification[]>(this.apiUrl, { withCredentials: true });
    }

    markAsRead(id: number): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/${id}/read`, {}, { withCredentials: true });
    }
}
