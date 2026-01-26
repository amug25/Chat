import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonButton,
  IonFooter,
  IonContent,
  IonInfiniteScrollContent,
  IonInfiniteScroll,
} from '@ionic/angular/standalone';
import { AuthService } from 'src/app/services/auth.service';
import { Header } from '../components/header/header';
import { MessagesService } from 'src/app/services/messages.service';
import { TextBox } from '../components/text-box/text-box';
import { Messages } from '../components/messages/messages';
import { InfiniteScrollCustomEvent } from '../interfaces/chat.interface';

@Component({
  selector: 'chat-page',
  imports: [
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonButton,
    Header,
    TextBox,
    IonFooter,
    IonContent,
    Messages,
  ],
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

  onIonInfinite($event: InfiniteScrollCustomEvent) {
    console.log('Infinite trigger ', $event);
    this.messageService.loadMoreMessages();
    setTimeout(() => {
      $event.target.complete();
    }, 500);
  }
}
