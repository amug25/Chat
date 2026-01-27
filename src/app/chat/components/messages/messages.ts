import { ChatTimestampPipe } from 'src/app/pipes/chat-timestamp.pipe';

import { Component, computed, inject } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { MessagesService } from 'src/app/services/messages.service';

@Component({
  selector: 'messages',
  imports: [ChatTimestampPipe],
  templateUrl: './messages.html',
})
export class Messages {
  messagesService = inject(MessagesService);
  authService = inject(AuthService);

  // async ngOnInit() {
  //   await this.messagesService.loadLastMessages();
  // }

  myUid = computed(() => this.authService.userData()?.uid ?? null);

  isMe(uid: string) {
    return uid === this.myUid();
  }

  ngOnDestroy() {
    this.messagesService.stop();
  }
}
