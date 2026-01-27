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
      console.log('Infinite cancelado: loading Older o noMoreMessages');
      $event.target.complete();
      return;
    }
    this.loadingOlder = true;

    //Medimos ANTES de prepender
    const scrollElement = await this.content.getScrollElement();
    const prevHeight = scrollElement.scrollHeight;
    const prevTop = scrollElement.scrollTop;

    //Guardar longitud actual (medir diferencia)
    const prevCount = this.messagesService.messages().length;
    const prevOldest = this.messagesService.oldestMessage();

    console.log('----INFINITE START----');
    console.log('PREVcOUNT: ', prevCount);
    console.log('prevTop: ', prevTop);
    console.log('prevHeigth: ', prevHeight);
    console.log('prevOldest: ', prevOldest);

    await this.messagesService.loadMoreMessages();

    //Llegaron más?
    const newCount = this.messagesService.messages().length;
    const newOldest = this.messagesService.oldestMessage();

    console.log('Después de loadMoreMessages -> newCount: ', newCount);
    console.log('newOldest: ', newOldest);
    if (newCount <= prevCount) {
      console.log('BAD newCount <=prevCount -> Marcando noMoreMessages = true');
      //!Aquí está el problema de limitar a 20
      this.noMoreMessages = true;
    } else {
      console.log('GOOD Han llegado más mensajes');
    }

    //Preservar posición: Compensar el crecimiento de altura
    requestAnimationFrame(() => {
      const newHeight = scrollElement.scrollHeight;
      const difference = newHeight - prevHeight;

      console.log('newHeight: ', newHeight);
      console.log('diferencia añadida: ', difference);
      console.log('nuevo scrollTop: ', prevTop + difference);

      scrollElement.scrollTop = prevTop + difference;
      this.loadingOlder = false;
      $event.target.complete();

      console.log('Infinite END');
    });
  }
}
