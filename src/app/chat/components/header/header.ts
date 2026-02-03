import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonAvatar,
  IonImg,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-header',
  imports: [
    IonImg,
    IonTitle,
    IonToolbar,
    IonHeader,
    IonButtons,
    IonButton,
    IonIcon,
    IonAvatar,
  ],
  templateUrl: './header.html',
  styleUrls: ['./header.scss'],
})
export class Header {
  @Input() title = '';
  @Input() showRightButton = false;
  @Input() rightIcon = 'log-out-outline';
  @Input() avatarUrl: string | null = null;

  @Output() rigthClick = new EventEmitter<void>();
}
