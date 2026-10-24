import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useNotebookStore } from '../store/notebookStore';
import { CanvasPage } from './canvas/CanvasPage';
import { YouTubePanel } from './youtube/YouTubePanel';
import { Ruler } from './canvas/Ruler';
import { Protractor } from './canvas/Protractor';
import { Compass } from './canvas/Compass';
import { InfiniteCanvas } from './canvas/InfiniteCanvas';
import { Minimap } from './canvas/Minimap';
import { NotebookLockModal } from './modals/NotebookLockModal';
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
  Lock,
  KeyRound,
  BookOpen,
  Bookmark,
  Brain,
  SquarePen,
  Keyboard,
  Map as MapIcon,
  Sun,
} from 'lucide-react';
import { ExportModal } from './modals/ExportModal';
import { MarginStudyWorkspace } from './margin/MarginStudyWorkspace';
import { TapeQuizToolbar } from './canvas/TapeQuizToolbar';
import { PageScrubberBar } from './navigation/PageScrubberBar';
import { PlannerTabsBar } from './planner/PlannerTabsBar';
import { LinkEditorModal } from './modals/LinkEditorModal';
import { FunctionPlotterModal } from './modals/FunctionPlotterModal';
import { RubberStampCreatorModal } from './modals/RubberStampCreatorModal';
import { StickerDrawStudioModal } from './modals/StickerDrawStudioModal';
import { triggerHaptic } from '../engine/hapticFeedback';

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
    isNotebookSessionUnlocked,
    twoPageSpread,
    toggleTwoPageSpread,
    exportModalOpen,
    setExportModalOpen,
    marginWorkspaceOpen,
    toggleMarginWorkspace,
    tapeQuizMode,
    setTapeQuizMode,
    setActiveTool,
    undo,
    redo,
    toggleRuler,
    toggleZoomWindow,
    toggleScratchpad,
    minimapVisible,
    toggleMinimap,
    plannerTabsVisible,
    togglePlannerTabs,
    outlineDrawerOpen,
    setOutlineDrawerOpen,
    presentationMode,
    setPresentationMode,
    setShortcutsModalOpen,
    toggleCornellStudyMode,
    eyeComfortMode,
    toggleEyeComfortMode,
    paperWarmth,
    setPaperWarmth,
  } = useNotebookStore();

  const [lockModalOpen, setLockModalOpen] = useState(false);
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const activeNotebook = notebooks.find((n) => n.id === activeNotebookId);
  const isLocked = !!(activeNotebook?.isLocked && !isNotebookSessionUnlocked(activeNotebook.id));
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

  const [pageFlipDirection, setPageFlipDirection] = useState<'next' | 'prev' | null>(null);
  const lastSwipeTimeRef = useRef<number>(0);

  const flipPage = useCallback(
    (direction: 'next' | 'prev') => {
      const total = pages.length;
      if (total <= 1) return;
      const step = twoPageSpread ? 2 : 1;
      let nextIdx = activePageIndex;
      if (direction === 'next') {
        if (activePageIndex + step < total) {
          nextIdx = Math.min(total - 1, activePageIndex + step);
        }
      } else {
        if (activePageIndex - step >= 0) {
          nextIdx = Math.max(0, activePageIndex - step);
        }
      }
      if (nextIdx !== activePageIndex) {
        triggerHaptic('medium');
        setPageFlipDirection(direction);
        setActivePageIndex(nextIdx);
        setTimeout(() => setPageFlipDirection(null), 300);
      }
    },
    [activePageIndex, pages.length, twoPageSpread, setActivePageIndex]
  );

  // Power-User Keyboard Shortcut HUD Toast
  const [shortcutHud, setShortcutHud] = useState<{ title: string; key: string } | null>(null);
  const hudTimerRef = useRef<any>(null);

  const showShortcutHud = useCallback((title: string, key: string) => {
    if (hudTimerRef.current) clearTimeout(hudTimerRef.current);
    setShortcutHud({ title, key });
    hudTimerRef.current = setTimeout(() => {
      setShortcutHud(null);
    }, 1200);
  }, []);

  // Mobile / Screen Fit-to-Width Helper
  const fitToWidth = useCallback(() => {
    const containerW = containerRef.current?.clientWidth || window.innerWidth;
    const pageW = pages[0]?.width || 800;
    const newScale = Math.max(0.35, Math.min(2.0, (containerW - 16) / pageW));
    setZoom(Number(newScale.toFixed(2)));
    showShortcutHud('Genişliğe Sığdırıldı', `${Math.round(newScale * 100)}%`);
  }, [pages, setZoom, showShortcutHud]);

  // Auto-fit on initial mobile load
  const mobileAutoFitDoneRef = useRef(false);
  useEffect(() => {
    if (!mobileAutoFitDoneRef.current && pages.length > 0) {
      mobileAutoFitDoneRef.current = true;
      if (window.innerWidth < 768) {
        fitToWidth();
      }
    }
  }, [pages.length, fitToWidth]);

  // Navigation & Gestures: Trackpad horizontal swipe, touch swipe, zoom & power user keyboard shortcuts
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.08 : 0.08;
        setZoom(zoom + delta);
        return;
      }

      // Horizontal trackpad swipe for page flip in single/spread view
      if (canvasMode === 'paged' && (viewMode === 'single' || twoPageSpread)) {
        const now = Date.now();
        if (now - lastSwipeTimeRef.current > 350) {
          if (Math.abs(e.deltaX) > 45 && Math.abs(e.deltaX) > Math.abs(e.deltaY) * 1.5) {
            if (e.deltaX > 45) {
              flipPage('next');
              lastSwipeTimeRef.current = now;
            } else if (e.deltaX < -45) {
              flipPage('prev');
              lastSwipeTimeRef.current = now;
            }
          }
        }
      }
    };

    let touchStartX = 0;
    let touchStartY = 0;
    let initialPinchDistance = 0;
    let initialPinchZoom = zoom;
    let isPinching = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        // Two-finger touch: could be pinch-to-zoom or swipe gesture
        touchStartX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        touchStartY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        initialPinchDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        initialPinchZoom = zoom;
        isPinching = false;
      } else if (e.touches.length === 1 && (e.target === el || !(e.target as HTMLElement).closest('canvas'))) {
        // One-finger swipe on workspace background/margin
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        isPinching = false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && initialPinchDistance > 0) {
        const currentDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const distDiff = Math.abs(currentDistance - initialPinchDistance);
        if (distDiff > 12) {
          isPinching = true;
          const pinchScale = currentDistance / initialPinchDistance;
          const targetZoom = Math.min(3.0, Math.max(0.4, Number((initialPinchZoom * pinchScale).toFixed(2))));
          setZoom(targetZoom);
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (isPinching) {
        isPinching = false;
        initialPinchDistance = 0;
        return; // Don't trigger page flip after pinching
      }
      initialPinchDistance = 0;

      if (canvasMode !== 'paged' || (viewMode !== 'single' && !twoPageSpread)) return;
      const now = Date.now();
      if (now - lastSwipeTimeRef.current < 350) return;

      const changedTouch = e.changedTouches[0];
      if (!changedTouch) return;

      const diffX = changedTouch.clientX - touchStartX;
      const diffY = changedTouch.clientY - touchStartY;

      if (Math.abs(diffX) > 60 && Math.abs(diffX) > Math.abs(diffY) * 1.4) {
        if (diffX < -60) {
          flipPage('next');
          lastSwipeTimeRef.current = now;
        } else if (diffX > 60) {
          flipPage('prev');
          lastSwipeTimeRef.current = now;
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = document.activeElement as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable ||
          target.tagName === 'SELECT')
      ) {
        return;
      }

      // Check for Undo / Redo with Cmd/Ctrl
      if (e.metaKey || e.ctrlKey) {
        if (e.key === 'z' || e.key === 'Z') {
          e.preventDefault();
          if (e.shiftKey) {
            redo();
            triggerHaptic('light');
            showShortcutHud('İleri Al', '⌘⇧Z');
          } else {
            undo();
            triggerHaptic('light');
            showShortcutHud('Geri Al', '⌘Z');
          }
          return;
        } else if (e.key === 'y' || e.key === 'Y') {
          e.preventDefault();
          redo();
          triggerHaptic('light');
          showShortcutHud('İleri Al', '⌘Y');
          return;
        }
        return; // Don't intercept other modifier combos (like Cmd+K, etc.)
      }

      // Standalone Power-User Tool Shortcuts
      if (e.key === 'F5') {
        e.preventDefault();
        const next = !presentationMode;
        setPresentationMode(next);
        triggerHaptic('medium');
        showShortcutHud(next ? 'Sunum Başlatıldı' : 'Sunum Bitti', 'F5');
        return;
      }

      const key = e.key.toLowerCase();
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setShortcutsModalOpen(true);
        triggerHaptic('light');
        return;
      }

      if (key === 'b') {
        e.preventDefault();
        setActiveTool('ballpoint');
        triggerHaptic('light');
        showShortcutHud('Tükenmez Kalem', 'B');
        return;
      } else if (key === 'p') {
        e.preventDefault();
        setActiveTool('fountain');
        triggerHaptic('light');
        showShortcutHud('Dolma Kalem', 'P');
        return;
      } else if (key === 'e') {
        e.preventDefault();
        setActiveTool('eraser');
        triggerHaptic('light');
        showShortcutHud('Silgi', 'E');
        return;
      } else if (key === 'l') {
        e.preventDefault();
        setActiveTool('lasso');
        triggerHaptic('light');
        showShortcutHud('Kement Aracı', 'L');
        return;
      } else if (key === 'h') {
        e.preventDefault();
        setActiveTool('highlighter');
        triggerHaptic('light');
        showShortcutHud('Fosforlu Kalem', 'H');
        return;
      } else if (key === 't') {
        e.preventDefault();
        setActiveTool('text');
        triggerHaptic('light');
        showShortcutHud('Metin Kutusu', 'T');
        return;
      } else if (key === 's') {
        e.preventDefault();
        setActiveTool('sticky-note');
        triggerHaptic('light');
        showShortcutHud('Yapışkan Not', 'S');
        return;
      } else if (e.altKey && key === 'c') {
        e.preventDefault();
        toggleCornellStudyMode();
        triggerHaptic('medium');
        showShortcutHud('Cornell Ezber Modu', 'Alt + C');
        return;
      } else if (key === 'c') {
        e.preventDefault();
        setActiveTool('connector');
        triggerHaptic('light');
        showShortcutHud('Bağlayıcı Ok & Akış Çizgisi', 'C');
        return;
      } else if (key === 'r') {
        e.preventDefault();
        toggleRuler();
        triggerHaptic('light');
        showShortcutHud('Cetvel', 'R');
        return;
      } else if (key === 'z') {
        e.preventDefault();
        toggleZoomWindow();
        triggerHaptic('light');
        showShortcutHud('Büyüteç Penceresi', 'Z');
        return;
      } else if (key === 'q') {
        e.preventDefault();
        toggleScratchpad();
        triggerHaptic('light');
        showShortcutHud('Hızlı Karalama', 'Q');
        return;
      } else if (key === 'm') {
        e.preventDefault();
        toggleMarginWorkspace();
        triggerHaptic('light');
        showShortcutHud('Kenarlık', 'M');
        return;
      } else if (key === 'n') {
        e.preventDefault();
        toggleMinimap();
        triggerHaptic('light');
        showShortcutHud('Tuval Radarı', 'N');
        return;
      } else if (key === 'j') {
        e.preventDefault();
        togglePlannerTabs();
        triggerHaptic('light');
        showShortcutHud('Ajanda Sekmeleri', 'J');
        return;
      } else if (key === 'o') {
        e.preventDefault();
        setOutlineDrawerOpen(!outlineDrawerOpen);
        triggerHaptic('light');
        showShortcutHud('İçindekiler & Fihrist', 'O');
        return;
      }

      // Page Navigation Arrows (when in paged mode)
      if (canvasMode !== 'paged' || (viewMode !== 'single' && !twoPageSpread)) return;

      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        flipPage('next');
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        flipPage('prev');
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: true });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      el.removeEventListener('wheel', handleWheel);
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    zoom,
    setZoom,
    canvasMode,
    viewMode,
    twoPageSpread,
    flipPage,
    setActiveTool,
    undo,
    redo,
    toggleRuler,
    toggleZoomWindow,
    toggleScratchpad,
    toggleMarginWorkspace,
    setShortcutsModalOpen,
    showShortcutHud,
  ]);

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

          {isLocked ? (
            <div className="flex flex-col items-center justify-center my-auto py-20 text-slate-400 select-none animate-in fade-in">
              <div className="w-16 h-16 rounded-3xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mb-4 shadow-xl shadow-indigo-600/10">
                <Lock size={30} />
              </div>
              <h3 className="text-base font-bold text-slate-100 mb-1">
                Bu Defter Kilitli
              </h3>
              <p className="text-xs text-slate-400 max-w-xs text-center mb-5">
                "{activeNotebook?.title}" defterinin sayfaları ve notları 4 haneli PIN kodu ile korunmaktadır.
              </p>
              <button
                onClick={() => setLockModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg transition-all active:scale-95"
              >
                <KeyRound size={15} />
                <span>PIN Kodu Girin</span>
              </button>
            </div>
          ) : canvasMode === 'infinite' ? (
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
                <div key={pg.id} id={`page-card-${idx}`} className="relative group">
                  <CanvasPage
                    page={pg}
                    pageIndex={idx}
                    scale={isSplit ? zoom * 0.9 : zoom}
                    isCurrent={idx === activePageIndex}
                  />
                </div>
              ))}
            </div>
          ) : twoPageSpread && pages.length > 1 ? (
            /* 📖 Faz E: Two-Page Book Spread View (İkili Kitap Modu) */
            <div className="flex flex-col items-center pb-24">
              <div
                key={`spread_${activePageIndex}`}
                className={`flex items-center justify-center gap-1 p-3 bg-slate-900/60 rounded-3xl shadow-2xl border border-slate-800 relative max-w-full overflow-x-auto transition-all duration-200 ${
                  pageFlipDirection === 'next'
                    ? 'animate-in fade-in slide-in-from-right-4'
                    : pageFlipDirection === 'prev'
                    ? 'animate-in fade-in slide-in-from-left-4'
                    : ''
                }`}
              >
                {/* Left Page (Even Index) */}
                {pages[activePageIndex % 2 === 0 ? activePageIndex : activePageIndex - 1] && (
                  <div
                    id={`page-card-${activePageIndex % 2 === 0 ? activePageIndex : activePageIndex - 1}`}
                    className="relative shadow-xl"
                  >
                    <CanvasPage
                      page={pages[activePageIndex % 2 === 0 ? activePageIndex : activePageIndex - 1]}
                      pageIndex={activePageIndex % 2 === 0 ? activePageIndex : activePageIndex - 1}
                      scale={zoom * 0.72}
                      isCurrent={activePageIndex % 2 === 0}
                    />
                  </div>
                )}

                {/* Classic Book Spine Crease & Shadow */}
                <div className="w-3 self-stretch bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 shadow-inner flex flex-col items-center justify-center opacity-70">
                  <div className="w-px h-full bg-slate-800" />
                </div>

                {/* Right Page (Odd Index) */}
                {pages[(activePageIndex % 2 === 0 ? activePageIndex : activePageIndex - 1) + 1] ? (
                  <div
                    id={`page-card-${(activePageIndex % 2 === 0 ? activePageIndex : activePageIndex - 1) + 1}`}
                    className="relative shadow-xl"
                  >
                    <CanvasPage
                      page={pages[(activePageIndex % 2 === 0 ? activePageIndex : activePageIndex - 1) + 1]}
                      pageIndex={(activePageIndex % 2 === 0 ? activePageIndex : activePageIndex - 1) + 1}
                      scale={zoom * 0.72}
                      isCurrent={activePageIndex % 2 !== 0}
                    />
                  </div>
                ) : (
                  <div
                    className="flex flex-col items-center justify-center bg-slate-950/40 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs shadow-inner"
                    style={{
                      width: `${(pages[0]?.width || 800) * zoom * 0.72}px`,
                      height: `${(pages[0]?.height || 1050) * zoom * 0.72}px`,
                    }}
                  >
                    <span>Boş Sayfa (Defter Sonu)</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Single Page View */
            <div className="flex flex-col items-center pb-24">
              {pages[activePageIndex] && (
                <div
                  key={pages[activePageIndex].id}
                  id={`page-card-${activePageIndex}`}
                  className={`transition-all duration-200 ${
                    pageFlipDirection === 'next'
                      ? 'animate-in fade-in slide-in-from-right-4'
                      : pageFlipDirection === 'prev'
                      ? 'animate-in fade-in slide-in-from-left-4'
                      : ''
                  }`}
                >
                  <CanvasPage
                    page={pages[activePageIndex]}
                    pageIndex={activePageIndex}
                    scale={isSplit ? zoom * 0.9 : zoom}
                    isCurrent={true}
                  />
                </div>
              )}
            </div>
          )}
        </main>

        {/* === Resizable Dual Split Divider === */}
        {isSplit && secondaryNotebook && (
          <div
            className="w-2.5 bg-slate-800/90 hover:bg-indigo-500 active:bg-indigo-600 cursor-col-resize transition-colors relative z-20 flex items-center justify-center group touch-none select-none"
            title="Sürükleyerek defterlerin genişlik oranını ayarlayın"
            onPointerDown={(e) => {
              try {
                (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
              } catch (_) {}
              const startX = e.clientX;
              const startRatio = splitNotebook.splitRatio;
              const containerWidth =
                containerRef.current?.parentElement?.clientWidth || window.innerWidth;
              const onPointerMove = (moveEvent: PointerEvent) => {
                const deltaRatio = (moveEvent.clientX - startX) / containerWidth;
                setDualNotebookRatio(startRatio + deltaRatio);
              };
              const onPointerUp = () => {
                window.removeEventListener('pointermove', onPointerMove);
                window.removeEventListener('pointerup', onPointerUp);
                window.removeEventListener('pointercancel', onPointerUp);
              };
              window.addEventListener('pointermove', onPointerMove);
              window.addEventListener('pointerup', onPointerUp);
              window.addEventListener('pointercancel', onPointerUp);
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

      {/* 📑 Faz F: LiquidText Style Margin Study Workspace */}
      <MarginStudyWorkspace />

      {/* 🧠 Faz H: Active Recall Tape Quiz Floating Toolbar */}
      <TapeQuizToolbar />

      {/* Desktop Floating Zoom & View Controls Dock (Bottom Left - >= 1024px) */}
      <div className="fixed bottom-5 left-5 z-30 hidden lg:flex items-center bg-[#090d16]/90 backdrop-blur-2xl border border-white/10 rounded-2xl px-2.5 py-1.5 shadow-2xl gap-1.5 ring-1 ring-white/10">
        <button
          onClick={() => setZoom(zoom - 0.1)}
          disabled={zoom <= 0.4}
          className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 disabled:opacity-40 transition-colors"
          title="Uzaklaş"
        >
          <ZoomOut size={15} />
        </button>

        <span
          onClick={resetView}
          className="text-xs font-mono font-semibold text-slate-200 px-2 cursor-pointer hover:text-indigo-400 transition-colors"
          title="Yakınlaştırmayı Sıfırla (%100)"
        >
          {Math.round(zoom * 100)}%
        </span>

        <button
          onClick={() => setZoom(zoom + 0.1)}
          disabled={zoom >= 3.0}
          className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 disabled:opacity-40 transition-colors"
          title="Yakınlaş"
        >
          <ZoomIn size={15} />
        </button>

        <div className="w-px h-4 bg-white/10 mx-1" />

        {/* Continuous Scroll vs Single Page Toggle (only in paged mode) */}
        {canvasMode === 'paged' && (
          <button
            onClick={() =>
              setViewMode(viewMode === 'continuous' ? 'single' : 'continuous')
            }
            className={`p-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              viewMode === 'continuous'
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 ring-1 ring-indigo-400/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
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

        {/* 📖 Faz E: Two Page Book Spread View Toggle */}
        {canvasMode === 'paged' && (
          <button
            onClick={toggleTwoPageSpread}
            className={`p-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              twoPageSpread
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50 shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
            title="Çift Sayfa Kitap / Defter Görünümü (Book Spread Mode)"
          >
            <BookOpen size={14} className={twoPageSpread ? 'text-indigo-400' : ''} />
            <span className="text-[10px] hidden sm:inline">Kitap Modu</span>
          </button>
        )}

        {/* 📑 Faz F: LiquidText Style Margin Workspace Toggle */}
        <button
          onClick={toggleMarginWorkspace}
          className={`p-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
            marginWorkspaceOpen
              ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50 shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
          title="LiquidText Stili Sayfa Kenarı Not & Alıntı Alanı (Study Margin)"
        >
          <Bookmark size={14} className={marginWorkspaceOpen ? 'text-indigo-400' : ''} />
          <span className="text-[10px] hidden sm:inline">Kenarlık</span>
        </button>

        {/* 📑 Faz AA: Digital Planner Edge Tabs Toggle */}
        <button
          onClick={togglePlannerTabs}
          className={`p-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
            plannerTabsVisible
              ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50 shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
          title="Dijital Ajanda Sekmeleri (Planner Tabs - J)"
        >
          <Bookmark size={14} className={plannerTabsVisible ? 'text-indigo-400 fill-indigo-400/30' : ''} />
          <span className="text-[10px] hidden sm:inline">Ajanda</span>
        </button>

        {/* 🧠 Faz H: Active Recall Tape Quiz Mode Toggle */}
        <button
          onClick={() => setTapeQuizMode(!tapeQuizMode)}
          className={`p-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
            tapeQuizMode
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
          title="Ezber Bantları Aktif Hatırlama Sınav Modu"
        >
          <Brain size={14} className={tapeQuizMode ? 'text-amber-400' : ''} />
          <span className="text-[10px] hidden sm:inline">Ezber Testi</span>
        </button>

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

        {/* 🌿 Göz Konforu (True Tone Amber Kağıt Sıcaklığı) */}
        <button
          onClick={() => {
            triggerHaptic('light');
            toggleEyeComfortMode();
          }}
          className={`p-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
            eyeComfortMode
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
          title={`Göz Konforu Filtresi (True Tone Amber) ${eyeComfortMode ? 'Açık' : 'Kapalı'}`}
        >
          <Sun size={14} className={eyeComfortMode ? 'text-amber-400 fill-amber-400/30' : ''} />
          <span className="text-[10px] hidden sm:inline">Göz Konforu</span>
        </button>
      </div>

      {/* Mobile / Tablet Collapsible View Controls Pill (Bottom Left - < 1024px) */}
      <div className="fixed bottom-18 md:bottom-4 left-4 z-30 flex lg:hidden items-center select-none">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setViewMenuOpen(!viewMenuOpen);
          }}
          className="flex items-center gap-1.5 bg-slate-900/95 backdrop-blur-md border border-slate-750 px-2.5 py-1.5 rounded-2xl shadow-2xl text-xs font-semibold text-slate-200 hover:text-white"
          title="Görünüm ve Büyütme Menüsü"
        >
          <ZoomIn size={14} className="text-indigo-400" />
          <span className="font-mono">{Math.round(zoom * 100)}%</span>
        </button>

        {viewMenuOpen && (
          <div className="absolute bottom-12 left-0 w-64 bg-slate-900/98 border border-slate-700 shadow-2xl rounded-2xl p-3 z-40 animate-in fade-in zoom-in-95 backdrop-blur-xl space-y-2.5 text-xs text-white">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <span className="font-bold text-slate-200">Görünüm & Büyütme</span>
              <span className="font-mono text-indigo-400 font-bold">%{Math.round(zoom * 100)}</span>
            </div>

            {/* Zoom controls */}
            <div className="flex items-center justify-between bg-slate-800/80 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setZoom(Math.max(0.4, zoom - 0.1))}
                className="p-1.5 text-slate-300 hover:text-white rounded-lg bg-slate-700/50"
              >
                <ZoomOut size={14} />
              </button>
              <button
                type="button"
                onClick={resetView}
                className="px-2 py-1 text-slate-300 hover:text-indigo-300 font-mono text-[11px]"
              >
                %100
              </button>
              <button
                type="button"
                onClick={() => setZoom(Math.min(3.0, zoom + 0.1))}
                className="p-1.5 text-slate-300 hover:text-white rounded-lg bg-slate-700/50"
              >
                <ZoomIn size={14} />
              </button>
            </div>

            {/* Quick Sığdır & %100 presets */}
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  resetView();
                  setViewMenuOpen(false);
                }}
                className="py-1 px-2 text-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium"
              >
                Varsayılan (%100)
              </button>
              <button
                type="button"
                onClick={() => {
                  fitToWidth();
                  setViewMenuOpen(false);
                }}
                className="py-1 px-2 text-center rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 hover:text-white border border-indigo-500/40 text-[11px] font-semibold"
              >
                Genişliğe Sığdır
              </button>
            </div>

            {/* View mode toggles */}
            <div className="space-y-1 pt-1 border-t border-slate-800">
              {canvasMode === 'paged' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode(viewMode === 'continuous' ? 'single' : 'continuous');
                      setViewMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-1.5 rounded-lg text-slate-300 hover:bg-slate-800"
                  >
                    <span>Kesintisiz Akış Modu</span>
                    <span className="text-[10px] text-indigo-400 font-semibold">{viewMode === 'continuous' ? 'Açık' : 'Kapalı'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      toggleTwoPageSpread();
                      setViewMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-1.5 rounded-lg text-slate-300 hover:bg-slate-800"
                  >
                    <span>İkili Kitap Modu</span>
                    <span className="text-[10px] text-indigo-400 font-semibold">{twoPageSpread ? 'Açık' : 'Kapalı'}</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => {
                  setCanvasMode(canvasMode === 'infinite' ? 'paged' : 'infinite');
                  setViewMenuOpen(false);
                }}
                className="w-full flex items-center justify-between p-1.5 rounded-lg text-slate-300 hover:bg-slate-800"
              >
                <span>Sonsuz Tuval</span>
                <span className="text-[10px] text-amber-400 font-semibold">{canvasMode === 'infinite' ? 'Açık' : 'Kapalı'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  toggleMarginWorkspace();
                  setViewMenuOpen(false);
                }}
                className="w-full flex items-center justify-between p-1.5 rounded-lg text-slate-300 hover:bg-slate-800"
              >
                <span>Kenarlık Çalışma Alanı</span>
                <span className="text-[10px] text-indigo-400 font-semibold">{marginWorkspaceOpen ? 'Açık' : 'Kapalı'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  togglePlannerTabs();
                  setViewMenuOpen(false);
                }}
                className="w-full flex items-center justify-between p-1.5 rounded-lg text-slate-300 hover:bg-slate-800"
              >
                <span>Ajanda Fihrist Sekmeleri</span>
                <span className="text-[10px] text-indigo-400 font-semibold">{plannerTabsVisible ? 'Açık' : 'Kapalı'}</span>
              </button>

              {/* 🌿 Göz Konforu (True Tone Amber Kağıt Sıcaklığı) */}
              <div className="pt-1.5 border-t border-slate-800 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    toggleEyeComfortMode();
                  }}
                  className="w-full flex items-center justify-between p-1.5 rounded-lg text-slate-300 hover:bg-slate-800"
                >
                  <span className="flex items-center gap-1.5">
                    <Sun size={13} className={eyeComfortMode ? 'text-amber-400' : 'text-slate-400'} />
                    <span>Göz Konforu (True Tone)</span>
                  </span>
                  <span className={`text-[10px] font-semibold ${eyeComfortMode ? 'text-amber-400' : 'text-slate-400'}`}>
                    {eyeComfortMode ? 'Açık' : 'Kapalı'}
                  </span>
                </button>
                {eyeComfortMode && (
                  <div className="px-1.5 py-1 flex items-center gap-2 bg-slate-800/60 rounded-xl">
                    <span className="text-[10px] text-slate-400 shrink-0">Sıcaklık:</span>
                    <input
                      type="range"
                      min={10}
                      max={80}
                      value={paperWarmth}
                      onChange={(e) => setPaperWarmth(Number(e.target.value))}
                      className="w-full accent-amber-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-[10px] font-mono text-amber-400 w-6 text-right">%{paperWarmth}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Quick Elements Button (Bottom Right) */}
      <button
        type="button"
        onClick={() => setStickersDrawerOpen(true)}
        className="fixed bottom-18 md:bottom-4 right-4 z-30 flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs px-3 py-2 rounded-2xl shadow-xl shadow-amber-500/20 hover:scale-105 transition-all"
        title="Çıkartmalar ve Notlar Çekmecesi (Elements)"
      >
        <Sparkles size={16} />
        <span className="hidden sm:inline">Çıkartmalar</span>
      </button>

      {/* 📝 Faz W: Floating Quick Scratchpad Launcher (Bottom Right - Hidden on tablets/mobile to avoid clutter) */}
      <button
        type="button"
        onClick={() => {
          triggerHaptic('light');
          toggleScratchpad();
        }}
        className="fixed bottom-5 right-36 z-30 hidden xl:flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800 text-amber-400 font-bold text-xs px-3 py-2 rounded-2xl shadow-xl border border-amber-500/30 hover:border-amber-400 hover:scale-105 transition-all backdrop-blur-md"
        title="Hızlı Karalama Panosu / Quick Notes (Q)"
      >
        <SquarePen size={15} />
        <span>Hızlı Not</span>
        <span className="text-[10px] bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded font-mono font-semibold">Q</span>
      </button>

      {/* 🗺️ Faz Y: Interactive Radar Minimap Launcher (Bottom Right - Hidden on tablets/mobile to avoid clutter) */}
      <button
        type="button"
        onClick={() => {
          triggerHaptic('light');
          toggleMinimap();
        }}
        className={`fixed bottom-5 right-64 z-30 hidden xl:flex items-center gap-1.5 ${
          minimapVisible
            ? 'bg-indigo-600 text-white border-indigo-400'
            : 'bg-slate-900/90 text-indigo-400 border-indigo-500/30 hover:border-indigo-400'
        } font-bold text-xs px-3 py-2 rounded-2xl shadow-xl border hover:scale-105 transition-all backdrop-blur-md`}
        title="Tuval Radarı / Mini Harita Gezgini (N)"
      >
        <MapIcon size={15} />
        <span>Radar</span>
        <span className="text-[10px] bg-slate-800 text-indigo-300 px-1.5 py-0.5 rounded font-mono font-semibold">N</span>
      </button>

      {/* 🗺️ Faz Y: Interactive Radar Minimap & Pan Viewport */}
      <Minimap containerRef={containerRef} />

      {/* ⌨️ Faz W: Power-User Keyboard Shortcut HUD Toast */}
      {shortcutHud && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none select-none flex items-center gap-2.5 bg-slate-900/95 backdrop-blur-md text-slate-100 border border-slate-700/80 px-4 py-2 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-100">
          <span className="text-xs font-semibold text-slate-200 tracking-wide">{shortcutHud.title}</span>
          <kbd className="px-2 py-0.5 bg-slate-950 text-amber-400 font-mono text-xs font-bold rounded-lg border border-slate-700 shadow-sm">
            {shortcutHud.key}
          </kbd>
        </div>
      )}

      {/* 🌟 Interactive GoodNotes Floating Ruler */}
      <Ruler scale={zoom} />

      {/* 🌟 Interactive Protractor (360° Açıölçer) */}
      <Protractor scale={zoom} />

      {/* 🌟 Interactive Geometry Compass (Hassas Pergel) */}
      <Compass scale={zoom} />

      {/* ⚡ Faz S: Interactive GoodNotes-Style Bottom Page Scrubber & Quick Jumper */}
      {!isLocked && canvasMode === 'paged' && (viewMode === 'single' || twoPageSpread) && (
        <PageScrubberBar />
      )}

      {/* 3. Floating Picture-in-Picture YouTube Panel */}
      {youtube.isOpen && youtube.mode === 'floating' && <YouTubePanel />}

      {/* 🔒 Notebook PIN Vault Modal */}
      {activeNotebook && (
        <NotebookLockModal
          isOpen={lockModalOpen}
          onClose={() => setLockModalOpen(false)}
          notebookId={activeNotebook.id}
          mode="unlock"
        />
      )}

      {/* 🖼️ Faz E: Comprehensive Export Studio Modal */}
      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
      />

      {/* 📑 Faz AA: Digital Planner Edge Tabs Navigation Bar */}
      {!isLocked && canvasMode === 'paged' && <PlannerTabsBar />}

      {/* 🔗 Faz AA: Interactive Hyperlink & Jump Editor Modal */}
      <LinkEditorModal />

      {/* 📈 Faz AB: STEM 2D Function Plotter & Coordinate Stamping Modal */}
      <FunctionPlotterModal />

      {/* 🔲 Faz AC: Dynamic Rubber Stamp Creator Modal */}
      <RubberStampCreatorModal />

      {/* 🎨 Faz AC: Sticker Drawing Studio Modal */}
      <StickerDrawStudioModal />
    </div>
  );
};
