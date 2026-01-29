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
  private suppressUntil = 0;

  //Estado UI
  loadingOlder = false;
  noMoreMessages = false;
  firstScrollDone = false;
  showInfinite = signal(true);

  //Para comprobar que la vista está cargada.
  private viewReady = signal(false);

  ngAfterViewInit() {
    this.viewReady.set(true);
  }

  //Reacciona cuando ya hay mensajes Y la vista está cargada, haciendo el primer scroll
  constructor() {
    //EFFECT 1 para rehabilitar infinite cuando LoadLastMessages() resetea a los últimos diez

    effect(() => {
      const count = this.messagesService.messages().length;

      console.log('[rehabEffect] tick', {
        lastCount: this.lastCount,
        count,
        noMoreMessages: this.noMoreMessages,
        infiniteDisabled: this.infinite?.disabled,
      });

      //  Suprimir ionInfinite un instante cuando hay "reset" real a últimos 10 (veníamos de tener más de 10 cargados)
      if (this.firstScrollDone && this.lastCount > 10 && count === 10) {
        this.suppressUntil = Date.now() + 700;
        console.log('[rehabEffect] suppressUntil set (reset to last 10)');
      }

      //  Si el infinite estaba desactivado por haber llegado al mensaje 1, reactivarlo
      if (this.infinite?.disabled && count > 0) {
        console.log('[rehabEffect] infinite estaba disabled -> reactivando');

        this.noMoreMessages = false;
        this.loadingOlder = false;

        // 1) Reiniciar el componente para limpiar estado interno
        this.showInfinite.set(false);

        requestAnimationFrame(() => {
          this.showInfinite.set(true);

          // 2) Bloquear triggers durante el reflow/scroll que ocurre al resetear
          this.suppressUntil = Date.now() + 700;
          console.log('[rehabEffect] suppressUntil set (rearm from disabled)');

          // 3) Asegurar que el NUEVO infinite queda habilitado
          requestAnimationFrame(() => {
            if (this.infinite) this.infinite.disabled = false;
          });
        });

        console.log('[rehabEffect] re-enabled (requested)');
      }

      // Rearmar Ionic tras el reset a últimos 10 (2 frames después)
      if (
        this.firstScrollDone &&
        count === 10 &&
        !this.noMoreMessages &&
        this.infinite &&
        !this.infinite.disabled
      ) {
        requestAnimationFrame(() =>
          requestAnimationFrame(async () => {
            const el = await this.content.getScrollElement();
            el.scrollTop += 1;
            el.scrollTop -= 1;
            console.log('[rehabEffect] micro-tick scroll to rearm');
          }),
        );
      }

      //  Guardar el count para comparar en el siguiente tick
      this.lastCount = count;
    });

    //EFFECT 2 para hacer scroll al bottom cuando ya hay mensajes y la vista está lista
    effect(() => {
      const messages = this.messagesService.messages();
      const hasMessages = messages.length > 0;

      if (!hasMessages) return;
      if (!this.viewReady()) return;
      if (this.firstScrollDone) return;

      //Esperamos al siguiente frame para asegurar que el DOM ya tiene la altura real.

      requestAnimationFrame(() => {
        this.suppressUntil = Date.now() + 700;
        console.log('[init] supressUntil set (initial scroll)');

        this.content.scrollToBottom(0).then(() => {
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
    console.log('[ionInfinite] fired', {
      loadingOlder: this.loadingOlder,
      noMoreMessages: this.noMoreMessages,
      infiniteDisabled: this.infinite?.disabled,
      eventTargetDisabled: $event.target.disabled,
    });

    const now = Date.now();
    if (now < this.suppressUntil) {
      console.log('[ionInfinite] SUPPRESSED (time window)');
      $event.target.complete();
      return;
    }

    if (this.loadingOlder || this.noMoreMessages) {
      $event.target.complete();
      return;
    }

    this.loadingOlder = true;

    const scrollElement = await this.content.getScrollElement();

    console.log('[ionInfinite] scroll metrics', {
      scrollTop: scrollElement.scrollTop,
      scrollHeight: scrollElement.scrollHeight,
      clientHeight: scrollElement.clientHeight,
    });

    const prevScrollHeight = scrollElement.scrollHeight;
    const prevScrollTop = scrollElement.scrollTop;

    const added = await this.messagesService.loadMoreMessages();
    console.log('[ionInfinite] loadMoreMessages result', { added });

    if (added === 0) {
      console.log('[ionInfinite] END-OF-LIST BEFORE', {
        noMoreMessages: this.noMoreMessages,
        infiniteDisabled: this.infinite?.disabled,
        eventTargetDisabled: $event.target.disabled,
      });

      this.noMoreMessages = true;
      $event.target.disabled = true;
      this.infinite.disabled = true;

      console.log('[ionInfinite] disabled set', {
        eventTargetDisabled: $event.target.disabled,
        infiniteDisabled: this.infinite?.disabled,
        noMoreMessages: this.noMoreMessages,
      });

      this.loadingOlder = false;
      $event.target.complete();

      console.log('[ionInfinite] END-OF-LIST AFTER', {
        noMoreMessages: this.noMoreMessages,
        infiniteDisabled: this.infinite?.disabled,
        eventTargetDisabled: $event.target.disabled,
      });

      return;
    }

    await new Promise<void>((r) => requestAnimationFrame(() => r()));

    const newScrollHeight = scrollElement.scrollHeight;
    const difference = newScrollHeight - prevScrollHeight;

    scrollElement.scrollTop = prevScrollTop + difference;
    scrollElement.scrollTop += 1;

    this.loadingOlder = false;
    $event.target.complete();
  }
}
