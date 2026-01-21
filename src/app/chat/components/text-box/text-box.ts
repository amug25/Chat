import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonFooter, IonToolbar, IonTitle } from '@ionic/angular/standalone';
import { MessagesService } from 'src/app/auth/services/messages.service';

@Component({
  selector: 'text-box',
  imports: [IonTitle, IonToolbar, IonFooter, ReactiveFormsModule],
  templateUrl: './text-box.html',
})
export class TextBox {
  private messageService = inject(MessagesService);

  messageControl = new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(500)],
  });

  onSend() {
    if (this.messageControl.invalid) {
      console.log('El mensaje solo puede tener un máximo de 500 caracteres');

      //TODO: Lanzar un mensaje visible de error.
    }

    const text = this.messageControl.value;
    if (!text) return;

    this.messageService.addMessage(text);
    this.messageControl.reset('');
  }
}
