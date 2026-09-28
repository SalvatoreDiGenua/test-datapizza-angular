import { computed, inject, Service, Signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';

import { ChatService } from '../../../api';
import { ChatApiConversation, ChatMessage } from '../../models/chat';
import { ChatMessageSender } from './chat-message-sender';

@Service()
export class ChatSession {
  private readonly chatService = inject(ChatService);
  private readonly messageSender = inject(ChatMessageSender);

  readonly sending = this.messageSender.sending;

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
      const conversation = resource.value() as
        | ChatApiConversation
        | undefined;

      const serverMessages = conversation
        ? conversationToMessages(conversation)
        : [];

      const pending =
        chatId() === this.messageSender.chatId()
          ? this.messageSender.messages()
          : [];

      return mergeMessages(serverMessages, pending);
    });

    return {
      resource,
      messages,
    };
  }

  cancel(): void {
    this.messageSender.cancel();
  }

  send(
    content: string,
    chatId: string | undefined,
    history: Pick<ChatMessage, 'role' | 'content'>[],
  ): Promise<void> {
    return this.messageSender.send(content, chatId, history);
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
