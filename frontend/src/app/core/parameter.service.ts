import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ApplicationParameter {
    id: number;
    name: string;
    description: string;
    value: string;
}

@Injectable({
    providedIn: 'root'
})
export class ParameterService {
    private apiUrl = 'http://localhost:8080/api/parameters';

    constructor(private http: HttpClient) { }

    getParameter(name: string): Observable<ApplicationParameter> {
        return this.http.get<ApplicationParameter>(`${this.apiUrl}/${name}`);
    }
}
