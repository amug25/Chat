import {
  AfterViewInit,
  Component,
  effect,
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
    IonButton,
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
      $event.target.complete();
      return;
    }
    this.loadingOlder = true;

    //Medimos el estado ANTES de prepender
    const scrollElement = await this.content.getScrollElement();
    const prevHeight = scrollElement.scrollHeight;
    const prevTop = scrollElement.scrollTop;

    //Guardar longitud actual para inferir si cargamos algo
    const prevCount = this.messagesService.messages().length;

    //Cargamos más mensajes
    await this.messagesService.loadMoreMessages();

    //Comprobar si realmente llegaron más
    const newCount = this.messagesService.messages().length;
    if (newCount <= prevCount) {
      this.noMoreMessages = true; //no hay más
    }

    //Preservar posición: Compensar el crecimiento de altura
    requestAnimationFrame(() => {
      const newHeight = scrollElement.scrollHeight;
      const difference = newHeight - prevHeight;

      scrollElement.scrollTop = prevTop + difference;
      this.loadingOlder = false;
      $event.target.complete();
    });
  }
}
