import { ChatTimestampPipe } from 'src/app/chat/pipes/chat-timestamp.pipe';

import {
  Component,
  computed,
  effect,
  ElementRef,
  EventEmitter,
  inject,
  Output,
  ViewChild,
} from '@angular/core';
import { AuthService } from 'src/app/auth/services/auth.service';
import { MessagesService } from 'src/app/chat/services/messages.service';

@Component({
  selector: 'messages',
  imports: [ChatTimestampPipe],
  templateUrl: './messages.html',
})
export class Messages {
  @Output() titleChange = new EventEmitter<string>();
  @ViewChild('topAnchor', { read: ElementRef }) topAnchor!: ElementRef;

  constructor(){
    effect(()=>{
      const name = this.otherUserName();
      this.titleChange.emit(name ? `Chat: ${name}`: 'Chat');
    })
  }

  get anchorRef(): ElementRef | null {
    return this.topAnchor ?? null;
  }
  messagesService = inject(MessagesService);
  authService = inject(AuthService);

  ngOnInit() {
    this.messagesService.loadLastMessages();
  }

  myUid = computed(() => this.authService.userData()?.uid ?? null);

  otherUserName = computed(()=>{
    const list = this.messagesService.messages();
    const mine = this.myUid();

    const other = list.find((msg)=> msg.uid !== mine && !!msg.name)
    return other?.name ?? '...';
  })

  isMe(uid: string) {
    return uid === this.myUid();
  }


  ngOnDestroy() {
    this.messagesService.stop();
  }
}
