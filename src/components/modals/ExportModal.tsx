import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNotebookStore } from '../../store/notebookStore';
import {
  FileDown,
  Image as ImageIcon,
  FileText,
  X,
  Sparkles,
  Check,
  Layers,
  Eye,
  Download,
  Shield,
  Hash,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Stamp,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react';
import {
  ExportOptions,
  WatermarkOptions,
  HeaderFooterOptions,
  HeaderFooterFormat,
  HeaderFooterPosition,
} from '../../types/notebook';
import {
  exportPageAsImage,
  exportNotebookWithAllLayers,
  renderPageToCanvas,
  downloadBlob,
  parsePageRange,
} from '../../services/exportService';
import { triggerHaptic } from '../../engine/hapticFeedback';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ExportTab = 'format' | 'watermark' | 'headerFooter';

const WATERMARK_PRESETS = [
  'TASLAK',
  'GİZLİDİR',
  'ÖZEL & GİZLİ',
  'KİŞİSEL KOPYA',
  'ÖRNEKTİR',
  'NOTEFREE',
];

const WATERMARK_COLORS = [
  { name: 'Slate', color: '#94a3b8' },
  { name: 'Kırmızı', color: '#ef4444' },
  { name: 'Mavi', color: '#3b82f6' },
  { name: 'Amber', color: '#f59e0b' },
  { name: 'Zümrüt', color: '#10b981' },
  { name: 'Mor', color: '#a855f7' },
];

const HEADER_FOOTER_COLORS = [
  { name: 'Slate', color: '#64748b' },
  { name: 'Grafit', color: '#334155' },
  { name: 'Açık Gri', color: '#94a3b8' },
  { name: 'Mavi', color: '#2563eb' },
];

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const {
    notebooks,
    activeNotebookId,
    activePageIndex,
    exportInitialPageRange,
  } = useNotebookStore();

  const activeNotebook = notebooks.find((n) => n.id === activeNotebookId);
  const totalPages = activeNotebook?.pages.length || 1;

  // Active Tab
  const [activeTab, setActiveTab] = useState<ExportTab>('format');

  // Format & Scope
  const [format, setFormat] = useState<'pdf' | 'png' | 'jpeg'>('pdf');
  const [scope, setScope] = useState<'current' | 'all' | 'custom'>('current');
  const [pageRange, setPageRange] = useState<string>('');
  const [scale, setScale] = useState<1 | 2 | 3>(2);

  // Layers Toggles
  const [transparentBg, setTransparentBg] = useState<boolean>(false);
  const [includeTemplate, setIncludeTemplate] = useState<boolean>(true);
  const [includeStickyNotes, setIncludeStickyNotes] = useState<boolean>(true);
  const [includeTexts, setIncludeTexts] = useState<boolean>(true);
  const [includeStickers, setIncludeStickers] = useState<boolean>(true);
  const [includePdfBookmarks, setIncludePdfBookmarks] = useState<boolean>(true);
  const [insertTableOfContentsPage, setInsertTableOfContentsPage] = useState<boolean>(false);

  // Watermark Options
  const [watermarkEnabled, setWatermarkEnabled] = useState<boolean>(false);
  const [watermarkText, setWatermarkText] = useState<string>('TASLAK');
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(0.18);
  const [watermarkColor, setWatermarkColor] = useState<string>('#94a3b8');
  const [watermarkFontSize, setWatermarkFontSize] = useState<number>(56);
  const [watermarkRotation, setWatermarkRotation] = useState<number>(-45);
  const [watermarkTiled, setWatermarkTiled] = useState<boolean>(false);

  // Header & Footer Options
  const [headerFooterEnabled, setHeaderFooterEnabled] = useState<boolean>(false);
  const [hfFormat, setHfFormat] = useState<HeaderFooterFormat>('page-of-total');
  const [hfPosition, setHfPosition] = useState<HeaderFooterPosition>('bottom-center');
  const [hfFontSize, setHfFontSize] = useState<number>(12);
  const [hfColor, setHfColor] = useState<string>('#64748b');
  const [batesPrefix, setBatesPrefix] = useState<string>('PAGE ');
  const [batesDigits, setBatesDigits] = useState<number>(3);

  // Export & Preview state
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [previewPageIndex, setPreviewPageIndex] = useState<number>(activePageIndex);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize initial range if opened from batch selection
  useEffect(() => {
    if (isOpen) {
      if (exportInitialPageRange) {
        setScope('custom');
        setPageRange(exportInitialPageRange);
        const parsed = parsePageRange(exportInitialPageRange, totalPages);
        if (parsed.length > 0) {
          setPreviewPageIndex(parsed[0]);
        }
      } else {
        setPreviewPageIndex(activePageIndex);
      }
    }
  }, [isOpen, exportInitialPageRange, activePageIndex, totalPages]);

  // Valid parsed page indices
  const resolvedPageIndices = useMemo(() => {
    if (scope === 'current') return [activePageIndex];
    if (scope === 'all') return Array.from({ length: totalPages }, (_, i) => i);
    const parsed = parsePageRange(pageRange, totalPages);
    return parsed.length > 0 ? parsed : [activePageIndex];
  }, [scope, pageRange, totalPages, activePageIndex]);

  // Sync preview page within resolved indices
  useEffect(() => {
    if (!resolvedPageIndices.includes(previewPageIndex)) {
      setPreviewPageIndex(resolvedPageIndices[0] ?? 0);
    }
  }, [resolvedPageIndices, previewPageIndex]);

  // Live Canvas Preview Renderer
  useEffect(() => {
    if (!isOpen || !activeNotebook) return;

    const targetPage = activeNotebook.pages[previewPageIndex] || activeNotebook.pages[0];
    if (!targetPage) return;

    let isCancelled = false;
    setPreviewLoading(true);

    const timer = setTimeout(async () => {
      try {
        const previewCanvas = await renderPageToCanvas(targetPage, {
          scale: 1, // fast rendering for preview
          transparentBg: format === 'png' && transparentBg,
          includeTemplate,
          includeStickyNotes,
          includeTexts,
          includeStickers,
          watermark: watermarkEnabled
            ? {
                enabled: true,
                text: watermarkText,
                opacity: watermarkOpacity,
                color: watermarkColor,
                fontSize: watermarkFontSize,
                rotation: watermarkRotation,
                tiled: watermarkTiled,
              }
            : undefined,
          headerFooter: headerFooterEnabled
            ? {
                enabled: true,
                format: hfFormat,
                position: hfPosition,
                fontSize: hfFontSize,
                color: hfColor,
                batesPrefix,
                batesDigits,
              }
            : undefined,
          pageIndex: previewPageIndex,
          totalPages: totalPages,
          notebookTitle: activeNotebook.title,
        });

        if (isCancelled || !previewCanvasRef.current) return;

        const displayCanvas = previewCanvasRef.current;
        displayCanvas.width = previewCanvas.width;
        displayCanvas.height = previewCanvas.height;
        const ctx = displayCanvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);
          ctx.drawImage(previewCanvas, 0, 0);
        }
      } catch (err) {
        console.warn('Live preview rendering error:', err);
      } finally {
        if (!isCancelled) setPreviewLoading(false);
      }
    }, 80);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [
    isOpen,
    activeNotebook,
    previewPageIndex,
    format,
    transparentBg,
    includeTemplate,
    includeStickyNotes,
    includeTexts,
    includeStickers,
    watermarkEnabled,
    watermarkText,
    watermarkOpacity,
    watermarkColor,
    watermarkFontSize,
    watermarkRotation,
    watermarkTiled,
    headerFooterEnabled,
    hfFormat,
    hfPosition,
    hfFontSize,
    hfColor,
    batesPrefix,
    batesDigits,
    totalPages,
  ]);

  if (!isOpen || !activeNotebook) return null;

  const currentPage = activeNotebook.pages[previewPageIndex] || activeNotebook.pages[0];

  const handleExport = async () => {
    setIsExporting(true);
    triggerHaptic('medium');

    try {
      const watermarkOpts: WatermarkOptions | undefined = watermarkEnabled
        ? {
            enabled: true,
            text: watermarkText,
            opacity: watermarkOpacity,
            color: watermarkColor,
            fontSize: watermarkFontSize,
            rotation: watermarkRotation,
            tiled: watermarkTiled,
          }
        : undefined;

      const headerFooterOpts: HeaderFooterOptions | undefined = headerFooterEnabled
        ? {
            enabled: true,
            format: hfFormat,
            position: hfPosition,
            fontSize: hfFontSize,
            color: hfColor,
            batesPrefix,
            batesDigits,
          }
        : undefined;

      const options: ExportOptions = {
        format,
        scope,
        pageRange: scope === 'custom' ? pageRange : undefined,
        scale,
        transparentBg: format === 'png' && transparentBg,
        includeTemplate,
        includeStickyNotes,
        includeTexts,
        includeStickers,
        includePdfBookmarks,
        insertTableOfContentsPage,
        watermark: watermarkOpts,
        headerFooter: headerFooterOpts,
      };

      const titleSafe = activeNotebook.title.replace(/[^a-zA-Z0-9_\-ğüşöçİĞÜŞÖÇ]/g, '_');

      if (format === 'pdf') {
        const blob = await exportNotebookWithAllLayers(activeNotebook, options);
        const scopeLabel =
          scope === 'current'
            ? `sayfa_${previewPageIndex + 1}`
            : scope === 'custom'
            ? `sayfalar_${resolvedPageIndices.map((i) => i + 1).join('_')}`
            : 'tamami';
        downloadBlob(blob, `${titleSafe}_${scopeLabel}.pdf`);
      } else {
        // Image export
        const blob = await exportPageAsImage(currentPage, options, {
          pageIndex: previewPageIndex,
          totalPages: totalPages,
          notebookTitle: activeNotebook.title,
        });
        downloadBlob(
          blob,
          `${titleSafe}_sayfa_${previewPageIndex + 1}.${format === 'jpeg' ? 'jpg' : 'png'}`
        );
      }

      triggerHaptic('success');
      onClose();
    } catch (err) {
      console.error('Export error:', err);
      alert('Dışa aktarma sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsExporting(false);
    }
  };

  // Preview Pagination
  const handlePrevPage = () => {
    const curIdx = resolvedPageIndices.indexOf(previewPageIndex);
    if (curIdx > 0) {
      triggerHaptic('light');
      setPreviewPageIndex(resolvedPageIndices[curIdx - 1]);
    }
  };

  const handleNextPage = () => {
    const curIdx = resolvedPageIndices.indexOf(previewPageIndex);
    if (curIdx < resolvedPageIndices.length - 1) {
      triggerHaptic('light');
      setPreviewPageIndex(resolvedPageIndices[curIdx + 1]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-750 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-150 text-white flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-800 flex items-center justify-between bg-slate-925/40 gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <FileDown size={19} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 truncate">
                <span className="truncate">Dışa Aktarma Stüdyosu</span>
                <span className="hidden sm:inline text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-medium">
                  Studio Export
                </span>
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                {activeNotebook.title} • {totalPages} sayfa
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-5 pt-2 gap-2 select-none overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('format');
            }}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
              activeTab === 'format'
                ? 'text-indigo-400 border-indigo-500 bg-slate-900'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <FileText size={14} />
            <span>Biçim & Sayfalar</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('watermark');
            }}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
              activeTab === 'watermark'
                ? 'text-indigo-400 border-indigo-500 bg-slate-900'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Shield size={14} />
            <span>Filigran & Güvenlik</span>
            {watermarkEnabled && (
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('headerFooter');
            }}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
              activeTab === 'headerFooter'
                ? 'text-indigo-400 border-indigo-500 bg-slate-900'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Hash size={14} />
            <span>Sayfa & Bates No</span>
            {headerFooterEnabled && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
        </div>

        {/* Modal Main Content: Left Controls & Right Live Preview */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-y-auto md:overflow-hidden divide-y md:divide-y-0 md:divide-x divide-slate-800">
          {/* Left Column: Settings Panel */}
          <div className="md:col-span-7 p-4 sm:p-5 space-y-4 overflow-y-visible md:overflow-y-auto max-h-none md:max-h-[64vh]">
            {/* TAB 1: FORMAT & SCOPE */}
            {activeTab === 'format' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* 1. Format Selection */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-2 block">
                    Çıktı Dosya Biçimi
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormat('pdf')}
                      className={`p-3 rounded-2xl border text-center transition-all ${
                        format === 'pdf'
                          ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold ring-1 ring-indigo-500'
                          : 'bg-slate-800/60 border-slate-750 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <FileText size={20} className="mx-auto mb-1.5 text-rose-400" />
                      <span className="text-xs block font-bold">PDF Belgesi</span>
                      <span className="text-[10px] text-slate-400">Tüm katmanlar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormat('png')}
                      className={`p-3 rounded-2xl border text-center transition-all ${
                        format === 'png'
                          ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold ring-1 ring-indigo-500'
                          : 'bg-slate-800/60 border-slate-750 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <ImageIcon size={20} className="mx-auto mb-1.5 text-indigo-400" />
                      <span className="text-xs block font-bold">PNG Resmi</span>
                      <span className="text-[10px] text-slate-400">Saydamlık desteği</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormat('jpeg')}
                      className={`p-3 rounded-2xl border text-center transition-all ${
                        format === 'jpeg'
                          ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold ring-1 ring-indigo-500'
                          : 'bg-slate-800/60 border-slate-750 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <ImageIcon size={20} className="mx-auto mb-1.5 text-amber-400" />
                      <span className="text-xs block font-bold">JPEG Resmi</span>
                      <span className="text-[10px] text-slate-400">Kompakt boyut</span>
                    </button>
                  </div>
                </div>

                {/* 2. Scope Selection (Only for PDF; images export active page) */}
                {format === 'pdf' ? (
                  <div>
                    <label className="text-xs font-semibold text-slate-300 mb-2 block">
                      Sayfa Kapsamı
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setScope('current')}
                        className={`p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                          scope === 'current'
                            ? 'bg-indigo-600/25 border-indigo-500 text-white'
                            : 'bg-slate-800/50 border-slate-750 text-slate-400 hover:text-white'
                        }`}
                      >
                        Aktif Sayfa ({activePageIndex + 1})
                      </button>

                      <button
                        type="button"
                        onClick={() => setScope('all')}
                        className={`p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                          scope === 'all'
                            ? 'bg-indigo-600/25 border-indigo-500 text-white'
                            : 'bg-slate-800/50 border-slate-750 text-slate-400 hover:text-white'
                        }`}
                      >
                        Tüm Defter ({totalPages})
                      </button>

                      <button
                        type="button"
                        onClick={() => setScope('custom')}
                        className={`p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                          scope === 'custom'
                            ? 'bg-indigo-600/25 border-indigo-500 text-white'
                            : 'bg-slate-800/50 border-slate-750 text-slate-400 hover:text-white'
                        }`}
                      >
                        Özel Aralık
                      </button>
                    </div>

                    {/* Custom Page Range Input */}
                    {scope === 'custom' && (
                      <div className="mt-2.5 p-3 bg-slate-950/60 border border-slate-750 rounded-2xl space-y-2 animate-in fade-in">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-300 font-medium">Sayfa Numaraları:</span>
                          <span className="text-[11px] text-indigo-400">
                            {resolvedPageIndices.length} sayfa seçildi
                          </span>
                        </div>
                        <input
                          type="text"
                          value={pageRange}
                          onChange={(e) => setPageRange(e.target.value)}
                          placeholder="Örn: 1-3, 5, 8-12"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                        />
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => setPageRange('1-5')}
                            className="text-[10px] bg-slate-800 hover:bg-slate-750 px-2 py-0.5 rounded-md text-slate-300"
                          >
                            İlk 5 Sayfa
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const odds = Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter((n) => n % 2 !== 0)
                                .join(', ');
                              setPageRange(odds);
                            }}
                            className="text-[10px] bg-slate-800 hover:bg-slate-750 px-2 py-0.5 rounded-md text-slate-300"
                          >
                            Tek Sayfalar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const evens = Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter((n) => n % 2 === 0)
                                .join(', ');
                              setPageRange(evens);
                            }}
                            className="text-[10px] bg-slate-800 hover:bg-slate-750 px-2 py-0.5 rounded-md text-slate-300"
                          >
                            Çift Sayfalar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-800/40 border border-slate-750 rounded-2xl text-xs text-slate-400 flex items-center gap-2">
                    <ImageIcon size={15} className="text-indigo-400 shrink-0" />
                    <span>
                      Görsel formatında ({format.toUpperCase()}) önizlenen sayfa ({previewPageIndex + 1}) dışa aktarılır.
                    </span>
                  </div>
                )}

                {/* 3. Quality & Resolution */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-2 block">
                    Çözünürlük & Baskı Kalitesi
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { s: 1, label: '1x Standart', dpi: '96 DPI' },
                      { s: 2, label: '2x Retina HD', dpi: '192 DPI (Önerilen)' },
                      { s: 3, label: '3x Ultra HD', dpi: '300 DPI Baskı' },
                    ].map((opt) => (
                      <button
                        key={opt.s}
                        type="button"
                        onClick={() => setScale(opt.s as any)}
                        className={`p-2 rounded-xl border text-center transition-all ${
                          scale === opt.s
                            ? 'bg-indigo-600/30 border-indigo-500 text-white font-bold'
                            : 'bg-slate-800/40 border-slate-750 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span className="text-xs block font-bold">{opt.label}</span>
                        <span className="text-[10px] text-slate-500">{opt.dpi}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Layer Options */}
                <div className="bg-slate-800/50 border border-slate-750 rounded-2xl p-3.5 space-y-2.5">
                  <span className="text-xs font-bold text-slate-200 block mb-1">
                    Dışa Aktarma Katmanları
                  </span>

                  {format === 'png' && (
                    <label className="flex items-center justify-between text-xs cursor-pointer select-none">
                      <span className="text-slate-300">Saydam Arka Plan (Transparent PNG)</span>
                      <input
                        type="checkbox"
                        checked={transparentBg}
                        onChange={(e) => setTransparentBg(e.target.checked)}
                        className="rounded accent-indigo-500 w-4 h-4 cursor-pointer"
                      />
                    </label>
                  )}

                  <label className="flex items-center justify-between text-xs cursor-pointer select-none">
                    <span className="text-slate-300">Kağıt Kılavuz Çizgileri / Kareleri</span>
                    <input
                      type="checkbox"
                      checked={includeTemplate}
                      onChange={(e) => setIncludeTemplate(e.target.checked)}
                      className="rounded accent-indigo-500 w-4 h-4 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs cursor-pointer select-none">
                    <span className="text-slate-300">Metin Kutuları (Text Annotations)</span>
                    <input
                      type="checkbox"
                      checked={includeTexts}
                      onChange={(e) => setIncludeTexts(e.target.checked)}
                      className="rounded accent-indigo-500 w-4 h-4 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs cursor-pointer select-none">
                    <span className="text-slate-300">Yapışkan Post-It Notları</span>
                    <input
                      type="checkbox"
                      checked={includeStickyNotes}
                      onChange={(e) => setIncludeStickyNotes(e.target.checked)}
                      className="rounded accent-indigo-500 w-4 h-4 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs cursor-pointer select-none">
                    <span className="text-slate-300">Çıkartmalar, Damgalar ve Mühürler</span>
                    <input
                      type="checkbox"
                      checked={includeStickers}
                      onChange={(e) => setIncludeStickers(e.target.checked)}
                      className="rounded accent-indigo-500 w-4 h-4 cursor-pointer"
                    />
                  </label>

                  {format === 'pdf' && (
                    <>
                      <div className="pt-1.5 border-t border-slate-750/70" />
                      <label className="flex items-center justify-between text-xs cursor-pointer select-none">
                        <div>
                          <span className="text-slate-200 font-medium block">PDF Yer İmleri (Bookmarks & Outline)</span>
                          <span className="text-[10px] text-slate-400">Acrobat ve Apple Books için yerel başlık ağacı</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={includePdfBookmarks}
                          onChange={(e) => setIncludePdfBookmarks(e.target.checked)}
                          className="rounded accent-indigo-500 w-4 h-4 cursor-pointer"
                        />
                      </label>

                      <label className="flex items-center justify-between text-xs cursor-pointer select-none">
                        <div>
                          <span className="text-slate-200 font-medium block">İçindekiler Tablosu Sayfası Ekle</span>
                          <span className="text-[10px] text-slate-400">İlk sayfaya görsel fihrist dizini ekler</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={insertTableOfContentsPage}
                          onChange={(e) => setInsertTableOfContentsPage(e.target.checked)}
                          className="rounded accent-indigo-500 w-4 h-4 cursor-pointer"
                        />
                      </label>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: WATERMARK & SECURITY */}
            {activeTab === 'watermark' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between p-3 bg-slate-800/40 border border-slate-750 rounded-2xl">
                  <div>
                    <span className="text-xs font-bold text-white block">Güvenlik Filigranı</span>
                    <span className="text-[11px] text-slate-400">
                      Sayfaların üzerine yarı saydam metin damgalayın
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setWatermarkEnabled(!watermarkEnabled);
                    }}
                    className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                      watermarkEnabled ? 'bg-indigo-600 justify-end' : 'bg-slate-700 justify-start'
                    }`}
                  >
                    <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                  </button>
                </div>

                {watermarkEnabled && (
                  <div className="space-y-3.5 p-4 bg-slate-950/60 border border-slate-750 rounded-2xl animate-in fade-in">
                    {/* Presets */}
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 mb-1.5 block">
                        Hazır Güvenlik Şablonları:
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {WATERMARK_PRESETS.map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => {
                              triggerHaptic('light');
                              setWatermarkText(preset);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                              watermarkText === preset
                                ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                                : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Text */}
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 mb-1 block">
                        Filigran Metni:
                      </label>
                      <input
                        type="text"
                        value={watermarkText}
                        onChange={(e) => setWatermarkText(e.target.value)}
                        placeholder="Örn: TASLAK veya Kurum Adı"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    {/* Color & Opacity Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 mb-1.5 block">
                          Metin Rengi:
                        </label>
                        <div className="flex items-center gap-1.5">
                          {WATERMARK_COLORS.map((c) => (
                            <button
                              key={c.color}
                              type="button"
                              onClick={() => {
                                triggerHaptic('light');
                                setWatermarkColor(c.color);
                              }}
                              className={`w-6 h-6 rounded-full border transition-all ${
                                watermarkColor === c.color
                                  ? 'ring-2 ring-white scale-110'
                                  : 'border-transparent opacity-80 hover:opacity-100'
                              }`}
                              style={{ backgroundColor: c.color }}
                              title={c.name}
                            />
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] font-semibold text-slate-300 mb-1">
                          <span>Opaklık:</span>
                          <span className="text-indigo-400 font-mono">
                            %{Math.round(watermarkOpacity * 100)}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.05"
                          max="0.65"
                          step="0.02"
                          value={watermarkOpacity}
                          onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                          className="w-full accent-indigo-500 cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Font Size & Rotation Angle */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="flex justify-between text-[11px] font-semibold text-slate-300 mb-1">
                          <span>Yazı Boyutu:</span>
                          <span className="text-indigo-400 font-mono">{watermarkFontSize}px</span>
                        </div>
                        <input
                          type="range"
                          min="24"
                          max="110"
                          step="4"
                          value={watermarkFontSize}
                          onChange={(e) => setWatermarkFontSize(parseInt(e.target.value, 10))}
                          className="w-full accent-indigo-500 cursor-pointer"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 mb-1.5 block">
                          Eğim & Açı:
                        </label>
                        <div className="grid grid-cols-3 gap-1">
                          {[
                            { label: '-45°', angle: -45 },
                            { label: '0°', angle: 0 },
                            { label: '+45°', angle: 45 },
                          ].map((a) => (
                            <button
                              key={a.angle}
                              type="button"
                              onClick={() => setWatermarkRotation(a.angle)}
                              className={`py-1 text-xs font-semibold rounded-lg border transition-all ${
                                watermarkRotation === a.angle
                                  ? 'bg-indigo-600/30 border-indigo-500 text-white'
                                  : 'bg-slate-800/60 border-slate-750 text-slate-400 hover:text-white'
                              }`}
                            >
                              {a.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Pattern Style Toggle */}
                    <label className="flex items-center justify-between text-xs cursor-pointer select-none pt-1">
                      <span className="text-slate-300">
                        Tüm Sayfaya Çapraz Tekrarla (Tiled Repeat Grid)
                      </span>
                      <input
                        type="checkbox"
                        checked={watermarkTiled}
                        onChange={(e) => setWatermarkTiled(e.target.checked)}
                        className="rounded accent-indigo-500 w-4 h-4 cursor-pointer"
                      />
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: HEADER & FOOTER / BATES NUMBERING */}
            {activeTab === 'headerFooter' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between p-3 bg-slate-800/40 border border-slate-750 rounded-2xl">
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Sayfa & Bates Numaralandırması
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Sayfaların üst veya altına otomatik numara ve başlık ekleyin
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setHeaderFooterEnabled(!headerFooterEnabled);
                    }}
                    className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                      headerFooterEnabled
                        ? 'bg-emerald-600 justify-end'
                        : 'bg-slate-700 justify-start'
                    }`}
                  >
                    <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                  </button>
                </div>

                {headerFooterEnabled && (
                  <div className="space-y-3.5 p-4 bg-slate-950/60 border border-slate-750 rounded-2xl animate-in fade-in">
                    {/* Format Selector */}
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 mb-1.5 block">
                        Numara & Başlık Biçimi:
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          {
                            f: 'page-of-total',
                            title: 'Sayfa X / Y',
                            sub: `Sayfa ${previewPageIndex + 1} / ${totalPages}`,
                          },
                          {
                            f: 'bates',
                            title: 'Bates Hukuk / Arşiv',
                            sub: `${batesPrefix}00${previewPageIndex + 1} / 00${totalPages}`,
                          },
                          {
                            f: 'title-page',
                            title: 'Defter Başlığı + Sayfa',
                            sub: `${activeNotebook.title} • Sayfa ${previewPageIndex + 1}`,
                          },
                          {
                            f: 'date-page',
                            title: 'Tarih + Sayfa No',
                            sub: `${new Date().toLocaleDateString('tr-TR')} • Sayfa ${previewPageIndex + 1}`,
                          },
                        ].map((item) => (
                          <button
                            key={item.f}
                            type="button"
                            onClick={() => {
                              triggerHaptic('light');
                              setHfFormat(item.f as HeaderFooterFormat);
                            }}
                            className={`p-2 rounded-xl border text-left transition-all ${
                              hfFormat === item.f
                                ? 'bg-indigo-600/25 border-indigo-500 text-white font-bold ring-1 ring-indigo-500'
                                : 'bg-slate-800/60 border-slate-750 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            <span className="text-xs block font-bold">{item.title}</span>
                            <span className="text-[10px] text-slate-400 truncate block">
                              {item.sub}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Bates Prefix & Digits if bates selected */}
                    {hfFormat === 'bates' && (
                      <div className="grid grid-cols-2 gap-3 p-2.5 bg-slate-900 border border-slate-750 rounded-xl">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">
                            Bates Öneki:
                          </label>
                          <input
                            type="text"
                            value={batesPrefix}
                            onChange={(e) => setBatesPrefix(e.target.value)}
                            placeholder="PAGE "
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">
                            Basamak Sayısı:
                          </label>
                          <div className="grid grid-cols-3 gap-1">
                            {[2, 3, 4].map((d) => (
                              <button
                                key={d}
                                type="button"
                                onClick={() => setBatesDigits(d)}
                                className={`py-1 text-xs font-semibold rounded-lg border ${
                                  batesDigits === d
                                    ? 'bg-indigo-600/30 border-indigo-500 text-white'
                                    : 'bg-slate-800 border-slate-700 text-slate-400'
                                }`}
                              >
                                {d} hane
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Position Selector */}
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 mb-1.5 block">
                        Sayfadaki Konum:
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setHfPosition('top-left')}
                          className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 ${
                            hfPosition === 'top-left'
                              ? 'bg-indigo-600/30 border-indigo-500 text-white'
                              : 'bg-slate-800/60 border-slate-750 text-slate-400 hover:text-white'
                          }`}
                        >
                          <AlignLeft size={13} />
                          <span>Üst Sol</span>
                        </button>

                        <div className="p-2 border border-dashed border-slate-800 rounded-xl flex items-center justify-center text-[10px] text-slate-600">
                          Sayfa Üstü
                        </div>

                        <button
                          type="button"
                          onClick={() => setHfPosition('top-right')}
                          className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 ${
                            hfPosition === 'top-right'
                              ? 'bg-indigo-600/30 border-indigo-500 text-white'
                              : 'bg-slate-800/60 border-slate-750 text-slate-400 hover:text-white'
                          }`}
                        >
                          <AlignRight size={13} />
                          <span>Üst Sağ</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setHfPosition('bottom-left')}
                          className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 ${
                            hfPosition === 'bottom-left'
                              ? 'bg-indigo-600/30 border-indigo-500 text-white'
                              : 'bg-slate-800/60 border-slate-750 text-slate-400 hover:text-white'
                          }`}
                        >
                          <AlignLeft size={13} />
                          <span>Alt Sol</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setHfPosition('bottom-center')}
                          className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 ${
                            hfPosition === 'bottom-center'
                              ? 'bg-indigo-600/30 border-indigo-500 text-white'
                              : 'bg-slate-800/60 border-slate-750 text-slate-400 hover:text-white'
                          }`}
                        >
                          <AlignCenter size={13} />
                          <span>Alt Orta</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setHfPosition('bottom-right')}
                          className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 ${
                            hfPosition === 'bottom-right'
                              ? 'bg-indigo-600/30 border-indigo-500 text-white'
                              : 'bg-slate-800/60 border-slate-750 text-slate-400 hover:text-white'
                          }`}
                        >
                          <AlignRight size={13} />
                          <span>Alt Sağ</span>
                        </button>
                      </div>
                    </div>

                    {/* Font Size & Color */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <div className="flex justify-between text-[11px] font-semibold text-slate-300 mb-1">
                          <span>Yazı Boyutu:</span>
                          <span className="text-indigo-400 font-mono">{hfFontSize}px</span>
                        </div>
                        <input
                          type="range"
                          min="9"
                          max="20"
                          step="1"
                          value={hfFontSize}
                          onChange={(e) => setHfFontSize(parseInt(e.target.value, 10))}
                          className="w-full accent-indigo-500 cursor-pointer"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 mb-1.5 block">
                          Yazı Rengi:
                        </label>
                        <div className="flex items-center gap-1.5">
                          {HEADER_FOOTER_COLORS.map((c) => (
                            <button
                              key={c.color}
                              type="button"
                              onClick={() => {
                                triggerHaptic('light');
                                setHfColor(c.color);
                              }}
                              className={`w-6 h-6 rounded-full border transition-all ${
                                hfColor === c.color
                                  ? 'ring-2 ring-white scale-110'
                                  : 'border-transparent opacity-80 hover:opacity-100'
                              }`}
                              style={{ backgroundColor: c.color }}
                              title={c.name}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Live Export Preview */}
          <div className="md:col-span-5 p-5 bg-slate-950/60 flex flex-col justify-between items-center overflow-hidden">
            <div className="w-full flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Eye size={14} className="text-indigo-400" />
                Canlı Çıktı Önizlemesi
              </span>
              <span className="text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md font-mono">
                {scale === 1 ? '96 DPI' : scale === 2 ? '192 DPI Retina' : '300 DPI Ultra'}
              </span>
            </div>

            {/* Preview Box Container */}
            <div className="relative w-full flex-1 flex items-center justify-center p-2 min-h-[220px] max-h-[360px] overflow-hidden">
              <div className="relative shadow-2xl rounded-xl overflow-hidden border border-slate-700/80 bg-white max-h-full flex items-center justify-center">
                <canvas
                  ref={previewCanvasRef}
                  className="max-h-[300px] max-w-full object-contain block"
                />
                {previewLoading && (
                  <div className="absolute inset-0 bg-slate-950/30 backdrop-blur-[1px] flex items-center justify-center">
                    <Sparkles size={18} className="text-indigo-400 animate-spin" />
                  </div>
                )}
              </div>
            </div>

            {/* Pagination Scrubber Controls (if multi-page) */}
            <div className="w-full mt-3 pt-2 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrevPage}
                disabled={resolvedPageIndices.indexOf(previewPageIndex) <= 0}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 disabled:opacity-30 text-slate-300 transition-colors"
                title="Önceki Sayfa"
              >
                <ChevronLeft size={16} />
              </button>

              <div className="text-center">
                <span className="text-xs font-bold text-white block">
                  Sayfa {previewPageIndex + 1}
                </span>
                <span className="text-[10px] text-slate-400">
                  {resolvedPageIndices.length > 1
                    ? `(${resolvedPageIndices.indexOf(previewPageIndex) + 1} / ${resolvedPageIndices.length} seçili)`
                    : `Toplam ${totalPages} sayfa`}
                </span>
              </div>

              <button
                type="button"
                onClick={handleNextPage}
                disabled={
                  resolvedPageIndices.indexOf(previewPageIndex) >=
                  resolvedPageIndices.length - 1
                }
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 disabled:opacity-30 text-slate-300 transition-colors"
                title="Sonraki Sayfa"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between gap-3 bg-slate-925/40">
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">
              {format.toUpperCase()}
            </span>
            <span>•</span>
            <span>
              {format === 'pdf'
                ? scope === 'all'
                  ? `${totalPages} sayfa`
                  : `${resolvedPageIndices.length} sayfa`
                : 'Aktif sayfa'}
            </span>
            {watermarkEnabled && (
              <>
                <span>•</span>
                <span className="text-indigo-400 font-medium">Filigranlı</span>
              </>
            )}
            {headerFooterEnabled && (
              <>
                <span>•</span>
                <span className="text-emerald-400 font-medium">Numaralandırılmış</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
            >
              Vazgeç
            </button>

            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting || (scope === 'custom' && resolvedPageIndices.length === 0)}
              className="flex-2 sm:flex-none px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
            >
              {isExporting ? (
                <>
                  <Sparkles size={15} className="animate-spin text-white" />
                  <span>Dışa Aktarılıyor...</span>
                </>
              ) : (
                <>
                  <Download size={15} />
                  <span>{format.toUpperCase()} Olarak İndir</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
