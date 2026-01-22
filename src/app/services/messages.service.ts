import { inject, Injectable, signal } from '@angular/core';
import { Database, push, ref, serverTimestamp } from '@angular/fire/database';
import { ChatMessage } from 'src/app/chat/interfaces/chat.interface';
import { AuthService } from './auth.service';
import { DataSnapshot, onChildAdded } from 'firebase/database';

@Injectable({ providedIn: 'root' })
export class MessagesService {
  private authService = inject(AuthService);
  private db = inject(Database);

  messages = signal<ChatMessage[]>([]);

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

  async showMessages() {
    const messagesRef = ref(this.db, 'messages');
    onChildAdded(messagesRef, (snapshot: DataSnapshot) => {
      const id = snapshot.key ?? '';

      const data = snapshot.val();
      this.messages.update((current) => [...current, { id, ...data }]);
    });
  }
}
