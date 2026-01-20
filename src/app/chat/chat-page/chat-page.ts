import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonButton } from '@ionic/angular/standalone';
import { AuthService } from 'src/app/auth/services/auth.service';
import { Header } from '../components/header/header';
import { MessagesService } from 'src/app/auth/services/messages.service';

@Component({
  selector: 'chat-page',
  imports: [IonButton, Header],
  templateUrl: './chat-page.html',
  styleUrls: ['./chat.page.scss'],
})
export class ChatPage {
  private authService = inject(AuthService);
  private router = inject(Router);
  private messageService = inject(MessagesService);

  async testMessage() {
    const key = await this.messageService.addMessage(
      'Este es un soso mensaje de prueba </3',
    );
    console.log('Mensaje guardado con key');
  }

  async onLogOut() {
    await this.authService.logOut();

    await this.router.navigateByUrl('/login');
  }
}
