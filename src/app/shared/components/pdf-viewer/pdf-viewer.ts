import { Component, input } from '@angular/core';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';

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
}
