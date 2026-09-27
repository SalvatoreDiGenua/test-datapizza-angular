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

    let applied = false;

    for (const highlight of pageHighlights) {
      const coordinates = this.toPdfCoordinates(highlight, pageNumber);

      if (!coordinates) {
        continue;
      }

      await this.pdfViewerService.addHighlightToAnnotationLayer(
        highlight.color ?? [255, 220, 0],
        pageNumber - 1,
        coordinates.left,
        coordinates.bottom,
        coordinates.right,
        coordinates.top,
        highlight.thickness ?? 10,
        0,
        highlight.opacity ?? 0.45,
      );

      applied = true;
    }

    if (!applied) {
      return;
    }

    if (pageNumber === this.page()) {
      const first = this.toNormalizedHighlight(pageHighlights[0], pageNumber);

      if (first) {
        this.pdfViewerService.scrollPageIntoView(pageNumber, {
          top: `${Math.max(0, Math.min(100, first.y * 100 - 8))}%`,
          left: `${Math.max(0, Math.min(100, first.x * 100 - 8))}%`,
        });
      }
    }

    this.appliedHighlightPages.update((pages) => {
      const next = new Set(pages);
      next.add(pageNumber);
      return next;
    });
  }

  private toPdfCoordinates(
    highlight: PdfViewerHighlight,
    pageNumber: number,
  ): {
    left: number;
    bottom: number;
    right: number;
    top: number;
  } | null {
    if (highlight.unit !== 'inches') {
      return null;
    }

    const pageView = this.getPageView(pageNumber);

    if (!pageView?.pdfPage?.view) {
      return null;
    }

    const [, bottomDim, , topDim] = pageView.pdfPage.view as [
      number,
      number,
      number,
      number,
    ];
    const pageHeightPoints = Math.abs(topDim - bottomDim);
    const pointsPerInch = 72;

    if (!pageHeightPoints) {
      return null;
    }

    const left = highlight.x * pointsPerInch;
    const right = (highlight.x + highlight.width) * pointsPerInch;
    const top = pageHeightPoints - highlight.y * pointsPerInch;
    const bottom =
      pageHeightPoints - (highlight.y + highlight.height) * pointsPerInch;

    return {
      left,
      bottom,
      right,
      top,
    };
  }

  private toNormalizedHighlight(
    highlight: PdfViewerHighlight,
    pageNumber: number,
  ): PdfViewerHighlight | null {
    if (highlight.unit !== 'inches') {
      return highlight;
    }

    const pageView = this.getPageView(pageNumber);

    if (!pageView?.pdfPage?.view) {
      return null;
    }

    const [, bottomDim, rightDim, topDim] = pageView.pdfPage.view as [
      number,
      number,
      number,
      number,
    ];
    const pageWidthPoints = Math.abs(rightDim - (pageView.pdfPage.view as number[])[0]);
    const pageHeightPoints = Math.abs(topDim - bottomDim);
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

  private getPageView(pageNumber: number): any | null {
    const pdfViewerApplication = (
      globalThis as { PDFViewerApplication?: any }
    ).PDFViewerApplication;

    return pdfViewerApplication?.pdfViewer?.getPageView(pageNumber - 1) ?? null;
  }
}
