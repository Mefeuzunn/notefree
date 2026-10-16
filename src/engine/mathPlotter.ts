/**
 * Safe Mathematical Expression Parser and 2D Function Sampler
 * Supports: +, -, *, /, ^, sin, cos, tan, sqrt, abs, ln, log, exp, pi, e
 */

export interface PlotFunctionDef {
  id: string;
  expression: string;
  color: string;
  lineWidth: number;
  visible: boolean;
  label?: string;
}

export interface PlotPoint {
  x: number;
  y: number;
}

export interface FunctionAnalysis {
  roots: number[];
  yIntercept: number | null;
  minPoints: PlotPoint[];
  maxPoints: PlotPoint[];
}

export interface PresetFunction {
  name: string;
  category: 'Temel' | 'Trigonometri' | 'Polinom' | 'STEM & Fizik';
  expression: string;
  xRange: [number, number];
  yRange: [number, number];
  desc: string;
}

export const PRESET_FUNCTIONS: PresetFunction[] = [
  {
    name: 'Karesel Parabol',
    category: 'Temel',
    expression: 'x^2 - 4',
    xRange: [-5, 5],
    yRange: [-6, 12],
    desc: 'Standart ikinci dereceden parabol',
  },
  {
    name: 'Sinüs Dalgası',
    category: 'Trigonometri',
    expression: 'sin(x)',
    xRange: [-6.5, 6.5],
    yRange: [-2, 2],
    desc: 'Temel periyodik sinüs dalgası',
  },
  {
    name: 'Sönümlü Salınım (Harmonik)',
    category: 'STEM & Fizik',
    expression: 'exp(-0.3 * x) * cos(3 * x)',
    xRange: [0, 10],
    yRange: [-1.5, 1.5],
    desc: 'Sönümlü harmonik osilatör dalgası',
  },
  {
    name: 'Gauss Normal Dağılımı',
    category: 'STEM & Fizik',
    expression: 'exp(-x^2 / 2) / sqrt(2 * pi)',
    xRange: [-4, 4],
    yRange: [-0.1, 0.6],
    desc: 'Standart normal çan eğrisi',
  },
  {
    name: 'Tanjant Eğrisi',
    category: 'Trigonometri',
    expression: 'tan(x)',
    xRange: [-4.5, 4.5],
    yRange: [-6, 6],
    desc: 'Düşey asimptotlu tanjant fonksiyonu',
  },
  {
    name: 'Kübik Polinom',
    category: 'Polinom',
    expression: 'x^3 - 3*x',
    xRange: [-3, 3],
    yRange: [-4, 4],
    desc: 'Yerel minimum ve maksimumlu 3. derece fonksiyon',
  },
  {
    name: 'Rasyonel / Hiperbol',
    category: 'Temel',
    expression: '1 / x',
    xRange: [-5, 5],
    yRange: [-5, 5],
    desc: 'Sıfırda tanımsız standart hiperbol',
  },
  {
    name: 'Doğal Logaritma',
    category: 'Temel',
    expression: 'ln(x)',
    xRange: [0.05, 8],
    yRange: [-3, 3],
    desc: 'Artan logaritmik eğri',
  },
];

/**
 * Sanitize and compile single-variable mathematical expression into a JS function
 */
export function compileExpression(rawExpr: string): (x: number) => number {
  if (!rawExpr || !rawExpr.trim()) {
    return () => 0;
  }

  let expr = rawExpr.trim();

  // Replace common representations
  expr = expr.replace(/\s+/g, '');
  // Replace constants
  expr = expr.replace(/\bpi\b/gi, `${Math.PI}`);
  expr = expr.replace(/\bPI\b/g, `${Math.PI}`);
  expr = expr.replace(/\be\b/gi, `${Math.E}`);

  // Replace ln with log (natural log)
  expr = expr.replace(/\bln\(/gi, 'Math.log(');
  expr = expr.replace(/\blog10\(/gi, 'Math.log10(');
  expr = expr.replace(/\blog\(/gi, 'Math.log(');

  // Replace functions with Math equivalents
  const mathFns = [
    'sin', 'cos', 'tan',
    'asin', 'acos', 'atan',
    'sinh', 'cosh', 'tanh',
    'sqrt', 'cbrt', 'abs', 'exp', 'floor', 'ceil', 'round'
  ];

  mathFns.forEach((fn) => {
    const regex = new RegExp(`\\b${fn}\\(`, 'gi');
    expr = expr.replace(regex, `Math.${fn}(`);
  });

  // Handle implicit multiplication like 2x, 4sin, (x+1)(x-1), x(x)
  expr = expr.replace(/(\d)([a-zA-Z(])/g, '$1*$2');
  expr = expr.replace(/(\))([a-zA-Z\d(])/g, '$1*$2');

  // Handle power operator ^ with Math.pow or **
  // Replace x^2 -> (x)**(2)
  expr = expr.replace(/\^/g, '**');

  // Whitelist check to prevent unsafe arbitrary code execution
  const allowedChars = /^[0-9xX+\-*/%(),. Math_]+$/;
  const stripped = expr.replace(/Math\.[a-zA-Z0-9]+/g, '');
  if (!allowedChars.test(stripped)) {
    throw new Error('Geçersiz veya desteklenmeyen matematiksel ifade.');
  }

  // Create compiled evaluation function
  try {
    const fn = new Function('x', `
      try {
        const val = ${expr};
        return typeof val === 'number' && !isNaN(val) ? val : NaN;
      } catch (e) {
        return NaN;
      }
    `);
    return fn as (x: number) => number;
  } catch (err) {
    throw new Error('Matematik ifadesi ayrıştırılamadı.');
  }
}

/**
 * Sample continuous curve segments for graphing, breaking at vertical asymptotes or NaN
 */
export function sampleFunctionCurve(
  fn: (x: number) => number,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  steps: number = 600
): PlotPoint[][] {
  const segments: PlotPoint[][] = [];
  let currentSegment: PlotPoint[] = [];

  const dx = (xMax - xMin) / steps;
  const ySpan = Math.abs(yMax - yMin);
  const maxDiscontinuityDelta = ySpan * 3; // jump threshold for asymptote detection

  let prevY: number | null = null;

  for (let i = 0; i <= steps; i++) {
    const x = xMin + i * dx;
    let y: number;
    try {
      y = fn(x);
    } catch {
      y = NaN;
    }

    if (isNaN(y) || !isFinite(y)) {
      if (currentSegment.length > 0) {
        segments.push(currentSegment);
        currentSegment = [];
      }
      prevY = null;
      continue;
    }

    // Check for severe asymptotic jump (e.g. tan(x) or 1/x crossing zero)
    if (prevY !== null && Math.abs(y - prevY) > maxDiscontinuityDelta && Math.sign(y) !== Math.sign(prevY)) {
      if (currentSegment.length > 0) {
        segments.push(currentSegment);
        currentSegment = [];
      }
    }

    // Clamp values that shoot far out of the coordinate box to avoid canvas clipping artifacts
    const clampedY = Math.max(yMin - ySpan * 2, Math.min(yMax + ySpan * 2, y));
    currentSegment.push({ x, y: clampedY });
    prevY = y;
  }

  if (currentSegment.length > 0) {
    segments.push(currentSegment);
  }

  return segments;
}

/**
 * Find roots (f(x) = 0), y-intercept, and extrema using bisection sampling
 */
export function analyzeFunction(
  fn: (x: number) => number,
  xMin: number,
  xMax: number
): FunctionAnalysis {
  const roots: number[] = [];
  let yIntercept: number | null = null;
  const minPoints: PlotPoint[] = [];
  const maxPoints: PlotPoint[] = [];

  // Y-intercept at x = 0
  if (xMin <= 0 && xMax >= 0) {
    try {
      const y0 = fn(0);
      if (isFinite(y0) && !isNaN(y0)) {
        yIntercept = Math.round(y0 * 1000) / 1000;
      }
    } catch {
      yIntercept = null;
    }
  }

  // Scan for roots across domain
  const samples = 300;
  const dx = (xMax - xMin) / samples;
  let prevX = xMin;
  let prevY: number;
  try {
    prevY = fn(xMin);
  } catch {
    prevY = NaN;
  }

  for (let i = 1; i <= samples; i++) {
    const x = xMin + i * dx;
    let y: number;
    try {
      y = fn(x);
    } catch {
      y = NaN;
    }

    if (!isNaN(prevY) && !isNaN(y) && isFinite(prevY) && isFinite(y)) {
      // Check sign change
      if ((prevY <= 0 && y >= 0) || (prevY >= 0 && y <= 0)) {
        // Refine with bisection
        let left = prevX;
        let right = x;
        for (let iter = 0; iter < 12; iter++) {
          const mid = (left + right) / 2;
          const midY = fn(mid);
          if (Math.abs(midY) < 1e-6) {
            left = mid;
            break;
          }
          if (Math.sign(midY) === Math.sign(fn(left))) {
            left = mid;
          } else {
            right = mid;
          }
        }
        const root = Math.round(((left + right) / 2) * 100) / 100;
        if (!roots.some((r) => Math.abs(r - root) < 0.05)) {
          roots.push(root);
        }
      }
    }

    prevX = x;
    prevY = y;
  }

  return {
    roots,
    yIntercept,
    minPoints,
    maxPoints,
  };
}
