import { DatePipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MarkdownComponent } from 'ngx-markdown';

import { ChatMessage as ChatMessageModel } from '../../../../core/models/chat';

@Component({
  selector: 'app-chat-message',
  templateUrl: './chat-message.html',
  styleUrl: './chat-message.scss',
  imports: [DatePipe, MatIconModule, MarkdownComponent],
})
export class ChatMessage {
  readonly message = input.required<ChatMessageModel>();

  readonly isUser = computed(() => this.message().role === 'user');
  readonly isAssistant = computed(() => this.message().role === 'assistant');
}
