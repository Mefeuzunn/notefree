import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useNotebookStore } from '../../store/notebookStore';
import { drawStrokeOnCanvas } from '../../engine/strokeRenderer';
import { drawPaperTemplate } from '../../engine/paperTemplates';
import { StrokePoint, Stroke } from '../../types/notebook';
import {
  ChevronLeft,
  ChevronRight,
  CornerDownLeft,
  Maximize2,
  X,
  Sparkles,
  Move,
} from 'lucide-react';

export const ZoomWindow: React.FC = () => {
  const {
    zoomWindowOpen,
    toggleZoomWindow,
    zoomWindowPos,
    setZoomWindowPos,
    zoomBoxWidth,
    zoomBoxHeight,
    advanceZoomWindow,
    rewindZoomWindow,
    newLineZoomWindow,
    activeNotebookId,
    notebooks,
    activePageIndex,
    activeTool,
    toolSettings,
    addStrokeToCurrentPage,
  } = useNotebookStore();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const liveCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const currentPointsRef = useRef<StrokePoint[]>([]);

  const activeNotebook = notebooks.find((n) => n.id === activeNotebookId);
  const currentPage = activeNotebook?.pages[activePageIndex];

  const MAGNIFICATION = 2.4;
  const windowWidth = 680;
  const windowHeight = 220;

  // Redraw zoom background and existing strokes
  const renderZoomContent = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !currentPage) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.scale(dpr, dpr);

    // Fill background
    const paperColorHex =
      currentPage.paperColor === 'dark'
        ? '#181b26'
        : currentPage.paperColor === 'cream'
        ? '#fcfaf2'
        : currentPage.paperColor === 'yellow-pad'
        ? '#fefce8'
        : currentPage.paperColor === 'kraft'
        ? '#e7d8be'
        : '#ffffff';

    ctx.fillStyle = paperColorHex;
    ctx.fillRect(0, 0, windowWidth, windowHeight);

    // Apply translation & zoom scale based on focus box
    ctx.save();
    ctx.scale(MAGNIFICATION, MAGNIFICATION);
    ctx.translate(-zoomWindowPos.x, -zoomWindowPos.y);

    // Draw page paper template
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

    // Draw strokes that overlap the zoom box
    for (const stroke of currentPage.strokes) {
      drawStrokeOnCanvas(ctx, stroke);
    }

    ctx.restore();

    // Draw auto-advance jump boundary line at right 22%
    const jumpBoundaryX = windowWidth * 0.78;
    ctx.fillStyle = 'rgba(99, 102, 241, 0.05)';
    ctx.fillRect(jumpBoundaryX, 0, windowWidth - jumpBoundaryX, windowHeight);

    ctx.strokeStyle = 'rgba(99, 102, 241, 0.35)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(jumpBoundaryX, 0);
    ctx.lineTo(jumpBoundaryX, windowHeight);
    ctx.stroke();

    ctx.restore();
  }, [currentPage, zoomWindowPos, windowWidth, windowHeight]);

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

    const pageX = zoomWindowPos.x + localX / MAGNIFICATION;
    const pageY = zoomWindowPos.y + localY / MAGNIFICATION;
    return { x: pageX, y: pageY };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDrawing(true);
    const { x, y } = getPageCoords(e);
    const pressure = e.pressure > 0 && e.pressure !== 0.5 ? e.pressure : 0.6;
    currentPointsRef.current = [{ x, y, pressure, timestamp: Date.now() }];

    const liveCanvas = liveCanvasRef.current;
    if (liveCanvas) {
      const ctx = liveCanvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, liveCanvas.width, liveCanvas.height);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const { x, y } = getPageCoords(e);
    const pressure = e.pressure > 0 && e.pressure !== 0.5 ? e.pressure : 0.6;
    currentPointsRef.current.push({ x, y, pressure, timestamp: Date.now() });

    const liveCanvas = liveCanvasRef.current;
    if (!liveCanvas) return;
    const ctx = liveCanvas.getContext('2d');
    if (!ctx) return;

    const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
    ctx.clearRect(0, 0, liveCanvas.width, liveCanvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);

    ctx.scale(MAGNIFICATION, MAGNIFICATION);
    ctx.translate(-zoomWindowPos.x, -zoomWindowPos.y);

    drawStrokeOnCanvas(ctx, {
      tool: (['ballpoint', 'fountain', 'brush', 'highlighter'].includes(activeTool)
        ? activeTool
        : 'ballpoint') as any,
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

    if (currentPointsRef.current.length < 2) {
      currentPointsRef.current = [];
      return;
    }

    const minX = Math.min(...currentPointsRef.current.map((p) => p.x));
    const maxX = Math.max(...currentPointsRef.current.map((p) => p.x));
    const minY = Math.min(...currentPointsRef.current.map((p) => p.y));
    const maxY = Math.max(...currentPointsRef.current.map((p) => p.y));

    const newStroke: Stroke = {
      id: `stroke_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      tool: (['ballpoint', 'fountain', 'brush', 'highlighter'].includes(activeTool)
        ? activeTool
        : 'ballpoint') as any,
      color: toolSettings.color,
      size: toolSettings.size,
      points: [...currentPointsRef.current],
      bounds: { minX, minY, maxX, maxY },
      timestamp: Date.now(),
    };

    addStrokeToCurrentPage(newStroke);

    // Check if stroke was made in the auto-advance margin (right 22%)
    const lastPt = currentPointsRef.current[currentPointsRef.current.length - 1];
    const localLastX = (lastPt.x - zoomWindowPos.x) * MAGNIFICATION;
    if (localLastX > windowWidth * 0.76) {
      advanceZoomWindow();
    }

    currentPointsRef.current = [];
  };

  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-xl border border-indigo-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col w-[700px] max-w-[95vw] animate-in slide-in-from-bottom duration-200">
      {/* Zoom Window Header Controls */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-850/80 border-b border-slate-800 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="font-semibold text-indigo-400">Büyüteç Yazım Penceresi</span>
          <span className="text-[11px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full font-mono">
            2.4x Yakınlaştırma
          </span>
        </div>

        {/* Jump Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={rewindZoomWindow}
            className="p-1.5 rounded-lg hover:bg-slate-700/60 text-slate-300 hover:text-white transition-colors"
            title="Geri Kaydır"
          >
            <ChevronLeft size={16} />
          </button>

          <button
            onClick={advanceZoomWindow}
            className="p-1.5 rounded-lg hover:bg-slate-700/60 text-slate-300 hover:text-white transition-colors"
            title="İleri Kaydır"
          >
            <ChevronRight size={16} />
          </button>

          <button
            onClick={newLineZoomWindow}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 font-medium transition-colors"
            title="Yeni Satıra Geç"
          >
            <CornerDownLeft size={13} />
            <span className="text-[11px]">Yeni Satır</span>
          </button>

          <div className="h-4 w-px bg-slate-700 mx-1" />

          <button
            onClick={toggleZoomWindow}
            className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            title="Büyüteci Kapat"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Interactive Writing Area */}
      <div className="relative w-full h-[220px] bg-white cursor-crosshair overflow-hidden touch-none">
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

        {/* Helper Badge */}
        <div className="absolute bottom-2 right-3 pointer-events-none text-[10px] text-indigo-600/70 font-medium bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded shadow-sm border border-indigo-200">
          Mavi alana yazınca otomatik ilerler →
        </div>
      </div>
    </div>
  );
};
