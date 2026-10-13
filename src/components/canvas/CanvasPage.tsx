import React, { useRef, useEffect, useState, useCallback } from 'react';
import { LassoSelection, Page, PageSticker, Stroke, StrokePoint } from '../../types/notebook';
import { useNotebookStore } from '../../store/notebookStore';
import {
  calculateStrokeBounds,
  drawStrokeOnCanvas,
  isPointNearStroke,
} from '../../engine/strokeRenderer';
import { drawPaperTemplate } from '../../engine/paperTemplates';
import {
  detectGeometricShape,
  generateArrowPoints,
  generateCirclePoints,
  generateEllipsePoints,
  generateRectanglePoints,
  generateTrianglePoints,
  interpolateLine,
} from '../../engine/shapeDetector';
import {
  computeGroupBounds,
  isStrokeCapturedByLasso,
} from '../../engine/lassoHelper';
import { TextBoxOverlay } from './TextBoxOverlay';
import {
  Move,
  RotateCw,
  Palette,
  Trash2,
  BookmarkPlus,
  X,
  Sparkles,
} from 'lucide-react';

interface CanvasPageProps {
  page: Page;
  pageIndex: number;
  scale?: number;
  isCurrent?: boolean;
}

export const CanvasPage: React.FC<CanvasPageProps> = ({
  page,
  pageIndex,
  scale = 1.0,
  isCurrent = true,
}) => {
  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const strokesCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const liveCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const {
    activeTool,
    toolSettings,
    addStrokeToCurrentPage,
    eraseStrokesOnCurrentPage,
    youtube,
    lassoSelection,
    setLassoSelection,
    moveLassoSelection,
    scaleLassoSelection,
    recolorLassoSelection,
    deleteLassoSelection,
    saveLassoSelectionAsSticker,
    laserPoints,
    addLaserPoint,
    clearLaserPoints,
    removeStickerFromCurrentPage,
    setActivePageIndex,
    audioPlaybackTimeMs,
    audioPlaying,
    setAudioPlaybackTimeMs,
    addTextAnnotation,
    updateTextAnnotation,
    deleteTextAnnotation,
  } = useNotebookStore();

  const [isDrawing, setIsDrawing] = useState(false);
  const [isDraggingLasso, setIsDraggingLasso] = useState(false);
  const [lassoDragStart, setLassoDragStart] = useState<{ x: number; y: number } | null>(null);
  const [recolorMenuOpen, setRecolorMenuOpen] = useState(false);

  const currentPointsRef = useRef<StrokePoint[]>([]);
  const lastPointRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const width = page.width || 800;
  const height = page.height || 1130;
  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;

  // 1. Draw Background Layer (Paper Template or PDF image)
  useEffect(() => {
    const canvas = bgCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.scale(dpr, dpr);

    if (page.backgroundImageUrl) {
      const img = new Image();
      img.src = page.backgroundImageUrl;
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
      };
    } else {
      drawPaperTemplate(ctx, width, height, page.template, page.paperColor);
    }

    ctx.restore();
  }, [page.template, page.paperColor, page.backgroundImageUrl, width, height, dpr]);

  // 2. Draw Committed Strokes Layer
  const redrawCommittedStrokes = useCallback(() => {
    const canvas = strokesCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);

    for (const stroke of page.strokes) {
      if (audioPlaying && stroke.audioTimestamp !== undefined) {
        if (stroke.audioTimestamp > audioPlaybackTimeMs) {
          ctx.save();
          ctx.globalAlpha = 0.15;
          drawStrokeOnCanvas(ctx, stroke);
          ctx.restore();
          continue;
        }
      }
      drawStrokeOnCanvas(ctx, stroke);
    }

    ctx.restore();
  }, [page.strokes, dpr, audioPlaying, audioPlaybackTimeMs]);

  useEffect(() => {
    redrawCommittedStrokes();
  }, [redrawCommittedStrokes]);

  // Helper for coordinates mapping
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>): { x: number; y: number } => {
    const canvas = liveCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / (rect.width / width);
    const y = (e.clientY - rect.top) / (rect.height / height);
    return { x, y };
  };

  // Dynamic pressure calculation from velocity if stylus has none
  const calculatePressure = (x: number, y: number, eventPressure: number): number => {
    if (eventPressure > 0 && eventPressure !== 0.5) {
      return eventPressure;
    }
    const now = Date.now();
    if (!lastPointRef.current) {
      lastPointRef.current = { x, y, time: now };
      return 0.5;
    }
    const dist = Math.hypot(x - lastPointRef.current.x, y - lastPointRef.current.y);
    const dt = Math.max(now - lastPointRef.current.time, 10);
    const speed = dist / dt;
    lastPointRef.current = { x, y, time: now };

    return Math.max(0.2, Math.min(0.9, 0.7 - speed * 0.15));
  };

  // Pointer Down
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activeTool === 'pan') return;
    setActivePageIndex(pageIndex);
    e.currentTarget.setPointerCapture(e.pointerId);

    const { x, y } = getCanvasCoords(e);
    const pressure = calculatePressure(x, y, e.pressure);

    // Text tool mode: click to add rich text box
    if (activeTool === 'text') {
      addTextAnnotation(pageIndex, x, y, '');
      return;
    }

    // Laser pointer mode
    if (activeTool === 'laser') {
      setIsDrawing(true);
      addLaserPoint(x, y);
      return;
    }

    // Check if user clicked inside existing lasso selection to drag it
    if (activeTool === 'lasso' && lassoSelection) {
      const b = lassoSelection.bounds;
      if (x >= b.minX - 10 && x <= b.maxX + 10 && y >= b.minY - 10 && y <= b.maxY + 10) {
        setIsDraggingLasso(true);
        setLassoDragStart({ x, y });
        return;
      }
    }

    setIsDrawing(true);
    currentPointsRef.current = [{ x, y, pressure, timestamp: Date.now() }];

    if (activeTool === 'eraser') {
      handleEraser(x, y);
      return;
    }

    const liveCanvas = liveCanvasRef.current;
    if (liveCanvas) {
      const ctx = liveCanvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, liveCanvas.width, liveCanvas.height);
    }
  };

  // Pointer Move
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);

    // Laser pointer movement
    if (activeTool === 'laser' && isDrawing) {
      addLaserPoint(x, y);
      renderLaserTrail();
      return;
    }

    // Dragging lasso selection
    if (isDraggingLasso && lassoDragStart) {
      const dx = x - lassoDragStart.x;
      const dy = y - lassoDragStart.y;
      moveLassoSelection(dx, dy);
      setLassoDragStart({ x, y });
      return;
    }

    if (!isDrawing) return;

    if (activeTool === 'eraser') {
      handleEraser(x, y);
      return;
    }

    const pressure = calculatePressure(x, y, e.pressure);
    currentPointsRef.current.push({ x, y, pressure, timestamp: Date.now() });

    const liveCanvas = liveCanvasRef.current;
    if (!liveCanvas) return;
    const ctx = liveCanvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, liveCanvas.width, liveCanvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);

    if (activeTool === 'lasso') {
      // Draw dashed lasso loop
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      const pts = currentPointsRef.current;
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.stroke();
    } else if (activeTool === 'shape') {
      renderShapePreview(ctx, currentPointsRef.current);
    } else {
      drawStrokeOnCanvas(ctx, {
        tool: activeTool as any,
        color: toolSettings.color,
        size: toolSettings.size,
        points: currentPointsRef.current,
      });
    }

    ctx.restore();
  };

  // Laser Trail Renderer
  const renderLaserTrail = () => {
    const liveCanvas = liveCanvasRef.current;
    if (!liveCanvas) return;
    const ctx = liveCanvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, liveCanvas.width, liveCanvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);

    const now = Date.now();
    const valid = laserPoints.filter((p) => now - p.time < 1200);

    for (let i = 0; i < valid.length; i++) {
      const pt = valid[i];
      const age = now - pt.time;
      const alpha = Math.max(0, 1 - age / 1200);

      ctx.beginPath();
      ctx.arc(pt.x, pt.y, (1 - age / 1200) * 8 + 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(239, 68, 68, ${alpha})`;
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 12;
      ctx.fill();
    }

    ctx.restore();
  };

  // Shape Preview Helper
  const renderShapePreview = (ctx: CanvasRenderingContext2D, points: StrokePoint[]) => {
    if (points.length < 2) return;
    const start = points[0];
    const end = points[points.length - 1];

    let shapePoints: StrokePoint[] = [];
    switch (toolSettings.selectedShape) {
      case 'line':
        shapePoints = interpolateLine(start, end);
        break;
      case 'arrow':
        shapePoints = generateArrowPoints(start, end);
        break;
      case 'rectangle':
        shapePoints = generateRectanglePoints(
          Math.min(start.x, end.x),
          Math.min(start.y, end.y),
          Math.max(start.x, end.x),
          Math.max(start.y, end.y)
        );
        break;
      case 'circle': {
        const rx = Math.abs(end.x - start.x) / 2;
        const ry = Math.abs(end.y - start.y) / 2;
        shapePoints = generateEllipsePoints((start.x + end.x) / 2, (start.y + end.y) / 2, rx, ry);
        break;
      }
      case 'triangle':
        shapePoints = generateTrianglePoints(
          Math.min(start.x, end.x),
          Math.min(start.y, end.y),
          Math.max(start.x, end.x),
          Math.max(start.y, end.y)
        );
        break;
    }

    drawStrokeOnCanvas(ctx, {
      tool: 'ballpoint',
      color: toolSettings.color,
      size: toolSettings.size,
      points: shapePoints,
    });
  };

  // Pointer Up
  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDraggingLasso) {
      setIsDraggingLasso(false);
      setLassoDragStart(null);
      return;
    }

    if (!isDrawing) return;
    setIsDrawing(false);
    lastPointRef.current = null;

    const liveCanvas = liveCanvasRef.current;
    if (liveCanvas) {
      const ctx = liveCanvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, liveCanvas.width, liveCanvas.height);
    }

    if (activeTool === 'laser') {
      setTimeout(() => clearLaserPoints(), 1200);
      return;
    }

    if (activeTool === 'eraser' || currentPointsRef.current.length === 0) {
      currentPointsRef.current = [];
      return;
    }

    // Handle Lasso Completion
    if (activeTool === 'lasso') {
      const polygon = currentPointsRef.current;
      if (polygon.length >= 4) {
        const capturedStrokes = page.strokes.filter((s) =>
          isStrokeCapturedByLasso(s, polygon)
        );

        if (capturedStrokes.length > 0) {
          const bounds = computeGroupBounds(capturedStrokes);
          setLassoSelection({
            pageId: page.id,
            strokeIds: capturedStrokes.map((s) => s.id),
            bounds,
            originalStrokes: capturedStrokes,
            offsetX: 0,
            offsetY: 0,
            scaleX: 1,
            scaleY: 1,
            rotation: 0,
          });
        } else {
          setLassoSelection(null);
        }
      }
      currentPointsRef.current = [];
      return;
    }

    let finalPoints = [...currentPointsRef.current];

    // Explicit shape mode vs auto-detection
    if (activeTool === 'shape') {
      const start = finalPoints[0];
      const end = finalPoints[finalPoints.length - 1];
      switch (toolSettings.selectedShape) {
        case 'line':
          finalPoints = interpolateLine(start, end);
          break;
        case 'arrow':
          finalPoints = generateArrowPoints(start, end);
          break;
        case 'rectangle':
          finalPoints = generateRectanglePoints(
            Math.min(start.x, end.x),
            Math.min(start.y, end.y),
            Math.max(start.x, end.x),
            Math.max(start.y, end.y)
          );
          break;
        case 'circle': {
          const rx = Math.abs(end.x - start.x) / 2;
          const ry = Math.abs(end.y - start.y) / 2;
          finalPoints = generateEllipsePoints((start.x + end.x) / 2, (start.y + end.y) / 2, rx, ry);
          break;
        }
        case 'triangle':
          finalPoints = generateTrianglePoints(
            Math.min(start.x, end.x),
            Math.min(start.y, end.y),
            Math.max(start.x, end.x),
            Math.max(start.y, end.y)
          );
          break;
      }
    } else if (toolSettings.autoDetectShape) {
      const detected = detectGeometricShape(finalPoints);
      if (detected) {
        finalPoints = detected.replacementPoints;
      }
    }

    const strokeId = `st_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const bounds = calculateStrokeBounds(finalPoints, toolSettings.size);

    const newStroke: Stroke = {
      id: strokeId,
      tool: (activeTool === 'shape' ? 'ballpoint' : activeTool) as any,
      color: toolSettings.color,
      size: toolSettings.size,
      points: finalPoints,
      bounds,
      timestamp: Date.now(),
      videoTimestamp: youtube.isOpen ? Math.floor(youtube.currentTime) : undefined,
    };

    addStrokeToCurrentPage(newStroke);
    currentPointsRef.current = [];
  };

  // Eraser handler with highlighter-only filtering
  const handleEraser = (x: number, y: number) => {
    const threshold = toolSettings.eraserSize;
    const hitIds: string[] = [];

    for (const stroke of page.strokes) {
      if (isPointNearStroke({ x, y }, stroke, threshold)) {
        hitIds.push(stroke.id);
      }
    }

    if (hitIds.length > 0) {
      eraseStrokesOnCurrentPage(hitIds);
    }
  };

  const isLassoOnThisPage = lassoSelection && lassoSelection.pageId === page.id;

  return (
    <div
      className={`relative mx-auto my-6 shadow-2xl rounded-sm transition-all duration-100 ease-out select-none bg-white overflow-hidden ring-1 ring-slate-800/10 ${
        isCurrent ? 'ring-2 ring-indigo-500/40' : ''
      }`}
      style={{
        width: `${width * scale}px`,
        height: `${height * scale}px`,
      }}
    >
      {/* Page Number Indicator */}
      <div className="absolute top-2 right-3 text-[10px] font-mono text-slate-400 select-none pointer-events-none z-10 bg-white/70 px-1.5 py-0.5 rounded shadow-sm">
        #{pageIndex + 1}
      </div>

      {/* Layer 0: Paper Background */}
      <canvas
        ref={bgCanvasRef}
        width={width * dpr}
        height={height * dpr}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Layer 0.5: Stickers */}
      {page.stickers &&
        page.stickers.map((stk) => (
          <div
            key={stk.id}
            className="absolute z-10 group cursor-move hover:ring-2 hover:ring-indigo-400/50 rounded"
            style={{
              left: `${stk.x * scale}px`,
              top: `${stk.y * scale}px`,
              width: `${stk.width * scale}px`,
              height: `${stk.height * scale}px`,
            }}
          >
            <div
              className="w-full h-full"
              dangerouslySetInnerHTML={{ __html: stk.content }}
            />
            <button
              onClick={() => removeStickerFromCurrentPage(stk.id)}
              className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 shadow transition-opacity"
              title="Sticker'ı Kaldır"
            >
              <X size={12} />
            </button>
          </div>
        ))}

      {/* Layer 0.6: Text Annotations */}
      {page.texts &&
        page.texts.map((txt) => (
          <TextBoxOverlay
            key={txt.id}
            annotation={txt}
            scale={scale}
            onUpdate={(partial) => updateTextAnnotation(pageIndex, txt.id, partial)}
            onDelete={() => deleteTextAnnotation(pageIndex, txt.id)}
          />
        ))}

      {/* Layer 1: Committed Strokes */}
      <canvas
        ref={strokesCanvasRef}
        width={width * dpr}
        height={height * dpr}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Layer 2: Live In-Progress Drawing Layer */}
      <canvas
        ref={liveCanvasRef}
        width={width * dpr}
        height={height * dpr}
        className="absolute inset-0 w-full h-full cursor-crosshair touch-none z-10"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />

      {/* Layer 3: Lasso Active Transform Box & Popup Menu */}
      {isLassoOnThisPage && lassoSelection && (
        <div
          className="absolute z-20 pointer-events-auto border-2 border-dashed border-indigo-500 bg-indigo-500/5 rounded"
          style={{
            left: `${lassoSelection.bounds.minX * scale}px`,
            top: `${lassoSelection.bounds.minY * scale}px`,
            width: `${(lassoSelection.bounds.maxX - lassoSelection.bounds.minX) * scale}px`,
            height: `${(lassoSelection.bounds.maxY - lassoSelection.bounds.minY) * scale}px`,
          }}
        >
          {/* Floating Action Menu above Lasso selection */}
          <div className="absolute -top-11 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-750 shadow-2xl rounded-xl p-1 flex items-center gap-1 text-slate-200 z-30 animate-in fade-in zoom-in-95">
            <button
              onClick={() => setRecolorMenuOpen(!recolorMenuOpen)}
              className="p-1.5 hover:bg-slate-800 text-indigo-400 rounded-lg transition-colors"
              title="Seçimin Rengini Değiştir"
            >
              <Palette size={14} />
            </button>

            <button
              onClick={() => scaleLassoSelection(1.15)}
              className="px-2 py-1 text-[11px] font-bold hover:bg-slate-800 text-slate-300 rounded-lg"
              title="Büyüt (+15%)"
            >
              +
            </button>
            <button
              onClick={() => scaleLassoSelection(0.85)}
              className="px-2 py-1 text-[11px] font-bold hover:bg-slate-800 text-slate-300 rounded-lg"
              title="Küçült (-15%)"
            >
              -
            </button>

            <button
              onClick={() => saveLassoSelectionAsSticker('Özel Çizim')}
              className="p-1.5 hover:bg-slate-800 text-amber-400 rounded-lg transition-colors"
              title="Çıkartma Olarak Kaydet (Add to Elements)"
            >
              <BookmarkPlus size={14} />
            </button>

            <div className="w-px h-4 bg-slate-750" />

            <button
              onClick={deleteLassoSelection}
              className="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors"
              title="Seçimi Sil"
            >
              <Trash2 size={14} />
            </button>

            <button
              onClick={() => setLassoSelection(null)}
              className="p-1 hover:bg-slate-800 text-slate-400 rounded-lg"
              title="Kapat"
            >
              <X size={12} />
            </button>
          </div>

          {/* Quick Recolor Palette Dropdown */}
          {recolorMenuOpen && (
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 p-2 rounded-xl flex gap-1.5 shadow-2xl z-40">
              {['#0f172a', '#1e40af', '#b91c1c', '#047857', '#6d28d9', '#facc15'].map(
                (c) => (
                  <button
                    key={c}
                    onClick={() => {
                      recolorLassoSelection(c);
                      setRecolorMenuOpen(false);
                    }}
                    className="w-5 h-5 rounded-full ring-1 ring-white/30 hover:scale-110 transition-transform"
                    style={{ backgroundColor: c }}
                  />
                )
              )}
            </div>
          )}

          {/* Transform resize indicator pins */}
          <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-full" />
          <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-full" />
          <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-full" />
          <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-full" />
        </div>
      )}
    </div>
  );
};
