import React, { useState, useRef } from 'react';
import { useNotebookStore } from '../../store/notebookStore';
import { X, RotateCw, Circle, Move, Disc, Sparkles } from 'lucide-react';
import { Stroke, StrokePoint, StrokeBounds } from '../../types/notebook';
import { calculateStrokeBounds } from '../../engine/strokeRenderer';

interface CompassProps {
  scale?: number;
}

export const Compass: React.FC<CompassProps> = () => {
  const {
    compassVisible,
    toggleCompass,
    compassRadius,
    setCompassRadius,
    compassAngle,
    setCompassAngle,
    toolSettings,
    addStrokeToCurrentPage,
  } = useNotebookStore();

  const [centerPos, setCenterPos] = useState<{ x: number; y: number }>({ x: 340, y: 380 });
  const [isDraggingCenter, setIsDraggingCenter] = useState(false);
  const [isDraggingRadius, setIsDraggingRadius] = useState(false);
  const [isRotating, setIsRotating] = useState(false);

  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number }>({
    mouseX: 0,
    mouseY: 0,
    startX: 0,
    startY: 0,
  });

  const rotateStartRef = useRef<{ initialAngle: number; startPointerAngle: number }>({
    initialAngle: 0,
    startPointerAngle: 0,
  });

  const containerRef = useRef<HTMLDivElement>(null);

  if (!compassVisible) return null;

  // Move entire compass
  const handleCenterPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsDraggingCenter(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: centerPos.x,
      startY: centerPos.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDraggingCenter) {
      const dx = e.clientX - dragStartRef.current.mouseX;
      const dy = e.clientY - dragStartRef.current.mouseY;
      setCenterPos({
        x: dragStartRef.current.startX + dx,
        y: dragStartRef.current.startY + dy,
      });
    } else if (isRotating && containerRef.current) {
      const originX = centerPos.x;
      const originY = centerPos.y;
      const currentPointerAngle =
        (Math.atan2(e.clientY - originY, e.clientX - originX) * 180) / Math.PI;

      let delta = currentPointerAngle - rotateStartRef.current.startPointerAngle;
      let nextAngle = (rotateStartRef.current.initialAngle + delta) % 360;
      if (nextAngle < 0) nextAngle += 360;

      // 15° snap
      const snapInterval = 15;
      const closestSnap = Math.round(nextAngle / snapInterval) * snapInterval;
      if (Math.abs(nextAngle - closestSnap) < 4) {
        nextAngle = closestSnap % 360;
      }

      setCompassAngle(Math.round(nextAngle));
    }
  };

  const handlePointerUp = () => {
    setIsDraggingCenter(false);
    setIsDraggingRadius(false);
    setIsRotating(false);
  };

  const handleRotateStart = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsRotating(true);
    const originX = centerPos.x;
    const originY = centerPos.y;
    const pointerAngle =
      (Math.atan2(e.clientY - originY, e.clientX - originX) * 180) / Math.PI;

    rotateStartRef.current = {
      initialAngle: compassAngle,
      startPointerAngle: pointerAngle,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  // Stamp circle or arc onto the notebook page
  const drawCircleOnPage = (degrees: number = 360) => {
    const points: StrokePoint[] = [];
    const stepCount = Math.max(36, Math.round((degrees / 360) * 72));
    const startRad = (compassAngle * Math.PI) / 180;
    const sweepRad = (degrees * Math.PI) / 180;

    for (let i = 0; i <= stepCount; i++) {
      const t = i / stepCount;
      const currentRad = startRad + t * sweepRad;
      const x = centerPos.x + compassRadius * Math.cos(currentRad);
      const y = centerPos.y + compassRadius * Math.sin(currentRad);
      points.push({
        x: Math.round(x * 10) / 10,
        y: Math.round(y * 10) / 10,
        pressure: 0.8,
        timestamp: Date.now() + i * 2,
      });
    }

    const strokeId = `compass_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const bounds: StrokeBounds = calculateStrokeBounds(points, toolSettings.size);

    const newStroke: Stroke = {
      id: strokeId,
      tool: 'fineliner',
      color: toolSettings.color,
      size: toolSettings.size,
      points,
      bounds,
      timestamp: Date.now(),
    };

    addStrokeToCurrentPage(newStroke);
  };

  // Math metrics
  const radiusCm = (compassRadius / 37.8).toFixed(1); // 1cm ≈ 37.8px on standard 96dpi
  const circumference = (2 * Math.PI * (compassRadius / 37.8)).toFixed(1);
  const area = (Math.PI * Math.pow(compassRadius / 37.8, 2)).toFixed(1);

  // Position of pencil tip at current angle and radius
  const rad = (compassAngle * Math.PI) / 180;
  const pencilX = compassRadius * Math.cos(rad);
  const pencilY = compassRadius * Math.sin(rad);

  return (
    <div
      ref={containerRef}
      className="absolute z-40 select-none touch-none filter drop-shadow-2xl"
      style={{
        left: `${centerPos.x}px`,
        top: `${centerPos.y}px`,
      }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* 1. Orbit Guide Circle (Dotted trace) */}
      <svg
        className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2"
        style={{
          width: `${(compassRadius + 20) * 2}px`,
          height: `${(compassRadius + 20) * 2}px`,
          left: 0,
          top: 0,
        }}
        viewBox={`0 0 ${(compassRadius + 20) * 2} ${(compassRadius + 20) * 2}`}
      >
        <circle
          cx={compassRadius + 20}
          cy={compassRadius + 20}
          r={compassRadius}
          fill="none"
          stroke="#6366f1"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          className="opacity-70 animate-pulse"
        />
      </svg>

      {/* 2. Center Pivot Needle Node (Draggable Handle) */}
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900 border-2 border-indigo-500 shadow-2xl flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-110 transition-transform group"
        title="Merkez İğnesi (Pergeli taşımak için sürükleyin)"
        onPointerDown={handleCenterPointerDown}
      >
        <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 group-hover:bg-indigo-300" />
        <Move size={12} className="text-white/60 absolute group-hover:scale-125 transition-transform" />
      </div>

      {/* 3. Compass Mechanical Arm (Connecting Needle to Pencil Tip) */}
      <svg
        className="absolute pointer-events-none"
        style={{
          left: 0,
          top: 0,
          overflow: 'visible',
        }}
      >
        {/* Metallic Arm Line */}
        <line
          x1={0}
          y1={0}
          x2={pencilX}
          y2={pencilY}
          stroke="#4f46e5"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        {/* Inner high-precision bar */}
        <line
          x1={0}
          y1={0}
          x2={pencilX}
          y2={pencilY}
          stroke="#c7d2fe"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>

      {/* 4. Pencil Tip & Rotation / Radius Handle */}
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center group"
        style={{
          left: `${pencilX}px`,
          top: `${pencilY}px`,
        }}
      >
        {/* Rotating Grip Circle */}
        <div
          className="w-9 h-9 rounded-full bg-rose-600 border-2 border-white text-white shadow-xl flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-115 transition-transform"
          title="Kalem Ucu (Döndürmek için sürükleyin)"
          onPointerDown={handleRotateStart}
        >
          <RotateCw size={14} />
        </div>
      </div>

      {/* 5. Floating Compass Controls & Math Metrics Card */}
      <div
        className="absolute top-8 left-8 w-64 bg-slate-900/95 text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700/80 backdrop-blur-md z-30"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-1.5">
            <Disc size={15} className="text-indigo-400" />
            <h4 className="text-xs font-bold tracking-tight">Hassas Pergel (Compass)</h4>
          </div>
          <button
            onClick={toggleCompass}
            className="p-1 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
            title="Pergeli Kapat"
          >
            <X size={14} />
          </button>
        </div>

        {/* Live Metrics Display */}
        <div className="grid grid-cols-3 gap-1.5 py-2.5 text-center">
          <div className="bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/60">
            <span className="text-[9px] text-slate-400 block font-mono">Yarıçap (r)</span>
            <span className="text-xs font-bold text-indigo-300 font-mono">{radiusCm} cm</span>
          </div>
          <div className="bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/60">
            <span className="text-[9px] text-slate-400 block font-mono">Çevre (2πr)</span>
            <span className="text-xs font-bold text-emerald-300 font-mono">{circumference} cm</span>
          </div>
          <div className="bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/60">
            <span className="text-[9px] text-slate-400 block font-mono">Alan (πr²)</span>
            <span className="text-xs font-bold text-amber-300 font-mono">{area} cm²</span>
          </div>
        </div>

        {/* Radius Slider */}
        <div className="mb-3">
          <div className="flex justify-between text-[10px] text-slate-400 mb-1 font-mono">
            <span>Yarıçap Ayarı:</span>
            <span>{compassRadius} px</span>
          </div>
          <input
            type="range"
            min="30"
            max="350"
            value={compassRadius}
            onChange={(e) => setCompassRadius(parseInt(e.target.value, 10))}
            className="w-full h-1.5 accent-indigo-500 rounded-lg cursor-pointer bg-slate-700"
          />
          {/* Quick preset buttons */}
          <div className="flex justify-between mt-1 text-[9px] font-mono text-slate-400">
            {[60, 100, 140, 200, 260].map((pr) => (
              <button
                key={pr}
                onClick={() => setCompassRadius(pr)}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  compassRadius === pr
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {Math.round(pr / 37.8)}cm
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons to stamp onto canvas */}
        <div className="flex flex-col gap-1.5">
          <button
            onClick={() => drawCircleOnPage(360)}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-md shadow-indigo-600/30"
            title="Seçili renk ve kalınlıkta tam çember çizer"
          >
            <Circle size={13} className="fill-white/20" />
            <span>360° Tam Çember Çiz</span>
          </button>

          <div className="flex gap-1.5">
            <button
              onClick={() => drawCircleOnPage(180)}
              className="flex-1 py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-[11px] transition-colors border border-slate-700"
              title="180° Yarım Yay Çiz"
            >
              180° Yay
            </button>
            <button
              onClick={() => drawCircleOnPage(90)}
              className="flex-1 py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-[11px] transition-colors border border-slate-700"
              title="90° Dik Yay Çiz"
            >
              90° Yay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
