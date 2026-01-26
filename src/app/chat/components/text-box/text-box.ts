import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonToolbar } from '@ionic/angular/standalone';
import { MessagesService } from 'src/app/services/messages.service';

@Component({
  selector: 'text-box',
  imports: [IonToolbar, ReactiveFormsModule],
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
      console.log('El mensaje debe tener entre 1 y 500 caracteres');

      //TODO: Lanzar un mensaje visible de error.
    }

    const text = this.messageControl.value;
    if (!text) return;

    this.messageService.addMessage(text);
    this.messageControl.reset('');
  }
}
