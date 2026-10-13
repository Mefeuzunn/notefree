import { PageTemplate, PaperColor } from '../types/notebook';

export const PAPER_COLORS: Record<PaperColor, { bg: string; line: string; margin: string; text: string }> = {
  white: {
    bg: '#ffffff',
    line: '#e2e8f0',
    margin: '#f87171',
    text: '#64748b',
  },
  cream: {
    bg: '#fcfaf2',
    line: '#e9e3d3',
    margin: '#f87171',
    text: '#78716c',
  },
  'yellow-pad': {
    bg: '#fefce8',
    line: '#fef08a',
    margin: '#ef4444',
    text: '#854d0e',
  },
  kraft: {
    bg: '#e7d8be',
    line: '#d1be9e',
    margin: '#b91c1c',
    text: '#78350f',
  },
  dark: {
    bg: '#181b26',
    line: '#282f44',
    margin: '#e11d48',
    text: '#94a3b8',
  },
};

/**
 * Draws the selected notebook template onto the canvas background layer
 */
export function drawPaperTemplate(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  template: PageTemplate,
  paperColor: PaperColor
) {
  const palette = PAPER_COLORS[paperColor] || PAPER_COLORS.white;

  ctx.save();
  // Clear and paint paper background
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, width, height);

  ctx.lineWidth = 1;
  ctx.strokeStyle = palette.line;
  ctx.fillStyle = palette.text;

  switch (template) {
    case 'blank':
      // Just plain paper
      break;

    case 'lined': {
      const lineSpacing = 32;
      const topPadding = 60;
      for (let y = topPadding; y < height - 20; y += lineSpacing) {
        ctx.beginPath();
        ctx.moveTo(30, y);
        ctx.lineTo(width - 30, y);
        ctx.stroke();
      }
      break;
    }

    case 'lined-margin': {
      const lineSpacing = 32;
      const topPadding = 60;
      const marginX = 90;

      // Red left vertical margin line
      ctx.save();
      ctx.strokeStyle = palette.margin;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(marginX, 30);
      ctx.lineTo(marginX, height - 30);
      ctx.stroke();
      ctx.restore();

      // Horizontal lines
      for (let y = topPadding; y < height - 20; y += lineSpacing) {
        ctx.beginPath();
        ctx.moveTo(30, y);
        ctx.lineTo(width - 30, y);
        ctx.stroke();
      }
      break;
    }

    case 'grid-5mm': {
      const gridSize = 28;
      // Vertical lines
      for (let x = 30; x < width - 20; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 30);
        ctx.lineTo(x, height - 30);
        ctx.stroke();
      }
      // Horizontal lines
      for (let y = 30; y < height - 20; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(30, y);
        ctx.lineTo(width - 30, y);
        ctx.stroke();
      }
      break;
    }

    case 'dots': {
      const dotSpacing = 28;
      ctx.fillStyle = palette.line;
      for (let x = 40; x < width - 30; x += dotSpacing) {
        for (let y = 40; y < height - 30; y += dotSpacing) {
          ctx.beginPath();
          ctx.arc(x, y, 1.25, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }

    case 'isometric': {
      const step = 32;
      const h = (step * Math.sqrt(3)) / 2;
      ctx.save();
      ctx.strokeStyle = palette.line;
      ctx.lineWidth = 0.8;

      // Horizontal lines
      for (let y = 30; y < height - 20; y += h) {
        ctx.beginPath();
        ctx.moveTo(20, y);
        ctx.lineTo(width - 20, y);
        ctx.stroke();
      }

      // Diagonal +60 deg
      for (let x = -height; x < width + height; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 20);
        ctx.lineTo(x + (height * Math.sqrt(3)) / 3, height - 20);
        ctx.stroke();
      }

      // Diagonal -60 deg
      for (let x = -height; x < width + height; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 20);
        ctx.lineTo(x - (height * Math.sqrt(3)) / 3, height - 20);
        ctx.stroke();
      }
      ctx.restore();
      break;
    }

    case 'cornell': {
      const headerY = 70;
      const summaryY = height - 160;
      const cueColX = 220;

      // Header bottom border
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(30, headerY);
      ctx.lineTo(width - 30, headerY);
      ctx.stroke();

      // Cue column right border
      ctx.beginPath();
      ctx.moveTo(cueColX, headerY);
      ctx.lineTo(cueColX, summaryY);
      ctx.stroke();

      // Summary top border
      ctx.beginPath();
      ctx.moveTo(30, summaryY);
      ctx.lineTo(width - 30, summaryY);
      ctx.stroke();

      // Notes area horizontal lines
      ctx.lineWidth = 0.8;
      for (let y = headerY + 30; y < summaryY - 10; y += 30) {
        ctx.beginPath();
        ctx.moveTo(cueColX, y);
        ctx.lineTo(width - 30, y);
        ctx.stroke();
      }

      // Cornell labels
      ctx.font = '600 12px Inter, sans-serif';
      ctx.fillStyle = palette.text;
      ctx.fillText('BAŞLIK / KONU & TARİH', 40, 45);
      ctx.fillText('İPUÇLARI / SORULAR', 40, headerY + 25);
      ctx.fillText('NOTLAR & DETAYLAR', cueColX + 20, headerY + 25);
      ctx.fillText('ÖZET (SUMMARY)', 40, summaryY + 25);
      break;
    }

    case 'planner-weekly': {
      const headerY = 60;
      const days = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
      const colWidth = (width - 60) / days.length;

      ctx.lineWidth = 1.5;
      ctx.strokeRect(30, headerY, width - 60, height - headerY - 40);

      // Day columns
      ctx.font = '600 13px Inter, sans-serif';
      for (let i = 0; i < days.length; i++) {
        const x = 30 + i * colWidth;
        if (i > 0) {
          ctx.beginPath();
          ctx.moveTo(x, headerY);
          ctx.lineTo(x, height - 40);
          ctx.stroke();
        }

        // Day header box
        ctx.fillStyle = palette.line;
        ctx.fillRect(x + 1, headerY + 1, colWidth - 2, 32);

        ctx.fillStyle = palette.text;
        ctx.textAlign = 'center';
        ctx.fillText(days[i], x + colWidth / 2, headerY + 22);

        // Lines inside days
        ctx.lineWidth = 0.8;
        for (let y = headerY + 65; y < height - 50; y += 28) {
          ctx.beginPath();
          ctx.moveTo(x + 10, y);
          ctx.lineTo(x + colWidth - 10, y);
          ctx.stroke();
        }
      }
      ctx.textAlign = 'left';
      break;
    }

    case 'planner-daily': {
      const leftColW = 120;
      const startY = 80;

      // Header Title
      ctx.font = '700 18px Inter, sans-serif';
      ctx.fillStyle = palette.text;
      ctx.fillText('GÜNLÜK PLANLAYICI & AJANDA', 40, 50);

      // Hours schedule (08:00 - 21:00)
      ctx.font = '500 12px Inter, sans-serif';
      let currentY = startY;
      for (let hour = 8; hour <= 21; hour++) {
        const timeStr = `${hour < 10 ? '0' : ''}${hour}:00`;
        ctx.fillStyle = palette.text;
        ctx.fillText(timeStr, 40, currentY + 15);

        ctx.beginPath();
        ctx.moveTo(leftColW, currentY + 10);
        ctx.lineTo(width / 2 + 50, currentY + 10);
        ctx.stroke();

        currentY += 45;
      }

      // Vertical separator
      const rightX = width / 2 + 70;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(rightX, startY - 10);
      ctx.lineTo(rightX, height - 50);
      ctx.stroke();

      // Right Side: Öncelikler & Yapılacaklar Listesi
      ctx.font = '600 14px Inter, sans-serif';
      ctx.fillText('ÖNCELİKLİ GÖREVLER', rightX + 20, startY + 10);

      let todoY = startY + 35;
      for (let i = 0; i < 6; i++) {
        ctx.strokeRect(rightX + 20, todoY - 10, 14, 14);
        ctx.beginPath();
        ctx.moveTo(rightX + 45, todoY);
        ctx.lineTo(width - 40, todoY);
        ctx.stroke();
        todoY += 35;
      }

      ctx.fillText('ÖNEMLİ NOTLAR & FİKİRLER', rightX + 20, todoY + 30);
      let notesY = todoY + 60;
      for (let i = 0; i < 10; i++) {
        ctx.beginPath();
        ctx.moveTo(rightX + 20, notesY);
        ctx.lineTo(width - 40, notesY);
        ctx.stroke();
        notesY += 32;
      }
      break;
    }

    case 'music': {
      const staveSpacing = 10; // between lines in a stave
      const groupSpacing = 65; // between staves
      let y = 80;

      while (y + 4 * staveSpacing < height - 50) {
        ctx.lineWidth = 1.2;
        for (let i = 0; i < 5; i++) {
          const lineY = y + i * staveSpacing;
          ctx.beginPath();
          ctx.moveTo(40, lineY);
          ctx.lineTo(width - 40, lineY);
          ctx.stroke();
        }
        y += 4 * staveSpacing + groupSpacing;
      }
      break;
    }

    case 'hexagonal': {
      const radius = 22;
      const a = (2 * Math.PI) / 6;
      const w = Math.sqrt(3) * radius;
      const h = 2 * radius;

      ctx.save();
      ctx.strokeStyle = palette.line;
      ctx.lineWidth = 0.8;

      for (let y = 40; y < height - 20; y += (h * 3) / 4) {
        const offset = Math.floor(y / ((h * 3) / 4)) % 2 === 0 ? 0 : w / 2;
        for (let x = 40; x < width - 20; x += w) {
          drawHexagon(ctx, x + offset, y, radius, a);
        }
      }
      ctx.restore();
      break;
    }

    case 'chemistry-hex': {
      // Organic chemistry benzene rings
      const radius = 18;
      const a = (2 * Math.PI) / 6;
      const w = Math.sqrt(3) * radius;
      const h = 2 * radius;

      ctx.save();
      ctx.strokeStyle = palette.line;
      ctx.lineWidth = 1;

      // Header title
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillText('⚗️ ORGANİK KİMYA & BENZEN ŞABLONU', 40, 42);

      for (let y = 70; y < height - 30; y += h * 1.5) {
        const row = Math.floor((y - 70) / (h * 1.5));
        const offset = row % 2 === 0 ? 0 : w * 0.75;
        for (let x = 45; x < width - 40; x += w * 1.5) {
          drawHexagon(ctx, x + offset, y, radius, a);
        }
      }
      ctx.restore();
      break;
    }

    case 'engineering-1mm': {
      // 3-tier Precision Millimeter Graph Paper
      ctx.save();
      const originX = 35;
      const originY = 35;
      const endX = width - 35;
      const endY = height - 70;

      // Major 10mm lines
      ctx.strokeStyle = palette.line;
      ctx.lineWidth = 1.2;
      for (let x = originX; x <= endX; x += 38) {
        ctx.beginPath();
        ctx.moveTo(x, originY);
        ctx.lineTo(x, endY);
        ctx.stroke();
      }
      for (let y = originY; y <= endY; y += 38) {
        ctx.beginPath();
        ctx.moveTo(originX, y);
        ctx.lineTo(endX, y);
        ctx.stroke();
      }

      // Medium 5mm lines
      ctx.lineWidth = 0.6;
      for (let x = originX; x <= endX; x += 19) {
        if ((x - originX) % 38 !== 0) {
          ctx.beginPath();
          ctx.moveTo(x, originY);
          ctx.lineTo(x, endY);
          ctx.stroke();
        }
      }
      for (let y = originY; y <= endY; y += 19) {
        if ((y - originY) % 38 !== 0) {
          ctx.beginPath();
          ctx.moveTo(originX, y);
          ctx.lineTo(endX, y);
          ctx.stroke();
        }
      }

      // Border and Engineering Title Block
      ctx.lineWidth = 2;
      ctx.strokeRect(originX, originY, endX - originX, endY - originY);

      // Title block box at bottom
      const tbX = endX - 240;
      const tbY = endY + 8;
      ctx.strokeRect(tbX, tbY, 240, 50);
      ctx.font = '10px Inter, monospace';
      ctx.fillText('MÜHENDİSLİK TEKNİK ÇİZİM', tbX + 10, tbY + 20);
      ctx.fillText('ÖLÇEK: 1:1  |  NOTFREE CAD', tbX + 10, tbY + 38);

      ctx.restore();
      break;
    }

    case 'language-vocab': {
      // 3-Column Vocabulary Study Template
      const topY = 60;
      const col1Width = (width - 70) * 0.28;
      const col2Width = (width - 70) * 0.36;
      const col3Width = (width - 70) * 0.36;

      ctx.save();
      // Column Header Bars
      ctx.fillStyle = palette.line;
      ctx.fillRect(35, topY, width - 70, 32);

      ctx.fillStyle = palette.text;
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillText('KELİME / VOCABULARY', 45, topY + 20);
      ctx.fillText('ANLAMI / MEANING', 45 + col1Width, topY + 20);
      ctx.fillText('ÖRNEK CÜMLE / SENTENCE', 45 + col1Width + col2Width, topY + 20);

      // Vertical separators
      ctx.strokeStyle = palette.line;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(35 + col1Width, topY);
      ctx.lineTo(35 + col1Width, height - 30);
      ctx.moveTo(35 + col1Width + col2Width, topY);
      ctx.lineTo(35 + col1Width + col2Width, height - 30);
      ctx.stroke();

      // Horizontal writing rows
      ctx.lineWidth = 0.8;
      for (let y = topY + 32; y < height - 30; y += 34) {
        ctx.beginPath();
        ctx.moveTo(35, y);
        ctx.lineTo(width - 35, y);
        ctx.stroke();
      }
      ctx.restore();
      break;
    }

    case 'guitar-tab': {
      // 6-string Guitar Tablature
      const staveSpacing = 11;
      const groupSpacing = 55;
      const strings = ['e', 'B', 'G', 'D', 'A', 'E'];
      let y = 80;

      ctx.save();
      ctx.font = 'bold 11px Inter, monospace';
      ctx.fillText('🎸 GİTAR TABLATÜR (TAB)', 40, 45);

      while (y + 5 * staveSpacing < height - 40) {
        ctx.lineWidth = 1.1;
        for (let i = 0; i < 6; i++) {
          const lineY = y + i * staveSpacing;
          // String label
          ctx.fillStyle = palette.text;
          ctx.fillText(strings[i], 38, lineY + 3);

          ctx.beginPath();
          ctx.moveTo(56, lineY);
          ctx.lineTo(width - 40, lineY);
          ctx.stroke();
        }

        // Measure / bar lines
        const barSpacing = (width - 96) / 4;
        for (let b = 0; b <= 4; b++) {
          const bx = 56 + b * barSpacing;
          ctx.beginPath();
          ctx.moveTo(bx, y);
          ctx.lineTo(bx, y + 5 * staveSpacing);
          ctx.stroke();
        }

        y += 5 * staveSpacing + groupSpacing;
      }
      ctx.restore();
      break;
    }

    case 'planner-habit': {
      // Monthly 31-day Habit Tracking Grid
      const topY = 70;
      const leftColWidth = 180;
      const dayCellWidth = (width - 80 - leftColWidth) / 31;

      ctx.save();
      ctx.font = 'bold 13px Inter, sans-serif';
      ctx.fillText('🎯 ALIŞKANLIK VE HEDEF TAKİP ÇİZELGESİ (HABIT TRACKER)', 40, 45);

      // Header row
      ctx.font = 'bold 9px Inter, monospace';
      ctx.fillStyle = palette.text;
      ctx.fillText('ALIŞKANLIK / HEDEF', 45, topY + 18);
      for (let day = 1; day <= 31; day++) {
        ctx.fillText(
          day.toString(),
          40 + leftColWidth + (day - 1) * dayCellWidth + 2,
          topY + 18
        );
      }

      // Grid rows
      ctx.strokeStyle = palette.line;
      ctx.lineWidth = 0.8;
      let rowY = topY + 28;
      for (let r = 0; r < 20; r++) {
        ctx.beginPath();
        ctx.moveTo(40, rowY);
        ctx.lineTo(width - 40, rowY);
        ctx.stroke();

        // Vertical day dividers
        for (let day = 0; day <= 31; day++) {
          const dx = 40 + leftColWidth + day * dayCellWidth;
          ctx.beginPath();
          ctx.moveTo(dx, topY);
          ctx.lineTo(dx, topY + 28 + 20 * 30);
          ctx.stroke();
        }

        rowY += 30;
      }
      ctx.restore();
      break;
    }
  }

  ctx.restore();
}

function drawHexagon(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, a: number) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = a * i + Math.PI / 6;
    const px = x + r * Math.cos(angle);
    const py = y + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
}
