import { Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ChatCitation } from '../../../../core/models/chat';

@Component({
  selector: 'app-chat-citations',
  templateUrl: './chat-citations.html',
  styleUrl: './chat-citations.scss',
  imports: [MatIconModule, MatTooltipModule],
})
export class ChatCitations {
  readonly citations = input<ChatCitation[]>([]);

  readonly visibleCitations = computed(() => this.citations().slice(0, 2));

  readonly hasMoreCitations = computed(() => this.citations().length > 2);

  readonly additionalCitationsCount = computed(() =>
    Math.max(this.citations().length - 2, 0),
  );

  getFileExtension(filename: string): string {
    const name = filename.trim();
    const lastDot = name.lastIndexOf('.');

    if (lastDot <= 0 || lastDot === name.length - 1) {
      return 'FILE';
    }

    return name.slice(lastDot + 1).toUpperCase();
  }
}
