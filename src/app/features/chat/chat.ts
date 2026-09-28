import { Component, computed, inject, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ChatComposer } from './components/chat-composer/chat-composer';
import { ChatHeader } from './components/chat-header/chat-header';
import { ChatMessageList } from './components/chat-message-list/chat-message-list';
import { ChatSession } from '../../core/services/chat/chat-session';
import { getApiErrorMessage } from '../../core/services/api-error/api-error-message';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.html',
  styleUrl: './chat.scss',
  imports: [
    MatIconModule,
    MatProgressSpinnerModule,
    ChatHeader,
    ChatMessageList,
    ChatComposer,
  ],
  providers: [ChatSession],
})
export class Chat {
  readonly chat_id = input<string | undefined>();

  private readonly session = inject(ChatSession);
  private readonly sessionState = this.session.createResource(this.chat_id);

  readonly chatResource = this.sessionState.resource;
  readonly messages = this.sessionState.messages;

  readonly loading = this.chatResource.isLoading;
  readonly loadError = this.chatResource.error;
  readonly sending = this.session.sending;

  readonly canCompose = computed(
    () => !this.loading() && !this.loadError(),
  );

  readonly loadErrorMessage = computed(() => {
    const error = this.loadError();

    return error ? getApiErrorMessage(error) : null;
  });

  sendMessage(content: string): void {
    const history = this.messages().map(
      ({ role, content: messageContent }) => ({
        role,
        content: messageContent,
      }),
    );

    void this.session.send(content, this.chat_id(), history);
  }

  cancelMessage(): void {
    this.session.cancel();
  }
}
