import React, { useRef, useEffect, useState, useCallback } from 'react';
import { FillItem, LassoSelection, Page, PageSticker, Stroke, StrokePoint, TapeItem, ShapeType, ShapeControlNode } from '../../types/notebook';
import { useNotebookStore } from '../../store/notebookStore';
import {
  calculateStrokeBounds,
  drawStrokeOnCanvas,
  drawTapeOnCanvas,
  drawFillOnCanvas,
  isPointInsideFill,
  getStrokeOptions,
  detectScratchOutGesture,
  isPointNearStroke,
} from '../../engine/strokeRenderer';
import { performFloodFill } from '../../engine/floodFill';
import { drawPaperTemplate } from '../../engine/paperTemplates';
import {
  detectGeometricShape,
  generateArrowPoints,
  generateCirclePoints,
  generateEllipsePoints,
  generateRectanglePoints,
  generateTrianglePoints,
  interpolateLine,
  applyPrecisionSnapping,
  rebuildShapeFromNodes,
  rebuildShapeAndNodesFromDrag,
} from '../../engine/shapeDetector';
import {
  computeGroupBounds,
  isStrokeCapturedByLasso,
} from '../../engine/lassoHelper';
import { TextBoxOverlay } from './TextBoxOverlay';
import { StickyNoteOverlay } from './StickyNoteOverlay';
import { SymmetryGuide } from './SymmetryGuide';
import { ShapeNodeEditor } from './ShapeNodeEditor';
import { collaborationService } from '../../services/collaborationService';
import { HandwritingOcrModal } from '../modals/HandwritingOcrModal';
import {
  Move,
  RotateCw,
  Palette,
  Trash2,
  BookmarkPlus,
  X,
  Sparkles,
  Pipette,
  PaintBucket,
  Volume2,
  Check,
  Calculator,
  Type,
} from 'lucide-react';

interface CanvasPageProps {
  page: Page;
  pageIndex: number;
  scale?: number;
  isCurrent?: boolean;
  readOnly?: boolean;
  onActivate?: () => void;
}

export const CanvasPage: React.FC<CanvasPageProps> = ({
  page,
  pageIndex,
  scale = 1.0,
  isCurrent = true,
  readOnly = false,
  onActivate,
}) => {
  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const strokesCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const liveCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const {
    activeTool,
    toolSettings,
    addStrokeToCurrentPage,
    eraseStrokesOnCurrentPage,
    updateStrokeOnCurrentPage,
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
    zoomWindowOpen,
    zoomWindowPos,
    setZoomWindowPos,
    zoomBoxWidth,
    zoomBoxHeight,
    toggleTapeReveal,
    addTapeToCurrentPage,
    removeTapeFromCurrentPage,
    setActiveTool,
    previousTool,
    setToolColor,
    addFavoriteColor,
    addFillToCurrentPage,
    removeFillFromCurrentPage,
    seekAudioToStroke,
    openMathModal,
    layers,
    layerLocks,
    collaboration,
    remoteLiveStrokes,
    updateMyCursor,
    addStickyNoteToCurrentPage,
    symmetryEnabled,
    symmetryAxis,
    symmetryPosition,
  } = useNotebookStore();

  const [isDrawing, setIsDrawing] = useState(false);
  const [isDraggingLasso, setIsDraggingLasso] = useState(false);
  const [lassoDragStart, setLassoDragStart] = useState<{ x: number; y: number } | null>(null);
  const [recolorMenuOpen, setRecolorMenuOpen] = useState(false);
  const [ocrModalOpen, setOcrModalOpen] = useState(false);
  const hasStylusUsedRef = useRef<boolean>(false);
  const [selectedShapeStrokeId, setSelectedShapeStrokeId] = useState<string | null>(null);

  // Faz 1 interactive states
  const [eyedropperLoupe, setEyedropperLoupe] = useState<{ x: number; y: number; hex: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [audioRipple, setAudioRipple] = useState<{ x: number; y: number } | null>(null);

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

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!layers.background) return;

    ctx.save();
    ctx.scale(dpr, dpr);

    if (page.backgroundImageUrl) {
      const img = new Image();
      img.src = page.backgroundImageUrl;
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
      };
    } else {
      drawPaperTemplate(
        ctx,
        width,
        height,
        page.template,
        page.paperColor,
        page.customPitch,
        page.customLineColor,
        page.lineOpacity
      );
    }

    ctx.restore();
  }, [
    page.template,
    page.paperColor,
    page.customPitch,
    page.customLineColor,
    page.lineOpacity,
    page.backgroundImageUrl,
    width,
    height,
    dpr,
    layers.background,
  ]);

  // 2. Draw Committed Strokes Layer & Fills
  const redrawCommittedStrokes = useCallback(() => {
    const canvas = strokesCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. Draw Flood Fills Layer (beneath ink strokes)
    if (page.fills && layers.fills) {
      for (const fill of page.fills) {
        drawFillOnCanvas(ctx, fill);
      }
    }

    // 2. Draw Committed Ink Strokes & Highlighters
    for (const stroke of page.strokes) {
      if (stroke.tool === 'highlighter' && !layers.highlighters) continue;
      if (stroke.tool !== 'highlighter' && !layers.strokes) continue;

      if (audioPlaying && stroke.audioTimestamp !== undefined) {
        if (stroke.audioTimestamp > audioPlaybackTimeMs) {
          ctx.save();
          ctx.globalAlpha = 0.15;
          drawStrokeOnCanvas(ctx, stroke, toolSettings.streamline);
          ctx.restore();
          continue;
        } else if (Math.abs(stroke.audioTimestamp - audioPlaybackTimeMs) < 1500) {
          // Audio synchronous highlight pulse
          ctx.save();
          ctx.shadowColor = '#6366f1';
          ctx.shadowBlur = 12;
          drawStrokeOnCanvas(ctx, stroke, toolSettings.streamline);
          ctx.restore();
          continue;
        }
      }
      drawStrokeOnCanvas(ctx, stroke, toolSettings.streamline);
    }

    // 3. Draw GoodNotes 6 Tape Strips
    if (page.tapes && layers.tapes) {
      for (const tape of page.tapes) {
        drawTapeOnCanvas(ctx, tape);
      }
    }

    ctx.restore();
  }, [
    page.strokes,
    page.tapes,
    page.fills,
    dpr,
    audioPlaying,
    audioPlaybackTimeMs,
    toolSettings.streamline,
    layers.fills,
    layers.highlighters,
    layers.strokes,
    layers.tapes,
  ]);

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

  // Faz 1: Eyedropper Color Sampler
  const sampleColorAt = (x: number, y: number): string => {
    const strokesCanvas = strokesCanvasRef.current;
    if (strokesCanvas) {
      const ctx = strokesCanvas.getContext('2d');
      if (ctx) {
        const px = Math.floor(x * dpr);
        const py = Math.floor(y * dpr);
        if (px >= 0 && px < strokesCanvas.width && py >= 0 && py < strokesCanvas.height) {
          const p = ctx.getImageData(px, py, 1, 1).data;
          if (p[3] > 20) {
            return `#${((1 << 24) + (p[0] << 16) + (p[1] << 8) + p[2]).toString(16).slice(1)}`;
          }
        }
      }
    }

    const bgCanvas = bgCanvasRef.current;
    if (bgCanvas) {
      const ctx = bgCanvas.getContext('2d');
      if (ctx) {
        const px = Math.floor(x * dpr);
        const py = Math.floor(y * dpr);
        if (px >= 0 && px < bgCanvas.width && py >= 0 && py < bgCanvas.height) {
          const p = ctx.getImageData(px, py, 1, 1).data;
          if (p[3] > 20) {
            return `#${((1 << 24) + (p[0] << 16) + (p[1] << 8) + p[2]).toString(16).slice(1)}`;
          }
        }
      }
    }

    switch (page.paperColor) {
      case 'cream':
        return '#fdfbf7';
      case 'yellow-pad':
        return '#fef9c3';
      case 'dark':
        return '#0f172a';
      case 'kraft':
        return '#e7d8c9';
      default:
        return '#ffffff';
    }
  };

  // Faz 1: Flood Fill Execution
  const handleFloodFillClick = (x: number, y: number) => {
    const compCanvas = document.createElement('canvas');
    compCanvas.width = width * dpr;
    compCanvas.height = height * dpr;
    const compCtx = compCanvas.getContext('2d');
    if (!compCtx) return;

    if (bgCanvasRef.current) compCtx.drawImage(bgCanvasRef.current, 0, 0);
    if (strokesCanvasRef.current) compCtx.drawImage(strokesCanvasRef.current, 0, 0);

    const tolerance = toolSettings.fillTolerance || 38;
    const fillItem = performFloodFill(
      compCanvas,
      x * dpr,
      y * dpr,
      toolSettings.color,
      toolSettings.opacity || 0.85,
      tolerance
    );

    if (fillItem) {
      const normalizedFill: FillItem = {
        ...fillItem,
        x: fillItem.x / dpr,
        y: fillItem.y / dpr,
        width: fillItem.width / dpr,
        height: fillItem.height / dpr,
        bounds: {
          minX: fillItem.bounds.minX / dpr,
          maxX: fillItem.bounds.maxX / dpr,
          minY: fillItem.bounds.minY / dpr,
          maxY: fillItem.bounds.maxY / dpr,
        },
      };

      addFillToCurrentPage(normalizedFill);
      setToastMessage('Bölge Dolduruldu ✨');
      setTimeout(() => setToastMessage(null), 1800);
    }
  };

  // Faz 1: Audio Note Tap-to-Seek
  const handleAudioTapToSeek = (x: number, y: number): boolean => {
    const hitStroke = page.strokes.find((s) => isPointNearStroke({ x, y }, s, 18));
    if (hitStroke && hitStroke.audioTimestamp !== undefined) {
      seekAudioToStroke(hitStroke);
      setAudioRipple({ x, y });
      setTimeout(() => setAudioRipple(null), 1200);

      const totalSecs = Math.floor(hitStroke.audioTimestamp / 1000);
      const m = Math.floor(totalSecs / 60);
      const s = totalSecs % 60;
      setToastMessage(`🎵 [${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}] Sese Atlandı`);
      setTimeout(() => setToastMessage(null), 2000);
      return true;
    }
    return false;
  };

  // Pointer Down
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activeTool === 'pan') return;

    if (e.pointerType === 'pen') {
      hasStylusUsedRef.current = true;
    }

    // Smart Palm Rejection: If stylus has been used or palm rejection is enabled, reject single-finger touches
    if (e.pointerType === 'touch' && (hasStylusUsedRef.current || toolSettings.palmRejection)) {
      return;
    }

    setActivePageIndex(pageIndex);
    e.currentTarget.setPointerCapture(e.pointerId);

    const { x, y } = getCanvasCoords(e);
    const pressure = calculatePressure(x, y, e.pressure);

    // ReadOnly Mode (e.g. Secondary Split Notebook)
    if (readOnly) {
      if (page.tapes && page.tapes.length > 0) {
        const hitTape = page.tapes.find((tape) => {
          return tape.points.some(
            (pt) => Math.hypot(pt.x - x, pt.y - y) <= Math.max(16, tape.width / 1.8)
          );
        });
        if (hitTape) {
          toggleTapeReveal(pageIndex, hitTape.id);
          return;
        }
      }
      onActivate?.();
      return;
    }

    // Eyedropper mode: click to pick color
    if (activeTool === 'eyedropper') {
      const hex = sampleColorAt(x, y);
      setToolColor(hex);
      addFavoriteColor(hex);
      setEyedropperLoupe(null);
      setActiveTool(previousTool || 'ballpoint');
      setToastMessage(`Renk Seçildi: ${hex}`);
      setTimeout(() => setToastMessage(null), 2000);
      return;
    }

    // Flood Fill mode: click to fill enclosed region
    if (activeTool === 'fill') {
      if (layerLocks.fills) {
        setToastMessage('🔒 Dolgu katmanı kilitli');
        setTimeout(() => setToastMessage(null), 1500);
        return;
      }
      handleFloodFillClick(x, y);
      return;
    }

    // Audio Scrub mode or direct tap on stroke during audio playback
    if (activeTool === 'audio-scrub' || (audioPlaying && activeTool !== 'eraser')) {
      const handled = handleAudioTapToSeek(x, y);
      if (handled || activeTool === 'audio-scrub') return;
    }

    // Text tool mode: click to add rich text box
    if (activeTool === 'text') {
      if (layerLocks.texts) {
        setToastMessage('🔒 Metin katmanı kilitli');
        setTimeout(() => setToastMessage(null), 1500);
        return;
      }
      addTextAnnotation(pageIndex, x, y, '');
      return;
    }

    // Faz B: Sticky Note tool mode: click to drop a new sticky note
    if (activeTool === 'sticky-note') {
      addStickyNoteToCurrentPage({
        id: `sn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        x: Math.max(10, x - 100),
        y: Math.max(10, y - 40),
        width: 210,
        height: 180,
        color: 'yellow',
        text: '',
        createdAt: Date.now(),
      });
      setActiveTool(previousTool || 'pen');
      return;
    }

    // Tape tool mode lock check
    if (activeTool === 'tape' && layerLocks.tapes) {
      setToastMessage('🔒 Ezber bandı katmanı kilitli');
      setTimeout(() => setToastMessage(null), 1500);
      return;
    }

    // Highlighter lock check
    if (activeTool === 'highlighter' && layerLocks.highlighters) {
      setToastMessage('🔒 Fosforlu kalem katmanı kilitli');
      setTimeout(() => setToastMessage(null), 1500);
      return;
    }

    // Strokes lock check (pen, fountain, brush, ballpoint, shape, etc.)
    const isInkTool = !['highlighter', 'laser', 'pan', 'eyedropper', 'audio-scrub', 'eraser', 'lasso', 'tape', 'text', 'fill'].includes(activeTool);
    if (isInkTool && layerLocks.strokes) {
      setToastMessage('🔒 Çizim katmanı kilitli');
      setTimeout(() => setToastMessage(null), 1500);
      return;
    }

    // Laser pointer mode
    if (activeTool === 'laser') {
      setIsDrawing(true);
      addLaserPoint(x, y);
      return;
    }

    // Check if user clicked on a GoodNotes Tape strip to reveal/conceal
    if (page.tapes && page.tapes.length > 0 && activeTool !== 'tape' && activeTool !== 'eraser') {
      const hitTape = page.tapes.find((tape) => {
        return tape.points.some(
          (pt) => Math.hypot(pt.x - x, pt.y - y) <= Math.max(16, tape.width / 1.8)
        );
      });
      if (hitTape) {
        toggleTapeReveal(pageIndex, hitTape.id);
        return;
      }
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

    // Faz I: Check if user clicked on an existing shape stroke to edit its vertices
    if (activeTool === 'shape' || activeTool === 'lasso') {
      const hitShape = page.strokes.find(
        (s) => s.shapeType && s.controlNodes && s.controlNodes.length > 0 && isPointNearStroke({ x, y }, s, 18)
      );
      if (hitShape) {
        setSelectedShapeStrokeId(hitShape.id);
        return;
      }
    }

    if (selectedShapeStrokeId) {
      setSelectedShapeStrokeId(null);
    }

    setIsDrawing(true);
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

    // Eyedropper hovering loupe
    if (activeTool === 'eyedropper') {
      const hex = sampleColorAt(x, y);
      setEyedropperLoupe({ x, y, hex });
      return;
    }

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
    currentPointsRef.current.push({
      x,
      y,
      pressure,
      timestamp: Date.now(),
      tiltX: e.tiltX,
      tiltY: e.tiltY,
    });

    // Live Collaboration: Broadcast cursor and stroke points
    if (collaboration.isConnected) {
      updateMyCursor(x, y);
      if (activeTool !== 'laser' && activeTool !== 'pan') {
        collaborationService.broadcastLiveStrokePoints(
          currentPointsRef.current,
          activeTool,
          toolSettings.color,
          toolSettings.size
        );
      }
    }

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
    } else if (activeTool === 'tape') {
      drawTapeOnCanvas(ctx, {
        id: 'live_tape',
        points: currentPointsRef.current,
        color: toolSettings.color === '#0f172a' ? '#fed7aa' : toolSettings.color,
        width: Math.max(24, toolSettings.size * 5.5),
        isRevealed: false,
        timestamp: Date.now(),
      });
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

      // 🪞 Faz D: Real-time Live Symmetry Mirror Stroke
      if (symmetryEnabled && currentPointsRef.current.length > 0) {
        const isVert = symmetryAxis === 'vertical';
        const axisCoord = isVert ? width * symmetryPosition : height * symmetryPosition;
        const mirroredPoints = currentPointsRef.current.map((pt) => ({
          ...pt,
          x: isVert ? 2 * axisCoord - pt.x : pt.x,
          y: isVert ? pt.y : 2 * axisCoord - pt.y,
        }));
        drawStrokeOnCanvas(
          ctx,
          {
            tool: activeTool as any,
            color: toolSettings.color,
            size: toolSettings.size,
            points: mirroredPoints,
          },
          toolSettings.streamline
        );
      }
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
    if (valid.length === 0) {
      ctx.restore();
      return;
    }

    if (toolSettings.laserStyle === 'spotlight') {
      const currentPt = valid[valid.length - 1];
      // Dim entire page
      ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
      ctx.fillRect(0, 0, width, height);

      // Cut out spotlight circular beam
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(currentPt.x, currentPt.y, 85, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';

      // Ring glow
      ctx.beginPath();
      ctx.arc(currentPt.x, currentPt.y, 85, 0, Math.PI * 2);
      ctx.strokeStyle = '#818cf8';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#6366f1';
      ctx.shadowBlur = 16;
      ctx.stroke();

      ctx.restore();
      return;
    }

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

    // Handle Tape tool creation
    if (activeTool === 'tape') {
      if (currentPointsRef.current.length >= 2) {
        const newTape: TapeItem = {
          id: `tape_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          points: [...currentPointsRef.current],
          color: toolSettings.color === '#0f172a' ? '#fed7aa' : toolSettings.color,
          width: Math.max(24, toolSettings.size * 5.5),
          isRevealed: false,
          timestamp: Date.now(),
        };
        addTapeToCurrentPage(newTape);
      }
      currentPointsRef.current = [];
      return;
    }

    // Smart Gesture: Scratch-out to Erase
    if (activeTool !== 'shape') {
      const scratch = detectScratchOutGesture(currentPointsRef.current);
      if (scratch.isScratch && scratch.bounds) {
        const sb = scratch.bounds;
        const strokesToErase = page.strokes.filter((s) => {
          return (
            s.bounds.maxX >= sb.minX &&
            s.bounds.minX <= sb.maxX &&
            s.bounds.maxY >= sb.minY &&
            s.bounds.minY <= sb.maxY
          );
        });
        if (strokesToErase.length > 0) {
          eraseStrokesOnCurrentPage(strokesToErase.map((s) => s.id));
          currentPointsRef.current = [];
          return;
        }
      }
    }

    let finalPoints = [...currentPointsRef.current];

    // Explicit shape mode vs auto-detection
    let committedShapeType: ShapeType | undefined;
    let committedStart = finalPoints[0];
    let committedEnd = finalPoints[finalPoints.length - 1];

    if (activeTool === 'shape') {
      committedShapeType = toolSettings.selectedShape;
      let start = finalPoints[0];
      let end = finalPoints[finalPoints.length - 1];

      if (toolSettings.angleSnap || toolSettings.gridSnap) {
        const snapped = applyPrecisionSnapping(start, end, toolSettings.angleSnap, toolSettings.gridSnap);
        start = snapped.start;
        end = snapped.end;
      }
      committedStart = start;
      committedEnd = end;

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
      const detected = detectGeometricShape(finalPoints, {
        angleSnap: toolSettings.angleSnap,
        gridSnap: toolSettings.gridSnap,
      });
      if (detected) {
        committedShapeType = detected.type;
        finalPoints = detected.replacementPoints;
        committedStart = finalPoints[0];
        committedEnd = finalPoints[finalPoints.length - 1];
      }
    }

    // Build control nodes for editable shape vertices (Faz I)
    const buildControlNodes = (shapeType: ShapeType, s: StrokePoint, e: StrokePoint): ShapeControlNode[] => {
      const minX = Math.min(s.x, e.x);
      const minY = Math.min(s.y, e.y);
      const maxX = Math.max(s.x, e.x);
      const maxY = Math.max(s.y, e.y);
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      const rx = (maxX - minX) / 2;
      const ry = (maxY - minY) / 2;

      switch (shapeType) {
        case 'line':
        case 'arrow':
          return [
            { id: 'start', x: s.x, y: s.y, role: 'endpoint' },
            { id: 'end', x: e.x, y: e.y, role: 'endpoint' },
          ];
        case 'rectangle':
          return [
            { id: 'tl', x: minX, y: minY, role: 'corner' },
            { id: 'tr', x: maxX, y: minY, role: 'corner' },
            { id: 'br', x: maxX, y: maxY, role: 'corner' },
            { id: 'bl', x: minX, y: maxY, role: 'corner' },
            { id: 'mid-t', x: cx, y: minY, role: 'edge' },
            { id: 'mid-r', x: maxX, y: cy, role: 'edge' },
            { id: 'mid-b', x: cx, y: maxY, role: 'edge' },
            { id: 'mid-l', x: minX, y: cy, role: 'edge' },
          ];
        case 'circle':
          return [
            { id: 'cx', x: cx, y: cy, role: 'center' },
            { id: 'rx-handle', x: maxX, y: cy, role: 'radius' },
            { id: 'ry-handle', x: cx, y: maxY, role: 'radius' },
            { id: 'tl', x: minX, y: minY, role: 'corner' },
            { id: 'tr', x: maxX, y: minY, role: 'corner' },
            { id: 'br', x: maxX, y: maxY, role: 'corner' },
            { id: 'bl', x: minX, y: maxY, role: 'corner' },
          ];
        case 'triangle':
          return [
            { id: 'apex', x: cx, y: minY, role: 'apex' },
            { id: 'br', x: maxX, y: maxY, role: 'corner' },
            { id: 'bl', x: minX, y: maxY, role: 'corner' },
          ];
        default:
          return [];
      }
    };

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
      // Faz I: shape editing metadata
      ...(committedShapeType && {
        shapeType: committedShapeType,
        controlNodes: buildControlNodes(committedShapeType, committedStart, committedEnd),
        shapeFillColor: toolSettings.shapeFillColor,
      }),
    };

    addStrokeToCurrentPage(newStroke);

    // Faz I: Automatically activate control node editor on newly drawn shape
    if (committedShapeType) {
      setSelectedShapeStrokeId(strokeId);
    }

    // 🪞 Faz D: Real-time Symmetry Mirrored Stroke Commit
    if (symmetryEnabled && finalPoints.length > 0) {
      const isVert = symmetryAxis === 'vertical';
      const axisCoord = isVert ? width * symmetryPosition : height * symmetryPosition;
      const mirroredPoints: StrokePoint[] = finalPoints.map((pt) => ({
        ...pt,
        x: isVert ? 2 * axisCoord - pt.x : pt.x,
        y: isVert ? pt.y : 2 * axisCoord - pt.y,
      }));
      const mirrorBounds = calculateStrokeBounds(mirroredPoints, toolSettings.size);
      const mirrorStroke: Stroke = {
        ...newStroke,
        id: `sym_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        points: mirroredPoints,
        bounds: mirrorBounds,
      };
      addStrokeToCurrentPage(mirrorStroke);
    }

    currentPointsRef.current = [];
  };

  // Eraser handler respecting Layer Locks and element boundaries
  const handleEraser = (x: number, y: number) => {
    const threshold = toolSettings.eraserSize;
    const hitIds: string[] = [];

    for (const stroke of page.strokes) {
      // Respect layer locks
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

    // Also erase any tape if touched (unless tape layer is locked)
    if (page.tapes && page.tapes.length > 0 && !layerLocks.tapes) {
      for (const tape of page.tapes) {
        const isHit = tape.points.some(
          (pt) => Math.hypot(pt.x - x, pt.y - y) <= Math.max(18, tape.width / 1.5)
        );
        if (isHit) {
          removeTapeFromCurrentPage(tape.id);
        }
      }
    }

    // Also erase any flood fill if touched (unless fill layer is locked)
    if (page.fills && page.fills.length > 0 && !layerLocks.fills) {
      for (const fill of page.fills) {
        if (isPointInsideFill({ x, y }, fill)) {
          removeFillFromCurrentPage(fill.id);
        }
      }
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
      {layers.stickers &&
        page.stickers &&
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
            {!layerLocks.stickers && (
              <button
                onClick={() => removeStickerFromCurrentPage(stk.id)}
                className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 shadow transition-opacity"
                title="Sticker'ı Kaldır"
              >
                <X size={12} />
              </button>
            )}
          </div>
        ))}

      {/* Layer 0.6: Text Annotations */}
      {layers.texts &&
        page.texts &&
        page.texts.map((txt) => (
          <TextBoxOverlay
            key={txt.id}
            annotation={txt}
            scale={scale}
            onUpdate={(partial) => !layerLocks.texts && updateTextAnnotation(pageIndex, txt.id, partial)}
            onDelete={() => !layerLocks.texts && deleteTextAnnotation(pageIndex, txt.id)}
          />
        ))}

      {/* Layer 0.7: Faz B Sticky Notes (Yapışkan Notlar) */}
      {page.stickyNotes &&
        page.stickyNotes.map((note) => (
          <StickyNoteOverlay
            key={note.id}
            note={note}
            scale={scale}
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

            {/* Faz 2: Math AI Denklem Çözücü */}
            <button
              onClick={() => {
                openMathModal('2x + 6 = 18');
              }}
              className="px-2 py-1 hover:bg-slate-800 text-cyan-300 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-semibold border border-cyan-500/30 bg-cyan-950/40"
              title="Formülü Çöz (GoodNotes Math AI)"
            >
              <Calculator size={13} />
              <span>Çöz</span>
            </button>

            {/* Faz A: El Yazısını Metne Dönüştür (Handwriting-to-Text OCR) */}
            <button
              onClick={() => setOcrModalOpen(true)}
              className="px-2 py-1 hover:bg-slate-800 text-indigo-300 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-semibold border border-indigo-500/30 bg-indigo-950/40"
              title="El Yazısını Metne Dönüştür (GoodNotes OCR)"
            >
              <Type size={13} />
              <span>Metne Dönüştür</span>
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

      {/* Layer 4: GoodNotes Handwriting Zoom Focus Frame */}
      {zoomWindowOpen && isCurrent && (
        <div
          className="absolute z-20 border-2 border-indigo-500 bg-indigo-500/10 rounded-lg shadow-xl shadow-indigo-500/20 pointer-events-auto cursor-move flex items-start justify-between p-1 select-none animate-in fade-in"
          style={{
            left: `${zoomWindowPos.x * scale}px`,
            top: `${zoomWindowPos.y * scale}px`,
            width: `${zoomBoxWidth * scale}px`,
            height: `${zoomBoxHeight * scale}px`,
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            const startX = e.clientX;
            const startY = e.clientY;
            const origX = zoomWindowPos.x;
            const origY = zoomWindowPos.y;
            const handleMove = (moveEv: PointerEvent) => {
              const dx = (moveEv.clientX - startX) / scale;
              const dy = (moveEv.clientY - startY) / scale;
              setZoomWindowPos({
                x: Math.max(0, Math.min(width - zoomBoxWidth, origX + dx)),
                y: Math.max(0, Math.min(height - zoomBoxHeight, origY + dy)),
              });
            };
            const handleUp = () => {
              window.removeEventListener('pointermove', handleMove);
              window.removeEventListener('pointerup', handleUp);
            };
            window.addEventListener('pointermove', handleMove);
            window.addEventListener('pointerup', handleUp);
          }}
        >
          <span className="text-[10px] font-bold text-indigo-400 bg-slate-900/90 px-1.5 py-0.5 rounded flex items-center gap-1 shadow-sm">
            <Move size={10} /> Büyüteç Odak Alanı
          </span>
          {/* Shaded auto-advance strip on right 22% */}
          <div
            className="absolute right-0 top-0 bottom-0 w-[22%] bg-indigo-500/20 border-l border-dashed border-indigo-400/50 pointer-events-none rounded-r-md flex items-center justify-center"
            title="Otomatik İlerleme Bölgesi"
          >
            <span className="text-[9px] text-indigo-300 rotate-90 font-mono tracking-tighter opacity-70">
              İLERLE
            </span>
          </div>
        </div>
      )}

      {/* Faz 1: Eyedropper Magnifying Color Loupe */}
      {eyedropperLoupe && activeTool === 'eyedropper' && (
        <div
          className="absolute pointer-events-none z-30 flex flex-col items-center -translate-x-1/2 -translate-y-full pb-3 animate-in fade-in duration-75"
          style={{
            left: `${eyedropperLoupe.x * scale}px`,
            top: `${eyedropperLoupe.y * scale}px`,
          }}
        >
          <div
            className="w-14 h-14 rounded-full border-4 border-white shadow-2xl flex items-center justify-center relative overflow-hidden"
            style={{
              backgroundColor: eyedropperLoupe.hex,
              boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.3)',
            }}
          >
            {/* Center Crosshair */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-0.5 bg-white/90 shadow" />
              <div className="h-3 w-0.5 bg-white/90 shadow absolute" />
            </div>
          </div>
          <div className="mt-1 px-2 py-0.5 rounded-md bg-slate-900/95 text-[10px] font-mono font-bold text-white border border-slate-750 shadow-md">
            {eyedropperLoupe.hex}
          </div>
        </div>
      )}

      {/* Faz 1: Audio Note Tap-to-Seek Ripple Indicator */}
      {audioRipple && (
        <div
          className="absolute pointer-events-none z-30 -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${audioRipple.x * scale}px`,
            top: `${audioRipple.y * scale}px`,
          }}
        >
          <div className="w-14 h-14 rounded-full border-2 border-indigo-500 bg-indigo-500/25 animate-ping" />
        </div>
      )}

      {/* Faz 1: Floating Status Toast */}
      {toastMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 text-white border border-slate-700/80 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-2xl backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150">
          <Sparkles size={13} className="text-indigo-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Faz 4: Remote Live Strokes in Collaborative Session */}
      {collaboration.isConnected && (
        <svg className="absolute inset-0 pointer-events-none w-full h-full">
          <g transform={`scale(${scale})`}>
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

      {/* Faz 4: Remote Peer Cursors in Collaborative Session */}
      {collaboration.isConnected &&
        collaboration.peers.map((peer) => {
          if (!peer.cursor) return null;
          return (
            <div
              key={peer.id}
              className="absolute pointer-events-none transition-all duration-75 flex items-center gap-1.5 z-40"
              style={{
                left: `${peer.cursor.x * scale}px`,
                top: `${peer.cursor.y * scale}px`,
                transform: 'translate(-2px, -2px)',
              }}
            >
              <div
                className="w-3.5 h-3.5 rounded-full ring-2 ring-white shadow-lg animate-pulse"
                style={{ backgroundColor: peer.color }}
              />
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

      {/* 🪞 Faz D: Real-time Symmetry Axis Guide */}
      <SymmetryGuide pageWidth={width} pageHeight={height} />

      {/* Faz I: Akıllı Geometrik Şekil Köşe Tutamaçları ve Vertex Düzenleyici */}
      {(() => {
        if (!selectedShapeStrokeId) return null;
        const selectedShapeStroke = page.strokes.find((s) => s.id === selectedShapeStrokeId);
        if (
          !selectedShapeStroke ||
          !selectedShapeStroke.shapeType ||
          !selectedShapeStroke.controlNodes ||
          selectedShapeStroke.controlNodes.length === 0
        ) {
          return null;
        }

        return (
          <ShapeNodeEditor
            nodes={selectedShapeStroke.controlNodes}
            scale={scale}
            onNodesChange={(newNodes) => {
              const newPoints = rebuildShapeFromNodes(selectedShapeStroke.shapeType!, newNodes);
              const bounds = calculateStrokeBounds(newPoints, selectedShapeStroke.size);
              updateStrokeOnCurrentPage(selectedShapeStroke.id, {
                points: newPoints,
                bounds,
                controlNodes: newNodes,
              });
            }}
            onNodeDrag={(nodeId, newPos) => {
              const { points: newPoints, nodes: newNodes } = rebuildShapeAndNodesFromDrag(
                selectedShapeStroke.shapeType!,
                nodeId,
                newPos,
                selectedShapeStroke.controlNodes!
              );
              const bounds = calculateStrokeBounds(newPoints, selectedShapeStroke.size);
              updateStrokeOnCurrentPage(selectedShapeStroke.id, {
                points: newPoints,
                bounds,
                controlNodes: newNodes,
              });
            }}
            onClose={() => setSelectedShapeStrokeId(null)}
            onDelete={() => {
              eraseStrokesOnCurrentPage([selectedShapeStroke.id]);
              setSelectedShapeStrokeId(null);
            }}
          />
        );
      })()}

      {/* Faz A: Handwriting to Text OCR Modal */}
      <HandwritingOcrModal
        isOpen={ocrModalOpen}
        onClose={() => setOcrModalOpen(false)}
      />
    </div>
  );
};
