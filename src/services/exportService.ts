import { PDFDocument, PDFName, PDFHexString, PDFRef } from 'pdf-lib';
import {
  Page,
  ExportOptions,
  Notebook,
  PdfOutlineItem,
  PageSticker,
  PageTableItem,
  PageConnectorItem,
  ConnectorAnchor,
  WatermarkOptions,
  HeaderFooterOptions,
} from '../types/notebook';
import {
  drawStrokeOnCanvas,
  drawTapeOnCanvas,
  drawFillOnCanvas,
  getStrokeOptions,
} from '../engine/strokeRenderer';
import { drawPaperTemplate } from '../engine/paperTemplates';

/**
 * Parses page range string (e.g. "1-3, 5, 8-10") into zero-indexed sorted array of unique page numbers.
 */
export function parsePageRange(rangeStr: string, totalPages: number): number[] {
  if (!rangeStr || !rangeStr.trim()) return [];
  const parts = rangeStr.split(',').map((p) => p.trim()).filter(Boolean);
  const resultSet = new Set<number>();

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-').map((s) => s.trim());
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end)) {
        const min = Math.max(1, Math.min(start, end));
        const max = Math.min(totalPages, Math.max(start, end));
        for (let i = min; i <= max; i++) {
          resultSet.add(i - 1);
        }
      }
    } else {
      const pageNum = parseInt(part, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        resultSet.add(pageNum - 1);
      }
    }
  }

  return Array.from(resultSet).sort((a, b) => a - b);
}

/**
 * Converts zero-based page indices array to compact string format (e.g. [0,1,2,4,7,8] -> "1-3, 5, 8-9")
 */
export function formatPageRange(indices: number[]): string {
  if (!indices || indices.length === 0) return '';
  const sorted = Array.from(new Set(indices)).sort((a, b) => a - b).map((n) => n + 1);
  const ranges: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const cur = sorted[i];
    if (cur === prev + 1) {
      prev = cur;
    } else {
      ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
      start = cur;
      prev = cur;
    }
  }
  ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
  return ranges.join(', ');
}

/**
 * Helper to asynchronously load image element
 */
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
 * Draws custom sticker / stamp with SVG, rotation, flipX, and opacity support
 */
async function drawStickerToCanvas(
  ctx: CanvasRenderingContext2D,
  stk: PageSticker
): Promise<void> {
  try {
    let img: HTMLImageElement | null = null;
    const content = stk.content.trim();

    if (content.startsWith('<svg') || content.includes('<svg')) {
      let svgStr = content;
      if (!svgStr.includes('xmlns="http://www.w3.org/2000/svg"')) {
        svgStr = svgStr.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
      }
      const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      img = await loadImage(url);
      URL.revokeObjectURL(url);
    } else if (content.startsWith('data:image') || content.startsWith('http')) {
      img = await loadImage(content);
    } else {
      // Emoji or short string
      const svgWrap = `<svg xmlns="http://www.w3.org/2000/svg" width="${stk.width}" height="${stk.height}">
        <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-size="${Math.min(stk.width, stk.height) * 0.75}px">
          ${content}
        </text>
      </svg>`;
      const blob = new Blob([svgWrap], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      img = await loadImage(url);
      URL.revokeObjectURL(url);
    }

    if (img) {
      ctx.save();
      ctx.translate(stk.x + stk.width / 2, stk.y + stk.height / 2);
      if (stk.rotation) {
        ctx.rotate((stk.rotation * Math.PI) / 180);
      }
      if (stk.flipX) {
        ctx.scale(-1, 1);
      }
      if (stk.opacity !== undefined) {
        ctx.globalAlpha = stk.opacity;
      }
      ctx.drawImage(img, -stk.width / 2, -stk.height / 2, stk.width, stk.height);
      ctx.restore();
    }
  } catch (err) {
    console.warn('Failed to render sticker to export canvas:', err);
  }
}

/**
 * Draws diagonal or tiled semi-transparent watermark text
 */
function drawWatermarkToCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  watermark: WatermarkOptions
) {
  if (!watermark.enabled || !watermark.text.trim()) return;

  ctx.save();
  ctx.globalAlpha = Math.max(0.02, Math.min(0.9, watermark.opacity));
  ctx.fillStyle = watermark.color || '#94a3b8';
  ctx.font = `bold ${watermark.fontSize || 48}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const rotRad = ((watermark.rotation || -45) * Math.PI) / 180;

  if (watermark.tiled) {
    // Tiled diagonal pattern across the whole page
    const stepX = Math.max(180, (watermark.fontSize || 48) * 4.2);
    const stepY = Math.max(120, (watermark.fontSize || 48) * 2.8);

    for (let x = -width * 0.5; x < width * 1.5; x += stepX) {
      for (let y = -height * 0.5; y < height * 1.5; y += stepY) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotRad);
        ctx.fillText(watermark.text, 0, 0);
        ctx.restore();
      }
    }
  } else {
    // Single centered watermark
    ctx.translate(width / 2, height / 2);
    ctx.rotate(rotRad);
    ctx.fillText(watermark.text, 0, 0);
  }

  ctx.restore();
}

/**
 * Draws Bates numbering, page numbers, or header/footer details
 */
function drawHeaderFooterToCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  headerFooter: HeaderFooterOptions,
  meta: { pageIndex: number; totalPages: number; title: string }
) {
  if (!headerFooter.enabled) return;

  let text = '';
  const pageNum = meta.pageIndex + 1;
  const total = meta.totalPages;

  switch (headerFooter.format) {
    case 'bates': {
      const prefix = headerFooter.batesPrefix ?? 'PAGE ';
      const digits = headerFooter.batesDigits ?? 3;
      const batesNum = String(pageNum).padStart(digits, '0');
      const batesTot = String(total).padStart(digits, '0');
      text = `${prefix}${batesNum} / ${batesTot}`;
      break;
    }
    case 'title-page': {
      text = `${meta.title} • Sayfa ${pageNum} / ${total}`;
      break;
    }
    case 'date-page': {
      const dateStr = new Date().toLocaleDateString('tr-TR');
      text = `${dateStr} • Sayfa ${pageNum} / ${total}`;
      break;
    }
    case 'custom': {
      const template = headerFooter.customTemplate || '{title} • Sayfa {n} / {total}';
      const dateStr = new Date().toLocaleDateString('tr-TR');
      const digits = headerFooter.batesDigits ?? 3;
      const batesNum = String(pageNum).padStart(digits, '0');
      text = template
        .replace(/\{n\}/g, String(pageNum))
        .replace(/\{total\}/g, String(total))
        .replace(/\{title\}/g, meta.title)
        .replace(/\{date\}/g, dateStr)
        .replace(/\{bates\}/g, batesNum);
      break;
    }
    case 'page-of-total':
    default: {
      text = `Sayfa ${pageNum} / ${total}`;
      break;
    }
  }

  const margin = 28;
  let posX = width / 2;
  let posY = height - margin;
  let align: CanvasTextAlign = 'center';
  let baseline: CanvasTextBaseline = 'bottom';

  switch (headerFooter.position) {
    case 'top-left':
      posX = margin;
      posY = margin;
      align = 'left';
      baseline = 'top';
      break;
    case 'top-right':
      posX = width - margin;
      posY = margin;
      align = 'right';
      baseline = 'top';
      break;
    case 'bottom-left':
      posX = margin;
      posY = height - margin;
      align = 'left';
      baseline = 'bottom';
      break;
    case 'bottom-right':
      posX = width - margin;
      posY = height - margin;
      align = 'right';
      baseline = 'bottom';
      break;
    case 'bottom-center':
    default:
      posX = width / 2;
      posY = height - margin;
      align = 'center';
      baseline = 'bottom';
      break;
  }

  ctx.save();
  ctx.fillStyle = headerFooter.color || '#64748b';
  ctx.font = `${headerFooter.fontSize || 12}px sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillText(text, posX, posY);
  ctx.restore();
}

/**
 * Renders a single page with all layers, stickers, watermark, and header/footer to an HTML5 Canvas.
 */
export async function renderPageToCanvas(
  page: Page,
  options: {
    scale?: number;
    transparentBg?: boolean;
    includeTemplate?: boolean;
    includeStickyNotes?: boolean;
    includeTexts?: boolean;
    includeStickers?: boolean;
    watermark?: WatermarkOptions;
    headerFooter?: HeaderFooterOptions;
    pageIndex?: number;
    totalPages?: number;
    notebookTitle?: string;
  } = {}
): Promise<HTMLCanvasElement> {
  const scale = options.scale ?? 2;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(page.width * scale);
  canvas.height = Math.round(page.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.scale(scale, scale);

  // 1. Paper Background
  if (!options.transparentBg) {
    let bgColor = '#ffffff';
    switch (page.paperColor) {
      case 'cream':
        bgColor = '#faf7ee';
        break;
      case 'yellow-pad':
        bgColor = '#fefce8';
        break;
      case 'sage':
        bgColor = '#f2f5f0';
        break;
      case 'dark':
        bgColor = '#141923';
        break;
      case 'kraft':
        bgColor = '#e7d8be';
        break;
      default:
        bgColor = '#ffffff';
    }
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, page.width, page.height);

    // 2. Paper Template Grid / Lines
    if (options.includeTemplate !== false && page.template !== 'blank') {
      drawPaperTemplate(
        ctx,
        page.width,
        page.height,
        page.template,
        page.paperColor,
        page.customPitch,
        page.customLineColor,
        page.lineOpacity
      );
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

  // 7. Strokes (Handwriting & Shapes)
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

  // 10. Stickers & Rubber Stamps
  if (options.includeStickers !== false && page.stickers && page.stickers.length > 0) {
    for (const stk of page.stickers) {
      await drawStickerToCanvas(ctx, stk);
    }
  }

  // 10.5 Faz AF: Interactive Tables & Data Matrices
  if (page.tables && page.tables.length > 0) {
    for (const tbl of page.tables) {
      drawTableToCanvas(ctx, tbl);
    }
  }

  // 10.6 Faz AH: Smart Magnetic Connectors & Flowchart Lines
  if (page.connectors && page.connectors.length > 0) {
    drawConnectorsToCanvas(ctx, page);
  }

  // 11. Watermark Security Overlay
  if (options.watermark && options.watermark.enabled) {
    drawWatermarkToCanvas(ctx, page.width, page.height, options.watermark);
  }

  // 12. Bates & Page Numbering (Header / Footer)
  if (options.headerFooter && options.headerFooter.enabled) {
    drawHeaderFooterToCanvas(ctx, page.width, page.height, options.headerFooter, {
      pageIndex: options.pageIndex ?? page.pageNumber - 1,
      totalPages: options.totalPages ?? 1,
      title: options.notebookTitle ?? '',
    });
  }

  return canvas;
}

/**
 * Exports a single page as a PNG or JPEG blob
 */
export async function exportPageAsImage(
  page: Page,
  options: ExportOptions,
  meta?: { pageIndex?: number; totalPages?: number; notebookTitle?: string }
): Promise<Blob> {
  const canvas = await renderPageToCanvas(page, {
    scale: options.scale,
    transparentBg: options.format === 'png' && options.transparentBg,
    includeTemplate: options.includeTemplate,
    includeStickyNotes: options.includeStickyNotes,
    includeTexts: options.includeTexts,
    includeStickers: options.includeStickers,
    watermark: options.watermark,
    headerFooter: options.headerFooter,
    pageIndex: meta?.pageIndex ?? page.pageNumber - 1,
    totalPages: meta?.totalPages ?? 1,
    notebookTitle: meta?.notebookTitle ?? '',
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
 * Exports full notebook or page range to a crisp PDF document with all layers included
 */
/**
 * FAZ AK: Embeds native hierarchical PDF bookmarks (outline tree) into the PDF catalog.
 * Compatible with Adobe Acrobat, Apple Books, GoodNotes, and Chromium PDF viewer.
 */
function embedPdfBookmarks(
  pdfDoc: PDFDocument,
  pageRefs: PDFRef[],
  outlineItems: PdfOutlineItem[],
  pageOffset: number = 0
) {
  if (!outlineItems || outlineItems.length === 0 || pageRefs.length === 0) return;

  const validItems = outlineItems
    .filter((item) => {
      const targetIdx = item.pageIndex + pageOffset;
      return targetIdx >= 0 && targetIdx < pageRefs.length && item.title.trim().length > 0;
    })
    .sort((a, b) => a.pageIndex - b.pageIndex || a.level - b.level);

  if (validItems.length === 0) return;

  const outlinesDictRef = pdfDoc.context.nextRef();
  const itemRefs: PDFRef[] = validItems.map(() => pdfDoc.context.nextRef());

  for (let i = 0; i < validItems.length; i++) {
    const item = validItems[i];
    const targetIdx = item.pageIndex + pageOffset;
    const targetPageRef = pageRefs[targetIdx];
    const itemRef = itemRefs[i];

    const dictObj: Record<string, any> = {
      Title: PDFHexString.fromText(item.title),
      Parent: outlinesDictRef,
      Dest: [targetPageRef, 'Fit'],
    };

    if (i > 0) {
      dictObj.Prev = itemRefs[i - 1];
    }
    if (i < validItems.length - 1) {
      dictObj.Next = itemRefs[i + 1];
    }

    const dict = pdfDoc.context.obj(dictObj);
    pdfDoc.context.assign(itemRef, dict);
  }

  const outlinesDict = pdfDoc.context.obj({
    Type: 'Outlines',
    First: itemRefs[0],
    Last: itemRefs[itemRefs.length - 1],
    Count: validItems.length,
  });

  pdfDoc.context.assign(outlinesDictRef, outlinesDict);
  pdfDoc.catalog.set(PDFName.of('Outlines'), outlinesDictRef);
}

/**
 * FAZ AK: Renders a beautifully styled Table of Contents page with paper background,
 * decorative headers, dotted leaders, and page numbers.
 */
export async function renderTableOfContentsPage(
  notebook: Notebook,
  outlineItems: PdfOutlineItem[],
  options: { width: number; height: number; scale: number }
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(options.width * options.scale);
  canvas.height = Math.round(options.height * options.scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.scale(options.scale, options.scale);

  // Background
  const paperColors: Record<string, string> = {
    white: '#ffffff',
    cream: '#faf7ee',
    'yellow-pad': '#fefce8',
    sage: '#f2f5f0',
    dark: '#141923',
    kraft: '#e7d8be',
  };
  const baseBg = paperColors[notebook.pages[0]?.paperColor || 'cream'] || '#ffffff';
  ctx.fillStyle = baseBg;
  ctx.fillRect(0, 0, options.width, options.height);

  const isDark = notebook.pages[0]?.paperColor === 'dark';
  const textColor = isDark ? '#f8fafc' : '#1e293b';
  const mutedColor = isDark ? '#94a3b8' : '#64748b';
  const dotColor = isDark ? '#475569' : '#cbd5e1';
  const accentColor = '#6366f1';

  const marginX = Math.round(options.width * 0.09);
  let curY = Math.round(options.height * 0.08);

  // Header
  ctx.fillStyle = accentColor;
  ctx.font = 'bold 12px Inter, sans-serif';
  ctx.fillText(notebook.title.toUpperCase(), marginX, curY);

  curY += 28;
  ctx.fillStyle = textColor;
  ctx.font = 'bold 26px Inter, sans-serif';
  ctx.fillText('İÇİNDEKİLER / TABLE OF CONTENTS', marginX, curY);

  curY += 14;
  // Divider line
  ctx.strokeStyle = isDark ? '#334155' : '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(marginX, curY);
  ctx.lineTo(options.width - marginX, curY);
  ctx.stroke();

  curY += 34;

  // Items
  const lineHeight = 32;
  const maxItemsPerPage = Math.floor((options.height - curY - 50) / lineHeight);
  const itemsToRender = outlineItems.slice(0, maxItemsPerPage);

  for (const item of itemsToRender) {
    const indent = (item.level || 0) * 22;
    const itemX = marginX + indent;
    const pageNumText = `s. ${item.pageIndex + 1}`;

    if (item.level === 0) {
      ctx.font = 'bold 14px Inter, sans-serif';
      ctx.fillStyle = textColor;
    } else if (item.level === 1) {
      ctx.font = '500 13px Inter, sans-serif';
      ctx.fillStyle = textColor;
    } else {
      ctx.font = 'normal 12px Inter, sans-serif';
      ctx.fillStyle = mutedColor;
    }

    const titleMetrics = ctx.measureText(item.title);
    ctx.font = '600 12px Inter, sans-serif';
    const pageMetrics = ctx.measureText(pageNumText);

    if (item.level === 0) {
      ctx.font = 'bold 14px Inter, sans-serif';
      ctx.fillStyle = textColor;
    } else if (item.level === 1) {
      ctx.font = '500 13px Inter, sans-serif';
      ctx.fillStyle = textColor;
    } else {
      ctx.font = 'normal 12px Inter, sans-serif';
      ctx.fillStyle = mutedColor;
    }
    ctx.fillText(item.title, itemX, curY);

    // Page number
    const pageNumX = options.width - marginX - pageMetrics.width;
    ctx.font = '600 12px Inter, sans-serif';
    ctx.fillStyle = accentColor;
    ctx.fillText(pageNumText, pageNumX, curY);

    // Dotted leader
    const dotStartX = itemX + titleMetrics.width + 12;
    const dotEndX = pageNumX - 12;
    if (dotEndX > dotStartX) {
      ctx.save();
      ctx.setLineDash([2, 5]);
      ctx.strokeStyle = dotColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(dotStartX, curY - 3);
      ctx.lineTo(dotEndX, curY - 3);
      ctx.stroke();
      ctx.restore();
    }

    curY += lineHeight;
  }

  // Footer Note
  ctx.font = 'italic 10px Inter, sans-serif';
  ctx.fillStyle = mutedColor;
  ctx.textAlign = 'center';
  ctx.fillText('Notefree Fihrist & Doküman İndeksi Motoru', options.width / 2, options.height - 24);

  return canvas;
}

/**
 * Exports full notebook or page range to a crisp PDF document with all layers included,
 * embedding native PDF Bookmarks / Outline tree and optional visual Table of Contents page.
 */
export async function exportNotebookWithAllLayers(
  notebook: Notebook,
  options: ExportOptions
): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();
  const pageRefs: PDFRef[] = [];

  let pagesToExport: Page[] = [];

  if (options.scope === 'current') {
    pagesToExport = [notebook.pages[notebook.activePageIndex] || notebook.pages[0]];
  } else if (options.scope === 'custom') {
    const validIndices = parsePageRange(options.pageRange || '', notebook.pages.length);
    if (validIndices.length > 0) {
      pagesToExport = validIndices.map((idx) => notebook.pages[idx]).filter(Boolean);
    } else {
      pagesToExport = [notebook.pages[notebook.activePageIndex] || notebook.pages[0]];
    }
  } else {
    pagesToExport = notebook.pages;
  }

  const totalPages = notebook.pages.length;
  let tocPageOffset = 0;

  // FAZ AK: Optional Visual Table of Contents Page at page 0
  if (
    options.insertTableOfContentsPage &&
    notebook.pdfOutline &&
    notebook.pdfOutline.length > 0
  ) {
    const refPage = notebook.pages[0] || { width: 800, height: 1100 };
    const tocCanvas = await renderTableOfContentsPage(notebook, notebook.pdfOutline, {
      width: refPage.width,
      height: refPage.height,
      scale: options.scale,
    });

    const tocDataUrl = tocCanvas.toDataURL('image/jpeg', 0.94);
    const tocImgBytes = await fetch(tocDataUrl).then((r) => r.arrayBuffer());
    const embeddedTocImg = await pdfDoc.embedJpg(tocImgBytes);

    const tocPdfPage = pdfDoc.addPage([refPage.width, refPage.height]);
    pageRefs.push(tocPdfPage.ref);
    tocPdfPage.drawImage(embeddedTocImg, {
      x: 0,
      y: 0,
      width: refPage.width,
      height: refPage.height,
    });
    tocPageOffset = 1;
  }

  for (let i = 0; i < pagesToExport.length; i++) {
    const page = pagesToExport[i];
    const canvas = await renderPageToCanvas(page, {
      scale: options.scale,
      transparentBg: false,
      includeTemplate: options.includeTemplate,
      includeStickyNotes: options.includeStickyNotes,
      includeTexts: options.includeTexts,
      includeStickers: options.includeStickers,
      watermark: options.watermark,
      headerFooter: options.headerFooter,
      pageIndex: page.pageNumber - 1,
      totalPages: totalPages,
      notebookTitle: notebook.title,
    });

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const imgBytes = await fetch(dataUrl).then((r) => r.arrayBuffer());
    const embeddedImg = await pdfDoc.embedJpg(imgBytes);

    const pdfPage = pdfDoc.addPage([page.width, page.height]);
    pageRefs.push(pdfPage.ref);
    pdfPage.drawImage(embeddedImg, {
      x: 0,
      y: 0,
      width: page.width,
      height: page.height,
    });
  }

  // FAZ AK: Embed standard PDF Bookmarks / Outline tree in PDF Catalog
  if (options.includePdfBookmarks !== false) {
    const outlineItems: PdfOutlineItem[] =
      notebook.pdfOutline && notebook.pdfOutline.length > 0
        ? notebook.pdfOutline
        : notebook.pages
            .map((pg, idx) => ({
              id: `p_bm_${idx}`,
              title: pg.title || (pg.isBookmarked ? `Sayfa ${idx + 1} ★` : ''),
              pageIndex: idx,
              level: 0,
            }))
            .filter((it) => it.title.trim().length > 0);

    if (outlineItems.length > 0) {
      embedPdfBookmarks(pdfDoc, pageRefs, outlineItems, tocPageOffset);
    }
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

/**
 * FAZ AF: Renders interactive table and cell matrix vectorially to canvas
 */
export function drawTableToCanvas(ctx: CanvasRenderingContext2D, tbl: PageTableItem) {
  ctx.save();
  const colW = tbl.width / tbl.cols;
  const rowH = Math.max(34, tbl.height / tbl.rows);

  // Outer background
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(tbl.x, tbl.y, tbl.width, tbl.height, 6);
  ctx.fill();

  // Draw cells
  for (let r = 0; r < tbl.rows; r++) {
    const isHeader = r === 0 && tbl.hasHeaderRow;
    const y = tbl.y + r * rowH;

    for (let c = 0; c < tbl.cols; c++) {
      const x = tbl.x + c * colW;
      const cell = tbl.cells[r]?.[c];
      const cellBg =
        cell?.bgColor ||
        (isHeader ? tbl.headerBgColor || '#f1f5f9' : r % 2 === 1 ? '#fafafa' : '#ffffff');

      // Cell background fill
      if (cellBg) {
        ctx.fillStyle = cellBg;
        ctx.fillRect(x, y, colW, rowH);
      }

      // Cell border
      ctx.strokeStyle = tbl.borderColor || '#cbd5e1';
      ctx.lineWidth = tbl.borderWidth || 1;
      ctx.strokeRect(x, y, colW, rowH);

      // Cell text
      if (cell?.text) {
        ctx.fillStyle = isHeader ? '#0f172a' : '#1e293b';
        const fontSize = 12;
        ctx.font = `${cell.bold || isHeader ? 'bold ' : ''}${fontSize}px Inter, sans-serif`;
        ctx.textBaseline = 'middle';

        const align = cell.align || (isHeader ? 'center' : 'left');
        let textX = x + 8;
        if (align === 'center') {
          textX = x + colW / 2;
          ctx.textAlign = 'center';
        } else if (align === 'right') {
          textX = x + colW - 8;
          ctx.textAlign = 'right';
        } else {
          ctx.textAlign = 'left';
        }

        const textY = y + rowH / 2;
        // Clip text within cell bounds
        ctx.save();
        ctx.beginPath();
        ctx.rect(x + 2, y + 2, colW - 4, rowH - 4);
        ctx.clip();
        ctx.fillText(cell.text, textX, textY);
        ctx.restore();
      }
    }
  }

  // Outer border with rounded corners
  ctx.strokeStyle = tbl.borderColor || '#94a3b8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(tbl.x, tbl.y, tbl.width, tbl.height, 6);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws smart magnetic connectors and flowchart lines to export canvas
 */
export function drawConnectorsToCanvas(ctx: CanvasRenderingContext2D, page: Page) {
  if (!page.connectors || page.connectors.length === 0) return;

  const resolveAnchor = (anchor: ConnectorAnchor): { x: number; y: number } => {
    if (anchor.elementId) {
      if (!anchor.elementType || anchor.elementType === 'sticky') {
        const note = page.stickyNotes?.find((s) => s.id === anchor.elementId);
        if (note) {
          const w = note.width || 200;
          const h = note.height || 200;
          switch (anchor.side) {
            case 'top': return { x: note.x + w / 2, y: note.y };
            case 'bottom': return { x: note.x + w / 2, y: note.y + h };
            case 'left': return { x: note.x, y: note.y + h / 2 };
            case 'right': return { x: note.x + w, y: note.y + h / 2 };
            default: return { x: note.x + w / 2, y: note.y + h / 2 };
          }
        }
      }
      if (!anchor.elementType || anchor.elementType === 'table') {
        const table = page.tables?.find((t) => t.id === anchor.elementId);
        if (table) {
          const w = table.colWidths?.reduce((a, b) => a + b, 0) || table.cols * 100;
          const h = (table.rowHeights?.reduce((a, b) => a + b, 0) || table.rows * 40) + 36;
          switch (anchor.side) {
            case 'top': return { x: table.x + w / 2, y: table.y };
            case 'bottom': return { x: table.x + w / 2, y: table.y + h };
            case 'left': return { x: table.x, y: table.y + h / 2 };
            case 'right': return { x: table.x + w, y: table.y + h / 2 };
            default: return { x: table.x + w / 2, y: table.y + h / 2 };
          }
        }
      }
      if (!anchor.elementType || anchor.elementType === 'text') {
        const txt = page.texts?.find((tx) => tx.id === anchor.elementId);
        if (txt) {
          const w = txt.width || 180;
          const h = txt.height || 40;
          switch (anchor.side) {
            case 'top': return { x: txt.x + w / 2, y: txt.y };
            case 'bottom': return { x: txt.x + w / 2, y: txt.y + h };
            case 'left': return { x: txt.x, y: txt.y + h / 2 };
            case 'right': return { x: txt.x + w, y: txt.y + h / 2 };
            default: return { x: txt.x + w / 2, y: txt.y + h / 2 };
          }
        }
      }
    }
    return { x: anchor.x, y: anchor.y };
  };

  const drawArrowHead = (tipX: number, tipY: number, angle: number, color: string) => {
    const headLength = 10;
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(
      tipX - headLength * Math.cos(angle - Math.PI / 6),
      tipY - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      tipX - headLength * Math.cos(angle + Math.PI / 6),
      tipY - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  for (const conn of page.connectors) {
    const p1 = resolveAnchor(conn.from);
    const p2 = resolveAnchor(conn.to);
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.hypot(dx, dy);

    ctx.save();
    ctx.strokeStyle = conn.color || '#3b82f6';
    ctx.lineWidth = conn.width || 2;
    ctx.lineCap = 'round';
    if (conn.dashed) {
      ctx.setLineDash([6, 4]);
    } else {
      ctx.setLineDash([]);
    }

    let midX = (p1.x + p2.x) / 2;
    let midY = (p1.y + p2.y) / 2;
    let startAngle = Math.atan2(p1.y - p2.y, p1.x - p2.x);
    let endAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

    ctx.beginPath();
    if (conn.style === 'curved') {
      const curvature = Math.max(30, dist * 0.4);
      let cp1x = p1.x;
      let cp1y = p1.y;
      let cp2x = p2.x;
      let cp2y = p2.y;

      if (conn.from.side === 'top') cp1y -= curvature;
      else if (conn.from.side === 'bottom') cp1y += curvature;
      else if (conn.from.side === 'left') cp1x -= curvature;
      else if (conn.from.side === 'right') cp1x += curvature;
      else cp1x += dx * 0.4;

      if (conn.to.side === 'top') cp2y -= curvature;
      else if (conn.to.side === 'bottom') cp2y += curvature;
      else if (conn.to.side === 'left') cp2x -= curvature;
      else if (conn.to.side === 'right') cp2x += curvature;
      else cp2x -= dx * 0.4;

      midX = 0.125 * p1.x + 0.375 * cp1x + 0.375 * cp2x + 0.125 * p2.x;
      midY = 0.125 * p1.y + 0.375 * cp1y + 0.375 * cp2y + 0.125 * p2.y;
      startAngle = Math.atan2(p1.y - cp1y, p1.x - cp1x);
      endAngle = Math.atan2(p2.y - cp2y, p2.x - cp2x);

      ctx.moveTo(p1.x, p1.y);
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    } else if (conn.style === 'orthogonal') {
      const isHorizontal =
        conn.from.side === 'left' ||
        conn.from.side === 'right' ||
        (!conn.from.side && Math.abs(dx) > Math.abs(dy));

      ctx.moveTo(p1.x, p1.y);
      if (isHorizontal) {
        const stepX = p1.x + dx / 2;
        ctx.lineTo(stepX, p1.y);
        ctx.lineTo(stepX, p2.y);
        ctx.lineTo(p2.x, p2.y);
        midX = stepX;
        midY = (p1.y + p2.y) / 2;
        startAngle = Math.atan2(0, p1.x - stepX);
        endAngle = Math.atan2(0, p2.x - stepX);
      } else {
        const stepY = p1.y + dy / 2;
        ctx.lineTo(p1.x, stepY);
        ctx.lineTo(p2.x, stepY);
        ctx.lineTo(p2.x, p2.y);
        midX = (p1.x + p2.x) / 2;
        midY = stepY;
        startAngle = Math.atan2(p1.y - stepY, 0);
        endAngle = Math.atan2(p2.y - stepY, 0);
      }
    } else {
      // straight
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
    }
    ctx.stroke();

    // Arrow heads
    if (conn.arrowType === 'end' || conn.arrowType === 'both') {
      drawArrowHead(p2.x, p2.y, endAngle, conn.color || '#3b82f6');
    }
    if (conn.arrowType === 'both') {
      drawArrowHead(p1.x, p1.y, startAngle, conn.color || '#3b82f6');
    }

    // Label pill
    if (conn.label && conn.label.trim()) {
      ctx.font = 'bold 11px Inter, sans-serif';
      const textMetrics = ctx.measureText(conn.label);
      const pillW = textMetrics.width + 16;
      const pillH = 20;
      const pillX = midX - pillW / 2;
      const pillY = midY - pillH / 2;

      ctx.setLineDash([]);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#1e293b';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(conn.label, midX, midY);
    }

    ctx.restore();
  }
}
