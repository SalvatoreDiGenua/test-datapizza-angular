import { computed, inject, Injectable } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';

import { ChatService } from '../../api';
import { ChatHistoryItem } from '../../core/models/chat';

@Injectable({
  providedIn: 'root',
})
export class ChatHistoryStore {
  private readonly chatService = inject(ChatService);

  private readonly resource = rxResource({
    stream: () => this.chatService.listChatsApiChatGet(100, 0),
  });

  readonly items = computed<ChatHistoryItem[]>(() => {
    const value = this.resource.value();

    return value
      .map((v: any) => ({
        id: v.id,
        title: v.query.trim() || 'Nuova conversazione',
        preview: v.response.trim(),
        createdAt: v.created_at,
      }))
      .sort(
        (prev: any, next: any) =>
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
