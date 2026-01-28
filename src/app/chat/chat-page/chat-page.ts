import {
  AfterViewInit,
  Component,
  effect,
  ElementRef,
  inject,
  signal,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  IonButton,
  IonFooter,
  IonContent,
  IonInfiniteScrollContent,
  IonInfiniteScroll,
} from '@ionic/angular/standalone';
import { AuthService } from 'src/app/services/auth.service';
import { Header } from '../components/header/header';
import { MessagesService } from 'src/app/services/messages.service';
import { TextBox } from '../components/text-box/text-box';
import { Messages } from '../components/messages/messages';
import { InfiniteScrollCustomEvent } from '../interfaces/chat.interface';

@Component({
  selector: 'chat-page',
  imports: [
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    Header,
    TextBox,
    IonFooter,
    IonContent,
    Messages,
  ],
  templateUrl: './chat-page.html',
  styleUrls: ['./chat.page.scss'],
})
export class ChatPage implements AfterViewInit {
  @ViewChild(IonContent) content!: IonContent;
  @ViewChild('messagesComp') messagesComp!: Messages;

  private authService = inject(AuthService);
  private router = inject(Router);
  private messagesService = inject(MessagesService);

  //Estado UI
  loadingOlder = false;
  noMoreMessages = false;
  firstScrollDone = false;

  //Para comprobar que la vista está cargada.
  private viewReady = signal(false);

  ngAfterViewInit() {
    this.viewReady.set(true);
  }

  //Reacciona cuando ya hay mensajes Y la vista está cargada, haciendo el primer scroll
  constructor() {
    effect(() => {
      const messages = this.messagesService.messages();
      const hasMessages = messages.length > 0;

      if (!hasMessages) return;
      if (!this.viewReady()) return;
      if (this.firstScrollDone) return;

      //Esperamos al siguiente frame para asegurar que el DOM ya tiene la altura real.

      requestAnimationFrame(() => {
        this.content.scrollToBottom(0).then(() => {
          //Solo después de habernos colocado abajo, encendemos el scroll
          this.firstScrollDone = true;
        });
      });
    });
  }

  async onLogOut() {
    await this.authService.logOut();

    await this.router.navigateByUrl('/login');
  }

  async onIonInfinite($event: InfiniteScrollCustomEvent) {
    if (this.loadingOlder || this.noMoreMessages) {
      console.log('Infinite cancelado: loading Older o noMoreMessages');
      $event.target.complete();
      return;
    }
    this.loadingOlder = true;

    //obtener scrollElement
    const scrollElement = await this.content.getScrollElement();

    //medir altura antes

    const prevScrollHeight = scrollElement.scrollHeight;
    const prevScrollTop = scrollElement.scrollTop;

    //Cargar mensajes
    const added = await this.messagesService.loadMoreMessages();

    //Si no hay más o es la última página desactivar EVENT
    const PAGE_SIZE = 10;

    if (added < PAGE_SIZE) {
      this.noMoreMessages = true;
      $event.target.disabled = true;
      this.loadingOlder = false;
      $event.target.complete();
      return;
    }

    //Esperar a pintar prepend
    await new Promise<void>((r) => requestAnimationFrame(() => r()));

    //Ajuste altura
    const newScrollHeight = scrollElement.scrollHeight;
    const difference = newScrollHeight - prevScrollHeight;

    //mantener punto de vista
    scrollElement.scrollTop = prevScrollTop + difference;

    //empujoncito para salir del treshold y evitar loop:

    scrollElement.scrollTop += 1;

    //Decidir si no hay más mensajes
    if (added === 0) {
      this.noMoreMessages = true;
    }

    this.loadingOlder = false;
    $event.target.complete();
  }
}
