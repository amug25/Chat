import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-header',
  imports: [IonTitle, IonToolbar, IonHeader, IonButtons, IonButton, IonIcon],
  templateUrl: './header.html',
})
export class Header {
  @Input() title = '';
  @Input() showRightButton = false;
  @Input() rightIcon = 'log-out-outline';

  @Output() rigthClick = new EventEmitter<void>();
}
