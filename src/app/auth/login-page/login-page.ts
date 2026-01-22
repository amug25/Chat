import { Component, inject } from '@angular/core';
import { IonButton, IonIcon, IonContent } from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth.service';

import { Router } from '@angular/router';
import { Header } from 'src/app/chat/components/header/header';

@Component({
  selector: 'login-page',
  imports: [IonContent, IonIcon, IonButton, Header],
  templateUrl: './login-page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  private router = inject(Router);
  private authService: AuthService = inject(AuthService);

  public async signInWithGoogle() {
    await this.authService.loginWithGoogle();

    await this.router.navigateByUrl('/chat');
  }
}
