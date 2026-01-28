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
  @ViewChild(IonInfiniteScroll) infinite!: IonInfiniteScroll;

  private authService = inject(AuthService);
  private router = inject(Router);
  private messagesService = inject(MessagesService);
  private lastCount = 0;
  private suppressInfinite = false;

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
    //effect 1 para rehabilitar infinite cuando LoadLastMessages() resetea a los últimos diez

    effect(() => {
      const count = this.messagesService.messages().length;

      // Si el infinite estaba desactivado por haber llegado al inicio,
      // lo reactivamos cuando haya cualquier actualización de mensajes (onValue)
      console.log('[rehabEffect] tick', {
        lastCount: this.lastCount,
        count,
        noMoreMessages: this.noMoreMessages,
        infiniteDisabled: this.infinite?.disabled,
      });
      //Supresión de ionInfinite un instante para no disparar en el ajuste de cargar 10 últimos al enviar
      if (this.firstScrollDone && this.lastCount > 10 && count === 10) {
        this.suppressInfinite = true;
        requestAnimationFrame(() =>
          requestAnimationFrame(() => (this.suppressInfinite = false)),
        );
      }

      if (this.infinite?.disabled && count > 0) {
        console.log('[rehabEffect] infinite estaba disabled -> reactivando');
        this.noMoreMessages = false;
        this.loadingOlder = false;
        this.infinite.disabled = false;

        //Suprimir ionInfinite durante reajuste
        this.suppressInfinite = true;
        requestAnimationFrame(() =>
          requestAnimationFrame(() => (this.suppressInfinite = false)),
        );

        //Rearmar ionic tras re-habilitar (mandar mensaje)
        requestAnimationFrame(async () => {
          const scrollElement = await this.content.getScrollElement();
          scrollElement.scrollTop += 1;
          scrollElement.scrollTop -= 1;
        });
      }

      this.lastCount = count;
    });

    //effect 2 para hacer scroll al bottom cuando ya hay mensajes y la vista está lista
    effect(() => {
      const messages = this.messagesService.messages();
      const hasMessages = messages.length > 0;

      if (!hasMessages) return;
      if (!this.viewReady()) return;
      if (this.firstScrollDone) return;

      //Esperamos al siguiente frame para asegurar que el DOM ya tiene la altura real.

      requestAnimationFrame(() => {
        this.suppressInfinite = true;
        this.content.scrollToBottom(0).then(() => {
          this.firstScrollDone = true;
          // en el siguiente frame volvemos a permitir infinite
          requestAnimationFrame(() => {
            this.suppressInfinite = false;
          });
        });
      });
    });
  }

  async onLogOut() {
    await this.authService.logOut();

    await this.router.navigateByUrl('/login');
  }

  async onIonInfinite($event: InfiniteScrollCustomEvent) {
    console.log('[ionInfinite] fired', {
      loadingOlder: this.loadingOlder,
      noMoreMessages: this.noMoreMessages,
      infiniteDisabled: this.infinite?.disabled,
      eventTargetDisabled: $event.target.disabled,
    });

    if (this.suppressInfinite) {
      console.log('[ionInfinite] SUPRESSED (scroll programático)');
      $event.target.complete();
      return;
    }

    if (this.loadingOlder || this.noMoreMessages) {
      $event.target.complete();
      return;
    }
    this.loadingOlder = true;

    //obtener scrollElement
    const scrollElement = await this.content.getScrollElement();
    console.log('[ionInfinite] scroll metrics', {
      scrollTop: scrollElement.scrollTop,
      scrollHeigth: scrollElement.scrollHeight,
      clientHeigth: scrollElement.clientHeight,
    });

    //medir altura antes

    const prevScrollHeight = scrollElement.scrollHeight;
    const prevScrollTop = scrollElement.scrollTop;

    //Cargar mensajes
    const added = await this.messagesService.loadMoreMessages();
    console.log('[ionInfinite] loadMoreMessages result', { added });

    //Si no hay más o es la última página desactivar EVENT

    if (added === 0) {
      console.log('[ionInfinite] END-OF-LIST BEFORE', {
        noMoreMessages: this.noMoreMessages,
        infiniteDisabled: this.infinite?.disabled,
        eventTargetDisabled: $event.target.disabled,
      });

      this.noMoreMessages = true;
      $event.target.disabled = true;
      this.infinite.disabled = true;
      this.loadingOlder = false;
      $event.target.complete();

      console.log('[ionInfinite] END-OF-LIST AFTER', {
        noMoreMessages: this.noMoreMessages,
        infiniteDisabled: this.infinite?.disabled,
        eventTargetDisabled: $event.target.disabled,
      });

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

    this.loadingOlder = false;
    $event.target.complete();
  }
}
