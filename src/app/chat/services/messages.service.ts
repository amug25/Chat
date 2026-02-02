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
  update,
} from '@angular/fire/database';
import { ChatMessage } from 'src/app/chat/interfaces/chat.interface';
import { AuthService } from '../../auth/services/auth.service';
import { orderByChild, query } from 'firebase/database';
import { LocationService } from './location.service';

@Injectable({ providedIn: 'root' })
export class MessagesService {
  private authService = inject(AuthService);
  private db = inject(Database);
  private locationService = inject(LocationService);

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

    if (newRef.key) {
      this.locationService.getCurrentLocation().then((location) => {
        if (!location) return;
        update(ref(this.db, `messages/${newRef.key}`), { location: location });
      });
      console.log('[addMessage] location= ', location);
    }

    return newRef.key;
  }

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

  async loadMoreMessages(): Promise<number> {
    const oldest = this.oldestMessage();

    if (oldest === null) {
      console.log('[service] oldest es null -> no se paginará');
      return 0;
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

    if (older.length === 0) {
      return 0;
    }

    const current = this.messages();
    const currentIds = new Set(current.map((msg) => msg.id));
    const olderWithoutDuplicates = older.filter(
      (msg) => !currentIds.has(msg.id),
    );

    if (olderWithoutDuplicates.length === 0) {
      return 0;
    }
    this.messages.set([...olderWithoutDuplicates, ...current]);

    return olderWithoutDuplicates.length;
  }
}
