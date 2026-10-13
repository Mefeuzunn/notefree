import React, { useState } from 'react';
import { useNotebookStore } from '../../store/notebookStore';
import { exportNotebookToPdf } from '../../services/pdfService';
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
  Menu,
  Sparkles,
  Zap,
  MousePointer,
  Check,
  Type,
  Compass,
  Library,
  Grid,
} from 'lucide-react';
import { PenType, ShapeType, ToolType } from '../../types/notebook';
import { AudioPlayerBar } from '../audio/AudioPlayerBar';

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
  } = useNotebookStore();

  const [activeColorSlot, setActiveColorSlot] = useState<number | null>(null);
  const [activeSizeSlot, setActiveSizeSlot] = useState<number | null>(null);
  const [eraserMenuOpen, setEraserMenuOpen] = useState(false);
  const [shapeMenuOpen, setShapeMenuOpen] = useState(false);
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

        <div className="hidden lg:flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full shrink-0 shadow-sm"
            style={{ backgroundColor: activeNotebook?.coverColor || '#3b82f6' }}
          />
          <span className="font-semibold text-xs text-slate-200 max-w-[170px] truncate">
            {activeNotebook?.title || 'Defter Seçilmedi'}
          </span>
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
            <div className="absolute top-12 left-0 bg-slate-800 border border-slate-700 shadow-xl rounded-xl p-1.5 flex gap-1 z-50 animate-in fade-in zoom-in-95">
              {(['line', 'arrow', 'rectangle', 'circle', 'triangle'] as ShapeType[]).map(
                (shp) => (
                  <button
                    key={shp}
                    onClick={() => {
                      setSelectedShape(shp);
                      setShapeMenuOpen(false);
                    }}
                    className={`px-2.5 py-1 text-xs rounded-lg capitalize transition-colors ${
                      toolSettings.selectedShape === shp
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-300 hover:bg-slate-700'
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

        {/* Template Selector */}
        <button
          onClick={() => setTemplateModalOpen(true)}
          className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
          title="Defter Şablonunu Değiştir"
        >
          <Layers size={17} />
        </button>

        {/* PDF & Word Import */}
        <button
          onClick={() => setDocImportModalOpen(true)}
          className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-xl transition-colors hidden sm:block"
          title="PDF veya Word İçe Aktar"
        >
          <UploadCloud size={17} />
        </button>

        {/* Export to PDF */}
        <button
          onClick={handleExportPdf}
          disabled={isExporting}
          className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-xl transition-colors"
          title="Notlu PDF Olarak İndir"
        >
          <FileDown size={17} className={isExporting ? 'animate-bounce text-emerald-400' : ''} />
        </button>

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
