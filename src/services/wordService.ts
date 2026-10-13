import mammoth from 'mammoth';
import { Page } from '../types/notebook';

/**
 * Reads a Word (.docx) file and creates notebook pages from its formatted content
 */
export async function convertDocxToPages(file: File): Promise<Page[]> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const htmlContent = result.value;

  // Render HTML onto an offscreen canvas to generate an A4 defter page
  const pageCanvas = document.createElement('canvas');
  const width = 800;
  const height = 1130;
  pageCanvas.width = width * 2;
  pageCanvas.height = height * 2;
  const ctx = pageCanvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas context could not be initialized');
  }

  // Paint paper background
  ctx.scale(2, 2);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Render parsed text and headings into clean notebook format
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;

  ctx.fillStyle = '#1e293b';
  ctx.font = '700 24px Inter, sans-serif';
  ctx.fillText(file.name.replace(/\.docx$/i, ''), 50, 70);

  // Decorative header line
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(50, 90);
  ctx.lineTo(width - 50, 90);
  ctx.stroke();

  let currentY = 130;
  ctx.font = '400 15px Inter, sans-serif';
  const maxWidth = width - 100;
  const lineHeight = 26;

  const elements = tempDiv.querySelectorAll('p, h1, h2, h3, li');
  const pages: Page[] = [];

  let currentPageIndex = 1;
  let pageStrokesCanvas = pageCanvas;
  let pageCtx = ctx;

  for (let el of Array.from(elements)) {
    const text = el.textContent || '';
    if (!text.trim()) continue;

    if (el.tagName === 'H1') {
      pageCtx.font = '700 20px Inter, sans-serif';
      currentY += 15;
    } else if (el.tagName === 'H2') {
      pageCtx.font = '600 17px Inter, sans-serif';
      currentY += 10;
    } else {
      pageCtx.font = '400 15px Inter, sans-serif';
    }

    // Wrap lines
    const words = text.split(' ');
    let line = '';

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = pageCtx.measureText(testLine);
      const testWidth = metrics.width;

      if (testWidth > maxWidth && n > 0) {
        pageCtx.fillText(line, 50, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;

        if (currentY > height - 60) {
          // Page full -> save current page and start next page!
          const dataUrl = pageStrokesCanvas.toDataURL('image/png');
          pages.push({
            id: `docx_page_${Date.now()}_${currentPageIndex}`,
            pageNumber: currentPageIndex,
            template: 'blank',
            paperColor: 'white',
            strokes: [],
            backgroundImageUrl: dataUrl,
            width: 800,
            height: 1130,
            title: `${file.name} - Sayfa ${currentPageIndex}`,
          });

          currentPageIndex++;
          pageStrokesCanvas = document.createElement('canvas');
          pageStrokesCanvas.width = width * 2;
          pageStrokesCanvas.height = height * 2;
          pageCtx = pageStrokesCanvas.getContext('2d')!;
          pageCtx.scale(2, 2);
          pageCtx.fillStyle = '#ffffff';
          pageCtx.fillRect(0, 0, width, height);
          currentY = 60;
        }
      } else {
        line = testLine;
      }
    }
    pageCtx.fillText(line, 50, currentY);
    currentY += lineHeight + 8;
  }

  // Push final page
  const dataUrl = pageStrokesCanvas.toDataURL('image/png');
  pages.push({
    id: `docx_page_${Date.now()}_${currentPageIndex}`,
    pageNumber: currentPageIndex,
    template: 'blank',
    paperColor: 'white',
    strokes: [],
    backgroundImageUrl: dataUrl,
    width: 800,
    height: 1130,
    title: `${file.name} - Sayfa ${currentPageIndex}`,
  });

  return pages;
}
