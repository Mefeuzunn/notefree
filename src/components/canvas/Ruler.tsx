import React, { useState, useRef, useMemo } from 'react';
import { useNotebookStore } from '../../store/notebookStore';
import {
  X,
  Compass,
  RotateCw,
  Magnet,
  Maximize2,
  PenTool,
  Tag,
  Check,
} from 'lucide-react';
import { RulerUnit } from '../../types/notebook';
import {
  PX_PER_CM,
  PX_PER_MM,
  PX_PER_IN,
  RULER_DEFAULT_HEIGHT,
  formatRulerMeasurement,
  getRulerEdgeSegments,
  createRulerStraightStroke,
  createRulerDimensionCallout,
} from '../../engine/rulerHelper';

interface RulerProps {
  scale?: number;
}

export const Ruler: React.FC<RulerProps> = ({ scale = 1.0 }) => {
  const {
    rulerVisible,
    toggleRuler,
    rulerAngle,
    setRulerAngle,
    rulerPosition,
    setRulerPosition,
    rulerWidth,
    setRulerWidth,
    rulerUnit,
    setRulerUnit,
    rulerEdgeSnap,
    toggleRulerEdgeSnap,
    toolSettings,
    addStrokeToCurrentPage,
    addTextAnnotation,
    activePageIndex,
  } = useNotebookStore();

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number }>({
    mouseX: 0,
    mouseY: 0,
    startX: 0,
    startY: 0,
  });

  const resizeStartRef = useRef<{ mouseX: number; startWidth: number }>({
    mouseX: 0,
    startWidth: 600,
  });

  if (!rulerVisible) return null;

  const rulerHeight = RULER_DEFAULT_HEIGHT;

  // Move entire ruler
  const handlePointerDown = (e: React.PointerEvent) => {
    // Ignore button and slider clicks
    if ((e.target as HTMLElement).closest('button, input, .resize-handle')) return;
    e.stopPropagation();
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: rulerPosition.x,
      startY: rulerPosition.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      const dx = e.clientX - dragStartRef.current.mouseX;
      const dy = e.clientY - dragStartRef.current.mouseY;
      setRulerPosition({
        x: Math.round(dragStartRef.current.startX + dx),
        y: Math.round(dragStartRef.current.startY + dy),
      });
    } else if (isResizing) {
      const dx = e.clientX - resizeStartRef.current.mouseX;
      const newWidth = Math.max(300, Math.min(1000, Math.round(resizeStartRef.current.startWidth + dx)));
      setRulerWidth(newWidth);
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  // Resize ruler length
  const handleResizeStart = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    resizeStartRef.current = {
      mouseX: e.clientX,
      startWidth: rulerWidth,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  // Rotate ruler with magnetic snapping
  const handleRotate = (deltaDeg: number) => {
    let next = (rulerAngle + deltaDeg) % 360;
    if (next < 0) next += 360;

    // Common technical angles snap
    const snaps = [0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330, 360];
    for (const snap of snaps) {
      if (Math.abs(next - snap) < 3.5) {
        next = snap === 360 ? 0 : snap;
        break;
      }
    }
    setRulerAngle(Math.round(next));
  };

  // Generate top edge tick marks based on active measurement unit
  const topTicks = useMemo(() => {
    const ticks: React.ReactNode[] = [];
    let stepPx = PX_PER_CM;
    let labelMultiplier = 1;
    let subTickCount = 10;

    if (rulerUnit === 'cm') {
      stepPx = PX_PER_CM;
      labelMultiplier = 1;
      subTickCount = 10;
    } else if (rulerUnit === 'mm') {
      stepPx = PX_PER_MM * 10; // Major mark every 10mm
      labelMultiplier = 10;
      subTickCount = 10;
    } else if (rulerUnit === 'in') {
      stepPx = PX_PER_IN;
      labelMultiplier = 1;
      subTickCount = 16;
    } else {
      // px
      stepPx = 50;
      labelMultiplier = 50;
      subTickCount = 5;
    }

    const maxUnits = Math.floor(rulerWidth / stepPx);

    for (let u = 0; u <= maxUnits; u++) {
      const x = u * stepPx;
      const labelText = u * labelMultiplier;

      // Major unit mark
      ticks.push(
        <div
          key={`maj_${u}`}
          className="absolute top-0 flex flex-col items-center pointer-events-none"
          style={{ left: `${x}px` }}
        >
          <div className="w-[1.5px] h-4.5 bg-slate-800 dark:bg-slate-200" />
          <span className="text-[9px] font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5 select-none leading-none">
            {labelText}
          </span>
        </div>
      );

      // Sub-ticks
      if (u < maxUnits) {
        for (let sub = 1; sub < subTickCount; sub++) {
          const subX = x + (sub * stepPx) / subTickCount;
          const isMid = sub === subTickCount / 2;
          ticks.push(
            <div
              key={`sub_${u}_${sub}`}
              className="absolute top-0 pointer-events-none"
              style={{
                left: `${subX}px`,
                width: '1px',
                height: isMid ? '10px' : '5px',
                backgroundColor: isMid ? 'rgba(71, 85, 105, 0.9)' : 'rgba(100, 116, 139, 0.5)',
              }}
            />
          );
        }
      }
    }

    return ticks;
  }, [rulerWidth, rulerUnit]);

  // Bottom edge sub-ticks
  const bottomTicks = useMemo(() => {
    const ticks: React.ReactNode[] = [];
    const step = 20;
    const count = Math.floor(rulerWidth / step);
    for (let i = 0; i <= count; i++) {
      const x = i * step;
      const isFive = i % 5 === 0;
      ticks.push(
        <div
          key={`bot_${i}`}
          className="absolute bottom-0 pointer-events-none"
          style={{
            left: `${x}px`,
            width: '1px',
            height: isFive ? '8px' : '4px',
            backgroundColor: isFive ? 'rgba(99, 102, 241, 0.8)' : 'rgba(148, 163, 184, 0.4)',
          }}
        />
      );
    }
    return ticks;
  }, [rulerWidth]);

  // Stamp straight line along ruler top edge
  const handleStampStraightLine = (e: React.MouseEvent) => {
    e.stopPropagation();
    const { topStart, topEnd } = getRulerEdgeSegments(rulerPosition, rulerWidth, rulerHeight, rulerAngle);
    const stroke = createRulerStraightStroke(topStart, topEnd, toolSettings.color, toolSettings.size);
    addStrokeToCurrentPage(stroke);

    setToastMessage(`📏 ${formatRulerMeasurement(rulerWidth, rulerUnit)} Çizgi Çizildi`);
    setTimeout(() => setToastMessage(null), 1800);
  };

  // Stamp architectural dimension callout
  const handleStampDimensionCallout = (e: React.MouseEvent) => {
    e.stopPropagation();
    const { topStart, topEnd } = getRulerEdgeSegments(rulerPosition, rulerWidth, rulerHeight, rulerAngle);
    const { strokes, text, x, y } = createRulerDimensionCallout(
      topStart,
      topEnd,
      rulerUnit,
      toolSettings.color || '#4f46e5',
      toolSettings.size || 2.0
    );

    strokes.forEach((s) => addStrokeToCurrentPage(s));
    addTextAnnotation(activePageIndex, x, y, text);

    setToastMessage(`📐 ${formatRulerMeasurement(rulerWidth, rulerUnit)} Ölçü Etiketi Eklendi`);
    setTimeout(() => setToastMessage(null), 1800);
  };

  return (
    <div
      className="absolute z-40 select-none touch-none filter drop-shadow-2xl transition-transform"
      style={{
        left: `${rulerPosition.x}px`,
        top: `${rulerPosition.y}px`,
        width: `${rulerWidth}px`,
        height: `${rulerHeight}px`,
        transform: `rotate(${rulerAngle}deg)`,
        transformOrigin: 'center center',
      }}
    >
      {/* Acrylic Glass Ruler Body */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="w-full h-full bg-white/80 dark:bg-slate-900/85 backdrop-blur-md rounded-2xl border border-white/80 dark:border-slate-700/80 shadow-2xl relative overflow-visible flex items-center justify-between px-3 cursor-grab active:cursor-grabbing ring-1 ring-black/10"
      >
        {/* Top Edge Ticks */}
        <div className="absolute top-0 left-0 right-0 h-6 pointer-events-none overflow-hidden">
          {topTicks}
        </div>

        {/* Bottom Edge Ticks */}
        <div className="absolute bottom-0 left-0 right-0 h-3 pointer-events-none overflow-hidden">
          {bottomTicks}
        </div>

        {/* Center HUD & Control Strip */}
        <div
          className="mx-auto flex items-center gap-1.5 bg-slate-900/90 text-white px-2.5 py-1.5 rounded-xl border border-slate-700/90 shadow-xl z-20 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {/* Angle Display & Stepper */}
          <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-700/60">
            <Compass size={13} className="text-indigo-400" />
            <span className="font-mono text-xs font-bold tracking-tight text-white min-w-[32px] text-center">
              {Math.round(rulerAngle)}°
            </span>
            <button
              type="button"
              onClick={() => handleRotate(-1)}
              className="px-1 text-[10px] text-slate-300 hover:text-white hover:bg-slate-700 rounded font-mono"
              title="-1° İnce Ayar"
            >
              -1°
            </button>
            <button
              type="button"
              onClick={() => handleRotate(1)}
              className="px-1 text-[10px] text-slate-300 hover:text-white hover:bg-slate-700 rounded font-mono"
              title="+1° İnce Ayar"
            >
              +1°
            </button>
            <button
              type="button"
              onClick={() => setRulerAngle(0)}
              className="px-1 text-[10px] text-amber-400 hover:bg-slate-700 rounded font-mono"
              title="Açıyı Sıfırla (0°)"
            >
              0°
            </button>
          </div>

          {/* Live Measurement Length HUD */}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-950/60 border border-indigo-500/40 text-indigo-300 font-mono text-xs font-bold">
            <span>📏</span>
            <span>{formatRulerMeasurement(rulerWidth, rulerUnit)}</span>
          </div>

          {/* Unit Switcher */}
          <div className="flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-slate-700/70 text-[10px] font-mono">
            {(['cm', 'mm', 'in', 'px'] as RulerUnit[]).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setRulerUnit(u)}
                className={`px-1.5 py-0.5 rounded uppercase font-bold transition-all ${
                  rulerUnit === u
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {u}
              </button>
            ))}
          </div>

          {/* Magnetic Edge Snap Toggle */}
          <button
            type="button"
            onClick={toggleRulerEdgeSnap}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-medium transition-all ${
              rulerEdgeSnap
                ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Kalem çizimlerini cetvel kenarına manyetik olarak kilitle"
          >
            <Magnet size={12} className={rulerEdgeSnap ? 'text-emerald-400' : 'text-slate-400'} />
            <span className="hidden sm:inline">Manyetik</span>
          </button>

          {/* Stamp Straight Line Action */}
          <button
            type="button"
            onClick={handleStampStraightLine}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-medium shadow-sm transition-colors"
            title="Cetvel boyunca düz çizgi çiz"
          >
            <PenTool size={11} />
            <span className="hidden sm:inline">Çizgi Çiz</span>
          </button>

          {/* Stamp Dimension Callout Action */}
          <button
            type="button"
            onClick={handleStampDimensionCallout}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-amber-300 border border-slate-750 text-[11px] font-medium transition-colors"
            title="Ölçülendirme çizgisi ve uzunluk etiketi damgala"
          >
            <Tag size={11} />
            <span className="hidden sm:inline">Ölçülendir</span>
          </button>

          {/* Close Ruler Button */}
          <button
            type="button"
            onClick={toggleRuler}
            className="p-1 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors ml-0.5"
            title="Cetveli Gizle"
          >
            <X size={14} />
          </button>
        </div>

        {/* Right Edge Resize Handle */}
        <div
          onPointerDown={handleResizeStart}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="resize-handle absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-12 rounded-full bg-slate-800 hover:bg-indigo-600 border border-white/60 shadow-lg cursor-ew-resize flex items-center justify-center text-white text-[9px] transition-colors group z-30"
          title="Cetvel boyunu uzatmak / kısaltmak için sürükleyin"
        >
          <div className="w-0.5 h-6 bg-slate-400 group-hover:bg-white rounded-full" />
        </div>
      </div>

      {/* Floating Status Toast */}
      {toastMessage && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900/95 text-white text-xs px-3 py-1 rounded-xl shadow-xl border border-slate-700/80 font-mono flex items-center gap-1.5 animate-in fade-in z-50">
          <Check size={12} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
