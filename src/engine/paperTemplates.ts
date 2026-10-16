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
  paperColor: PaperColor,
  customPitch?: number,
  customLineColor?: string,
  lineOpacity?: number
) {
  const palette = PAPER_COLORS[paperColor] || PAPER_COLORS.white;

  ctx.save();
  // Clear and paint paper background
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, width, height);

  const activeLineColor = customLineColor || palette.line;
  ctx.lineWidth = 1;
  ctx.strokeStyle = activeLineColor;
  ctx.fillStyle = palette.text;
  if (typeof lineOpacity === 'number' && lineOpacity >= 0 && lineOpacity <= 1) {
    ctx.globalAlpha = lineOpacity;
  }

  switch (template) {
    case 'blank':
      // Just plain paper
      break;

    case 'lined': {
      const lineSpacing = customPitch && customPitch >= 12 && customPitch <= 120 ? customPitch : 32;
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
      const lineSpacing = customPitch && customPitch >= 12 && customPitch <= 120 ? customPitch : 32;
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
      const gridSize = customPitch && customPitch >= 10 && customPitch <= 120 ? customPitch : 28;
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
      const dotSpacing = customPitch && customPitch >= 10 && customPitch <= 120 ? customPitch : 28;
      ctx.fillStyle = activeLineColor;
      for (let x = 40; x < width - 30; x += dotSpacing) {
        for (let y = 40; y < height - 30; y += dotSpacing) {
          ctx.beginPath();
          ctx.arc(x, y, 1.25, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }

    case 'isometric':
    case 'isometric-3d': {
      // True 3D Isometric Projection Grid (Vertical 90°, and 30° / 150° Axes)
      const L = customPitch && customPitch >= 14 && customPitch <= 120 ? customPitch : 30;
      const dx = (L * Math.sqrt(3)) / 2;
      const topPadding = 50;
      const bottomLimit = height - 25;

      ctx.save();
      ctx.strokeStyle = activeLineColor;
      ctx.lineWidth = 0.75;

      // Header Tag
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillStyle = palette.text;
      ctx.fillText('📐 İZOMETRİK 3D TEKNİK ÇİZİM KAĞIDI (30° / 90° / 150°)', 35, 34);

      // Clip inside margins
      ctx.save();
      ctx.beginPath();
      ctx.rect(20, topPadding, width - 40, bottomLimit - topPadding);
      ctx.clip();

      // 1. Vertical lines (90°)
      for (let x = 20; x < width - 15; x += dx) {
        ctx.beginPath();
        ctx.moveTo(x, topPadding);
        ctx.lineTo(x, bottomLimit);
        ctx.stroke();
      }

      // 2. Diagonals at +30°: y = x / sqrt(3) + c => c = y - x / sqrt(3)
      const slope = 1 / Math.sqrt(3);
      const minC = topPadding - width * slope;
      const maxC = bottomLimit;

      for (let c = minC; c <= maxC; c += L) {
        ctx.beginPath();
        ctx.moveTo(0, c);
        ctx.lineTo(width, c + width * slope);
        ctx.stroke();
      }

      // 3. Diagonals at -30° (150°): y = -x / sqrt(3) + c
      const minC2 = topPadding;
      const maxC2 = bottomLimit + width * slope;

      for (let c = minC2; c <= maxC2; c += L) {
        ctx.beginPath();
        ctx.moveTo(0, c);
        ctx.lineTo(width, c - width * slope);
        ctx.stroke();
      }

      ctx.restore();
      ctx.restore();
      break;
    }

    case 'isometric-dots': {
      // Isometric 3D Dot Matrix Grid
      const L = customPitch && customPitch >= 14 && customPitch <= 120 ? customPitch : 30;
      const dx = (L * Math.sqrt(3)) / 2;
      const topPadding = 55;

      ctx.save();

      // Header Tag
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillStyle = palette.text;
      ctx.fillText('⁖ İZOMETRİK 3D NOKTALI ÇİZİM KAĞIDI (DOT MATRIX)', 35, 34);
      ctx.fillStyle = activeLineColor;

      let col = 0;
      for (let x = 30; x < width - 20; x += dx) {
        const isOdd = col % 2 === 1;
        const yOffset = isOdd ? L / 2 : 0;
        for (let y = topPadding + yOffset; y < height - 25; y += L) {
          ctx.beginPath();
          ctx.arc(x, y, 1.3, 0, Math.PI * 2);
          ctx.fill();
        }
        col++;
      }

      ctx.restore();
      break;
    }

    case 'polar-coordinate': {
      // Precision Polar & Radial Coordinate Grid
      const cx = width / 2;
      const cy = height / 2 + 15;
      const maxR = Math.min(cx - 35, cy - 75, height - cy - 35);
      const dr = customPitch && customPitch >= 14 && customPitch <= 80 ? customPitch : 26;

      ctx.save();

      // Header Title
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillStyle = palette.text;
      ctx.fillText('🎯 RADYAL & POLAR KOORDİNAT DÜZLEMİ (r, θ)', 40, 40);

      // 1. Concentric Circles
      let ringIndex = 1;
      for (let r = dr; r <= maxR; r += dr) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        const isMajor = ringIndex % 5 === 0 || r + dr > maxR;
        ctx.lineWidth = isMajor ? 1.4 : 0.6;
        ctx.strokeStyle = activeLineColor;
        ctx.stroke();

        // Distance label along +X axis
        if (isMajor) {
          ctx.font = 'bold 9px Inter, monospace';
          ctx.fillStyle = palette.text;
          ctx.fillText(`r=${ringIndex}`, cx + r - 14, cy - 4);
        }
        ringIndex++;
      }

      // 2. Radial Rays (every 15°)
      const angles = [
        { deg: 0, rad: '0', isAxis: true },
        { deg: 15, isAxis: false },
        { deg: 30, rad: 'π/6', isAxis: false },
        { deg: 45, rad: 'π/4', isAxis: false },
        { deg: 60, rad: 'π/3', isAxis: false },
        { deg: 75, isAxis: false },
        { deg: 90, rad: 'π/2', isAxis: true },
        { deg: 105, isAxis: false },
        { deg: 120, rad: '2π/3', isAxis: false },
        { deg: 135, rad: '3π/4', isAxis: false },
        { deg: 150, rad: '5π/6', isAxis: false },
        { deg: 165, isAxis: false },
        { deg: 180, rad: 'π', isAxis: true },
        { deg: 195, isAxis: false },
        { deg: 210, rad: '7π/6', isAxis: false },
        { deg: 225, rad: '5π/4', isAxis: false },
        { deg: 240, rad: '4π/3', isAxis: false },
        { deg: 255, isAxis: false },
        { deg: 270, rad: '3π/2', isAxis: true },
        { deg: 285, isAxis: false },
        { deg: 300, rad: '5π/3', isAxis: false },
        { deg: 315, rad: '7π/4', isAxis: false },
        { deg: 330, rad: '11π/6', isAxis: false },
        { deg: 345, isAxis: false },
      ];

      angles.forEach(({ deg, rad, isAxis }) => {
        const radAngle = (deg * Math.PI) / 180;
        const cosA = Math.cos(radAngle);
        const sinA = -Math.sin(radAngle); // Canvas Y points downward

        const x2 = cx + maxR * cosA;
        const y2 = cy + maxR * sinA;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(x2, y2);
        ctx.lineWidth = isAxis ? 1.5 : rad ? 0.8 : 0.4;
        ctx.strokeStyle = isAxis ? (customLineColor || palette.line) : activeLineColor;
        ctx.stroke();

        // Outer angle labels
        if (rad !== undefined) {
          const labelDist = maxR + 18;
          const lx = cx + labelDist * cosA;
          const ly = cy + labelDist * sinA;

          ctx.font = isAxis ? 'bold 10px Inter, sans-serif' : '9px Inter, sans-serif';
          ctx.fillStyle = palette.text;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${deg}°`, lx, ly - 5);
          ctx.font = '8px Inter, monospace';
          ctx.fillText(rad, lx, ly + 6);
        }
      });

      // 3. Central Pole Point O(0,0)
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fillStyle = activeLineColor;
      ctx.fill();
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.fillStyle = palette.text;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText('O (0,0)', cx + 6, cy - 4);

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
      // 3-Tier High-Precision Millimeter CAD Graph Paper (1mm / 5mm / 10mm)
      ctx.save();
      const originX = 35;
      const originY = 55;
      const endX = width - 35;
      const endY = height - 75;

      const majorStep = customPitch && customPitch >= 20 && customPitch <= 80 ? customPitch : 40;
      const mediumStep = majorStep / 2; // 5mm
      const minorStep = majorStep / 10; // 1mm

      // Header
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillStyle = palette.text;
      ctx.fillText('📐 MÜHENDİSLİK TEKNİK ÇİZİM PAFTASI (1mm / 5mm / 10mm CAD GRID)', originX, 38);

      // Clip inside graph bounds
      ctx.save();
      ctx.beginPath();
      ctx.rect(originX, originY, endX - originX, endY - originY);
      ctx.clip();

      // 1. Minor 1mm lines (ultra-fine)
      ctx.lineWidth = 0.35;
      ctx.strokeStyle = activeLineColor;
      ctx.globalAlpha = (lineOpacity ?? 0.8) * 0.45;
      for (let x = originX; x <= endX; x += minorStep) {
        ctx.beginPath();
        ctx.moveTo(x, originY);
        ctx.lineTo(x, endY);
        ctx.stroke();
      }
      for (let y = originY; y <= endY; y += minorStep) {
        ctx.beginPath();
        ctx.moveTo(originX, y);
        ctx.lineTo(endX, y);
        ctx.stroke();
      }

      // 2. Medium 5mm lines
      ctx.lineWidth = 0.75;
      ctx.globalAlpha = (lineOpacity ?? 0.8) * 0.75;
      for (let x = originX; x <= endX; x += mediumStep) {
        ctx.beginPath();
        ctx.moveTo(x, originY);
        ctx.lineTo(x, endY);
        ctx.stroke();
      }
      for (let y = originY; y <= endY; y += mediumStep) {
        ctx.beginPath();
        ctx.moveTo(originX, y);
        ctx.lineTo(endX, y);
        ctx.stroke();
      }

      // 3. Major 10mm lines
      ctx.lineWidth = 1.35;
      ctx.globalAlpha = lineOpacity ?? 0.8;
      for (let x = originX; x <= endX; x += majorStep) {
        ctx.beginPath();
        ctx.moveTo(x, originY);
        ctx.lineTo(x, endY);
        ctx.stroke();
      }
      for (let y = originY; y <= endY; y += majorStep) {
        ctx.beginPath();
        ctx.moveTo(originX, y);
        ctx.lineTo(endX, y);
        ctx.stroke();
      }
      ctx.restore();

      // Outer Border
      ctx.lineWidth = 2.0;
      ctx.strokeStyle = activeLineColor;
      ctx.strokeRect(originX, originY, endX - originX, endY - originY);

      // Engineering Title Block (Antet) in bottom right
      const tbW = Math.min(320, endX - originX - 40);
      const tbH = 50;
      const tbX = endX - tbW;
      const tbY = endY + 12;

      ctx.fillStyle = palette.bg;
      ctx.fillRect(tbX, tbY, tbW, tbH);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = activeLineColor;
      ctx.strokeRect(tbX, tbY, tbW, tbH);

      // Dividing lines inside title block
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(tbX, tbY + 25);
      ctx.lineTo(tbX + tbW, tbY + 25);
      ctx.moveTo(tbX + tbW * 0.6, tbY + 25);
      ctx.lineTo(tbX + tbW * 0.6, tbY + tbH);
      ctx.stroke();

      ctx.font = 'bold 10px Inter, monospace';
      ctx.fillStyle = palette.text;
      ctx.fillText('PROJE: NOTFREE TEKNİK ÇİZİM', tbX + 8, tbY + 16);
      ctx.font = '9px Inter, monospace';
      ctx.fillText('ÖLÇEK: 1:1 (10mm=1cm)', tbX + 8, tbY + 41);
      ctx.fillText('PAFTA: A4-CAD', tbX + tbW * 0.6 + 8, tbY + 41);

      ctx.restore();
      break;
    }

    case 'logarithmic-grid': {
      // Semi-Logarithmic Scientific & Engineering Graph Paper (Linear X, Logarithmic Y)
      ctx.save();
      const originX = 55;
      const originY = 60;
      const endX = width - 40;
      const endY = height - 50;
      const graphW = endX - originX;
      const graphH = endY - originY;

      // Header
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillStyle = palette.text;
      ctx.fillText('📈 YARI-LOGARİTMİK GRAFİK KAĞIDI (SEMI-LOG / 3 DEKAD FREKANS & ÜSSEL)', originX, 40);

      // 1. Linear X Columns (10 major divisions, e.g. 0 to 100)
      const numXCols = 10;
      const colW = graphW / numXCols;

      for (let i = 0; i <= numXCols; i++) {
        const x = originX + i * colW;
        ctx.beginPath();
        ctx.moveTo(x, originY);
        ctx.lineTo(x, endY);
        ctx.lineWidth = i === 0 || i === numXCols ? 1.5 : 0.8;
        ctx.strokeStyle = activeLineColor;
        ctx.stroke();

        // X Axis labels
        ctx.font = '9px Inter, monospace';
        ctx.fillStyle = palette.text;
        ctx.textAlign = 'center';
        ctx.fillText(`${i * 10}`, x, endY + 16);
      }

      // 2. Logarithmic Y Decades (3 full decades: 10^0, 10^1, 10^2, 10^3)
      const decades = 3;
      const decadeH = graphH / decades;

      for (let d = 0; d < decades; d++) {
        const decadeBaseY = endY - d * decadeH;

        for (let n = 1; n <= 10; n++) {
          const logVal = Math.log10(n);
          const y = decadeBaseY - logVal * decadeH;

          const isMajor = n === 1 || n === 10;
          ctx.beginPath();
          ctx.moveTo(originX, y);
          ctx.lineTo(endX, y);
          ctx.lineWidth = isMajor ? 1.4 : 0.6;
          ctx.strokeStyle = activeLineColor;
          ctx.stroke();

          // Y Axis Decade labels
          ctx.textAlign = 'right';
          ctx.textBaseline = 'middle';
          if (isMajor) {
            ctx.font = 'bold 10px Inter, monospace';
            ctx.fillStyle = palette.text;
            const exp = d + (n === 10 ? 1 : 0);
            ctx.fillText(`10^${exp}`, originX - 8, y);
          } else {
            ctx.font = '8px Inter, monospace';
            ctx.fillStyle = palette.text;
            ctx.fillText(`${n}`, originX - 8, y);
          }
        }
      }

      // Outer graph frame
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = activeLineColor;
      ctx.strokeRect(originX, originY, graphW, graphH);

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

    case 'tianzige-kanji': {
      // East Asian Character Grid (Tianzige 田字格 & Miyige 米字格)
      const cellSize = customPitch && customPitch >= 36 && customPitch <= 90 ? customPitch : 54;
      const startX = 45;
      const startY = 85;
      const cols = Math.floor((width - startX * 2) / cellSize);
      const rows = Math.floor((height - startY - 40) / cellSize);

      ctx.save();
      // Header
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillStyle = palette.text;
      ctx.fillText('🈯 DOĞU ASYA KARAKTER & KANJİ ÇALIŞMA DEFTERİ (TIANZIGE)', 45, 45);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cellX = startX + c * cellSize;
          const cellY = startY + r * cellSize;

          // Outer solid square border
          ctx.strokeStyle = activeLineColor;
          ctx.lineWidth = 1.0;
          ctx.setLineDash([]);
          ctx.strokeRect(cellX, cellY, cellSize, cellSize);

          // Inner dashed cross (田字格)
          ctx.save();
          ctx.strokeStyle = activeLineColor;
          ctx.lineWidth = 0.6;
          ctx.setLineDash([3, 3]);

          // Horizontal midline
          ctx.beginPath();
          ctx.moveTo(cellX, cellY + cellSize / 2);
          ctx.lineTo(cellX + cellSize, cellY + cellSize / 2);
          ctx.stroke();

          // Vertical midline
          ctx.beginPath();
          ctx.moveTo(cellX + cellSize / 2, cellY);
          ctx.lineTo(cellX + cellSize / 2, cellY + cellSize);
          ctx.stroke();

          // Subtle diagonal guidelines (米字格)
          ctx.lineWidth = 0.4;
          ctx.setLineDash([2, 4]);
          ctx.beginPath();
          ctx.moveTo(cellX, cellY);
          ctx.lineTo(cellX + cellSize, cellY + cellSize);
          ctx.moveTo(cellX + cellSize, cellY);
          ctx.lineTo(cellX, cellY + cellSize);
          ctx.stroke();

          ctx.restore();
        }
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
