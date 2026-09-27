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
  unit?: 'normalized' | 'inches';
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
      const normalized = this.toNormalizedHighlight(highlight, pageNumber);

      if (!normalized) {
        continue;
      }

      await this.pdfViewerService.addHighlightToAnnotationLayer(
        normalized.color ?? [255, 220, 0],
        pageNumber - 1,
        `${normalized.x * 100}%`,
        `${(1 - normalized.y - normalized.height) * 100}%`,
        `${(normalized.x + normalized.width) * 100}%`,
        `${(1 - normalized.y) * 100}%`,
        normalized.thickness ?? 12,
        0,
        normalized.opacity ?? 0.5,
      );
    }

    this.appliedHighlightPages.update((pages) => {
      const next = new Set(pages);
      next.add(pageNumber);
      return next;
    });
  }

  private toNormalizedHighlight(
    highlight: PdfViewerHighlight,
    pageNumber: number,
  ): PdfViewerHighlight | null {
    if (highlight.unit !== 'inches') {
      return highlight;
    }

    // rects_in uses x/y/width/height in inches, measured from the top-left.
    // PDF.js exposes the physical page size in PDF points (72 points per inch).
    const pdfViewerApplication = (globalThis as { PDFViewerApplication?: any })
      .PDFViewerApplication;
    const pageView = pdfViewerApplication?.pdfViewer?.getPageView(
      pageNumber - 1,
    );
    const viewBox = pageView?.viewport?.viewBox as
      | [number, number, number, number]
      | undefined;

    if (!viewBox) {
      return null;
    }

    const pageWidthPoints = Math.abs(viewBox[2] - viewBox[0]);
    const pageHeightPoints = Math.abs(viewBox[3] - viewBox[1]);
    const pointsPerInch = 72;

    if (!pageWidthPoints || !pageHeightPoints) {
      return null;
    }

    return {
      ...highlight,
      x: (highlight.x * pointsPerInch) / pageWidthPoints,
      y: (highlight.y * pointsPerInch) / pageHeightPoints,
      width: (highlight.width * pointsPerInch) / pageWidthPoints,
      height: (highlight.height * pointsPerInch) / pageHeightPoints,
      unit: 'normalized',
    };
  }
}
