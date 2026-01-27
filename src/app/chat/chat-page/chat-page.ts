import { AfterViewInit, Component, inject, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import {
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
export class ChatPage {
  private authService = inject(AuthService);
  private router = inject(Router);
  private messageService = inject(MessagesService);

  @ViewChild('content', { static: true }) content!: IonContent;

  lastScrollTop: number | null = null;
  scrollDirection: 'up' | 'down' = 'down';

  loadingMore = false;

  async ionViewDidEnter() {
    await this.messageService.loadLastMessages();
    this.messageService.listenNewMessages();

    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );

    await this.content.scrollToBottom(0);

    const elScroll = await this.content.getScrollElement();
    this.lastScrollTop = elScroll.scrollTop;
    this.scrollDirection = 'down';
  }

  onScroll(event: any) {
    const sTop = event.detail?.scrollTop ?? 0;

    if (this.lastScrollTop === null) {
      this.lastScrollTop = sTop;
      return;
    }

    this.scrollDirection = sTop < this.lastScrollTop ? 'up' : 'down';
    this.lastScrollTop = sTop;
  }

  async onIonInfinite(event: InfiniteScrollCustomEvent) {
    const scrollElement = await this.content.getScrollElement();
    console.log('dir', this.scrollDirection, 'top', scrollElement.scrollTop);

    if (this.loadingMore) {
      event.target.complete();
      return;
    }
    this.loadingMore = true;

    if (scrollElement.scrollHeight <= scrollElement.clientHeight + 1) {
      event.target.complete();
      this.loadingMore = false;
      return;
    }

    const NEAR_TOP_PX = 80;

    if (this.scrollDirection !== 'up') {
      event.target.complete();
      this.loadingMore = false;
      return;
    }

    if (scrollElement.scrollTop > NEAR_TOP_PX) {
      event.target.complete();
      this.loadingMore = false;
      return;
    }

    const prevScrollHeight = scrollElement.scrollHeight;
    const prevScrollTop = scrollElement.scrollTop;

    const added = await this.messageService.loadMoreMessages();

    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );

    const newScrollHeight = scrollElement.scrollHeight;
    const diferenceHeight = newScrollHeight - prevScrollHeight;

    scrollElement.scrollTop = prevScrollTop + diferenceHeight;

    this.lastScrollTop = scrollElement.scrollTop;
    this.scrollDirection = 'up';

    event.target.complete();

    if (added === 0) {
      event.target.disabled = true;
    } else {
      event.target.disabled = false;
    }

    this.loadingMore = false;
  }

  async onLogOut() {
    await this.authService.logOut();

    await this.router.navigateByUrl('/login');
  }

  ngOnDestroy() {
    this.messageService.stop();
  }
}
