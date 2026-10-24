import React, { useState } from 'react';
import { useNotebookStore } from '../../store/notebookStore';
import { PageTemplate, PaperColor } from '../../types/notebook';
import { X, Book, Plus, Sparkles, Check, FileText } from 'lucide-react';

const COVER_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#0f172a', // Dark Slate
  '#0d9488', // Teal
];

const PAPER_COLORS_LIST: Array<{ id: PaperColor; name: string; bg: string }> = [
  { id: 'white', name: 'Beyaz', bg: '#ffffff' },
  { id: 'cream', name: 'Doğal Krem', bg: '#faf7ee' },
  { id: 'yellow-pad', name: 'Sarı Notluk', bg: '#fefce8' },
  { id: 'sage', name: 'Adaçayı Yeşili', bg: '#f2f5f0' },
  { id: 'kraft', name: 'Kraft', bg: '#e7d8be' },
  { id: 'dark', name: 'Koyu', bg: '#141923' },
];

export const NewNotebookModal: React.FC = () => {
  const {
    newNotebookModalOpen,
    setNewNotebookModalOpen,
    createNotebook,
    customTemplates,
  } = useNotebookStore();

  const [title, setTitle] = useState('');
  const [coverColor, setCoverColor] = useState('#3b82f6');
  const [paperColor, setPaperColor] = useState<PaperColor>('white');
  const [templateTab, setTemplateTab] = useState<'builtin' | 'custom'>('builtin');
  const [template, setTemplate] = useState<PageTemplate>('lined');
  const [selectedCustomTemplateId, setSelectedCustomTemplateId] = useState<string | null>(null);

  if (!newNotebookModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (templateTab === 'custom' && selectedCustomTemplateId) {
      await createNotebook(
        title.trim(),
        coverColor,
        'blank',
        'classic',
        paperColor,
        selectedCustomTemplateId
      );
    } else {
      await createNotebook(
        title.trim(),
        coverColor,
        template,
        'classic',
        paperColor
      );
    }

    setTitle('');
    setSelectedCustomTemplateId(null);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[70] p-4 animate-in fade-in duration-200">
      <div className="bg-[#090d16] border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ring-1 ring-white/10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-white/10 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg transition-colors ring-1 ring-white/20"
              style={{ backgroundColor: coverColor }}
            >
              <Book size={18} />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-white tracking-tight">Yeni Defter Oluştur</h2>
              <p className="text-xs text-slate-400">Şablon, kapak ve kağıt rengini belirleyin.</p>
            </div>
          </div>
          <button
            onClick={() => setNewNotebookModalOpen(false)}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-850 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Notebook Title */}
          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
              Defter Adı
            </label>
            <input
              type="text"
              autoFocus
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn: Fizik 101, Biyoloji Ders Notları, Günlük, Proje Taslağı..."
              className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>

          {/* Cover Color */}
          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
              Kapak Rengi
            </label>
            <div className="grid grid-cols-8 gap-2">
              {COVER_COLORS.map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setCoverColor(col)}
                  className={`w-8 h-8 rounded-full transition-transform hover:scale-110 shadow-sm flex items-center justify-center ${
                    coverColor === col ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-950 scale-105' : 'ring-1 ring-white/10'
                  }`}
                  style={{ backgroundColor: col }}
                >
                  {coverColor === col && <Check size={12} className="text-white drop-shadow" />}
                </button>
              ))}
            </div>
          </div>

          {/* Paper Color */}
          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
              Kağıt Rengi & Dokusu
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              {PAPER_COLORS_LIST.map((col) => (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => setPaperColor(col.id)}
                  className={`py-2 px-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    paperColor === col.id
                      ? 'border-indigo-500 bg-indigo-500/15 ring-2 ring-indigo-500/30'
                      : 'border-white/10 bg-slate-900/60 hover:bg-slate-800'
                  }`}
                >
                  <span
                    className="w-6 h-6 rounded-full border border-slate-600 shadow-sm flex items-center justify-center"
                    style={{ backgroundColor: col.bg }}
                  >
                    {paperColor === col.id && (
                      <Check size={11} className={col.id === 'white' ? 'text-slate-900' : 'text-slate-700'} />
                    )}
                  </span>
                  <span className="text-[10px] font-medium text-slate-300">{col.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Template Selection Tabs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Başlangıç Şablonu
              </label>
              <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => setTemplateTab('builtin')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    templateTab === 'builtin'
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Yerleşik Kılavuzlar
                </button>
                <button
                  type="button"
                  onClick={() => setTemplateTab('custom')}
                  className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                    templateTab === 'custom'
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles size={11} className="text-amber-400" />
                  <span>Özel PDF / Şablonlarım ({customTemplates.length})</span>
                </button>
              </div>
            </div>

            {templateTab === 'builtin' ? (
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value as PageTemplate)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="lined">📝 Çizgili Notluk (Klasik)</option>
                <option value="lined-margin">📖 Çizgili & Sol Kenar Çizgili</option>
                <option value="grid-5mm">📐 Kareli Kağıt (5mm)</option>
                <option value="dots">⁖ Noktalı (Bullet Journal)</option>
                <option value="cornell">🎓 Cornell Not Alma Metodu (Walter Pauk)</option>
                <option value="planner-weekly">📅 Haftalık Ajanda / Zaman Blokları</option>
                <option value="planner-daily">⏱️ Günlük Saatlik Planlayıcı</option>
                <option value="planner-habit">🎯 Alışkanlık & Hedef Takibi</option>
                <option value="isometric-3d">🎲 İzometrik 3D Çizim (CAD)</option>
                <option value="isometric-dots">⁖ İzometrik 3D Noktalı</option>
                <option value="polar-coordinate">🎯 Polar Radyal Koordinat</option>
                <option value="engineering-1mm">📐 Milimetrik Pafta (1mm CAD)</option>
                <option value="logarithmic-grid">📈 Yarı-Logaritmik (Semi-Log)</option>
                <option value="music">🎵 Müzik Portesi (Dizek)</option>
                <option value="blank">📄 Düz Beyaz (Serbest Tuval)</option>
              </select>
            ) : (
              <div>
                {customTemplates.length === 0 ? (
                  <div className="p-4 rounded-xl border border-white/10 bg-slate-900/60 text-center text-xs text-slate-500">
                    <FileText size={20} className="mx-auto mb-1 text-slate-600" />
                    <p>Henüz kayıtlı özel şablonunuz bulunmuyor.</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Defter açtıktan sonra Şablon menüsünden çok sayfalı PDF planlayıcı yükleyebilirsiniz.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                    {customTemplates.map((ct) => (
                      <div
                        key={ct.id}
                        onClick={() => setSelectedCustomTemplateId(ct.id)}
                        className={`p-2 rounded-xl border cursor-pointer flex items-center gap-2.5 transition-all ${
                          selectedCustomTemplateId === ct.id
                            ? 'border-indigo-500 bg-indigo-500/15 ring-1 ring-indigo-500'
                            : 'border-white/10 bg-slate-900/50 hover:bg-slate-800'
                        }`}
                      >
                        <div className="w-8 h-10 rounded bg-white overflow-hidden border border-slate-700 shrink-0">
                          <img src={ct.dataUrl} alt={ct.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="truncate">
                          <span className="text-xs font-semibold text-slate-200 truncate block">
                            {ct.name}
                          </span>
                          <span className="text-[10px] text-slate-500 block truncate">
                            {ct.sourceFileName || 'Özel Şablon'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 flex justify-end gap-2.5 border-t border-white/10">
            <button
              type="button"
              onClick={() => setNewNotebookModalOpen(false)}
              className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 border border-indigo-400/30 active:scale-95"
            >
              <Plus size={15} />
              <span>Defteri Başlat</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
