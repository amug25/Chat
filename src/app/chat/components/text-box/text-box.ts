import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonToolbar, IonToast } from '@ionic/angular/standalone';
import { MessagesService } from 'src/app/chat/services/messages.service';

@Component({
  selector: 'text-box',
  imports: [IonToolbar, ReactiveFormsModule, IonToast],
  templateUrl: './text-box.html',
})
export class TextBox {
  private messageService = inject(MessagesService);

  messageControl = new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(500)],
  });

  showToast = false;
  toastMessage = '';

  private openToast(msg: string){
    this.toastMessage = msg;
    this.showToast = true;
  }

  onSend() {
    if (this.messageControl.value.trim() === ''){
      this.openToast('No puedes mandar un mensaje vacío.');
      this.messageControl.reset('');
      return;
    }

    if (this.messageControl.invalid) {
      console.log('El mensaje debe tener entre 1 y 500 caracteres');
      const error = this.messageControl.errors;

      if(error?.['required']){
        this.openToast('Escribe un mensaje antes de enviar.');
      }else if(error?.['maxlength']){
        this.openToast('Máximo 500 caracteres.');
      }else {
        this.openToast('Mensaje no válido.');
      }
      return;
    }

    const text = this.messageControl.value;
    if (!text){
      this.openToast('Escribe un mensaje antes de enviar.');
      return;
    }

    this.messageService.addMessage(text);
    this.messageControl.reset('');
  }
}
