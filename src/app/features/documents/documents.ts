import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { DocumentsService } from '../../api';
import { Document } from '../../core/models/document';
import { SnackbarService } from '../../shared/services/snackbar';
import { DatePipe } from '@angular/common';
import { GetFileExtension } from '../../shared/pipes/get-file-extension';
import {
  RequestLockDirective,
  RequestLockService,
  createRequestLockContext,
} from 'ngx-request-lock';

@Component({
  selector: 'app-documents',
  templateUrl: './documents.html',
  styleUrl: './documents.scss',
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    DatePipe,
    GetFileExtension,
    RequestLockDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Documents implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly documentsService = inject(DocumentsService);
  private readonly snackbar = inject(SnackbarService);
  private readonly requestLockService = inject(RequestLockService);

  private readonly loadRequestId = 'documents-load';
  readonly uploadRequestId = 'documents-upload';

  readonly isLoading = computed(() =>
    this.requestLockService.isPending(this.loadRequestId)(),
  );

  readonly isUploading = computed(() =>
    this.requestLockService.isPending(this.uploadRequestId)(),
  );

  readonly displayedColumns = [
    'filename',
    'page_count',
    'status',
    'upload_date',
  ];

  readonly dataSource = signal<Document[]>([]);

  ngOnInit(): void {
    this.getFiles();
  }

  getFiles(requestId = this.loadRequestId): void {
    this.documentsService
      .listDocumentsApiDocumentsGet(
        20,
        0,
        undefined,
        undefined,
        undefined,
        {
          context: createRequestLockContext(requestId),
        },
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.dataSource.set(data);
        },
        error: () => {
          this.snackbar.error(
            'Non è stato possibile recuperare i documenti.',
            'Caricamento fallito',
          );
        },
      });
  }

  uploadFiles(files: FileList): void {
    if (!files?.length || this.isUploading()) {
      return;
    }

    const pdfFiles = Array.from(files).filter(
      (file) => file.type === 'application/pdf',
    );

    if (!pdfFiles.length) {
      this.snackbar.warning('Seleziona almeno un file PDF valido.');
      return;
    }

    this.documentsService
      .uploadDocumentsApiDocumentsPost(
        pdfFiles,
        undefined,
        undefined,
        undefined,
        {
          context: createRequestLockContext(this.uploadRequestId),
        },
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snackbar.success(
            pdfFiles.length === 1
              ? 'Il documento è stato caricato correttamente.'
              : `${pdfFiles.length} documenti sono stati caricati correttamente.`,
            'Upload completato',
          );

          this.getFiles(this.uploadRequestId);
        },
        error: () => {
          this.snackbar.error(
            'Uno o più documenti non sono stati caricati.',
            'Upload fallito',
          );
        },
      });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files?.length) {
      return;
    }

    this.uploadFiles(input.files);

    // Permette di riselezionare lo stesso file.
    input.value = '';
  }
}
