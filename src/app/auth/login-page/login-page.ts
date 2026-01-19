import { Component, inject } from '@angular/core';
import {
  IonButton,
  IonIcon,
  IonHeader,
  IonContent,
  IonToolbar,
  IonTitle,
} from '@ionic/angular/standalone';
import { AuthService } from '../services/auth.service';
import { addIcons } from 'ionicons';
import { logoGoogle } from 'ionicons/icons';
import { Router } from '@angular/router';

addIcons({ logoGoogle });
@Component({
  selector: 'login-page',
  imports: [IonTitle, IonToolbar, IonContent, IonHeader, IonIcon, IonButton],
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
