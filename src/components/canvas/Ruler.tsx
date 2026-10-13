import React, { useState, useRef, useEffect } from 'react';
import { useNotebookStore } from '../../store/notebookStore';
import { RotateCw, X, Compass } from 'lucide-react';

interface RulerProps {
  scale?: number;
}

export const Ruler: React.FC<RulerProps> = ({ scale = 1.0 }) => {
  const { rulerVisible, toggleRuler, rulerAngle, setRulerAngle } = useNotebookStore();

  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 180, y: 350 });
  const [isDragging, setIsDragging] = useState(false);
  const [isRotating, setIsRotating] = useState(false);

  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number }>({
    mouseX: 0,
    mouseY: 0,
    startX: 0,
    startY: 0,
  });

  if (!rulerVisible) return null;

  const rulerWidth = 600;
  const rulerHeight = 85;

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: position.x,
      startY: position.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.mouseX;
    const dy = e.clientY - dragStartRef.current.mouseY;
    setPosition({
      x: dragStartRef.current.startX + dx,
      y: dragStartRef.current.startY + dy,
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handleRotate = (deltaDeg: number) => {
    let next = (rulerAngle + deltaDeg) % 360;
    if (next < 0) next += 360;

    // Magnetic snap near common angles (0, 30, 45, 60, 90, 180)
    const snaps = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 315, 360];
    for (const snap of snaps) {
      if (Math.abs(next - snap) < 4) {
        next = snap === 360 ? 0 : snap;
        break;
      }
    }
    setRulerAngle(next);
  };

  // Generate tick marks (cm and mm)
  const ticks = [];
  const cmCount = 28;
  const pixelsPerCm = rulerWidth / cmCount;

  for (let cm = 0; cm <= cmCount; cm++) {
    const x = cm * pixelsPerCm;
    ticks.push(
      <div key={`cm_${cm}`} className="absolute top-0 flex flex-col items-center" style={{ left: `${x}px` }}>
        <div className="w-[1.5px] h-4 bg-slate-700/80 dark:bg-slate-300" />
        <span className="text-[9px] font-mono font-bold text-slate-750 dark:text-slate-300 mt-0.5 select-none">
          {cm}
        </span>
      </div>
    );
    // 5mm mark and mm sub-ticks
    if (cm < cmCount) {
      for (let mm = 1; mm < 10; mm++) {
        const mmX = x + (mm * pixelsPerCm) / 10;
        const isHalf = mm === 5;
        ticks.push(
          <div
            key={`mm_${cm}_${mm}`}
            className="absolute top-0 w-[1px] bg-slate-500/60"
            style={{
              left: `${mmX}px`,
              height: isHalf ? '10px' : '5px',
            }}
          />
        );
      }
    }
  }

  return (
    <div
      className="absolute z-40 select-none touch-none filter drop-shadow-2xl transition-transform"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
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
        className="w-full h-full bg-white/70 dark:bg-slate-900/80 backdrop-blur-md rounded-xl border border-white/60 dark:border-slate-700/80 shadow-2xl relative overflow-hidden flex items-center justify-between px-4 cursor-grab active:cursor-grabbing ring-1 ring-black/5"
      >
        {/* Top Ticks */}
        <div className="absolute top-0 left-4 right-4 h-6 pointer-events-none">{ticks}</div>

        {/* Center Angle Dial & Control Area */}
        <div className="mx-auto flex items-center gap-3 bg-slate-800/80 text-white px-3 py-1.5 rounded-full border border-slate-700/80 shadow-inner z-10">
          <Compass size={14} className="text-indigo-400" />
          <span className="font-mono text-xs font-bold tracking-wider">{Math.round(rulerAngle)}°</span>

          {/* Quick Rotate Buttons */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRotate(-45);
            }}
            className="p-1 hover:bg-slate-700 rounded-full text-slate-300 hover:text-white text-xs font-mono"
            title="-45° Çevir"
          >
            ↺
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRotate(45);
            }}
            className="p-1 hover:bg-slate-700 rounded-full text-slate-300 hover:text-white text-xs font-mono"
            title="+45° Çevir"
          >
            ↻
          </button>
        </div>

        {/* Close Ruler Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleRuler();
          }}
          className="absolute top-2 right-2 p-1 text-slate-500 hover:text-rose-500 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors z-20"
          title="Cetveli Gizle"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
};
