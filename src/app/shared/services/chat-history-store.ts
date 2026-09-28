import { computed, inject, Service } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';

import { ChatService } from '../../api';
import { ChatApiConversation, ChatHistoryItem } from '../../core/models/chat';

@Service()
export class ChatHistoryStore {
  private readonly chatService = inject(ChatService);

  private readonly resource = rxResource({
    stream: () => this.chatService.listChatsApiChatGet(100, 0),
  });

  readonly items = computed<ChatHistoryItem[]>(() => {
    const value = this.resource.value();

    return value
      .map((v: ChatApiConversation) => ({
        id: v.id,
        title: v.query.trim() || 'Nuova conversazione',
        preview: v.response.trim(),
        createdAt: v.created_at,
      }))
      .sort(
        (prev: ChatHistoryItem, next: ChatHistoryItem) =>
          new Date(next.createdAt).getTime() -
          new Date(prev.createdAt).getTime(),
      );
  });

  readonly loading = computed(() => this.resource.isLoading());

  readonly error = computed(() => this.resource.error());

  refresh(): void {
    this.resource.reload();
  }
}
