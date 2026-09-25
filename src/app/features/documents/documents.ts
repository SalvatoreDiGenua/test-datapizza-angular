import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DocumentsService } from '../../api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Document } from '../../core/models/document';

@Component({
  selector: 'app-documents',
  templateUrl: './documents.html',
  styleUrl: './documents.scss',
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule],
})
export class Documents implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly documentsService = inject(DocumentsService);

  displayedColumns: string[] = [
    'filename',
    'page_count',
    'status',
    'upload_date',
  ];
  dataSource = signal<Document[]>([]);

  ngOnInit(): void {
    this.getFiles();
  }

  getFiles() {
    this.documentsService
      .listDocumentsApiDocumentsGet(20, 0)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => this.dataSource.set(data));
  }

  uploadFiles(files: FileList) {
    if (!files) {
      return;
    }

    const blobs: Blob[] = Array.from(files);
    this.documentsService
      .uploadDocumentsApiDocumentsPost(blobs)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.getFiles());
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files?.length) {
      return;
    }

    const files = input.files;
    this.uploadFiles(files);
  }
}
