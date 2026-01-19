import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { Auth, authState } from '@angular/fire/auth';

export const LoggedGuard: CanActivateFn = () => {
  const router = inject(Router);
  const auth = inject(Auth);

  return authState(auth).pipe(
    map((user) => (user ? router.createUrlTree(['/chat']) : true))
  );
};
