import { ShapeControlNode, ShapeType, StrokePoint } from '../types/notebook';

/**
 * Applies magnetic angle locking (0°, 15°, 30°, 45°, 90°) and paper grid snapping
 */
export function applyPrecisionSnapping(
  start: StrokePoint,
  end: StrokePoint,
  angleSnap: boolean = true,
  gridSnap: boolean = false,
  gridSize: number = 20
): { start: StrokePoint; end: StrokePoint } {
  const s: StrokePoint = { ...start };
  const e: StrokePoint = { ...end };

  if (gridSnap) {
    s.x = Math.round(s.x / gridSize) * gridSize;
    s.y = Math.round(s.y / gridSize) * gridSize;
    e.x = Math.round(e.x / gridSize) * gridSize;
    e.y = Math.round(e.y / gridSize) * gridSize;
  }

  if (angleSnap) {
    const dx = e.x - s.x;
    const dy = e.y - s.y;
    const length = Math.hypot(dx, dy);
    if (length > 12) {
      let deg = (Math.atan2(dy, dx) * 180) / Math.PI;
      if (deg < 0) deg += 360;

      // Snapping points: 0, 15, 30, 45, 60, 75, 90...
      const snapInterval = 15;
      const nearestSnap = Math.round(deg / snapInterval) * snapInterval;
      const diff = Math.abs(deg - nearestSnap);

      // 7.5 degree lock tolerance
      if (diff <= 7.5 || diff >= 360 - 7.5) {
        const snappedRad = (nearestSnap * Math.PI) / 180;
        e.x = s.x + length * Math.cos(snappedRad);
        e.y = s.y + length * Math.sin(snappedRad);
      }
    }
  }

  return { start: s, end: e };
}

/**
 * Attempts to detect if a drawn series of points resembles a geometric shape,
 * with optional angle locking and magnetic grid snapping.
 */
export function detectGeometricShape(
  points: StrokePoint[],
  options?: { angleSnap?: boolean; gridSnap?: boolean; gridSize?: number }
): {
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
  if (straightness > 0.88) {
    const snapped = applyPrecisionSnapping(
      start,
      end,
      options?.angleSnap ?? true,
      options?.gridSnap ?? false,
      options?.gridSize ?? 20
    );
    return {
      type: 'line',
      replacementPoints: interpolateLine(snapped.start, snapped.end),
    };
  }

  // 2. Closed Loop Check (Circle or Rectangle)
  const isClosed = directDist / totalLength < 0.22;
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

export function generateArrowPoints(
  start: StrokePoint,
  end: StrokePoint,
  options?: { angleSnap?: boolean; gridSnap?: boolean; gridSize?: number }
): StrokePoint[] {
  const snapped = applyPrecisionSnapping(
    start,
    end,
    options?.angleSnap ?? true,
    options?.gridSnap ?? false,
    options?.gridSize ?? 20
  );
  const s = snapped.start;
  const e = snapped.end;
  const pts = interpolateLine(s, e, 20);
  const angle = Math.atan2(e.y - s.y, e.x - s.x);
  const headLength = 22;
  const headAngle = Math.PI / 6;

  // Arrow left barb
  const leftBarb = {
    x: e.x - headLength * Math.cos(angle - headAngle),
    y: e.y - headLength * Math.sin(angle - headAngle),
    pressure: 0.5,
  };
  // Arrow right barb
  const rightBarb = {
    x: e.x - headLength * Math.cos(angle + headAngle),
    y: e.y - headLength * Math.sin(angle + headAngle),
    pressure: 0.5,
  };

  pts.push(e, leftBarb, e, rightBarb);
  return pts;
}

/**
 * Generates triangle points connecting 3 arbitrary vertices
 */
export function generateFreeTrianglePoints(
  apex: StrokePoint,
  br: StrokePoint,
  bl: StrokePoint
): StrokePoint[] {
  const pts: StrokePoint[] = [];
  const corners = [apex, br, bl, apex];
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

/**
 * FAZ AI – Generates regular or deformed polygon points (Pentagon, Hexagon, Diamond)
 */
export function generatePolygonPoints(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  sides: number,
  startAngle: number = -Math.PI / 2
): StrokePoint[] {
  const vertices: { x: number; y: number }[] = [];
  for (let i = 0; i < sides; i++) {
    const a = startAngle + (i * 2 * Math.PI) / sides;
    vertices.push({
      x: cx + rx * Math.cos(a),
      y: cy + ry * Math.sin(a),
    });
  }
  vertices.push(vertices[0]); // close loop
  const pts: StrokePoint[] = [];
  for (let i = 0; i < sides; i++) {
    const p1 = vertices[i];
    const p2 = vertices[i + 1];
    for (let step = 0; step < 10; step++) {
      const t = step / 10;
      pts.push({
        x: p1.x + (p2.x - p1.x) * t,
        y: p1.y + (p2.y - p1.y) * t,
        pressure: 0.5,
      });
    }
  }
  pts.push({ x: vertices[0].x, y: vertices[0].y, pressure: 0.5 });
  return pts;
}

/**
 * FAZ AI – Generates 5-pointed star points
 */
export function generateStarPoints(
  cx: number,
  cy: number,
  outerRx: number,
  outerRy: number,
  pointsCount: number = 5
): StrokePoint[] {
  const innerRx = outerRx * 0.42;
  const innerRy = outerRy * 0.42;
  const totalVertices = pointsCount * 2;
  const vertices: { x: number; y: number }[] = [];
  const startAngle = -Math.PI / 2;

  for (let i = 0; i < totalVertices; i++) {
    const a = startAngle + (i * Math.PI) / pointsCount;
    const rX = i % 2 === 0 ? outerRx : innerRx;
    const rY = i % 2 === 0 ? outerRy : innerRy;
    vertices.push({
      x: cx + rX * Math.cos(a),
      y: cy + rY * Math.sin(a),
    });
  }
  vertices.push(vertices[0]); // close loop
  const pts: StrokePoint[] = [];
  for (let i = 0; i < totalVertices; i++) {
    const p1 = vertices[i];
    const p2 = vertices[i + 1];
    for (let step = 0; step < 8; step++) {
      const t = step / 8;
      pts.push({
        x: p1.x + (p2.x - p1.x) * t,
        y: p1.y + (p2.y - p1.y) * t,
        pressure: 0.5,
      });
    }
  }
  pts.push({ x: vertices[0].x, y: vertices[0].y, pressure: 0.5 });
  return pts;
}

/**
 * FAZ AI – Generates comic / callout speech bubble points
 */
export function generateCalloutPoints(
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
  tailX?: number,
  tailY?: number
): StrokePoint[] {
  const tailH = Math.min(30, (maxY - minY) * 0.25);
  const boxBottom = maxY - tailH;
  const tX = tailX !== undefined ? tailX : minX + 20;
  const tY = tailY !== undefined ? tailY : maxY;

  const corners = [
    { x: minX, y: minY },
    { x: maxX, y: minY },
    { x: maxX, y: boxBottom },
    { x: minX + 50, y: boxBottom },
    { x: tX, y: tY }, // speech tail tip
    { x: minX + 25, y: boxBottom },
    { x: minX, y: boxBottom },
    { x: minX, y: minY },
  ];

  const pts: StrokePoint[] = [];
  for (let i = 0; i < corners.length - 1; i++) {
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
  pts.push({ x: corners[0].x, y: corners[0].y, pressure: 0.5 });
  return pts;
}

/**
 * FAZ AI – Generates curly bracket points for mathematics, grouping, and formula notes
 */
export function generateCurlyBracketPoints(
  topX: number,
  topY: number,
  botX: number,
  botY: number,
  depth: number = 18,
  side: 'left' | 'right' = 'left'
): StrokePoint[] {
  const dir = side === 'left' ? -1 : 1;
  const midY = (topY + botY) / 2;
  const midX = (topX + botX) / 2;
  const cuspX = midX + dir * depth;
  const halfH = Math.abs(botY - topY) / 2;

  const pts: StrokePoint[] = [];
  const steps = 16;

  // Top half curve to cusp
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const p0 = { x: topX, y: topY };
    const p1 = { x: topX + dir * (depth * 0.7), y: topY };
    const p2 = { x: cuspX - dir * (depth * 0.3), y: midY - halfH * 0.2 };
    const p3 = { x: cuspX, y: midY };

    const it = 1 - t;
    const x = it ** 3 * p0.x + 3 * it ** 2 * t * p1.x + 3 * it * t ** 2 * p2.x + t ** 3 * p3.x;
    const y = it ** 3 * p0.y + 3 * it ** 2 * t * p1.y + 3 * it * t ** 2 * p2.y + t ** 3 * p3.y;
    pts.push({ x, y, pressure: 0.5 });
  }

  // Bottom half curve from cusp to bottom
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const p0 = { x: cuspX, y: midY };
    const p1 = { x: cuspX - dir * (depth * 0.3), y: midY + halfH * 0.2 };
    const p2 = { x: botX + dir * (depth * 0.7), y: botY };
    const p3 = { x: botX, y: botY };

    const it = 1 - t;
    const x = it ** 3 * p0.x + 3 * it ** 2 * t * p1.x + 3 * it * t ** 2 * p2.x + t ** 3 * p3.x;
    const y = it ** 3 * p0.y + 3 * it ** 2 * t * p1.y + 3 * it * t ** 2 * p2.y + t ** 3 * p3.y;
    pts.push({ x, y, pressure: 0.5 });
  }

  return pts;
}

/**
 * FAZ AI – Generates circular / curved arc points
 */
export function generateArcPoints(
  start: StrokePoint,
  end: StrokePoint,
  apex?: StrokePoint
): StrokePoint[] {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const dist = Math.hypot(dx, dy);

  let cp: { x: number; y: number };
  if (apex) {
    cp = {
      x: 2 * apex.x - 0.5 * start.x - 0.5 * end.x,
      y: 2 * apex.y - 0.5 * start.y - 0.5 * end.y,
    };
  } else {
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    const normX = dist > 0 ? -dy / dist : 0;
    const normY = dist > 0 ? dx / dist : 0;
    const sagitta = dist * 0.25;
    cp = {
      x: midX + normX * sagitta,
      y: midY + normY * sagitta,
    };
  }

  const pts: StrokePoint[] = [];
  const steps = 30;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const it = 1 - t;
    const x = it * it * start.x + 2 * it * t * cp.x + t * t * end.x;
    const y = it * it * start.y + 2 * it * t * cp.y + t * t * end.y;
    pts.push({ x, y, pressure: 0.5 });
  }
  return pts;
}

/**
 * FAZ I & FAZ AI – Shape Vertex Editor
 * Rebuilds the StrokePoint array for a shape from its (possibly edited) control nodes.
 * This allows dragging a corner handle to morph the shape after it has been drawn.
 */
export function rebuildShapeFromNodes(
  shapeType: ShapeType,
  nodes: ShapeControlNode[]
): StrokePoint[] {
  const find = (key: string): ShapeControlNode | undefined =>
    nodes.find((n) => n.id === key || n.role === key);

  switch (shapeType) {
    case 'line': {
      const s = find('start');
      const e = find('end');
      if (!s || !e) return [];
      return interpolateLine(
        { x: s.x, y: s.y, pressure: 0.5 },
        { x: e.x, y: e.y, pressure: 0.5 },
        40
      );
    }

    case 'arrow': {
      const s = find('start');
      const e = find('end');
      if (!s || !e) return [];
      return generateArrowPoints(
        { x: s.x, y: s.y, pressure: 0.5 },
        { x: e.x, y: e.y, pressure: 0.5 }
      );
    }

    case 'rectangle': {
      const tl = find('tl');
      const br = find('br');
      if (tl && br) {
        return generateRectanglePoints(tl.x, tl.y, br.x, br.y);
      }
      // Fallback: derive from tr & bl
      const tr = find('tr');
      const bl = find('bl');
      if (!tr || !bl) return [];
      return generateRectanglePoints(bl.x, tr.y, tr.x, bl.y);
    }

    case 'circle': {
      const cxNode = find('cx') || find('center');
      const rxH = find('rx-handle');
      const ryH = find('ry-handle');
      if (!cxNode || !rxH || !ryH) return [];
      const rx = Math.abs(rxH.x - cxNode.x);
      const ry = Math.abs(ryH.y - cxNode.y);
      return generateEllipsePoints(cxNode.x, cxNode.y, rx, ry);
    }

    case 'triangle': {
      const apex = find('apex');
      const bl = find('bl');
      const br = find('br');
      if (!apex || !bl || !br) return [];
      return generateFreeTrianglePoints(
        { x: apex.x, y: apex.y, pressure: 0.5 },
        { x: br.x, y: br.y, pressure: 0.5 },
        { x: bl.x, y: bl.y, pressure: 0.5 }
      );
    }

    case 'pentagon':
    case 'hexagon': {
      const vNodes = nodes.filter((n) => n.id.startsWith('v'));
      if (vNodes.length < 3) return [];
      const pts: StrokePoint[] = [];
      for (let i = 0; i < vNodes.length; i++) {
        const p1 = vNodes[i];
        const p2 = vNodes[(i + 1) % vNodes.length];
        for (let step = 0; step < 10; step++) {
          const t = step / 10;
          pts.push({
            x: p1.x + (p2.x - p1.x) * t,
            y: p1.y + (p2.y - p1.y) * t,
            pressure: 0.5,
          });
        }
      }
      pts.push({ x: vNodes[0].x, y: vNodes[0].y, pressure: 0.5 });
      return pts;
    }

    case 'diamond': {
      const top = find('top');
      const right = find('right');
      const bottom = find('bottom');
      const left = find('left');
      if (!top || !right || !bottom || !left) return [];
      const corners = [top, right, bottom, left, top];
      const pts: StrokePoint[] = [];
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
      pts.push({ x: top.x, y: top.y, pressure: 0.5 });
      return pts;
    }

    case 'star': {
      const cxNode = find('cx') || find('center');
      const cx = cxNode ? cxNode.x : 0;
      const cy = cxNode ? cxNode.y : 0;
      const tip0 = find('tip0');
      const rx = tip0 ? Math.hypot(tip0.x - cx, tip0.y - cy) : 50;
      return generateStarPoints(cx, cy, rx, rx);
    }

    case 'callout': {
      const tl = find('tl');
      const br = find('br');
      const tail = find('tail');
      if (!tl || !br) return [];
      const minX = Math.min(tl.x, br.x);
      const maxX = Math.max(tl.x, br.x);
      const minY = Math.min(tl.y, br.y);
      const maxY = Math.max(tl.y, br.y);
      return generateCalloutPoints(minX, minY, maxX, maxY, tail?.x, tail?.y);
    }

    case 'bracket': {
      const top = find('top');
      const bottom = find('bottom');
      const cusp = find('cusp');
      if (!top || !bottom) return [];
      const depth = cusp ? Math.abs(cusp.x - (top.x + bottom.x) / 2) : 18;
      const side = cusp && cusp.x > (top.x + bottom.x) / 2 ? 'right' : 'left';
      return generateCurlyBracketPoints(top.x, top.y, bottom.x, bottom.y, depth, side);
    }

    case 'arc': {
      const s = find('start');
      const e = find('end');
      const apex = find('apex');
      if (!s || !e) return [];
      return generateArcPoints(
        { x: s.x, y: s.y, pressure: 0.5 },
        { x: e.x, y: e.y, pressure: 0.5 },
        apex ? { x: apex.x, y: apex.y, pressure: 0.5 } : undefined
      );
    }

    default:
      return [];
  }
}

/**
 * FAZ I – Updates shape control nodes and returns both morphed stroke points and synchronized nodes.
 */
export function rebuildShapeAndNodesFromDrag(
  shapeType: ShapeType,
  draggedNodeId: string,
  newPos: { x: number; y: number },
  currentNodes: ShapeControlNode[]
): { points: StrokePoint[]; nodes: ShapeControlNode[] } {
  const find = (key: string): ShapeControlNode | undefined =>
    currentNodes.find((n) => n.id === key || n.role === key);

  switch (shapeType) {
    case 'line':
    case 'arrow': {
      const s = find('start') || { id: 'start', x: 0, y: 0, role: 'endpoint' };
      const e = find('end') || { id: 'end', x: 0, y: 0, role: 'endpoint' };
      const updatedS = draggedNodeId === 'start' ? { ...s, x: newPos.x, y: newPos.y } : s;
      const updatedE = draggedNodeId === 'end' ? { ...e, x: newPos.x, y: newPos.y } : e;
      const nodes = [updatedS, updatedE];
      const pts = shapeType === 'arrow'
        ? generateArrowPoints({ x: updatedS.x, y: updatedS.y, pressure: 0.5 }, { x: updatedE.x, y: updatedE.y, pressure: 0.5 })
        : interpolateLine({ x: updatedS.x, y: updatedS.y, pressure: 0.5 }, { x: updatedE.x, y: updatedE.y, pressure: 0.5 }, 40);
      return { points: pts, nodes };
    }

    case 'rectangle': {
      let minX = Math.min(...currentNodes.map((n) => n.x));
      let maxX = Math.max(...currentNodes.map((n) => n.x));
      let minY = Math.min(...currentNodes.map((n) => n.y));
      let maxY = Math.max(...currentNodes.map((n) => n.y));

      if (draggedNodeId === 'tl') { minX = newPos.x; minY = newPos.y; }
      else if (draggedNodeId === 'tr') { maxX = newPos.x; minY = newPos.y; }
      else if (draggedNodeId === 'br') { maxX = newPos.x; maxY = newPos.y; }
      else if (draggedNodeId === 'bl') { minX = newPos.x; maxY = newPos.y; }
      else if (draggedNodeId === 'mid-t') { minY = newPos.y; }
      else if (draggedNodeId === 'mid-b') { maxY = newPos.y; }
      else if (draggedNodeId === 'mid-l') { minX = newPos.x; }
      else if (draggedNodeId === 'mid-r') { maxX = newPos.x; }

      const actualMinX = Math.min(minX, maxX);
      const actualMaxX = Math.max(minX, maxX);
      const actualMinY = Math.min(minY, maxY);
      const actualMaxY = Math.max(minY, maxY);
      const cx = (actualMinX + actualMaxX) / 2;
      const cy = (actualMinY + actualMaxY) / 2;

      const nodes: ShapeControlNode[] = [
        { id: 'tl', x: actualMinX, y: actualMinY, role: 'corner' },
        { id: 'tr', x: actualMaxX, y: actualMinY, role: 'corner' },
        { id: 'br', x: actualMaxX, y: actualMaxY, role: 'corner' },
        { id: 'bl', x: actualMinX, y: actualMaxY, role: 'corner' },
        { id: 'mid-t', x: cx, y: actualMinY, role: 'edge' },
        { id: 'mid-r', x: actualMaxX, y: cy, role: 'edge' },
        { id: 'mid-b', x: cx, y: actualMaxY, role: 'edge' },
        { id: 'mid-l', x: actualMinX, y: cy, role: 'edge' },
      ];
      const points = generateRectanglePoints(actualMinX, actualMinY, actualMaxX, actualMaxY);
      return { points, nodes };
    }

    case 'circle': {
      const cxNode = find('cx') || find('center');
      let cx = cxNode ? cxNode.x : 0;
      let cy = cxNode ? cxNode.y : 0;
      const rxH = find('rx-handle');
      const ryH = find('ry-handle');
      let rx = rxH ? Math.abs(rxH.x - cx) : 50;
      let ry = ryH ? Math.abs(ryH.y - cy) : 50;

      if (draggedNodeId === 'cx' || draggedNodeId === 'center') {
        cx = newPos.x;
        cy = newPos.y;
      } else if (draggedNodeId === 'rx-handle') {
        rx = Math.max(5, Math.abs(newPos.x - cx));
      } else if (draggedNodeId === 'ry-handle') {
        ry = Math.max(5, Math.abs(newPos.y - cy));
      } else if (['tl', 'tr', 'br', 'bl'].includes(draggedNodeId)) {
        rx = Math.max(5, Math.abs(newPos.x - cx));
        ry = Math.max(5, Math.abs(newPos.y - cy));
      }

      const nodes: ShapeControlNode[] = [
        { id: 'cx', x: cx, y: cy, role: 'center' },
        { id: 'rx-handle', x: cx + rx, y: cy, role: 'radius' },
        { id: 'ry-handle', x: cx, y: cy + ry, role: 'radius' },
        { id: 'tl', x: cx - rx, y: cy - ry, role: 'corner' },
        { id: 'tr', x: cx + rx, y: cy - ry, role: 'corner' },
        { id: 'br', x: cx + rx, y: cy + ry, role: 'corner' },
        { id: 'bl', x: cx - rx, y: cy + ry, role: 'corner' },
      ];
      const points = generateEllipsePoints(cx, cy, rx, ry);
      return { points, nodes };
    }

    case 'triangle': {
      const apex = find('apex') || { id: 'apex', x: 0, y: 0, role: 'apex' };
      const br = find('br') || { id: 'br', x: 0, y: 0, role: 'corner' };
      const bl = find('bl') || { id: 'bl', x: 0, y: 0, role: 'corner' };

      const updatedApex = draggedNodeId === 'apex' ? { ...apex, x: newPos.x, y: newPos.y } : apex;
      const updatedBr = draggedNodeId === 'br' ? { ...br, x: newPos.x, y: newPos.y } : br;
      const updatedBl = draggedNodeId === 'bl' ? { ...bl, x: newPos.x, y: newPos.y } : bl;

      const nodes: ShapeControlNode[] = [updatedApex, updatedBr, updatedBl];
      const points = generateFreeTrianglePoints(
        { x: updatedApex.x, y: updatedApex.y, pressure: 0.5 },
        { x: updatedBr.x, y: updatedBr.y, pressure: 0.5 },
        { x: updatedBl.x, y: updatedBl.y, pressure: 0.5 }
      );
      return { points, nodes };
    }

    case 'pentagon':
    case 'hexagon': {
      const updatedNodes = currentNodes.map((n) =>
        n.id === draggedNodeId ? { ...n, x: newPos.x, y: newPos.y } : n
      );
      const points = rebuildShapeFromNodes(shapeType, updatedNodes);
      return { points, nodes: updatedNodes };
    }

    case 'diamond': {
      const updatedNodes = currentNodes.map((n) =>
        n.id === draggedNodeId ? { ...n, x: newPos.x, y: newPos.y } : n
      );
      const points = rebuildShapeFromNodes('diamond', updatedNodes);
      return { points, nodes: updatedNodes };
    }

    case 'star': {
      const updatedNodes = currentNodes.map((n) =>
        n.id === draggedNodeId ? { ...n, x: newPos.x, y: newPos.y } : n
      );
      const points = rebuildShapeFromNodes('star', updatedNodes);
      return { points, nodes: updatedNodes };
    }

    case 'callout': {
      const updatedNodes = currentNodes.map((n) =>
        n.id === draggedNodeId ? { ...n, x: newPos.x, y: newPos.y } : n
      );
      const points = rebuildShapeFromNodes('callout', updatedNodes);
      return { points, nodes: updatedNodes };
    }

    case 'bracket': {
      const updatedNodes = currentNodes.map((n) =>
        n.id === draggedNodeId ? { ...n, x: newPos.x, y: newPos.y } : n
      );
      const points = rebuildShapeFromNodes('bracket', updatedNodes);
      return { points, nodes: updatedNodes };
    }

    case 'arc': {
      const updatedNodes = currentNodes.map((n) =>
        n.id === draggedNodeId ? { ...n, x: newPos.x, y: newPos.y } : n
      );
      const points = rebuildShapeFromNodes('arc', updatedNodes);
      return { points, nodes: updatedNodes };
    }

    default:
      return { points: [], nodes: currentNodes };
  }
}



