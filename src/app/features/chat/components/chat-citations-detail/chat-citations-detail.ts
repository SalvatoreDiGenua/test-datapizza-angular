import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { DocumentsService } from '../../../../api';
import { ChatCitation } from '../../../../core/models/chat';
import { PdfViewer } from '../../../../shared/components/pdf-viewer/pdf-viewer';
import { GetFileExtension } from '../../../../shared/pipes/get-file-extension';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-chat-citations-detail',
  templateUrl: './chat-citations-detail.html',
  styleUrl: './chat-citations-detail.scss',
  imports: [
    GetFileExtension,
    MatIconModule,
    MatProgressSpinnerModule,
    PdfViewer,
    MatButtonModule,
  ],
})
export class ChatCitationsDetail {
  private readonly destroyRef = inject(DestroyRef);
  private readonly documentsService = inject(DocumentsService);
  private readonly dialogRef = inject(MatDialogRef<ChatCitationsDetail>);
  private readonly citations = inject<ChatCitation[]>(MAT_DIALOG_DATA);

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

  readonly selectedFileId = signal(this.citations[0]?.document_id ?? null);
  readonly selectedCitationIndex = signal(0);
  readonly pdfBlob = signal<Blob | null>(null);
  readonly loadingFile = signal(false);
  readonly fileError = signal(false);

  readonly selectedFile = computed(
    () =>
      this.files().find((file) => file.documentId === this.selectedFileId()) ??
      null,
  );

  readonly selectedCitation = computed(
    () => this.selectedFile()?.citations[this.selectedCitationIndex()] ?? null,
  );

  readonly isSelectedFilePdf = computed(
    () => this.selectedFile()?.filename.toLowerCase().endsWith('.pdf') ?? false,
  );

  private readonly cachedFiles = new Map<string, Blob>();

  constructor() {
    effect(() => {
      const file = this.selectedFile();

      if (!file) {
        this.pdfBlob.set(null);
        return;
      }

      this.loadFile(file.documentId);
    });
  }

  close(): void {
    this.dialogRef.close();
  }

  selectFile(documentId: string): void {
    if (documentId === this.selectedFileId()) {
      return;
    }

    this.selectedCitationIndex.set(0);
    this.selectedFileId.set(documentId);
  }

  selectCitation(index: number): void {
    this.selectedCitationIndex.set(index);
  }

  private loadFile(documentId: string): void {
    const cached = this.cachedFiles.get(documentId);

    if (cached) {
      this.pdfBlob.set(cached);
      this.fileError.set(false);
      return;
    }

    this.pdfBlob.set(null);
    this.fileError.set(false);
    this.loadingFile.set(true);

    this.documentsService
      .getDocumentFileApiDocumentsDocIdFileGet(documentId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          this.cachedFiles.set(documentId, blob);
          this.pdfBlob.set(blob);
          this.loadingFile.set(false);
        },
        error: () => {
          this.loadingFile.set(false);
          this.fileError.set(true);
        },
      });
  }
}
