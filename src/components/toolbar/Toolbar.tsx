import React, { useState } from 'react';
import { useNotebookStore } from '../../store/notebookStore';
import { exportNotebookToPdf } from '../../services/pdfService';
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
  Plus,
  ChevronLeft,
  ChevronRight,
  FileDown,
  UploadCloud,
  Youtube,
  Trash2,
  Palette,
  Layers,
  LayoutTemplate,
  Users,
  Menu,
  Sparkles,
  Zap,
  MousePointer,
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
  Volume2,
  Calculator,
  Split,
  Search,
  StickyNote,
  Disc,
  CircleDot,
  FlipHorizontal,
  Ban,
} from 'lucide-react';
import { PenType, ShapeType, ToolType, StylusDoubleTapAction } from '../../types/notebook';
import { AudioPlayerBar } from '../audio/AudioPlayerBar';
import { PomodoroBarWidget } from '../pomodoro/PomodoroBarWidget';

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
];

export const Toolbar: React.FC = () => {
  const {
    activeTool,
    setActiveTool,
    toolSettings,
    setToolColor,
    setToolSize,
    setEraserMode,
    toggleEraseHighlighterOnly,
    toggleAutoDeselectEraser,
    selectFavoriteColor,
    selectFavoriteSize,
    setFavoriteColor,
    setFavoriteSize,
    setSelectedShape,
    setShapeFillColor,
    setShapeFillOpacity,
    activeNotebookId,
    notebooks,
    activePageIndex,
    setActivePageIndex,
    addPage,
    undo,
    redo,
    undoStack,
    redoStack,
    clearCurrentPageStrokes,
    youtube,
    toggleYouTube,
    setTemplateModalOpen,
    setDocImportModalOpen,
    setStickersDrawerOpen,
    sidebarOpen,
    setSidebarOpen,
    setLibraryViewOpen,
    setPageManagerModalOpen,
    rulerVisible,
    toggleRuler,
    viewMode,
    zoomWindowOpen,
    toggleZoomWindow,
    setStudySetsModalOpen,
    presentationMode,
    setPresentationMode,
    setLaserStyle,
    togglePageBookmark,
    invertCurrentPageInks,
    setStreamline,
    setFillTolerance,
    searchModalOpen,
    setSearchModalOpen,
    mathModalOpen,
    openMathModal,
    splitNotebook,
    openDualNotebook,
    closeDualNotebook,
    layersDrawerOpen,
    setLayersDrawerOpen,
    toggleAngleSnap,
    toggleGridSnap,
    togglePalmRejection,
    toggleTiltShading,
    setStylusDoubleTapAction,
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
  } = useNotebookStore();

  const [activeColorSlot, setActiveColorSlot] = useState<number | null>(null);
  const [activeSizeSlot, setActiveSizeSlot] = useState<number | null>(null);
  const [eraserMenuOpen, setEraserMenuOpen] = useState(false);
  const [shapeMenuOpen, setShapeMenuOpen] = useState(false);
  const [artistMenuOpen, setArtistMenuOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const activeNotebook = notebooks.find((n) => n.id === activeNotebookId);
  const totalPages = activeNotebook ? activeNotebook.pages.length : 1;

  const handleExportPdf = async () => {
    if (!activeNotebook || activeNotebook.pages.length === 0) return;
    try {
      setIsExporting(true);
      const blob = await exportNotebookToPdf(activeNotebook.pages, activeNotebook.title);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeNotebook.title.replace(/[^a-zA-Z0-9çğıöşüÇĞİÖŞÜ_-]/g, '_')}_notlar.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF export error:', err);
      alert('PDF dışa aktarılırken bir hata oluştu.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-3 z-30 select-none shadow-lg">
      {/* 1. Left Section: Sidebar & Notebook Title */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`p-2 rounded-xl transition-colors ${
            sidebarOpen
              ? 'bg-indigo-600/30 text-indigo-400 border border-indigo-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="Defterler ve Sayfalar Menüsü"
        >
          <Menu size={18} />
        </button>

        {/* GoodNotes Library View Button */}
        <button
          onClick={() => setLibraryViewOpen(true)}
          className="p-2 rounded-xl text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors flex items-center gap-1.5"
          title="Tüm Defterleri Gör (Kütüphane)"
        >
          <Library size={18} />
          <span className="text-xs font-semibold hidden md:inline">Kütüphane</span>
        </button>

        {/* Global Search Button */}
        <button
          onClick={() => setSearchModalOpen(true)}
          className="p-2 rounded-xl text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors flex items-center gap-1.5"
          title="Küresel Arama & İndeks (Cmd+K / Ctrl+K)"
        >
          <Search size={18} />
          <span className="text-xs font-semibold hidden xl:inline">Ara</span>
        </button>

        <div className="hidden lg:flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full shrink-0 shadow-sm"
            style={{ backgroundColor: activeNotebook?.coverColor || '#3b82f6' }}
          />
          <span className="font-semibold text-xs text-slate-200 max-w-[150px] truncate">
            {activeNotebook?.title || 'Defter Seçilmedi'}
          </span>
        </div>

        {/* Page Stepper & Star Bookmark */}
        <div className="hidden sm:flex items-center gap-1.5 pl-1 border-l border-slate-800">
          <button
            onClick={() => togglePageBookmark(activePageIndex)}
            className={`p-1.5 rounded-lg transition-all ${
              activeNotebook?.pages[activePageIndex]?.isBookmarked
                ? 'text-amber-400 fill-amber-400 bg-amber-400/10'
                : 'text-slate-500 hover:text-amber-300 hover:bg-slate-800'
            }`}
            title={
              activeNotebook?.pages[activePageIndex]?.isBookmarked
                ? 'Sayfayı Yer İmlerinden Çıkar'
                : 'Bu Sayfayı Yer İmlerine Ekle'
            }
          >
            <Star
              size={15}
              className={
                activeNotebook?.pages[activePageIndex]?.isBookmarked
                  ? 'fill-amber-400'
                  : ''
              }
            />
          </button>

          <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-750">
            <button
              onClick={() => setActivePageIndex(Math.max(0, activePageIndex - 1))}
              disabled={activePageIndex === 0}
              className={`p-1 rounded transition-colors ${
                activePageIndex > 0
                  ? 'text-slate-300 hover:text-white hover:bg-slate-700'
                  : 'text-slate-600 cursor-not-allowed'
              }`}
              title="Önceki Sayfa"
            >
              <ChevronLeft size={13} />
            </button>
            <span className="text-[11px] font-mono font-semibold px-1.5 text-slate-300">
              {activePageIndex + 1}/{totalPages}
            </span>
            <button
              onClick={() => setActivePageIndex(Math.min(totalPages - 1, activePageIndex + 1))}
              disabled={activePageIndex >= totalPages - 1}
              className={`p-1 rounded transition-colors ${
                activePageIndex < totalPages - 1
                  ? 'text-slate-300 hover:text-white hover:bg-slate-700'
                  : 'text-slate-600 cursor-not-allowed'
              }`}
              title="Sonraki Sayfa"
            >
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Middle Section: GoodNotes Professional Tool Dock */}
      <div className="flex items-center bg-slate-800/90 p-1 rounded-2xl border border-slate-750 shadow-inner gap-0.5">
        {/* Fountain Pen */}
        <button
          onClick={() => setActiveTool('fountain')}
          className={`p-2 rounded-xl transition-all flex items-center justify-center ${
            activeTool === 'fountain'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-105'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          }`}
          title="Dolma Kalem (Basınca ve hıza duyarlı doğal hatlar)"
        >
          <Feather size={16} />
        </button>

        {/* Ballpoint Pen */}
        <button
          onClick={() => setActiveTool('ballpoint')}
          className={`p-2 rounded-xl transition-all flex items-center justify-center ${
            activeTool === 'ballpoint'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-105'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          }`}
          title="Tükenmez Kalem (Pürüzsüz sabit kalınlık)"
        >
          <PenTool size={16} />
        </button>

        {/* Pencil / Graphite */}
        <button
          onClick={() => setActiveTool('pencil')}
          className={`p-2 rounded-xl transition-all flex items-center justify-center ${
            activeTool === 'pencil'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-105'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          }`}
          title="Kurşun Kalem & Karakalem (Doğal grafit dokusu)"
        >
          <Pencil size={16} />
        </button>

        {/* Fineliner / Technical Pen */}
        <button
          onClick={() => setActiveTool('fineliner')}
          className={`p-2 rounded-xl transition-all flex items-center justify-center ${
            activeTool === 'fineliner'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-105'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          }`}
          title="Teknik Çizim Kalemi / Fineliner (Titreşimsiz mikron hassasiyet)"
        >
          <PenLine size={16} />
        </button>

        {/* Brush Pen */}
        <button
          onClick={() => setActiveTool('brush')}
          className={`p-2 rounded-xl transition-all flex items-center justify-center ${
            activeTool === 'brush'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-105'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          }`}
          title="Fırça / Kaligrafi Kalemi"
        >
          <Paintbrush size={16} />
        </button>

        {/* Highlighter */}
        <button
          onClick={() => setActiveTool('highlighter')}
          className={`p-2 rounded-xl transition-all flex items-center justify-center ${
            activeTool === 'highlighter'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 scale-105'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          }`}
          title="Fosforlu Kalem (Multiply blend mode)"
        >
          <Highlighter size={16} />
        </button>

        {/* Neon Glow Pen */}
        <button
          onClick={() => setActiveTool('neon')}
          className={`p-2 rounded-xl transition-all flex items-center justify-center ${
            activeTool === 'neon'
              ? 'bg-fuchsia-600 text-white shadow-md shadow-fuchsia-600/40 scale-105 ring-1 ring-fuchsia-400'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          }`}
          title="Neon Parıltı Kalemi (Koyu kağıtlarda parıldayan neon aurası)"
        >
          <Flame size={16} />
        </button>

        {/* Dashed / Spline Pen */}
        <button
          onClick={() => setActiveTool('dashed')}
          className={`p-2 rounded-xl transition-all flex items-center justify-center ${
            activeTool === 'dashed'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-105'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          }`}
          title="Kesikli Çizgi Kalemi (Geometri ve grafik diyagramları)"
        >
          <Spline size={16} />
        </button>

        {/* GoodNotes 6 Tape Tool */}
        <button
          onClick={() => setActiveTool('tape')}
          className={`p-2 rounded-xl transition-all flex items-center justify-center ${
            activeTool === 'tape'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 scale-105 ring-1 ring-amber-400'
              : 'text-amber-400 hover:text-amber-200 hover:bg-slate-700/50'
          }`}
          title="Gizleme Bandı (Tape Tool - Tıklayınca açılıp kapanan çalışma bandı)"
        >
          <Bandage size={16} />
        </button>

        {/* Eraser with Dropdown Settings */}
        <div className="relative">
          <button
            onClick={() => {
              if (activeTool === 'eraser') {
                setEraserMenuOpen(!eraserMenuOpen);
              } else {
                setActiveTool('eraser');
              }
            }}
            className={`p-2 rounded-xl transition-all flex items-center justify-center ${
              activeTool === 'eraser'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 scale-105'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
            }`}
            title="Silgi (Tekrar tıklayarak ayarları açın)"
          >
            <Eraser size={16} />
          </button>

          {eraserMenuOpen && (
            <div className="absolute top-12 left-0 bg-slate-800 border border-slate-700 shadow-2xl rounded-2xl p-3 w-56 z-50 animate-in fade-in zoom-in-95">
              <div className="text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                Silgi Ayarları
              </div>

              {/* Mode Toggle */}
              <div className="flex bg-slate-900 rounded-lg p-0.5 mb-2.5">
                <button
                  onClick={() => setEraserMode('stroke')}
                  className={`flex-1 py-1 text-xs rounded-md transition-colors ${
                    toolSettings.eraserMode === 'stroke'
                      ? 'bg-rose-600 text-white font-medium'
                      : 'text-slate-400'
                  }`}
                >
                  Tüm Çizgi
                </button>
                <button
                  onClick={() => setEraserMode('pixel')}
                  className={`flex-1 py-1 text-xs rounded-md transition-colors ${
                    toolSettings.eraserMode === 'pixel'
                      ? 'bg-rose-600 text-white font-medium'
                      : 'text-slate-400'
                  }`}
                >
                  Piksel
                </button>
              </div>

              {/* Erase Highlighter Only Toggle */}
              <label className="flex items-center justify-between text-xs text-slate-200 py-1.5 cursor-pointer hover:text-white">
                <span>Yalnızca Fosforluyu Sil</span>
                <input
                  type="checkbox"
                  checked={toolSettings.eraseHighlighterOnly}
                  onChange={toggleEraseHighlighterOnly}
                  className="rounded accent-rose-500 cursor-pointer"
                />
              </label>

              {/* Auto Deselect Toggle */}
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

        {/* Lasso Tool */}
        <button
          onClick={() => setActiveTool('lasso')}
          className={`p-2 rounded-xl transition-all flex items-center justify-center ${
            activeTool === 'lasso'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-105'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          }`}
          title="Kement Aracı (Lasso - Çizimleri seç, taşı, döndür, rengini değiştir)"
        >
          <Scissors size={16} />
        </button>

        {/* Shapes Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setActiveTool('shape');
              setShapeMenuOpen(!shapeMenuOpen);
            }}
            className={`p-2 rounded-xl transition-all flex items-center justify-center ${
              activeTool === 'shape'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
            }`}
            title="Geometrik Şekiller"
          >
            <Shapes size={16} />
          </button>

          {shapeMenuOpen && (
            <div className="absolute top-12 left-0 bg-slate-800 border border-slate-750 shadow-2xl rounded-2xl p-2 flex flex-col gap-2 z-50 animate-in fade-in zoom-in-95 min-w-[280px]">
              <div className="text-[11px] font-semibold text-slate-400 px-1 uppercase tracking-wider">Şekil Türü</div>
              <div className="flex gap-1">
                {(['line', 'arrow', 'rectangle', 'circle', 'triangle'] as ShapeType[]).map(
                  (shp) => (
                    <button
                      key={shp}
                      onClick={() => {
                        setSelectedShape(shp);
                        setShapeMenuOpen(false);
                      }}
                      className={`flex-1 py-1.5 text-xs rounded-lg capitalize transition-colors font-medium text-center ${
                        toolSettings.selectedShape === shp
                          ? 'bg-indigo-600 text-white shadow'
                          : 'text-slate-300 hover:bg-slate-750'
                      }`}
                    >
                      {shp === 'line'
                        ? 'Çizgi'
                        : shp === 'arrow'
                        ? 'Ok'
                        : shp === 'rectangle'
                        ? 'Kare'
                        : shp === 'circle'
                        ? 'Daire'
                        : 'Üçgen'}
                    </button>
                  )
                )}
              </div>

              {/* FAZ L: Shape Fill Color & Opacity Controls */}
              <div className="h-px bg-slate-700/60 my-0.5" />

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

              {/* Color Swatches */}
              <div className="flex items-center gap-1.5 flex-wrap px-0.5">
                {/* No fill / transparent button */}
                <button
                  type="button"
                  onClick={() => setShapeFillColor(undefined)}
                  className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all ${
                    !toolSettings.shapeFillColor
                      ? 'border-rose-500 bg-rose-500/20 text-rose-400 ring-1 ring-rose-400'
                      : 'border-slate-700 bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                  title="Dolgusuz (Şeffaf İç)"
                >
                  <Ban size={12} />
                </button>

                {/* Preset pastel fill colors */}
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
                    className={`w-6 h-6 rounded-md border transition-all relative flex items-center justify-center ${
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

              {/* Opacity presets (visible when fill is active) */}
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

              <div className="h-px bg-slate-700/60 my-0.5" />

              <div className="text-[11px] font-semibold text-slate-400 px-1 uppercase tracking-wider">Hassas Manyetik Hizalama</div>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={toggleAngleSnap}
                  className={`flex-1 px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between border transition-all ${
                    toolSettings.angleSnap
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                      : 'bg-slate-750/50 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                  title="15° manyetik açı kilitleri (0°, 15°, 30°, 45°, 90°)"
                >
                  <span>15° Açı Kilidi</span>
                  {toolSettings.angleSnap && <Check size={13} className="text-indigo-400" />}
                </button>

                <button
                  type="button"
                  onClick={toggleGridSnap}
                  className={`flex-1 px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between border transition-all ${
                    toolSettings.gridSnap
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                      : 'bg-slate-750/50 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                  title="Defter ızgara ve çizgilerine manyetik kenetlenme"
                >
                  <span>Izgara Snap</span>
                  {toolSettings.gridSnap && <Check size={13} className="text-indigo-400" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Laser Pointer */}
        <button
          onClick={() => setActiveTool('laser')}
          className={`p-2 rounded-xl transition-all flex items-center justify-center ${
            activeTool === 'laser'
              ? 'bg-red-500 text-white shadow-md shadow-red-500/40 scale-105 animate-pulse'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          }`}
          title="Lazer İşaretçi (Sunum ve ders anlatımı için geçici iz)"
        >
          <Zap size={16} />
        </button>

        {/* Text Tool */}
        <button
          onClick={() => setActiveTool('text')}
          className={`p-2 rounded-xl transition-all flex items-center justify-center ${
            activeTool === 'text'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-105'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          }`}
          title="Metin Kutusu ('T' - Klavye ile zengin yazı yaz)"
        >
          <Type size={16} />
        </button>

        {/* Interactive Millimeter Ruler */}
        <button
          onClick={toggleRuler}
          className={`p-2 rounded-xl transition-all flex items-center justify-center ${
            rulerVisible
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-105 ring-1 ring-indigo-400'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          }`}
          title="İnteraktif Cetvel (GoodNotes Stili Dönen Milimetrik Cetvel)"
        >
          <Compass size={16} />
        </button>

        {/* 🌟 Faz B: 360° İletki / Açıölçer (Protractor) */}
        <button
          onClick={toggleProtractor}
          className={`p-2 rounded-xl transition-all flex items-center justify-center ${
            protractorVisible
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-105 ring-1 ring-indigo-400'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          }`}
          title="360° İletki / Açıölçer (Dönen Akrilik Açıölçer)"
        >
          <Disc size={16} />
        </button>

        {/* 🧭 Faz D: Hassas Pergel / Çember & Yay Aracı (Compass) */}
        <button
          onClick={toggleCompass}
          className={`p-2 rounded-xl transition-all flex items-center justify-center ${
            compassVisible
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-105 ring-1 ring-indigo-400'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          }`}
          title="Hassas Pergel / Çember & Yay Aracı (Compass Caliper)"
        >
          <CircleDot size={16} />
        </button>

        {/* 🪞 Faz D: Gerçek Zamanlı Simetri & Ayna Çizim (Symmetry Mode) */}
        <button
          onClick={toggleSymmetry}
          className={`p-2 rounded-xl transition-all flex items-center justify-center ${
            symmetryEnabled
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-105 ring-1 ring-indigo-400'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          }`}
          title="Gerçek Zamanlı Ayna / Simetri Çizim Modu"
        >
          <FlipHorizontal size={16} />
        </button>

        {/* 📌 Faz B: Yapışkan Notlar (3D Post-it Sticky Notes) */}
        <button
          onClick={() => {
            if (activeTool === 'sticky-note') {
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
            } else {
              setActiveTool('sticky-note');
            }
          }}
          className={`p-2 rounded-xl transition-all flex items-center justify-center ${
            activeTool === 'sticky-note'
              ? 'bg-amber-400 text-amber-950 shadow-md shadow-amber-400/40 scale-105 ring-1 ring-amber-300 font-bold'
              : 'text-slate-400 hover:text-amber-300 hover:bg-slate-700/50'
          }`}
          title="Yapışkan Not (Post-It - Sayfaya tıklayarak veya basarak 3D renkli yapışkan not ekle)"
        >
          <StickyNote size={16} />
        </button>

        {/* GoodNotes Handwriting Zoom Window Box */}
        <button
          onClick={toggleZoomWindow}
          className={`p-2 rounded-xl transition-all flex items-center justify-center ${
            zoomWindowOpen
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-105 ring-1 ring-indigo-400'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          }`}
          title="Büyüteç Yazım Penceresi (GoodNotes Zoom Window)"
        >
          <ZoomIn size={16} />
        </button>

        {/* 🎨 Faz 1: Renk Damlalığı (Eyedropper) */}
        <button
          onClick={() => setActiveTool('eyedropper')}
          className={`p-2 rounded-xl transition-all flex items-center justify-center ${
            activeTool === 'eyedropper'
              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/40 scale-105 ring-1 ring-cyan-300'
              : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-700/50'
          }`}
          title="Renk Damlalığı (Tuvaldeki veya görseldeki herhangi bir piksel rengini seç)"
        >
          <Pipette size={16} />
        </button>

        {/* 🪣 Faz 1: Akıllı Alan Doldurma / Boya Kovası (Flood Fill Bucket) */}
        <button
          onClick={() => setActiveTool('fill')}
          className={`p-2 rounded-xl transition-all flex items-center justify-center ${
            activeTool === 'fill'
              ? 'bg-violet-600 text-white shadow-md shadow-violet-600/40 scale-105 ring-1 ring-violet-300'
              : 'text-slate-400 hover:text-violet-300 hover:bg-slate-700/50'
          }`}
          title="Akıllı Alan Doldurma (Kapalı çizim ve şekillerin içini tek tıkla boya)"
        >
          <PaintBucket size={16} />
        </button>

        {/* 🎚️ Faz 1: Çizgi Sabitleyici & Hassasiyet Ayarları (Streamline Stabilizer) */}
        <div className="relative">
          <button
            onClick={() => setArtistMenuOpen(!artistMenuOpen)}
            className={`p-2 rounded-xl transition-all flex items-center justify-center ${
              artistMenuOpen
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-300'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
            }`}
            title="Çizgi Sabitleyici & Hassasiyet Ayarları (Streamline Stabilizer)"
          >
            <SlidersHorizontal size={16} />
          </button>

          {artistMenuOpen && (
            <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl p-3.5 w-64 z-50 animate-in fade-in zoom-in-95 backdrop-blur-md">
              <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                <span>Sanatçı & Çizim Motoru</span>
                <Sparkles size={12} className="text-indigo-400" />
              </div>

              {/* Streamline Stabilizer Slider */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">Çizgi Sabitleyici</span>
                  <span className="font-mono text-indigo-400 font-bold">
                    %{Math.round((toolSettings.streamline ?? 0.55) * 100)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.95"
                  step="0.05"
                  value={toolSettings.streamline ?? 0.55}
                  onChange={(e) => setStreamline(parseFloat(e.target.value))}
                  className="w-full h-1.5 accent-indigo-500 rounded-lg cursor-pointer bg-slate-800"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  {(toolSettings.streamline ?? 0.55) === 0
                    ? 'Kapalı (Ham Çizim)'
                    : (toolSettings.streamline ?? 0.55) < 0.4
                    ? 'Hafif Yumuşatma'
                    : (toolSettings.streamline ?? 0.55) < 0.75
                    ? 'Dengeli Hatlar'
                    : 'Maksimum Titreme Engelleyici (Kaligrafi)'}
                </p>
              </div>

              {/* Flood Fill Tolerance */}
              <div className="pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">Boya Kovası Toleransı</span>
                  <span className="font-mono text-violet-400 font-bold">
                    {toolSettings.fillTolerance ?? 35}
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="80"
                  step="2"
                  value={toolSettings.fillTolerance ?? 35}
                  onChange={(e) => setFillTolerance(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 accent-violet-500 rounded-lg cursor-pointer bg-slate-800"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Çizgileri aşmadan en temiz dolgu derinliği
                </p>
              </div>

              {/* Faz A: Palm Rejection & Tilt Shading Toggles */}
              <div className="pt-2.5 mt-2.5 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">Avuç İçi Reddi (Palm)</span>
                  <button
                    type="button"
                    onClick={togglePalmRejection}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-all ${
                      toolSettings.palmRejection
                        ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {toolSettings.palmRejection ? 'Aktif' : 'Kapalı'}
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">Kalem Eğimi (Tilt Shading)</span>
                  <button
                    type="button"
                    onClick={toggleTiltShading}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-all ${
                      toolSettings.tiltShading
                        ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {toolSettings.tiltShading ? 'Aktif' : 'Kapalı'}
                  </button>
                </div>

                {/* FAZ M: Stylus Hardware Double-Tap & Barrel Button Action */}
                <div className="pt-2 border-t border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">Apple Pencil / Stylus</span>
                    <span className="text-[10px] text-amber-400 font-mono font-medium">Çift Tıklama & Tuş</span>
                  </div>
                  <select
                    value={toolSettings.stylusDoubleTapAction ?? 'switch-eraser'}
                    onChange={(e) => setStylusDoubleTapAction(e.target.value as StylusDoubleTapAction)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
                  >
                    <option value="switch-eraser">🖊️ ↔ 🧹 Kalem / Silgi Değiştir</option>
                    <option value="switch-last-tool">🔄 Son Kullanılan Araca Geç</option>
                    <option value="show-color-palette">🎨 Renk Yuvası Değiştir</option>
                    <option value="undo">↩️ Son Çizimi Geri Al (Undo)</option>
                    <option value="none">🚫 Devre Dışı</option>
                  </select>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Apple Pencil çift dokunuşunda veya Wacom/S-Pen fıçı tuşunda tetiklenir.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-slate-700 mx-1" />

        {/* 🌟 GoodNotes 3 Favorite Color Slots */}
        <div className="flex items-center gap-1.5 px-1 relative">
          {toolSettings.favoriteColors.map((color, index) => {
            const isSlotActive =
              toolSettings.activeColorIndex === index && toolSettings.color === color;
            return (
              <div key={index} className="relative">
                <button
                  onClick={() => selectFavoriteColor(index)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setActiveColorSlot(activeColorSlot === index ? null : index);
                  }}
                  className={`w-6 h-6 rounded-full transition-transform flex items-center justify-center shadow-sm ${
                    isSlotActive
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800 scale-110'
                      : 'hover:scale-105 opacity-80 hover:opacity-100 ring-1 ring-white/20'
                  }`}
                  style={{ backgroundColor: color }}
                  title={`Favori Renk ${index + 1} (Sağ tıkla değiştir)`}
                >
                  {isSlotActive && (
                    <Check
                      size={11}
                      className={color === '#facc15' || color === '#ffffff' ? 'text-black' : 'text-white'}
                    />
                  )}
                </button>

                {/* Color Change Popover */}
                {activeColorSlot === index && (
                  <div className="absolute top-9 left-1/2 -translate-x-1/2 bg-slate-850 border border-slate-700 p-2.5 rounded-xl shadow-2xl z-50 w-44">
                    <div className="text-[10px] font-semibold text-slate-400 mb-1.5">
                      Favori Rengi Değiştir
                    </div>
                    <div className="grid grid-cols-5 gap-1.5 mb-2">
                      {COLOR_PALETTE.map((c) => (
                        <button
                          key={c}
                          onClick={() => {
                            setFavoriteColor(index, c);
                            setActiveColorSlot(null);
                          }}
                          className="w-5 h-5 rounded-full ring-1 ring-white/20 hover:scale-110"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="w-px h-5 bg-slate-700 mx-1" />

        {/* 🌟 GoodNotes 3 Favorite Size Slots */}
        <div className="flex items-center gap-1 px-1">
          {toolSettings.favoriteSizes.map((size, index) => {
            const isSizeActive =
              toolSettings.activeSizeIndex === index && toolSettings.size === size;
            return (
              <button
                key={index}
                onClick={() => selectFavoriteSize(index)}
                className={`w-6 h-6 rounded-lg font-mono text-[11px] font-semibold flex items-center justify-center transition-all ${
                  isSizeActive
                    ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }`}
                title={`Uç Kalınlığı: ${size}px`}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Right Section: Document Actions & YouTube */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Undo & Redo */}
        <div className="flex items-center bg-slate-800/80 rounded-xl p-0.5 border border-slate-750">
          <button
            onClick={undo}
            disabled={undoStack.length === 0}
            className={`p-1.5 rounded-lg transition-colors ${
              undoStack.length > 0
                ? 'text-slate-300 hover:text-white hover:bg-slate-700'
                : 'text-slate-600 cursor-not-allowed'
            }`}
            title="Geri Al"
          >
            <Undo2 size={16} />
          </button>
          <button
            onClick={redo}
            disabled={redoStack.length === 0}
            className={`p-1.5 rounded-lg transition-colors ${
              redoStack.length > 0
                ? 'text-slate-300 hover:text-white hover:bg-slate-700'
                : 'text-slate-600 cursor-not-allowed'
            }`}
            title="Yinele"
          >
            <Redo2 size={16} />
          </button>
        </div>

        {/* Clear Current Page */}
        <button
          onClick={clearCurrentPageStrokes}
          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors hidden md:block"
          title="Sayfadaki Çizimleri Temizle"
        >
          <Trash2 size={16} />
        </button>

        {/* Elements / Stickers Drawer Button */}
        <button
          onClick={() => setStickersDrawerOpen(true)}
          className="p-2 text-amber-400 hover:text-amber-300 hover:bg-slate-800 rounded-xl transition-colors"
          title="Öğeler & Çıkartmalar (Stickers Drawer)"
        >
          <Sparkles size={17} />
        </button>

        {/* Page Manager Grid View */}
        <button
          onClick={() => setPageManagerModalOpen(true)}
          className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-xl transition-colors"
          title="Sayfa Düzenleyici & Küçük Resim Izgarası (GoodNotes Grid)"
        >
          <Grid size={17} />
        </button>

        {/* Multi-Layer Engine Drawer */}
        <button
          onClick={() => setLayersDrawerOpen(true)}
          className={`p-2 rounded-xl transition-all ${
            layersDrawerOpen
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400'
              : 'text-slate-400 hover:text-indigo-400 hover:bg-slate-800'
          }`}
          title="Katmanlar Yöneticisi (Çizim, Fosfor, Metin, Çıkartma, Bant Katmanları)"
        >
          <Layers size={17} />
        </button>

        {/* CollaNote Style Live WebRTC Collaboration */}
        <button
          onClick={() => setCollaborationModalOpen(true)}
          className={`p-2 rounded-xl transition-all relative ${
            collaboration.isConnected
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400'
              : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800'
          }`}
          title={
            collaboration.isConnected
              ? `Canlı Oturum Aktif (${collaboration.roomId}) - ${collaboration.peers.length + 1} Katılımcı`
              : 'Canlı Birlikte Çizim (CollaNote Stili P2P Oda Kodu)'
          }
        >
          <Users size={17} />
          {collaboration.isConnected && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-300 ring-2 ring-slate-900 animate-ping" />
          )}
        </button>

        {/* Template Selector */}
        <button
          onClick={() => setTemplateModalOpen(true)}
          className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
          title="Defter Şablonunu Değiştir"
        >
          <LayoutTemplate size={17} />
        </button>

        {/* PDF & Word Import */}
        <button
          onClick={() => setDocImportModalOpen(true)}
          className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-xl transition-colors hidden sm:block"
          title="PDF veya Word İçe Aktar"
        >
          <UploadCloud size={17} />
        </button>

        {/* 🖼️ Faz E: Export & Share Studio (PDF, PNG, JPEG) */}
        <button
          onClick={() => setExportModalOpen(true)}
          className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-xl transition-colors"
          title="Dışa Aktar & Paylaş (PDF, PNG, JPEG)"
        >
          <FileDown size={17} />
        </button>

        {/* GoodNotes 6 Study Sets / Flashcards */}
        <button
          onClick={() => setStudySetsModalOpen(true)}
          className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-xl transition-colors relative"
          title="Çalışma Kartları & Aktif Hatırlama (GoodNotes Study Sets)"
        >
          <Brain size={17} />
          {activeNotebook?.flashcards && activeNotebook.flashcards.length > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          )}
        </button>

        {/* 🧠 GoodNotes 6 Math AI & Equation Solver */}
        <button
          onClick={() => openMathModal()}
          className={`p-2 rounded-xl transition-all ${
            mathModalOpen
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-1 ring-purple-400'
              : 'text-slate-400 hover:text-purple-400 hover:bg-slate-800'
          }`}
          title="Yapay Zeka Matematik & Denklem Çözücü (GoodNotes 6 Math AI)"
        >
          <Calculator size={17} />
        </button>

        {/* 📖 Dual Notebook Split-Screen Mode */}
        <button
          onClick={() => {
            if (splitNotebook.isOpen) {
              closeDualNotebook();
            } else {
              const other = notebooks.find((n) => n.id !== activeNotebookId);
              if (other) {
                openDualNotebook(other.id);
              } else {
                openDualNotebook(activeNotebookId || '');
              }
            }
          }}
          className={`p-2 rounded-xl transition-all ${
            splitNotebook.isOpen
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400'
              : 'text-slate-400 hover:text-indigo-400 hover:bg-slate-800'
          }`}
          title={
            splitNotebook.isOpen
              ? 'Çift Defter Görünümünü Kapat'
              : 'Çift Defter Yan Yana Aç (Dual Notebook Split-Screen)'
          }
        >
          <Split size={17} />
        </button>

        {/* Presentation Mode Toggle */}
        <button
          onClick={() => {
            const next = !presentationMode;
            setPresentationMode(next);
            if (next && document.documentElement.requestFullscreen) {
              document.documentElement.requestFullscreen().catch(() => {});
            }
          }}
          className={`p-2 rounded-xl transition-colors ${
            presentationMode
              ? 'bg-indigo-600 text-white shadow-md ring-1 ring-indigo-400'
              : 'text-slate-400 hover:text-indigo-400 hover:bg-slate-800'
          }`}
          title="Sunum Modu (Tam Ekran & Lazer)"
        >
          <Presentation size={17} />
        </button>

        {/* Smart Ink Contrast Inversion */}
        <button
          onClick={invertCurrentPageInks}
          className="p-2 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded-xl transition-colors hidden sm:block"
          title="Akıllı Mürekkep Kontrastı (Siyah/Beyaz Yazı Renklerini Uyarla)"
        >
          <Sun size={17} />
        </button>

        {/* Export .notefree Notebook Package */}
        <button
          onClick={() => activeNotebook && exportNotebookAsNotefree(activeNotebook)}
          className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-xl transition-colors hidden sm:block"
          title="Defteri .notefree Dosyası Olarak Dışa Aktar"
        >
          <FolderDown size={17} />
        </button>

        {/* 🍅 Faz D: Pomodoro Sayacı & Web Audio Ambiyans Üreteci */}
        <PomodoroBarWidget />

        {/* 🎙️ Notability Audio Recording & Note Replay */}
        <AudioPlayerBar />

        {/* YouTube Split Screen Button */}
        <button
          onClick={toggleYouTube}
          className={`px-2.5 py-1.5 rounded-xl font-medium text-xs flex items-center gap-1.5 transition-all shadow-sm ${
            youtube.isOpen
              ? 'bg-red-600 text-white shadow-red-600/30 ring-1 ring-red-400/50'
              : 'bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/60'
          }`}
          title="YouTube Video Panelini Aç/Kapat"
        >
          <Youtube size={15} className={youtube.isOpen ? 'fill-white' : 'text-red-500'} />
          <span className="hidden md:inline">YouTube</span>
        </button>
      </div>
    </header>
  );
};
