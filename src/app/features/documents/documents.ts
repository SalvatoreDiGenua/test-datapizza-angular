import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { HttpEventType } from '@angular/common/http';
import { tap } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { DocumentsService } from '../../api';
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
export class Documents {
  private readonly auth = inject(Auth);
  private readonly documentsService = inject(DocumentsService);
  private readonly snackbar = inject(SnackbarService);
  private readonly requestLockService = inject(RequestLockService);

  private readonly loadRequestId = 'documents-load';
  readonly uploadRequestId = 'documents-upload';

  readonly isLoading = computed(() => this.documentsResource.isLoading());

  readonly isUploading = computed(() =>
    this.requestLockService.isPending(this.uploadRequestId)(),
  );

  readonly uploadProgress = signal(0);

  readonly pageSize = signal(5);
  readonly pageIndex = signal(0);
  readonly documentsResource = rxResource({
    params: () => ({
      limit: this.pageSize() + 1,
      offset: this.pageIndex() * this.pageSize(),
    }),
    stream: ({ params }) =>
      this.documentsService
        .listDocumentsApiDocumentsGet(
          params.limit,
          params.offset,
          this.auth.user()?.id,
          'body',
          undefined,
          {
            context: createRequestLockContext(this.loadRequestId),
          },
        )
        .pipe(
          tap({
            error: () =>
              this.snackbar.error(
                'Non è stato possibile recuperare i documenti.',
                'Caricamento fallito',
              ),
          }),
        ),
  });

  readonly dataSource = computed(
    () => this.documentsResource.value()?.slice(0, this.pageSize()) ?? [],
  );

  readonly hasNextPage = computed(
    () => (this.documentsResource.value()?.length ?? 0) > this.pageSize(),
  );

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
          this.documentsResource.reload();
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
    this.pageSize.set(event.pageSize);
    this.pageIndex.set(event.pageIndex);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files?.length) {
      return;
    }

    this.uploadFiles(input.files);
    input.value = '';
  }
}
