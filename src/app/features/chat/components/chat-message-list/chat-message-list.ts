import { afterNextRender, Component, DestroyRef, ElementRef, inject, input } from '@angular/core';

import { ChatMessage as ChatMessageModel } from '../../../../core/models/chat';
import { ChatMessage } from '../chat-message/chat-message';

const SCROLL_BOTTOM_THRESHOLD = 80;

@Component({
  selector: 'app-chat-message-list',
  templateUrl: './chat-message-list.html',
  imports: [ChatMessage],
})
export class ChatMessageList {
  readonly messages = input.required<ChatMessageModel[]>();

  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      const messageList = this.elementRef.nativeElement;
      const scrollContainer = messageList.closest<HTMLElement>('.chat__body');

      if (!scrollContainer) {
        return;
      }

      let shouldStickToBottom = true;

      const updateScrollState = () => {
        shouldStickToBottom =
          scrollContainer.scrollHeight -
            scrollContainer.scrollTop -
            scrollContainer.clientHeight <=
          SCROLL_BOTTOM_THRESHOLD;
      };

      const scrollToBottom = () => {
        if (!shouldStickToBottom) {
          return;
        }

        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: 'auto',
        });
      };

      const handleScroll = () => {
        updateScrollState();
      };

      const resizeObserver = new ResizeObserver(() => {
        scrollToBottom();
      });

      scrollContainer.addEventListener('scroll', handleScroll, {
        passive: true,
      });
      resizeObserver.observe(messageList);

      scrollToBottom();

      this.destroyRef.onDestroy(() => {
        scrollContainer.removeEventListener('scroll', handleScroll);
        resizeObserver.disconnect();
      });
    });
  }
}
