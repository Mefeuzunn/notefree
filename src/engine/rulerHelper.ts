import { RulerUnit, Stroke, StrokePoint } from '../types/notebook';
import { calculateStrokeBounds } from './strokeRenderer';

export const PX_PER_CM = 37.795; // Standard 96 DPI screen scale
export const PX_PER_MM = 3.7795;
export const PX_PER_IN = 96.0;
export const RULER_DEFAULT_HEIGHT = 85;

export interface RulerSnapResult {
  isSnapped: boolean;
  snappedX: number;
  snappedY: number;
  distanceAlongEdge: number; // in pixels
  edge: 'top' | 'bottom';
  rulerAngle: number;
}

/**
 * Formats a pixel length into the selected measurement unit
 */
export function formatRulerMeasurement(lengthInPx: number, unit: RulerUnit = 'cm'): string {
  switch (unit) {
    case 'cm':
      return `${(lengthInPx / PX_PER_CM).toFixed(1)} cm`;
    case 'mm':
      return `${Math.round(lengthInPx / PX_PER_MM)} mm`;
    case 'in':
      return `${(lengthInPx / PX_PER_IN).toFixed(2)} in`;
    case 'px':
      return `${Math.round(lengthInPx)} px`;
    default:
      return `${(lengthInPx / PX_PER_CM).toFixed(1)} cm`;
  }
}

/**
 * Calculates start and end coordinates of top & bottom edges of ruler in canvas space
 */
export function getRulerEdgeSegments(
  rulerPos: { x: number; y: number },
  width: number,
  height: number = RULER_DEFAULT_HEIGHT,
  angleDeg: number = 0
) {
  const cx = rulerPos.x + width / 2;
  const cy = rulerPos.y + height / 2;
  const rad = (angleDeg * Math.PI) / 180;

  const ux = Math.cos(rad);
  const uy = Math.sin(rad);
  const vx = -Math.sin(rad);
  const vy = Math.cos(rad);

  // Top edge (where ticks are usually placed)
  const ctx = cx - (height / 2) * vx;
  const cty = cy - (height / 2) * vy;
  const topStart = { x: ctx - (width / 2) * ux, y: cty - (width / 2) * uy };
  const topEnd   = { x: ctx + (width / 2) * ux, y: cty + (width / 2) * uy };

  // Bottom edge
  const cbx = cx + (height / 2) * vx;
  const cby = cy + (height / 2) * vy;
  const bottomStart = { x: cbx - (width / 2) * ux, y: cby - (width / 2) * uy };
  const bottomEnd   = { x: cbx + (width / 2) * ux, y: cby + (width / 2) * uy };

  return { topStart, topEnd, bottomStart, bottomEnd, ux, uy, vx, vy, rad };
}

/**
 * Tests if point (x, y) is near a ruler edge and snaps onto the straight line segment
 */
export function getSnapToRulerPoint(
  x: number,
  y: number,
  rulerPos: { x: number; y: number },
  width: number,
  height: number = RULER_DEFAULT_HEIGHT,
  angleDeg: number = 0,
  snapThreshold: number = 26
): RulerSnapResult {
  const { topStart, bottomStart, ux, uy, vx, vy } = getRulerEdgeSegments(rulerPos, width, height, angleDeg);

  // 1. Check top edge
  const dtx = x - topStart.x;
  const dty = y - topStart.y;
  const tTop = dtx * ux + dty * uy;
  const perpTop = Math.abs(dtx * vx + dty * vy);

  if (tTop >= -snapThreshold && tTop <= width + snapThreshold && perpTop <= snapThreshold) {
    const clampedT = Math.max(0, Math.min(width, tTop));
    return {
      isSnapped: true,
      snappedX: topStart.x + clampedT * ux,
      snappedY: topStart.y + clampedT * uy,
      distanceAlongEdge: clampedT,
      edge: 'top',
      rulerAngle: angleDeg,
    };
  }

  // 2. Check bottom edge
  const dbx = x - bottomStart.x;
  const dby = y - bottomStart.y;
  const tBot = dbx * ux + dby * uy;
  const perpBot = Math.abs(dbx * vx + dby * vy);

  if (tBot >= -snapThreshold && tBot <= width + snapThreshold && perpBot <= snapThreshold) {
    const clampedT = Math.max(0, Math.min(width, tBot));
    return {
      isSnapped: true,
      snappedX: bottomStart.x + clampedT * ux,
      snappedY: bottomStart.y + clampedT * uy,
      distanceAlongEdge: clampedT,
      edge: 'bottom',
      rulerAngle: angleDeg,
    };
  }

  return {
    isSnapped: false,
    snappedX: x,
    snappedY: y,
    distanceAlongEdge: 0,
    edge: 'top',
    rulerAngle: angleDeg,
  };
}

/**
 * Creates a precision straight stroke along the ruler edge
 */
export function createRulerStraightStroke(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  color: string = '#1e293b',
  size: number = 2.5
): Stroke {
  const points: StrokePoint[] = [];
  const steps = 40;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    points.push({
      x: p1.x + (p2.x - p1.x) * t,
      y: p1.y + (p2.y - p1.y) * t,
      pressure: 0.75,
      timestamp: Date.now() + i * 2,
    });
  }

  return {
    id: `stroke_ruler_line_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    tool: 'ballpoint',
    color,
    size,
    points,
    bounds: calculateStrokeBounds(points, size),
    timestamp: Date.now(),
    shapeType: 'line',
  };
}

/**
 * Creates architectural dimension callout elements (main line, ticks, and text)
 */
export function createRulerDimensionCallout(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  unit: RulerUnit = 'cm',
  color: string = '#4f46e5',
  size: number = 2.0
): { strokes: Stroke[]; text: string; x: number; y: number } {
  const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  const label = formatRulerMeasurement(dist, unit);

  // Perpendicular offset vector for witness lines (8px)
  const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
  const perpX = -Math.sin(angle) * 8;
  const perpY = Math.cos(angle) * 8;

  const strokes: Stroke[] = [];

  // Main dimension line
  strokes.push(createRulerStraightStroke(p1, p2, color, size));

  // Start witness tick
  strokes.push(
    createRulerStraightStroke(
      { x: p1.x - perpX, y: p1.y - perpY },
      { x: p1.x + perpX, y: p1.y + perpY },
      color,
      size
    )
  );

  // End witness tick
  strokes.push(
    createRulerStraightStroke(
      { x: p2.x - perpX, y: p2.y - perpY },
      { x: p2.x + perpX, y: p2.y + perpY },
      color,
      size
    )
  );

  // Center coordinates for dimension label
  const midX = (p1.x + p2.x) / 2;
  const midY = (p1.y + p2.y) / 2;

  return {
    strokes,
    text: `📐 ${label}`,
    x: Math.round(midX - 35),
    y: Math.round(midY - 26),
  };
}
