import { Component, effect, inject, input, signal } from '@angular/core';
import {
  NgxExtendedPdfViewerModule,
  NgxExtendedPdfViewerService,
  PdfSrcType,
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
  readonly src = input.required<PdfSrcType>();
  readonly page = input(1);
  readonly height = input('100%');
  readonly showToolbar = input(true);
  readonly textLayer = input(true);
  readonly handTool = input(false);
  readonly showSidebarButton = input(false);
  readonly showOpenFileButton = input(false);
  readonly showPrintButton = input(true);
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
    source?: {
      pdfPage?: {
        view?: number[];
      };
    };
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

    const pageView = event.source ?? this.getPageView(pageNumber);
    const pageSize = pageView?.pdfPage?.view;

    if (!pageSize || pageSize.length < 4) {
      return;
    }

    const pageWidthPoints = Math.abs(pageSize[2] - pageSize[0]);
    const pageHeightPoints = Math.abs(pageSize[3] - pageSize[1]);
    const pointsPerInch = 72;

    if (!pageWidthPoints || !pageHeightPoints) {
      return;
    }

    let applied = false;

    for (const highlight of pageHighlights) {
      if (highlight.unit !== 'inches') {
        continue;
      }

      const left = (highlight.x * pointsPerInch) / pageWidthPoints;
      const right =
        ((highlight.x + highlight.width) * pointsPerInch) / pageWidthPoints;
      const top = 1 - (highlight.y * pointsPerInch) / pageHeightPoints;
      const bottom =
        1 -
        ((highlight.y + highlight.height) * pointsPerInch) / pageHeightPoints;

      if (
        left < 0 ||
        right <= left ||
        bottom < 0 ||
        top <= bottom ||
        left > 1 ||
        bottom > 1
      ) {
        continue;
      }

      await this.pdfViewerService.addHighlightToAnnotationLayer(
        highlight.color ?? [255, 220, 0],
        pageNumber - 1,
        `${left * 100}%`,
        `${bottom * 100}%`,
        `${right * 100}%`,
        `${top * 100}%`,
        highlight.thickness ?? 10,
        0,
        highlight.opacity ?? 0.45,
      );

      applied = true;
    }

    if (!applied) {
      return;
    }

    const first = pageHighlights[0];

    if (pageNumber === this.page() && first.unit === 'inches') {
      const top = (first.y * pointsPerInch) / pageHeightPoints;

      this.pdfViewerService.scrollPageIntoView(pageNumber, {
        top: `${Math.max(0, Math.min(100, top * 100 - 8))}%`,
        left: `${Math.max(
          0,
          Math.min(
            100,
            ((first.x * pointsPerInch) / pageWidthPoints) * 100 - 8,
          ),
        )}%`,
      });
    }

    this.appliedHighlightPages.update((pages) => {
      const next = new Set(pages);
      next.add(pageNumber);
      return next;
    });
  }

  private getPageView(pageNumber: number): any | null {
    const pdfViewerApplication = (globalThis as { PDFViewerApplication?: any })
      .PDFViewerApplication;

    return pdfViewerApplication?.pdfViewer?.getPageView(pageNumber - 1) ?? null;
  }
}
