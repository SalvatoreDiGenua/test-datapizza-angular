import { computed, inject, Service, Signal, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';

import { ChatService } from '../../../api';
import {
  ChatApiConversation,
  ChatCitation,
  ChatMessage,
} from '../../models/chat';
import { ChatStreamService } from './chat-stream';
import { ChatHistoryStore } from '../../../shared/services/chat-history-store';

@Service()
export class ChatSession {
  private readonly chatService = inject(ChatService);
  private readonly chatStreamService = inject(ChatStreamService);
  private readonly chatHistoryStore = inject(ChatHistoryStore);

  private readonly pendingMessages = signal<ChatMessage[]>([]);
  private readonly pendingChatId = signal<string | undefined>(undefined);
  private activeController: AbortController | null = null;

  readonly sending = signal(false);

  createResource(chatId: Signal<string | undefined>) {
    const resource = rxResource({
      params: () => {
        const id = chatId();

        return id ? { chatId: id } : undefined;
      },

      stream: ({ params }) =>
        this.chatService.getChatApiChatChatIdGet(params.chatId),
    });

    const messages = computed(() => {
      const conversation = resource.value() as ChatApiConversation | undefined;
      const serverMessages = conversation
        ? conversationToMessages(conversation)
        : [];

      const pending =
        chatId() === this.pendingChatId() ? this.pendingMessages() : [];

      return mergeMessages(serverMessages, pending);
    });

    return {
      resource,
      messages,
    };
  }

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

      this.updateMessage(assistantMessage.id, {
        content:
          assistantText || 'Si è verificato un errore durante la risposta.',
        status: 'error',
        citations,
      });
    } finally {
      if (this.activeController === controller) {
        this.activeController = null;
      }
      this.sending.set(false);
    }
  }

  private updateMessage(messageId: string, patch: Partial<ChatMessage>): void {
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

function conversationToMessages(
  conversation: ChatApiConversation,
): ChatMessage[] {
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

  return messages;
}

function mergeMessages(
  serverMessages: ChatMessage[],
  pendingMessages: ChatMessage[],
): ChatMessage[] {
  if (pendingMessages.length === 0) {
    return serverMessages;
  }

  if (serverMessages.length === 0) {
    return pendingMessages;
  }

  const visiblePending = pendingMessages.filter(
    (pendingMessage) =>
      !serverMessages.some(
        (serverMessage) =>
          serverMessage.role === pendingMessage.role &&
          serverMessage.content === pendingMessage.content,
      ),
  );

  return [...serverMessages, ...visiblePending];
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
