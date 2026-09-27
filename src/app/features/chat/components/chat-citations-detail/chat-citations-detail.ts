import { Component, input } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ChatCitation } from '../../../../core/models/chat';
import { GetFileExtension } from '../../../../shared/pipes/get-file-extension';

@Component({
  selector: 'app-chat-citations-detail',
  templateUrl: './chat-citations-detail.html',
  styleUrl: './chat-citations-detail.scss',
  imports: [MatTooltipModule, GetFileExtension],
})
export class ChatCitationsDetail {
  readonly citations = input<ChatCitation[]>([]);
}
