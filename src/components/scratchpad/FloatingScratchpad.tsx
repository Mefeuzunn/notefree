import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useNotebookStore } from '../../store/notebookStore';
import { triggerHaptic } from '../../engine/hapticFeedback';
import { Stroke, StrokePoint, StickyNoteColor } from '../../types/notebook';
import {
  X,
  Minus,
  Maximize2,
  PenTool,
  Highlighter,
  Eraser,
  Undo2,
  Trash2,
  Copy,
  Stamp,
  Check,
  Type,
  Move,
  Sparkles,
} from 'lucide-react';

interface ScratchStroke {
  tool: 'pen' | 'highlighter' | 'eraser';
  color: string;
  size: number;
  points: { x: number; y: number }[];
}

const INK_COLORS = [
  { name: 'Grafit', hex: '#0f172a' },
  { name: 'Mavi', hex: '#2563eb' },
  { name: 'Kırmızı', hex: '#dc2626' },
  { name: 'Fosforlu', hex: '#eab308' },
  { name: 'Yeşil', hex: '#16a34a' },
];

const STICKY_COLORS: { id: StickyNoteColor; name: string; bg: string; border: string }[] = [
  { id: 'yellow', name: 'Sarı', bg: 'bg-amber-100/90 text-amber-950', border: 'border-amber-400' },
  { id: 'mint', name: 'Nane', bg: 'bg-emerald-100/90 text-emerald-950', border: 'border-emerald-400' },
  { id: 'blue', name: 'Mavi', bg: 'bg-sky-100/90 text-sky-950', border: 'border-sky-400' },
  { id: 'pink', name: 'Pembe', bg: 'bg-rose-100/90 text-rose-950', border: 'border-rose-400' },
  { id: 'purple', name: 'Mor', bg: 'bg-purple-100/90 text-purple-950', border: 'border-purple-400' },
];

export const FloatingScratchpad: React.FC = () => {
  const {
    scratchpadOpen,
    scratchpadMinimized,
    scratchpadMode,
    scratchpadText,
    scratchpadColor,
    toggleScratchpad,
    setScratchpadOpen,
    setScratchpadMinimized,
    setScratchpadMode,
    setScratchpadText,
    setScratchpadColor,
    addStrokesToCurrentPage,
    addStickyNoteToCurrentPage,
    activeNotebookId,
    notebooks,
    activePageIndex,
  } = useNotebookStore();

  const [position, setPosition] = useState<{ x: number; y: number }>(() => ({
    x: Math.max(20, window.innerWidth - 380),
    y: Math.max(60, window.innerHeight - 480),
  }));

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number }>({
    mouseX: 0,
    mouseY: 0,
    startX: 0,
    startY: 0,
  });

  // Ink state
  const [strokes, setStrokes] = useState<ScratchStroke[]>([]);
  const [activeInkTool, setActiveInkTool] = useState<'pen' | 'highlighter' | 'eraser'>('pen');
  const [activeInkColor, setActiveInkColor] = useState<string>('#0f172a');
  const [activeInkSize, setActiveInkSize] = useState<number>(3);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const currentPointsRef = useRef<{ x: number; y: number }[]>([]);

  // Reposition inside bounds on resize
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => ({
        x: Math.min(prev.x, Math.max(20, window.innerWidth - 380)),
        y: Math.min(prev.y, Math.max(60, window.innerHeight - 200)),
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Dragging logic
  const handlePointerDownHeader = (e: React.PointerEvent) => {
    // Only drag with left click or primary touch
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input')) return;

    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: position.x,
      startY: position.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMoveHeader = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.mouseX;
    const dy = e.clientY - dragStartRef.current.mouseY;

    const newX = Math.max(10, Math.min(window.innerWidth - 360, dragStartRef.current.startX + dx));
    const newY = Math.max(40, Math.min(window.innerHeight - 100, dragStartRef.current.startY + dy));

    setPosition({ x: newX, y: newY });
  };

  const handlePointerUpHeader = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Ignore if pointer capture lost
      }
    }
  };

  // Render Scratchpad Ink Canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Warm paper grid background for scratchpad
    ctx.save();
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    // Subtle dot grid
    ctx.fillStyle = '#cbd5e1';
    const dotSpacing = 16 * 2;
    for (let x = dotSpacing; x < width; x += dotSpacing) {
      for (let y = dotSpacing; y < height; y += dotSpacing) {
        ctx.beginPath();
        ctx.arc(x, y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    // Render each stroke
    strokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (stroke.tool === 'highlighter') {
        ctx.globalAlpha = 0.42;
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.size * 3.5 * 2;
      } else {
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.size * 2;
      }

      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x * 2, stroke.points[0].y * 2);
      for (let i = 1; i < stroke.points.length; i++) {
        const xc = (stroke.points[i - 1].x * 2 + stroke.points[i].x * 2) / 2;
        const yc = (stroke.points[i - 1].y * 2 + stroke.points[i].y * 2) / 2;
        ctx.quadraticCurveTo(stroke.points[i - 1].x * 2, stroke.points[i - 1].y * 2, xc, yc);
      }
      ctx.stroke();
      ctx.restore();
    });
  }, [strokes]);

  useEffect(() => {
    if (scratchpadOpen && !scratchpadMinimized && scratchpadMode === 'draw') {
      redrawCanvas();
    }
  }, [scratchpadOpen, scratchpadMinimized, scratchpadMode, redrawCanvas]);

  // Pointer drawing handlers
  const handlePointerDownCanvas = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeInkTool === 'eraser') {
      // Interactive erasing
      isDrawingRef.current = true;
      erasePointsNear(x, y);
      return;
    }

    isDrawingRef.current = true;
    currentPointsRef.current = [{ x, y }];

    // Draw starting point dot
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.save();
      ctx.fillStyle = activeInkColor;
      ctx.globalAlpha = activeInkTool === 'highlighter' ? 0.42 : 1.0;
      ctx.beginPath();
      ctx.arc(
        x * 2,
        y * 2,
        (activeInkTool === 'highlighter' ? activeInkSize * 3.5 : activeInkSize),
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.restore();
    }
  };

  const erasePointsNear = (x: number, y: number) => {
    const threshold = 14;
    setStrokes((prev) =>
      prev.filter((stroke) => {
        return !stroke.points.some((p) => {
          const dx = p.x - x;
          const dy = p.y - y;
          return Math.sqrt(dx * dx + dy * dy) < threshold;
        });
      })
    );
  };

  const handlePointerMoveCanvas = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeInkTool === 'eraser') {
      erasePointsNear(x, y);
      return;
    }

    currentPointsRef.current.push({ x, y });

    // Live preview segment
    const ctx = canvas.getContext('2d');
    const pts = currentPointsRef.current;
    if (ctx && pts.length >= 2) {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (activeInkTool === 'highlighter') {
        ctx.globalAlpha = 0.42;
        ctx.strokeStyle = activeInkColor;
        ctx.lineWidth = activeInkSize * 3.5 * 2;
      } else {
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = activeInkColor;
        ctx.lineWidth = activeInkSize * 2;
      }

      ctx.beginPath();
      const p1 = pts[pts.length - 2];
      const p2 = pts[pts.length - 1];
      ctx.moveTo(p1.x * 2, p1.y * 2);
      ctx.lineTo(p2.x * 2, p2.y * 2);
      ctx.stroke();
      ctx.restore();
    }
  };

  const handlePointerUpCanvas = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    if (activeInkTool !== 'eraser' && currentPointsRef.current.length > 0) {
      const newStroke: ScratchStroke = {
        tool: activeInkTool,
        color: activeInkColor,
        size: activeInkSize,
        points: [...currentPointsRef.current],
      };
      setStrokes((prev) => [...prev, newStroke]);
      currentPointsRef.current = [];
    }
  };

  const handleUndo = () => {
    triggerHaptic('light');
    setStrokes((prev) => prev.slice(0, prev.length - 1));
  };

  const handleClear = () => {
    triggerHaptic('medium');
    if (scratchpadMode === 'draw') {
      setStrokes([]);
      currentPointsRef.current = [];
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      redrawCanvas();
    } else {
      setScratchpadText('');
    }
    showFeedback('Temizlendi');
  };

  // Stamp Scratchpad to Current Notebook Page
  const handleStampToPage = () => {
    triggerHaptic('success');
    const activeNotebook = notebooks.find((n) => n.id === activeNotebookId);
    const currentPage = activeNotebook?.pages[activePageIndex];
    const pageWidth = currentPage?.width || 800;
    const pageHeight = currentPage?.height || 1100;

    if (scratchpadMode === 'draw') {
      if (strokes.length === 0) {
        showFeedback('Karalama tuvali boş!');
        return;
      }

      // Calculate bounding box of all strokes
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      strokes.forEach((s) => {
        s.points.forEach((p) => {
          if (p.x < minX) minX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.x > maxX) maxX = p.x;
          if (p.y > maxY) maxY = p.y;
        });
      });

      const strokeW = Math.max(30, maxX - minX);
      const strokeH = Math.max(30, maxY - minY);

      // Target center of page with slight natural offset
      const targetX = Math.round((pageWidth - strokeW) / 2);
      const targetY = Math.round((pageHeight - strokeH) / 2);

      const stampedStrokes: Stroke[] = strokes.map((s, idx) => {
        const sPoints: StrokePoint[] = s.points.map((p) => ({
          x: Math.round(p.x - minX + targetX),
          y: Math.round(p.y - minY + targetY),
          pressure: 0.6,
        }));

        let sMinX = Infinity;
        let sMinY = Infinity;
        let sMaxX = -Infinity;
        let sMaxY = -Infinity;

        sPoints.forEach((p) => {
          if (p.x < sMinX) sMinX = p.x;
          if (p.y < sMinY) sMinY = p.y;
          if (p.x > sMaxX) sMaxX = p.x;
          if (p.y > sMaxY) sMaxY = p.y;
        });

        return {
          id: `scratch-stamp-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
          tool: s.tool === 'highlighter' ? 'highlighter' : 'ballpoint',
          color: s.color,
          size: s.size,
          points: sPoints,
          bounds: {
            minX: sMinX,
            minY: sMinY,
            maxX: sMaxX,
            maxY: sMaxY,
          },
          timestamp: Date.now(),
        };
      });

      addStrokesToCurrentPage(stampedStrokes);
      showFeedback('✓ Çizim Sayfaya Aktarıldı!');
    } else {
      // Text mode -> Stamp as Sticky Note
      if (!scratchpadText.trim()) {
        showFeedback('Not metni boş!');
        return;
      }

      addStickyNoteToCurrentPage({
        id: `sticky-scratch-${Date.now()}`,
        x: Math.round(pageWidth / 2 - 120 + (Math.random() * 40 - 20)),
        y: Math.round(pageHeight / 2 - 100 + (Math.random() * 40 - 20)),
        width: 240,
        height: 180,
        color: scratchpadColor,
        text: scratchpadText.trim(),
        createdAt: Date.now(),
      });

      showFeedback('✓ Yapışkan Not Sayfaya Eklendi!');
    }
  };

  // Copy to Clipboard
  const handleCopy = async () => {
    triggerHaptic('light');
    if (scratchpadMode === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas) return;

      try {
        canvas.toBlob(async (blob) => {
          if (!blob) return;
          if (navigator.clipboard && window.ClipboardItem) {
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
            showFeedback('✓ Görsel Kopyalandı!');
          }
        });
      } catch {
        showFeedback('Panoya kopyalanamadı');
      }
    } else {
      if (!scratchpadText.trim()) {
        showFeedback('Kopyalanacak metin yok');
        return;
      }
      try {
        await navigator.clipboard.writeText(scratchpadText);
        showFeedback('✓ Metin Kopyalandı!');
      } catch {
        showFeedback('Panoya kopyalanamadı');
      }
    }
  };

  const showFeedback = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 2000);
  };

  if (!scratchpadOpen) return null;

  // Minimized Floating Bubble
  if (scratchpadMinimized) {
    return (
      <div
        style={{ left: `${position.x}px`, top: `${position.y}px` }}
        className="fixed z-50 pointer-events-auto select-none"
      >
        <button
          onClick={() => {
            triggerHaptic('medium');
            setScratchpadMinimized(false);
          }}
          className="flex items-center gap-2 bg-slate-900/95 hover:bg-slate-800 text-amber-400 hover:text-amber-300 px-3.5 py-2 rounded-full shadow-2xl border border-amber-500/40 hover:border-amber-400 transition-all hover:scale-105 group backdrop-blur-md"
          title="Hızlı Karalama Panosunu Aç (Q tuşuna basın)"
        >
          <Sparkles size={16} className="text-amber-400 group-hover:rotate-12 transition-transform" />
          <span className="text-xs font-bold text-slate-100">Hızlı Not</span>
          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full font-mono font-semibold">
            Q
          </span>
          {strokes.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </button>
      </div>
    );
  }

  return (
    <div
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      className="fixed z-50 pointer-events-auto w-[340px] flex flex-col bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden select-none animate-in fade-in zoom-in-95 duration-150"
    >
      {/* 1. Header with Drag Handle */}
      <div
        onPointerDown={handlePointerDownHeader}
        onPointerMove={handlePointerMoveHeader}
        onPointerUp={handlePointerUpHeader}
        className="h-10 px-3 bg-slate-800/80 border-b border-slate-700/70 flex items-center justify-between cursor-move text-slate-200"
      >
        <div className="flex items-center gap-2">
          <Move size={14} className="text-slate-400" />
          <span className="text-xs font-semibold tracking-wide flex items-center gap-1.5 text-white">
            <span>Hızlı Karalama</span>
            <span className="text-[10px] bg-slate-700 text-amber-400 px-1.5 py-0.5 rounded font-mono font-bold">
              Q
            </span>
          </span>
        </div>

        {/* Mode Tabs */}
        <div className="flex items-center bg-slate-900/80 p-0.5 rounded-lg border border-slate-700/60">
          <button
            onClick={() => {
              triggerHaptic('light');
              setScratchpadMode('draw');
            }}
            className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition-colors ${
              scratchpadMode === 'draw'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Serbest Çizim / Karalama Modu"
          >
            <PenTool size={12} />
            <span>Çizim</span>
          </button>
          <button
            onClick={() => {
              triggerHaptic('light');
              setScratchpadMode('text');
            }}
            className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition-colors ${
              scratchpadMode === 'text'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Hızlı Metin / Yapışkan Not Modu"
          >
            <Type size={12} />
            <span>Metin</span>
          </button>
        </div>

        {/* Window Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              triggerHaptic('light');
              setScratchpadMinimized(true);
            }}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            title="Simge Durumuna Küçült"
          >
            <Minus size={14} />
          </button>
          <button
            onClick={() => {
              triggerHaptic('light');
              toggleScratchpad();
            }}
            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-700 rounded-lg transition-colors"
            title="Kapat"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* 2. Body: Ink Canvas or Text Area */}
      <div className="relative p-2.5 flex flex-col gap-2">
        {scratchpadMode === 'draw' ? (
          <>
            {/* Ink Toolbar */}
            <div className="flex items-center justify-between bg-slate-800/60 px-2 py-1.5 rounded-xl border border-slate-700/50">
              {/* Tool selector */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setActiveInkTool('pen');
                  }}
                  className={`p-1.5 rounded-lg transition-all ${
                    activeInkTool === 'pen'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                  title="Tükenmez Kalem"
                >
                  <PenTool size={14} />
                </button>
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setActiveInkTool('highlighter');
                  }}
                  className={`p-1.5 rounded-lg transition-all ${
                    activeInkTool === 'highlighter'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                  title="Fosforlu Kalem"
                >
                  <Highlighter size={14} />
                </button>
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setActiveInkTool('eraser');
                  }}
                  className={`p-1.5 rounded-lg transition-all ${
                    activeInkTool === 'eraser'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                  title="Silgi"
                >
                  <Eraser size={14} />
                </button>
              </div>

              {/* Color swatches */}
              <div className="flex items-center gap-1.5">
                {INK_COLORS.map((col) => (
                  <button
                    key={col.hex}
                    onClick={() => {
                      triggerHaptic('light');
                      setActiveInkColor(col.hex);
                      if (activeInkTool === 'eraser') setActiveInkTool('pen');
                    }}
                    style={{ backgroundColor: col.hex }}
                    className={`w-4 h-4 rounded-full transition-transform ${
                      activeInkColor === col.hex && activeInkTool !== 'eraser'
                        ? 'ring-2 ring-white scale-125'
                        : 'hover:scale-110 opacity-80 hover:opacity-100'
                    }`}
                    title={col.name}
                  />
                ))}
              </div>

              {/* Stroke size selector */}
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                {[2, 4, 7].map((sz) => (
                  <button
                    key={sz}
                    onClick={() => {
                      triggerHaptic('light');
                      setActiveInkSize(sz);
                    }}
                    className={`w-5 h-5 rounded-md flex items-center justify-center font-bold ${
                      activeInkSize === sz
                        ? 'bg-slate-700 text-amber-300'
                        : 'text-slate-400 hover:bg-slate-700/60'
                    }`}
                    title={`${sz}px Kalınlık`}
                  >
                    {sz === 2 ? 'S' : sz === 4 ? 'M' : 'L'}
                  </button>
                ))}
              </div>
            </div>

            {/* Drawing Canvas */}
            <div className="relative w-full h-[220px] rounded-xl overflow-hidden border border-slate-700 shadow-inner bg-slate-50">
              <canvas
                ref={canvasRef}
                width={640}
                height={440}
                className="w-full h-full cursor-crosshair touch-none"
                onPointerDown={handlePointerDownCanvas}
                onPointerMove={handlePointerMoveCanvas}
                onPointerUp={handlePointerUpCanvas}
                onPointerLeave={handlePointerUpCanvas}
              />
              {strokes.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-400/60 text-xs text-center px-4">
                  <Sparkles size={24} className="mb-1 text-slate-300" />
                  <span>Hızlıca formül, çizim veya telefon karalayın...</span>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Sticky Note Color Palette */}
            <div className="flex items-center justify-between px-1 py-1">
              <span className="text-[11px] text-slate-400 font-medium">Not Teması:</span>
              <div className="flex items-center gap-1.5">
                {STICKY_COLORS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      triggerHaptic('light');
                      setScratchpadColor(c.id);
                    }}
                    className={`w-5 h-5 rounded-md border text-[10px] flex items-center justify-center font-bold transition-all ${
                      c.bg
                    } ${c.border} ${
                      scratchpadColor === c.id ? 'scale-110 ring-2 ring-white shadow-sm' : 'opacity-70 hover:opacity-100'
                    }`}
                    title={c.name}
                  >
                    {scratchpadColor === c.id && '✓'}
                  </button>
                ))}
              </div>
            </div>

            {/* Rich Note Text Area */}
            <div
              className={`w-full h-[220px] rounded-xl p-3 border shadow-inner transition-colors flex flex-col ${
                STICKY_COLORS.find((c) => c.id === scratchpadColor)?.bg || 'bg-amber-100/90 text-amber-950'
              } ${STICKY_COLORS.find((c) => c.id === scratchpadColor)?.border || 'border-amber-400'}`}
            >
              <textarea
                value={scratchpadText}
                onChange={(e) => setScratchpadText(e.target.value)}
                placeholder="Aklınıza gelen hızlı bir formül, telefon numarası veya fikri buraya not alın... 'Tuvale Damgala' ile doğrudan yapışkan nota dönüştürebilirsiniz."
                className="w-full flex-1 bg-transparent resize-none border-none outline-none text-xs leading-relaxed font-sans placeholder:text-slate-500/70"
                autoFocus
              />
              <div className="pt-2 border-t border-black/10 flex items-center justify-between text-[10px] text-slate-600/80 font-mono">
                <span>{scratchpadText.trim() ? scratchpadText.trim().split(/\s+/).length : 0} kelime</span>
                <span>{scratchpadText.length} karakter</span>
              </div>
            </div>
          </>
        )}

        {/* Temporary Action Toast */}
        {actionFeedback && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-950/90 text-amber-300 border border-amber-500/60 text-xs font-semibold px-3 py-1.5 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-1.5 animate-in fade-in zoom-in-90 z-20">
            <Check size={14} className="text-emerald-400" />
            <span>{actionFeedback}</span>
          </div>
        )}

        {/* 3. Action Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-800">
          <div className="flex items-center gap-1">
            {scratchpadMode === 'draw' && (
              <button
                onClick={handleUndo}
                disabled={strokes.length === 0}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Geri Al"
              >
                <Undo2 size={14} />
              </button>
            )}
            <button
              onClick={handleClear}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              title="Temizle"
            >
              <Trash2 size={14} />
            </button>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Panoya Kopyala"
            >
              <Copy size={14} />
            </button>
          </div>

          {/* Stamp to Page Button */}
          <button
            onClick={handleStampToPage}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-xl shadow-md shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all"
            title="Mevcut çalışma sayfasına aktar ve kalıcı kıl"
          >
            <Stamp size={14} />
            <span>Tuvale Damgala</span>
          </button>
        </div>
      </div>
    </div>
  );
};
