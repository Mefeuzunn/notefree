import React, { useState, useRef } from 'react';
import { useNotebookStore } from '../../store/notebookStore';
import { X, RotateCw, Compass, Crosshair } from 'lucide-react';

interface ProtractorProps {
  scale?: number;
}

export const Protractor: React.FC<ProtractorProps> = () => {
  const { protractorVisible, toggleProtractor, protractorAngle, setProtractorAngle } =
    useNotebookStore();

  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 260, y: 320 });
  const [isDragging, setIsDragging] = useState(false);
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

  if (!protractorVisible) return null;

  const size = 380; // Diameter in pixels
  const center = size / 2;
  const radius = center - 16;

  // Reposition dragging
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only drag if not clicking a button or rotation handle
    if ((e.target as HTMLElement).closest('button, .rotate-handle')) return;
    e.stopPropagation();
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: position.x,
      startY: position.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      const dx = e.clientX - dragStartRef.current.mouseX;
      const dy = e.clientY - dragStartRef.current.mouseY;
      setPosition({
        x: dragStartRef.current.startX + dx,
        y: dragStartRef.current.startY + dy,
      });
    } else if (isRotating && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const originX = rect.left + rect.width / 2;
      const originY = rect.top + rect.height / 2;
      const currentPointerAngle =
        (Math.atan2(e.clientY - originY, e.clientX - originX) * 180) / Math.PI;

      let delta = currentPointerAngle - rotateStartRef.current.startPointerAngle;
      let nextAngle = (rotateStartRef.current.initialAngle + delta) % 360;
      if (nextAngle < 0) nextAngle += 360;

      // 15° magnetic snap
      const snapInterval = 15;
      const closestSnap = Math.round(nextAngle / snapInterval) * snapInterval;
      if (Math.abs(nextAngle - closestSnap) < 4) {
        nextAngle = closestSnap % 360;
      }

      setProtractorAngle(Math.round(nextAngle));
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setIsRotating(false);
  };

  // Rotation start
  const handleRotateStart = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsRotating(true);
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const originX = rect.left + rect.width / 2;
      const originY = rect.top + rect.height / 2;
      const pointerAngle =
        (Math.atan2(e.clientY - originY, e.clientX - originX) * 180) / Math.PI;

      rotateStartRef.current = {
        initialAngle: protractorAngle,
        startPointerAngle: pointerAngle,
      };
    }
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  // Step angle
  const stepAngle = (delta: number) => {
    let next = (protractorAngle + delta) % 360;
    if (next < 0) next += 360;
    setProtractorAngle(next);
  };

  // Generate degree tick marks (0..359)
  const ticks = [];
  const numbers = [];
  for (let deg = 0; deg < 360; deg += 1) {
    const isMajor = deg % 30 === 0;
    const isMid = deg % 10 === 0 && !isMajor;
    const isSemi = deg % 5 === 0 && !isMid && !isMajor;

    // Only draw ticks every 5 degrees to keep SVG ultra performant
    if (deg % 5 === 0) {
      const tickLength = isMajor ? 14 : isMid ? 10 : 6;
      const rad = ((deg - 90) * Math.PI) / 180;
      const x1 = center + radius * Math.cos(rad);
      const y1 = center + radius * Math.sin(rad);
      const x2 = center + (radius - tickLength) * Math.cos(rad);
      const y2 = center + (radius - tickLength) * Math.sin(rad);

      ticks.push(
        <line
          key={`tick_${deg}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={isMajor ? '#4338ca' : isMid ? '#64748b' : '#94a3b8'}
          strokeWidth={isMajor ? 1.8 : 1}
        />
      );

      // Degree labels every 30 degrees
      if (isMajor) {
        const textRadius = radius - 24;
        const tx = center + textRadius * Math.cos(rad);
        const ty = center + textRadius * Math.sin(rad);
        numbers.push(
          <text
            key={`lbl_${deg}`}
            x={tx}
            y={ty}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="10"
            fontWeight="bold"
            fill="#334155"
            className="select-none font-mono"
          >
            {deg}°
          </text>
        );
      }
    }
  }

  return (
    <div
      ref={containerRef}
      className="absolute z-40 select-none touch-none filter drop-shadow-2xl transition-transform"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size}px`,
        height: `${size}px`,
        transform: `rotate(${protractorAngle}deg)`,
        transformOrigin: 'center center',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* 360 Acrylic Glass Protractor Circle */}
      <div className="w-full h-full rounded-full bg-white/75 dark:bg-slate-900/80 backdrop-blur-md border border-white/80 dark:border-slate-700 shadow-2xl relative flex items-center justify-center cursor-grab active:cursor-grabbing ring-1 ring-black/5 overflow-hidden">
        {/* SVG Dial */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* Outer circle line */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="1.5"
          />
          {/* Inner ring */}
          <circle
            cx={center}
            cy={center}
            r={radius - 14}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="1"
          />
          {/* Center Crosshair Lines */}
          <line
            x1={center - 30}
            y1={center}
            x2={center + 30}
            y2={center}
            stroke="#6366f1"
            strokeWidth="1.5"
            strokeDasharray="2,2"
          />
          <line
            x1={center}
            y1={center - 30}
            x2={center}
            y2={center + 30}
            stroke="#6366f1"
            strokeWidth="1.5"
            strokeDasharray="2,2"
          />
          {/* Center point */}
          <circle cx={center} cy={center} r="3" fill="#4f46e5" />

          {/* Dynamic 0-to-Angle Indicator Needle */}
          <line
            x1={center}
            y1={center}
            x2={center}
            y2={center - radius}
            stroke="#ef4444"
            strokeWidth="2"
          />
          <polygon
            points={`${center - 4},${center - radius + 10} ${center + 4},${center - radius + 10} ${center},${center - radius}`}
            fill="#ef4444"
          />

          {ticks}
          {numbers}
        </svg>

        {/* Center Angle Display Pill */}
        <div
          className="relative z-10 flex flex-col items-center justify-center bg-slate-900/90 text-white px-3 py-2 rounded-2xl shadow-xl border border-slate-700/80 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Compass size={13} className="text-indigo-400" />
            <span className="font-mono text-sm font-bold tracking-tight">
              {Math.round(protractorAngle)}°
            </span>
          </div>

          {/* Quick preset buttons */}
          <div className="flex items-center gap-1">
            {[0, 45, 90, 180].map((preset) => (
              <button
                key={preset}
                onClick={() => setProtractorAngle(preset)}
                className={`text-[9px] px-1.5 py-0.5 rounded font-mono transition-colors ${
                  protractorAngle === preset
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {preset}°
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 mt-1.5 pt-1 border-t border-slate-800 w-full justify-center">
            <button
              onClick={() => stepAngle(-5)}
              className="text-[10px] text-slate-400 hover:text-white px-1"
              title="-5°"
            >
              -5°
            </button>
            <button
              onClick={() => stepAngle(5)}
              className="text-[10px] text-slate-400 hover:text-white px-1"
              title="+5°"
            >
              +5°
            </button>
          </div>
        </div>

        {/* Interactive Rotation Grip Handle on Outer Edge */}
        <div
          className="rotate-handle absolute top-2 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg cursor-grab active:cursor-grabbing hover:scale-110 transition-transform pointer-events-auto z-20"
          title="Döndürmek için sürükleyin"
          onPointerDown={handleRotateStart}
        >
          <RotateCw size={14} />
        </div>

        {/* Close Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleProtractor();
          }}
          className="absolute top-4 right-4 p-1.5 text-slate-500 hover:text-rose-500 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors z-20 pointer-events-auto"
          title="İletkiyi Kapat"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
};
