import { Routes } from '@angular/router';
import { LoginPage } from './auth/login-page/login-page';
import { LoggedGuard } from './auth/guards/logged.guard';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () =>
      import('./pages/home-page/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: LoginPage,
    canActivate: [LoggedGuard],
  },

  {
    path: 'chat',
    loadChildren: () => import('./chat/chat.routes').then((m) => m.routes),
  },
];
