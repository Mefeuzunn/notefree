import { FillItem } from '../types/notebook';

/**
 * Parses Hex or RGB color string to [r, g, b]
 */
function parseColorToRgb(color: string): [number, number, number] {
  if (color.startsWith('#')) {
    let hex = color.slice(1);
    if (hex.length === 3) {
      hex = hex.split('').map((c) => c + c).join('');
    }
    const num = parseInt(hex, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  }
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgbMatch) {
    return [parseInt(rgbMatch[1], 10), parseInt(rgbMatch[2], 10), parseInt(rgbMatch[3], 10)];
  }
  return [15, 23, 42]; // default dark slate
}

/**
 * Computes Euclidean color distance in RGBA space
 */
function isColorMatch(
  r1: number,
  g1: number,
  b1: number,
  a1: number,
  r2: number,
  g2: number,
  b2: number,
  a2: number,
  tolerance: number
): boolean {
  // If both pixels are practically transparent, consider them matching
  if (a1 < 10 && a2 < 10) return true;

  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  const da = a1 - a2;
  return Math.sqrt(dr * dr + dg * dg + db * db + da * da) <= tolerance;
}

/**
 * Performs a high-performance 4-way flood fill on the provided canvas,
 * returning a lightweight FillItem containing a cropped transparent PNG mask.
 */
export function performFloodFill(
  sourceCanvas: HTMLCanvasElement,
  seedX: number,
  seedY: number,
  fillColor: string,
  fillOpacity: number = 0.85,
  tolerance: number = 38
): FillItem | null {
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;

  const startX = Math.floor(seedX);
  const startY = Math.floor(seedY);

  if (startX < 0 || startX >= width || startY < 0 || startY >= height) {
    return null;
  }

  const ctx = sourceCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  const startIndex = (startY * width + startX) * 4;
  const targetR = data[startIndex];
  const targetG = data[startIndex + 1];
  const targetB = data[startIndex + 2];
  const targetA = data[startIndex + 3];

  const [fillR, fillG, fillB] = parseColorToRgb(fillColor);

  // If clicking on same color as fill, skip
  if (isColorMatch(targetR, targetG, targetB, targetA, fillR, fillG, fillB, 255, 10)) {
    return null;
  }

  // Linear array for visited pixels
  const totalPixels = width * height;
  const visited = new Uint8Array(totalPixels);

  // Fast fixed-size queue buffer to avoid array reallocations
  const maxQueueSize = totalPixels;
  const queueX = new Int32Array(maxQueueSize);
  const queueY = new Int32Array(maxQueueSize);
  let queueHead = 0;
  let queueTail = 0;

  queueX[queueTail] = startX;
  queueY[queueTail] = startY;
  queueTail++;
  visited[startY * width + startX] = 1;

  let minX = startX;
  let maxX = startX;
  let minY = startY;
  let maxY = startY;
  let filledCount = 0;

  // Safety threshold to avoid filling unbounded 100% empty canvas beyond limits
  const maxAllowedFilledPixels = Math.floor(totalPixels * 0.95);

  while (queueHead < queueTail) {
    const x = queueX[queueHead];
    const y = queueY[queueHead];
    queueHead++;
    filledCount++;

    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;

    if (filledCount > maxAllowedFilledPixels) {
      break;
    }

    // 4-way neighbors: Right, Left, Down, Up
    const neighbors: [number, number][] = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ];

    for (let i = 0; i < 4; i++) {
      const nx = neighbors[i][0];
      const ny = neighbors[i][1];

      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nIndex = ny * width + nx;
        if (visited[nIndex] === 0) {
          const pixelOffset = nIndex * 4;
          const nr = data[pixelOffset];
          const ng = data[pixelOffset + 1];
          const nb = data[pixelOffset + 2];
          const na = data[pixelOffset + 3];

          if (isColorMatch(nr, ng, nb, na, targetR, targetG, targetB, targetA, tolerance)) {
            visited[nIndex] = 1;
            if (queueTail < maxQueueSize) {
              queueX[queueTail] = nx;
              queueY[queueTail] = ny;
              queueTail++;
            }
          }
        }
      }
    }
  }

  if (filledCount < 4) {
    return null;
  }

  // Create cropped mask canvas
  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;

  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = cropW;
  maskCanvas.height = cropH;
  const maskCtx = maskCanvas.getContext('2d');
  if (!maskCtx) return null;

  const maskImgData = maskCtx.createImageData(cropW, cropH);
  const maskData = maskImgData.data;

  for (let cy = 0; cy < cropH; cy++) {
    const origY = minY + cy;
    for (let cx = 0; cx < cropW; cx++) {
      const origX = minX + cx;
      const maskIdx = (cy * cropW + cx) * 4;
      if (visited[origY * width + origX] === 1) {
        maskData[maskIdx] = fillR;
        maskData[maskIdx + 1] = fillG;
        maskData[maskIdx + 2] = fillB;
        maskData[maskIdx + 3] = 255;
      } else {
        maskData[maskIdx + 3] = 0;
      }
    }
  }

  maskCtx.putImageData(maskImgData, 0, 0);
  const dataUrl = maskCanvas.toDataURL('image/png');

  return {
    id: `fill_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    x: minX,
    y: minY,
    width: cropW,
    height: cropH,
    color: fillColor,
    opacity: fillOpacity,
    dataUrl,
    bounds: {
      minX,
      minY,
      maxX,
      maxY,
    },
    timestamp: Date.now(),
  };
}
