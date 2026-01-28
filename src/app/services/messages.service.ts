import { computed, inject, Injectable, signal } from '@angular/core';
import {
  Database,
  endAt,
  get,
  limitToLast,
  onValue,
  push,
  ref,
  serverTimestamp,
} from '@angular/fire/database';
import { ChatMessage } from 'src/app/chat/interfaces/chat.interface';
import { AuthService } from './auth.service';
import { orderByChild, query } from 'firebase/database';

@Injectable({ providedIn: 'root' })
export class MessagesService {
  private authService = inject(AuthService);
  private db = inject(Database);

  private unsub?: () => void;

  messages = signal<ChatMessage[]>([]);

  oldestMessage = computed(() => {
    const list = this.messages();
    let min: number | null = null;
    for (const msg of list) {
      if (typeof msg.timestamp !== 'number') continue;
      if (min === null) {
        min = msg.timestamp;
      } else {
        min = Math.min(min, msg.timestamp);
      }
    }
    return min;
  });

  async addMessage(textMessage: string | null): Promise<string | null> {
    if (!textMessage || textMessage.trim() === '') {
      console.log('Se envió un mensaje vacío ', { textMessage });
      return null;
    }
    const user = this.authService.chatUser();

    if (!user) {
      console.log('addMessage requiere un usuario logueado');
      return null;
    }

    const message: ChatMessage = {
      uid: user.uid,
      text: textMessage?.trim() ?? '',
      timestamp: serverTimestamp(),
      name: user.displayName ?? 'Anónimo',
      profilePicUrl: user.photoURL ?? null,
    };

    const newRef = await push(ref(this.db, 'messages'), message);
    console.log('Mensaje guardado en db, referencia: ', newRef.key);
    return newRef.key;
  }

  // async showMessages() {
  //   const messagesRef = ref(this.db, 'messages');
  //   onChildAdded(messagesRef, (snapshot: DataSnapshot) => {
  //     const id = snapshot.key ?? '';

  //     const data = snapshot.val();
  //     this.messages.update((current) => [...current, { id, ...data }]);
  //   });
  // }

  loadLastMessages() {
    this.unsub?.();
    const messagesRef = ref(this.db, 'messages');
    const q = query(messagesRef, orderByChild('timestamp'), limitToLast(10));

    this.unsub = onValue(q, (snapshot) => {
      const result: ChatMessage[] = [];
      snapshot.forEach((child) => {
        const id = child.key ?? '';
        const data = child.val() as ChatMessage;
        result.push({ id, ...data });
        return false;
      });
      this.messages.set(result);
    });
  }

  stop() {
    this.unsub?.();
  }

  async loadMoreMessages() {
    const oldest = this.oldestMessage();
    console.log('[service] oldest antes:', oldest);

    if (oldest === null) {
      console.log('[service] oldest es null -> no se paginará');
      return;
    }

    const messagesRef = ref(this.db, 'messages');
    const q = query(
      messagesRef,
      orderByChild('timestamp'),
      endAt(oldest - 1),
      limitToLast(10),
    );

    const snapshot = await get(q);
    const older: ChatMessage[] = [];
    snapshot.forEach((child) => {
      const id = child.key ?? '';
      const data = child.val() as ChatMessage;
      older.push({ id, ...data });
    });
    console.log('[service] older.length: ', older.length);

    if (older.length === 0) {
      console.log('[service] No llegaron mensajes antiguos');
      return;
    }

    const current = this.messages();
    const currentIds = new Set(current.map((msg) => msg.id));
    const olderWithoutDuplicates = older.filter(
      (msg) => !currentIds.has(msg.id),
    );

    console.log(
      '[service] olderWithputDuplicates.length: ',
      olderWithoutDuplicates.length,
    );

    if (olderWithoutDuplicates.length === 0) {
      console.log('[service] Todos eran duplicados');
      return 0;
    }
    this.messages.set([...olderWithoutDuplicates, ...current]);

    console.log('[service] nuevo oldest: ', this.oldestMessage());
    return olderWithoutDuplicates.length;
  }
}
