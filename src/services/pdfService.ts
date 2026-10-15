import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, rgb } from 'pdf-lib';
import { Page, Stroke, PdfOutlineItem } from '../types/notebook';
import { getStrokeOptions, getSvgPathFromStroke } from '../engine/strokeRenderer';
import { getStroke } from 'perfect-freehand';

// Setup PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

export interface PdfImportResult {
  pages: Page[];
  outline: PdfOutlineItem[];
}

/**
 * Loads a PDF file and converts all its pages into NotFree Page objects,
 * while extracting the hierarchical table of contents (bookmarks / outline).
 */
export async function convertPdfToPages(file: File): Promise<PdfImportResult> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  const pages: Page[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const viewport = page.getViewport({ scale: 1.5 }); // Higher DPI for sharp display

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    if (ctx) {
      // @ts-ignore - pdfjs-dist typing
      await page.render({ canvasContext: ctx, viewport }).promise;
      const dataUrl = canvas.toDataURL('image/png');

      pages.push({
        id: `pdf_page_${Date.now()}_${i}`,
        pageNumber: i,
        template: 'blank',
        paperColor: 'white',
        strokes: [],
        backgroundImageUrl: dataUrl,
        width: 800,
        height: Math.round(800 * (viewport.height / viewport.width)),
        title: `${file.name.replace(/\.pdf$/i, '')} - Sayfa ${i}`,
      });
    }
  }

  // Extract PDF Table of Contents (Outline)
  const outline: PdfOutlineItem[] = [];
  try {
    const rawOutline = await pdfDoc.getOutline();
    if (rawOutline && Array.isArray(rawOutline)) {
      const processItems = async (items: any[], level = 0) => {
        for (const it of items) {
          let pageIdx = 0;
          if (it.dest) {
            try {
              let destRef = it.dest;
              if (typeof destRef === 'string') {
                destRef = await pdfDoc.getDestination(destRef);
              }
              if (Array.isArray(destRef) && destRef[0]) {
                const resolvedIdx = await pdfDoc.getPageIndex(destRef[0]);
                if (typeof resolvedIdx === 'number' && resolvedIdx >= 0) {
                  pageIdx = resolvedIdx;
                }
              }
            } catch (destErr) {
              // ignore dest resolution failure
            }
          }
          outline.push({
            id: `toc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            title: it.title || `Bölüm`,
            pageIndex: pageIdx,
            level,
          });
          if (it.items && Array.isArray(it.items) && it.items.length > 0) {
            await processItems(it.items, level + 1);
          }
        }
      };
      await processItems(rawOutline, 0);
    }
  } catch (err) {
    console.warn('PDF Outline extraction skipped:', err);
  }

  return { pages, outline };
}

/**
 * Exports a notebook's pages as a merged, annotated PDF
 */
export async function exportNotebookToPdf(
  pages: Page[],
  title: string
): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();

  for (const page of pages) {
    const pdfPage = pdfDoc.addPage([page.width, page.height]);

    // If there is a background image (e.g. from imported PDF or Word)
    if (page.backgroundImageUrl) {
      try {
        const imgBytes = await fetch(page.backgroundImageUrl).then((res) => res.arrayBuffer());
        const embeddedImg = await pdfDoc.embedPng(imgBytes);
        pdfPage.drawImage(embeddedImg, {
          x: 0,
          y: 0,
          width: page.width,
          height: page.height,
        });
      } catch (err) {
        console.warn('Background image embed failed', err);
      }
    }

    // Render strokes as vector SVG paths or offscreen canvas snapshot
    if (page.strokes.length > 0) {
      const offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = page.width * 2;
      offscreenCanvas.height = page.height * 2;
      const ctx = offscreenCanvas.getContext('2d');

      if (ctx) {
        ctx.scale(2, 2);
        for (const stroke of page.strokes) {
          if (!stroke.points || stroke.points.length === 0) continue;
          const options = getStrokeOptions(stroke.tool, stroke.size);
          const rawPts = stroke.points.map((p) => [p.x, p.y, p.pressure]);
          const outline = getStroke(rawPts, options);
          if (outline.length === 0) continue;

          ctx.save();
          if (stroke.tool === 'highlighter') {
            ctx.globalCompositeOperation = 'multiply';
            ctx.globalAlpha = 0.45;
          }
          ctx.fillStyle = stroke.color;
          ctx.beginPath();
          ctx.moveTo(outline[0][0], outline[0][1]);
          for (let k = 1; k < outline.length; k++) {
            const [x0, y0] = outline[k];
            const [x1, y1] = outline[(k + 1) % outline.length];
            ctx.quadraticCurveTo(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
          }
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }

        const strokesDataUrl = offscreenCanvas.toDataURL('image/png');
        const strokesImgBytes = await fetch(strokesDataUrl).then((r) => r.arrayBuffer());
        const strokesImg = await pdfDoc.embedPng(strokesImgBytes);

        pdfPage.drawImage(strokesImg, {
          x: 0,
          y: 0,
          width: page.width,
          height: page.height,
        });
      }
    }
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
}

/**
 * FAZ R: Converts a PDF page into a high-resolution template image
 */
export async function renderPdfPageAsTemplateImage(
  file: File,
  pageNumber: number = 1
): Promise<{ dataUrl: string; width: number; height: number }> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;
  const page = await pdfDoc.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 2.0 }); // Retina 2x high resolution

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  if (!ctx) throw new Error('Canvas render context could not be created');
  // @ts-ignore - pdfjs-dist typing
  await page.render({ canvasContext: ctx, viewport }).promise;
  const dataUrl = canvas.toDataURL('image/png');

  return {
    dataUrl,
    width: Math.round(viewport.width / 2),
    height: Math.round(viewport.height / 2),
  };
}
