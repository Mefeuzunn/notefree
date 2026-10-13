import React, { useState } from 'react';
import { useNotebookStore } from '../../store/notebookStore';
import { PageTemplate, PaperColor } from '../../types/notebook';
import { PAPER_COLORS } from '../../engine/paperTemplates';
import { X, Check } from 'lucide-react';

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
  const [activeCategory, setActiveCategory] = useState<
    'all' | 'classic' | 'stem' | 'plan' | 'creative'
  >('all');

  const filteredTemplates = TEMPLATES.filter(
    (t) => activeCategory === 'all' || t.category === activeCategory
  );

  if (!templateModalOpen) return null;

  const handleApply = () => {
    updateCurrentPageTemplate(selectedTemplate, selectedColor);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              Defter Şablonu ve Kağıt Seçimi
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Sayfa {activePageIndex + 1} için şablon ve kağıt rengini belirleyin.
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
