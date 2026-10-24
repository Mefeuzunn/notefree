import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNotebookStore } from '../../store/notebookStore';
import { Page } from '../../types/notebook';
import { drawPaperTemplate } from '../../engine/paperTemplates';
import { drawStrokeOnCanvas } from '../../engine/strokeRenderer';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Star,
  Plus,
  LayoutGrid,
  Bookmark,
} from 'lucide-react';
import { triggerHaptic } from '../../engine/hapticFeedback';

export interface MiniPagePreviewProps {
  page: Page;
  width?: number;
  height?: number;
  className?: string;
}

export const MiniPagePreview: React.FC<MiniPagePreviewProps> = ({ page, width = 84, height = 112, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const targetWidth = page.width || 800;
    const targetHeight = page.height || 1130;
    const scale = (width * 2) / targetWidth;

    ctx.save();
    ctx.scale(scale, scale);

    const drawStrokes = () => {
      if (page.strokes && page.strokes.length > 0) {
        page.strokes.forEach((stroke) => {
          drawStrokeOnCanvas(ctx, stroke);
        });
      }
    };

    if (page.backgroundImageUrl) {
      const img = new Image();
      img.src = page.backgroundImageUrl;
      img.onload = () => {
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        drawStrokes();
      };
    } else {
      drawPaperTemplate(
        ctx,
        targetWidth,
        targetHeight,
        page.template || 'lined',
        page.paperColor || 'white',
        page.customPitch,
        page.customLineColor,
        page.lineOpacity
      );
      drawStrokes();
    }

    ctx.restore();
  }, [page, width, height]);

  return (
    <div
      className={`rounded-lg bg-white overflow-hidden shadow-lg border border-slate-700/80 relative ${className}`}
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <canvas
        ref={canvasRef}
        width={width * 2}
        height={height * 2}
        className="w-full h-full object-cover pointer-events-none"
      />
    </div>
  );
};

export const PageScrubberBar: React.FC = () => {
  const {
    activeNotebookId,
    notebooks,
    activePageIndex,
    setActivePageIndex,
    addPage,
    togglePageBookmark,
    setPageManagerModalOpen,
    viewMode,
  } = useNotebookStore();

  const activeNotebook = notebooks.find((n) => n.id === activeNotebookId);
  const pages = activeNotebook?.pages || [];
  const totalPages = pages.length;

  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [isScrubbing, setIsScrubbing] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const trackRef = useRef<HTMLDivElement | null>(null);

  if (totalPages <= 1 || !activeNotebook) return null;

  const currentPage = pages[activePageIndex];
  const targetHoverPage = hoverIndex !== null && pages[hoverIndex] ? pages[hoverIndex] : null;

  // Calculate page index from mouse/touch event on track
  const getIndexFromPointer = (clientX: number): number => {
    if (!trackRef.current) return activePageIndex;
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.min(totalPages - 1, Math.floor(ratio * totalPages));
  };

  const jumpTo = (idx: number) => {
    if (idx >= 0 && idx < totalPages && idx !== activePageIndex) {
      triggerHaptic('light');
      setActivePageIndex(idx);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsScrubbing(true);
    const idx = getIndexFromPointer(e.clientX);
    setHoverIndex(idx);
    if (idx !== activePageIndex) {
      triggerHaptic('light');
      setActivePageIndex(idx);
    }
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isScrubbing) {
      e.stopPropagation();
      const idx = getIndexFromPointer(e.clientX);
      setHoverIndex(idx);
      if (idx !== activePageIndex) {
        triggerHaptic('light');
        setActivePageIndex(idx);
      }
    } else {
      const idx = getIndexFromPointer(e.clientX);
      setHoverIndex(idx);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isScrubbing) {
      e.stopPropagation();
      setIsScrubbing(false);
    }
  };

  const handleTrackLeave = () => {
    if (!isScrubbing) {
      setHoverIndex(null);
    }
  };

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 select-none flex flex-col items-center pointer-events-auto"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => {
        if (!isScrubbing) setIsExpanded(false);
      }}
    >
      {/* Floating Thumbnail Preview Popover */}
      {(isScrubbing || (isExpanded && hoverIndex !== null)) && targetHoverPage && (
        <div className="mb-3 flex flex-col items-center animate-in fade-in zoom-in-95 duration-100 drop-shadow-2xl pointer-events-none">
          <div className="bg-[#090d16]/95 text-white p-2.5 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-2xl flex flex-col items-center gap-1.5 ring-1 ring-white/10">
            <MiniPagePreview page={targetHoverPage} width={96} height={128} />
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-100">
              <span className="text-indigo-400">Sayfa {targetHoverPage.pageNumber}</span>
              <span className="text-slate-500">/</span>
              <span>{totalPages}</span>
              {targetHoverPage.isBookmarked && (
                <Star size={12} className="fill-amber-400 text-amber-400 ml-0.5" />
              )}
            </div>
            {targetHoverPage.title && (
              <span className="text-[10px] text-slate-400 max-w-[110px] truncate">
                {targetHoverPage.title}
              </span>
            )}
          </div>
          {/* Arrow pointing to scrubber track */}
          <div className="w-2.5 h-2.5 bg-[#090d16] border-r border-b border-white/10 rotate-45 -mt-1.5" />
        </div>
      )}

      {/* Main Scrubber Pill Bar */}
      <div className="bg-[#090d16]/90 text-white px-3 sm:px-4 py-2 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-2xl flex items-center gap-1.5 sm:gap-2.5 ring-1 ring-white/10 max-w-[94vw]">
        {/* Quick Jump: First Page */}
        <button
          onClick={() => jumpTo(0)}
          disabled={activePageIndex === 0}
          className={`p-1.5 rounded-xl transition-colors hidden sm:flex ${
            activePageIndex > 0
              ? 'text-slate-300 hover:text-white hover:bg-slate-800'
              : 'text-slate-600 cursor-not-allowed'
          }`}
          title="İlk Sayfaya Git (1)"
        >
          <ChevronsLeft size={15} />
        </button>

        {/* Previous Page */}
        <button
          onClick={() => jumpTo(activePageIndex - 1)}
          disabled={activePageIndex === 0}
          className={`p-1.5 rounded-xl transition-colors ${
            activePageIndex > 0
              ? 'text-slate-300 hover:text-white hover:bg-slate-800'
              : 'text-slate-600 cursor-not-allowed'
          }`}
          title="Önceki Sayfa"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Scrubber Slider Track */}
        <div
          ref={trackRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handleTrackLeave}
          className="relative w-24 xs:w-32 sm:w-60 h-6 flex items-center cursor-pointer group px-1"
          title="Kaydırarak sayfalar arasında hızla gezin"
        >
          {/* Track Line */}
          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-white/10">
            {/* Active progress bar */}
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-indigo-400 to-violet-400 transition-all duration-75 shadow-sm"
              style={{
                width: `${((activePageIndex + 1) / totalPages) * 100}%`,
              }}
            />
          </div>

          {/* Bookmarked dots along track */}
          {pages.map((p, pIdx) => {
            if (!p.isBookmarked) return null;
            const leftPct = (pIdx / (totalPages - 1 || 1)) * 100;
            return (
              <div
                key={`bm_dot_${p.id}`}
                className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-amber-400 pointer-events-none shadow-md shadow-amber-500/50"
                style={{ left: `${leftPct}%` }}
                title={`Sayfa ${p.pageNumber} Yer İmi`}
              />
            );
          })}

          {/* Draggable Scrubber Thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4.5 h-4.5 rounded-full bg-white border-2 border-indigo-600 shadow-xl group-hover:scale-125 transition-transform"
            style={{
              left: `${(activePageIndex / (totalPages - 1 || 1)) * 100}%`,
            }}
          />
        </div>

        {/* Next Page */}
        <button
          onClick={() => jumpTo(activePageIndex + 1)}
          disabled={activePageIndex >= totalPages - 1}
          className={`p-1.5 rounded-xl transition-colors ${
            activePageIndex < totalPages - 1
              ? 'text-slate-300 hover:text-white hover:bg-slate-800'
              : 'text-slate-600 cursor-not-allowed'
          }`}
          title="Sonraki Sayfa"
        >
          <ChevronRight size={16} />
        </button>

        {/* Quick Jump: Last Page */}
        <button
          onClick={() => jumpTo(totalPages - 1)}
          disabled={activePageIndex >= totalPages - 1}
          className={`p-1.5 rounded-xl transition-colors hidden sm:flex ${
            activePageIndex < totalPages - 1
              ? 'text-slate-300 hover:text-white hover:bg-slate-800'
              : 'text-slate-600 cursor-not-allowed'
          }`}
          title={`Son Sayfaya Git (${totalPages})`}
        >
          <ChevronsRight size={15} />
        </button>

        <div className="w-px h-5 bg-white/10 mx-1" />

        {/* Page Counter Badge */}
        <span className="text-xs font-mono font-bold text-indigo-300 min-w-[44px] text-center">
          {activePageIndex + 1}/{totalPages}
        </span>

        {/* Bookmark Star Toggle */}
        <button
          onClick={() => {
            triggerHaptic('light');
            togglePageBookmark(activePageIndex);
          }}
          className={`p-1.5 rounded-xl transition-colors ${
            currentPage?.isBookmarked
              ? 'text-amber-400 bg-amber-400/15'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title={currentPage?.isBookmarked ? 'Yer İmini Kaldır' : 'Bu Sayfayı Yer İmlerine Ekle'}
        >
          <Star size={14} className={currentPage?.isBookmarked ? 'fill-amber-400' : ''} />
        </button>

        {/* Add Page Button */}
        <button
          onClick={() => addPage()}
          className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-xl transition-colors"
          title="Sonrasına Yeni Sayfa Ekle"
        >
          <Plus size={16} />
        </button>

        {/* Open Page Grid Manager */}
        <button
          onClick={() => setPageManagerModalOpen(true)}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          title="Tüm Sayfaları Gör (Sayfa Yöneticisi)"
        >
          <LayoutGrid size={15} />
        </button>
      </div>
    </div>
  );
};
