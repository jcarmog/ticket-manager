import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const messageService = inject(MessageService);
    const router = inject(Router);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            let errorMessage = 'An unexpected error occurred';
            let summary = 'Error';

            if (error.error instanceof ErrorEvent) {
                // Client-side error
                errorMessage = error.error.message;
            } else {
                // Server-side error
                if (error.status === 0) {
                    errorMessage = 'Unable to connect to the server';
                    summary = 'Connection Error';
                } else if (error.status === 401) {
                    errorMessage = 'Session expired. Please login again.';
                    summary = 'Authentication Error';
                    router.navigate(['/landing']);
                } else if (error.status === 403) {
                    errorMessage = 'You do not have permission to perform this action';
                    summary = 'Access Denied';
                } else if (error.status === 404) {
                    errorMessage = 'Resource not found';
                    summary = 'Not Found';
                } else if (error.error && typeof error.error === 'string') {
                    errorMessage = error.error;
                } else if (error.error && error.error.message) {
                    errorMessage = error.error.message;
                } else {
                    errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
                }
            }

            messageService.add({ severity: 'error', summary: summary, detail: errorMessage, life: 5000 });
            return throwError(() => error);
        })
    );
};
