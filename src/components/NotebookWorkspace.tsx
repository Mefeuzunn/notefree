import React, { useRef, useEffect } from 'react';
import { useNotebookStore } from '../store/notebookStore';
import { CanvasPage } from './canvas/CanvasPage';
import { YouTubePanel } from './youtube/YouTubePanel';
import { Ruler } from './canvas/Ruler';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize,
  AlertCircle,
  Columns,
  Square,
  Sparkles,
} from 'lucide-react';

export const NotebookWorkspace: React.FC = () => {
  const {
    notebooks,
    activeNotebookId,
    activePageIndex,
    setActivePageIndex,
    zoom,
    setZoom,
    resetView,
    viewMode,
    setViewMode,
    youtube,
    setYouTubeSplitRatio,
    setStickersDrawerOpen,
  } = useNotebookStore();

  const containerRef = useRef<HTMLDivElement | null>(null);

  const activeNotebook = notebooks.find((n) => n.id === activeNotebookId);
  const pages = activeNotebook?.pages || [];

  // Wheel zoom handler (Ctrl / Cmd + Wheel or trackpad pinch)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.08 : 0.08;
        setZoom(zoom + delta);
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [zoom, setZoom]);

  return (
    <div className="flex-1 flex overflow-hidden relative bg-slate-950">
      {/* 1. YouTube Panel (Split View Mode) */}
      {youtube.isOpen && youtube.mode === 'split' && (
        <>
          <YouTubePanel />
          {/* Draggable Divider to adjust Split Screen Ratio */}
          <div
            className="w-1.5 bg-slate-800 hover:bg-indigo-500 cursor-col-resize transition-colors relative z-20"
            title="Sürükleyerek ekran genişliğini ayarlayın"
            onMouseDown={(e) => {
              const startX = e.clientX;
              const startRatio = youtube.splitRatio;
              const onMouseMove = (moveEvent: MouseEvent) => {
                const totalWidth = window.innerWidth;
                const deltaRatio = (moveEvent.clientX - startX) / totalWidth;
                setYouTubeSplitRatio(startRatio + deltaRatio);
              };
              const onMouseUp = () => {
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
              };
              window.addEventListener('mousemove', onMouseMove);
              window.addEventListener('mouseup', onMouseUp);
            }}
          />
        </>
      )}

      {/* 2. Main Continuous Document Viewport */}
      <main
        ref={containerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col items-center justify-start py-8 px-4 relative select-none scroll-smooth"
      >
        {pages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <AlertCircle size={32} className="mb-2 text-slate-600" />
            <p className="text-sm">Görüntülenecek sayfa bulunamadı</p>
          </div>
        ) : viewMode === 'continuous' ? (
          /* Continuous Scroll: Stack of all pages */
          <div className="flex flex-col items-center gap-10 w-full max-w-full pb-32">
            {pages.map((pg, idx) => (
              <div key={pg.id} className="relative group">
                <CanvasPage
                  page={pg}
                  pageIndex={idx}
                  scale={zoom}
                  isCurrent={idx === activePageIndex}
                />
              </div>
            ))}
          </div>
        ) : (
          /* Single Page View */
          <div className="flex flex-col items-center pb-24">
            {pages[activePageIndex] && (
              <CanvasPage
                page={pages[activePageIndex]}
                pageIndex={activePageIndex}
                scale={zoom}
                isCurrent={true}
              />
            )}
          </div>
        )}

        {/* Floating Zoom & View Controls Dock (Bottom Left) */}
        <div className="fixed bottom-5 left-5 z-30 flex items-center bg-slate-900/90 backdrop-blur-md border border-slate-800/80 rounded-2xl px-2 py-1.5 shadow-2xl gap-1">
          <button
            onClick={() => setZoom(zoom - 0.1)}
            disabled={zoom <= 0.4}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 disabled:opacity-40"
            title="Uzaklaş"
          >
            <ZoomOut size={15} />
          </button>

          <span
            onClick={resetView}
            className="text-xs font-mono font-medium text-slate-300 px-2 cursor-pointer hover:text-indigo-400"
            title="Yakınlaştırmayı Sıfırla (%100)"
          >
            {Math.round(zoom * 100)}%
          </span>

          <button
            onClick={() => setZoom(zoom + 0.1)}
            disabled={zoom >= 3.0}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 disabled:opacity-40"
            title="Yakınlaş"
          >
            <ZoomIn size={15} />
          </button>

          <div className="w-px h-4 bg-slate-800 mx-1" />

          {/* Continuous Scroll vs Single Page Toggle */}
          <button
            onClick={() =>
              setViewMode(viewMode === 'continuous' ? 'single' : 'continuous')
            }
            className={`p-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
              viewMode === 'continuous'
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
            title={
              viewMode === 'continuous'
                ? 'Dikey Kesintisiz Akış Modu Açık (GoodNotes Stili)'
                : 'Tek Sayfa Modu'
            }
          >
            {viewMode === 'continuous' ? <Columns size={14} /> : <Square size={14} />}
            <span className="text-[10px] hidden sm:inline">
              {viewMode === 'continuous' ? 'Kesintisiz' : 'Tek Sayfa'}
            </span>
          </button>
        </div>

        {/* Floating Quick Elements Button (Bottom Right) */}
        <button
          onClick={() => setStickersDrawerOpen(true)}
          className="fixed bottom-5 right-5 z-30 flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-2xl shadow-xl shadow-amber-500/20 hover:scale-105 transition-all"
          title="Çıkartmalar ve Notlar Çekmecesi (Elements)"
        >
          <Sparkles size={16} />
          <span>Çıkartmalar</span>
        </button>

        {/* 🌟 Interactive GoodNotes Floating Ruler */}
        <Ruler scale={zoom} />
      </main>

      {/* 3. Floating Picture-in-Picture YouTube Panel */}
      {youtube.isOpen && youtube.mode === 'floating' && <YouTubePanel />}
    </div>
  );
};
