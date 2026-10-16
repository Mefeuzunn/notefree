import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useNotebookStore } from '../../store/notebookStore';
import { Stroke, StrokePoint, TapeItem, FillItem } from '../../types/notebook';
import {
  calculateStrokeBounds,
  drawStrokeOnCanvas,
  drawTapeOnCanvas,
  drawFillOnCanvas,
  isPointInsideFill,
  detectScratchOutGesture,
  isPointNearStroke,
} from '../../engine/strokeRenderer';
import { performFloodFill } from '../../engine/floodFill';
import {
  detectGeometricShape,
  generateArrowPoints,
  generateCirclePoints,
  generateEllipsePoints,
  generateRectanglePoints,
  generateTrianglePoints,
  generatePolygonPoints,
  generateStarPoints,
  generateCalloutPoints,
  generateCurlyBracketPoints,
  generateArcPoints,
  interpolateLine,
  applyPrecisionSnapping,
} from '../../engine/shapeDetector';
import { collaborationService } from '../../services/collaborationService';
import { StickyNoteOverlay } from './StickyNoteOverlay';
import { TableItemOverlay } from './TableItemOverlay';
import { ConnectorOverlay } from './ConnectorOverlay';
import { Compass, Move, Users, Maximize2, Sparkles } from 'lucide-react';
import { triggerHaptic } from '../../engine/hapticFeedback';

export const InfiniteCanvas: React.FC = () => {
  const {
    notebooks,
    activeNotebookId,
    activePageIndex,
    activeTool,
    toolSettings,
    zoom,
    setZoom,
    infinitePan,
    setInfinitePan,
    resetInfinitePan,
    addStrokeToCurrentPage,
    eraseStrokesOnCurrentPage,
    addFillToCurrentPage,
    removeFillFromCurrentPage,
    layers,
    layerLocks,
    collaboration,
    remoteLiveStrokes,
    updateMyCursor,
    addStickyNoteToCurrentPage,
    setActiveTool,
    previousTool,
  } = useNotebookStore();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const strokesCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const liveCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({
    width: 1200,
    height: 800,
  });

  const currentPointsRef = useRef<StrokePoint[]>([]);
  const lastPointRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const spacePressedRef = useRef<boolean>(false);
  const hasStylusUsedRef = useRef<boolean>(false);

  // Track space key for click-to-pan
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !spacePressedRef.current && (e.target as HTMLElement).tagName !== 'INPUT') {
        spacePressedRef.current = true;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spacePressedRef.current = false;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const activeNotebook = notebooks.find((n) => n.id === activeNotebookId);
  const currentPage = activeNotebook?.pages[activePageIndex] || activeNotebook?.pages[0];
  const strokes = currentPage?.strokes || [];
  const fills = currentPage?.fills || [];
  const tapes = currentPage?.tapes || [];

  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;

  // Track container resize
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Update canvas dimensions on resize
  useEffect(() => {
    const { width, height } = containerSize;
    [bgCanvasRef.current, strokesCanvasRef.current, liveCanvasRef.current].forEach((c) => {
      if (c) {
        c.width = width * dpr;
        c.height = height * dpr;
        c.style.width = `${width}px`;
        c.style.height = `${height}px`;
      }
    });
    redrawAll();
  }, [containerSize, dpr]);

  // Infinite repeating grid background
  const drawInfiniteBackground = useCallback(() => {
    const canvas = bgCanvasRef.current;
    if (!canvas || !layers.background) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);

    // Deep modern dark paper background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, containerSize.width, containerSize.height);

    // Seamless repeating grid dots
    const gridSize = 28 * zoom;
    const offsetX = (infinitePan.x * zoom) % gridSize;
    const offsetY = (infinitePan.y * zoom) % gridSize;

    ctx.fillStyle = 'rgba(148, 163, 184, 0.22)';
    for (let x = offsetX; x < containerSize.width; x += gridSize) {
      for (let y = offsetY; y < containerSize.height; y += gridSize) {
        ctx.beginPath();
        ctx.arc(x, y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }, [containerSize, dpr, infinitePan, zoom, layers.background]);

  // Committed strokes redraw
  const redrawCommittedStrokes = useCallback(() => {
    const canvas = strokesCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);

    // Apply viewport transform (pan & zoom)
    ctx.translate(infinitePan.x * zoom, infinitePan.y * zoom);
    ctx.scale(zoom, zoom);

    // 1. Fills
    if (layers.fills && fills.length > 0) {
      for (const fill of fills) {
        drawFillOnCanvas(ctx, fill);
      }
    }

    // 2. Highlighters
    if (layers.highlighters) {
      for (const s of strokes) {
        if (s.tool === 'highlighter') {
          drawStrokeOnCanvas(ctx, s, toolSettings.streamline);
        }
      }
    }

    // 3. Normal strokes
    if (layers.strokes) {
      for (const s of strokes) {
        if (s.tool !== 'highlighter') {
          drawStrokeOnCanvas(ctx, s, toolSettings.streamline);
        }
      }
    }

    // 4. Tapes
    if (layers.tapes && tapes.length > 0) {
      for (const tape of tapes) {
        drawTapeOnCanvas(ctx, tape);
      }
    }

    ctx.restore();
  }, [strokes, fills, tapes, dpr, infinitePan, zoom, layers, toolSettings.streamline]);

  const redrawAll = useCallback(() => {
    drawInfiniteBackground();
    redrawCommittedStrokes();
  }, [drawInfiniteBackground, redrawCommittedStrokes]);

  useEffect(() => {
    redrawAll();
  }, [redrawAll]);

  // Coordinate mapping from screen pointer to infinite world coordinates
  const getWorldCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = liveCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    const worldX = (screenX - infinitePan.x * zoom) / zoom;
    const worldY = (screenY - infinitePan.y * zoom) / zoom;

    return { x: worldX, y: worldY, screenX, screenY };
  };

  // Live shape preview helper
  const renderShapePreview = (ctx: CanvasRenderingContext2D, points: StrokePoint[]) => {
    if (points.length < 2) return;
    let start = points[0];
    let end = points[points.length - 1];

    if (toolSettings.angleSnap || toolSettings.gridSnap) {
      const snapped = applyPrecisionSnapping(start, end, toolSettings.angleSnap, toolSettings.gridSnap);
      start = snapped.start;
      end = snapped.end;
    }

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
      case 'pentagon': {
        const cx = (start.x + end.x) / 2;
        const cy = (start.y + end.y) / 2;
        const rx = Math.abs(end.x - start.x) / 2;
        const ry = Math.abs(end.y - start.y) / 2;
        shapePoints = generatePolygonPoints(cx, cy, rx, ry, 5);
        break;
      }
      case 'hexagon': {
        const cx = (start.x + end.x) / 2;
        const cy = (start.y + end.y) / 2;
        const rx = Math.abs(end.x - start.x) / 2;
        const ry = Math.abs(end.y - start.y) / 2;
        shapePoints = generatePolygonPoints(cx, cy, rx, ry, 6);
        break;
      }
      case 'diamond': {
        const cx = (start.x + end.x) / 2;
        const cy = (start.y + end.y) / 2;
        const rx = Math.abs(end.x - start.x) / 2;
        const ry = Math.abs(end.y - start.y) / 2;
        shapePoints = generatePolygonPoints(cx, cy, rx, ry, 4, -Math.PI / 2);
        break;
      }
      case 'star': {
        const cx = (start.x + end.x) / 2;
        const cy = (start.y + end.y) / 2;
        const rx = Math.abs(end.x - start.x) / 2;
        const ry = Math.abs(end.y - start.y) / 2;
        shapePoints = generateStarPoints(cx, cy, rx, ry, 5);
        break;
      }
      case 'callout':
        shapePoints = generateCalloutPoints(
          Math.min(start.x, end.x),
          Math.min(start.y, end.y),
          Math.max(start.x, end.x),
          Math.max(start.y, end.y)
        );
        break;
      case 'bracket': {
        const cx = (start.x + end.x) / 2;
        const topY = Math.min(start.y, end.y);
        const botY = Math.max(start.y, end.y);
        shapePoints = generateCurlyBracketPoints(cx, topY, cx, botY, 18, 'left');
        break;
      }
      case 'arc':
        shapePoints = generateArcPoints(start, end);
        break;
    }

    drawStrokeOnCanvas(ctx, {
      tool: 'ballpoint',
      color: toolSettings.color,
      size: toolSettings.size,
      points: shapePoints,
    });
  };

  // Pointer Down
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);

    // Pan with space bar, middle mouse button, or pan tool
    if (activeTool === 'pan' || e.button === 1 || spacePressedRef.current) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }

    if (e.pointerType === 'pen') {
      hasStylusUsedRef.current = true;
    }

    // Smart Palm Rejection: If palm rejection is explicitly enabled, reject touch events
    if (e.pointerType === 'touch' && toolSettings.palmRejection) {
      return;
    }

    const { x, y } = getWorldCoords(e);

    // Check layer locks
    if (activeTool === 'fill' && layerLocks.fills) return;
    if (activeTool === 'highlighter' && layerLocks.highlighters) return;
    if (activeTool === 'tape' && layerLocks.tapes) return;
    if (!['highlighter', 'laser', 'pan', 'eyedropper', 'audio-scrub', 'eraser', 'lasso', 'tape', 'text', 'fill'].includes(activeTool) && layerLocks.strokes) {
      return;
    }

    if (activeTool === 'eraser') {
      handleEraser(x, y);
      return;
    }

    if (activeTool === 'sticky-note') {
      addStickyNoteToCurrentPage({
        id: `sn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        x: Math.round(x - 100),
        y: Math.round(y - 40),
        width: 210,
        height: 180,
        color: 'yellow',
        text: '',
        createdAt: Date.now(),
      });
      setActiveTool(previousTool || 'ballpoint');
      return;
    }

    setIsDrawing(true);
    const pt: StrokePoint = {
      x,
      y,
      pressure: e.pressure || 0.5,
      timestamp: Date.now(),
      tiltX: e.tiltX,
      tiltY: e.tiltY,
    };
    currentPointsRef.current = [pt];
  };

  // Pointer Move
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // If panning
    if (isPanning && panStart) {
      const dx = (e.clientX - panStart.x) / zoom;
      const dy = (e.clientY - panStart.y) / zoom;
      setInfinitePan({
        x: infinitePan.x + dx,
        y: infinitePan.y + dy,
      });
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }

    const { x, y } = getWorldCoords(e);

    // Broadcast cursor position in collaborative session
    if (collaboration.isConnected) {
      updateMyCursor(x, y);
    }

    if (!isDrawing) return;

    if (activeTool === 'eraser') {
      handleEraser(x, y);
      return;
    }

    const pt: StrokePoint = {
      x,
      y,
      pressure: e.pressure || 0.5,
      timestamp: Date.now(),
      tiltX: e.tiltX,
      tiltY: e.tiltY,
    };
    currentPointsRef.current.push(pt);

    // Broadcast live stroke points to collaboration peers
    if (collaboration.isConnected) {
      collaborationService.broadcastLiveStrokePoints(
        currentPointsRef.current,
        activeTool,
        toolSettings.color,
        toolSettings.size
      );
    }

    // Render live canvas preview
    const liveCanvas = liveCanvasRef.current;
    if (!liveCanvas) return;
    const ctx = liveCanvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, liveCanvas.width, liveCanvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.translate(infinitePan.x * zoom, infinitePan.y * zoom);
    ctx.scale(zoom, zoom);

    if (activeTool === 'shape') {
      renderShapePreview(ctx, currentPointsRef.current);
    } else {
      drawStrokeOnCanvas(
        ctx,
        {
          tool: activeTool as any,
          color: toolSettings.color,
          size: toolSettings.size,
          points: currentPointsRef.current,
        },
        toolSettings.streamline
      );
    }

    ctx.restore();
  };

  // Pointer Up
  const handlePointerUp = () => {
    if (isPanning) {
      setIsPanning(false);
      setPanStart(null);
      return;
    }

    if (!isDrawing) return;
    setIsDrawing(false);

    const liveCanvas = liveCanvasRef.current;
    if (liveCanvas) {
      const ctx = liveCanvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, liveCanvas.width, liveCanvas.height);
    }

    if (activeTool === 'eraser' || currentPointsRef.current.length === 0) {
      currentPointsRef.current = [];
      return;
    }

    // ✍️ FAZ Z: Scribble-to-Erase on Infinite Canvas
    if (activeTool !== 'shape' && toolSettings.scribbleToErase !== false) {
      const scratch = detectScratchOutGesture(currentPointsRef.current);
      if (scratch.isScratch && scratch.bounds) {
        const sb = scratch.bounds;
        const strokesToErase = strokes.filter((s) => {
          const overlaps =
            s.bounds.maxX >= sb.minX - 6 &&
            s.bounds.minX <= sb.maxX + 6 &&
            s.bounds.maxY >= sb.minY - 6 &&
            s.bounds.minY <= sb.maxY + 6;
          if (!overlaps) return false;
          return s.points.some(
            (p) =>
              p.x >= sb.minX - 8 &&
              p.x <= sb.maxX + 8 &&
              p.y >= sb.minY - 8 &&
              p.y <= sb.maxY + 8
          );
        });

        if (strokesToErase.length > 0) {
          eraseStrokesOnCurrentPage(strokesToErase.map((s) => s.id));
          triggerHaptic('medium');
          currentPointsRef.current = [];
          return;
        }
      }
    }

    let finalPoints = [...currentPointsRef.current];

    if (activeTool === 'shape') {
      let start = finalPoints[0];
      let end = finalPoints[finalPoints.length - 1];
      if (toolSettings.angleSnap || toolSettings.gridSnap) {
        const snapped = applyPrecisionSnapping(start, end, toolSettings.angleSnap, toolSettings.gridSnap);
        start = snapped.start;
        end = snapped.end;
      }

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
        case 'pentagon': {
          const cx = (start.x + end.x) / 2;
          const cy = (start.y + end.y) / 2;
          const rx = Math.abs(end.x - start.x) / 2;
          const ry = Math.abs(end.y - start.y) / 2;
          finalPoints = generatePolygonPoints(cx, cy, rx, ry, 5);
          break;
        }
        case 'hexagon': {
          const cx = (start.x + end.x) / 2;
          const cy = (start.y + end.y) / 2;
          const rx = Math.abs(end.x - start.x) / 2;
          const ry = Math.abs(end.y - start.y) / 2;
          finalPoints = generatePolygonPoints(cx, cy, rx, ry, 6);
          break;
        }
        case 'diamond': {
          const cx = (start.x + end.x) / 2;
          const cy = (start.y + end.y) / 2;
          const rx = Math.abs(end.x - start.x) / 2;
          const ry = Math.abs(end.y - start.y) / 2;
          finalPoints = generatePolygonPoints(cx, cy, rx, ry, 4, -Math.PI / 2);
          break;
        }
        case 'star': {
          const cx = (start.x + end.x) / 2;
          const cy = (start.y + end.y) / 2;
          const rx = Math.abs(end.x - start.x) / 2;
          const ry = Math.abs(end.y - start.y) / 2;
          finalPoints = generateStarPoints(cx, cy, rx, ry, 5);
          break;
        }
        case 'callout':
          finalPoints = generateCalloutPoints(
            Math.min(start.x, end.x),
            Math.min(start.y, end.y),
            Math.max(start.x, end.x),
            Math.max(start.y, end.y)
          );
          break;
        case 'bracket': {
          const cx = (start.x + end.x) / 2;
          const topY = Math.min(start.y, end.y);
          const botY = Math.max(start.y, end.y);
          finalPoints = generateCurlyBracketPoints(cx, topY, cx, botY, 18, 'left');
          break;
        }
        case 'arc':
          finalPoints = generateArcPoints(start, end);
          break;
      }
    } else if (toolSettings.autoDetectShape) {
      const detected = detectGeometricShape(finalPoints, {
        angleSnap: toolSettings.angleSnap,
        gridSnap: toolSettings.gridSnap,
      });
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
    };

    addStrokeToCurrentPage(newStroke);
    currentPointsRef.current = [];
  };

  // Eraser handler
  const handleEraser = (x: number, y: number) => {
    const threshold = toolSettings.eraserSize;
    const hitIds: string[] = [];

    for (const stroke of strokes) {
      const isHighlighter = stroke.tool === 'highlighter';
      if (isHighlighter && layerLocks.highlighters) continue;
      if (!isHighlighter && layerLocks.strokes) continue;

      if (isPointNearStroke({ x, y }, stroke, threshold)) {
        hitIds.push(stroke.id);
      }
    }

    if (hitIds.length > 0) {
      eraseStrokesOnCurrentPage(hitIds);
    }
  };

  // Trackpad pinch zoom and two-finger pan
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.06 : 0.06;
      setZoom(Math.max(0.3, Math.min(3.5, zoom + delta)));
    } else {
      setInfinitePan({
        x: infinitePan.x - e.deltaX / zoom,
        y: infinitePan.y - e.deltaY / zoom,
      });
    }
  };

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      className="w-full h-full relative overflow-hidden bg-slate-950 select-none cursor-crosshair"
    >
      {/* Layer 0: Infinite Repeating Grid */}
      <canvas ref={bgCanvasRef} className="absolute inset-0 pointer-events-none" />

      {/* Layer 1: Committed Strokes Canvas */}
      <canvas ref={strokesCanvasRef} className="absolute inset-0 pointer-events-none" />

      {/* Layer 2: Live Drawing Interactive Canvas */}
      <canvas
        ref={liveCanvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="absolute inset-0 touch-none"
      />

      {/* Layer 2.5: Sticky Notes Overlay in Infinite Canvas */}
      <div
        className="absolute inset-0 pointer-events-none z-20"
        style={{
          transform: `translate(${infinitePan.x * zoom}px, ${infinitePan.y * zoom}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        <div
          id={`canvas-page-container-${currentPage?.id || 'default'}`}
          className="relative w-full h-full pointer-events-auto"
        >
          {currentPage?.stickyNotes &&
            currentPage.stickyNotes.map((note) => (
              <StickyNoteOverlay key={note.id} note={note} scale={zoom} />
            ))}
          {currentPage?.tables &&
            currentPage.tables.map((tbl) => (
              <TableItemOverlay key={tbl.id} table={tbl} scale={1.0} />
            ))}
          {currentPage && (
            <ConnectorOverlay page={currentPage} scale={1.0} />
          )}
        </div>
      </div>

      {/* Layer 3: Remote Active Live Strokes from Peers */}
      {collaboration.isConnected && (
        <svg className="absolute inset-0 pointer-events-none w-full h-full">
          <g transform={`translate(${infinitePan.x * zoom}, ${infinitePan.y * zoom}) scale(${zoom})`}>
            {Object.entries(remoteLiveStrokes).map(([peerId, remote]) => {
              if (!remote.points || remote.points.length < 2) return null;
              const d = remote.points.reduce((acc, p, idx) => {
                return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
              }, '');
              return (
                <path
                  key={peerId}
                  d={d}
                  fill="none"
                  stroke={remote.color || '#6366f1'}
                  strokeWidth={remote.size || 3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.85}
                />
              );
            })}
          </g>
        </svg>
      )}

      {/* Layer 4: Collaborative Peer Live Cursors Floating Overlay */}
      {collaboration.isConnected &&
        collaboration.peers.map((peer) => {
          if (!peer.cursor) return null;
          const screenX = peer.cursor.x * zoom + infinitePan.x * zoom;
          const screenY = peer.cursor.y * zoom + infinitePan.y * zoom;

          return (
            <div
              key={peer.id}
              className="absolute pointer-events-none transition-all duration-75 flex items-center gap-1.5 z-40"
              style={{
                left: `${screenX}px`,
                top: `${screenY}px`,
                transform: 'translate(-2px, -2px)',
              }}
            >
              {/* Glowing Cursor Pin */}
              <div
                className="w-3.5 h-3.5 rounded-full ring-2 ring-white shadow-lg animate-pulse"
                style={{ backgroundColor: peer.color }}
              />
              {/* Name Tag Pill */}
              <div
                className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-md flex items-center gap-1"
                style={{ backgroundColor: peer.color }}
              >
                <span>{peer.name}</span>
                <span className="text-[9px] opacity-80">✏️</span>
              </div>
            </div>
          );
        })}

      {/* Mode Indicator Pill (Top Center) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-800 px-3.5 py-1.5 rounded-2xl shadow-xl text-xs font-semibold text-slate-300">
        <Sparkles size={14} className="text-amber-400" />
        <span>Sonsuz Tuval Modu</span>
        <div className="w-px h-3.5 bg-slate-700 mx-1" />
        <button
          onClick={resetInfinitePan}
          className="text-indigo-400 hover:text-indigo-300 text-[11px] font-medium"
        >
          Merkeze Dön
        </button>
      </div>
    </div>
  );
};
