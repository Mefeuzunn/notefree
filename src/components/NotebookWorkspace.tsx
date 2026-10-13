import React, { useRef, useEffect } from 'react';
import { useNotebookStore } from '../store/notebookStore';
import { CanvasPage } from './canvas/CanvasPage';
import { YouTubePanel } from './youtube/YouTubePanel';
import { Ruler } from './canvas/Ruler';
import { InfiniteCanvas } from './canvas/InfiniteCanvas';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize,
  AlertCircle,
  Columns,
  Square,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  ArrowLeftRight,
  Book,
  GripVertical,
  Infinity,
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
    splitNotebook,
    setDualNotebookRatio,
    closeDualNotebook,
    setSecondaryPageIndex,
    openDualNotebook,
    setActiveNotebook,
    canvasMode,
    setCanvasMode,
  } = useNotebookStore();

  const containerRef = useRef<HTMLDivElement | null>(null);

  const activeNotebook = notebooks.find((n) => n.id === activeNotebookId);
  const pages = activeNotebook?.pages || [];

  const isSplit = splitNotebook.isOpen && !!splitNotebook.secondaryNotebookId;
  const secondaryNotebook = isSplit
    ? notebooks.find((n) => n.id === splitNotebook.secondaryNotebookId)
    : null;
  const secondaryPages = secondaryNotebook?.pages || [];
  const secondaryCurrentPage =
    secondaryPages[splitNotebook.secondaryPageIndex] || secondaryPages[0];

  // Swap active notebook with secondary notebook
  const handleSwapActive = () => {
    if (!splitNotebook.secondaryNotebookId || !activeNotebookId) return;
    const currentActive = activeNotebookId;
    const currentSec = splitNotebook.secondaryNotebookId;
    const currentSecIndex = splitNotebook.secondaryPageIndex;

    setActiveNotebook(currentSec);
    useNotebookStore.setState((state) => ({
      activePageIndex: currentSecIndex,
      splitNotebook: {
        ...state.splitNotebook,
        secondaryNotebookId: currentActive,
        secondaryPageIndex: state.activePageIndex,
      },
    }));
  };

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

      {/* 2. Main Workspaces Area (Single View or Dual Split View) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* === Left / Primary Notebook Pane === */}
        <main
          ref={containerRef}
          style={{
            width: isSplit && secondaryNotebook ? `${splitNotebook.splitRatio * 100}%` : '100%',
          }}
          className={`h-full relative select-none ${
            canvasMode === 'infinite'
              ? 'overflow-hidden flex flex-col'
              : 'overflow-y-auto overflow-x-hidden flex flex-col items-center justify-start py-8 px-4 scroll-smooth'
          }`}
        >
          {isSplit && secondaryNotebook && (
            <div className="w-full max-w-2xl mb-4 px-2 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
                <span className="font-semibold text-slate-200">
                  Ana Defter (Aktif): {activeNotebook?.title}
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                Sayfa {activePageIndex + 1} / {pages.length}
              </span>
            </div>
          )}

          {canvasMode === 'infinite' ? (
            <InfiniteCanvas />
          ) : pages.length === 0 ? (
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
                    scale={isSplit ? zoom * 0.9 : zoom}
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
                  scale={isSplit ? zoom * 0.9 : zoom}
                  isCurrent={true}
                />
              )}
            </div>
          )}
        </main>

        {/* === Resizable Dual Split Divider === */}
        {isSplit && secondaryNotebook && (
          <div
            className="w-2 bg-slate-800/90 hover:bg-indigo-500 cursor-col-resize transition-colors relative z-20 flex items-center justify-center group"
            title="Sürükleyerek defterlerin genişlik oranını ayarlayın"
            onMouseDown={(e) => {
              const startX = e.clientX;
              const startRatio = splitNotebook.splitRatio;
              const containerWidth =
                containerRef.current?.parentElement?.clientWidth || window.innerWidth;
              const onMouseMove = (moveEvent: MouseEvent) => {
                const deltaRatio = (moveEvent.clientX - startX) / containerWidth;
                setDualNotebookRatio(startRatio + deltaRatio);
              };
              const onMouseUp = () => {
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
              };
              window.addEventListener('mousemove', onMouseMove);
              window.addEventListener('mouseup', onMouseUp);
            }}
          >
            <GripVertical size={14} className="text-slate-500 group-hover:text-white" />
          </div>
        )}

        {/* === Right / Secondary Notebook Pane === */}
        {isSplit && secondaryNotebook && (
          <aside
            style={{ width: `${(1 - splitNotebook.splitRatio) * 100}%` }}
            className="h-full overflow-hidden flex flex-col bg-slate-925/70 border-l border-slate-800/80 relative"
          >
            {/* Secondary Pane Header Bar */}
            <div className="h-11 bg-slate-900 border-b border-slate-800 px-3 flex items-center justify-between text-xs gap-2 shrink-0 shadow-sm">
              <div className="flex items-center gap-2 min-w-0">
                <Book size={14} className="text-indigo-400 shrink-0" />
                {/* Switch Notebook Dropdown */}
                <select
                  value={secondaryNotebook.id}
                  onChange={(e) => openDualNotebook(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1 truncate focus:outline-none focus:border-indigo-500 cursor-pointer max-w-[140px] sm:max-w-[200px]"
                  title="Yan yana açılacak defteri seçin"
                >
                  {notebooks.map((nb) => (
                    <option key={nb.id} value={nb.id}>
                      {nb.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Secondary Navigation & Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Page Stepper */}
                <div className="flex items-center bg-slate-800 rounded-lg p-0.5">
                  <button
                    onClick={() => setSecondaryPageIndex(splitNotebook.secondaryPageIndex - 1)}
                    disabled={splitNotebook.secondaryPageIndex === 0}
                    className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded transition-colors"
                    title="Önceki Sayfa"
                  >
                    <ChevronLeft size={13} />
                  </button>
                  <span className="font-mono text-[11px] text-slate-300 px-1.5 font-medium">
                    {splitNotebook.secondaryPageIndex + 1}/{secondaryPages.length}
                  </span>
                  <button
                    onClick={() => setSecondaryPageIndex(splitNotebook.secondaryPageIndex + 1)}
                    disabled={splitNotebook.secondaryPageIndex >= secondaryPages.length - 1}
                    className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded transition-colors"
                    title="Sonraki Sayfa"
                  >
                    <ChevronRight size={13} />
                  </button>
                </div>

                {/* Make Active Button (Swap) */}
                <button
                  onClick={handleSwapActive}
                  className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1"
                  title="Bu defteri ana defter yap ve araçlarla üzerinde çizim yap"
                >
                  <ArrowLeftRight size={12} />
                  <span className="hidden sm:inline">Aktif Yap</span>
                </button>

                {/* Close Split View */}
                <button
                  onClick={closeDualNotebook}
                  className="p-1 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                  title="Çift Defter Görünümünü Kapat"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Secondary Scrollable Viewport */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col items-center justify-start py-6 px-3 relative select-none scroll-smooth">
              {secondaryCurrentPage ? (
                <div className="flex flex-col items-center pb-20">
                  <CanvasPage
                    page={secondaryCurrentPage}
                    pageIndex={splitNotebook.secondaryPageIndex}
                    scale={zoom * 0.85}
                    isCurrent={false}
                    readOnly={true}
                    onActivate={handleSwapActive}
                  />
                  <p className="text-[11px] text-slate-500 mt-3 text-center">
                    💡 Notun üzerine tıklayarak veya <span className="text-indigo-400 font-semibold">Aktif Yap</span> düğmesine basarak bu defteri düzenleyebilirsiniz.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-500">
                  <AlertCircle size={28} className="mb-2 text-slate-600" />
                  <p className="text-xs">Sayfa bulunamadı</p>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

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

        {/* Continuous Scroll vs Single Page Toggle (only in paged mode) */}
        {canvasMode === 'paged' && (
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
        )}

        {/* Infinite Canvas vs Paged Mode Toggle */}
        <button
          onClick={() => setCanvasMode(canvasMode === 'infinite' ? 'paged' : 'infinite')}
          className={`p-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
            canvasMode === 'infinite'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title={
            canvasMode === 'infinite'
              ? 'Sonsuz Tuval Modu Açık (Concepts & Freeform Stili Sınırsız Düzlem)'
              : 'Standart Sayfalı Mod'
          }
        >
          <Infinity size={15} className={canvasMode === 'infinite' ? 'text-amber-400' : ''} />
          <span className="text-[10px] hidden sm:inline">
            {canvasMode === 'infinite' ? 'Sonsuz Tuval' : 'Sayfalı Mod'}
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

      {/* 3. Floating Picture-in-Picture YouTube Panel */}
      {youtube.isOpen && youtube.mode === 'floating' && <YouTubePanel />}
    </div>
  );
};
