import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useNotebookStore } from '../../store/notebookStore';
import { drawStrokeOnCanvas, isPointNearStroke } from '../../engine/strokeRenderer';
import { drawPaperTemplate } from '../../engine/paperTemplates';
import { StrokePoint, Stroke } from '../../types/notebook';
import {
  ChevronLeft,
  ChevronRight,
  CornerDownLeft,
  X,
  Sparkles,
  Move,
  Eraser,
  PenTool,
} from 'lucide-react';
import { triggerHaptic } from '../../engine/hapticFeedback';

export const ZoomWindow: React.FC = () => {
  const {
    zoomWindowOpen,
    toggleZoomWindow,
    zoomWindowPos,
    setZoomWindowPos,
    zoomBoxWidth,
    zoomBoxHeight,
    zoomScale,
    setZoomScale,
    advanceZoomWindow,
    rewindZoomWindow,
    newLineZoomWindow,
    activeNotebookId,
    notebooks,
    activePageIndex,
    activeTool,
    toolSettings,
    selectFavoriteColor,
    selectFavoriteSize,
    addStrokeToCurrentPage,
    eraseStrokesOnCurrentPage,
  } = useNotebookStore();

  const [showWristRest, setShowWristRest] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const liveCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const currentPointsRef = useRef<StrokePoint[]>([]);
  const bgImgRef = useRef<HTMLImageElement | null>(null);

  const activeNotebook = notebooks.find((n) => n.id === activeNotebookId);
  const currentPage = activeNotebook?.pages[activePageIndex];

  const scaleFactor = zoomScale || 2.4;
  const windowWidth = 720;
  const windowHeight = 230;

  // Pre-load background image if present
  useEffect(() => {
    if (currentPage?.backgroundImageUrl) {
      const img = new Image();
      img.src = currentPage.backgroundImageUrl;
      img.onload = () => {
        bgImgRef.current = img;
        renderZoomContent();
      };
    } else {
      bgImgRef.current = null;
    }
  }, [currentPage?.backgroundImageUrl]);

  // Redraw zoom background, template and existing strokes
  const renderZoomContent = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !currentPage) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.scale(dpr, dpr);

    // Paper color background fill
    const paperColorHex =
      currentPage.paperColor === 'dark'
        ? '#141923'
        : currentPage.paperColor === 'cream'
        ? '#faf7ee'
        : currentPage.paperColor === 'yellow-pad'
        ? '#fefce8'
        : currentPage.paperColor === 'sage'
        ? '#f2f5f0'
        : currentPage.paperColor === 'kraft'
        ? '#e7d8be'
        : '#ffffff';

    ctx.fillStyle = paperColorHex;
    ctx.fillRect(0, 0, windowWidth, windowHeight);

    // Magnification & translation
    ctx.save();
    ctx.scale(scaleFactor, scaleFactor);
    ctx.translate(-zoomWindowPos.x, -zoomWindowPos.y);

    // Draw background image if page has imported PDF/image
    if (bgImgRef.current) {
      ctx.drawImage(bgImgRef.current, 0, 0, currentPage.width, currentPage.height);
    } else {
      // Draw standard paper template
      drawPaperTemplate(
        ctx,
        currentPage.width,
        currentPage.height,
        currentPage.template,
        currentPage.paperColor,
        currentPage.customPitch,
        currentPage.customLineColor,
        currentPage.lineOpacity
      );
    }

    // Draw existing strokes inside the focus area
    for (const stroke of currentPage.strokes) {
      drawStrokeOnCanvas(ctx, stroke);
    }

    ctx.restore();

    // Auto-advance shaded strip at right 22%
    const jumpBoundaryX = windowWidth * 0.78;
    ctx.fillStyle = 'rgba(99, 102, 241, 0.08)';
    ctx.fillRect(jumpBoundaryX, 0, windowWidth - jumpBoundaryX, windowHeight);

    ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(jumpBoundaryX, 0);
    ctx.lineTo(jumpBoundaryX, windowHeight);
    ctx.stroke();

    ctx.restore();
  }, [currentPage, zoomWindowPos, windowWidth, windowHeight, scaleFactor]);

  useEffect(() => {
    if (zoomWindowOpen) {
      renderZoomContent();
    }
  }, [zoomWindowOpen, renderZoomContent, currentPage?.strokes]);

  if (!zoomWindowOpen || !currentPage) return null;

  // Coordinate mapping from Zoom Window to Main Page coordinates
  const getPageCoords = (e: React.PointerEvent<HTMLCanvasElement>): { x: number; y: number } => {
    const canvas = liveCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const localX = (e.clientX - rect.left) / (rect.width / windowWidth);
    const localY = (e.clientY - rect.top) / (rect.height / windowHeight);

    const pageX = zoomWindowPos.x + localX / scaleFactor;
    const pageY = zoomWindowPos.y + localY / scaleFactor;
    return { x: pageX, y: pageY };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDrawing(true);
    const { x, y } = getPageCoords(e);

    // Eraser mode inside zoom window
    if (activeTool === 'eraser') {
      const strokesToErase = currentPage.strokes.filter((s) => isPointNearStroke({ x, y }, s, 22));
      if (strokesToErase.length > 0) {
        triggerHaptic('light');
        eraseStrokesOnCurrentPage(strokesToErase.map((s) => s.id));
      }
      return;
    }

    const pressure = e.pressure > 0 && e.pressure !== 0.5 ? e.pressure : 0.6;
    currentPointsRef.current = [
      {
        x,
        y,
        pressure,
        timestamp: Date.now(),
        tiltX: e.tiltX,
        tiltY: e.tiltY,
      },
    ];

    const liveCanvas = liveCanvasRef.current;
    if (liveCanvas) {
      const ctx = liveCanvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, liveCanvas.width, liveCanvas.height);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const { x, y } = getPageCoords(e);

    // Eraser mode move
    if (activeTool === 'eraser') {
      const strokesToErase = currentPage.strokes.filter((s) => isPointNearStroke({ x, y }, s, 22));
      if (strokesToErase.length > 0) {
        triggerHaptic('light');
        eraseStrokesOnCurrentPage(strokesToErase.map((s) => s.id));
      }
      return;
    }

    const pressure = e.pressure > 0 && e.pressure !== 0.5 ? e.pressure : 0.6;
    currentPointsRef.current.push({
      x,
      y,
      pressure,
      timestamp: Date.now(),
      tiltX: e.tiltX,
      tiltY: e.tiltY,
    });

    const liveCanvas = liveCanvasRef.current;
    if (!liveCanvas) return;
    const ctx = liveCanvas.getContext('2d');
    if (!ctx) return;

    const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
    ctx.clearRect(0, 0, liveCanvas.width, liveCanvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);

    ctx.scale(scaleFactor, scaleFactor);
    ctx.translate(-zoomWindowPos.x, -zoomWindowPos.y);

    const effectiveTool = ['pen', 'ballpoint', 'fountain', 'brush', 'pencil', 'fineliner', 'highlighter'].includes(activeTool)
      ? activeTool
      : 'ballpoint';

    drawStrokeOnCanvas(ctx, {
      tool: effectiveTool as any,
      color: toolSettings.color,
      size: toolSettings.size,
      points: currentPointsRef.current,
    });

    ctx.restore();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const liveCanvas = liveCanvasRef.current;
    if (liveCanvas) {
      const ctx = liveCanvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, liveCanvas.width, liveCanvas.height);
    }

    if (activeTool === 'eraser' || currentPointsRef.current.length < 2) {
      currentPointsRef.current = [];
      return;
    }

    const minX = Math.min(...currentPointsRef.current.map((p) => p.x));
    const maxX = Math.max(...currentPointsRef.current.map((p) => p.x));
    const minY = Math.min(...currentPointsRef.current.map((p) => p.y));
    const maxY = Math.max(...currentPointsRef.current.map((p) => p.y));

    const effectiveTool = ['pen', 'ballpoint', 'fountain', 'brush', 'pencil', 'fineliner', 'highlighter'].includes(activeTool)
      ? activeTool
      : 'ballpoint';

    const newStroke: Stroke = {
      id: `stroke_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      tool: effectiveTool as any,
      color: toolSettings.color,
      size: toolSettings.size,
      points: [...currentPointsRef.current],
      bounds: { minX, minY, maxX, maxY },
      timestamp: Date.now(),
    };

    addStrokeToCurrentPage(newStroke);

    // ⏩ Check if stroke ended in the auto-advance margin (right 22%)
    const lastPt = currentPointsRef.current[currentPointsRef.current.length - 1];
    const localLastX = (lastPt.x - zoomWindowPos.x) * scaleFactor;
    if (localLastX > windowWidth * 0.76) {
      triggerHaptic('light');
      advanceZoomWindow();
    }

    currentPointsRef.current = [];
  };

  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-xl border border-indigo-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col w-[720px] max-w-[95vw] animate-in slide-in-from-bottom duration-200 ring-1 ring-black/40">
      {/* Zoom Window Header Controls */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-slate-850/80 border-b border-slate-800 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="font-semibold text-indigo-400">Büyüteç Yazım Penceresi</span>

          {/* Magnification Switcher */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 ml-1">
            {[2.0, 2.4, 3.0].map((scale) => (
              <button
                key={scale}
                onClick={() => {
                  triggerHaptic('light');
                  setZoomScale(scale);
                }}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium transition-colors ${
                  scaleFactor === scale
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {scale}x
              </button>
            ))}
          </div>

          {/* Quick Favorite Colors in Zoom Header */}
          <div className="hidden sm:flex items-center gap-1.5 ml-2 pl-2 border-l border-slate-700/60">
            {toolSettings.favoriteColors.slice(0, 3).map((col, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  selectFavoriteColor(idx);
                }}
                className={`w-4 h-4 rounded-full transition-transform ${
                  toolSettings.color === col ? 'ring-2 ring-white scale-110' : 'opacity-80 hover:opacity-100 ring-1 ring-white/20'
                }`}
                style={{ backgroundColor: col }}
              />
            ))}
          </div>

          {/* Quick Sizes in Zoom Header */}
          <div className="hidden sm:flex items-center gap-1 ml-1.5">
            {toolSettings.favoriteSizes.slice(0, 3).map((sz, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  selectFavoriteSize(idx);
                }}
                className={`w-5 h-5 rounded font-mono text-[9px] font-semibold flex items-center justify-center transition-colors ${
                  toolSettings.size === sz
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {sz}
              </button>
            ))}
          </div>
        </div>

        {/* Jump Controls */}
        <div className="flex items-center gap-1.5">
          {/* Wrist Rest Toggle */}
          <button
            type="button"
            onClick={() => setShowWristRest(!showWristRest)}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border transition-colors ${
              showWristRest
                ? 'bg-emerald-600/30 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-800/80 border-slate-700/60 text-slate-400 hover:text-white'
            }`}
            title="Bilek Dinlendirme Pedini Aç/Kapat"
          >
            Bilek Pedi
          </button>
          <button
            onClick={() => {
              triggerHaptic('light');
              rewindZoomWindow();
            }}
            className="p-1.5 rounded-lg hover:bg-slate-700/60 text-slate-300 hover:text-white transition-colors"
            title="Geri Kaydır"
          >
            <ChevronLeft size={16} />
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              advanceZoomWindow();
            }}
            className="p-1.5 rounded-lg hover:bg-slate-700/60 text-slate-300 hover:text-white transition-colors"
            title="İleri Kaydır"
          >
            <ChevronRight size={16} />
          </button>

          <button
            onClick={() => {
              triggerHaptic('medium');
              newLineZoomWindow();
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 font-medium transition-colors"
            title="Yeni Satıra Geç"
          >
            <CornerDownLeft size={13} />
            <span className="text-[11px]">Yeni Satır</span>
          </button>

          <div className="h-4 w-px bg-slate-700 mx-1" />

          <button
            onClick={() => {
              triggerHaptic('light');
              toggleZoomWindow();
            }}
            className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            title="Büyüteci Kapat"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Interactive Writing Area */}
      <div className="relative w-full h-[230px] bg-white cursor-crosshair overflow-hidden touch-none select-none">
        <canvas
          ref={canvasRef}
          width={windowWidth * dpr}
          height={windowHeight * dpr}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />
        <canvas
          ref={liveCanvasRef}
          width={windowWidth * dpr}
          height={windowHeight * dpr}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="absolute inset-0 w-full h-full"
        />

        {/* Auto-Advance Helper Notice */}
        <div className="absolute bottom-2 right-3 pointer-events-none text-[10px] text-indigo-600/80 font-medium bg-white/85 backdrop-blur-sm px-2 py-0.5 rounded shadow-sm border border-indigo-200 flex items-center gap-1">
          <Sparkles size={11} className="text-amber-500" />
          <span>Mavi şeride yazınca otomatik ilerler →</span>
        </div>
      </div>

      {/* 🛡️ Ergonomic Wrist Rest Guard (Bilek Dinlendirme Alanı) */}
      {showWristRest && (
        <div className="h-12 w-full bg-slate-950/95 border-t border-slate-800 flex items-center justify-between px-4 text-[10px] text-slate-400 select-none touch-none animate-in fade-in slide-in-from-top-1">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Bilek Dinlendirme Alanı (Avuç İçi Korumalı)
          </span>
          <span className="text-slate-500 font-mono hidden sm:inline">
            Elini bu alana serbestçe yaslayarak yazabilirsin
          </span>
        </div>
      )}
    </div>
  );
};
