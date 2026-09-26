import { Component, input } from '@angular/core';

import { ChatMessage as ChatMessageModel } from '../../../../core/models/chat';
import { ChatMessage } from '../chat-message/chat-message';

@Component({
  selector: 'app-chat-message-list',
  templateUrl: './chat-message-list.html',
  imports: [ChatMessage],
})
export class ChatMessageList {
  readonly messages = input.required<ChatMessageModel[]>();
}
