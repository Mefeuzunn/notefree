import React, { useState, useRef, useEffect } from 'react';
import { useNotebookStore } from '../../store/notebookStore';
import { PageTemplate, PaperColor, CustomTemplateItem } from '../../types/notebook';
import { PAPER_COLORS, drawPaperTemplate } from '../../engine/paperTemplates';
import { renderPdfPageAsTemplateImage } from '../../services/pdfService';
import {
  X,
  Check,
  Sliders,
  Palette,
  Eye,
  RotateCcw,
  Ruler,
  UploadCloud,
  Trash2,
  FileText,
  Sparkles,
  Loader2,
  FileUp,
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
  { id: 'chemistry-hex', name: 'Organik Kimya & Benzen', desc: 'Benzen halkaları ve moleküler şablon', icon: '⚗️', category: 'stem' },
  { id: 'engineering-1mm', name: 'Mühendislik Paftası (1mm)', desc: 'Milimetrik teknik CAD ve mimari pafta', icon: '📐', category: 'stem' },
  { id: 'isometric', name: 'İzometrik 3D Çizim', desc: 'Perspektif ve şematik çizimler', icon: '🎲', category: 'stem' },
  { id: 'hexagonal', name: 'Hekzagonal Petek', desc: 'Petek desenli geometri şablonu', icon: '⬡', category: 'stem' },

  // Planner & Productivity
  { id: 'planner-weekly', name: 'Haftalık Ajanda', desc: 'Pazartesi-Pazar zaman blokları', icon: '📅', category: 'plan' },
  { id: 'planner-daily', name: 'Günlük Planlayıcı', desc: 'Saatlik ajanda & Yapılacaklar', icon: '⏱️', category: 'plan' },
  { id: 'planner-habit', name: 'Alışkanlık & Hedef Takibi', desc: 'Aylık 31 günlük habit tracker matrisi', icon: '🎯', category: 'plan' },

  // Language & Creative
  { id: 'language-vocab', name: 'Dil & Kelime Defteri', desc: '3 sütunlu Kelime | Anlam | Cümle şablonu', icon: '🌍', category: 'creative' },
  { id: 'guitar-tab', name: 'Gitar Tablatür (TAB)', desc: '6 telli gitar ve bas nota portesi', icon: '🎸', category: 'creative' },
  { id: 'music', name: 'Müzik Portesi (Dizek)', desc: 'Klasik 5 çizgili nota ve beste yazımı', icon: '🎵', category: 'creative' },
];

const COLORS: Array<{ id: PaperColor; name: string; bg: string }> = [
  { id: 'white', name: 'Saf Beyaz', bg: '#ffffff' },
  { id: 'cream', name: 'Krem / Fildişi', bg: '#fcfaf2' },
  { id: 'yellow-pad', name: 'Sarı Bloknot', bg: '#fefce8' },
  { id: 'kraft', name: 'Kraft Kağıt', bg: '#e7d8be' },
  { id: 'dark', name: 'Koyu Mod', bg: '#181b26' },
];

const PRESET_LINE_COLORS = [
  { label: 'Varsayılan', color: '' },
  { label: 'Grafit', color: '#64748b' },
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
    deleteCustomTemplate,
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

  // Handle file upload (PDF or Image)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        const res = await renderPdfPageAsTemplateImage(file, 1);
        const newTemplate: CustomTemplateItem = {
          id: `custom_tpl_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          name: file.name.replace(/\.pdf$/i, ''),
          dataUrl: res.dataUrl,
          width: res.width,
          height: res.height,
          createdAt: Date.now(),
        };
        addCustomTemplate(newTemplate);
        setSelectedCustomTemplateId(newTemplate.id);
        setActiveCategory('custom');
      } else if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          const newTemplate: CustomTemplateItem = {
            id: `custom_tpl_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            name: file.name.replace(/\.[^/.]+$/, ''),
            dataUrl,
            createdAt: Date.now(),
          };
          addCustomTemplate(newTemplate);
          setSelectedCustomTemplateId(newTemplate.id);
          setActiveCategory('custom');
          setIsUploading(false);
        };
        reader.readAsDataURL(file);
        return;
      } else {
        throw new Error('Yalnızca PDF ve resim (PNG, JPG, WEBP) dosyaları yüklenebilir.');
      }
    } catch (err: any) {
      console.error('Template upload failed:', err);
      setUploadError(err.message || 'Şablon dosyası yüklenirken bir hata oluştu.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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

  const filteredTemplates = TEMPLATES.filter(
    (t) => activeCategory === 'all' || t.category === activeCategory
  );

  const isPitchApplicable = [
    'lined',
    'lined-margin',
    'grid-5mm',
    'dots',
    'isometric',
    'cornell',
    'hexagonal',
  ].includes(selectedTemplate);

  const activeCustomTpl = selectedCustomTemplateId
    ? customTemplates.find((t) => t.id === selectedCustomTemplateId)
    : null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <Ruler size={18} className="text-indigo-400" />
              Defter Şablonu & Kılavuz Ayarları
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Sayfa {activePageIndex + 1} için şablon, özel PDF arka planı veya satır/kare aralığını belirleyin.
            </p>
          </div>
          <button
            onClick={() => setTemplateModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Paper Texture / Color Selection */}
          {!selectedCustomTemplateId && (
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-3">
                Kağıt Rengi & Dokusu
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
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

          {/* 📏 Faz G: Custom Pitch & Line Color Studio (When applicable) */}
          {isPitchApplicable && !selectedCustomTemplateId && (
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders size={16} className="text-indigo-400" />
                  <span className="text-xs font-semibold text-slate-200">
                    Kılavuz Çizgi / Kare Aralığı & Görünüm Ayarı
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
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Eye size={10} /> Canlı Önizleme
                  </span>
                </div>

                {/* Pitch Slider & Controls */}
                <div className="flex-1 space-y-3 w-full">
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Aralık: {customPitch}px</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCustomPitch(22)}
                          className="hover:text-indigo-300 underline text-[10px]"
                        >
                          Dar (5mm)
                        </button>
                        <button
                          onClick={() => setCustomPitch(32)}
                          className="hover:text-indigo-300 underline text-[10px]"
                        >
                          Standart (7mm)
                        </button>
                        <button
                          onClick={() => setCustomPitch(44)}
                          className="hover:text-indigo-300 underline text-[10px]"
                        >
                          Geniş (10mm)
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min={16}
                      max={64}
                      value={customPitch}
                      onChange={(e) => setCustomPitch(parseInt(e.target.value, 10))}
                      className="w-full h-1.5 accent-indigo-500 rounded-lg cursor-pointer bg-slate-700"
                    />
                  </div>

                  {/* Line Opacity Slider */}
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Çizgi Kontrastı: %{Math.round(lineOpacity * 100)}</span>
                    </div>
                    <input
                      type="range"
                      min={0.2}
                      max={1.0}
                      step={0.05}
                      value={lineOpacity}
                      onChange={(e) => setLineOpacity(parseFloat(e.target.value))}
                      className="w-full h-1.5 accent-indigo-500 rounded-lg cursor-pointer bg-slate-700"
                    />
                  </div>

                  {/* Preset Line Colors */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] text-slate-400 font-medium">Çizgi Rengi:</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {PRESET_LINE_COLORS.map((pc) => (
                        <button
                          key={pc.label}
                          onClick={() => setCustomLineColor(pc.color)}
                          className={`w-4 h-4 rounded-full border transition-all ${
                            customLineColor === pc.color
                              ? 'ring-2 ring-indigo-400 scale-110'
                              : 'opacity-70 hover:opacity-100'
                          }`}
                          style={{
                            backgroundColor: pc.color || (selectedColor === 'dark' ? '#282f44' : '#e2e8f0'),
                          }}
                          title={pc.label}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
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

            {/* Error Message */}
            {uploadError && (
              <div className="mb-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <span>⚠️ {uploadError}</span>
              </div>
            )}

            {/* FAZ R: Custom Templates View */}
            {activeCategory === 'custom' ? (
              <div className="space-y-3">
                {/* Upload Button */}
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".pdf,image/png,image/jpeg,image/webp"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex-1 border-2 border-dashed border-indigo-500/40 hover:border-indigo-400 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-300 p-4 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold transition-all group"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 size={16} className="animate-spin text-indigo-400" />
                        <span>PDF / Görsel İşleniyor...</span>
                      </>
                    ) : (
                      <>
                        <FileUp size={16} className="group-hover:-translate-y-0.5 transition-transform" />
                        <span>PDF veya Görsel Şablon Yükle (.pdf, .png, .jpg)</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Uploaded Templates Grid */}
                {customTemplates.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 border border-slate-800 rounded-xl bg-slate-950/40">
                    <FileText size={28} className="mx-auto mb-2 text-slate-600" />
                    <p className="text-xs">Henüz yüklenmiş özel şablon yok.</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Kendi tasarladığınız ajanda, planlayıcı veya çalışma kağıdı PDF'ini ekleyin.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                    {customTemplates.map((tmpl) => (
                      <div
                        key={tmpl.id}
                        onClick={() => setSelectedCustomTemplateId(tmpl.id)}
                        className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between gap-3 transition-all ${
                          selectedCustomTemplateId === tmpl.id
                            ? 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/30'
                            : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 truncate">
                          {/* Mini Thumbnail */}
                          <div className="w-12 h-14 rounded-lg bg-white overflow-hidden border border-slate-700 shrink-0 shadow-sm relative">
                            <img
                              src={tmpl.dataUrl}
                              alt={tmpl.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="truncate">
                            <h4 className="text-xs font-semibold text-slate-200 truncate flex items-center gap-1">
                              {tmpl.name}
                              {selectedCustomTemplateId === tmpl.id && (
                                <Check size={12} className="text-indigo-400 shrink-0" />
                              )}
                            </h4>
                            <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">
                              Özel PDF Şablonu
                            </span>
                          </div>
                        </div>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCustomTemplate(tmpl.id);
                            if (selectedCustomTemplateId === tmpl.id) {
                              setSelectedCustomTemplateId(null);
                            }
                          }}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-750 rounded-lg transition-colors"
                          title="Şablonu Sil"
                        >
                          <Trash2 size={14} />
                        </button>
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
        <div className="flex items-center justify-between gap-3 px-6 py-3.5 bg-slate-800/60 border-t border-slate-800">
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
