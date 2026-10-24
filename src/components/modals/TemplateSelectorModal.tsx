import React, { useState, useRef, useEffect } from 'react';
import { useNotebookStore } from '../../store/notebookStore';
import { PageTemplate, PaperColor, CustomTemplateItem } from '../../types/notebook';
import { drawPaperTemplate } from '../../engine/paperTemplates';
import {
  renderPdfPageAsTemplateImage,
  getPdfPageCount,
  renderAllPdfPagesAsTemplateImages,
} from '../../services/pdfService';
import {
  X,
  Check,
  Sliders,
  Ruler,
  Trash2,
  FileText,
  Sparkles,
  Loader2,
  FileUp,
  GraduationCap,
  BookmarkCheck,
  Search,
  Edit2,
  Layers,
  ArrowRight,
  Camera,
  CheckCircle2,
} from 'lucide-react';

interface TemplateItem {
  id: PageTemplate;
  name: string;
  desc: string;
  icon: string;
  category: 'classic' | 'stem' | 'plan' | 'creative';
}

const TEMPLATES: TemplateItem[] = [
  { id: 'lined', name: 'Çizgili Notluk', desc: 'Klasik defter çizgileri', icon: '📝', category: 'classic' },
  { id: 'lined-margin', name: 'Çizgili & Kenar Çizgili', desc: 'Sol kırmızı marjinli okul defteri', icon: '📖', category: 'classic' },
  { id: 'grid-5mm', name: 'Kareli Kağıt (5mm)', desc: 'Matematik ve sayısal dersler', icon: '📐', category: 'classic' },
  { id: 'dots', name: 'Noktalı (Bullet Journal)', desc: 'Bullet journal ve serbest şablon', icon: '⁖', category: 'classic' },
  { id: 'cornell', name: 'Cornell Not Metodu', desc: 'İpucu, not ve özet sütunları', icon: '🎓', category: 'classic' },
  { id: 'blank', name: 'Düz Beyaz', desc: 'Tamamen boş serbest tuval', icon: '📄', category: 'classic' },

  // STEM & Engineering
  { id: 'isometric-3d', name: 'İzometrik 3D Çizim', desc: '30°/90°/150° teknik perspektif kağıdı', icon: '🎲', category: 'stem' },
  { id: 'isometric-dots', name: 'İzometrik 3D Noktalı', desc: '3D çizim ve eskiz dot-matrix ağı', icon: '⁖', category: 'stem' },
  { id: 'polar-coordinate', name: 'Polar & Radyal Koordinat', desc: 'Dairesel radyal açılar & trigonometri', icon: '🎯', category: 'stem' },
  { id: 'engineering-1mm', name: 'Milimetrik Pafta (1mm CAD)', desc: '1mm/5mm/10mm teknik mühendislik antetli pafta', icon: '📐', category: 'stem' },
  { id: 'logarithmic-grid', name: 'Yarı-Logaritmik (Semi-Log)', desc: 'Frekans, Bode ve üssel büyüme dekadları', icon: '📈', category: 'stem' },
  { id: 'chemistry-hex', name: 'Organik Kimya & Benzen', desc: 'Benzen halkaları ve moleküler şablon', icon: '⚗️', category: 'stem' },
  { id: 'hexagonal', name: 'Hekzagonal Petek', desc: 'Petek desenli geometri şablonu', icon: '⬡', category: 'stem' },

  // Planner & Productivity
  { id: 'planner-weekly', name: 'Haftalık Ajanda', desc: 'Pazartesi-Pazar zaman blokları', icon: '📅', category: 'plan' },
  { id: 'planner-daily', name: 'Günlük Planlayıcı', desc: 'Saatlik ajanda & Yapılacaklar', icon: '⏱️', category: 'plan' },
  { id: 'planner-habit', name: 'Alışkanlık & Hedef Takibi', desc: 'Aylık 31 günlük habit tracker matrisi', icon: '🎯', category: 'plan' },

  // Language & Creative
  { id: 'language-vocab', name: 'Dil & Kelime Defteri', desc: '3 sütunlu Kelime | Anlam | Cümle şablonu', icon: '🌍', category: 'creative' },
  { id: 'tianzige-kanji', name: 'Asya Karakterleri (Tianzige & Kanji)', desc: 'Çince Hanzi ve Japonca Kanji kare kılavuzu', icon: '🈯', category: 'creative' },
  { id: 'guitar-tab', name: 'Gitar Tablatür (TAB)', desc: '6 telli gitar ve bas nota portesi', icon: '🎸', category: 'creative' },
  { id: 'music', name: 'Müzik Portesi (Dizek)', desc: 'Klasik 5 çizgili nota ve beste yazımı', icon: '🎵', category: 'creative' },
];

const COLORS: Array<{ id: PaperColor; name: string; bg: string }> = [
  { id: 'white', name: 'Saf Beyaz', bg: '#ffffff' },
  { id: 'cream', name: 'Doğal Krem', bg: '#faf7ee' },
  { id: 'yellow-pad', name: 'Sarı Bloknot', bg: '#fefce8' },
  { id: 'sage', name: 'Adaçayı Yeşili', bg: '#f2f5f0' },
  { id: 'kraft', name: 'Kraft Kağıt', bg: '#e7d8be' },
  { id: 'dark', name: 'Koyu Mod', bg: '#141923' },
];

const PRESET_LINE_COLORS = [
  { label: 'Varsayılan', color: '' },
  { label: 'Grafit', color: '#64748b' },
  { label: 'Mühendislik Blueprint', color: '#0284c7' },
  { label: 'Teknik Kiremit', color: '#ea580c' },
  { label: 'Klasik Mavi', color: '#3b82f6' },
  { label: 'Sepia Kahve', color: '#b45309' },
  { label: 'Lavanta', color: '#8b5cf6' },
  { label: 'Soft Nane', color: '#10b981' },
];

export const TemplateSelectorModal: React.FC = () => {
  const {
    templateModalOpen,
    setTemplateModalOpen,
    updateCurrentPageTemplate,
    customTemplates,
    addCustomTemplate,
    addCustomTemplates,
    renameCustomTemplate,
    deleteCustomTemplate,
    saveCurrentPageAsCustomTemplate,
    setCornellAssistantModalOpen,
    notebooks,
    activeNotebookId,
    activePageIndex,
  } = useNotebookStore();

  const activeNotebook = notebooks.find((n) => n.id === activeNotebookId);
  const currentPage = activeNotebook?.pages[activePageIndex];

  const [selectedTemplate, setSelectedTemplate] = useState<PageTemplate>(
    currentPage?.template || 'lined'
  );
  const [selectedColor, setSelectedColor] = useState<PaperColor>(
    currentPage?.paperColor || 'white'
  );
  const [customPitch, setCustomPitch] = useState<number>(
    currentPage?.customPitch || 32
  );
  const [customLineColor, setCustomLineColor] = useState<string>(
    currentPage?.customLineColor || ''
  );
  const [lineOpacity, setLineOpacity] = useState<number>(
    currentPage?.lineOpacity ?? 0.8
  );
  const [activeCategory, setActiveCategory] = useState<
    'all' | 'classic' | 'stem' | 'plan' | 'creative' | 'custom'
  >('all');

  const [selectedCustomTemplateId, setSelectedCustomTemplateId] = useState<string | null>(null);
  const [applyToAllPages, setApplyToAllPages] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Multi-Page PDF Batch Import Modal State
  const [pendingPdfFile, setPendingPdfFile] = useState<File | null>(null);
  const [pendingPdfTotalPages, setPendingPdfTotalPages] = useState<number>(1);
  const [multiPageMode, setMultiPageMode] = useState<'all' | 'first' | 'range'>('all');
  const [pageRangeText, setPageRangeText] = useState('1-5');
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);

  // Save current page as template dialog state
  const [showSavePageDialog, setShowSavePageDialog] = useState(false);
  const [savePageTitle, setSavePageTitle] = useState('');
  const [isSavingPage, setIsSavingPage] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // Custom template inline rename state
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editNameText, setEditNameText] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync state with current page when opened
  useEffect(() => {
    if (templateModalOpen && currentPage) {
      setSelectedTemplate(currentPage.template || 'lined');
      setSelectedColor(currentPage.paperColor || 'white');
      setCustomPitch(currentPage.customPitch || 32);
      setCustomLineColor(currentPage.customLineColor || '');
      setLineOpacity(currentPage.lineOpacity ?? 0.8);
      setApplyToAllPages(false);
      setUploadError(null);
      setPendingPdfFile(null);
      setShowSavePageDialog(false);
      setEditingTemplateId(null);
      setSaveFeedback(null);

      // Check if current page has a custom background that matches a saved template
      if (currentPage.backgroundImageUrl) {
        const matching = customTemplates.find((t) => t.dataUrl === currentPage.backgroundImageUrl);
        if (matching) {
          setSelectedCustomTemplateId(matching.id);
          setActiveCategory('custom');
        } else {
          setSelectedCustomTemplateId(null);
        }
      } else {
        setSelectedCustomTemplateId(null);
      }
    }
  }, [templateModalOpen, currentPage, customTemplates]);

  // Live Canvas Preview for Built-in Templates
  useEffect(() => {
    if (selectedCustomTemplateId) return;
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawPaperTemplate(
      ctx,
      canvas.width,
      canvas.height,
      selectedTemplate,
      selectedColor,
      customPitch,
      customLineColor || undefined,
      lineOpacity
    );
  }, [selectedTemplate, selectedColor, customPitch, customLineColor, lineOpacity, selectedCustomTemplateId]);

  if (!templateModalOpen) return null;

  // Handle file input selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    try {
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        const numPages = await getPdfPageCount(file);
        if (numPages > 1) {
          // Trigger multi-page batch import dialog
          setPendingPdfFile(file);
          setPendingPdfTotalPages(numPages);
          setPageRangeText(`1-${Math.min(10, numPages)}`);
          return;
        }

        // Single page PDF
        setIsUploading(true);
        const res = await renderPdfPageAsTemplateImage(file, 1);
        const newTemplate: CustomTemplateItem = {
          id: `custom_tpl_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          name: file.name.replace(/\.pdf$/i, ''),
          dataUrl: res.dataUrl,
          width: res.width,
          height: res.height,
          createdAt: Date.now(),
          category: 'planner',
          sourceFileName: file.name,
          pageNumber: 1,
        };
        addCustomTemplate(newTemplate);
        setSelectedCustomTemplateId(newTemplate.id);
        setActiveCategory('custom');
        setIsUploading(false);
      } else if (file.type.startsWith('image/')) {
        setIsUploading(true);
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          const newTemplate: CustomTemplateItem = {
            id: `custom_tpl_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            name: file.name.replace(/\.[^/.]+$/, ''),
            dataUrl,
            createdAt: Date.now(),
            category: 'custom',
            sourceFileName: file.name,
          };
          addCustomTemplate(newTemplate);
          setSelectedCustomTemplateId(newTemplate.id);
          setActiveCategory('custom');
          setIsUploading(false);
        };
        reader.readAsDataURL(file);
      } else {
        throw new Error('Yalnızca PDF ve resim (PNG, JPG, WEBP) dosyaları yüklenebilir.');
      }
    } catch (err: any) {
      console.error('Template upload failed:', err);
      setUploadError(err.message || 'Şablon dosyası yüklenirken bir hata oluştu.');
      setIsUploading(false);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Execute Batch Import for Multi-Page PDF
  const handleExecuteBatchPdfImport = async () => {
    if (!pendingPdfFile) return;

    setIsUploading(true);
    setUploadError(null);
    setImportProgress({ current: 0, total: pendingPdfTotalPages });

    try {
      let pageNumbers: number[] | undefined = undefined;

      if (multiPageMode === 'first') {
        pageNumbers = [1];
      } else if (multiPageMode === 'range') {
        const pagesSet = new Set<number>();
        const parts = pageRangeText.split(',');
        for (const part of parts) {
          const trimmed = part.trim();
          if (trimmed.includes('-')) {
            const [start, end] = trimmed.split('-').map((v) => parseInt(v.trim(), 10));
            if (!isNaN(start) && !isNaN(end)) {
              for (let p = Math.min(start, end); p <= Math.max(start, end); p++) {
                if (p >= 1 && p <= pendingPdfTotalPages) pagesSet.add(p);
              }
            }
          } else {
            const p = parseInt(trimmed, 10);
            if (!isNaN(p) && p >= 1 && p <= pendingPdfTotalPages) pagesSet.add(p);
          }
        }
        pageNumbers = Array.from(pagesSet).sort((a, b) => a - b);
        if (pageNumbers.length === 0) pageNumbers = [1];
      }

      const renderedPages = await renderAllPdfPagesAsTemplateImages(pendingPdfFile, {
        pageNumbers,
        onProgress: (current, total) => {
          setImportProgress({ current, total });
        },
      });

      const baseName = pendingPdfFile.name.replace(/\.pdf$/i, '');
      const newTemplates: CustomTemplateItem[] = renderedPages.map((rp) => ({
        id: `custom_tpl_${Date.now()}_${rp.pageNumber}_${Math.random().toString(36).substr(2, 4)}`,
        name: `${baseName} - Sayfa ${rp.pageNumber}`,
        dataUrl: rp.dataUrl,
        width: rp.width,
        height: rp.height,
        createdAt: Date.now(),
        category: 'planner',
        sourceFileName: pendingPdfFile.name,
        pageNumber: rp.pageNumber,
      }));

      addCustomTemplates(newTemplates);
      if (newTemplates.length > 0) {
        setSelectedCustomTemplateId(newTemplates[0].id);
      }
      setActiveCategory('custom');
      setPendingPdfFile(null);
    } catch (err: any) {
      console.error('Batch PDF import failed:', err);
      setUploadError(err.message || 'Çok sayfalı PDF aktarılırken bir hata oluştu.');
    } finally {
      setIsUploading(false);
      setImportProgress(null);
    }
  };

  // Handle saving the current canvas page as a reusable template
  const handleSaveCurrentPage = async () => {
    setIsSavingPage(true);
    const title = savePageTitle.trim() || `${activeNotebook?.title || 'Defter'} - Sayfa ${activePageIndex + 1}`;
    const result = await saveCurrentPageAsCustomTemplate(title, 'custom');
    setIsSavingPage(false);

    if (result) {
      setSelectedCustomTemplateId(result.id);
      setActiveCategory('custom');
      setShowSavePageDialog(false);
      setSaveFeedback('Mevcut sayfa özel şablonlarınıza eklendi!');
      setTimeout(() => setSaveFeedback(null), 2500);
    }
  };

  const handleApply = () => {
    if (selectedCustomTemplateId) {
      const customTpl = customTemplates.find((t) => t.id === selectedCustomTemplateId);
      if (customTpl) {
        updateCurrentPageTemplate(
          'blank',
          'white',
          undefined,
          undefined,
          undefined,
          customTpl.dataUrl,
          applyToAllPages
        );
        return;
      }
    }

    // Built-in standard template
    updateCurrentPageTemplate(
      selectedTemplate,
      selectedColor,
      customPitch,
      customLineColor || undefined,
      lineOpacity,
      '', // clear any custom background image
      applyToAllPages
    );
  };

  const filteredTemplates = TEMPLATES.filter((t) => {
    const matchesCat = activeCategory === 'all' || t.category === activeCategory;
    const matchesSearch =
      !searchQuery ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const filteredCustomTemplates = customTemplates.filter((tmpl) => {
    if (!searchQuery) return true;
    return (
      tmpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tmpl.sourceFileName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const isPitchApplicable = [
    'lined',
    'lined-margin',
    'grid-5mm',
    'dots',
    'isometric',
    'isometric-3d',
    'isometric-dots',
    'polar-coordinate',
    'logarithmic-grid',
    'cornell',
    'hexagonal',
  ].includes(selectedTemplate);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div>
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <Ruler size={18} className="text-indigo-400" />
              Defter Şablonu, Özel PDF & Cornell Stüdyosu
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Sayfa {activePageIndex + 1} için şablon, çok sayfalı PDF planlayıcı veya kılavuz aralığı seçin.
            </p>
          </div>
          <button
            onClick={() => setTemplateModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Multi-Page PDF Dialog Prompt */}
          {pendingPdfFile && (
            <div className="bg-indigo-950/60 border border-indigo-500/40 rounded-2xl p-5 space-y-4 animate-in fade-in">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-indigo-200 flex items-center gap-2">
                    <Layers size={18} className="text-indigo-400" />
                    Çok Sayfalı PDF Algılandı: {pendingPdfFile.name}
                  </h3>
                  <p className="text-xs text-indigo-300/80 mt-1">
                    Bu belgede toplam <strong>{pendingPdfTotalPages} sayfa</strong> bulunuyor. Hangi sayfaları şablon olarak içe aktarmak istersiniz?
                  </p>
                </div>
                <button
                  onClick={() => setPendingPdfFile(null)}
                  className="p-1 text-indigo-400 hover:text-white rounded"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setMultiPageMode('all')}
                  className={`p-3 rounded-xl border text-left text-xs transition-all ${
                    multiPageMode === 'all'
                      ? 'border-indigo-400 bg-indigo-600/30 text-white font-semibold'
                      : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="block font-bold">Tüm Sayfaları Al</span>
                  <span className="text-[11px] opacity-80 block mt-0.5">1'den {pendingPdfTotalPages}'ye kadar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMultiPageMode('first')}
                  className={`p-3 rounded-xl border text-left text-xs transition-all ${
                    multiPageMode === 'first'
                      ? 'border-indigo-400 bg-indigo-600/30 text-white font-semibold'
                      : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="block font-bold">Yalnızca 1. Sayfa</span>
                  <span className="text-[11px] opacity-80 block mt-0.5">Kapak veya ana şablon</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMultiPageMode('range')}
                  className={`p-3 rounded-xl border text-left text-xs transition-all ${
                    multiPageMode === 'range'
                      ? 'border-indigo-400 bg-indigo-600/30 text-white font-semibold'
                      : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="block font-bold">Özel Sayfa Aralığı</span>
                  <span className="text-[11px] opacity-80 block mt-0.5">Belirli sayfalar</span>
                </button>
              </div>

              {multiPageMode === 'range' && (
                <div className="pt-1">
                  <label className="text-[11px] font-medium text-indigo-300 block mb-1">
                    Sayfa Numaraları veya Aralıkları (Örn: 1-5, 8, 12):
                  </label>
                  <input
                    type="text"
                    value={pageRangeText}
                    onChange={(e) => setPageRangeText(e.target.value)}
                    className="w-full bg-slate-950 border border-indigo-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-400"
                  />
                </div>
              )}

              {importProgress && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between text-xs text-indigo-200">
                    <span className="flex items-center gap-1.5">
                      <Loader2 size={13} className="animate-spin text-indigo-400" />
                      Sayfalar Yüksek Çözünürlükte Taranıyor...
                    </span>
                    <span className="font-mono font-bold">
                      {importProgress.current} / {importProgress.total}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-amber-400 transition-all duration-200"
                      style={{
                        width: `${Math.round((importProgress.current / importProgress.total) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => setPendingPdfFile(null)}
                  className="px-3.5 py-1.5 text-xs text-slate-300 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  İptal
                </button>
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={handleExecuteBatchPdfImport}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg shadow transition-colors flex items-center gap-1.5"
                >
                  {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Layers size={14} />}
                  <span>İçe Aktarımı Başlat</span>
                </button>
              </div>
            </div>
          )}

          {/* Feedback banner */}
          {saveFeedback && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{saveFeedback}</span>
            </div>
          )}

          {/* Paper Texture / Color Selection */}
          {!selectedCustomTemplateId && (
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-3">
                Kağıt Rengi & Dokusu
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {COLORS.map((col) => (
                  <button
                    key={col.id}
                    onClick={() => setSelectedColor(col.id)}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                      selectedColor === col.id
                        ? 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/30'
                        : 'border-slate-700/80 bg-slate-800/50 hover:bg-slate-800'
                    }`}
                  >
                    <span
                      className="w-8 h-8 rounded-full border border-slate-600 shadow-sm flex items-center justify-center"
                      style={{ backgroundColor: col.bg }}
                    >
                      {selectedColor === col.id && (
                        <Check size={14} className={col.id === 'white' ? 'text-slate-900' : 'text-slate-700'} />
                      )}
                    </span>
                    <span className="text-xs font-medium text-slate-200 text-center">
                      {col.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pitch & Guide Settings (When applicable) */}
          {isPitchApplicable && !selectedCustomTemplateId && (
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders size={16} className="text-indigo-400" />
                  <span className="text-xs font-semibold text-slate-200">
                    Kılavuz Çizgi / Kare Aralığı & Renk Ayarı
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                    {customPitch}px (~{(customPitch / 3.78).toFixed(1)} mm)
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-center">
                {/* Live Preview Canvas Swatch */}
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <div className="w-28 h-20 rounded-xl overflow-hidden border border-slate-700 shadow-inner bg-slate-900 relative">
                    <canvas
                      ref={previewCanvasRef}
                      width={112}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">Canlı Önizleme</span>
                </div>

                {/* Sliders */}
                <div className="flex-1 w-full space-y-3">
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Çizgi / Kare Aralığı</span>
                      <span>{customPitch} px</span>
                    </div>
                    <input
                      type="range"
                      min={16}
                      max={72}
                      step={2}
                      value={customPitch}
                      onChange={(e) => setCustomPitch(Number(e.target.value))}
                      className="w-full accent-indigo-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Çizgi Opaklığı</span>
                      <span>{Math.round(lineOpacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0.15}
                      max={1.0}
                      step={0.05}
                      value={lineOpacity}
                      onChange={(e) => setLineOpacity(Number(e.target.value))}
                      className="w-full accent-indigo-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Preset Line Colors */}
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1.5">Çizgi Rengi</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {PRESET_LINE_COLORS.map((pc) => (
                        <button
                          key={pc.label}
                          type="button"
                          onClick={() => setCustomLineColor(pc.color)}
                          className={`w-5 h-5 rounded-full border transition-transform ${
                            customLineColor === pc.color
                              ? 'ring-2 ring-indigo-400 scale-110'
                              : 'border-slate-600 hover:scale-105'
                          }`}
                          style={{ backgroundColor: pc.color || '#64748b' }}
                          title={pc.label}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Special Cornell Banner if Cornell template selected */}
          {selectedTemplate === 'cornell' && !selectedCustomTemplateId && (
            <div className="p-4 rounded-xl border border-indigo-500/40 bg-gradient-to-r from-indigo-950/60 to-purple-950/40 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-500/30">
                  <GraduationCap size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-100 flex items-center gap-2">
                    Cornell Not Alma & Aktif Hatırlama Stüdyosu
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    İpuçları, ders notları ve özet bloklarını otomatik yerleştirin veya ezber katlama modunu açın.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCornellAssistantModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-colors shrink-0 flex items-center gap-1.5"
              >
                <span>Cornell Stüdyosu</span>
                <ArrowRight size={13} />
              </button>
            </div>
          )}

          {/* Template Style Selection Header & Tabs */}
          <div>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Şablon Stili {activeCategory === 'custom' ? `(${customTemplates.length})` : `(${filteredTemplates.length})`}
              </label>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-xl text-[11px] font-medium flex-wrap">
                {[
                  { id: 'all', label: 'Tümü' },
                  { id: 'classic', label: 'Klasik' },
                  { id: 'stem', label: 'STEM' },
                  { id: 'plan', label: 'Ajanda' },
                  { id: 'creative', label: 'Dil & Müzik' },
                  { id: 'custom', label: `Özel PDF (${customTemplates.length})` },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setActiveCategory(cat.id as any);
                      if (cat.id !== 'custom' && selectedCustomTemplateId) {
                        setSelectedCustomTemplateId(null);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                      activeCategory === cat.id
                        ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat.id === 'custom' && <Sparkles size={11} className="text-amber-400" />}
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input for Templates */}
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeCategory === 'custom'
                    ? 'Özel şablonlarda ara...'
                    : 'Şablon ara (Örn: Cornell, Ajanda, İzometrik, Dizek)...'
                }
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Error Message */}
            {uploadError && (
              <div className="mb-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <span>⚠️ {uploadError}</span>
              </div>
            )}

            {/* FAZ R & AM: Custom Templates View */}
            {activeCategory === 'custom' ? (
              <div className="space-y-4">
                {/* Upload & Capture Page Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf,image/png,image/jpeg,image/webp"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="border-2 border-dashed border-indigo-500/40 hover:border-indigo-400 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-300 p-3.5 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold transition-all group"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 size={16} className="animate-spin text-indigo-400" />
                        <span>PDF / Görsel İşleniyor...</span>
                      </>
                    ) : (
                      <>
                        <FileUp size={16} className="group-hover:-translate-y-0.5 transition-transform text-indigo-400" />
                        <span>PDF / Görsel Yükle (Çok Sayfalı Destekli)</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setSavePageTitle(`${activeNotebook?.title || 'Defter'} - Sayfa ${activePageIndex + 1}`);
                      setShowSavePageDialog(true);
                    }}
                    className="border border-amber-500/30 hover:border-amber-400 bg-amber-500/5 hover:bg-amber-500/10 text-amber-300 p-3.5 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold transition-all"
                  >
                    <Camera size={16} className="text-amber-400" />
                    <span>Mevcut Sayfamı Şablon Yap</span>
                  </button>
                </div>

                {/* Inline Save Page Dialog */}
                {showSavePageDialog && (
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/40 space-y-2.5 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                        <Sparkles size={14} className="text-amber-400" />
                        Mevcut Sayfayı Özel Şablon Olarak Kaydet
                      </span>
                      <button
                        onClick={() => setShowSavePageDialog(false)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={savePageTitle}
                        onChange={(e) => setSavePageTitle(e.target.value)}
                        placeholder="Şablon adı..."
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                      <button
                        onClick={handleSaveCurrentPage}
                        disabled={isSavingPage}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1 shrink-0"
                      >
                        {isSavingPage ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                        <span>Kaydet</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Uploaded Templates Grid */}
                {filteredCustomTemplates.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 border border-slate-800 rounded-xl bg-slate-950/40">
                    <FileText size={28} className="mx-auto mb-2 text-slate-600" />
                    <p className="text-xs">
                      {searchQuery ? 'Aramanızla eşleşen şablon bulunamadı.' : 'Henüz yüklenmiş özel şablon yok.'}
                    </p>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Kendi tasarladığınız ajanda veya çalışma kağıdı PDF'ini ekleyin ya da mevcut sayfanızı şablon yapın.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                    {filteredCustomTemplates.map((tmpl) => (
                      <div
                        key={tmpl.id}
                        onClick={() => setSelectedCustomTemplateId(tmpl.id)}
                        className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between gap-3 transition-all ${
                          selectedCustomTemplateId === tmpl.id
                            ? 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/30'
                            : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 truncate flex-1 min-w-0">
                          {/* Mini Thumbnail */}
                          <div className="w-12 h-14 rounded-lg bg-white overflow-hidden border border-slate-700 shrink-0 shadow-sm relative">
                            <img
                              src={tmpl.dataUrl}
                              alt={tmpl.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="truncate flex-1 min-w-0">
                            {editingTemplateId === tmpl.id ? (
                              <div
                                className="flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  type="text"
                                  autoFocus
                                  value={editNameText}
                                  onChange={(e) => setEditNameText(e.target.value)}
                                  className="w-full bg-slate-950 border border-indigo-500 rounded px-1.5 py-0.5 text-xs text-white"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    renameCustomTemplate(tmpl.id, editNameText);
                                    setEditingTemplateId(null);
                                  }}
                                  className="p-1 text-emerald-400 hover:bg-slate-700 rounded"
                                >
                                  <Check size={12} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingTemplateId(null)}
                                  className="p-1 text-slate-400 hover:bg-slate-700 rounded"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ) : (
                              <>
                                <h4 className="text-xs font-semibold text-slate-200 truncate flex items-center gap-1">
                                  {tmpl.name}
                                  {selectedCustomTemplateId === tmpl.id && (
                                    <Check size={12} className="text-indigo-400 shrink-0" />
                                  )}
                                </h4>
                                <span className="text-[10px] text-slate-500 block mt-0.5 font-mono truncate">
                                  {tmpl.sourceFileName ? tmpl.sourceFileName : 'Özel Sayfa Şablonu'}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTemplateId(tmpl.id);
                              setEditNameText(tmpl.name);
                            }}
                            className="p-1.5 text-slate-500 hover:text-indigo-300 hover:bg-slate-750 rounded-lg transition-colors"
                            title="Yeniden Adlandır"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              deleteCustomTemplate(tmpl.id);
                              if (selectedCustomTemplateId === tmpl.id) {
                                setSelectedCustomTemplateId(null);
                              }
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-750 rounded-lg transition-colors"
                            title="Şablonu Sil"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Built-in Templates Grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredTemplates.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => {
                      setSelectedTemplate(tmpl.id);
                      setSelectedCustomTemplateId(null);
                    }}
                    className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                      selectedTemplate === tmpl.id && !selectedCustomTemplateId
                        ? 'border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500/40'
                        : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-2xl p-2 bg-slate-800 rounded-lg shrink-0 border border-slate-750">
                      {tmpl.icon}
                    </div>
                    <div className="truncate">
                      <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
                        {tmpl.name}
                        {selectedTemplate === tmpl.id && !selectedCustomTemplateId && (
                          <Check size={14} className="text-indigo-400 inline" />
                        )}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{tmpl.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-3.5 bg-slate-900/90 border-t border-slate-800">
          {/* Apply to All Pages Checkbox */}
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 hover:text-white select-none">
            <input
              type="checkbox"
              checked={applyToAllPages}
              onChange={(e) => setApplyToAllPages(e.target.checked)}
              className="rounded accent-indigo-600 w-3.5 h-3.5 bg-slate-700 border-slate-600"
            />
            <span>Defterdeki tüm sayfalara uygula ({activeNotebook?.pages.length || 1} sayfa)</span>
          </label>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTemplateModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white rounded-xl hover:bg-slate-750 transition-colors"
            >
              Vazgeç
            </button>
            <button
              onClick={handleApply}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md transition-colors"
            >
              Şablonu Uygula
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
