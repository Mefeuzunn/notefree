import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNotebookStore } from '../../store/notebookStore';
import {
  PlotFunctionDef,
  compileExpression,
  sampleFunctionCurve,
  analyzeFunction,
  PRESET_FUNCTIONS,
  FunctionAnalysis,
} from '../../engine/mathPlotter';
import { Stroke, TextAnnotation } from '../../types/notebook';
import { triggerHaptic } from '../../engine/hapticFeedback';
import {
  TrendingUp,
  X,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  RotateCcw,
  Sparkles,
  Download,
  Palette,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Info,
  Check,
  AlertCircle,
  BookOpen,
} from 'lucide-react';

const FUNCTION_COLORS = [
  '#6366f1', // Indigo
  '#f43f5e', // Rose
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#f59e0b', // Amber
  '#a855f7', // Purple
  '#ec4899', // Pink
];

type PlotTheme = 'dark' | 'light' | 'blueprint' | 'chalkboard';

const THEMES: Record<
  PlotTheme,
  {
    name: string;
    bg: string;
    axis: string;
    grid: string;
    subgrid: string;
    text: string;
    border: string;
  }
> = {
  dark: {
    name: 'Koyu Grafit',
    bg: '#090d16',
    axis: '#cbd5e1',
    grid: '#1e293b',
    subgrid: '#131b2c',
    text: '#94a3b8',
    border: '#334155',
  },
  light: {
    name: 'Beyaz Kağıt',
    bg: '#f8fafc',
    axis: '#1e293b',
    grid: '#e2e8f0',
    subgrid: '#f1f5f9',
    text: '#64748b',
    border: '#cbd5e1',
  },
  blueprint: {
    name: 'Mühendislik Blueprint',
    bg: '#0a2540',
    axis: '#38bdf8',
    grid: '#0f3a63',
    subgrid: '#0c2e4f',
    text: '#7dd3fc',
    border: '#0284c7',
  },
  chalkboard: {
    name: 'Yazı Tahtası',
    bg: '#062016',
    axis: '#f1f5f9',
    grid: '#0d3827',
    subgrid: '#08291c',
    text: '#86efac',
    border: '#166534',
  },
};

export const FunctionPlotterModal: React.FC = () => {
  const {
    functionPlotterModalOpen,
    functionPlotterInitialExpr,
    closeFunctionPlotterModal,
    stampPlotGraphToCurrentPage,
  } = useNotebookStore();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Plot state
  const [functions, setFunctions] = useState<PlotFunctionDef[]>([
    {
      id: 'fn_1',
      expression: 'x^2 - 4',
      color: '#6366f1',
      lineWidth: 2.5,
      visible: true,
      label: 'f₁(x)',
    },
  ]);

  const [activeFnIndex, setActiveFnIndex] = useState<number>(0);
  const [theme, setTheme] = useState<PlotTheme>('dark');
  const [xMin, setXMin] = useState<number>(-8);
  const [xMax, setXMax] = useState<number>(8);
  const [yMin, setYMin] = useState<number>(-6);
  const [yMax, setYMax] = useState<number>(6);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showRoots, setShowRoots] = useState<boolean>(true);
  const [hoverCoords, setHoverCoords] = useState<{ x: number; y: number } | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Analysis for the active function
  const [analysis, setAnalysis] = useState<FunctionAnalysis | null>(null);

  // Pan interaction
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ clientX: number; clientY: number; xMin: number; xMax: number; yMin: number; yMax: number }>({
    clientX: 0,
    clientY: 0,
    xMin: -8,
    xMax: 8,
    yMin: -6,
    yMax: 6,
  });

  // Load initial expression if provided
  useEffect(() => {
    if (functionPlotterModalOpen && functionPlotterInitialExpr) {
      setFunctions([
        {
          id: `fn_${Date.now()}`,
          expression: functionPlotterInitialExpr,
          color: '#6366f1',
          lineWidth: 2.5,
          visible: true,
          label: 'f₁(x)',
        },
      ]);
      setActiveFnIndex(0);
    }
  }, [functionPlotterModalOpen, functionPlotterInitialExpr]);

  // Analyze active function whenever it changes
  useEffect(() => {
    const curFn = functions[activeFnIndex];
    if (!curFn || !curFn.expression.trim()) {
      setAnalysis(null);
      return;
    }

    try {
      const compiled = compileExpression(curFn.expression);
      const res = analyzeFunction(compiled, xMin, xMax);
      setAnalysis(res);
    } catch {
      setAnalysis(null);
    }
  }, [functions, activeFnIndex, xMin, xMax]);

  // Coordinate transforms: Math (x, y) -> Canvas Screen Pixels (px, py)
  const toScreenX = useCallback(
    (x: number, width: number) => {
      return ((x - xMin) / (xMax - xMin)) * width;
    },
    [xMin, xMax]
  );

  const toScreenY = useCallback(
    (y: number, height: number) => {
      return height - ((y - yMin) / (yMax - yMin)) * height;
    },
    [yMin, yMax]
  );

  const toMathX = useCallback(
    (px: number, width: number) => {
      return xMin + (px / width) * (xMax - xMin);
    },
    [xMin, xMax]
  );

  const toMathY = useCallback(
    (py: number, height: number) => {
      return yMax - (py / height) * (yMax - yMin);
    },
    [yMin, yMax]
  );

  // Render Canvas
  const renderPlot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    const themeColors = THEMES[theme];

    // Background
    ctx.fillStyle = themeColors.bg;
    ctx.fillRect(0, 0, width, height);

    // Calculate grid step dynamically
    const xSpan = xMax - xMin;
    const rawStep = xSpan / 10;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const residual = rawStep / magnitude;
    let step = magnitude;
    if (residual > 5) step = magnitude * 5;
    else if (residual > 2) step = magnitude * 2;

    // Grid lines
    if (showGrid) {
      ctx.lineWidth = 1;

      // Vertical grid lines
      const firstX = Math.floor(xMin / step) * step;
      for (let x = firstX; x <= xMax; x += step) {
        const sx = toScreenX(x, width);
        ctx.strokeStyle = Math.abs(x) < 1e-6 ? themeColors.axis : themeColors.grid;
        ctx.beginPath();
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx, height);
        ctx.stroke();

        // Tick numbers on X axis
        if (Math.abs(x) > 1e-6) {
          const sy = Math.max(15, Math.min(height - 15, toScreenY(0, height) + 14));
          ctx.fillStyle = themeColors.text;
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(Number(x.toFixed(2)).toString(), sx, sy);
        }
      }

      // Horizontal grid lines
      const firstY = Math.floor(yMin / step) * step;
      for (let y = firstY; y <= yMax; y += step) {
        const sy = toScreenY(y, height);
        ctx.strokeStyle = Math.abs(y) < 1e-6 ? themeColors.axis : themeColors.grid;
        ctx.beginPath();
        ctx.moveTo(0, sy);
        ctx.lineTo(width, sy);
        ctx.stroke();

        // Tick numbers on Y axis
        if (Math.abs(y) > 1e-6) {
          const sx = Math.max(25, Math.min(width - 25, toScreenX(0, width) - 6));
          ctx.fillStyle = themeColors.text;
          ctx.font = '10px monospace';
          ctx.textAlign = 'right';
          ctx.fillText(Number(y.toFixed(2)).toString(), sx, sy + 3);
        }
      }
    }

    // Main Axes (X = 0 and Y = 0)
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = themeColors.axis;

    // X Axis
    const originY = toScreenY(0, height);
    if (originY >= 0 && originY <= height) {
      ctx.beginPath();
      ctx.moveTo(0, originY);
      ctx.lineTo(width, originY);
      ctx.stroke();

      // Arrow head for X axis
      ctx.beginPath();
      ctx.moveTo(width - 8, originY - 4);
      ctx.lineTo(width, originY);
      ctx.lineTo(width - 8, originY + 4);
      ctx.stroke();

      ctx.fillStyle = themeColors.axis;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('x', width - 12, originY - 8);
    }

    // Y Axis
    const originX = toScreenX(0, width);
    if (originX >= 0 && originX <= width) {
      ctx.beginPath();
      ctx.moveTo(originX, height);
      ctx.lineTo(originX, 0);
      ctx.stroke();

      // Arrow head for Y axis
      ctx.beginPath();
      ctx.moveTo(originX - 4, 8);
      ctx.lineTo(originX, 0);
      ctx.lineTo(originX + 4, 8);
      ctx.stroke();

      ctx.fillStyle = themeColors.axis;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('y', originX + 8, 14);
    }

    // Origin label (0,0)
    if (originX >= 0 && originX <= width && originY >= 0 && originY <= height) {
      ctx.fillStyle = themeColors.text;
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText('0', originX - 4, originY + 12);
    }

    // Plot Functions Curves
    functions.forEach((fnDef, idx) => {
      if (!fnDef.visible || !fnDef.expression.trim()) return;

      let compiled: (x: number) => number;
      try {
        compiled = compileExpression(fnDef.expression);
      } catch {
        return;
      }

      const segments = sampleFunctionCurve(compiled, xMin, xMax, yMin, yMax, 600);

      ctx.strokeStyle = fnDef.color;
      ctx.lineWidth = fnDef.lineWidth || 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      segments.forEach((seg) => {
        if (seg.length < 2) return;
        ctx.beginPath();
        const startSx = toScreenX(seg[0].x, width);
        const startSy = toScreenY(seg[0].y, height);
        ctx.moveTo(startSx, startSy);

        for (let i = 1; i < seg.length; i++) {
          const sx = toScreenX(seg[i].x, width);
          const sy = toScreenY(seg[i].y, height);
          ctx.lineTo(sx, sy);
        }
        ctx.stroke();
      });

      // Draw glowing root markers for the active function
      if (showRoots && idx === activeFnIndex && analysis?.roots) {
        analysis.roots.forEach((root) => {
          const rx = toScreenX(root, width);
          const ry = toScreenY(0, height);

          // Glow ring
          ctx.beginPath();
          ctx.arc(rx, ry, 6, 0, Math.PI * 2);
          ctx.fillStyle = `${fnDef.color}40`;
          ctx.fill();

          // Core dot
          ctx.beginPath();
          ctx.arc(rx, ry, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.strokeStyle = fnDef.color;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Coordinate label badge
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`(${root}, 0)`, rx, ry - 9);
        });

        // Y-intercept marker
        if (analysis.yIntercept !== null) {
          const y0 = analysis.yIntercept;
          const ix = toScreenX(0, width);
          const iy = toScreenY(y0, height);

          ctx.beginPath();
          ctx.arc(ix, iy, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = '#fbbf24';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.2;
          ctx.stroke();

          ctx.fillStyle = '#fde68a';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'left';
          ctx.fillText(`(0, ${y0})`, ix + 6, iy - 4);
        }
      }
    });

    // Crosshairs and hover info
    if (hoverCoords) {
      const sx = toScreenX(hoverCoords.x, width);
      const sy = toScreenY(hoverCoords.y, height);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, height);
      ctx.moveTo(0, sy);
      ctx.lineTo(width, sy);
      ctx.stroke();
      ctx.setLineDash([]);

      // Floating Coordinate Pill
      const pillText = `x: ${hoverCoords.x.toFixed(2)}, y: ${hoverCoords.y.toFixed(2)}`;
      ctx.font = '10px monospace';
      const textWidth = ctx.measureText(pillText).width;
      const pillW = textWidth + 14;
      const pillH = 20;
      const pillX = Math.min(width - pillW - 8, Math.max(8, sx + 10));
      const pillY = Math.min(height - pillH - 8, Math.max(8, sy - 28));

      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText(pillText, pillX + 7, pillY + 14);
    }

    ctx.restore();
  }, [
    theme,
    xMin,
    xMax,
    yMin,
    yMax,
    showGrid,
    showRoots,
    functions,
    activeFnIndex,
    analysis,
    hoverCoords,
    toScreenX,
    toScreenY,
  ]);

  useEffect(() => {
    renderPlot();
  }, [renderPlot]);

  // Window resize observer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      renderPlot();
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [renderPlot]);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 0.88 : 1.14;
    zoomAround(factor, e.nativeEvent.offsetX, e.nativeEvent.offsetY);
  };

  const zoomAround = (factor: number, clientX?: number, clientY?: number) => {
    const canvas = canvasRef.current;
    const width = canvas?.clientWidth || 600;
    const height = canvas?.clientHeight || 450;

    const cx = clientX !== undefined ? toMathX(clientX, width) : (xMin + xMax) / 2;
    const cy = clientY !== undefined ? toMathY(clientY, height) : (yMin + yMax) / 2;

    const newXHalfSpan = ((xMax - xMin) / 2) * factor;
    const newYHalfSpan = ((yMax - yMin) / 2) * factor;

    // Limits
    if (newXHalfSpan < 0.2 || newXHalfSpan > 1000) return;

    setXMin(cx - newXHalfSpan);
    setXMax(cx + newXHalfSpan);
    setYMin(cy - newYHalfSpan);
    setYMax(cy + newYHalfSpan);
  };

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      xMin,
      xMax,
      yMin,
      yMax,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    setHoverCoords({
      x: toMathX(px, canvas.clientWidth),
      y: toMathY(py, canvas.clientHeight),
    });

    if (isDraggingRef.current) {
      const dxPx = e.clientX - dragStartRef.current.clientX;
      const dyPx = e.clientY - dragStartRef.current.clientY;

      const mathDx = (dxPx / canvas.clientWidth) * (dragStartRef.current.xMax - dragStartRef.current.xMin);
      const mathDy = (dyPx / canvas.clientHeight) * (dragStartRef.current.yMax - dragStartRef.current.yMin);

      setXMin(dragStartRef.current.xMin - mathDx);
      setXMax(dragStartRef.current.xMax - mathDx);
      setYMin(dragStartRef.current.yMin + mathDy);
      setYMax(dragStartRef.current.yMax + mathDy);
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const resetView = () => {
    triggerHaptic('light');
    setXMin(-8);
    setXMax(8);
    setYMin(-6);
    setYMax(6);
  };

  // Add new function
  const handleAddFunction = () => {
    triggerHaptic('light');
    const newIdx = functions.length + 1;
    const newColor = FUNCTION_COLORS[(functions.length) % FUNCTION_COLORS.length];
    const newFn: PlotFunctionDef = {
      id: `fn_${Date.now()}`,
      expression: '2*x + 1',
      color: newColor,
      lineWidth: 2.5,
      visible: true,
      label: `f${newIdx}(x)`,
    };
    setFunctions([...functions, newFn]);
    setActiveFnIndex(functions.length);
  };

  // Update function
  const handleUpdateFunction = (id: string, partial: Partial<PlotFunctionDef>) => {
    setFunctions(functions.map((f) => (f.id === id ? { ...f, ...partial } : f)));
  };

  // Delete function
  const handleDeleteFunction = (id: string) => {
    triggerHaptic('light');
    if (functions.length <= 1) return;
    const filtered = functions.filter((f) => f.id !== id);
    setFunctions(filtered);
    setActiveFnIndex(0);
  };

  // Select Preset
  const handleSelectPreset = (preset: (typeof PRESET_FUNCTIONS)[0]) => {
    triggerHaptic('light');
    setFunctions((prev) => {
      const updated = [...prev];
      updated[activeFnIndex] = {
        ...updated[activeFnIndex],
        expression: preset.expression,
      };
      return updated;
    });
    setXMin(preset.xRange[0]);
    setXMax(preset.xRange[1]);
    setYMin(preset.yRange[0]);
    setYMax(preset.yRange[1]);
  };

  // Stamp Plot as Vector Strokes onto Active Notebook Page
  const handleStampToCanvas = () => {
    triggerHaptic('success');

    const stampWidth = 480;
    const stampHeight = 360;
    const startX = 140;
    const startY = 160;

    const strokes: Stroke[] = [];
    const texts: TextAnnotation[] = [];
    const now = Date.now();

    function computeStrokeBounds(pts: { x: number; y: number }[]) {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      pts.forEach((p) => {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
      });
      return { minX, minY, maxX, maxY };
    }

    // 1. Plot Background Frame / Border Stroke
    const frameId = `stroke_plot_frame_${now}`;
    const framePoints = [
      { x: startX, y: startY, pressure: 0.5 },
      { x: startX + stampWidth, y: startY, pressure: 0.5 },
      { x: startX + stampWidth, y: startY + stampHeight, pressure: 0.5 },
      { x: startX, y: startY + stampHeight, pressure: 0.5 },
      { x: startX, y: startY, pressure: 0.5 },
    ];
    strokes.push({
      id: frameId,
      points: framePoints,
      color: '#334155',
      size: 1.5,
      tool: 'ballpoint',
      bounds: computeStrokeBounds(framePoints),
      timestamp: now,
    });

    // 2. Axes (X and Y)
    const midX = startX + stampWidth * ((-xMin) / (xMax - xMin));
    const midY = startY + stampHeight * (1 - (-yMin) / (yMax - yMin));

    // Horizontal X Axis
    if (midY >= startY && midY <= startY + stampHeight) {
      const xAxisPoints = [
        { x: startX + 10, y: midY, pressure: 0.8 },
        { x: startX + stampWidth - 10, y: midY, pressure: 0.8 },
      ];
      strokes.push({
        id: `stroke_plot_xaxis_${now}`,
        points: xAxisPoints,
        color: '#64748b',
        size: 2,
        tool: 'ballpoint',
        bounds: computeStrokeBounds(xAxisPoints),
        timestamp: now,
      });
    }

    // Vertical Y Axis
    if (midX >= startX && midX <= startX + stampWidth) {
      const yAxisPoints = [
        { x: midX, y: startY + stampHeight - 10, pressure: 0.8 },
        { x: midX, y: startY + 10, pressure: 0.8 },
      ];
      strokes.push({
        id: `stroke_plot_yaxis_${now}`,
        points: yAxisPoints,
        color: '#64748b',
        size: 2,
        tool: 'ballpoint',
        bounds: computeStrokeBounds(yAxisPoints),
        timestamp: now,
      });
    }

    // 3. Vector curves for all visible functions
    functions.forEach((fnDef, idx) => {
      if (!fnDef.visible || !fnDef.expression.trim()) return;

      try {
        const compiled = compileExpression(fnDef.expression);
        const segments = sampleFunctionCurve(compiled, xMin, xMax, yMin, yMax, 350);

        segments.forEach((seg, sIdx) => {
          if (seg.length < 2) return;
          const strokePoints = seg.map((pt) => ({
            x: startX + ((pt.x - xMin) / (xMax - xMin)) * stampWidth,
            y: startY + (1 - (pt.y - yMin) / (yMax - yMin)) * stampHeight,
            pressure: 0.7,
          }));

          strokes.push({
            id: `stroke_plot_fn_${idx}_${sIdx}_${now}`,
            points: strokePoints,
            color: fnDef.color,
            size: fnDef.lineWidth || 2.5,
            tool: 'fountain',
            bounds: computeStrokeBounds(strokePoints),
            timestamp: now + idx,
          });
        });
      } catch (err) {
        console.error('Curve stamp error:', err);
      }
    });

    // 4. Header Text Annotation
    const activeFn = functions[activeFnIndex] || functions[0];
    const formulaTitle = `📈 Grafiği: y = ${activeFn?.expression || 'f(x)'}`;
    texts.push({
      id: `text_plot_${now}`,
      x: startX + 16,
      y: startY + 16,
      text: formulaTitle,
      color: '#cbd5e1',
      fontSize: 13,
      fontFamily: 'Inter',
      width: 260,
    });

    stampPlotGraphToCurrentPage({ strokes, texts });
    setFeedback('Grafik ve koordinat sistemi başarıyla sayfaya damgalandı! 📐');
    setTimeout(() => {
      setFeedback(null);
      closeFunctionPlotterModal();
    }, 1200);
  };

  if (!functionPlotterModalOpen) return null;

  const currentFn = functions[activeFnIndex] || functions[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md select-none animate-in fade-in duration-150">
      <div className="relative w-full max-w-5xl h-[88vh] bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Top Modal Header */}
        <div className="px-6 py-3.5 bg-slate-850 border-b border-slate-750 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <TrendingUp size={19} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>STEM 2D Matematik Fonksiyon & Grafik Çizici</span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-mono font-semibold">
                  Faz AB
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Gerçek zamanlı cebirsel ve trigonometrik fonksiyon analizi, kök tespiti ve tuvale damgalama
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleStampToCanvas}
              className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-md shadow-indigo-600/30 hover:scale-105 transition-all"
              title="Grafiği aktif sayfaya vektör vuruş olarak ekle"
            >
              <Download size={14} />
              <span>Sayfaya Damgala</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                closeFunctionPlotterModal();
              }}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Main Workspace Body: Split Left (Canvas) and Right (Functions & Settings) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Canvas Viewport */}
          <div className="flex-1 relative flex flex-col bg-slate-950 overflow-hidden">
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              className="w-full h-full cursor-crosshair select-none touch-none"
            />

            {/* Floating Canvas Controls (Top Right of canvas) */}
            <div className="absolute top-3 right-3 flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-2xl border border-slate-750 shadow-xl">
              <button
                onClick={() => zoomAround(0.8)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                title="Yakınlaştır (+)"
              >
                <ZoomIn size={15} />
              </button>
              <button
                onClick={() => zoomAround(1.25)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                title="Uzaklaştır (-)"
              >
                <ZoomOut size={15} />
              </button>
              <button
                onClick={resetView}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                title="Görünümü Sıfırla"
              >
                <RotateCcw size={14} />
              </button>
              <div className="w-px h-4 bg-slate-750 mx-0.5" />
              <button
                onClick={() => setShowGrid(!showGrid)}
                className={`p-1.5 rounded-xl transition-colors text-xs font-mono font-bold ${
                  showGrid ? 'bg-indigo-600/30 text-indigo-300' : 'text-slate-400 hover:text-white'
                }`}
                title="Izgarayı Aç/Kapat"
              >
                Izgara
              </button>
              <button
                onClick={() => setShowRoots(!showRoots)}
                className={`p-1.5 rounded-xl transition-colors text-xs font-mono font-bold ${
                  showRoots ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-white'
                }`}
                title="Kökleri (f(x)=0) Vurgula"
              >
                Kökler
              </button>
            </div>

            {/* Bottom Coordinate Indicator Bar */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-750 text-[11px] font-mono text-slate-300 shadow-md">
              <span className="text-slate-500">Aralık:</span>
              <span>
                x: [{xMin.toFixed(1)}, {xMax.toFixed(1)}]
              </span>
              <span className="text-slate-700">|</span>
              <span>
                y: [{yMin.toFixed(1)}, {yMax.toFixed(1)}]
              </span>
            </div>

            {/* Feedback notification toast */}
            {feedback && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900/95 border border-indigo-500 text-white px-5 py-3 rounded-2xl shadow-2xl text-xs font-semibold flex items-center gap-2 animate-in zoom-in-95">
                <Check size={16} className="text-emerald-400" />
                <span>{feedback}</span>
              </div>
            )}
          </div>

          {/* Right Sidebar: Function Editor, Presets & Analysis */}
          <div className="w-full lg:w-96 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-750 flex flex-col overflow-y-auto p-4 space-y-4">
            {/* 1. Functions List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={13} className="text-indigo-400" />
                  <span>Fonksiyonlar ({functions.length})</span>
                </span>
                <button
                  onClick={handleAddFunction}
                  className="p-1 text-indigo-400 hover:text-indigo-300 hover:bg-slate-800 rounded-lg text-xs flex items-center gap-1 transition-colors"
                  title="Yeni Fonksiyon Ekle"
                >
                  <Plus size={14} />
                  <span className="text-[11px]">Ekle</span>
                </button>
              </div>

              <div className="space-y-2">
                {functions.map((fn, idx) => (
                  <div
                    key={fn.id}
                    onClick={() => setActiveFnIndex(idx)}
                    className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
                      idx === activeFnIndex
                        ? 'bg-slate-800/90 border-indigo-500/80 shadow-md ring-1 ring-indigo-500/30'
                        : 'bg-slate-850/60 border-slate-750 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      {/* Color indicator / picker */}
                      <div
                        className="w-3.5 h-3.5 rounded-full shadow-sm"
                        style={{ backgroundColor: fn.color }}
                      />
                      <span className="text-xs font-mono font-bold text-slate-300">
                        {fn.label || `f${idx + 1}(x)`} =
                      </span>

                      <div className="flex-1" />

                      {/* Visibility toggle */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateFunction(fn.id, { visible: !fn.visible });
                        }}
                        className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
                      >
                        {fn.visible ? <Eye size={13} /> : <EyeOff size={13} className="text-slate-600" />}
                      </button>

                      {/* Delete */}
                      {functions.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFunction(fn.id);
                          }}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>

                    {/* Expression input */}
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={fn.expression}
                        onChange={(e) => handleUpdateFunction(fn.id, { expression: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                        placeholder="Örn: x^2 - 4 veya sin(x)"
                      />
                    </div>

                    {/* Color Swatches (when active) */}
                    {idx === activeFnIndex && (
                      <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-700/60">
                        <span className="text-[10px] text-slate-400">Renk:</span>
                        {FUNCTION_COLORS.map((c) => (
                          <button
                            key={c}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateFunction(fn.id, { color: c });
                            }}
                            className={`w-4 h-4 rounded-full transition-transform ${
                              fn.color === c ? 'scale-125 ring-2 ring-white' : 'hover:scale-110'
                            }`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Real-time Analysis Card */}
            {analysis && (
              <div className="p-3 bg-slate-850/80 border border-slate-750 rounded-2xl space-y-2">
                <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-indigo-400">
                    <Info size={13} />
                    <span>Fonksiyon Analizi</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {currentFn?.label || 'f(x)'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-750">
                    <span className="text-slate-400 block text-[10px]">Kökler (f(x) = 0):</span>
                    <span className="font-bold text-emerald-400">
                      {analysis.roots.length > 0 ? analysis.roots.map((r) => `x = ${r}`).join(', ') : 'Reel kök yok'}
                    </span>
                  </div>

                  <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-750">
                    <span className="text-slate-400 block text-[10px]">y-Kesişimi (f(0)):</span>
                    <span className="font-bold text-amber-400">
                      {analysis.yIntercept !== null ? `y = ${analysis.yIntercept}` : 'Tanımsız'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Preset Templates Library */}
            <div>
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <BookOpen size={13} className="text-amber-400" />
                <span>Hazır STEM Fonksiyon Şablonları</span>
              </span>

              <div className="grid grid-cols-2 gap-1.5">
                {PRESET_FUNCTIONS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => handleSelectPreset(preset)}
                    className="p-2 bg-slate-850/70 hover:bg-slate-800 border border-slate-750 hover:border-indigo-500/50 rounded-xl text-left transition-all group"
                  >
                    <div className="text-[11px] font-semibold text-slate-200 group-hover:text-indigo-300 truncate">
                      {preset.name}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 truncate">
                      {preset.expression}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Canvas Theme Picker */}
            <div>
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Palette size={13} className="text-cyan-400" />
                <span>Grafik Teması</span>
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {(Object.keys(THEMES) as PlotTheme[]).map((thm) => (
                  <button
                    key={thm}
                    onClick={() => setTheme(thm)}
                    className={`p-2 rounded-xl border text-xs font-medium flex items-center justify-between transition-all ${
                      theme === thm
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-bold'
                        : 'bg-slate-850 border-slate-750 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>{THEMES[thm].name}</span>
                    {theme === thm && <Check size={13} className="text-indigo-400" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
