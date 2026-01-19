import { Routes } from '@angular/router';
import { ChatPage } from '../chat/chat-page/chat-page';
import { NotLoggedGuard } from '../auth/guards/notlogged.guard';

export const routes: Routes = [
  {
    path: '',
    component: ChatPage,
    canActivate: [NotLoggedGuard],
  },
];
