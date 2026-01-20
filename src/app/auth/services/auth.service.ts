import { Injectable, signal } from '@angular/core';
import { Auth, authState, GoogleAuthProvider } from '@angular/fire/auth';
import { Database } from '@angular/fire/database';

import { signInWithPopup, signOut, User } from 'firebase/auth';
import { ChatUser } from 'src/app/chat/interfaces/chat.interface';

@Injectable({ providedIn: 'root' })
export class AuthService {
  userData = signal<User | null>(null);

  chatUser = signal<ChatUser | null>(null);

  constructor(private auth: Auth, private db: Database) {
    authState(this.auth).subscribe((user) => {
      this.userData.set(user || null);

      //Mapeo
      this.chatUser.set(
        user
          ? {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName ?? undefined,
              photoURL: user.photoURL ?? undefined,
              lastLogin: Date.now(),
            }
          : null
      );
    });
  }

  async loginWithGoogle(): Promise<User> {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(this.auth, provider);

    return result.user;
  }

  async logOut(): Promise<void> {
    console.log(this.chatUser());
    await signOut(this.auth);
    this.userData.set(null);
    this.chatUser.set(null);
  }
}
