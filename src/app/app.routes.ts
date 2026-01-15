import { Routes } from '@angular/router';
import { LoginPage } from './auth/login-page/login-page';
import { RegisterPage } from './auth/register-page/register-page';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () =>
      import('./pages/home-page/home.page').then((m) => m.HomePage),
  },
  // {
  //   path: '',
  //   redirectTo: 'home',
  //   pathMatch: 'full',
  // },
  {
    path: 'login',
    component: LoginPage,
  },
  {
    path: 'register',
    component: RegisterPage,
  },
];
