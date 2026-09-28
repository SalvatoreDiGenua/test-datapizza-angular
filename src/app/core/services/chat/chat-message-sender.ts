import { inject, Service, signal } from '@angular/core';

import { ChatCitation, ChatMessage } from '../../models/chat';
import { ChatStreamService } from './chat-stream';
import { ChatHistoryStore } from '../../../shared/services/chat-history-store';
import { getApiErrorMessage } from '../api-error/api-error-message';
import { SnackbarService } from '../../../shared/services/snackbar';

@Service()
export class ChatMessageSender {
  private readonly chatStreamService = inject(ChatStreamService);
  private readonly chatHistoryStore = inject(ChatHistoryStore);
  private readonly snackbar = inject(SnackbarService);

  private readonly pendingMessages = signal<ChatMessage[]>([]);
  private readonly pendingChatId = signal<string | undefined>(undefined);
  private activeController: AbortController | null = null;

  readonly messages = this.pendingMessages.asReadonly();
  readonly chatId = this.pendingChatId.asReadonly();
  readonly sending = signal(false);

  cancel(): void {
    this.activeController?.abort();
  }

  async send(
    content: string,
    chatId: string | undefined,
    history: Pick<ChatMessage, 'role' | 'content'>[],
  ): Promise<void> {
    if (!content || this.sending()) {
      return;
    }

    const userMessage = createMessage({
      role: 'user',
      content,
      status: 'complete',
    });

    const assistantMessage = createMessage({
      role: 'assistant',
      content: '',
      status: 'streaming',
    });

    this.pendingChatId.set(chatId);
    this.pendingMessages.update((messages) => [
      ...messages,
      userMessage,
      assistantMessage,
    ]);
    this.sending.set(true);

    const controller = new AbortController();
    this.activeController = controller;

    let assistantText = '';
    let citations: ChatCitation[] = [];

    try {
      for await (const event of this.chatStreamService.streamChat({
        query: content,
        history,
        signal: controller.signal,
      })) {
        switch (event.type) {
          case 'content':
            assistantText += event.delta;
            this.updateMessage(assistantMessage.id, {
              content: assistantText,
            });
            break;

          case 'citations':
            citations = event.references;
            this.updateMessage(assistantMessage.id, { citations });
            break;

          case 'error':
            throw new Error(event.message);
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
      if (isAbortError(error)) {
        this.removeMessage(assistantMessage.id);
        return;
      }

      const errorMessage = getApiErrorMessage(error);

      this.updateMessage(assistantMessage.id, {
        content: assistantText || errorMessage,
        status: 'error',
        citations,
      });

      this.snackbar.error(errorMessage, 'Invio messaggio fallito');
    } finally {
      if (this.activeController === controller) {
        this.activeController = null;
      }

      this.sending.set(false);
    }
  }

  private updateMessage(
    messageId: string,
    patch: Partial<ChatMessage>,
  ): void {
    this.pendingMessages.update((messages) =>
      messages.map((message) =>
        message.id === messageId ? { ...message, ...patch } : message,
      ),
    );
  }

  private removeMessage(messageId: string): void {
    this.pendingMessages.update((messages) =>
      messages.filter((message) => message.id !== messageId),
    );
  }
}

function createMessage(
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

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}
