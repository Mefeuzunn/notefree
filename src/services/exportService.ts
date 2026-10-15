import { PDFDocument } from 'pdf-lib';
import { Page, ExportOptions, Notebook } from '../types/notebook';
import { drawStrokeOnCanvas, drawTapeOnCanvas, drawFillOnCanvas, getStrokeOptions } from '../engine/strokeRenderer';
import { drawPaperTemplate } from '../engine/paperTemplates';

export async function renderPageToCanvas(
  page: Page,
  options: {
    scale?: number;
    transparentBg?: boolean;
    includeTemplate?: boolean;
    includeStickyNotes?: boolean;
    includeTexts?: boolean;
  } = {}
): Promise<HTMLCanvasElement> {
  const scale = options.scale ?? 2;
  const canvas = document.createElement('canvas');
  canvas.width = page.width * scale;
  canvas.height = page.height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.scale(scale, scale);

  // 1. Paper Background
  if (!options.transparentBg) {
    let bgColor = '#ffffff';
    switch (page.paperColor) {
      case 'cream':
        bgColor = '#fdfbf7';
        break;
      case 'yellow-pad':
        bgColor = '#fefce8';
        break;
      case 'dark':
        bgColor = '#0f172a';
        break;
      case 'kraft':
        bgColor = '#f5ede4';
        break;
      default:
        bgColor = '#ffffff';
    }
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, page.width, page.height);

    // 2. Paper Template Grid / Lines
    if (options.includeTemplate !== false && page.template !== 'blank') {
      drawPaperTemplate(ctx, page.width, page.height, page.template, page.paperColor);
    }
  }

  // 3. Background PDF / Image
  if (page.backgroundImageUrl) {
    try {
      const img = await loadImage(page.backgroundImageUrl);
      ctx.drawImage(img, 0, 0, page.width, page.height);
    } catch (_) {}
  }

  // 4. Fill Items
  if (page.fills && page.fills.length > 0) {
    for (const fill of page.fills) {
      drawFillOnCanvas(ctx, fill);
    }
  }

  // 5. Embedded Page Images
  if (page.images && page.images.length > 0) {
    for (const pImg of page.images) {
      try {
        const img = await loadImage(pImg.dataUrl);
        if (pImg.cropBounds) {
          ctx.drawImage(
            img,
            pImg.cropBounds.x,
            pImg.cropBounds.y,
            pImg.cropBounds.width,
            pImg.cropBounds.height,
            pImg.x,
            pImg.y,
            pImg.width,
            pImg.height
          );
        } else {
          ctx.drawImage(img, pImg.x, pImg.y, pImg.width, pImg.height);
        }
      } catch (_) {}
    }
  }

  // 6. Tapes
  if (page.tapes && page.tapes.length > 0) {
    for (const tape of page.tapes) {
      drawTapeOnCanvas(ctx, tape);
    }
  }

  // 7. Strokes (Ink)
  if (page.strokes && page.strokes.length > 0) {
    for (const stroke of page.strokes) {
      drawStrokeOnCanvas(
        ctx,
        stroke,
        getStrokeOptions(stroke.tool, stroke.size)
      );
    }
  }

  // 8. Text Annotations
  if (options.includeTexts !== false && page.texts && page.texts.length > 0) {
    for (const txt of page.texts) {
      ctx.save();
      ctx.fillStyle = txt.color;
      let fontStr = `${txt.fontSize}px sans-serif`;
      if (txt.fontFamily === 'Caveat') fontStr = `${txt.fontSize}px 'Caveat', cursive, sans-serif`;
      else if (txt.fontFamily === 'serif') fontStr = `${txt.fontSize}px Georgia, serif`;
      else if (txt.fontFamily === 'monospace') fontStr = `${txt.fontSize}px 'JetBrains Mono', monospace`;
      ctx.font = fontStr;
      ctx.textBaseline = 'top';

      const lines = txt.text.split('\n');
      const lineHeight = txt.fontSize * 1.35;
      lines.forEach((line, i) => {
        ctx.fillText(line, txt.x, txt.y + i * lineHeight);
      });
      ctx.restore();
    }
  }

  // 9. Sticky Notes
  if (options.includeStickyNotes !== false && page.stickyNotes && page.stickyNotes.length > 0) {
    for (const sn of page.stickyNotes) {
      ctx.save();
      let snBg = '#fef08a';
      let snBorder = '#fde047';
      if (sn.color === 'pink') {
        snBg = '#fbcfe8';
        snBorder = '#f472b6';
      } else if (sn.color === 'mint') {
        snBg = '#a7f3d0';
        snBorder = '#6ee7b7';
      } else if (sn.color === 'blue') {
        snBg = '#bae6fd';
        snBorder = '#7dd3fc';
      } else if (sn.color === 'purple') {
        snBg = '#e9d5ff';
        snBorder = '#d8b4fe';
      }

      // Draw sticky card shadow & body
      ctx.fillStyle = snBg;
      ctx.strokeStyle = snBorder;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(sn.x, sn.y, sn.width, sn.height, 8);
      ctx.fill();
      ctx.stroke();

      // Dog-ear flap top right
      ctx.fillStyle = snBorder;
      ctx.beginPath();
      ctx.moveTo(sn.x + sn.width - 20, sn.y);
      ctx.lineTo(sn.x + sn.width, sn.y + 20);
      ctx.lineTo(sn.x + sn.width - 20, sn.y + 20);
      ctx.closePath();
      ctx.fill();

      // Sticky text
      ctx.fillStyle = '#1e293b';
      ctx.font = "14px 'Caveat', cursive, sans-serif";
      ctx.textBaseline = 'top';
      const snLines = sn.text.split('\n');
      snLines.forEach((l, idx) => {
        ctx.fillText(l, sn.x + 10, sn.y + 24 + idx * 18);
      });

      ctx.restore();
    }
  }

  return canvas;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Exports a single page as a PNG or JPEG blob
 */
export async function exportPageAsImage(
  page: Page,
  options: ExportOptions
): Promise<Blob> {
  const canvas = await renderPageToCanvas(page, {
    scale: options.scale,
    transparentBg: options.format === 'png' && options.transparentBg,
    includeTemplate: options.includeTemplate,
    includeStickyNotes: options.includeStickyNotes,
    includeTexts: options.includeTexts,
  });

  return new Promise((resolve, reject) => {
    const mime = options.format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const quality = options.format === 'jpeg' ? 0.92 : undefined;
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas blob generation failed'));
      },
      mime,
      quality
    );
  });
}

/**
 * Exports full notebook or single page to a crisp PDF document with all layers included
 */
export async function exportNotebookWithAllLayers(
  notebook: Notebook,
  options: ExportOptions
): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();
  const pagesToExport =
    options.scope === 'current'
      ? [notebook.pages[notebook.activePageIndex] || notebook.pages[0]]
      : notebook.pages;

  for (const page of pagesToExport) {
    const canvas = await renderPageToCanvas(page, {
      scale: options.scale,
      transparentBg: false,
      includeTemplate: options.includeTemplate,
      includeStickyNotes: options.includeStickyNotes,
      includeTexts: options.includeTexts,
    });

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const imgBytes = await fetch(dataUrl).then((r) => r.arrayBuffer());
    const embeddedImg = await pdfDoc.embedJpg(imgBytes);

    const pdfPage = pdfDoc.addPage([page.width, page.height]);
    pdfPage.drawImage(embeddedImg, {
      x: 0,
      y: 0,
      width: page.width,
      height: page.height,
    });
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
