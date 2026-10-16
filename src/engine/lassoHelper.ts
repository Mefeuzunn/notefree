import { Stroke, StrokeBounds, StrokePoint, PageTemplate } from '../types/notebook';
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

export interface StraightenResult {
  strokes: Stroke[];
  angleDegrees: number;
  snappedDeltaY: number;
  newBounds: StrokeBounds;
}

/**
 * FAZ AG: Detects the baseline slope (angle in radians) of a handwriting cluster using linear regression.
 */
export function detectHandwritingBaselineAngle(strokes: Stroke[]): {
  angle: number; // Angle in radians
  slope: number;
  centerX: number;
  centerY: number;
  samplePointsCount: number;
} {
  if (strokes.length === 0) {
    return { angle: 0, slope: 0, centerX: 0, centerY: 0, samplePointsCount: 0 };
  }

  // 1. Gather baseline sample points from strokes
  // We prioritize the bottom-most points of each stroke (valleys/contact points)
  const samplePoints: { x: number; y: number }[] = [];

  for (const s of strokes) {
    if (s.points.length === 0) continue;

    // Height threshold: points within the bottom 35% of this stroke's bounding box
    const strokeHeight = s.bounds.maxY - s.bounds.minY;
    const bottomThreshold = s.bounds.maxY - strokeHeight * 0.35;

    for (let i = 0; i < s.points.length; i++) {
      const pt = s.points[i];
      if (pt.y >= bottomThreshold) {
        const prev = s.points[i - 1];
        const next = s.points[i + 1];
        const isLocalBottom = (!prev || pt.y >= prev.y) && (!next || pt.y >= next.y);
        if (isLocalBottom) {
          samplePoints.push({ x: pt.x, y: pt.y });
        }
      }
    }

    // Always include the bottom center point of the stroke
    const midX = (s.bounds.minX + s.bounds.maxX) / 2;
    samplePoints.push({ x: midX, y: s.bounds.maxY });
  }

  const gb = computeGroupBounds(strokes);
  const centerX = (gb.minX + gb.maxX) / 2;
  const centerY = (gb.minY + gb.maxY) / 2;

  if (samplePoints.length < 2) {
    return {
      angle: 0,
      slope: 0,
      centerX,
      centerY,
      samplePointsCount: samplePoints.length,
    };
  }

  // 2. Linear Regression (Least Squares) on baseline points
  let sumX = 0;
  let sumY = 0;
  for (const p of samplePoints) {
    sumX += p.x;
    sumY += p.y;
  }
  const meanX = sumX / samplePoints.length;
  const meanY = sumY / samplePoints.length;

  let numerator = 0;
  let denominator = 0;
  for (const p of samplePoints) {
    const dx = p.x - meanX;
    const dy = p.y - meanY;
    numerator += dx * dy;
    denominator += dx * dx;
  }

  let slope = 0;
  let angle = 0;
  if (Math.abs(denominator) > 1e-6) {
    slope = numerator / denominator;
    angle = Math.atan(slope);
  }

  return { angle, slope, centerX, centerY, samplePointsCount: samplePoints.length };
}

/**
 * FAZ AG: Straightens slanted handwriting strokes to a horizontal baseline,
 * and snaps the baseline to the notebook's nearest horizontal rule line.
 */
export function straightenHandwritingStrokes(
  strokes: Stroke[],
  pageTemplate?: PageTemplate,
  customPitch?: number
): StraightenResult {
  if (strokes.length === 0) {
    return {
      strokes: [],
      angleDegrees: 0,
      snappedDeltaY: 0,
      newBounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
    };
  }

  // 1. Detect baseline slant
  const { angle, centerX, centerY } = detectHandwritingBaselineAngle(strokes);
  const angleDeg = (angle * 180) / Math.PI;

  // Constrain correction: handwriting slant is typically between -35° and +35°
  let rotationAngle = 0;
  let angleDegrees = 0;
  if (Math.abs(angleDeg) >= 0.35 && Math.abs(angleDeg) <= 38) {
    rotationAngle = -angle;
    angleDegrees = angleDeg;
  }

  // 2. Rotate strokes around centroid if angle is non-zero
  let rotatedStrokes = strokes;
  if (rotationAngle !== 0) {
    const cosA = Math.cos(rotationAngle);
    const sinA = Math.sin(rotationAngle);

    rotatedStrokes = strokes.map((s) => {
      const newPoints = s.points.map((p) => {
        const dx = p.x - centerX;
        const dy = p.y - centerY;
        return {
          ...p,
          x: centerX + dx * cosA - dy * sinA,
          y: centerY + dx * sinA + dy * cosA,
        };
      });

      return {
        ...s,
        points: newPoints,
        bounds: calculateStrokeBounds(newPoints, s.size),
        ...(s.controlNodes && {
          controlNodes: s.controlNodes.map((n) => {
            const dx = n.x - centerX;
            const dy = n.y - centerY;
            return {
              ...n,
              x: centerX + dx * cosA - dy * sinA,
              y: centerY + dx * sinA + dy * cosA,
            };
          }),
        }),
      };
    });
  }

  // 3. Compute new group bounds and baseline
  const newBounds = computeGroupBounds(rotatedStrokes);
  const baselineY = newBounds.maxY;

  // 4. Snap to notebook rule line if template has horizontal lines
  let snappedDeltaY = 0;
  if (pageTemplate && pageTemplate !== 'blank') {
    let topPadding = 60;
    let lineSpacing = customPitch && customPitch >= 12 && customPitch <= 120 ? customPitch : 32;

    if (pageTemplate === 'grid-5mm') {
      topPadding = 30;
      lineSpacing = customPitch && customPitch >= 10 && customPitch <= 120 ? customPitch : 28;
    } else if (pageTemplate === 'engineering-1mm') {
      topPadding = 55;
      lineSpacing = customPitch && customPitch >= 20 && customPitch <= 80 ? customPitch : 40;
    } else if (pageTemplate === 'dots') {
      topPadding = 40;
      lineSpacing = customPitch && customPitch >= 10 && customPitch <= 120 ? customPitch : 28;
    } else if (pageTemplate === 'cornell') {
      topPadding = 70;
      lineSpacing = 32;
    }

    // Find closest line
    const k = Math.round((baselineY - topPadding) / lineSpacing);
    const targetY = topPadding + k * lineSpacing;
    const dy = targetY - baselineY;

    // Only snap if within 85% of line spacing
    if (Math.abs(dy) <= lineSpacing * 0.85) {
      snappedDeltaY = dy;
    }
  }

  // 5. Apply vertical snap if delta is non-zero
  let finalStrokes = rotatedStrokes;
  if (snappedDeltaY !== 0) {
    finalStrokes = translateStrokes(rotatedStrokes, 0, snappedDeltaY);
  }

  const finalBounds = computeGroupBounds(finalStrokes);

  return {
    strokes: finalStrokes,
    angleDegrees,
    snappedDeltaY,
    newBounds: finalBounds,
  };
}

