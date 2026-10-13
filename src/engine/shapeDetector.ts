import { ShapeType, StrokePoint } from '../types/notebook';

/**
 * Attempts to detect if a drawn series of points resembles a geometric shape
 */
export function detectGeometricShape(points: StrokePoint[]): {
  type: ShapeType;
  replacementPoints: StrokePoint[];
} | null {
  if (points.length < 8) return null;

  const start = points[0];
  const end = points[points.length - 1];

  let totalLength = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1].x - points[i].x;
    const dy = points[i + 1].y - points[i].y;
    totalLength += Math.hypot(dx, dy);
  }

  const directDist = Math.hypot(end.x - start.x, end.y - start.y);
  if (totalLength < 20) return null;

  // 1. Straight Line Check
  const straightness = directDist / totalLength;
  if (straightness > 0.9) {
    return {
      type: 'line',
      replacementPoints: interpolateLine(start, end),
    };
  }

  // 2. Closed Loop Check (Circle or Rectangle)
  const isClosed = directDist / totalLength < 0.2;
  if (isClosed) {
    // Calculate bounding box and centroid
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let sumX = 0, sumY = 0;
    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
      sumX += p.x;
      sumY += p.y;
    }
    const cx = sumX / points.length;
    const cy = sumY / points.length;
    const width = maxX - minX;
    const height = maxY - minY;

    // Check circularity (variance of distance from centroid)
    let avgDist = 0;
    for (const p of points) {
      avgDist += Math.hypot(p.x - cx, p.y - cy);
    }
    avgDist /= points.length;

    let variance = 0;
    for (const p of points) {
      const d = Math.hypot(p.x - cx, p.y - cy);
      variance += Math.abs(d - avgDist);
    }
    const relativeVariance = variance / (points.length * avgDist);

    if (relativeVariance < 0.18) {
      // Circle / Ellipse
      return {
        type: 'circle',
        replacementPoints: generateEllipsePoints(cx, cy, width / 2, height / 2),
      };
    } else {
      // Approximate Rectangle
      return {
        type: 'rectangle',
        replacementPoints: generateRectanglePoints(minX, minY, maxX, maxY),
      };
    }
  }

  return null;
}

export function interpolateLine(start: StrokePoint, end: StrokePoint, count: number = 20): StrokePoint[] {
  const pts: StrokePoint[] = [];
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    pts.push({
      x: start.x + (end.x - start.x) * t,
      y: start.y + (end.y - start.y) * t,
      pressure: 0.5,
    });
  }
  return pts;
}

export function generateRectanglePoints(minX: number, minY: number, maxX: number, maxY: number): StrokePoint[] {
  const pts: StrokePoint[] = [];
  const corners = [
    { x: minX, y: minY },
    { x: maxX, y: minY },
    { x: maxX, y: maxY },
    { x: minX, y: maxY },
    { x: minX, y: minY },
  ];
  for (let i = 0; i < 4; i++) {
    const p1 = corners[i];
    const p2 = corners[i + 1];
    for (let step = 0; step < 10; step++) {
      const t = step / 10;
      pts.push({
        x: p1.x + (p2.x - p1.x) * t,
        y: p1.y + (p2.y - p1.y) * t,
        pressure: 0.5,
      });
    }
  }
  pts.push({ x: minX, y: minY, pressure: 0.5 });
  return pts;
}

export function generateEllipsePoints(cx: number, cy: number, rx: number, ry: number, count: number = 40): StrokePoint[] {
  const pts: StrokePoint[] = [];
  for (let i = 0; i <= count; i++) {
    const angle = (i / count) * Math.PI * 2;
    pts.push({
      x: cx + rx * Math.cos(angle),
      y: cy + ry * Math.sin(angle),
      pressure: 0.5,
    });
  }
  return pts;
}

export function generateCirclePoints(cx: number, cy: number, r: number, count: number = 40): StrokePoint[] {
  return generateEllipsePoints(cx, cy, r, r, count);
}

export function generateTrianglePoints(minX: number, minY: number, maxX: number, maxY: number): StrokePoint[] {
  const pts: StrokePoint[] = [];
  const corners = [
    { x: (minX + maxX) / 2, y: minY, pressure: 0.5 },
    { x: maxX, y: maxY, pressure: 0.5 },
    { x: minX, y: maxY, pressure: 0.5 },
    { x: (minX + maxX) / 2, y: minY, pressure: 0.5 },
  ];
  for (let i = 0; i < 3; i++) {
    const p1 = corners[i];
    const p2 = corners[i + 1];
    for (let step = 0; step < 10; step++) {
      const t = step / 10;
      pts.push({
        x: p1.x + (p2.x - p1.x) * t,
        y: p1.y + (p2.y - p1.y) * t,
        pressure: 0.5,
      });
    }
  }
  pts.push(corners[0]);
  return pts;
}

export function generateArrowPoints(start: StrokePoint, end: StrokePoint): StrokePoint[] {
  const pts = interpolateLine(start, end, 20);
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const headLength = 22;
  const headAngle = Math.PI / 6;

  // Arrow left barb
  const leftBarb = {
    x: end.x - headLength * Math.cos(angle - headAngle),
    y: end.y - headLength * Math.sin(angle - headAngle),
    pressure: 0.5,
  };
  // Arrow right barb
  const rightBarb = {
    x: end.x - headLength * Math.cos(angle + headAngle),
    y: end.y - headLength * Math.sin(angle + headAngle),
    pressure: 0.5,
  };

  pts.push(end, leftBarb, end, rightBarb);
  return pts;
}
