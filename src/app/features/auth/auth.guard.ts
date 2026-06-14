import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { filter, map, take } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.currentUser$.pipe(
    filter((user): user is Exclude<typeof user, undefined> => user !== undefined),
    take(1),
    map(user => {
      const decision = user ? true : router.createUrlTree(['/']);
      // Trace guard resolution to diagnose unexpected redirects.
      console.log('[authGuard] currentUser =', user, 'decision =', decision);
      return decision;
    })
  );
};

export const roleGuard = (role: string): CanActivateFn => () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.hasRole(role)) return true;
  if (authService.isLoggedIn) return router.createUrlTree(['/dashboard']);
  return router.createUrlTree(['/']);
};
