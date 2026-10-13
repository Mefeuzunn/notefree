export interface MathSolutionStep {
  stepNumber: number;
  explanation: string;
  expression: string;
  latex?: string;
}

export interface MathSolutionResult {
  inputEquation: string;
  standardizedEquation: string;
  variable?: string;
  result: string;
  latexResult: string;
  steps: MathSolutionStep[];
  isSolvable: boolean;
  solutionType: 'linear' | 'quadratic' | 'arithmetic' | 'calculus' | 'geometry';
}

/**
 * Normalizes user-inputted or recognized handwritten math expression
 */
export function cleanMathExpression(raw: string): string {
  return raw
    .trim()
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/–/g, '-')
    .replace(/\s+/g, ' ');
}

/**
 * Solves a single variable linear equation: a*x + b = c*x + d
 */
function solveLinearEquation(eq: string): MathSolutionResult | null {
  const parts = eq.split('=');
  if (parts.length !== 2) return null;

  const left = parts[0].trim();
  const right = parts[1].trim();

  // Find variable character (x, y, z, t, a, b, n)
  const varMatch = eq.match(/[a-zA-Z]/);
  if (!varMatch) return null;
  const variable = varMatch[0];

  const steps: MathSolutionStep[] = [];
  steps.push({
    stepNumber: 1,
    explanation: 'Verilen denklem inceleniyor',
    expression: eq,
    latex: eq,
  });

  // Simple parser for linear forms like "ax + b = c" or "ax - b = c" or "ax = c"
  const linearRegex = new RegExp(
    `^([+-]?\\s*\\d*\\.?\\d*)\\s*\\*?\\s*${variable}\\s*([+-]\\s*\\d+\\.?\\d*)?$`,
    'i'
  );
  const leftMatch = left.replace(/\s/g, '').match(linearRegex);
  const rightVal = parseFloat(right);

  if (leftMatch && !isNaN(rightVal)) {
    let aStr = leftMatch[1] || '1';
    if (aStr === '' || aStr === '+') aStr = '1';
    if (aStr === '-') aStr = '-1';
    const a = parseFloat(aStr);

    let b = 0;
    if (leftMatch[2]) {
      b = parseFloat(leftMatch[2]);
    }

    if (a !== 0) {
      if (b !== 0) {
        const movedVal = rightVal - b;
        steps.push({
          stepNumber: 2,
          explanation: `Sabit terim (${b}) eşitliğin diğer tarafına taşınıyor`,
          expression: `${a !== 1 ? a : ''}${variable} = ${rightVal} - (${b}) = ${movedVal}`,
          latex: `${a !== 1 ? a : ''}${variable} = ${movedVal}`,
        });
      }

      const finalVal = (rightVal - b) / a;
      const formattedVal = Number.isInteger(finalVal) ? finalVal.toString() : finalVal.toFixed(3);

      steps.push({
        stepNumber: b !== 0 ? 3 : 2,
        explanation: `Her iki taraf ${variable} katsayısına (${a}) bölünüyor`,
        expression: `${variable} = ${formattedVal}`,
        latex: `${variable} = ${formattedVal}`,
      });

      return {
        inputEquation: eq,
        standardizedEquation: `${a}${variable} + ${b} = ${rightVal}`,
        variable,
        result: `${variable} = ${formattedVal}`,
        latexResult: `${variable} = ${formattedVal}`,
        steps,
        isSolvable: true,
        solutionType: 'linear',
      };
    }
  }

  return null;
}

/**
 * Solves a quadratic equation: ax^2 + bx + c = 0
 */
function solveQuadraticEquation(eq: string): MathSolutionResult | null {
  const parts = eq.split('=');
  if (parts.length !== 2) return null;
  const left = parts[0].replace(/\s/g, '');
  const right = parseFloat(parts[1].trim());

  if (isNaN(right)) return null;

  // Pattern: ax^2 + bx + c = 0
  const quadRegex = /([+-]?\d*\.?\d*)x\^?2([+-]\d*\.?\d*)?x?([+-]\d+\.?\d*)?/i;
  const match = left.match(quadRegex);

  if (match) {
    let a = match[1] === '' || match[1] === '+' ? 1 : match[1] === '-' ? -1 : parseFloat(match[1]);
    let b = match[2]
      ? match[2] === '+'
        ? 1
        : match[2] === '-'
        ? -1
        : parseFloat(match[2])
      : 0;
    let c = match[3] ? parseFloat(match[3]) : 0;
    c -= right;

    if (isNaN(a)) a = 1;

    const delta = b * b - 4 * a * c;
    const steps: MathSolutionStep[] = [];

    steps.push({
      stepNumber: 1,
      explanation: 'Denklem standart forma (ax² + bx + c = 0) getirildi',
      expression: `${a}x² + (${b})x + (${c}) = 0`,
      latex: `${a}x^2 + ${b}x + ${c} = 0`,
    });

    steps.push({
      stepNumber: 2,
      explanation: `Diskriminant (Δ = b² - 4ac) hesaplanıyor: (${b})² - 4·(${a})·(${c})`,
      expression: `Δ = ${delta}`,
      latex: `\\Delta = ${delta}`,
    });

    if (delta > 0) {
      const sqrtDelta = Math.sqrt(delta);
      const x1 = (-b + sqrtDelta) / (2 * a);
      const x2 = (-b - sqrtDelta) / (2 * a);
      const x1Str = Number.isInteger(x1) ? x1.toString() : x1.toFixed(2);
      const x2Str = Number.isInteger(x2) ? x2.toString() : x2.toFixed(2);

      steps.push({
        stepNumber: 3,
        explanation: 'Δ > 0 olduğundan iki farklı gerçel kök vardır: x = (-b ± √Δ) / 2a',
        expression: `x₁ = ${x1Str}, x₂ = ${x2Str}`,
        latex: `x_1 = ${x1Str}, \\quad x_2 = ${x2Str}`,
      });

      return {
        inputEquation: eq,
        standardizedEquation: `${a}x^2 + ${b}x + ${c} = 0`,
        variable: 'x',
        result: `x₁ = ${x1Str}, x₂ = ${x2Str}`,
        latexResult: `x \\in \\{${x1Str}, ${x2Str}\\}`,
        steps,
        isSolvable: true,
        solutionType: 'quadratic',
      };
    } else if (delta === 0) {
      const x = -b / (2 * a);
      const xStr = Number.isInteger(x) ? x.toString() : x.toFixed(2);
      steps.push({
        stepNumber: 3,
        explanation: 'Δ = 0 olduğundan tek bir çakışık gerçel kök vardır: x = -b / 2a',
        expression: `x = ${xStr}`,
        latex: `x = ${xStr}`,
      });
      return {
        inputEquation: eq,
        standardizedEquation: `${a}x^2 + ${b}x + ${c} = 0`,
        variable: 'x',
        result: `x = ${xStr}`,
        latexResult: `x = ${xStr}`,
        steps,
        isSolvable: true,
        solutionType: 'quadratic',
      };
    } else {
      steps.push({
        stepNumber: 3,
        explanation: 'Δ < 0 olduğundan reel sayılarda çözüm kümesi boştur',
        expression: 'Çözüm kümesi: ∅',
        latex: 'x \\notin \\mathbb{R}',
      });
      return {
        inputEquation: eq,
        standardizedEquation: `${a}x^2 + ${b}x + ${c} = 0`,
        variable: 'x',
        result: 'Reel kök yok (Δ < 0)',
        latexResult: 'x \\notin \\mathbb{R}',
        steps,
        isSolvable: true,
        solutionType: 'quadratic',
      };
    }
  }

  return null;
}

/**
 * Evaluates an arithmetic expression: 15 * (4 + 6) / 2 or powers
 */
function evaluateArithmetic(raw: string): MathSolutionResult | null {
  try {
    let sanitized = raw.replace(/\^/g, '**').replace(/sqrt\(([^)]+)\)/gi, 'Math.sqrt($1)');
    // Only allow digits, math operators, parens, Math functions
    if (!/^[0-9+\-*/().\sMathsqr**]+$/.test(sanitized)) {
      return null;
    }

    // eslint-disable-next-line no-eval
    const val = Function(`'use strict'; return (${sanitized})`)();
    if (typeof val !== 'number' || isNaN(val) || !isFinite(val)) return null;

    const formattedVal = Number.isInteger(val) ? val.toString() : val.toFixed(4);

    return {
      inputEquation: raw,
      standardizedEquation: raw,
      result: formattedVal,
      latexResult: `${raw} = ${formattedVal}`,
      steps: [
        {
          stepNumber: 1,
          explanation: 'Aritmetik ifade işlem sırasına göre hesaplandı',
          expression: `${raw} = ${formattedVal}`,
          latex: `${raw} = ${formattedVal}`,
        },
      ],
      isSolvable: true,
      solutionType: 'arithmetic',
    };
  } catch {
    return null;
  }
}

/**
 * Master Math Solver Engine: automatically identifies equation category and solves it
 */
export function solveMathEquation(input: string): MathSolutionResult {
  const clean = cleanMathExpression(input);

  // 1. Try Quadratic
  if (clean.includes('^2') || clean.includes('x2') || clean.includes('x²')) {
    const quadSol = solveQuadraticEquation(clean.replace(/x²/g, 'x^2').replace(/x2/g, 'x^2'));
    if (quadSol) return quadSol;
  }

  // 2. Try Linear Equation with equality '='
  if (clean.includes('=')) {
    const linSol = solveLinearEquation(clean);
    if (linSol) return linSol;
  }

  // 3. Try Arithmetic Expression
  const arithSol = evaluateArithmetic(clean);
  if (arithSol) return arithSol;

  // Fallback unrecognized
  return {
    inputEquation: input,
    standardizedEquation: clean,
    result: 'Çözümlenemedi',
    latexResult: clean,
    steps: [
      {
        stepNumber: 1,
        explanation: 'İfade tanındı ancak otomatik cebir çözümleyici standart forma uyduramadı.',
        expression: clean,
      },
    ],
    isSolvable: false,
    solutionType: 'arithmetic',
  };
}

/**
 * Generates an SVG DataURL representing formatted LaTeX typography
 * which can be dropped onto the canvas as an image annotation!
 */
export function generateMathSvgDataUrl(
  equation: string,
  resultText: string,
  color: string = '#4f46e5'
): string {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="340" height="96" viewBox="0 0 340 96">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e1b4b" stop-opacity="0.95" />
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0.98" />
    </linearGradient>
  </defs>
  <rect x="2" y="2" width="336" height="92" rx="14" fill="url(#grad)" stroke="${color}" stroke-width="2" />
  <circle cx="24" cy="24" r="8" fill="${color}" fill-opacity="0.25" />
  <text x="24" y="28" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="${color}" text-anchor="middle">∑</text>
  <text x="40" y="27" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#a5b4fc">Math AI Çözüm</text>
  
  <text x="24" y="52" font-family="'Cambria Math', 'Times New Roman', serif" font-size="15" fill="#f1f5f9" font-style="italic">
    ${escapeXml(equation)}
  </text>
  
  <text x="24" y="76" font-family="system-ui, sans-serif" font-size="14" font-weight="bold" fill="#38bdf8">
    ➔ ${escapeXml(resultText)}
  </text>
</svg>
`.trim();

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
