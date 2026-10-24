import React, { useState, useRef, useEffect } from 'react';
import { useNotebookStore } from '../../store/notebookStore';
import { exportNotebookAsNotefree } from '../../services/storage';
import {
  PenTool,
  Feather,
  Paintbrush,
  Highlighter,
  Eraser,
  Scissors,
  Shapes,
  Undo2,
  Redo2,
  ChevronLeft,
  ChevronRight,
  FileDown,
  UploadCloud,
  Youtube,
  Trash2,
  Layers,
  ListTree,
  LayoutTemplate,
  Users,
  Menu,
  Sparkles,
  Zap,
  Lightbulb,
  Check,
  Type,
  Compass,
  Library,
  Grid,
  Brain,
  ZoomIn,
  Star,
  Presentation,
  Sun,
  FolderDown,
  Pencil,
  PenLine,
  Flame,
  Spline,
  Bandage,
  Pipette,
  PaintBucket,
  SlidersHorizontal,
  Calculator,
  Split,
  Search,
  StickyNote,
  Disc,
  CircleDot,
  FlipHorizontal,
  Ban,
  SquarePen,
  Keyboard,
  Map as MapIcon,
  Bookmark,
  Link2,
  TrendingUp,
  Stamp,
  Table2,
  Workflow,
  Minus,
  ArrowRight,
  Square,
  Circle,
  Triangle,
  Diamond,
  Pentagon,
  Hexagon,
  MessageSquare,
  Braces,
  MoreHorizontal,
  X,
  ChevronDown,
  ChevronUp,
  Plus,
  Maximize2,
  PanelLeft,
  PanelRight,
  Move,
  GraduationCap,
  Palette,
  Mic,
  MicOff,
  Camera,
} from 'lucide-react';
import { ShapeType, StylusDoubleTapAction } from '../../types/notebook';
import { AudioPlayerBar } from '../audio/AudioPlayerBar';
import { PomodoroBarWidget } from '../pomodoro/PomodoroBarWidget';
import { speechTranscriptionService } from '../../services/speechTranscriptionService';
import { ColorStudioPopover } from './ColorStudioPopover';
import { triggerHaptic } from '../../engine/hapticFeedback';

const COLOR_PALETTE = [
  '#0f172a', // Slate black
  '#1e40af', // Royal blue
  '#b91c1c', // Crimson red
  '#047857', // Emerald green
  '#6d28d9', // Deep violet
  '#d97706', // Amber
  '#ea580c', // Orange
  '#facc15', // Highlighter yellow
  '#f472b6', // Highlighter pink
  '#4ade80', // Highlighter mint
  '#ffffff', // Pure white
  '#64748b', // Slate gray
];

const SHAPE_BUTTONS: { type: ShapeType; label: string; icon: React.ReactNode }[] = [
  { type: 'line', label: 'Çizgi', icon: <Minus size={14} /> },
  { type: 'arrow', label: 'Ok', icon: <ArrowRight size={14} /> },
  { type: 'rectangle', label: 'Kare', icon: <Square size={14} /> },
  { type: 'circle', label: 'Daire', icon: <Circle size={14} /> },
  { type: 'triangle', label: 'Üçgen', icon: <Triangle size={14} /> },
  { type: 'diamond', label: 'Baklava', icon: <Diamond size={14} /> },
  { type: 'pentagon', label: 'Beşgen', icon: <Pentagon size={14} /> },
  { type: 'hexagon', label: 'Altıgen', icon: <Hexagon size={14} /> },
  { type: 'star', label: 'Yıldız', icon: <Star size={14} /> },
  { type: 'callout', label: 'Balon', icon: <MessageSquare size={14} /> },
  { type: 'bracket', label: 'Parantez', icon: <Braces size={14} /> },
  { type: 'arc', label: 'Yay', icon: <Spline size={14} /> },
];

export const Toolbar: React.FC = () => {
  const {
    activeTool,
    setActiveTool,
    toolSettings,
    setEraserMode,
    toggleEraseHighlighterOnly,
    toggleAutoDeselectEraser,
    selectFavoriteColor,
    selectFavoriteSize,
    setFavoriteColor,
    setSelectedShape,
    setShapeFillColor,
    setShapeFillOpacity,
    activeNotebookId,
    notebooks,
    activePageIndex,
    setActivePageIndex,
    undo,
    redo,
    undoStack,
    redoStack,
    clearCurrentPageStrokes,
    youtube,
    toggleYouTube,
    setTemplateModalOpen,
    cornellStudyMode,
    setCornellAssistantModalOpen,
    setDocImportModalOpen,
    setStickersDrawerOpen,
    sidebarOpen,
    setSidebarOpen,
    setLibraryViewOpen,
    setPageManagerModalOpen,
    rulerVisible,
    toggleRuler,
    zoomWindowOpen,
    toggleZoomWindow,
    scratchpadOpen,
    toggleScratchpad,
    minimapVisible,
    toggleMinimap,
    setShortcutsModalOpen,
    setStudySetsModalOpen,
    presentationMode,
    setPresentationMode,
    setLaserStyle,
    setLaserColor,
    setSpotlightRadius,
    togglePageBookmark,
    invertCurrentPageInks,
    setStreamline,
    setFillTolerance,
    setSearchModalOpen,
    openMathModal,
    openFunctionPlotterModal,
    splitNotebook,
    openDualNotebook,
    closeDualNotebook,
    layersDrawerOpen,
    setLayersDrawerOpen,
    outlineDrawerOpen,
    setOutlineDrawerOpen,
    toggleAngleSnap,
    toggleGridSnap,
    toggleAutoDetectShape,
    togglePalmRejection,
    toggleTiltShading,
    setStylusDoubleTapAction,
    toggleScribbleToErase,
    toggleCircleToLasso,
    collaboration,
    setCollaborationModalOpen,
    protractorVisible,
    toggleProtractor,
    compassVisible,
    toggleCompass,
    symmetryEnabled,
    toggleSymmetry,
    addStickyNoteToCurrentPage,
    setExportModalOpen,
    plannerTabsVisible,
    togglePlannerTabs,
    openLinkModal,
    addPageLinkToCurrentPage,
    setStampCreatorModalOpen,
    addTableToCurrentPage,
    zenMode,
    toggleZenMode,
    mobileToolDockCollapsed,
    toggleMobileToolDockCollapsed,
    tabletToolbarPlacement,
    setTabletToolbarPlacement,
    addPage,
    addStickerToCurrentPage,
    eyeComfortMode,
    toggleEyeComfortMode,
  } = useNotebookStore();

  // Active Dropdown state
  const [openDropdown, setOpenDropdown] = useState<
    'eraser' | 'shape' | 'artist' | 'moreTools' | 'overflowActions' | null
  >(null);
  const [activeColorSlot, setActiveColorSlot] = useState<number | null>(null);
  const [colorStudioOpen, setColorStudioOpen] = useState<boolean>(false);
  const [colorStudioSlot, setColorStudioSlot] = useState<number | null>(null);

  // Live Speech Dictation State
  const [isDictating, setIsDictating] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');

  // Mobile Camera / Photo Quick Insert
  const mobileCameraInputRef = useRef<HTMLInputElement | null>(null);

  const handleMobileCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const maxDim = 260;
        const ratio = img.width / img.height;
        let w = maxDim;
        let h = maxDim / ratio;
        if (h > maxDim) {
          h = maxDim;
          w = maxDim * ratio;
        }
        w = Math.round(w);
        h = Math.round(h);
        addStickerToCurrentPage(
          {
            id: `cam_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            name: file.name,
            category: 'custom',
            content: dataUrl,
            width: w,
            height: h,
          },
          { x: 100, y: 150, width: w, height: h }
        );
        triggerHaptic('medium');
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const toolbarRef = useRef<HTMLDivElement | null>(null);

  // Close all popovers when tapping/clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
        setActiveColorSlot(null);
        setColorStudioOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const activeNotebook = notebooks.find((n) => n.id === activeNotebookId);
  const totalPages = activeNotebook ? activeNotebook.pages.length : 1;
  const currentPage = activeNotebook?.pages[activePageIndex];

  const toggleDropdown = (
    name: 'eraser' | 'shape' | 'artist' | 'moreTools' | 'overflowActions'
  ) => {
    triggerHaptic('light');
    setOpenDropdown(openDropdown === name ? null : name);
    setActiveColorSlot(null);
  };

  const closeDropdown = () => {
    setOpenDropdown(null);
    setActiveColorSlot(null);
  };

  // Check if any secondary inking or geometry tool is currently active
  const isSecondaryToolActive =
    ['neon', 'dashed', 'tape', 'laser', 'eyedropper', 'fill'].includes(activeTool) ||
    rulerVisible ||
    protractorVisible ||
    compassVisible ||
    symmetryEnabled ||
    zoomWindowOpen ||
    scratchpadOpen ||
    minimapVisible ||
    plannerTabsVisible;

  // Check if any background service or session is active
  const isActivityActive = collaboration.isConnected || youtube.isOpen;

  return (
    <div ref={toolbarRef} className="flex flex-col z-30 select-none shadow-xl">
      {/* 1. MAIN TOP BAR */}
      <header className="h-15 bg-[#090d16]/95 backdrop-blur-2xl border-b border-white/10 flex items-center justify-between px-3 sm:px-4 gap-1.5 sm:gap-2.5 shadow-md">
        {/* LEFT SECTION: Sidebar, Notebook Title & Page Stepper */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Sidebar Menu Toggle */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setSidebarOpen(!sidebarOpen);
            }}
            className={`p-2.5 rounded-xl transition-all ${
              sidebarOpen
                ? 'bg-indigo-600/30 text-indigo-400 border border-indigo-500/40 ring-1 ring-indigo-400/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80 border border-transparent'
            }`}
            title="Defterler ve Sayfalar Menüsü"
          >
            <Menu size={18} />
          </button>

          {/* Notebook Title Badge with Cover Color Dot */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-white/10 max-w-[120px] xs:max-w-[160px] sm:max-w-[210px] md:max-w-[230px] shadow-xs">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm ring-1 ring-white/20"
              style={{ backgroundColor: activeNotebook?.coverColor || '#3b82f6' }}
            />
            <span className="font-display font-semibold text-xs text-slate-100 truncate tracking-tight">
              {activeNotebook?.title || 'Notefree'}
            </span>
          </div>

          {/* Page Stepper & Bookmark Star */}
          <div className="flex items-center gap-1.5 pl-1.5 border-l border-white/10">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                togglePageBookmark(activePageIndex);
              }}
              className={`p-2 rounded-xl transition-all ${
                activeNotebook?.pages[activePageIndex]?.isBookmarked
                  ? 'text-amber-400 fill-amber-400 bg-amber-400/15 border border-amber-400/30 shadow-xs'
                  : 'text-slate-500 hover:text-amber-300 hover:bg-slate-800/60'
              }`}
              title="Bu Sayfayı Yer İmlerine Ekle/Kaldır"
            >
              <Star
                size={14}
                className={
                  activeNotebook?.pages[activePageIndex]?.isBookmarked
                    ? 'fill-amber-400'
                    : ''
                }
              />
            </button>

            <div className="flex items-center bg-slate-900/90 rounded-xl p-0.5 border border-white/10 shadow-xs">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setActivePageIndex(Math.max(0, activePageIndex - 1));
                }}
                disabled={activePageIndex === 0}
                className={`p-1.5 rounded-lg transition-colors ${
                  activePageIndex > 0
                    ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                    : 'text-slate-600 cursor-not-allowed'
                }`}
                title="Önceki Sayfa"
              >
                <ChevronLeft size={13} />
              </button>
              <span className="text-[11px] font-mono font-semibold px-2 text-slate-200">
                {activePageIndex + 1}/{totalPages}
              </span>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setActivePageIndex(Math.min(totalPages - 1, activePageIndex + 1));
                }}
                disabled={activePageIndex >= totalPages - 1}
                className={`p-1.5 rounded-lg transition-colors ${
                  activePageIndex < totalPages - 1
                    ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                    : 'text-slate-600 cursor-not-allowed'
                }`}
                title="Sonraki Sayfa"
              >
                <ChevronRight size={13} />
              </button>

              <div className="w-px h-3.5 bg-white/10 mx-0.5" />
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('medium');
                  addPage();
                }}
                className="p-1.5 rounded-lg text-indigo-400 hover:text-white hover:bg-indigo-600/40 transition-colors"
                title="Yeni Sayfa Ekle"
              >
                <Plus size={13} />
              </button>
            </div>
          </div>

          {/* Quick Library & Search (Tablets & Desktop) */}
          <div className="hidden md:flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setLibraryViewOpen(true);
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-indigo-400 hover:bg-slate-800/80 transition-colors"
              title="Kütüphane"
            >
              <Library size={16} />
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setSearchModalOpen(true);
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-indigo-400 hover:bg-slate-800/80 transition-colors"
              title="Arama (Cmd+K)"
            >
              <Search size={16} />
            </button>
          </div>
        </div>

        {/* CENTER SECTION: GoodNotes Professional Tool Dock (Visible on Tablets & Desktop >= 768px) */}
        {tabletToolbarPlacement !== 'top' ? (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-900/80 border border-white/10 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="font-semibold text-slate-200">
              Kalemlik: {tabletToolbarPlacement === 'left' ? 'Sol Kenarda' : 'Sağ Kenarda (Solak)'}
            </span>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setTabletToolbarPlacement(tabletToolbarPlacement === 'left' ? 'right' : 'top');
              }}
              className="px-2 py-0.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 font-semibold text-[11px] border border-indigo-500/30 ml-1 transition-colors"
            >
              {tabletToolbarPlacement === 'left' ? 'Sağa Al →' : 'Üste Al ↑'}
            </button>
          </div>
        ) : (
          <div className="hidden md:flex items-center bg-slate-900/90 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 shadow-lg shadow-black/40 gap-1 overflow-x-auto scrollbar-none max-w-[54vw] lg:max-w-none shrink">
            {/* Dock Placement Switcher */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setTabletToolbarPlacement('left');
              }}
              className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors shrink-0"
              title="Kalemliği Dikey Kenara Taşı (Sol / Sağ)"
            >
              <PanelLeft size={15} />
            </button>
            <div className="w-px h-5 bg-white/10 mx-0.5 shrink-0" />
          {/* 1. Fountain Pen */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setActiveTool('fountain');
            }}
            className={`p-2.5 rounded-xl transition-all duration-150 flex items-center justify-center shrink-0 ${
              activeTool === 'fountain'
                ? 'bg-gradient-to-b from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105 ring-1 ring-white/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Dolma Kalem"
          >
            <Feather size={16} />
          </button>

          {/* 2. Ballpoint Pen */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setActiveTool('ballpoint');
            }}
            className={`p-2.5 rounded-xl transition-all duration-150 flex items-center justify-center shrink-0 ${
              activeTool === 'ballpoint'
                ? 'bg-gradient-to-b from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105 ring-1 ring-white/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Tükenmez Kalem"
          >
            <PenTool size={16} />
          </button>

          {/* 3. Pencil */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setActiveTool('pencil');
            }}
            className={`p-2.5 rounded-xl transition-all duration-150 flex items-center justify-center shrink-0 ${
              activeTool === 'pencil'
                ? 'bg-gradient-to-b from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105 ring-1 ring-white/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Kurşun Kalem"
          >
            <Pencil size={16} />
          </button>

          {/* 4. Fineliner */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setActiveTool('fineliner');
            }}
            className={`p-2.5 rounded-xl transition-all duration-150 flex items-center justify-center shrink-0 ${
              activeTool === 'fineliner'
                ? 'bg-gradient-to-b from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105 ring-1 ring-white/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Teknik Fineliner Kalemi"
          >
            <PenLine size={16} />
          </button>

          {/* 5. Brush */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setActiveTool('brush');
            }}
            className={`p-2.5 rounded-xl transition-all duration-150 flex items-center justify-center shrink-0 ${
              activeTool === 'brush'
                ? 'bg-gradient-to-b from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105 ring-1 ring-white/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Fırça / Kaligrafi"
          >
            <Paintbrush size={16} />
          </button>

          {/* 6. Highlighter */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setActiveTool('highlighter');
            }}
            className={`p-2.5 rounded-xl transition-all duration-150 flex items-center justify-center shrink-0 ${
              activeTool === 'highlighter'
                ? 'bg-gradient-to-b from-amber-400 to-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/30 scale-105 ring-1 ring-white/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Fosforlu Kalem"
          >
            <Highlighter size={16} />
          </button>

          {/* 7. Eraser with Dropdown Settings */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => {
                if (activeTool === 'eraser') {
                  toggleDropdown('eraser');
                } else {
                  triggerHaptic('light');
                  setActiveTool('eraser');
                }
              }}
              className={`p-2.5 rounded-xl transition-all duration-150 flex items-center justify-center ${
                activeTool === 'eraser'
                  ? 'bg-gradient-to-b from-rose-500 to-rose-600 text-white shadow-lg shadow-rose-500/30 scale-105 ring-1 ring-white/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
              title="Silgi (Tekrar tıklayarak ayarları açın)"
            >
              <Eraser size={16} />
            </button>

            {openDropdown === 'eraser' && (
              <div className="absolute top-12 left-0 bg-slate-800 border border-slate-700 shadow-2xl rounded-2xl p-3 w-56 z-50 animate-in fade-in zoom-in-95 backdrop-blur-xl">
                <div className="text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                  Silgi Ayarları
                </div>

                <div className="flex bg-slate-900 rounded-lg p-0.5 mb-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEraserMode('stroke');
                      closeDropdown();
                    }}
                    className={`flex-1 py-1 text-xs rounded-md transition-colors ${
                      toolSettings.eraserMode === 'stroke'
                        ? 'bg-rose-600 text-white font-medium'
                        : 'text-slate-400'
                    }`}
                  >
                    Tüm Çizgi
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEraserMode('pixel');
                      closeDropdown();
                    }}
                    className={`flex-1 py-1 text-xs rounded-md transition-colors ${
                      toolSettings.eraserMode === 'pixel'
                        ? 'bg-rose-600 text-white font-medium'
                        : 'text-slate-400'
                    }`}
                  >
                    Piksel
                  </button>
                </div>

                <label className="flex items-center justify-between text-xs text-slate-200 py-1.5 cursor-pointer hover:text-white">
                  <span>Yalnızca Fosforluyu Sil</span>
                  <input
                    type="checkbox"
                    checked={toolSettings.eraseHighlighterOnly}
                    onChange={toggleEraseHighlighterOnly}
                    className="rounded accent-rose-500 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between text-xs text-slate-200 py-1.5 cursor-pointer hover:text-white">
                  <span>Otomatik Kaleme Dön</span>
                  <input
                    type="checkbox"
                    checked={toolSettings.autoDeselectEraser}
                    onChange={toggleAutoDeselectEraser}
                    className="rounded accent-rose-500 cursor-pointer"
                  />
                </label>
              </div>
            )}
          </div>

          {/* 8. Lasso Tool */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setActiveTool('lasso');
            }}
            className={`p-2.5 rounded-xl transition-all duration-150 flex items-center justify-center shrink-0 ${
              activeTool === 'lasso'
                ? 'bg-gradient-to-b from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105 ring-1 ring-white/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Kement Seçim Aracı (Lasso)"
          >
            <Scissors size={16} />
          </button>

          {/* 9. Shapes Menu */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => {
                setActiveTool('shape');
                toggleDropdown('shape');
              }}
              className={`p-2.5 rounded-xl transition-all duration-150 flex items-center justify-center ${
                activeTool === 'shape'
                  ? 'bg-gradient-to-b from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30 ring-1 ring-white/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
              title="Geometrik Şekiller"
            >
              <Shapes size={16} />
            </button>

            {openDropdown === 'shape' && (
              <div className="absolute top-12 left-0 bg-slate-850 border border-slate-750 shadow-2xl rounded-2xl p-3 flex flex-col gap-2.5 z-50 animate-in fade-in zoom-in-95 min-w-[280px] backdrop-blur-xl">
                <div className="text-[11px] font-semibold text-slate-400 px-1 uppercase tracking-wider">
                  Şekil Türü
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {SHAPE_BUTTONS.map((shp) => (
                    <button
                      key={shp.type}
                      type="button"
                      onClick={() => {
                        setSelectedShape(shp.type);
                        closeDropdown();
                      }}
                      className={`flex items-center justify-center gap-1.5 py-1.5 px-2 text-[11px] rounded-lg transition-colors font-medium ${
                        toolSettings.selectedShape === shp.type
                          ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400'
                          : 'text-slate-300 hover:bg-slate-750 bg-slate-800/40 border border-slate-700/50'
                      }`}
                      title={shp.label}
                    >
                      {shp.icon}
                      <span className="truncate">{shp.label}</span>
                    </button>
                  ))}
                </div>

                <div className="h-px bg-slate-750 my-0.5" />

                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Şekil İç Dolgusu
                  </span>
                  <span className="text-[10px] text-indigo-400 font-mono font-semibold">
                    {toolSettings.shapeFillColor
                      ? `%${Math.round((toolSettings.shapeFillOpacity ?? 0.25) * 100)}`
                      : 'Dolgusuz'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap px-0.5">
                  <button
                    type="button"
                    onClick={() => setShapeFillColor(undefined)}
                    className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all ${
                      !toolSettings.shapeFillColor
                        ? 'border-rose-500 bg-rose-500/20 text-rose-400 ring-1 ring-rose-400'
                        : 'border-slate-700 bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                    title="Dolgusuz"
                  >
                    <Ban size={12} />
                  </button>

                  {[
                    { name: 'Sarı', color: '#fef08a' },
                    { name: 'Gül', color: '#fecdd3' },
                    { name: 'Nane', color: '#a7f3d0' },
                    { name: 'Mavi', color: '#bae6fd' },
                    { name: 'Lavanta', color: '#ddd6fe' },
                    { name: 'Turuncu', color: '#fed7aa' },
                    { name: 'Grafit', color: '#cbd5e1' },
                  ].map(({ name, color }) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setShapeFillColor(color)}
                      className={`w-6 h-6 rounded-md border transition-all flex items-center justify-center ${
                        toolSettings.shapeFillColor === color
                          ? 'border-white scale-110 shadow-sm ring-2 ring-indigo-500'
                          : 'border-slate-700/80 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                      title={name}
                    >
                      {toolSettings.shapeFillColor === color && (
                        <Check size={11} className="text-slate-900 font-bold" />
                      )}
                    </button>
                  ))}
                </div>

                {toolSettings.shapeFillColor && (
                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg">
                    <span className="text-[10px] text-slate-400 px-1 font-medium">Opaklık:</span>
                    {[0.15, 0.3, 0.6, 1.0].map((op) => (
                      <button
                        key={op}
                        type="button"
                        onClick={() => setShapeFillOpacity(op)}
                        className={`flex-1 py-0.5 text-[10px] rounded transition-colors font-mono ${
                          Math.abs((toolSettings.shapeFillOpacity ?? 0.25) - op) < 0.08
                            ? 'bg-indigo-600 text-white font-bold'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        %{Math.round(op * 100)}
                      </button>
                    ))}
                  </div>
                )}

                <div className="h-px bg-slate-750 my-0.5" />

                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={toggleAngleSnap}
                    className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between border transition-all ${
                      toolSettings.angleSnap
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    <span>15° Açı Kilidi</span>
                    {toolSettings.angleSnap && <Check size={13} className="text-indigo-400" />}
                  </button>

                  <button
                    type="button"
                    onClick={toggleGridSnap}
                    className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between border transition-all ${
                      toolSettings.gridSnap
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    <span>Izgara Snap</span>
                    {toolSettings.gridSnap && <Check size={13} className="text-indigo-400" />}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={toggleAutoDetectShape}
                  className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between border transition-all ${
                    toolSettings.autoDetectShape
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-semibold'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={13} className="text-amber-400" />
                    <span>Hold-to-Snap Sabitleme</span>
                  </div>
                  {toolSettings.autoDetectShape && <Check size={13} className="text-amber-400" />}
                </button>
              </div>
            )}
          </div>

          {/* 10. Text Tool */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setActiveTool('text');
            }}
            className={`p-2.5 rounded-xl transition-all duration-150 flex items-center justify-center shrink-0 ${
              activeTool === 'text'
                ? 'bg-gradient-to-b from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105 ring-1 ring-white/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Metin Kutusu ('T')"
          >
            <Type size={16} />
          </button>

          {/* 11. MORE INKING & STEM TOOLS DROPDOWN (Ruler, Compass, Protractor, Tape, Laser, Stamps, etc.) */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => toggleDropdown('moreTools')}
              className={`p-2.5 rounded-xl transition-all duration-150 flex items-center justify-center gap-0.5 relative ${
                isSecondaryToolActive
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 ring-1 ring-indigo-400/40'
                  : 'text-slate-400 hover:text-indigo-300 hover:bg-slate-800/60'
              }`}
              title="Geometri, STEM & İleri Çizim Araçları (Cetvel, Açıölçer, Pergel, Kaşe, vb.)"
            >
              <Compass size={16} />
              <ChevronDown size={10} className="text-slate-400" />
              {isSecondaryToolActive && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              )}
            </button>

            {openDropdown === 'moreTools' && (
              <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-750 shadow-2xl rounded-2xl p-3 w-72 z-50 animate-in fade-in zoom-in-95 backdrop-blur-xl space-y-2.5">
                <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between pb-1.5 border-b border-slate-800">
                  <span>Geometri & İleri Araçlar</span>
                  <Compass size={13} className="text-indigo-400" />
                </div>

                {/* Sub-grid of advanced tools */}
                <div className="grid grid-cols-4 gap-1.5">
                  {/* Neon Pen */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTool('neon');
                      closeDropdown();
                    }}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[10px] font-medium transition-all ${
                      activeTool === 'neon'
                        ? 'bg-fuchsia-600/30 border-fuchsia-500 text-fuchsia-300'
                        : 'bg-slate-800/60 border-slate-750 text-slate-400 hover:text-white'
                    }`}
                    title="Neon Kalemi"
                  >
                    <Flame size={16} className="text-fuchsia-400" />
                    <span>Neon</span>
                  </button>

                  {/* Dashed Pen */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTool('dashed');
                      closeDropdown();
                    }}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[10px] font-medium transition-all ${
                      activeTool === 'dashed'
                        ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                        : 'bg-slate-800/60 border-slate-750 text-slate-400 hover:text-white'
                    }`}
                    title="Kesikli Çizgi"
                  >
                    <Spline size={16} className="text-indigo-400" />
                    <span>Kesikli</span>
                  </button>

                  {/* Tape Tool */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTool('tape');
                      closeDropdown();
                    }}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[10px] font-medium transition-all ${
                      activeTool === 'tape'
                        ? 'bg-amber-600/30 border-amber-500 text-amber-300'
                        : 'bg-slate-800/60 border-slate-750 text-slate-400 hover:text-white'
                    }`}
                    title="Gizleme Bandı"
                  >
                    <Bandage size={16} className="text-amber-400" />
                    <span>Bant</span>
                  </button>

                  {/* Laser Pointer */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTool('laser');
                      closeDropdown();
                    }}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[10px] font-medium transition-all ${
                      activeTool === 'laser'
                        ? 'bg-rose-600/30 border-rose-500 text-rose-300'
                        : 'bg-slate-800/60 border-slate-750 text-slate-400 hover:text-white'
                    }`}
                    title="Lazer İşaretçi"
                  >
                    <Zap size={16} className="text-rose-400" />
                    <span>Lazer</span>
                  </button>

                  {/* Ruler */}
                  <button
                    type="button"
                    onClick={() => {
                      toggleRuler();
                      closeDropdown();
                    }}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[10px] font-medium transition-all ${
                      rulerVisible
                        ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                        : 'bg-slate-800/60 border-slate-750 text-slate-400 hover:text-white'
                    }`}
                    title="Milimetrik Cetvel"
                  >
                    <Compass size={16} className="text-indigo-400" />
                    <span>Cetvel</span>
                  </button>

                  {/* Protractor */}
                  <button
                    type="button"
                    onClick={() => {
                      toggleProtractor();
                      closeDropdown();
                    }}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[10px] font-medium transition-all ${
                      protractorVisible
                        ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                        : 'bg-slate-800/60 border-slate-750 text-slate-400 hover:text-white'
                    }`}
                    title="360° İletki / Açıölçer"
                  >
                    <Disc size={16} className="text-cyan-400" />
                    <span>Açıölçer</span>
                  </button>

                  {/* Compass */}
                  <button
                    type="button"
                    onClick={() => {
                      toggleCompass();
                      closeDropdown();
                    }}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[10px] font-medium transition-all ${
                      compassVisible
                        ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                        : 'bg-slate-800/60 border-slate-750 text-slate-400 hover:text-white'
                    }`}
                    title="Hassas Pergel"
                  >
                    <CircleDot size={16} className="text-emerald-400" />
                    <span>Pergel</span>
                  </button>

                  {/* Symmetry */}
                  <button
                    type="button"
                    onClick={() => {
                      toggleSymmetry();
                      closeDropdown();
                    }}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[10px] font-medium transition-all ${
                      symmetryEnabled
                        ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                        : 'bg-slate-800/60 border-slate-750 text-slate-400 hover:text-white'
                    }`}
                    title="Ayna / Simetri Çizimi"
                  >
                    <FlipHorizontal size={16} className="text-indigo-400" />
                    <span>Simetri</span>
                  </button>

                  {/* Sticky Note */}
                  <button
                    type="button"
                    onClick={() => {
                      addStickyNoteToCurrentPage({
                        id: `sn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                        x: 180,
                        y: 200,
                        width: 210,
                        height: 180,
                        color: 'yellow',
                        text: '',
                        createdAt: Date.now(),
                      });
                      closeDropdown();
                    }}
                    className="p-2 rounded-xl border bg-slate-800/60 border-slate-750 text-slate-400 hover:text-amber-300 flex flex-col items-center gap-1 text-[10px] font-medium transition-all"
                    title="Yapışkan Post-It Notu"
                  >
                    <StickyNote size={16} className="text-amber-400" />
                    <span>Not Ekle</span>
                  </button>

                  {/* FAZ AF: İnteraktif Tablo */}
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('medium');
                      addTableToCurrentPage(3, 3, 160, 200);
                      closeDropdown();
                    }}
                    className="p-2 rounded-xl border bg-slate-800/60 border-slate-750 text-slate-400 hover:text-indigo-300 flex flex-col items-center gap-1 text-[10px] font-medium transition-all"
                    title="İnteraktif Çizelge & Tablo Ekle (3x3)"
                  >
                    <Table2 size={16} className="text-indigo-400" />
                    <span>Tablo</span>
                  </button>

                  {/* Akıllı Bağlantı Oku (Flowchart / Zihin Haritası) */}
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('medium');
                      setActiveTool('connector');
                      closeDropdown();
                    }}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[10px] font-medium transition-all ${
                      activeTool === 'connector'
                        ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                        : 'bg-slate-800/60 border-slate-750 text-slate-400 hover:text-blue-300'
                    }`}
                    title="Manyetik Bağlantı Oku & Akış Şeması"
                  >
                    <Workflow size={16} className="text-blue-400" />
                    <span>Bağlayıcı</span>
                  </button>

                  {/* Kaşe & Damga */}
                  <button
                    type="button"
                    onClick={() => {
                      setStampCreatorModalOpen(true);
                      closeDropdown();
                    }}
                    className="p-2 rounded-xl border bg-slate-800/60 border-slate-750 text-slate-400 hover:text-rose-300 flex flex-col items-center gap-1 text-[10px] font-medium transition-all"
                    title="Dinamik Kaşe & Damga Stüdyosu"
                  >
                    <Stamp size={16} className="text-rose-400" />
                    <span>Kaşe</span>
                  </button>

                  {/* Eyedropper */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTool('eyedropper');
                      closeDropdown();
                    }}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[10px] font-medium transition-all ${
                      activeTool === 'eyedropper'
                        ? 'bg-cyan-600/30 border-cyan-500 text-cyan-300'
                        : 'bg-slate-800/60 border-slate-750 text-slate-400 hover:text-white'
                    }`}
                    title="Renk Damlalığı"
                  >
                    <Pipette size={16} className="text-cyan-400" />
                    <span>Damlalık</span>
                  </button>

                  {/* Flood Fill */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTool('fill');
                      closeDropdown();
                    }}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[10px] font-medium transition-all ${
                      activeTool === 'fill'
                        ? 'bg-violet-600/30 border-violet-500 text-violet-300'
                        : 'bg-slate-800/60 border-slate-750 text-slate-400 hover:text-white'
                    }`}
                    title="Boya Kovası"
                  >
                    <PaintBucket size={16} className="text-violet-400" />
                    <span>Doldur</span>
                  </button>

                  {/* Zoom Window */}
                  <button
                    type="button"
                    onClick={() => {
                      toggleZoomWindow();
                      closeDropdown();
                    }}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[10px] font-medium transition-all ${
                      zoomWindowOpen
                        ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                        : 'bg-slate-800/60 border-slate-750 text-slate-400 hover:text-white'
                    }`}
                    title="Büyüteç Penceresi (Z)"
                  >
                    <ZoomIn size={16} className="text-indigo-400" />
                    <span>Büyüteç</span>
                  </button>

                  {/* Scratchpad */}
                  <button
                    type="button"
                    onClick={() => {
                      toggleScratchpad();
                      closeDropdown();
                    }}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[10px] font-medium transition-all ${
                      scratchpadOpen
                        ? 'bg-amber-600/30 border-amber-500 text-amber-300'
                        : 'bg-slate-800/60 border-slate-750 text-slate-400 hover:text-white'
                    }`}
                    title="Hızlı Karalama (Q)"
                  >
                    <SquarePen size={16} className="text-amber-400" />
                    <span>Karalama</span>
                  </button>

                  {/* Radar Minimap */}
                  <button
                    type="button"
                    onClick={() => {
                      toggleMinimap();
                      closeDropdown();
                    }}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[10px] font-medium transition-all ${
                      minimapVisible
                        ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                        : 'bg-slate-800/60 border-slate-750 text-slate-400 hover:text-white'
                    }`}
                    title="Tuval Radarı (N)"
                  >
                    <MapIcon size={16} className="text-indigo-400" />
                    <span>Radar</span>
                  </button>

                  {/* Planner Tabs */}
                  <button
                    type="button"
                    onClick={() => {
                      togglePlannerTabs();
                      closeDropdown();
                    }}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[10px] font-medium transition-all ${
                      plannerTabsVisible
                        ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                        : 'bg-slate-800/60 border-slate-750 text-slate-400 hover:text-white'
                    }`}
                    title="Ajanda Sekmeleri (J)"
                  >
                    <Bookmark size={16} className="text-indigo-400" />
                    <span>Ajanda</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* FAVORITE COLOR SLOTS OR LASER QUICK CONTROLS */}
          {activeTool === 'laser' ? (
            <div className="flex items-center gap-2 px-1 shrink-0">
              {/* Laser Style */}
              <div className="flex bg-slate-800 p-0.5 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setLaserStyle('trail');
                    triggerHaptic('light');
                  }}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                    toolSettings.laserStyle !== 'spotlight'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Kuyruklu Lazer Çizgisi"
                >
                  <Zap size={13} />
                  <span>İz Lazer</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLaserStyle('spotlight');
                    triggerHaptic('light');
                  }}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                    toolSettings.laserStyle === 'spotlight'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Spot Işığı Modu"
                >
                  <Lightbulb size={13} />
                  <span>Spot Işığı</span>
                </button>
              </div>

              {/* Laser Color Palette */}
              <div className="flex items-center gap-1.5 px-1 bg-slate-800/80 py-1 rounded-xl">
                {[
                  { label: 'Kırmızı', color: '#ef4444' },
                  { label: 'Neon Yeşil', color: '#22c55e' },
                  { label: 'Elektrik Mavisi', color: '#06b6d4' },
                  { label: 'Mor', color: '#a855f7' },
                ].map((c) => (
                  <button
                    key={c.color}
                    type="button"
                    onClick={() => {
                      setLaserColor(c.color);
                      triggerHaptic('light');
                    }}
                    style={{ backgroundColor: c.color }}
                    className={`w-5 h-5 rounded-full border-2 transition-transform ${
                      (toolSettings.laserColor || '#ef4444') === c.color
                        ? 'border-white scale-110 shadow-md'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                    title={c.label}
                  />
                ))}
              </div>

              {/* Start Presentation Mode */}
              <button
                type="button"
                onClick={() => {
                  setPresentationMode(true);
                  triggerHaptic('medium');
                }}
                className="px-2.5 py-1 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20"
                title="Tam Ekran Sunum Modunu Başlat"
              >
                <Presentation size={13} />
                <span>Sunumu Başlat</span>
              </button>
            </div>
          ) : (
            <>
              <div className="w-px h-5 bg-slate-750 mx-1 shrink-0" />

              {/* FAVORITE COLOR SLOTS & FULL PALETTE STUDIO */}
              <div className="flex items-center gap-1.5 px-1 relative shrink-0">
                {toolSettings.favoriteColors.map((color, index) => {
                  const isSlotActive =
                    toolSettings.activeColorIndex === index && toolSettings.color === color;
                  return (
                    <div key={index} className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          selectFavoriteColor(index);
                        }}
                        onDoubleClick={() => {
                          setColorStudioSlot(index);
                          setColorStudioOpen(true);
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setColorStudioSlot(index);
                          setColorStudioOpen(true);
                        }}
                        className={`w-6 h-6 rounded-full transition-transform flex items-center justify-center shadow-sm ${
                          isSlotActive
                            ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110 shadow-md'
                            : 'hover:scale-105 opacity-80 hover:opacity-100 ring-1 ring-white/20'
                        }`}
                        style={{ backgroundColor: color }}
                        title={`Renk Yuvası ${index + 1} (Tıkla seç, sağ tıkla/çift tıkla paletten değiştir)`}
                      >
                        {isSlotActive && (
                          <Check
                            size={11}
                            className={
                              color === '#facc15' || color === '#ffffff' || color === '#fef08a'
                                ? 'text-black font-bold'
                                : 'text-white font-bold'
                            }
                          />
                        )}
                      </button>
                    </div>
                  );
                })}

                {/* Pro Full Spectrum & Preset Color Palette Button */}
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setColorStudioSlot(null);
                    setColorStudioOpen(!colorStudioOpen);
                  }}
                  className={`p-1.5 rounded-xl transition-all flex items-center justify-center relative ${
                    colorStudioOpen
                      ? 'bg-indigo-600/30 text-indigo-300 ring-1 ring-indigo-400 border border-indigo-500/40 shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80 border border-transparent'
                  }`}
                  title="Tüm Renkler & Palet Stüdyosu (Pastel, Neon, Morandi, Fosforlu, Özel HEX)"
                >
                  <Palette size={16} className="text-indigo-400" />
                  <span
                    className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-slate-900 shadow-xs"
                    style={{ backgroundColor: toolSettings.color }}
                  />
                </button>
              </div>

              <div className="w-px h-5 bg-slate-750 mx-1 shrink-0" />

              {/* FAVORITE SIZES */}
              <div className="flex items-center gap-1 px-1 shrink-0">
                {toolSettings.favoriteSizes.map((size, index) => {
                  const isSizeActive =
                    toolSettings.activeSizeIndex === index && toolSettings.size === size;
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => selectFavoriteSize(index)}
                      className={`w-6 h-6 rounded-lg font-mono text-[11px] font-semibold flex items-center justify-center transition-all ${
                        isSizeActive
                          ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                      }`}
                      title={`Uç: ${size}px`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

        {/* RIGHT SECTION: Undo/Redo & Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Undo & Redo (Always visible) */}
          <div className="flex items-center bg-slate-900/90 rounded-xl p-0.5 border border-white/10 shadow-xs">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                undo();
              }}
              disabled={undoStack.length === 0}
              className={`p-1.5 rounded-lg transition-colors ${
                undoStack.length > 0
                  ? 'text-slate-200 hover:text-white hover:bg-slate-800'
                  : 'text-slate-600 cursor-not-allowed'
              }`}
              title="Geri Al (Cmd+Z)"
            >
              <Undo2 size={16} />
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                redo();
              }}
              disabled={redoStack.length === 0}
              className={`p-1.5 rounded-lg transition-colors ${
                redoStack.length > 0
                  ? 'text-slate-200 hover:text-white hover:bg-slate-800'
                  : 'text-slate-600 cursor-not-allowed'
              }`}
              title="Yinele (Cmd+Shift+Z)"
            >
              <Redo2 size={16} />
            </button>
          </div>

          {/* Page Grid Manager (Always visible) */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setPageManagerModalOpen(true);
            }}
            className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800/80 rounded-xl transition-colors"
            title="Tüm Sayfaları Gör (Küçük Resim Izgarası)"
          >
            <Grid size={17} />
          </button>

          {/* Export Studio (Always visible) */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setExportModalOpen(true);
            }}
            className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800/80 rounded-xl transition-colors"
            title="Dışa Aktarma Stüdyosu (PDF, PNG, JPEG)"
          >
            <FileDown size={17} />
          </button>

          {/* Zen / Focus Mode Toggle */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('medium');
              toggleZenMode();
            }}
            className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800/80 rounded-xl transition-colors"
            title="Odaklanma Modu (Tam Ekran)"
          >
            <Maximize2 size={17} />
          </button>

          {/* Quick Voice Dictation (Speech-to-Text) */}
          <button
            type="button"
            onClick={() => {
              if (isDictating) {
                const text = speechTranscriptionService.stopListening();
                setIsDictating(false);
                if (text && text.trim()) {
                  addStickyNoteToCurrentPage({
                    id: `sn_dict_${Date.now()}`,
                    x: 250,
                    y: 280,
                    width: 240,
                    height: 180,
                    color: 'blue',
                    text: text.trim(),
                    createdAt: Date.now(),
                  });
                  triggerHaptic('medium');
                }
                setLiveTranscript('');
              } else {
                if (!speechTranscriptionService.isSupported()) {
                  alert('Tarayıcınız sesli dikte özelliğini desteklemiyor.');
                  return;
                }
                triggerHaptic('light');
                setLiveTranscript('');
                speechTranscriptionService.startListening((full, interim) => {
                  setLiveTranscript(full + (interim ? ' ' + interim : ''));
                });
                setIsDictating(true);
              }
            }}
            className={`p-2 rounded-xl transition-all ${
              isDictating
                ? 'bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-600/40 ring-2 ring-rose-400'
                : 'text-slate-400 hover:text-rose-400 hover:bg-slate-800/80'
            }`}
            title={isDictating ? 'Dikteyi Tamamla ve Nota Dönüştür' : 'Sesli Dikte (Konuşarak Not Al)'}
          >
            {isDictating ? <MicOff size={17} /> : <Mic size={17} />}
          </button>

          {/* DESKTOP-ONLY ACTIONS (>= 1280px / xl) */}
          <div className="hidden xl:flex items-center gap-1">
            {/* Stickers Drawer */}
            <button
              type="button"
              onClick={() => setStickersDrawerOpen(true)}
              className="p-2 text-amber-400 hover:text-amber-300 hover:bg-slate-800 rounded-xl transition-colors"
              title="Çıkartmalar"
            >
              <Sparkles size={17} />
            </button>

            {/* Layers Drawer */}
            <button
              type="button"
              onClick={() => setLayersDrawerOpen(true)}
              className={`p-2 rounded-xl transition-all ${
                layersDrawerOpen
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-indigo-400 hover:bg-slate-800'
              }`}
              title="Katmanlar Yöneticisi"
            >
              <Layers size={17} />
            </button>

            {/* FAZ AK: Outline & Table of Contents Drawer */}
            <button
              type="button"
              onClick={() => setOutlineDrawerOpen(!outlineDrawerOpen)}
              className={`p-2 rounded-xl transition-all ${
                outlineDrawerOpen
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-indigo-400 hover:bg-slate-800'
              }`}
              title="İçindekiler & Fihrist (O)"
            >
              <ListTree size={17} />
            </button>

            {/* Template Selector */}
            <button
              type="button"
              onClick={() => setTemplateModalOpen(true)}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
              title="Şablon Değiştir"
            >
              <LayoutTemplate size={17} />
            </button>

            {/* Cornell Studio & Active Recall Button */}
            <button
              type="button"
              onClick={() => setCornellAssistantModalOpen(true)}
              className={`p-2 rounded-xl transition-all relative ${
                currentPage?.template === 'cornell'
                  ? 'text-amber-400 bg-amber-500/15 hover:bg-amber-500/25 ring-1 ring-amber-500/40'
                  : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800'
              }`}
              title={
                currentPage?.template === 'cornell'
                  ? `Cornell Stüdyosu (${cornellStudyMode !== 'none' ? 'Ezber Modu Aktif' : 'Normal'})`
                  : 'Cornell Not Alma Stüdyosu'
              }
            >
              <GraduationCap size={17} />
              {currentPage?.template === 'cornell' && cornellStudyMode !== 'none' && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              )}
            </button>

            {/* Math AI */}
            <button
              type="button"
              onClick={() => openMathModal()}
              className="p-2 text-slate-400 hover:text-purple-400 hover:bg-slate-800 rounded-xl transition-colors"
              title="Math AI Çözücü"
            >
              <Calculator size={17} />
            </button>

            {/* STEM Function Plotter */}
            <button
              type="button"
              onClick={() => openFunctionPlotterModal()}
              className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-xl transition-colors"
              title="STEM 2D Fonksiyon Çizici"
            >
              <TrendingUp size={17} />
            </button>

            {/* Study Sets */}
            <button
              type="button"
              onClick={() => setStudySetsModalOpen(true)}
              className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-xl transition-colors"
              title="Çalışma Kartları"
            >
              <Brain size={17} />
            </button>

            {/* Split Screen Dual Notebook */}
            <button
              type="button"
              onClick={() => {
                if (splitNotebook.isOpen) {
                  closeDualNotebook();
                } else {
                  const other = notebooks.find((n) => n.id !== activeNotebookId);
                  openDualNotebook(other ? other.id : activeNotebookId || '');
                }
              }}
              className={`p-2 rounded-xl transition-all ${
                splitNotebook.isOpen
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-indigo-400 hover:bg-slate-800'
              }`}
              title="Çift Defter Görünümü"
            >
              <Split size={17} />
            </button>

            {/* Pomodoro */}
            <PomodoroBarWidget />

            {/* Audio Recorder */}
            <AudioPlayerBar />

            {/* YouTube */}
            <button
              type="button"
              onClick={toggleYouTube}
              className={`px-2.5 py-1.5 rounded-xl font-medium text-xs flex items-center gap-1.5 transition-all shadow-sm ${
                youtube.isOpen
                  ? 'bg-red-600 text-white shadow-red-600/30'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/60'
              }`}
              title="YouTube Paneli"
            >
              <Youtube size={15} className={youtube.isOpen ? 'fill-white' : 'text-red-500'} />
              <span>YouTube</span>
            </button>

            {/* 🌿 Göz Konforu (True Tone Amber Kağıt Sıcaklığı) */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                toggleEyeComfortMode();
              }}
              className={`p-2 rounded-xl transition-all ${
                eyeComfortMode
                  ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/50 shadow-sm'
                  : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800'
              }`}
              title={`Göz Konforu Filtresi (True Tone Amber) ${eyeComfortMode ? 'Açık' : 'Kapalı'}`}
            >
              <Sun size={17} className={eyeComfortMode ? 'fill-amber-400/30' : ''} />
            </button>
          </div>

          {/* OVERFLOW ACTIONS DROPDOWN (< 1280px / Tablets & Mobile) */}
          <div className="relative flex xl:hidden">
            <button
              type="button"
              onClick={() => toggleDropdown('overflowActions')}
              className={`p-2 rounded-xl transition-all relative ${
                openDropdown === 'overflowActions'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Tüm İşlemler & Ekstra Araçlar"
            >
              <MoreHorizontal size={18} />
              {isActivityActive && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              )}
            </button>

            {openDropdown === 'overflowActions' && (
              <div className="absolute top-12 right-0 bg-slate-900 border border-slate-750 shadow-2xl rounded-2xl p-3.5 w-76 sm:w-80 z-50 animate-in fade-in zoom-in-95 backdrop-blur-2xl text-xs max-h-[82vh] overflow-y-auto space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-bold text-white text-sm">İşlemler & Stüdyo</span>
                  <button
                    type="button"
                    onClick={closeDropdown}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Section 1: Sayfa & Katmanlar */}
                <div>
                  <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1.5">
                    Sayfa & Katmanlar
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setTemplateModalOpen(true);
                        closeDropdown();
                      }}
                      className="p-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-750 rounded-xl flex items-center gap-2 text-slate-300 hover:text-white text-left"
                    >
                      <LayoutTemplate size={15} className="text-indigo-400 shrink-0" />
                      <span className="truncate">Şablon Değiştir</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setLayersDrawerOpen(true);
                        closeDropdown();
                      }}
                      className="p-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-750 rounded-xl flex items-center gap-2 text-slate-300 hover:text-white text-left"
                    >
                      <Layers size={15} className="text-cyan-400 shrink-0" />
                      <span className="truncate">Katmanlar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setOutlineDrawerOpen(true);
                        closeDropdown();
                      }}
                      className="p-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-750 rounded-xl flex items-center gap-2 text-slate-300 hover:text-white text-left"
                    >
                      <ListTree size={15} className="text-indigo-400 shrink-0" />
                      <span className="truncate">İçindekiler</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDocImportModalOpen(true);
                        closeDropdown();
                      }}
                      className="p-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-750 rounded-xl flex items-center gap-2 text-slate-300 hover:text-white text-left"
                    >
                      <UploadCloud size={15} className="text-amber-400 shrink-0" />
                      <span className="truncate">PDF/Word Yükle</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        clearCurrentPageStrokes();
                        closeDropdown();
                      }}
                      className="p-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-750 rounded-xl flex items-center gap-2 text-rose-400 hover:text-rose-300 text-left"
                    >
                      <Trash2 size={15} className="shrink-0" />
                      <span className="truncate">Sayfayı Temizle</span>
                    </button>
                  </div>
                </div>

                {/* Section 2: STEM, Zeka & Notlar */}
                <div>
                  <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1.5">
                    STEM, Zeka & Notlar
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        openMathModal();
                        closeDropdown();
                      }}
                      className="p-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-750 rounded-xl flex items-center gap-2 text-slate-300 hover:text-white text-left"
                    >
                      <Calculator size={15} className="text-purple-400 shrink-0" />
                      <span className="truncate">Math AI Çözücü</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        openFunctionPlotterModal();
                        closeDropdown();
                      }}
                      className="p-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-750 rounded-xl flex items-center gap-2 text-slate-300 hover:text-white text-left"
                    >
                      <TrendingUp size={15} className="text-cyan-400 shrink-0" />
                      <span className="truncate">Grafik Çizici</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setStudySetsModalOpen(true);
                        closeDropdown();
                      }}
                      className="p-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-750 rounded-xl flex items-center gap-2 text-slate-300 hover:text-white text-left"
                    >
                      <Brain size={15} className="text-amber-400 shrink-0" />
                      <span className="truncate">Flaşkartlar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setStickersDrawerOpen(true);
                        closeDropdown();
                      }}
                      className="p-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-750 rounded-xl flex items-center gap-2 text-slate-300 hover:text-white text-left"
                    >
                      <Sparkles size={15} className="text-amber-400 shrink-0" />
                      <span className="truncate">Çıkartmalar</span>
                    </button>
                  </div>
                </div>

                {/* Section 3: İşbirliği & Görünüm */}
                <div>
                  <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1.5">
                    İşbirliği & Görünüm
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setCollaborationModalOpen(true);
                        closeDropdown();
                      }}
                      className="p-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-750 rounded-xl flex items-center gap-2 text-slate-300 hover:text-white text-left"
                    >
                      <Users size={15} className="text-emerald-400 shrink-0" />
                      <span className="truncate">Birlikte Çizim</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (splitNotebook.isOpen) {
                          closeDualNotebook();
                        } else {
                          const other = notebooks.find((n) => n.id !== activeNotebookId);
                          openDualNotebook(other ? other.id : activeNotebookId || '');
                        }
                        closeDropdown();
                      }}
                      className="p-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-750 rounded-xl flex items-center gap-2 text-slate-300 hover:text-white text-left"
                    >
                      <Split size={15} className="text-indigo-400 shrink-0" />
                      <span className="truncate">Çift Defter</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const next = !presentationMode;
                        setPresentationMode(next);
                        if (next && document.documentElement.requestFullscreen) {
                          document.documentElement.requestFullscreen().catch(() => {});
                        }
                        closeDropdown();
                      }}
                      className="p-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-750 rounded-xl flex items-center gap-2 text-slate-300 hover:text-white text-left"
                    >
                      <Presentation size={15} className="text-rose-400 shrink-0" />
                      <span className="truncate">Sunum Modu</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        toggleEyeComfortMode();
                        triggerHaptic('light');
                        closeDropdown();
                      }}
                      className={`p-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-750 rounded-xl flex items-center gap-2 text-left ${
                        eyeComfortMode
                          ? 'text-amber-400 border-amber-500/40 bg-amber-500/10'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <Sun size={15} className="text-amber-400 shrink-0" />
                      <span className="truncate">Göz Konforu ({eyeComfortMode ? 'Açık' : 'Kapalı'})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        invertCurrentPageInks();
                        closeDropdown();
                      }}
                      className="p-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-750 rounded-xl flex items-center gap-2 text-slate-300 hover:text-white text-left"
                    >
                      <Sun size={15} className="text-amber-300 shrink-0" />
                      <span className="truncate">Mürekkep Zıtlığı</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShortcutsModalOpen(true);
                        closeDropdown();
                      }}
                      className="p-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-750 rounded-xl flex items-center gap-2 text-slate-300 hover:text-white text-left"
                    >
                      <Keyboard size={15} className="text-amber-400 shrink-0" />
                      <span className="truncate">Kısayol Tuşları</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (activeNotebook) exportNotebookAsNotefree(activeNotebook);
                        closeDropdown();
                      }}
                      className="p-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-750 rounded-xl flex items-center gap-2 text-slate-300 hover:text-white text-left"
                    >
                      <FolderDown size={15} className="text-indigo-400 shrink-0" />
                      <span className="truncate">.notefree İndir</span>
                    </button>
                  </div>
                </div>

                {/* Section 4: Medya & Çalışma Çubukları */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Medya & Ses
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        toggleYouTube();
                        closeDropdown();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30 text-[11px] font-bold flex items-center gap-1.5"
                    >
                      <Youtube size={14} />
                      <span>YouTube</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <PomodoroBarWidget />
                    <AudioPlayerBar />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. DEDICATED MOBILE FLOATING INKING DOCK (Floating at bottom on Mobile < 768px) */}
      <div className="md:hidden fixed bottom-3 left-1/2 -translate-x-1/2 z-40 max-w-[96vw] select-none pointer-events-auto">
        {mobileToolDockCollapsed ? (
          /* Collapsed Mini Thumb Pill */
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              toggleMobileToolDockCollapsed();
            }}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#090d16]/95 border border-white/20 shadow-2xl backdrop-blur-2xl text-xs font-semibold text-white ring-1 ring-white/10 active:scale-95 transition-all"
            title="Kalemleri Genişlet"
          >
            <span
              className="w-2.5 h-2.5 rounded-full shadow-sm ring-1 ring-white/30"
              style={{ backgroundColor: toolSettings.color }}
            />
            <span className="capitalize">
              {activeTool === 'ballpoint'
                ? 'Tükenmez'
                : activeTool === 'fountain'
                ? 'Dolma'
                : activeTool === 'pencil'
                ? 'Kurşun'
                : activeTool === 'highlighter'
                ? 'Fosforlu'
                : activeTool === 'eraser'
                ? 'Silgi'
                : activeTool === 'lasso'
                ? 'Kement'
                : activeTool === 'shape'
                ? 'Şekil'
                : activeTool === 'text'
                ? 'Metin'
                : activeTool}
            </span>
            <ChevronUp size={14} className="text-slate-400" />
          </button>
        ) : (
          /* Expanded Ergonomic Glass Dock */
          <div className="bg-[#090d16]/95 backdrop-blur-2xl border border-white/15 shadow-2xl shadow-black/70 rounded-2xl p-1.5 flex items-center gap-1 ring-1 ring-white/10 overflow-x-auto scrollbar-none">
            {/* 1. Ballpoint */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setActiveTool('ballpoint');
              }}
              className={`p-2 rounded-xl transition-all shrink-0 ${
                activeTool === 'ballpoint'
                  ? 'bg-gradient-to-b from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-500/30 ring-1 ring-white/20'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Tükenmez Kalem"
            >
              <PenTool size={16} />
            </button>

            {/* 2. Fountain */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setActiveTool('fountain');
              }}
              className={`p-2 rounded-xl transition-all shrink-0 ${
                activeTool === 'fountain'
                  ? 'bg-gradient-to-b from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-500/30 ring-1 ring-white/20'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Dolma Kalem"
            >
              <Feather size={16} />
            </button>

            {/* 3. Pencil */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setActiveTool('pencil');
              }}
              className={`p-2 rounded-xl transition-all shrink-0 ${
                activeTool === 'pencil'
                  ? 'bg-gradient-to-b from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-500/30 ring-1 ring-white/20'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Kurşun Kalem"
            >
              <Pencil size={16} />
            </button>

            {/* 4. Highlighter */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setActiveTool('highlighter');
              }}
              className={`p-2 rounded-xl transition-all shrink-0 ${
                activeTool === 'highlighter'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md ring-1 ring-amber-300'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Fosforlu Kalem"
            >
              <Highlighter size={16} />
            </button>

            {/* 5. Eraser */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                if (activeTool === 'eraser') {
                  toggleDropdown('eraser');
                } else {
                  setActiveTool('eraser');
                }
              }}
              className={`p-2 rounded-xl transition-all shrink-0 ${
                activeTool === 'eraser'
                  ? 'bg-rose-600 text-white shadow-md ring-1 ring-rose-400'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Silgi"
            >
              <Eraser size={16} />
            </button>

            {/* 6. Lasso */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setActiveTool('lasso');
              }}
              className={`p-2 rounded-xl transition-all shrink-0 ${
                activeTool === 'lasso'
                  ? 'bg-indigo-600 text-white shadow-md ring-1 ring-indigo-400'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Kement Aracı"
            >
              <Scissors size={16} />
            </button>

            {/* 7. Shape */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                if (activeTool === 'shape') {
                  toggleDropdown('shape');
                } else {
                  setActiveTool('shape');
                }
              }}
              className={`p-2 rounded-xl transition-all shrink-0 ${
                activeTool === 'shape'
                  ? 'bg-indigo-600 text-white shadow-md ring-1 ring-indigo-400'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Şekiller"
            >
              <Shapes size={16} />
            </button>

            <div className="w-px h-5 bg-white/10 mx-0.5 shrink-0" />

            {/* Color Studio & Active Color trigger */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setColorStudioSlot(null);
                setColorStudioOpen(!colorStudioOpen);
              }}
              className="p-1 rounded-xl hover:bg-slate-800/80 flex items-center gap-1 shrink-0"
              title="Renk Stüdyosu & Paletler"
            >
              <span
                className="w-5 h-5 rounded-full border border-white/30 shadow-sm flex items-center justify-center shrink-0"
                style={{ backgroundColor: toolSettings.color }}
              />
              <Palette size={14} className="text-indigo-400 shrink-0" />
            </button>

            <div className="w-px h-5 bg-white/10 mx-0.5 shrink-0" />

            {/* Favorite Sizes */}
            <div className="flex items-center gap-1 shrink-0">
              {toolSettings.favoriteSizes.map((size, idx) => {
                const isSizeActive =
                  toolSettings.activeSizeIndex === idx && toolSettings.size === size;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      selectFavoriteSize(idx);
                    }}
                    className={`w-6 h-6 rounded-lg font-mono text-[10px] font-semibold flex items-center justify-center transition-all ${
                      isSizeActive
                        ? 'bg-indigo-600 text-white shadow ring-1 ring-indigo-400'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>

            {/* More Tools Trigger */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                toggleDropdown('moreTools');
              }}
              className={`p-1.5 rounded-xl transition-all shrink-0 ${
                openDropdown === 'moreTools' || isSecondaryToolActive
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Diğer Araçlar"
            >
              <MoreHorizontal size={15} />
            </button>

            {/* Quick Mic for Mobile Voice Dictation */}
            <button
              type="button"
              onClick={() => {
                if (isDictating) {
                  const text = speechTranscriptionService.stopListening();
                  setIsDictating(false);
                  if (text && text.trim()) {
                    addStickyNoteToCurrentPage({
                      id: `sn_dict_${Date.now()}`,
                      x: 250,
                      y: 280,
                      width: 240,
                      height: 180,
                      color: 'blue',
                      text: text.trim(),
                      createdAt: Date.now(),
                    });
                    triggerHaptic('medium');
                  }
                  setLiveTranscript('');
                } else {
                  if (!speechTranscriptionService.isSupported()) {
                    alert('Tarayıcınız sesli dikteyi desteklemiyor.');
                    return;
                  }
                  triggerHaptic('light');
                  setLiveTranscript('');
                  speechTranscriptionService.startListening((full, interim) => {
                    setLiveTranscript(full + (interim ? ' ' + interim : ''));
                  });
                  setIsDictating(true);
                }
              }}
              className={`p-1.5 rounded-xl transition-all shrink-0 ${
                isDictating
                  ? 'bg-rose-600 text-white animate-pulse shadow-md ring-1 ring-rose-400'
                  : 'text-slate-400 hover:text-rose-400 hover:bg-slate-800'
              }`}
              title="Sesli Dikte"
            >
              {isDictating ? <MicOff size={15} /> : <Mic size={15} />}
            </button>

            {/* Quick Camera Capture for Mobile */}
            <input
              type="file"
              ref={mobileCameraInputRef}
              accept="image/*"
              capture="environment"
              onChange={handleMobileCameraCapture}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                mobileCameraInputRef.current?.click();
              }}
              className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors shrink-0"
              title="Fotoğraf Çek / Ekle"
            >
              <Camera size={15} />
            </button>

            {/* Collapse button */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                toggleMobileToolDockCollapsed();
              }}
              className="p-1.5 rounded-xl text-slate-500 hover:text-white hover:bg-slate-800 transition-colors shrink-0 ml-0.5"
              title="Araç Çubuğunu Küçült"
            >
              <ChevronDown size={14} />
            </button>
          </div>
        )}
      </div>

      {/* 3. DEDICATED MOBILE FLOATING POPOVERS (Emerging from bottom dock) */}
      <div className="md:hidden">
        {openDropdown === 'eraser' && (
          <div className="fixed bottom-18 left-3 bg-slate-900 border border-slate-750 shadow-2xl rounded-2xl p-3 w-60 z-50 animate-in fade-in zoom-in-95 backdrop-blur-xl">
            <div className="text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">
              Silgi Ayarları
            </div>
            <div className="flex bg-slate-950 rounded-lg p-0.5 mb-2.5">
              <button
                type="button"
                onClick={() => {
                  setEraserMode('stroke');
                  closeDropdown();
                }}
                className={`flex-1 py-1 text-xs rounded-md transition-colors ${
                  toolSettings.eraserMode === 'stroke'
                    ? 'bg-rose-600 text-white font-medium'
                    : 'text-slate-400'
                }`}
              >
                Tüm Çizgi
              </button>
              <button
                type="button"
                onClick={() => {
                  setEraserMode('pixel');
                  closeDropdown();
                }}
                className={`flex-1 py-1 text-xs rounded-md transition-colors ${
                  toolSettings.eraserMode === 'pixel'
                    ? 'bg-rose-600 text-white font-medium'
                    : 'text-slate-400'
                }`}
              >
                Piksel
              </button>
            </div>
            <label className="flex items-center justify-between text-xs text-slate-200 py-1.5 cursor-pointer hover:text-white">
              <span>Yalnızca Fosforluyu Sil</span>
              <input
                type="checkbox"
                checked={toolSettings.eraseHighlighterOnly}
                onChange={toggleEraseHighlighterOnly}
                className="rounded accent-rose-500 cursor-pointer"
              />
            </label>
            <label className="flex items-center justify-between text-xs text-slate-200 py-1.5 cursor-pointer hover:text-white">
              <span>Otomatik Kaleme Dön</span>
              <input
                type="checkbox"
                checked={toolSettings.autoDeselectEraser}
                onChange={toggleAutoDeselectEraser}
                className="rounded accent-rose-500 cursor-pointer"
              />
            </label>
          </div>
        )}

        {openDropdown === 'shape' && (
          <div className="fixed bottom-18 left-3 bg-slate-900 border border-slate-750 shadow-2xl rounded-2xl p-3 flex flex-col gap-2.5 z-50 animate-in fade-in zoom-in-95 min-w-[280px] max-w-[92vw] backdrop-blur-xl">
            <div className="text-[11px] font-semibold text-slate-400 px-1 uppercase tracking-wider">
              Şekil Türü
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {SHAPE_BUTTONS.map((shp) => (
                <button
                  key={shp.type}
                  type="button"
                  onClick={() => {
                    setSelectedShape(shp.type);
                    closeDropdown();
                  }}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 text-[11px] rounded-lg transition-colors font-medium ${
                    toolSettings.selectedShape === shp.type
                      ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400'
                      : 'text-slate-300 hover:bg-slate-750 bg-slate-800/40 border border-slate-700/50'
                  }`}
                  title={shp.label}
                >
                  {shp.icon}
                  <span className="truncate">{shp.label}</span>
                </button>
              ))}
            </div>
            <div className="h-px bg-slate-750 my-0.5" />
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Şekil İç Dolgusu
              </span>
              <span className="text-[10px] text-indigo-400 font-mono font-semibold">
                {toolSettings.shapeFillColor ? `%${Math.round((toolSettings.shapeFillOpacity ?? 0.25) * 100)}` : 'Dolgusuz'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap px-0.5">
              <button
                type="button"
                onClick={() => setShapeFillColor(undefined)}
                className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all ${
                  !toolSettings.shapeFillColor
                    ? 'border-rose-500 bg-rose-500/20 text-rose-400 ring-1 ring-rose-400'
                    : 'border-slate-700 bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
                title="Dolgusuz"
              >
                <Ban size={12} />
              </button>
              {[
                { name: 'Sarı', color: '#fef08a' },
                { name: 'Gül', color: '#fecdd3' },
                { name: 'Nane', color: '#a7f3d0' },
                { name: 'Mavi', color: '#bae6fd' },
                { name: 'Lavanta', color: '#ddd6fe' },
                { name: 'Turuncu', color: '#fed7aa' },
                { name: 'Grafit', color: '#cbd5e1' },
              ].map(({ name, color }) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setShapeFillColor(color)}
                  className={`w-6 h-6 rounded-md border transition-all ${
                    toolSettings.shapeFillColor === color
                      ? 'ring-2 ring-white scale-110'
                      : 'border-transparent opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: color }}
                  title={name}
                />
              ))}
            </div>
          </div>
        )}

        {openDropdown === 'moreTools' && (
          <div className="fixed bottom-18 left-3 right-3 sm:right-auto sm:w-80 bg-slate-900 border border-slate-750 shadow-2xl rounded-2xl p-3 z-50 animate-in fade-in zoom-in-95 backdrop-blur-2xl space-y-2.5 max-h-[75vh] overflow-y-auto">
            <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between pb-1.5 border-b border-slate-800">
              <span>Geometri & İleri Araçlar</span>
              <Compass size={13} className="text-indigo-400" />
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setActiveTool('neon');
                  closeDropdown();
                }}
                className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[10px] font-medium transition-all ${
                  activeTool === 'neon'
                    ? 'bg-fuchsia-600/30 border-fuchsia-500 text-fuchsia-300'
                    : 'bg-slate-800/60 border-slate-750 text-slate-400 hover:text-white'
                }`}
                title="Neon Kalemi"
              >
                <Flame size={16} className="text-fuchsia-400" />
                <span>Neon</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTool('dashed');
                  closeDropdown();
                }}
                className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[10px] font-medium transition-all ${
                  activeTool === 'dashed'
                    ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                    : 'bg-slate-800/60 border-slate-750 text-slate-400 hover:text-white'
                }`}
                title="Kesikli Çizgi"
              >
                <Spline size={16} className="text-indigo-400" />
                <span>Kesikli</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTool('tape');
                  closeDropdown();
                }}
                className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[10px] font-medium transition-all ${
                  activeTool === 'tape'
                    ? 'bg-amber-600/30 border-amber-500 text-amber-300'
                    : 'bg-slate-800/60 border-slate-750 text-slate-400 hover:text-white'
                }`}
                title="Gizleme Bandı"
              >
                <Bandage size={16} className="text-amber-400" />
                <span>Bant</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTool('laser');
                  closeDropdown();
                }}
                className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[10px] font-medium transition-all ${
                  activeTool === 'laser'
                    ? 'bg-rose-600/30 border-rose-500 text-rose-300'
                    : 'bg-slate-800/60 border-slate-750 text-slate-400 hover:text-white'
                }`}
                title="Lazer İşaretçi"
              >
                <Zap size={16} className="text-rose-400" />
                <span>Lazer</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  toggleRuler();
                  closeDropdown();
                }}
                className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[10px] font-medium transition-all ${
                  rulerVisible
                    ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                    : 'bg-slate-800/60 border-slate-750 text-slate-400 hover:text-white'
                }`}
                title="Milimetrik Cetvel"
              >
                <Compass size={16} className="text-indigo-400" />
                <span>Cetvel</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  toggleProtractor();
                  closeDropdown();
                }}
                className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[10px] font-medium transition-all ${
                  protractorVisible
                    ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                    : 'bg-slate-800/60 border-slate-750 text-slate-400 hover:text-white'
                }`}
                title="360° İletki / Açıölçer"
              >
                <Disc size={16} className="text-cyan-400" />
                <span>Açıölçer</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  toggleCompass();
                  closeDropdown();
                }}
                className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[10px] font-medium transition-all ${
                  compassVisible
                    ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                    : 'bg-slate-800/60 border-slate-750 text-slate-400 hover:text-white'
                }`}
                title="Hassas Pergel"
              >
                <CircleDot size={16} className="text-emerald-400" />
                <span>Pergel</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  toggleSymmetry();
                  closeDropdown();
                }}
                className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[10px] font-medium transition-all ${
                  symmetryEnabled
                    ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                    : 'bg-slate-800/60 border-slate-750 text-slate-400 hover:text-white'
                }`}
                title="Ayna / Simetri Çizimi"
              >
                <FlipHorizontal size={16} className="text-indigo-400" />
                <span>Simetri</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  addStickyNoteToCurrentPage({
                    id: `sn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                    x: 180,
                    y: 200,
                    width: 210,
                    height: 180,
                    color: 'yellow',
                    text: '',
                    createdAt: Date.now(),
                  });
                  closeDropdown();
                }}
                className="p-2 rounded-xl border bg-slate-800/60 border-slate-750 text-slate-400 hover:text-amber-300 flex flex-col items-center gap-1 text-[10px] font-medium transition-all"
                title="Yapışkan Post-It Notu"
              >
                <StickyNote size={16} className="text-amber-400" />
                <span>Not Ekle</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('medium');
                  addTableToCurrentPage(3, 3, 140, 180);
                  closeDropdown();
                }}
                className="p-2 rounded-xl border bg-slate-800/60 border-slate-750 text-slate-400 hover:text-indigo-300 flex flex-col items-center gap-1 text-[10px] font-medium transition-all"
                title="İnteraktif Çizelge & Tablo Ekle (3x3)"
              >
                <Table2 size={16} className="text-indigo-400" />
                <span>Tablo</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('medium');
                  setActiveTool('connector');
                  closeDropdown();
                }}
                className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[10px] font-medium transition-all ${
                  activeTool === 'connector'
                    ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                    : 'bg-slate-800/60 border-slate-750 text-slate-400 hover:text-blue-300'
                }`}
                title="Manyetik Bağlantı Oku & Akış Şeması"
              >
                <Workflow size={16} className="text-blue-400" />
                <span>Bağlayıcı</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setStampCreatorModalOpen(true);
                  closeDropdown();
                }}
                className="p-2 rounded-xl border bg-slate-800/60 border-slate-750 text-slate-400 hover:text-rose-300 flex flex-col items-center gap-1 text-[10px] font-medium transition-all"
                title="Dinamik Kaşe & Damga Stüdyosu"
              >
                <Stamp size={16} className="text-rose-400" />
                <span>Kaşe</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTool('eyedropper');
                  closeDropdown();
                }}
                className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[10px] font-medium transition-all ${
                  activeTool === 'eyedropper'
                    ? 'bg-pink-600/30 border-pink-500 text-pink-300'
                    : 'bg-slate-800/60 border-slate-750 text-slate-400 hover:text-white'
                }`}
                title="Renk Damlalığı (Eyedropper)"
              >
                <Pipette size={16} className="text-pink-400" />
                <span>Damlalık</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTool('fill');
                  closeDropdown();
                }}
                className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[10px] font-medium transition-all ${
                  activeTool === 'fill'
                    ? 'bg-cyan-600/30 border-cyan-500 text-cyan-300'
                    : 'bg-slate-800/60 border-slate-750 text-slate-400 hover:text-white'
                }`}
                title="Boya Kovası (Doldurma)"
              >
                <PaintBucket size={16} className="text-cyan-400" />
                <span>Doldur</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  toggleZoomWindow();
                  closeDropdown();
                }}
                className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[10px] font-medium transition-all ${
                  zoomWindowOpen
                    ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                    : 'bg-slate-800/60 border-slate-750 text-slate-400 hover:text-white'
                }`}
                title="Büyüteç Hassas Çizim Penceresi"
              >
                <ZoomIn size={16} className="text-indigo-400" />
                <span>Büyüteç</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  toggleScratchpad();
                  closeDropdown();
                }}
                className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[10px] font-medium transition-all ${
                  scratchpadOpen
                    ? 'bg-amber-600/30 border-amber-500 text-amber-300'
                    : 'bg-slate-800/60 border-slate-750 text-slate-400 hover:text-white'
                }`}
                title="Yüzen Karalama Defteri"
              >
                <SquarePen size={16} className="text-amber-400" />
                <span>Karalama</span>
              </button>
            </div>
          </div>
        )}

        {activeColorSlot !== null && (
          <div className="fixed bottom-18 right-3 bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-2xl z-50 w-44 backdrop-blur-xl animate-in fade-in zoom-in-95">
            <div className="text-[10px] font-semibold text-slate-400 mb-1.5">
              Rengi Değiştir
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setFavoriteColor(activeColorSlot, c);
                    setActiveColorSlot(null);
                  }}
                  className="w-6 h-6 rounded-full ring-1 ring-white/20 hover:scale-110 transition-transform"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. Global Color Studio Popover (Desktop & Mobile) */}
      <ColorStudioPopover
        isOpen={colorStudioOpen}
        onClose={() => setColorStudioOpen(false)}
        activeSlotIndex={colorStudioSlot}
      />

      {/* 5. TABLET / IPAD FLOATING VERTICAL DOCK (When docked to Left or Right) */}
      {tabletToolbarPlacement !== 'top' && (
        <aside
          className={`hidden md:flex fixed top-1/2 -translate-y-1/2 z-40 bg-[#090d16]/95 backdrop-blur-2xl border border-white/15 shadow-2xl shadow-black/80 rounded-3xl p-1.5 flex-col items-center gap-1.5 ring-1 ring-white/10 max-h-[88vh] overflow-y-auto scrollbar-none animate-in fade-in zoom-in-95 duration-150 ${
            tabletToolbarPlacement === 'left' ? 'left-3' : 'right-3'
          }`}
        >
          {/* Dock Placement Switcher */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setTabletToolbarPlacement(tabletToolbarPlacement === 'left' ? 'right' : 'top');
            }}
            className="p-2 rounded-2xl bg-slate-800/80 hover:bg-indigo-600 text-slate-300 hover:text-white transition-all shadow-sm"
            title={`Konumu Değiştir (${tabletToolbarPlacement === 'left' ? 'Sağ Kenar (Solak Modu)' : 'Üst Çubuk'})`}
          >
            {tabletToolbarPlacement === 'left' ? <PanelRight size={15} /> : <PanelLeft size={15} />}
          </button>

          <div className="w-6 h-px bg-white/10 my-0.5" />

          {/* Primary Pens */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setActiveTool('fountain');
            }}
            className={`p-2.5 rounded-2xl transition-all ${
              activeTool === 'fountain'
                ? 'bg-gradient-to-b from-indigo-500 to-indigo-600 text-white shadow-lg ring-1 ring-white/20 scale-105'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Dolma Kalem"
          >
            <Feather size={16} />
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setActiveTool('ballpoint');
            }}
            className={`p-2.5 rounded-2xl transition-all ${
              activeTool === 'ballpoint'
                ? 'bg-gradient-to-b from-indigo-500 to-indigo-600 text-white shadow-lg ring-1 ring-white/20 scale-105'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Tükenmez Kalem"
          >
            <PenTool size={16} />
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setActiveTool('pencil');
            }}
            className={`p-2.5 rounded-2xl transition-all ${
              activeTool === 'pencil'
                ? 'bg-gradient-to-b from-indigo-500 to-indigo-600 text-white shadow-lg ring-1 ring-white/20 scale-105'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Kurşun Kalem"
          >
            <Pencil size={16} />
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setActiveTool('highlighter');
            }}
            className={`p-2.5 rounded-2xl transition-all ${
              activeTool === 'highlighter'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-lg ring-1 ring-amber-300 scale-105'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Fosforlu Kalem"
          >
            <Highlighter size={16} />
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              if (activeTool === 'eraser') {
                toggleDropdown('eraser');
              } else {
                setActiveTool('eraser');
              }
            }}
            className={`p-2.5 rounded-2xl transition-all ${
              activeTool === 'eraser'
                ? 'bg-rose-600 text-white shadow-lg ring-1 ring-rose-400 scale-105'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Silgi"
          >
            <Eraser size={16} />
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setActiveTool('lasso');
            }}
            className={`p-2.5 rounded-2xl transition-all ${
              activeTool === 'lasso'
                ? 'bg-indigo-600 text-white shadow-lg ring-1 ring-indigo-400 scale-105'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Kement Aracı"
          >
            <Scissors size={16} />
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              if (activeTool === 'shape') {
                toggleDropdown('shape');
              } else {
                setActiveTool('shape');
              }
            }}
            className={`p-2.5 rounded-2xl transition-all ${
              activeTool === 'shape'
                ? 'bg-indigo-600 text-white shadow-lg ring-1 ring-indigo-400 scale-105'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Şekiller"
          >
            <Shapes size={16} />
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setActiveTool('text');
            }}
            className={`p-2.5 rounded-2xl transition-all ${
              activeTool === 'text'
                ? 'bg-indigo-600 text-white shadow-lg ring-1 ring-indigo-400 scale-105'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Metin Kutusu"
          >
            <Type size={16} />
          </button>

          <div className="w-6 h-px bg-white/10 my-0.5" />

          {/* Color & Studio Trigger */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setColorStudioSlot(null);
              setColorStudioOpen(!colorStudioOpen);
            }}
            className="p-2 rounded-2xl hover:bg-slate-800/80 flex flex-col items-center gap-1 transition-all"
            title="Renk Stüdyosu & Paletler"
          >
            <span
              className="w-5 h-5 rounded-full border border-white/30 shadow-md ring-1 ring-black/40"
              style={{ backgroundColor: toolSettings.color }}
            />
            <Palette size={12} className="text-indigo-400" />
          </button>

          {/* Quick Sizes */}
          <div className="flex flex-col items-center gap-1">
            {toolSettings.favoriteSizes.map((sz, idx) => {
              const isSzActive = toolSettings.activeSizeIndex === idx && toolSettings.size === sz;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    selectFavoriteSize(idx);
                  }}
                  className={`w-6 h-6 rounded-lg font-mono text-[10px] font-semibold flex items-center justify-center transition-all ${
                    isSzActive
                      ? 'bg-indigo-600 text-white shadow ring-1 ring-indigo-400'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {sz}
                </button>
              );
            })}
          </div>

          <div className="w-6 h-px bg-white/10 my-0.5" />

          {/* More Tools Trigger */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              toggleDropdown('moreTools');
            }}
            className={`p-2 rounded-2xl transition-all ${
              openDropdown === 'moreTools' || isSecondaryToolActive
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Diğer Çizim ve Geometri Araçları"
          >
            <MoreHorizontal size={16} />
          </button>
        </aside>
      )}

      {/* 6. Live Speech Dictation HUD Overlay */}
      {isDictating && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 bg-[#090d16]/95 border border-rose-500/50 shadow-2xl rounded-2xl px-4 py-2.5 backdrop-blur-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-3 max-w-[90vw]">
          <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
          <div className="flex flex-col max-w-[280px] sm:max-w-[400px]">
            <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">
              Canlı Dikte Ediliyor...
            </span>
            <p className="text-xs text-white truncate font-medium">
              {liveTranscript || 'Konuşun, sesiniz yazıya dökülüyor...'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              const text = speechTranscriptionService.stopListening();
              setIsDictating(false);
              if (text && text.trim()) {
                addStickyNoteToCurrentPage({
                  id: `sn_dict_${Date.now()}`,
                  x: 250,
                  y: 280,
                  width: 240,
                  height: 180,
                  color: 'blue',
                  text: text.trim(),
                  createdAt: Date.now(),
                });
                triggerHaptic('medium');
              }
              setLiveTranscript('');
            }}
            className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md whitespace-nowrap"
          >
            Nota Dönüştür
          </button>
        </div>
      )}
    </div>
  );
};
