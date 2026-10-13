import { Stroke, StrokeBounds, StrokePoint } from '../types/notebook';
import { calculateStrokeBounds } from './strokeRenderer';

/**
 * Standard ray-casting algorithm to test if a point is inside a polygon
 */
export function isPointInPolygon(
  point: { x: number; y: number },
  polygon: StrokePoint[]
): boolean {
  if (polygon.length < 3) return false;
  let inside = false;
  const { x, y } = point;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x,
      yi = polygon[i].y;
    const xj = polygon[j].x,
      yj = polygon[j].y;

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Checks if a stroke is captured by the lasso polygon.
 * If at least 30% of stroke points or the center is inside the polygon, it is considered selected.
 */
export function isStrokeCapturedByLasso(
  stroke: Stroke,
  lassoPolygon: StrokePoint[]
): boolean {
  if (lassoPolygon.length < 3 || stroke.points.length === 0) return false;

  let pointsInside = 0;
  for (const pt of stroke.points) {
    if (isPointInPolygon(pt, lassoPolygon)) {
      pointsInside++;
    }
  }

  return pointsInside / stroke.points.length >= 0.25;
}

/**
 * Calculates unified bounding box for a group of strokes
 */
export function computeGroupBounds(strokes: Stroke[]): StrokeBounds {
  if (strokes.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  for (const s of strokes) {
    if (s.bounds.minX < minX) minX = s.bounds.minX;
    if (s.bounds.minY < minY) minY = s.bounds.minY;
    if (s.bounds.maxX > maxX) maxX = s.bounds.maxX;
    if (s.bounds.maxY > maxY) maxY = s.bounds.maxY;
  }

  return { minX, minY, maxX, maxY };
}

/**
 * Translates an array of strokes by delta (dx, dy)
 */
export function translateStrokes(strokes: Stroke[], dx: number, dy: number): Stroke[] {
  return strokes.map((s) => {
    const newPoints = s.points.map((p) => ({
      ...p,
      x: p.x + dx,
      y: p.y + dy,
    }));
    return {
      ...s,
      points: newPoints,
      bounds: calculateStrokeBounds(newPoints, s.size),
    };
  });
}

/**
 * Scales strokes relative to a center point
 */
export function scaleStrokes(
  strokes: Stroke[],
  scaleFactor: number,
  centerX: number,
  centerY: number
): Stroke[] {
  return strokes.map((s) => {
    const newPoints = s.points.map((p) => ({
      ...p,
      x: centerX + (p.x - centerX) * scaleFactor,
      y: centerY + (p.y - centerY) * scaleFactor,
    }));
    return {
      ...s,
      size: Math.max(1, s.size * scaleFactor),
      points: newPoints,
      bounds: calculateStrokeBounds(newPoints, s.size * scaleFactor),
    };
  });
}

/**
 * Changes color of all selected strokes
 */
export function recolorStrokes(strokes: Stroke[], newColor: string): Stroke[] {
  return strokes.map((s) => ({
    ...s,
    color: newColor,
  }));
}
