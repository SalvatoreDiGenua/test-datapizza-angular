import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { ChatService } from '../../../../api';

interface ChatListItem {
  id: string;
  title: string;
  preview: string;
}

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readText(record: JsonRecord, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
    if (typeof value === 'number') {
      return String(value);
    }
  }
  return undefined;
}

function readChatItems(response: unknown): ChatListItem[] {
  const rows = Array.isArray(response)
    ? response
    : isRecord(response)
      ? (response['chats'] ??
        response['items'] ??
        response['data'] ??
        response['results'])
      : [];

  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.flatMap((row, index) => {
    if (!isRecord(row)) {
      return [];
    }

    const id = readText(row, 'chat_id', 'id');
    if (!id) {
      return [];
    }

    return [
      {
        id,
        title:
          readText(row, 'title', 'name', 'query') ??
          `Conversazione ${index + 1}`,
        preview: readText(row, 'preview', 'last_message', 'updated_at') ?? '',
      },
    ];
  });
}

@Component({
  selector: 'app-chat-history',
  styleUrl: './chat-history.scss',
  templateUrl: './chat-history.html',
  imports: [MatIconModule, MatListModule, RouterLink, RouterLinkActive],
})
export class ChatHistory implements OnInit {
  private readonly pageSize = 100;
  protected readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly chatService = inject(ChatService);

  readonly chats = signal<ChatListItem[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal(false);

  ngOnInit(): void {
    this.loadChats(0, []);
  }

  private loadChats(offset: number, accumulated: ChatListItem[]): void {
    this.chatService
      .listChatsApiChatGet(this.pageSize, offset)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: unknown) => {
          const page = readChatItems(response);
          const allChats = [...accumulated, ...page];
          if (page.length === this.pageSize) {
            this.loadChats(offset + this.pageSize, allChats);
            return;
          }

          this.chats.set(allChats);
          this.loading.set(false);
        },
        error: () => {
          this.loadError.set(true);
          this.loading.set(false);
        },
      });
  }
}
