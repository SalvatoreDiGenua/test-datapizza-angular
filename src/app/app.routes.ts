import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/login').then((m) => m.Login),
    title: '🍕 Login Datapizza Angular',
  },
  {
    path: 'shell',
    loadComponent: () => import('./features/shell/shell').then((m) => m.Shell),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'chat',
      },
      {
        path: 'chat',
        loadComponent: () => import('./features/chat/chat').then((m) => m.Chat),
        title: '🍕 Chat Datapizza Angular',
        canActivate: [authGuard],
      },
    ],
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'shell',
  },
  {
    path: '**',
    redirectTo: 'shell',
  },
];
