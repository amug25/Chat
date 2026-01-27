import { InfiniteScrollCustomEvent } from './../../interfaces/chat.interface';
import { ChatTimestampPipe } from 'src/app/pipes/chat-timestamp.pipe';

import { Component, computed, inject } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { MessagesService } from 'src/app/services/messages.service';
import { push } from '@angular/fire/database';
import {
  IonList,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonItem,
} from '@ionic/angular/standalone';

@Component({
  selector: 'messages',
  imports: [
    IonItem,
    IonList,
    ChatTimestampPipe,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
  ],
  templateUrl: './messages.html',
})
export class Messages {
  messagesService = inject(MessagesService);
  authService = inject(AuthService);

  ngOnInit() {
    this.messagesService.loadLastMessages();
  }

  myUid = computed(() => this.authService.userData()?.uid ?? null);

  isMe(uid: string) {
    return uid === this.myUid();
  }

  ngOnDestroy() {
    this.messagesService.stop();
  }
}
