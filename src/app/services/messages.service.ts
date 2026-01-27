import { computed, inject, Injectable, signal } from '@angular/core';
import {
  Database,
  endAt,
  get,
  limitToFirst,
  limitToLast,
  onChildAdded,
  push,
  ref,
  serverTimestamp,
  startAfter,
} from '@angular/fire/database';
import { ChatMessage } from 'src/app/chat/interfaces/chat.interface';
import { AuthService } from './auth.service';
import { child, DataSnapshot, orderByKey, query } from 'firebase/database';

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
  // const messagesRef = ref(this.db, 'messages');
  // onChildAdded(messagesRef, (snapshot: DataSnapshot) => {
  //   const id = snapshot.key ?? '';

  //   const data = snapshot.val();
  //   this.messages.update((current) => [...current, { id, ...data }]);
  // });

  async listenNewMessages() {
    this.unsub?.();
    const currentMessages = this.messages();
    const lastKeySaved = currentMessages[currentMessages.length - 1]?.id;

    const messagesRef = ref(this.db, 'messages');

    const checkForNew = lastKeySaved
      ? query(messagesRef, orderByKey(), startAfter(lastKeySaved))
      : query(messagesRef, orderByKey());

    this.unsub = onChildAdded(checkForNew, (snapshot) => {
      const result: ChatMessage[] = [];
      const id = snapshot.key ?? '';
      const data = snapshot.val() as ChatMessage;

      this.messages.update((list) => {
        if (list.some((msg) => msg.id === id)) return list;
        return [...list, { id, ...data }];
      });
    });
  }

  async loadLastMessages(): Promise<void> {
    this.unsub?.();
    const messagesRef = ref(this.db, 'messages');
    const q = query(messagesRef, orderByKey(), limitToLast(10));

    const snapshot = await get(q);

    const lastMessages: ChatMessage[] = [];
    snapshot.forEach((child) => {
      const id = child.key ?? '';
      const data = child.val() as ChatMessage;
      lastMessages.push({ id, ...data });
    });
    lastMessages.sort((a, b) => (a.id ?? '').localeCompare(b.id ?? ''));

    this.messages.set(lastMessages);
  }

  async loadMoreMessages(): Promise<number> {
    const currentMessages = this.messages();
    if (currentMessages.length === 0) return 0;

    const oldestKey = currentMessages.reduce<string | null>((min, msg) => {
      if (!msg.id) return min;
      if (min === null) return msg.id;
      return msg.id < min ? msg.id : min;
    }, null);

    if (!oldestKey) return 0;

    const messagesReff = ref(this.db, 'messages');

    const qOlder = query(
      messagesReff,
      orderByKey(),
      endAt(oldestKey),
      limitToLast(11),
    );

    const snapshotOlder = await get(qOlder);

    const receivedMessages: ChatMessage[] = [];
    snapshotOlder.forEach((child) => {
      const id = child.key ?? '';
      const data = child.val() as ChatMessage;
      receivedMessages.push({ id, ...data });
    });

    receivedMessages.sort((a, b) => (a.id ?? '').localeCompare(b.id ?? ''));

    const messagesNoOverlap = receivedMessages.filter(
      (mensaje) => mensaje.id !== oldestKey,
    );

    // Es el principio de la db?
    if (messagesNoOverlap.length === 0) {
      // Cuál es la primera key guardada en db
      const qFirst = query(messagesReff, orderByKey(), limitToFirst(1));
      const snapshotPrimero = await get(qFirst);

      let firstKeyInDB: string | null = null;
      snapshotPrimero.forEach((child) => {
        firstKeyInDB = child.key ?? null;
      });

      console.log('[loadMore] NO añade más. oldestKey=', oldestKey);
      console.log('[loadMore] firstKeyInDB=', firstKeyInDB);

      // Si coinciden, has llegado al inicio (según orden por key)
      return 0;
    }

    const messagesFinal = [...messagesNoOverlap, ...currentMessages].sort(
      (a, b) => (a.id ?? '').localeCompare(b.id ?? ''),
    );

    this.messages.set(messagesFinal);

    console.log(
      '[loadMore] añadidos=',
      messagesNoOverlap.length,
      'total=',
      messagesFinal.length,
      'oldestKey=',
      oldestKey,
    );

    return messagesNoOverlap.length;
  }

  stop() {
    this.unsub?.();
  }
}
