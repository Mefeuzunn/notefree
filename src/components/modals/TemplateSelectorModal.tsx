import React, { useState, useRef, useEffect } from 'react';
import { useNotebookStore } from '../../store/notebookStore';
import { PageTemplate, PaperColor } from '../../types/notebook';
import { PAPER_COLORS, drawPaperTemplate } from '../../engine/paperTemplates';
import { X, Check, Sliders, Palette, Eye, RotateCcw, Ruler } from 'lucide-react';

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
    'all' | 'classic' | 'stem' | 'plan' | 'creative'
  >('all');

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Live Canvas Preview
  useEffect(() => {
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
  }, [selectedTemplate, selectedColor, customPitch, customLineColor, lineOpacity]);

  const filteredTemplates = TEMPLATES.filter(
    (t) => activeCategory === 'all' || t.category === activeCategory
  );

  if (!templateModalOpen) return null;

  const handleApply = () => {
    updateCurrentPageTemplate(
      selectedTemplate,
      selectedColor,
      customPitch,
      customLineColor || undefined,
      lineOpacity
    );
  };

  const isPitchApplicable = [
    'lined',
    'lined-margin',
    'grid-5mm',
    'dots',
    'isometric',
    'cornell',
    'hexagonal',
  ].includes(selectedTemplate);

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
              Sayfa {activePageIndex + 1} için şablon, satır/kare aralığı ve kağıt rengini belirleyin.
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

          {/* 📏 Faz G: Custom Pitch & Line Color Studio (When applicable) */}
          {isPitchApplicable && (
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

                {/* Pitch Slider & Presets */}
                <div className="flex-1 w-full space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Satır / Kare Aralığı:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setCustomPitch(22)}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                          customPitch === 22
                            ? 'bg-indigo-600 text-white border-indigo-500'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                        }`}
                      >
                        Dar (5mm)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomPitch(32)}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                          customPitch === 32
                            ? 'bg-indigo-600 text-white border-indigo-500'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                        }`}
                      >
                        Standart (7mm)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomPitch(44)}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                          customPitch === 44
                            ? 'bg-indigo-600 text-white border-indigo-500'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                        }`}
                      >
                        Geniş (10mm)
                      </button>
                    </div>
                  </div>

                  <input
                    type="range"
                    min={16}
                    max={64}
                    step={2}
                    value={customPitch}
                    onChange={(e) => setCustomPitch(Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />

                  {/* Line Opacity & Color */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-850">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400">Opaklık:</span>
                      <input
                        type="range"
                        min={0.2}
                        max={1.0}
                        step={0.1}
                        value={lineOpacity}
                        onChange={(e) => setLineOpacity(Number(e.target.value))}
                        className="w-20 accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                      />
                      <span className="text-[10px] font-mono text-slate-400">
                        %{Math.round(lineOpacity * 100)}
                      </span>
                    </div>

                    {/* Color Swatches */}
                    <div className="flex items-center gap-1.5">
                      {PRESET_LINE_COLORS.map((pc) => (
                        <button
                          key={pc.label}
                          type="button"
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

          {/* Template Style Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Defter Şablonu ({filteredTemplates.length})
              </label>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-xl text-[11px] font-medium">
                {[
                  { id: 'all', label: 'Tümü' },
                  { id: 'classic', label: 'Klasik' },
                  { id: 'stem', label: 'STEM' },
                  { id: 'plan', label: 'Ajanda' },
                  { id: 'creative', label: 'Dil & Müzik' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id as any)}
                    className={`px-2.5 py-1 rounded-lg transition-colors ${
                      activeCategory === cat.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredTemplates.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => setSelectedTemplate(tmpl.id)}
                  className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                    selectedTemplate === tmpl.id
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
                      {selectedTemplate === tmpl.id && (
                        <Check size={14} className="text-indigo-400 inline" />
                      )}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{tmpl.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-3.5 bg-slate-800/60 border-t border-slate-800">
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
  );
};
