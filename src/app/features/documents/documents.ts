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
import { HttpEventType } from '@angular/common/http';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
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
import { Auth } from '../../core/auth/auth';

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
    MatPaginatorModule,
    DatePipe,
    GetFileExtension,
    RequestLockDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Documents implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly auth = inject(Auth);
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

  readonly uploadProgress = signal(0);

  readonly pageSize = signal(20);
  readonly pageIndex = signal(0);
  readonly hasNextPage = signal(false);
  readonly paginationLength = computed(() => {
    const visibleItems =
      this.pageIndex() * this.pageSize() + this.dataSource().length;

    return visibleItems + (this.hasNextPage() ? 1 : 0);
  });

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

  getFiles(requestId = this.loadRequestId, pageIndex = this.pageIndex()): void {
    const limit = this.pageSize() + 1;
    const offset = pageIndex * this.pageSize();

    if (requestId === this.loadRequestId) {
      this.pageIndex.set(pageIndex);
    }

    this.documentsService
      .listDocumentsApiDocumentsGet(
        limit,
        offset,
        this.auth.user()?.id,
        undefined,
        undefined,
        {
          context: createRequestLockContext(requestId),
        },
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: Document[]) => {
          const hasNext = data.length > this.pageSize();

          this.hasNextPage.set(hasNext);
          this.dataSource.set(
            hasNext ? data.slice(0, this.pageSize()) : data,
          );
        },
        error: () => {
          this.uploadProgress.set(0);
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

    this.uploadProgress.set(0);

    this.documentsService
      .uploadDocumentsApiDocumentsPost(
        pdfFiles,
        this.auth.user()?.id,
        'events',
        true,
        {
          context: createRequestLockContext(this.uploadRequestId),
        },
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (event) => {
          if (event.type === HttpEventType.UploadProgress && event.total) {
            this.uploadProgress.set(
              Math.round((event.loaded / event.total) * 100),
            );
            return;
          }

          if (event.type !== HttpEventType.Response) {
            return;
          }

          this.uploadProgress.set(100);
          this.snackbar.success(
            pdfFiles.length === 1
              ? 'Il documento è stato caricato correttamente.'
              : `${pdfFiles.length} documenti sono stati caricati correttamente.`,
            'Upload completato',
          );

          this.pageIndex.set(0);
          this.getFiles(this.uploadRequestId, 0);
        },
        error: () => {
          this.snackbar.error(
            'Uno o più documenti non sono stati caricati.',
            'Upload fallito',
          );
        },
      });
  }

  onPageChange(event: PageEvent): void {
    if (event.pageSize !== this.pageSize()) {
      this.pageSize.set(event.pageSize);
      this.pageIndex.set(0);
      this.getFiles();
      return;
    }

    this.getFiles(this.loadRequestId, event.pageIndex);
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
