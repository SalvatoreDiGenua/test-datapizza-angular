import { HttpClient } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import {
  MAT_BOTTOM_SHEET_DATA,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ChatCitation } from '../../../../core/models/chat';
import { GetFileExtension } from '../../../../shared/pipes/get-file-extension';
import { DocumentsService } from '../../../../api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-chat-citations-detail',
  templateUrl: './chat-citations-detail.html',
  styleUrl: './chat-citations-detail.scss',
  imports: [GetFileExtension, MatIconModule, MatProgressSpinnerModule],
})
export class ChatCitationsDetail {
  private readonly destroyRef = inject(DestroyRef);
  private readonly documentsService = inject(DocumentsService);
  private readonly bottomSheetRef = inject(
    MatBottomSheetRef<ChatCitationsDetail>,
  );
  private readonly citations = inject<ChatCitation[]>(MAT_BOTTOM_SHEET_DATA);

  readonly files = computed(() => {
    const files = new Map<string, ChatCitation[]>();

    for (const citation of this.citations) {
      const key = citation.document_id;

      files.set(key, [...(files.get(key) ?? []), citation]);
    }

    return [...files.entries()].map(([documentId, citations]) => ({
      documentId,
      filename: citations[0].filename,
      citations,
    }));
  });

  private readonly downloading = signal(new Set<string>());

  close(): void {
    this.bottomSheetRef.dismiss();
  }

  downloadFile(documentId: string, filename: string): void {
    if (this.downloading().has(documentId)) {
      return;
    }

    this.downloading.update((ids) => new Set(ids).add(documentId));

    this.documentsService
      .getDocumentApiDocumentsDocIdGet(documentId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          this.saveFile(blob, filename);
          this.removeDownloading(documentId);
        },
        error: () => {
          this.removeDownloading(documentId);
        },
      });
  }

  isDownloading(documentId: string): boolean {
    return this.downloading().has(documentId);
  }

  private removeDownloading(documentId: string): void {
    this.downloading.update((ids) => {
      const next = new Set(ids);
      next.delete(documentId);
      return next;
    });
  }

  private saveFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = filename;
    anchor.click();

    URL.revokeObjectURL(url);
  }
}
