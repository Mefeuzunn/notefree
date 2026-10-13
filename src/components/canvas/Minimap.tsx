import React, { useRef, useEffect, useState } from 'react';
import { Stroke } from '../../types/notebook';
import { useNotebookStore } from '../../store/notebookStore';
import { Map, Maximize2, Minimize2, Compass, Move } from 'lucide-react';

interface MinimapProps {
  strokes: Stroke[];
  viewportWidth?: number;
  viewportHeight?: number;
  canvasWidth?: number;
  canvasHeight?: number;
}

export const Minimap: React.FC<MinimapProps> = ({
  strokes,
  viewportWidth = 800,
  viewportHeight = 600,
  canvasWidth = 1600,
  canvasHeight = 1200,
}) => {
  const { infinitePan, setInfinitePan, resetInfinitePan, zoom, setZoom } = useNotebookStore();
  const [collapsed, setCollapsed] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const MAP_WIDTH = 150;
  const MAP_HEIGHT = 100;

  // Calculate bounding rectangle of all strokes
  const getBounds = () => {
    if (strokes.length === 0) {
      return { minX: 0, minY: 0, maxX: canvasWidth, maxY: canvasHeight };
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

    // Add margin around content
    const pad = 120;
    minX = Math.min(minX - pad, 0);
    minY = Math.min(minY - pad, 0);
    maxX = Math.max(maxX + pad, canvasWidth);
    maxY = Math.max(maxY + pad, canvasHeight);

    return { minX, minY, maxX, maxY };
  };

  const bounds = getBounds();
  const worldW = bounds.maxX - bounds.minX;
  const worldH = bounds.maxY - bounds.minY;
  const scaleX = MAP_WIDTH / worldW;
  const scaleY = MAP_HEIGHT / worldH;
  const scale = Math.min(scaleX, scaleY);

  useEffect(() => {
    if (collapsed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

    // Draw dark background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

    // Draw world border
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

    // Render miniature strokes
    for (const stroke of strokes) {
      if (stroke.points.length < 2) continue;
      ctx.beginPath();
      const firstX = (stroke.points[0].x - bounds.minX) * scale;
      const firstY = (stroke.points[0].y - bounds.minY) * scale;
      ctx.moveTo(firstX, firstY);

      for (let i = 1; i < stroke.points.length; i++) {
        const px = (stroke.points[i].x - bounds.minX) * scale;
        const py = (stroke.points[i].y - bounds.minY) * scale;
        ctx.lineTo(px, py);
      }

      ctx.strokeStyle = stroke.color || '#94a3b8';
      ctx.lineWidth = Math.max(1, (stroke.size || 2) * scale * 0.8);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }

    // Draw Viewport indicator rectangle
    const vpW = (viewportWidth / zoom) * scale;
    const vpH = (viewportHeight / zoom) * scale;
    const vpX = (-infinitePan.x - bounds.minX) * scale;
    const vpY = (-infinitePan.y - bounds.minY) * scale;

    ctx.fillStyle = 'rgba(99, 102, 241, 0.15)';
    ctx.fillRect(vpX, vpY, vpW, vpH);

    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(vpX, vpY, vpW, vpH);
  }, [strokes, infinitePan, zoom, viewportWidth, viewportHeight, bounds.minX, bounds.minY, scale, collapsed]);

  // Click on minimap to jump viewport
  const handleMinimapClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const targetWorldX = clickX / scale + bounds.minX;
    const targetWorldY = clickY / scale + bounds.minY;

    setInfinitePan({
      x: -(targetWorldX - (viewportWidth / zoom) / 2),
      y: -(targetWorldY - (viewportHeight / zoom) / 2),
    });
  };

  // Center on drawings
  const handleFitToContent = () => {
    resetInfinitePan();
  };

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="fixed bottom-5 right-36 z-30 p-2.5 bg-slate-900/90 hover:bg-slate-800 text-indigo-400 border border-slate-800 rounded-2xl shadow-xl transition-all flex items-center gap-1.5 text-xs font-semibold"
        title="Mini Haritayı Aç"
      >
        <Map size={15} />
        <span className="hidden sm:inline">Mini Harita</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-36 z-30 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl p-2.5 flex flex-col gap-2 select-none animate-in fade-in duration-150">
      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 px-1">
        <span className="flex items-center gap-1 text-slate-300">
          <Compass size={13} className="text-indigo-400" />
          Mini Harita
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={handleFitToContent}
            className="p-1 hover:text-white rounded hover:bg-slate-800 transition-colors"
            title="Merkeze Dön"
          >
            <Maximize2 size={12} />
          </button>
          <button
            onClick={() => setCollapsed(true)}
            className="p-1 hover:text-white rounded hover:bg-slate-800 transition-colors"
            title="Küçült"
          >
            <Minimize2 size={12} />
          </button>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={MAP_WIDTH}
        height={MAP_HEIGHT}
        onClick={handleMinimapClick}
        className="rounded-xl cursor-crosshair border border-slate-800 shadow-inner"
        title="Tıklayarak tuvalde o bölgeye atlayın"
      />

      <div className="flex items-center justify-between text-[10px] text-slate-500 px-1 font-mono">
        <span>X: {Math.round(-infinitePan.x)}</span>
        <span>Y: {Math.round(-infinitePan.y)}</span>
        <span>%{Math.round(zoom * 100)}</span>
      </div>
    </div>
  );
};
