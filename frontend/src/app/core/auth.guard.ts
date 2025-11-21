import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { map, tap } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.checkAuth().pipe(
        tap(isAuthenticated => {
            if (!isAuthenticated) {
                router.navigate(['/landing']);
            }
        })
    );
};
