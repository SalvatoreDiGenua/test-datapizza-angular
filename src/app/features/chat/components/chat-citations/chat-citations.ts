import { Component, computed, inject, input } from '@angular/core';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ChatCitation } from '../../../../core/models/chat';
import { GetFileExtension } from '../../../../shared/pipes/get-file-extension';
import { ChatCitationsDetail } from '../chat-citations-detail/chat-citations-detail';

@Component({
  selector: 'app-chat-citations',
  templateUrl: './chat-citations.html',
  styleUrl: './chat-citations.scss',
  imports: [MatBottomSheetModule, MatTooltipModule, GetFileExtension],
})
export class ChatCitations {
  private readonly bottomSheet = inject(MatBottomSheet);

  readonly citations = input<ChatCitation[]>([]);

  readonly visibleCitations = computed(() => this.citations().slice(0, 2));

  readonly hasMoreCitations = computed(() => this.citations().length > 2);

  readonly additionalCitationsCount = computed(() =>
    Math.max(this.citations().length - 2, 0),
  );

  openDetails(): void {
    if (!this.citations().length) {
      return;
    }

    this.bottomSheet.open(ChatCitationsDetail, {
      data: this.citations(),
      ariaLabel: 'Dettaglio delle citazioni',
    });
  }
}
