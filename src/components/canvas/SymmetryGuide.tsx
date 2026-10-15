import React, { useRef, useState } from 'react';
import { useNotebookStore } from '../../store/notebookStore';
import { Columns, Rows, X, MoveHorizontal, MoveVertical, Sparkles } from 'lucide-react';

interface SymmetryGuideProps {
  pageWidth: number;
  pageHeight: number;
}

export const SymmetryGuide: React.FC<SymmetryGuideProps> = ({
  pageWidth,
  pageHeight,
}) => {
  const {
    symmetryEnabled,
    toggleSymmetry,
    symmetryAxis,
    setSymmetryAxis,
    symmetryPosition,
    setSymmetryPosition,
  } = useNotebookStore();

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startPos: number; startCoord: number }>({
    startPos: 0.5,
    startCoord: 0,
  });

  if (!symmetryEnabled) return null;

  const isVertical = symmetryAxis === 'vertical';
  const axisCoord = isVertical
    ? pageWidth * symmetryPosition
    : pageHeight * symmetryPosition;

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    dragStartRef.current = {
      startPos: symmetryPosition,
      startCoord: isVertical ? e.clientX : e.clientY,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const delta = (isVertical ? e.clientX : e.clientY) - dragStartRef.current.startCoord;
    const dimension = isVertical ? pageWidth : pageHeight;
    const newPos = dragStartRef.current.startPos + delta / dimension;
    setSymmetryPosition(newPos);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-20 overflow-hidden">
      {/* 1. Dotted Symmetry Axis Line */}
      <div
        className="absolute bg-indigo-500/80 transition-all pointer-events-none"
        style={
          isVertical
            ? {
                left: `${axisCoord}px`,
                top: 0,
                bottom: 0,
                width: '2px',
                backgroundImage:
                  'repeating-linear-gradient(to bottom, #6366f1 0, #6366f1 6px, transparent 6px, transparent 12px)',
                backgroundSize: '2px 100%',
              }
            : {
                top: `${axisCoord}px`,
                left: 0,
                right: 0,
                height: '2px',
                backgroundImage:
                  'repeating-linear-gradient(to right, #6366f1 0, #6366f1 6px, transparent 6px, transparent 12px)',
                backgroundSize: '100% 2px',
              }
        }
      />

      {/* 2. Interactive Control Pill at Center of Symmetry Line */}
      <div
        className="absolute pointer-events-auto -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 text-white border border-indigo-500/80 shadow-2xl backdrop-blur-md cursor-grab active:cursor-grabbing hover:scale-105 transition-transform"
        style={
          isVertical
            ? {
                left: `${axisCoord}px`,
                top: '40px',
              }
            : {
                left: '90px',
                top: `${axisCoord}px`,
              }
        }
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        title="Simetri Ekseni (Taşımak için sürükleyin)"
      >
        <span className="text-xs">🪞</span>
        <span className="font-mono text-[10px] font-bold text-indigo-300">
          {isVertical ? 'Dikey Ayna' : 'Yatay Ayna'} ({Math.round(symmetryPosition * 100)}%)
        </span>

        {/* Toggle Axis Orientation Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSymmetryAxis(isVertical ? 'horizontal' : 'vertical');
          }}
          className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          title="Yönü Değiştir (Dikey / Yatay)"
        >
          {isVertical ? <Rows size={12} /> : <Columns size={12} />}
        </button>

        {/* Center Reset Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSymmetryPosition(0.5);
          }}
          className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          title="Merkeze Sıfırla (%50)"
        >
          50%
        </button>

        {/* Close Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleSymmetry();
          }}
          className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
          title="Simetri Modunu Kapat"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
};
