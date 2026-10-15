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

/**
 * FAZ J: Flips strokes horizontally or vertically around a center point
 */
export function flipStrokes(
  strokes: Stroke[],
  direction: 'horizontal' | 'vertical',
  centerX: number,
  centerY: number
): Stroke[] {
  return strokes.map((s) => {
    const newPoints = s.points.map((p) => ({
      ...p,
      x: direction === 'horizontal' ? 2 * centerX - p.x : p.x,
      y: direction === 'vertical' ? 2 * centerY - p.y : p.y,
    }));
    return {
      ...s,
      points: newPoints,
      bounds: calculateStrokeBounds(newPoints, s.size),
      ...(s.controlNodes && {
        controlNodes: s.controlNodes.map((n) => ({
          ...n,
          x: direction === 'horizontal' ? 2 * centerX - n.x : n.x,
          y: direction === 'vertical' ? 2 * centerY - n.y : n.y,
        })),
      }),
    };
  });
}

export type AlignmentType = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';

/**
 * FAZ J: Aligns individual strokes within a group relative to the group bounds
 */
export function alignStrokes(
  strokes: Stroke[],
  alignment: AlignmentType,
  groupBounds: StrokeBounds
): Stroke[] {
  const groupCenterX = (groupBounds.minX + groupBounds.maxX) / 2;
  const groupCenterY = (groupBounds.minY + groupBounds.maxY) / 2;

  return strokes.map((s) => {
    let dx = 0;
    let dy = 0;

    switch (alignment) {
      case 'left':
        dx = groupBounds.minX - s.bounds.minX;
        break;
      case 'right':
        dx = groupBounds.maxX - s.bounds.maxX;
        break;
      case 'center': {
        const strokeCenterX = (s.bounds.minX + s.bounds.maxX) / 2;
        dx = groupCenterX - strokeCenterX;
        break;
      }
      case 'top':
        dy = groupBounds.minY - s.bounds.minY;
        break;
      case 'bottom':
        dy = groupBounds.maxY - s.bounds.maxY;
        break;
      case 'middle': {
        const strokeCenterY = (s.bounds.minY + s.bounds.maxY) / 2;
        dy = groupCenterY - strokeCenterY;
        break;
      }
    }

    if (dx === 0 && dy === 0) return s;
    return translateStrokes([s], dx, dy)[0];
  });
}

/**
 * FAZ J: Shifts strokes located at or below startY downwards by amount
 */
export function pushStrokesDown(
  strokes: Stroke[],
  startY: number,
  amount: number
): Stroke[] {
  return strokes.map((s) => {
    // If the stroke's midpoint or top is below startY, shift it down
    if (s.bounds.minY >= startY || (s.bounds.minY + s.bounds.maxY) / 2 >= startY) {
      return translateStrokes([s], 0, amount)[0];
    }
    return s;
  });
}

