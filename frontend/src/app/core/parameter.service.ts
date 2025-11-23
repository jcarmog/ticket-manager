import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Parameter {
    id: number;
    key: string;
    value: string;
}

@Injectable({
    providedIn: 'root'
})
export class ParameterService {
    private apiUrl = `${environment.apiUrl}/parameters`;

    constructor(private http: HttpClient) { }

    getParameter(name: string): Observable<Parameter> {
        return this.http.get<Parameter>(`${this.apiUrl}/${name}`);
    }
}
