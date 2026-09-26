import {
  ChangeDetectionStrategy,
  Component,
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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Documents implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly documentsService = inject(DocumentsService);
  private readonly snackbar = inject(SnackbarService);

  readonly displayedColumns = [
    'filename',
    'page_count',
    'status',
    'upload_date',
  ];

  readonly dataSource = signal<Document[]>([]);

  readonly isLoading = signal(false);
  readonly isUploading = signal(false);

  ngOnInit(): void {
    this.getFiles();
  }

  getFiles(): void {
    this.isLoading.set(true);

    this.documentsService
      .listDocumentsApiDocumentsGet(20, 0)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.dataSource.set(data);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);

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

    this.isUploading.set(true);

    this.documentsService
      .uploadDocumentsApiDocumentsPost(pdfFiles)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isUploading.set(false);

          this.snackbar.success(
            pdfFiles.length === 1
              ? 'Il documento è stato caricato correttamente.'
              : `${pdfFiles.length} documenti sono stati caricati correttamente.`,
            'Upload completato',
          );

          this.getFiles();
        },
        error: () => {
          this.isUploading.set(false);

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
