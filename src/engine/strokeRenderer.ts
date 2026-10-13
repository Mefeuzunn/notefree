import { getStroke } from 'perfect-freehand';
import { PenType, Stroke, StrokeBounds, StrokePoint } from '../types/notebook';

export function getStrokeOptions(tool: PenType, size: number) {
  switch (tool) {
    case 'ballpoint':
      return {
        size,
        thinning: 0.15,
        smoothing: 0.65,
        streamline: 0.55,
        start: { taper: 0, cap: true },
        end: { taper: 0, cap: true },
      };
    case 'fountain':
      return {
        size,
        thinning: 0.65,
        smoothing: 0.75,
        streamline: 0.6,
        start: { taper: size * 2, cap: true },
        end: { taper: size * 2.5, cap: true },
      };
    case 'brush':
      return {
        size: size * 1.6,
        thinning: 0.85,
        smoothing: 0.8,
        streamline: 0.65,
        start: { taper: size * 3, cap: true },
        end: { taper: size * 3.5, cap: true },
      };
    case 'highlighter':
      return {
        size: size * 3.2,
        thinning: 0,
        smoothing: 0.5,
        streamline: 0.45,
        start: { taper: 0, cap: true },
        end: { taper: 0, cap: true },
      };
  }
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
  stroke: Stroke | { tool: PenType; color: string; size: number; points: StrokePoint[] }
) {
  if (!stroke.points || stroke.points.length === 0) return;

  const options = getStrokeOptions(stroke.tool, stroke.size);
  const rawPoints = stroke.points.map((pt) => [pt.x, pt.y, pt.pressure]);
  const outline = getStroke(rawPoints, options);

  if (outline.length === 0) return;

  ctx.save();

  if (stroke.tool === 'highlighter') {
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.45;
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

  ctx.restore();
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
