import { Component, computed, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ChatService } from '../../api';
import {
  ChatApiConversation,
  ChatCitation,
  ChatConversation,
  ChatMessage,
} from '../../core/models/chat';
import { ChatStreamService } from '../../core/services/chat/chat-stream';
import { ChatHistoryStore } from '../../shared/services/chat-history-store';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.html',
  styleUrl: './chat.scss',
  imports: [
    DatePipe,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
})
export class Chat {
  private readonly chatService = inject(ChatService);
  private readonly chatStreamService = inject(ChatStreamService);
  private readonly chatHistoryStore = inject(ChatHistoryStore);

  readonly chat_id = input<string | undefined>();

  readonly draft = signal('');
  readonly sending = signal(false);

  private readonly pendingMessages = signal<ChatMessage[]>([]);
  private readonly pendingChatId = signal<string | undefined>(undefined);

  readonly chatResource = rxResource({
    params: () => {
      const chatId = this.chat_id();

      return chatId
        ? {
            chatId,
          }
        : undefined;
    },

    stream: ({ params }) =>
      this.chatService.getChatApiChatChatIdGet(params.chatId),
  });

  readonly serverConversation = computed<ChatConversation | null>(() => {
    const value = this.chatResource.value();

    if (!value) {
      return null;
    }

    return this.mapConversation(value);
  });

  readonly loading = computed(() => this.chatResource.isLoading());

  readonly loadError = computed(() => this.chatResource.error());

  readonly messages = computed(() => {
    const serverMessages = this.serverConversation()?.messages ?? [];

    const currentChatId = this.chat_id();
    const pendingChatId = this.pendingChatId();

    const pendingMessages =
      currentChatId === pendingChatId ? this.pendingMessages() : [];

    if (pendingMessages.length === 0) {
      return serverMessages;
    }

    if (serverMessages.length === 0) {
      return pendingMessages;
    }

    const visiblePendingMessages = pendingMessages.filter(
      (pendingMessage) =>
        !serverMessages.some((serverMessage) =>
          this.isSameMessage(serverMessage, pendingMessage),
        ),
    );

    return [...serverMessages, ...visiblePendingMessages];
  });

  readonly showMessages = computed(() => this.messages().length > 0);

  readonly canSend = computed(
    () => !this.sending() && this.draft().trim().length > 0,
  );

  updateDraft(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.draft.set(textarea.value);
  }

  handleKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || event.shiftKey) {
      return;
    }

    event.preventDefault();

    if (this.canSend()) {
      void this.sendMessage();
    }
  }

  async sendMessage(event?: Event): Promise<void> {
    event?.preventDefault();

    const content = this.draft().trim();

    if (!content || this.sending()) {
      return;
    }

    const history = this.messages().map(({ role, content }) => ({
      role,
      content,
    }));

    const userMessage = this.createMessage({
      role: 'user',
      content,
      status: 'complete',
    });

    const assistantMessage = this.createMessage({
      role: 'assistant',
      content: '',
      status: 'streaming',
    });

    this.pendingChatId.set(this.chat_id());

    this.pendingMessages.update((messages) => [
      ...messages,
      userMessage,
      assistantMessage,
    ]);

    this.draft.set('');
    this.sending.set(true);

    const controller = new AbortController();

    let assistantText = '';
    let citations: ChatCitation[] = [];

    try {
      for await (const event of this.chatStreamService.streamChat({
        query: content,
        history,
        signal: controller.signal,
      })) {
        switch (event.type) {
          case 'content': {
            assistantText += event.delta;

            this.updateMessage(assistantMessage.id, {
              content: assistantText,
            });

            break;
          }

          case 'citations': {
            citations = event.references;

            this.updateMessage(assistantMessage.id, {
              citations,
            });

            break;
          }

          case 'error': {
            throw new Error(event.message);
          }
        }
      }

      if (assistantText) {
        this.updateMessage(assistantMessage.id, {
          content: assistantText,
          status: 'complete',
          citations,
        });

        this.chatHistoryStore.refresh();
      } else {
        this.updateMessage(assistantMessage.id, {
          content: 'Nessuna risposta ricevuta.',
          status: 'error',
          citations,
        });
      }
    } catch (error: unknown) {
      if (this.isAbortError(error)) {
        return;
      }

      this.updateMessage(assistantMessage.id, {
        content:
          assistantText || 'Si è verificato un errore durante la risposta.',
        status: 'error',
        citations,
      });
    } finally {
      this.sending.set(false);
    }
  }

  private createMessage(
    message: Pick<ChatMessage, 'role' | 'content' | 'status'>,
  ): ChatMessage {
    return {
      id: crypto.randomUUID(),
      role: message.role,
      content: message.content,
      status: message.status,
      time: new Date().toISOString(),
    };
  }

  private updateMessage(messageId: string, patch: Partial<ChatMessage>): void {
    this.pendingMessages.update((messages) =>
      messages.map((message) =>
        message.id === messageId
          ? {
              ...message,
              ...patch,
            }
          : message,
      ),
    );
  }

  private isSameMessage(first: ChatMessage, second: ChatMessage): boolean {
    return first.role === second.role && first.content === second.content;
  }

  private isAbortError(error: unknown): boolean {
    return error instanceof DOMException && error.name === 'AbortError';
  }

  private mapConversation(value: unknown): ChatConversation | null {
    const conversation = this.extractConversation(value);

    if (!conversation) {
      return null;
    }

    const messages: ChatMessage[] = [];

    if (conversation.query.trim()) {
      messages.push({
        id: `${conversation.id}:user`,
        role: 'user',
        content: conversation.query,
        time: conversation.created_at,
        status: 'complete',
      });
    }

    if (conversation.response.trim()) {
      messages.push({
        id: `${conversation.id}:assistant`,
        role: 'assistant',
        content: conversation.response,
        time: conversation.created_at,
        status: 'complete',
        citations: conversation.citations ?? [],
      });
    }

    return {
      id: conversation.id,
      messages,
    };
  }

  private extractConversation(value: unknown): ChatApiConversation | null {
    if (typeof value !== 'object' || value === null) {
      return null;
    }

    if (Array.isArray(value)) {
      const first = value[0];

      return this.isApiConversation(first) ? first : null;
    }

    return this.isApiConversation(value) ? value : null;
  }

  private isApiConversation(value: unknown): value is ChatApiConversation {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return false;
    }

    const conversation = value as Record<string, unknown>;

    return (
      typeof conversation['id'] === 'string' &&
      typeof conversation['user_id'] === 'string' &&
      typeof conversation['created_at'] === 'string' &&
      typeof conversation['query'] === 'string' &&
      typeof conversation['response'] === 'string' &&
      (conversation['citations'] === undefined ||
        Array.isArray(conversation['citations']))
    );
  }
}
