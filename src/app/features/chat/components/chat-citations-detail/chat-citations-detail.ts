import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { DocumentsService } from '../../../../api';
import { ChatCitation } from '../../../../core/models/chat';
import {
  PdfViewer,
  PdfViewerHighlight,
} from '../../../../shared/components/pdf-viewer/pdf-viewer';
import { GetFileExtension } from '../../../../shared/pipes/get-file-extension';
import { Auth } from '../../../../core/auth/auth';
import { MatRipple } from '@angular/material/core';

@Component({
  selector: 'app-chat-citations-detail',
  templateUrl: './chat-citations-detail.html',
  styleUrl: './chat-citations-detail.scss',
  imports: [
    GetFileExtension,
    MatButtonModule,
    MatBadgeModule,
    MatIconModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    PdfViewer,
    MatRipple,
  ],
})
export class ChatCitationsDetail {
  private readonly destroyRef = inject(DestroyRef);
  private readonly auth = inject(Auth);
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
  readonly selectedCitationPageIndex = signal(0);
  readonly pdfBlob = signal<Blob | null>(null);
  readonly loadingFile = signal(false);
  readonly fileError = signal(false);

  readonly selectedFile = computed(
    () =>
      this.files().find((file) => file.documentId === this.selectedFileId()) ??
      null,
  );

  readonly citationPages = computed(() => {
    const pages = new Map<number, ChatCitation[]>();

    for (const citation of this.selectedFile()?.citations ?? []) {
      pages.set(citation.page_number, [
        ...(pages.get(citation.page_number) ?? []),
        citation,
      ]);
    }

    return [...pages.entries()].map(([pageNumber, citations]) => ({
      pageNumber,
      citations,
    }));
  });

  readonly selectedCitationPage = computed(
    () => this.citationPages()[this.selectedCitationPageIndex()] ?? null,
  );

  readonly selectedCitation = computed(
    () => this.selectedCitationPage()?.citations[0] ?? null,
  );

  readonly isSelectedFilePdf = computed(
    () => this.selectedFile()?.filename.toLowerCase().endsWith('.pdf') ?? false,
  );

  readonly citationHighlights = computed<PdfViewerHighlight[]>(() => {
    const citations = this.selectedCitationPage()?.citations ?? [];

    return citations
      .flatMap((citation) => citation.bounding_regions)
      .flatMap((region) =>
        region.rects_in.flatMap((rect) => {
          if (
            rect.length !== 4 ||
            rect.some((value) => !Number.isFinite(value))
          ) {
            return [];
          }

          const [x, y, width, height] = rect;

          return [
            {
              page: region.page_number,
              x,
              y,
              width,
              height,
              unit: 'inches',
              color: [255, 220, 0] as [number, number, number],
              opacity: 0.45,
              thickness: 10,
            },
          ];
        }),
      );
  });

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

    this.selectedCitationPageIndex.set(0);
    this.selectedFileId.set(documentId);
  }

  selectCitation(index: number): void {
    this.selectedCitationPageIndex.set(index);
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
      .getDocumentFileApiDocumentsDocIdFileGet(
        documentId,
        this.auth.user()?.id,
        'body',
        false,
        {
          httpHeaderAccept: 'application/pdf' as any,
        },
      )
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
