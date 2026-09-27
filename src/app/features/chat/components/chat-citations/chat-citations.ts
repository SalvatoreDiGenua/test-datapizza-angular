import { Component, computed, input } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ChatCitation } from '../../../../core/models/chat';
import { GetFileExtension } from '../../../../shared/pipes/get-file-extension';

@Component({
  selector: 'app-chat-citations',
  templateUrl: './chat-citations.html',
  styleUrl: './chat-citations.scss',
  imports: [MatTooltipModule, GetFileExtension],
})
export class ChatCitations {
  readonly citations = input<ChatCitation[]>([]);

  readonly visibleCitations = computed(() => this.citations().slice(0, 2));

  readonly hasMoreCitations = computed(() => this.citations().length > 2);

  readonly additionalCitationsCount = computed(() =>
    Math.max(this.citations().length - 2, 0),
  );
}
