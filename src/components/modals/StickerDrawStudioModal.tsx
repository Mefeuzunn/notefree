import React, { useState, useRef, useEffect } from 'react';
import { useNotebookStore } from '../../store/notebookStore';
import { StickerItem } from '../../types/notebook';
import { triggerHaptic } from '../../engine/hapticFeedback';
import {
  Paintbrush,
  X,
  RotateCcw,
  Sparkles,
  Download,
  Trash2,
  Check,
  Smile,
  Type,
  PenTool,
  Highlighter,
  Eraser,
  BookmarkPlus,
} from 'lucide-react';

const PALETTE = [
  '#0f172a', // Slate black
  '#dc2626', // Red
  '#ea580c', // Orange
  '#d97706', // Amber
  '#16a34a', // Green
  '#0284c7', // Sky Blue
  '#4f46e5', // Indigo
  '#9333ea', // Purple
  '#db2777', // Pink
  '#ffffff', // White
];

const EMOJI_PRESETS = [
  '⭐', '💡', '🚀', '🔥', '🎯', '💯', '✅', '⚠️', '🧠', '🔬', '📚', '🏆', '📌', '❤️', '🎉', '⚡'
];

export const StickerDrawStudioModal: React.FC = () => {
  const {
    stickerCreatorModalOpen,
    setStickerCreatorModalOpen,
    addStickerToCurrentPage,
    addCustomSticker,
  } = useNotebookStore();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const [activeTool, setActiveTool] = useState<'pen' | 'highlighter' | 'eraser'>('pen');
  const [activeColor, setActiveColor] = useState('#4f46e5');
  const [brushSize, setBrushSize] = useState(4);
  const [stickerName, setStickerName] = useState('Özel Çizim Çıkartma');
  const [emojiInput, setEmojiInput] = useState('');

  // Setup canvas with high DPR and transparent background
  useEffect(() => {
    if (!stickerCreatorModalOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const size = 300;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);
  }, [stickerCreatorModalOpen]);

  if (!stickerCreatorModalOpen) return null;

  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = 300 / rect.width;
    const scaleY = 300 / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    try {
      (e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId);
    } catch (_) {}
    isDrawingRef.current = true;
    const pt = getCanvasCoords(e);
    lastPointRef.current = pt;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.arc(pt.x, pt.y, brushSize / 2, 0, Math.PI * 2);
    if (activeTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fill();
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = activeTool === 'highlighter' ? `${activeColor}60` : activeColor;
      ctx.fill();
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !lastPointRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const pt = getCanvasCoords(e);

    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(pt.x, pt.y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = activeTool === 'highlighter' ? brushSize * 2.2 : brushSize;

    if (activeTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.stroke();
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = activeTool === 'highlighter' ? `${activeColor}60` : activeColor;
      ctx.stroke();
    }

    lastPointRef.current = pt;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    try {
      (e.currentTarget as HTMLCanvasElement).releasePointerCapture(e.pointerId);
    } catch (_) {}
    isDrawingRef.current = false;
    lastPointRef.current = null;
  };

  const handleClear = () => {
    triggerHaptic('light');
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, 300, 300);
  };

  // Stamp Emoji directly into center of canvas
  const handleStampEmoji = (emoji: string) => {
    triggerHaptic('light');
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.globalCompositeOperation = 'source-over';
    ctx.font = '68px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 150, 150);
  };

  // Export Drawing to transparent DataURL
  const exportCanvasDataUrl = (): string => {
    const canvas = canvasRef.current;
    if (!canvas) return '';
    return canvas.toDataURL('image/png');
  };

  const handleSaveToCollection = () => {
    triggerHaptic('success');
    const dataUrl = exportCanvasDataUrl();
    if (!dataUrl) return;

    const newSticker: StickerItem = {
      id: `sticker_drawn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: stickerName.trim() || 'Özel Çıkartma',
      category: 'custom',
      content: `<img src="${dataUrl}" style="max-width:100%; max-height:100%; object-fit:contain;" />`,
      width: 140,
      height: 140,
    };

    addCustomSticker(newSticker);
    setStickerCreatorModalOpen(false);
  };

  const handleStampToPage = () => {
    triggerHaptic('success');
    const dataUrl = exportCanvasDataUrl();
    if (!dataUrl) return;

    const newSticker: StickerItem = {
      id: `sticker_drawn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: stickerName.trim() || 'Özel Çıkartma',
      category: 'custom',
      content: `<img src="${dataUrl}" style="max-width:100%; max-height:100%; object-fit:contain;" />`,
      width: 140,
      height: 140,
    };

    addStickerToCurrentPage(newSticker);
    setStickerCreatorModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md select-none animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-850 border-b border-slate-750 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
              <Paintbrush size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 truncate">
                <span className="truncate">Özel Çıkartma Çizim Stüdyosu</span>
                <span className="hidden sm:inline text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-mono font-semibold">
                  Faz AC
                </span>
              </h2>
              <p className="hidden sm:block text-xs text-slate-400 truncate">
                Şeffaf arka planlı kişisel çıkartmalar, rozetler ve çizimler üretip kaydedin
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic('light');
              setStickerCreatorModalOpen(false);
            }}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body: Split Left (Canvas) and Right (Tools) */}
        <div className="flex-1 flex flex-col sm:flex-row p-4 sm:p-6 gap-4 sm:gap-6 overflow-y-auto">
          {/* Left Canvas (Transparent Checkerboard Grid) */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-[280px] h-[280px] rounded-2xl border-2 border-dashed border-slate-700 shadow-xl overflow-hidden bg-[radial-gradient(#334155_1.2px,transparent_1.2px)] [background-size:14px_14px] bg-slate-950">
              <canvas
                ref={canvasRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className="w-full h-full cursor-crosshair touch-none select-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full justify-between">
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-rose-400 rounded-xl text-xs font-semibold transition-colors border border-slate-700"
              >
                <Trash2 size={13} />
                <span>Temizle</span>
              </button>

              <span className="text-[11px] text-slate-500 font-mono">280 x 280 px (Şeffaf)</span>
            </div>
          </div>

          {/* Right Tools Panel */}
          <div className="flex-1 flex flex-col space-y-4">
            {/* Sticker Name */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Çıkartma Adı</label>
              <input
                type="text"
                value={stickerName}
                onChange={(e) => setStickerName(e.target.value)}
                placeholder="Örn: Yıldız Rozeti, Formül Notu"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Tool Selector */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">Çizim Aracı</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setActiveTool('pen');
                  }}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                    activeTool === 'pen'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-bold'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <PenTool size={13} />
                  <span>Kalem</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setActiveTool('highlighter');
                  }}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                    activeTool === 'highlighter'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-bold'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <Highlighter size={13} />
                  <span>Fosforlu</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setActiveTool('eraser');
                  }}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                    activeTool === 'eraser'
                      ? 'bg-rose-500 text-white border-rose-400 shadow-md font-bold'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <Eraser size={13} />
                  <span>Silgi</span>
                </button>
              </div>
            </div>

            {/* Brush Size Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-1">
                <span>Fırça Boyutu:</span>
                <span className="font-mono text-amber-400">{brushSize}px</span>
              </div>
              <input
                type="range"
                min="1"
                max="24"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Color Palette */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">Renk</label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setActiveColor(c);
                    }}
                    className={`w-6 h-6 rounded-full border transition-all flex items-center justify-center ${
                      activeColor === c ? 'scale-125 border-white ring-2 ring-amber-500' : 'border-slate-700 hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {activeColor === c && <Check size={11} className={c === '#ffffff' ? 'text-slate-900' : 'text-white'} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Emoji Stamp Bar */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">Hızlı Emoji Damgala</label>
              <div className="grid grid-cols-8 gap-1 p-2 bg-slate-800/80 rounded-xl border border-slate-700">
                {EMOJI_PRESETS.map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => handleStampEmoji(em)}
                    className="p-1 hover:scale-125 text-base transition-transform text-center"
                    title={`Damgala: ${em}`}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-850 border-t border-slate-750 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleSaveToCollection}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
          >
            <BookmarkPlus size={15} />
            <span className="hidden xs:inline">Koleksiyonuma </span><span>Kaydet</span>
          </button>

          <button
            type="button"
            onClick={handleStampToPage}
            className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs px-3.5 sm:px-5 py-2 rounded-xl shadow-lg shadow-amber-500/20 hover:scale-105 transition-all"
          >
            <Sparkles size={16} />
            <span className="hidden xs:inline">Tuvale </span><span>Damgala</span>
          </button>
        </div>
      </div>
    </div>
  );
};
