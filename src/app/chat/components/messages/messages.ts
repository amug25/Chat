import { ChatTimestampPipe } from 'src/app/pipes/chat-timestamp.pipe';

import {
  Component,
  computed,
  ElementRef,
  inject,
  ViewChild,
} from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { MessagesService } from 'src/app/services/messages.service';

@Component({
  selector: 'messages',
  imports: [ChatTimestampPipe],
  templateUrl: './messages.html',
})
export class Messages {
  @ViewChild('topAnchor', { read: ElementRef }) topAnchor!: ElementRef;

  get anchorRef(): ElementRef | null {
    return this.topAnchor ?? null;
  }
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
