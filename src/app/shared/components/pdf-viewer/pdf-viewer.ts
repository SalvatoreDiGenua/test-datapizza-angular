import {
  Component,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import {
  NgxExtendedPdfViewerModule,
  NgxExtendedPdfViewerService,
} from 'ngx-extended-pdf-viewer';

export interface PdfViewerHighlight {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: [number, number, number];
  opacity?: number;
  thickness?: number;
}

@Component({
  selector: 'app-pdf-viewer',
  templateUrl: './pdf-viewer.html',
  styleUrl: './pdf-viewer.scss',
  imports: [NgxExtendedPdfViewerModule],
})
export class PdfViewer {
  readonly src = input.required<string | Blob | ArrayBuffer>();
  readonly page = input(1);
  readonly height = input('100%');
  readonly showToolbar = input(true);
  readonly textLayer = input(true);
  readonly handTool = input(false);
  readonly showSidebarButton = input(false);
  readonly showOpenFileButton = input(false);
  readonly showPrintButton = input(false);
  readonly showDownloadButton = input(false);
  readonly highlightText = input<string | null>(null);
  readonly highlights = input<PdfViewerHighlight[]>([]);

  private readonly pdfLoaded = signal(false);
  private readonly appliedHighlightPages = signal(new Set<number>());

  private readonly pdfViewerService = inject(NgxExtendedPdfViewerService);

  constructor() {
    effect(() => {
      const text = this.highlightText()?.trim();

      if (!this.pdfLoaded() || !text) {
        return;
      }

      this.pdfViewerService.find(text, {
        highlightAll: true,
        dontScrollIntoView: false,
      });
    });
  }

  onPdfLoaded(): void {
    this.pdfLoaded.set(true);
    this.appliedHighlightPages.set(new Set());
  }

  onPdfLoadingStarts(): void {
    this.pdfLoaded.set(false);
    this.appliedHighlightPages.set(new Set());
  }

  async onAnnotationEditorLayerRendered(event: {
    pageNumber: number;
  }): Promise<void> {
    const pageNumber = event.pageNumber;

    if (this.appliedHighlightPages().has(pageNumber)) {
      return;
    }

    const pageHighlights = this.highlights().filter(
      (highlight) => highlight.page === pageNumber,
    );

    if (!pageHighlights.length) {
      return;
    }

    for (const highlight of pageHighlights) {
      await this.pdfViewerService.addHighlightToAnnotationLayer(
        highlight.color ?? [255, 220, 0],
        pageNumber - 1,
        `${highlight.x * 100}%`,
        `${(1 - highlight.y - highlight.height) * 100}%`,
        `${(highlight.x + highlight.width) * 100}%`,
        `${(1 - highlight.y) * 100}%`,
        highlight.thickness ?? 12,
        0,
        highlight.opacity ?? 0.5,
      );
    }

    this.appliedHighlightPages.update((pages) => {
      const next = new Set(pages);
      next.add(pageNumber);
      return next;
    });
  }
}
