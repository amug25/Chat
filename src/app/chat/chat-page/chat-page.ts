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
  IonFooter,
  IonContent,
  IonInfiniteScrollContent,
  IonInfiniteScroll,
} from '@ionic/angular/standalone';
import { AuthService } from 'src/app/auth/services/auth.service';
import { Header } from '../components/header/header';
import { MessagesService } from 'src/app/chat/services/messages.service';
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
  @ViewChild(IonInfiniteScroll) infinite!: IonInfiniteScroll;

  private authService = inject(AuthService);
  private router = inject(Router);
  private messagesService = inject(MessagesService);
  private lastCount = 0;
  private lastNewestId: string | null = null;
  private suppressUntil = 0;

  loadingOlder = false;
  noMoreMessages = false;
  firstScrollDone = false;
  headerTitle = 'Chat';
  headerAvatarUrl: string | null = null;

  showInfinite = signal(true);
  private viewReady = signal(false);

  ngAfterViewInit() {
    this.viewReady.set(true);
  }

  constructor() {
    //EFFECT 1 para rehabilitar infinite cuando LoadLastMessages() resetea a los últimos diez

    effect(() => {
      const list = this.messagesService.messages();
      const count = list.length;
      const newestId = count ? (list[count - 1]?.id ?? null) : null;

      if (
        this.firstScrollDone &&
        !this.loadingOlder &&
        newestId &&
        newestId !== this.lastNewestId
      ) {
        //aunque count siga en 10 bloquea triggers fantasmas. Para cuando mando mensajes seguidos
        this.suppressUntil = Date.now() + 700;
      }
      this.lastNewestId = newestId;

      if (this.firstScrollDone && this.lastCount > 10 && count === 10) {
        this.suppressUntil = Date.now() + 700;
      }

      //  Si el infinite estaba desactivado por haber llegado al mensaje 1, reactivarlo
      if (this.infinite?.disabled && count > 0) {
        this.noMoreMessages = false;
        this.loadingOlder = false;

        this.showInfinite.set(false);

        requestAnimationFrame(() => {
          this.showInfinite.set(true);

          this.suppressUntil = Date.now() + 700;

          requestAnimationFrame(() => {
            if (this.infinite) this.infinite.disabled = false;
          });
        });
      }

      if (
        this.firstScrollDone &&
        count === 10 &&
        !this.noMoreMessages &&
        this.infinite &&
        !this.infinite.disabled
      ) {
        requestAnimationFrame(() =>
          requestAnimationFrame(async () => {
            const element = await this.content.getScrollElement();
            element.scrollTop += 1;
            element.scrollTop -= 1;
          }),
        );
      }

      this.lastCount = count;
    });

    //EFFECT 2 para hacer scroll al bottom cuando ya hay mensajes y la vista está lista
    effect(() => {
      const messages = this.messagesService.messages();
      const hasMessages = messages.length > 0;

      if (!hasMessages) return;
      if (!this.viewReady()) return;
      if (this.firstScrollDone) return;

      requestAnimationFrame(() => {
        this.suppressUntil = Date.now() + 700;

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
    const now = Date.now();
    if (now < this.suppressUntil) {
      $event.target.complete();
      return;
    }

    if (this.loadingOlder || this.noMoreMessages) {
      $event.target.complete();
      return;
    }

    this.loadingOlder = true;

    const scrollElement = await this.content.getScrollElement();

    const prevScrollHeight = scrollElement.scrollHeight;
    const prevScrollTop = scrollElement.scrollTop;

    const added = await this.messagesService.loadMoreMessages();

    if (added === 0) {
      this.noMoreMessages = true;
      $event.target.disabled = true;
      this.infinite.disabled = true;

      this.loadingOlder = false;
      $event.target.complete();

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
