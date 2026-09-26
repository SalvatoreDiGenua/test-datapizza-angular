import {
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ChatService } from '../../api';
import { ChatStreamService } from '../../core/services/chat-stream/chat-stream';
import {
  ChatMessage,
  ChatConversation,
  ChatApiResponse,
  ChatApiMessage,
} from '../../core/models/chat';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

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

  readonly chat_id = input<string | undefined>();
  readonly draft = signal('');
  readonly sending = signal(false);

  /**
   * Messaggi locali temporanei
   *
   * - il valore iniziale deriva dalla conversazione caricata;
   * - il componente deve poterlo modificare durante lo streaming;
   * - quando cambia la conversazione, lo stato locale deve riallinearsi automaticamente
   *
   * In particolare, manteniamo solamente i messaggi che
   * non sono ancora presenti nella risposta del backend
   */
  readonly localMessages = linkedSignal<ChatMessage[], ChatMessage[]>({
    source: () => this.serverConversation()?.messages ?? [],

    computation: (serverMessages, previous) => {
      if (!previous) {
        return [];
      }

      const serverMessageIds = new Set(
        serverMessages.map((message) => message.id),
      );

      return previous.value.filter(
        (message) => !serverMessageIds.has(message.id),
      );
    },
  });

  readonly chatResource = rxResource({
    params: () => {
      const chat_id = this.chat_id();
      return chat_id ? { chat_id } : undefined;
    },

    stream: ({ params }) =>
      this.chatService.getChatApiChatChatIdGet(params.chat_id),
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

  /**
   * Messaggi effettivamente visualizzati dalla UI.
   */
  readonly messages = computed(() => {
    const serverMessages = this.serverConversation()?.messages ?? [];
    const localMessages = this.localMessages();

    if (localMessages.length === 0) {
      return serverMessages;
    }

    return [...serverMessages, ...localMessages];
  });

  readonly showMessages = computed(() => {
    return this.messages().length > 0;
  });

  readonly canSend = computed(() => {
    return !this.sending() && this.draft().trim().length > 0;
  });

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

    this.localMessages.update((messages) => [
      ...messages,
      userMessage,
      assistantMessage,
    ]);

    this.draft.set('');
    this.sending.set(true);

    const controller = new AbortController();

    let assistantText = '';

    try {
      for await (const event of this.chatStreamService.streamChat({
        query: content,
        history,
        signal: controller.signal,
      })) {
        if (event.type !== 'content') {
          continue;
        }

        assistantText += event.delta;

        this.updateMessage(assistantMessage.id, {
          content: assistantText,
        });
      }

      if (assistantText) {
        this.updateMessage(assistantMessage.id, {
          status: 'complete',
        });
      } else {
        this.updateMessage(assistantMessage.id, {
          content: 'Nessuna risposta ricevuta.',
          status: 'error',
        });
      }
    } catch (error: unknown) {
      if (this.isAbortError(error)) {
        return;
      }

      console.error('Chat streaming error:', error);

      this.updateMessage(assistantMessage.id, {
        content:
          assistantText || 'Si è verificato un errore durante la risposta.',
        status: 'error',
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
    this.localMessages.update((messages) =>
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

  private isAbortError(error: unknown): boolean {
    return error instanceof DOMException && error.name === 'AbortError';
  }

  private mapConversation(value: unknown): ChatConversation | null {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return null;
    }

    const data = value as ChatApiResponse;

    const id = typeof data.id === 'string' ? data.id : (this.chat_id() ?? '');

    if (!Array.isArray(data.messages)) {
      return {
        id,
        messages: [],
      };
    }

    const messages = data.messages
      .filter(this.isApiMessage)
      .map((message, index) => ({
        id: typeof message.id === 'string' ? message.id : `message-${index}`,

        role:
          message.role === 'user' ? ('user' as const) : ('assistant' as const),

        content: typeof message.content === 'string' ? message.content : '',

        time:
          typeof message.time === 'string'
            ? message.time
            : new Date().toISOString(),

        status: 'complete' as const,
      }));

    return {
      id,
      messages,
    };
  }

  private isApiMessage(value: unknown): value is ChatApiMessage {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
