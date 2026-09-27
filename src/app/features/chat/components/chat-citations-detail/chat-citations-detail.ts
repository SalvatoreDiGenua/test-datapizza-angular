import { HttpClient } from '@angular/common/http';
import { Component, computed, inject } from '@angular/core';
import {
  MAT_BOTTOM_SHEET_DATA,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ChatCitation } from '../../../../core/models/chat';
import { GetFileExtension } from '../../../../shared/pipes/get-file-extension';
import { environment } from '../../../../../environments/environment.development';

@Component({
  selector: 'app-chat-citations-detail',
  templateUrl: './chat-citations-detail.html',
  styleUrl: './chat-citations-detail.scss',
  imports: [GetFileExtension, MatIconModule, MatProgressSpinnerModule],
})
export class ChatCitationsDetail {
  private readonly http = inject(HttpClient);
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

  readonly downloading = new Set<string>();

  close(): void {
    this.bottomSheetRef.dismiss();
  }

  downloadFile(documentId: string, filename: string): void {
    if (this.downloading.has(documentId)) {
      return;
    }

    this.downloading.add(documentId);

    const url = `${environment.baseApiUrl}/api/documents/${encodeURIComponent(documentId)}/file`;

    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        this.saveFile(blob, filename);
        this.downloading.delete(documentId);
      },
      error: () => {
        this.downloading.delete(documentId);
      },
    });
  }

  isDownloading(documentId: string): boolean {
    return this.downloading.has(documentId);
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
