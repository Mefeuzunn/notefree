import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useNotebookStore } from '../../store/notebookStore';
import { triggerHaptic } from '../../engine/hapticFeedback';
import {
  Compass,
  Maximize2,
  Minimize2,
  Move,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
  MapPin,
  Sparkles,
} from 'lucide-react';

interface MinimapProps {
  containerRef?: React.RefObject<HTMLDivElement | null>;
  viewportWidth?: number;
  viewportHeight?: number;
}

export const Minimap: React.FC<MinimapProps> = ({
  containerRef,
  viewportWidth = 800,
  viewportHeight = 600,
}) => {
  const {
    minimapVisible,
    toggleMinimap,
    canvasMode,
    zoom,
    setZoom,
    resetView,
    infinitePan,
    setInfinitePan,
    resetInfinitePan,
    activeNotebookId,
    notebooks,
    activePageIndex,
  } = useNotebookStore();

  const [minimized, setMinimized] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number }>(() => ({
    x: 24,
    y: Math.max(80, window.innerHeight - 260),
  }));

  const [isDraggingWindow, setIsDraggingWindow] = useState(false);
  const dragWindowStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number }>({
    mouseX: 0,
    mouseY: 0,
    startX: 0,
    startY: 0,
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isPanningRef = useRef(false);

  const MAP_WIDTH = 190;
  const MAP_HEIGHT = 135;

  const currentNotebook = notebooks.find((n) => n.id === activeNotebookId);
  const currentPage = currentNotebook?.pages[activePageIndex];
  const strokes = currentPage?.strokes || [];
  const stickyNotes = currentPage?.stickyNotes || [];
  const texts = currentPage?.texts || [];

  // Page dimensions (for paged mode)
  const pageWidth = currentPage?.width || 800;
  const pageHeight = currentPage?.height || 1100;

  // Track container scroll position for Paged Mode
  const [scrollState, setScrollState] = useState<{
    scrollTop: number;
    scrollLeft: number;
    clientWidth: number;
    clientHeight: number;
  }>({
    scrollTop: 0,
    scrollLeft: 0,
    clientWidth: viewportWidth,
    clientHeight: viewportHeight,
  });

  useEffect(() => {
    const el = containerRef?.current;
    if (!el) return;

    const updateScroll = () => {
      setScrollState({
        scrollTop: el.scrollTop,
        scrollLeft: el.scrollLeft,
        clientWidth: el.clientWidth,
        clientHeight: el.clientHeight,
      });
    };

    updateScroll();
    el.addEventListener('scroll', updateScroll, { passive: true });
    window.addEventListener('resize', updateScroll);

    return () => {
      el.removeEventListener('scroll', updateScroll);
      window.removeEventListener('resize', updateScroll);
    };
  }, [containerRef]);

  // Keep inside window bounds on resize
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => ({
        x: Math.min(prev.x, Math.max(10, window.innerWidth - 240)),
        y: Math.min(prev.y, Math.max(60, window.innerHeight - 200)),
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Window drag handlers
  const handlePointerDownHeader = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;

    setIsDraggingWindow(true);
    dragWindowStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: position.x,
      startY: position.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMoveHeader = (e: React.PointerEvent) => {
    if (!isDraggingWindow) return;
    const dx = e.clientX - dragWindowStartRef.current.mouseX;
    const dy = e.clientY - dragWindowStartRef.current.mouseY;

    const newX = Math.max(10, Math.min(window.innerWidth - 220, dragWindowStartRef.current.startX + dx));
    const newY = Math.max(40, Math.min(window.innerHeight - 80, dragWindowStartRef.current.startY + dy));

    setPosition({ x: newX, y: newY });
  };

  const handlePointerUpHeader = (e: React.PointerEvent) => {
    if (isDraggingWindow) {
      setIsDraggingWindow(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Ignore if pointer capture lost
      }
    }
  };

  // Bounds for Infinite Canvas mode
  const getInfiniteBounds = useCallback(() => {
    if (strokes.length === 0) {
      return { minX: 0, minY: 0, maxX: 1600, maxY: 1200 };
    }
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const s of strokes) {
      if (s.bounds) {
        if (s.bounds.minX < minX) minX = s.bounds.minX;
        if (s.bounds.minY < minY) minY = s.bounds.minY;
        if (s.bounds.maxX > maxX) maxX = s.bounds.maxX;
        if (s.bounds.maxY > maxY) maxY = s.bounds.maxY;
      }
    }
    const pad = 140;
    return {
      minX: Math.min(minX - pad, 0),
      minY: Math.min(minY - pad, 0),
      maxX: Math.max(maxX + pad, 1600),
      maxY: Math.max(maxY + pad, 1200),
    };
  }, [strokes]);

  // Main Render of Minimap
  useEffect(() => {
    if (!minimapVisible || minimized) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

    if (canvasMode === 'infinite') {
      // === INFINITE CANVAS MODE RENDERING ===
      const bounds = getInfiniteBounds();
      const worldW = bounds.maxX - bounds.minX;
      const worldH = bounds.maxY - bounds.minY;
      const scaleX = MAP_WIDTH / worldW;
      const scaleY = MAP_HEIGHT / worldH;
      const scale = Math.min(scaleX, scaleY);

      // Dark radar background
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

      // Subtle radar grid lines
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 0.5;
      for (let gx = 0; gx < MAP_WIDTH; gx += 20) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, MAP_HEIGHT);
        ctx.stroke();
      }
      for (let gy = 0; gy < MAP_HEIGHT; gy += 20) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(MAP_WIDTH, gy);
        ctx.stroke();
      }

      // Draw strokes
      for (const stroke of strokes) {
        if (stroke.points.length < 2) continue;
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = stroke.color || '#94a3b8';
        ctx.lineWidth = Math.max(1, (stroke.size || 2) * scale * 0.9);
        ctx.beginPath();
        const fX = (stroke.points[0].x - bounds.minX) * scale;
        const fY = (stroke.points[0].y - bounds.minY) * scale;
        ctx.moveTo(fX, fY);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo((stroke.points[i].x - bounds.minX) * scale, (stroke.points[i].y - bounds.minY) * scale);
        }
        ctx.stroke();
        ctx.restore();
      }

      // Viewport Rect
      const vpW = Math.max(12, (viewportWidth / zoom) * scale);
      const vpH = Math.max(10, (viewportHeight / zoom) * scale);
      const vpX = (-infinitePan.x - bounds.minX) * scale;
      const vpY = (-infinitePan.y - bounds.minY) * scale;

      ctx.fillStyle = 'rgba(99, 102, 241, 0.18)';
      ctx.fillRect(vpX, vpY, vpW, vpH);

      ctx.strokeStyle = '#818cf8';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(vpX, vpY, vpW, vpH);

      // Center crosshair
      ctx.fillStyle = '#a5b4fc';
      ctx.fillRect(vpX + vpW / 2 - 1.5, vpY + vpH / 2 - 1.5, 3, 3);
    } else {
      // === PAGED CANVAS MODE RENDERING ===
      // Aspect ratio of the current notebook page
      const scaleX = MAP_WIDTH / pageWidth;
      const scaleY = MAP_HEIGHT / pageHeight;
      const scale = Math.min(scaleX, scaleY);

      const renderW = pageWidth * scale;
      const renderH = pageHeight * scale;
      const offsetX = (MAP_WIDTH - renderW) / 2;
      const offsetY = (MAP_HEIGHT - renderH) / 2;

      // Dark card backdrop
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

      // Render miniature page paper
      ctx.save();
      const paperBgMap: Record<string, string> = {
        white: '#ffffff',
        cream: '#faf7ee',
        'yellow-pad': '#fefce8',
        sage: '#f2f5f0',
        kraft: '#e7d8be',
        dark: '#141923',
        black: '#0a0d14',
      };
      ctx.fillStyle = paperBgMap[currentPage?.paperColor || 'cream'] || '#faf7ee';
      ctx.fillRect(offsetX, offsetY, renderW, renderH);

      // Page border and drop shadow
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      ctx.strokeRect(offsetX, offsetY, renderW, renderH);

      // Subtle lined or grid template representation
      if (currentPage?.template?.includes('lined') || currentPage?.template?.includes('grid')) {
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.22)';
        ctx.lineWidth = 0.5;
        const lineStep = 6;
        for (let ly = offsetY + lineStep; ly < offsetY + renderH; ly += lineStep) {
          ctx.beginPath();
          ctx.moveTo(offsetX + 4, ly);
          ctx.lineTo(offsetX + renderW - 4, ly);
          ctx.stroke();
        }
      }
      ctx.restore();

      // Render miniature strokes
      for (const stroke of strokes) {
        if (stroke.points.length < 2) continue;
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Draw shape fill if present
        if (stroke.shapeFillColor && ['rectangle', 'circle', 'triangle'].includes(stroke.shapeType || '')) {
          ctx.fillStyle = stroke.shapeFillColor;
          ctx.globalAlpha = stroke.shapeFillOpacity ?? 0.25;
          ctx.beginPath();
          const sMinX = offsetX + (stroke.bounds?.minX || 0) * scale;
          const sMinY = offsetY + (stroke.bounds?.minY || 0) * scale;
          const sMaxX = offsetX + (stroke.bounds?.maxX || 0) * scale;
          const sMaxY = offsetY + (stroke.bounds?.maxY || 0) * scale;
          ctx.rect(sMinX, sMinY, Math.max(2, sMaxX - sMinX), Math.max(2, sMaxY - sMinY));
          ctx.fill();
        }

        ctx.globalAlpha = stroke.tool === 'highlighter' ? 0.45 : 1.0;
        ctx.strokeStyle = stroke.color || '#334155';
        ctx.lineWidth = Math.max(1, (stroke.size || 2) * scale * (stroke.tool === 'highlighter' ? 2.5 : 1));

        ctx.beginPath();
        const fX = offsetX + stroke.points[0].x * scale;
        const fY = offsetY + stroke.points[0].y * scale;
        ctx.moveTo(fX, fY);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(offsetX + stroke.points[i].x * scale, offsetY + stroke.points[i].y * scale);
        }
        ctx.stroke();
        ctx.restore();
      }

      // Render miniature sticky notes
      for (const note of stickyNotes) {
        const nx = offsetX + note.x * scale;
        const ny = offsetY + note.y * scale;
        const nw = Math.max(5, (note.width || 120) * scale);
        const nh = Math.max(4, (note.height || 100) * scale);

        ctx.save();
        ctx.fillStyle = '#fde047';
        ctx.fillRect(nx, ny, nw, nh);
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(nx, ny, nw, nh);
        ctx.restore();
      }

      // Render miniature text box indicators
      for (const txt of texts) {
        const tx = offsetX + txt.x * scale;
        const ty = offsetY + txt.y * scale;
        ctx.save();
        ctx.fillStyle = '#60a5fa';
        ctx.fillRect(tx, ty, Math.max(6, 25 * scale), 2);
        ctx.restore();
      }

      // Viewport Rect in Paged Mode (relative to scroll offset and zoom)
      const containerEl = containerRef?.current;
      const cW = scrollState.clientWidth || 800;
      const cH = scrollState.clientHeight || 600;

      // Actual page rendered pixel size on screen = pageWidth * zoom
      const screenPageW = pageWidth * zoom;
      const screenPageH = pageHeight * zoom;

      // Approximate scroll ratio
      const ratioX = cW / Math.max(cW, screenPageW);
      const ratioY = cH / Math.max(cH, screenPageH);

      const vpW = Math.max(14, Math.min(renderW, renderW * ratioX));
      const vpH = Math.max(12, Math.min(renderH, renderH * ratioY));

      const maxScrollX = Math.max(1, (containerEl?.scrollWidth || screenPageW) - cW);
      const maxScrollY = Math.max(1, (containerEl?.scrollHeight || screenPageH) - cH);

      const scrollFractionX = maxScrollX > 10 ? scrollState.scrollLeft / maxScrollX : 0.5;
      const scrollFractionY = maxScrollY > 10 ? scrollState.scrollTop / maxScrollY : 0.5;

      const vpX = offsetX + scrollFractionX * (renderW - vpW);
      const vpY = offsetY + scrollFractionY * (renderH - vpH);

      ctx.fillStyle = 'rgba(99, 102, 241, 0.18)';
      ctx.fillRect(vpX, vpY, vpW, vpH);

      ctx.strokeStyle = '#818cf8';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(vpX, vpY, vpW, vpH);

      // Center crosshair
      ctx.fillStyle = '#c7d2fe';
      ctx.fillRect(vpX + vpW / 2 - 1.5, vpY + vpH / 2 - 1.5, 3, 3);
    }
  }, [
    minimapVisible,
    minimized,
    canvasMode,
    strokes,
    stickyNotes,
    texts,
    pageWidth,
    pageHeight,
    currentPage?.paperColor,
    currentPage?.template,
    zoom,
    scrollState,
    containerRef,
    infinitePan,
    viewportWidth,
    viewportHeight,
    getInfiniteBounds,
  ]);

  // Pointer Down & Dragging Viewport Navigation
  const handlePointerDownCanvas = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isPanningRef.current = true;
    triggerHaptic('light');
    panToEventCoords(e);
  };

  const handlePointerMoveCanvas = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPanningRef.current) return;
    panToEventCoords(e);
  };

  const handlePointerUpCanvas = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore
      }
    }
  };

  const panToEventCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    if (canvasMode === 'infinite') {
      const bounds = getInfiniteBounds();
      const worldW = bounds.maxX - bounds.minX;
      const worldH = bounds.maxY - bounds.minY;
      const scale = Math.min(MAP_WIDTH / worldW, MAP_HEIGHT / worldH);

      const targetWorldX = clickX / scale + bounds.minX;
      const targetWorldY = clickY / scale + bounds.minY;

      setInfinitePan({
        x: -(targetWorldX - (viewportWidth / zoom) / 2),
        y: -(targetWorldY - (viewportHeight / zoom) / 2),
      });
    } else {
      // Paged mode scrolling
      const containerEl = containerRef?.current;
      if (!containerEl) return;

      const scale = Math.min(MAP_WIDTH / pageWidth, MAP_HEIGHT / pageHeight);
      const renderW = pageWidth * scale;
      const renderH = pageHeight * scale;
      const offsetX = (MAP_WIDTH - renderW) / 2;
      const offsetY = (MAP_HEIGHT - renderH) / 2;

      const normX = Math.max(0, Math.min(1, (clickX - offsetX) / renderW));
      const normY = Math.max(0, Math.min(1, (clickY - offsetY) / renderH));

      const targetScrollLeft = normX * containerEl.scrollWidth - containerEl.clientWidth / 2;
      const targetScrollTop = normY * containerEl.scrollHeight - containerEl.clientHeight / 2;

      containerEl.scrollTo({
        left: targetScrollLeft,
        top: targetScrollTop,
        behavior: 'auto',
      });
    }
  };

  if (!minimapVisible) return null;

  // Minimized Floating Pill
  if (minimized) {
    return (
      <div
        style={{ left: `${position.x}px`, top: `${position.y}px` }}
        className="fixed z-40 pointer-events-auto select-none"
      >
        <button
          onClick={() => {
            triggerHaptic('light');
            setMinimized(false);
          }}
          className="flex items-center gap-2 bg-slate-900/95 hover:bg-slate-850 text-indigo-400 hover:text-indigo-300 px-3.5 py-2 rounded-full shadow-2xl border border-indigo-500/40 hover:border-indigo-400 transition-all hover:scale-105 backdrop-blur-md group"
          title="Tuval Radarını Aç (N tuşuna basın)"
        >
          <Compass size={15} className="text-indigo-400 group-hover:rotate-45 transition-transform" />
          <span className="text-xs font-bold text-slate-100">Radar</span>
          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded-full font-mono font-semibold">
            N
          </span>
        </button>
      </div>
    );
  }

  return (
    <div
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      className="fixed z-40 pointer-events-auto w-[214px] flex flex-col bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden select-none animate-in fade-in zoom-in-95 duration-150"
    >
      {/* 1. Header with Drag Handle */}
      <div
        onPointerDown={handlePointerDownHeader}
        onPointerMove={handlePointerMoveHeader}
        onPointerUp={handlePointerUpHeader}
        className="h-8 px-2.5 bg-slate-800/80 border-b border-slate-700/70 flex items-center justify-between cursor-move text-slate-200"
      >
        <div className="flex items-center gap-1.5">
          <Move size={12} className="text-slate-400" />
          <span className="text-[11px] font-bold tracking-wide flex items-center gap-1 text-white">
            <Compass size={13} className="text-indigo-400" />
            <span>Tuval Radarı</span>
            <span className="text-[9px] bg-slate-700 text-indigo-300 px-1 py-0.2 rounded font-mono font-bold">
              N
            </span>
          </span>
        </div>

        {/* Window actions */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => {
              triggerHaptic('light');
              setMinimized(true);
            }}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors"
            title="Simge Durumuna Küçült"
          >
            <Minimize2 size={12} />
          </button>
          <button
            onClick={() => {
              triggerHaptic('light');
              toggleMinimap();
            }}
            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-700 rounded-md transition-colors"
            title="Kapat"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* 2. Interactive Radar Canvas */}
      <div className="p-2 flex flex-col gap-1.5 items-center bg-slate-950/40">
        <canvas
          ref={canvasRef}
          width={MAP_WIDTH}
          height={MAP_HEIGHT}
          className="rounded-xl cursor-crosshair border border-slate-800 shadow-inner touch-none bg-slate-950"
          onPointerDown={handlePointerDownCanvas}
          onPointerMove={handlePointerMoveCanvas}
          onPointerUp={handlePointerUpCanvas}
          title="Tıklayarak veya sürükleyerek tuvalde canlı gezinin"
        />

        {/* 3. Quick Zoom & Fit Controls */}
        <div className="w-full flex items-center justify-between text-[10px] text-slate-400 px-0.5">
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                triggerHaptic('light');
                setZoom(zoom - 0.15);
              }}
              className="p-1 hover:bg-slate-800 hover:text-white rounded transition-colors"
              title="Uzaklaş"
            >
              <ZoomOut size={12} />
            </button>
            <span className="font-mono text-indigo-300 font-bold min-w-[34px] text-center">
              %{Math.round(zoom * 100)}
            </span>
            <button
              onClick={() => {
                triggerHaptic('light');
                setZoom(zoom + 0.15);
              }}
              className="p-1 hover:bg-slate-800 hover:text-white rounded transition-colors"
              title="Yakınlaş"
            >
              <ZoomIn size={12} />
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                triggerHaptic('medium');
                if (canvasMode === 'infinite') {
                  resetInfinitePan();
                } else {
                  resetView();
                  containerRef?.current?.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
                }
              }}
              className="px-2 py-0.5 bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300 rounded-md font-semibold text-[10px] transition-colors flex items-center gap-1 shadow-sm"
              title="Görünümü Ortala / Sığdır"
            >
              <RotateCcw size={10} />
              <span>Sığdır</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
