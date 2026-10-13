import { getStroke } from 'perfect-freehand';
import { PenType, Stroke, StrokeBounds, StrokePoint, TapeItem, FillItem } from '../types/notebook';

export function getStrokeOptions(tool: PenType, size: number, customStreamline?: number) {
  let opts: any;
  switch (tool) {
    case 'ballpoint':
      opts = {
        size,
        thinning: 0.15,
        smoothing: 0.65,
        streamline: 0.55,
        start: { taper: 0, cap: true },
        end: { taper: 0, cap: true },
      };
      break;
    case 'fountain':
      opts = {
        size,
        thinning: 0.65,
        smoothing: 0.75,
        streamline: 0.6,
        start: { taper: size * 2, cap: true },
        end: { taper: size * 2.5, cap: true },
      };
      break;
    case 'brush':
      opts = {
        size: size * 1.6,
        thinning: 0.85,
        smoothing: 0.8,
        streamline: 0.65,
        start: { taper: size * 3, cap: true },
        end: { taper: size * 3.5, cap: true },
      };
      break;
    case 'highlighter':
      opts = {
        size: size * 3.2,
        thinning: 0,
        smoothing: 0.5,
        streamline: 0.45,
        start: { taper: 0, cap: true },
        end: { taper: 0, cap: true },
      };
      break;
    case 'pencil':
      opts = {
        size: size * 1.1,
        thinning: 0.35,
        smoothing: 0.55,
        streamline: 0.4,
        start: { taper: size * 1.2, cap: true },
        end: { taper: size * 1.2, cap: true },
      };
      break;
    case 'fineliner':
      opts = {
        size,
        thinning: 0,
        smoothing: 0.85,
        streamline: 0.75,
        start: { taper: 0, cap: true },
        end: { taper: 0, cap: true },
      };
      break;
    case 'neon':
      opts = {
        size: size * 1.3,
        thinning: 0.1,
        smoothing: 0.7,
        streamline: 0.6,
        start: { taper: size, cap: true },
        end: { taper: size, cap: true },
      };
      break;
    case 'dashed':
      opts = {
        size,
        thinning: 0,
        smoothing: 0.6,
        streamline: 0.5,
        start: { taper: 0, cap: true },
        end: { taper: 0, cap: true },
      };
      break;
    case 'tape':
      opts = {
        size: size * 4.5,
        thinning: 0,
        smoothing: 0.7,
        streamline: 0.6,
        start: { taper: 0, cap: true },
        end: { taper: 0, cap: true },
      };
      break;
    default:
      opts = {
        size,
        thinning: 0.2,
        smoothing: 0.6,
        streamline: 0.5,
        start: { taper: 0, cap: true },
        end: { taper: 0, cap: true },
      };
  }

  if (opts && customStreamline !== undefined && customStreamline !== null) {
    opts.streamline = Math.max(0.0, Math.min(0.95, customStreamline));
  }

  return opts;
}

/**
 * Converts stroke outline points from perfect-freehand into an SVG path data string
 */
export function getSvgPathFromStroke(strokePoints: number[][]): string {
  if (!strokePoints || strokePoints.length === 0) return '';
  const d = strokePoints.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ['M', ...strokePoints[0], 'Q']
  );
  d.push('Z');
  return d.join(' ');
}

/**
 * Calculates bounding box with padding for a stroke
 */
export function calculateStrokeBounds(points: StrokePoint[], strokeSize: number): StrokeBounds {
  if (points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const pad = strokeSize * 2;
  for (const pt of points) {
    if (pt.x < minX) minX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y > maxY) maxY = pt.y;
  }

  return {
    minX: minX - pad,
    minY: minY - pad,
    maxX: maxX + pad,
    maxY: maxY + pad,
  };
}

/**
 * Draws a completed or in-progress stroke directly onto a CanvasRenderingContext2D
 */
export function drawStrokeOnCanvas(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke | { tool: PenType; color: string; size: number; points: StrokePoint[] },
  customStreamline?: number
) {
  if (!stroke.points || stroke.points.length === 0) return;

  // Handle Dashed Pen as a clean dashed stroke path
  if (stroke.tool === 'dashed') {
    if (stroke.points.length < 2) return;
    ctx.save();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.size;
    ctx.setLineDash([stroke.size * 3, stroke.size * 2]);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }
    ctx.stroke();
    ctx.restore();
    return;
  }

  const options = getStrokeOptions(stroke.tool, stroke.size, customStreamline);
  const rawPoints = stroke.points.map((pt) => [pt.x, pt.y, pt.pressure]);
  const outline = getStroke(rawPoints, options);

  if (outline.length === 0) return;

  ctx.save();

  if (stroke.tool === 'highlighter') {
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.45;
  } else if (stroke.tool === 'pencil') {
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 0.82;
  } else if (stroke.tool === 'neon') {
    // Neon aura glow pass
    ctx.shadowColor = stroke.color;
    ctx.shadowBlur = stroke.size * 3.8;
    ctx.globalAlpha = 1.0;
  } else if (stroke.tool === 'tape') {
    ctx.globalAlpha = 0.95;
  } else {
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1.0;
  }

  ctx.fillStyle = stroke.color;

  // Render polygon
  ctx.beginPath();
  ctx.moveTo(outline[0][0], outline[0][1]);
  for (let i = 1; i < outline.length; i++) {
    const [x0, y0] = outline[i];
    const [x1, y1] = outline[(i + 1) % outline.length];
    ctx.quadraticCurveTo(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
  }
  ctx.closePath();
  ctx.fill();

  // Neon bright inner core
  if (stroke.tool === 'neon') {
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.65;
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Draws a GoodNotes 6 style Tape strip on canvas
 */
export function drawTapeOnCanvas(ctx: CanvasRenderingContext2D, tape: TapeItem) {
  if (!tape.points || tape.points.length < 2) return;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = tape.width;

  if (tape.isRevealed) {
    // Revealed state: transparent with dashed outline
    ctx.strokeStyle = tape.color;
    ctx.globalAlpha = 0.15;
    ctx.beginPath();
    ctx.moveTo(tape.points[0].x, tape.points[0].y);
    for (let i = 1; i < tape.points.length; i++) {
      ctx.lineTo(tape.points[i].x, tape.points[i].y);
    }
    ctx.stroke();

    // Subtle dashed border
    ctx.globalAlpha = 0.6;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
  } else {
    // Concealed state: opaque pastel tape
    ctx.globalAlpha = 0.96;
    ctx.strokeStyle = tape.color;
    ctx.shadowColor = 'rgba(0,0,0,0.15)';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.moveTo(tape.points[0].x, tape.points[0].y);
    for (let i = 1; i < tape.points.length; i++) {
      ctx.lineTo(tape.points[i].x, tape.points[i].y);
    }
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Detects scratch-out gesture (rapid zig-zag reversals over an area)
 */
export function detectScratchOutGesture(
  points: StrokePoint[]
): { isScratch: boolean; bounds?: StrokeBounds } {
  if (points.length < 10) return { isScratch: false };

  const duration = (points[points.length - 1].timestamp || 0) - (points[0].timestamp || 0);
  if (duration > 1500) return { isScratch: false };

  // Count horizontal direction changes
  let directionChanges = 0;
  let lastDirection = 0;

  for (let i = 2; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    if (Math.abs(dx) > 3) {
      const dir = dx > 0 ? 1 : -1;
      if (lastDirection !== 0 && dir !== lastDirection) {
        directionChanges++;
      }
      lastDirection = dir;
    }
  }

  // If there are at least 4 rapid zig-zags in a compact box
  if (directionChanges >= 4) {
    const bounds = calculateStrokeBounds(points, 15);
    const width = bounds.maxX - bounds.minX;
    const height = bounds.maxY - bounds.minY;

    if (width < 320 && height < 180) {
      return { isScratch: true, bounds };
    }
  }

  return { isScratch: false };
}

/**
 * Checks if a point hits any line segment within a stroke (used by stroke-based eraser and lasso)
 */
export function isPointNearStroke(
  point: { x: number; y: number },
  stroke: Stroke,
  threshold: number = 10
): boolean {
  const { minX, minY, maxX, maxY } = stroke.bounds;
  // Bounding box quick check
  if (
    point.x < minX - threshold ||
    point.x > maxX + threshold ||
    point.y < minY - threshold ||
    point.y > maxY + threshold
  ) {
    return false;
  }

  const effectiveThreshold = Math.max(threshold, stroke.size);
  const threshSq = effectiveThreshold * effectiveThreshold;

  for (let i = 0; i < stroke.points.length - 1; i++) {
    const p1 = stroke.points[i];
    const p2 = stroke.points[i + 1];

    const distSq = distanceSqToSegment(point, p1, p2);
    if (distSq <= threshSq) {
      return true;
    }
  }

  return false;
}

function distanceSqToSegment(
  p: { x: number; y: number },
  v: { x: number; y: number },
  w: { x: number; y: number }
): number {
  const l2 = (v.x - w.x) * (v.x - w.x) + (v.y - w.y) * (v.y - w.y);
  if (l2 === 0) return (p.x - v.x) * (p.x - v.x) + (p.y - v.y) * (p.y - v.y);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  const projX = v.x + t * (w.x - v.x);
  const projY = v.y + t * (w.y - v.y);
  return (p.x - projX) * (p.x - projX) + (p.y - projY) * (p.y - projY);
}

const fillImgCache = new Map<string, HTMLImageElement>();

/**
 * Draws a Flood Fill region onto a CanvasRenderingContext2D
 */
export function drawFillOnCanvas(ctx: CanvasRenderingContext2D, fill: FillItem) {
  if (!fill.dataUrl) return;
  let img = fillImgCache.get(fill.id);
  if (!img) {
    img = new Image();
    img.src = fill.dataUrl;
    fillImgCache.set(fill.id, img);
  }

  if (img.complete && img.naturalWidth > 0) {
    ctx.save();
    ctx.globalAlpha = fill.opacity;
    ctx.drawImage(img, fill.bounds.minX, fill.bounds.minY);
    ctx.restore();
  }
}

/**
 * Checks if a point falls within a FillItem's bounding box
 */
export function isPointInsideFill(point: { x: number; y: number }, fill: FillItem): boolean {
  return (
    point.x >= fill.bounds.minX &&
    point.x <= fill.bounds.maxX &&
    point.y >= fill.bounds.minY &&
    point.y <= fill.bounds.maxY
  );
}
