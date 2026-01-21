import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonButton, IonFooter, IonContent } from '@ionic/angular/standalone';
import { AuthService } from 'src/app/auth/services/auth.service';
import { Header } from '../components/header/header';
import { MessagesService } from 'src/app/auth/services/messages.service';
import { TextBox } from '../components/text-box/text-box';
import { Messages } from '../components/messages/messages';

@Component({
  selector: 'chat-page',
  imports: [IonButton, Header, TextBox, IonFooter, IonContent, Messages],
  templateUrl: './chat-page.html',
  styleUrls: ['./chat.page.scss'],
})
export class ChatPage {
  private authService = inject(AuthService);
  private router = inject(Router);
  private messageService = inject(MessagesService);

  async testMessage() {
    const key = await this.messageService.addMessage('Soy un mensaje ');
    console.log('Mensaje guardado con key');
  }

  async onLogOut() {
    await this.authService.logOut();

    await this.router.navigateByUrl('/login');
  }
}
