import { Injectable, signal } from '@angular/core';
import { Auth, authState, GoogleAuthProvider } from '@angular/fire/auth';
import { signInWithPopup, signOut, User } from 'firebase/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  userData = signal<User | null>(null);

  constructor(private auth: Auth) {
    authState(this.auth).subscribe((user) => {
      this.userData.set(user || null);
    });
  }

  async loginWithGoogle(): Promise<User> {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(this.auth, provider);

    return result.user;
  }

  async logOut(): Promise<void> {
    await signOut(this.auth);
    this.userData.set(null);
  }
}
