import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonButton } from '@ionic/angular/standalone';
import { AuthService } from 'src/app/auth/services/auth.service';

@Component({
  selector: 'chat-page',
  imports: [IonButton],
  templateUrl: './chat-page.html',
  styleUrls: ['./chat.page.scss'],
})
export class ChatPage {
  private authService = inject(AuthService);
  private router = inject(Router);

  async onLogOut() {
    await this.authService.logOut();

    await this.router.navigateByUrl('/login');
  }
}
