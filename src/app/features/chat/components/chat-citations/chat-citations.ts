import { Component, computed, inject, input } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ChatCitation } from '../../../../core/models/chat';
import { GetFileExtension } from '../../../../shared/pipes/get-file-extension';
import { ChatCitationsDetail } from '../chat-citations-detail/chat-citations-detail';

@Component({
  selector: 'app-chat-citations',
  templateUrl: './chat-citations.html',
  styleUrl: './chat-citations.scss',
  imports: [MatDialogModule, MatTooltipModule, GetFileExtension],
})
export class ChatCitations {
  private readonly dialog = inject(MatDialog);

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

    this.dialog.open(ChatCitationsDetail, {
      data: this.citations(),
      ariaLabel: 'Dettaglio delle citazioni',
      width: '95vw',
      height: '90vh',
      maxWidth: '1400px',
      maxHeight: '90vh',
      panelClass: 'chat-citations-dialog',
    });
  }
}
