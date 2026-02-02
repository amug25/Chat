import { Routes } from '@angular/router';
import { LoginPage } from './auth/login-page/login-page';
import { LoggedGuard } from './auth/guards/logged.guard';

export const routes: Routes = [

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
  {
    path: '**',
    redirectTo: 'login',
  }
];
