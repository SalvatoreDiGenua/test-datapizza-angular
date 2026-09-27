import { DatePipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MarkdownComponent } from 'ngx-markdown';
import { ChatMessage as ChatMessageModel } from '../../../../core/models/chat';
import { ChatCitations } from '../chat-citations/chat-citations';

@Component({
  selector: 'app-chat-message',
  templateUrl: './chat-message.html',
  styleUrls: ['./chat-message.scss', './chat-markdown.scss'],
  imports: [DatePipe, MatIconModule, MarkdownComponent, ChatCitations],
})
export class ChatMessage {
  readonly message = input.required<ChatMessageModel>();

  readonly isUser = computed(() => this.message().role === 'user');
  readonly isAssistant = computed(() => this.message().role === 'assistant');
}
