import React, { useState } from 'react';
import { useNotebookStore } from '../../store/notebookStore';
import {
  GraduationCap,
  X,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Eye,
  EyeOff,
  LayoutTemplate,
  FileText,
  Lightbulb,
  HelpCircle,
  Clock,
  ArrowRight,
  Stamp,
} from 'lucide-react';

export const CornellAssistantModal: React.FC = () => {
  const {
    cornellAssistantModalOpen,
    setCornellAssistantModalOpen,
    cornellStudyMode,
    setCornellStudyMode,
    toggleCornellStudyMode,
    stampCornellBlocksToPage,
    updateCurrentPageTemplate,
    notebooks,
    activeNotebookId,
    activePageIndex,
  } = useNotebookStore();

  const currentNotebook = notebooks.find((n) => n.id === activeNotebookId);
  const currentPage = currentNotebook?.pages[activePageIndex];

  const [course, setCourse] = useState('');
  const [topic, setTopic] = useState('');
  const [date, setDate] = useState(() =>
    new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
  );
  const [customCues, setCustomCues] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [customSummary, setCustomSummary] = useState('');
  const [isStamping, setIsStamping] = useState(false);
  const [successToast, setSuccessToast] = useState(false);

  if (!cornellAssistantModalOpen) return null;

  const isCornellActive = currentPage?.template === 'cornell';

  const handleApplyCornellTemplate = async () => {
    if (!isCornellActive) {
      await updateCurrentPageTemplate('cornell', currentPage?.paperColor || 'white');
    }
  };

  const handleStampBlocks = async () => {
    setIsStamping(true);
    await stampCornellBlocksToPage(activePageIndex, {
      course: course.trim() || undefined,
      topic: topic.trim() || undefined,
      date: date.trim() || undefined,
      cues: customCues.trim() || undefined,
      notes: customNotes.trim() || undefined,
      summary: customSummary.trim() || undefined,
    });
    setIsStamping(false);
    setSuccessToast(true);
    setTimeout(() => {
      setSuccessToast(false);
      setCornellAssistantModalOpen(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <GraduationCap size={22} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                Cornell Not Alma & Aktif Hatırlama Stüdyosu
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Walter Pauk Metodu
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Sol sütun ipuçları, sağ sütun ders notları, alt blok 2-3 cümlelik sentez özeti.
              </p>
            </div>
          </div>
          <button
            onClick={() => setCornellAssistantModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status banner if page is not cornell */}
          {!isCornellActive && (
            <div className="p-3.5 rounded-xl border border-amber-500/40 bg-amber-500/10 flex items-center justify-between gap-3 text-amber-200 text-xs">
              <div className="flex items-center gap-2.5">
                <LayoutTemplate size={18} className="text-amber-400 shrink-0" />
                <span>
                  Mevcut sayfanız (<strong>{currentPage?.template}</strong>) Cornell kılavuzunda değil.
                </span>
              </div>
              <button
                type="button"
                onClick={handleApplyCornellTemplate}
                className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-semibold text-xs hover:bg-amber-400 transition-colors shrink-0 shadow-sm"
              >
                Cornell Şablonuna Çevir
              </button>
            </div>
          )}

          {/* Quick Active Recall Fold Control */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-indigo-400" />
                <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  Cornell Katlama & Ezberleme Modu (Active Recall)
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">
                {cornellStudyMode === 'none' && 'Kapalı'}
                {cornellStudyMode === 'hide-notes' && '🔒 Notlar Gizlendi (Ezber Testi)'}
                {cornellStudyMode === 'hide-cues' && '🔒 İpuçları Gizlendi (Soru Üretme)'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-3 leading-relaxed">
              Fiziksel Cornell defterinde kağıt ortadan ikiye katlanır. Sağ sütunu kapatarak yalnızca soldaki
              ipuçlarına bakıp zihninizden dersi tekrar edin veya tam tersini uygulayın.
            </p>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setCornellStudyMode('none')}
                className={`py-2 px-3 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition-all ${
                  cornellStudyMode === 'none'
                    ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300 shadow-sm'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye size={14} />
                <span>Tümü Görünür</span>
              </button>
              <button
                type="button"
                onClick={() => setCornellStudyMode('hide-notes')}
                className={`py-2 px-3 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition-all ${
                  cornellStudyMode === 'hide-notes'
                    ? 'border-amber-500 bg-amber-500/20 text-amber-300 shadow-sm'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                <EyeOff size={14} />
                <span>Notları Gizle</span>
              </button>
              <button
                type="button"
                onClick={() => setCornellStudyMode('hide-cues')}
                className={`py-2 px-3 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition-all ${
                  cornellStudyMode === 'hide-cues'
                    ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300 shadow-sm'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                <EyeOff size={14} />
                <span>İpuçlarını Gizle</span>
              </button>
            </div>
          </div>

          {/* Form to stamp structured boxes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Stamp size={15} className="text-amber-400" />
                Cornell Bloklarını Otomatik Sayfaya Damgala
              </h3>
              <span className="text-[11px] text-slate-500">4 Bölgeye Düzenlenebilir Metin Kutuları</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1.5">
                  Ders / Konu Alanı
                </label>
                <input
                  type="text"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  placeholder="Örn: Biyoloji, Analiz II, Tarih"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1.5">
                  Günün Konu Başlığı
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Örn: Hücre Bölünmesi, Türev"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1.5">Tarih</label>
                <input
                  type="text"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Optional Custom Cue and Summary seeds */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1.5 flex items-center gap-1.5">
                  <Lightbulb size={13} className="text-amber-400" />
                  İpucu & Sınav Soruları (Sol Sütun)
                </label>
                <textarea
                  rows={3}
                  value={customCues}
                  onChange={(e) => setCustomCues(e.target.value)}
                  placeholder="Varsayılan: Temel kavramlar ve sınav soru taslakları..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none font-sans"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1.5 flex items-center gap-1.5">
                  <FileText size={13} className="text-emerald-400" />
                  Sentez Özeti (Alt Blok - 2-3 Cümle)
                </label>
                <textarea
                  rows={3}
                  value={customSummary}
                  onChange={(e) => setCustomSummary(e.target.value)}
                  placeholder="Varsayılan: Sayfanın ana fikri ve can alıcı sonucu..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none font-sans"
                />
              </div>
            </div>
          </div>

          {/* Cornell Method 5-R Educational Guide */}
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4">
            <h4 className="text-xs font-semibold text-slate-300 mb-2.5 flex items-center gap-2">
              <Sparkles size={14} className="text-amber-400" />
              Cornell 5-R Altın Kuralı (GoodNotes & Walter Pauk)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-[11px]">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="font-bold text-indigo-400 block mb-0.5">1. Record</span>
                <span className="text-slate-400">Ders sırasında sağ sütuna notları yazın.</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="font-bold text-amber-400 block mb-0.5">2. Question</span>
                <span className="text-slate-400">Dersten hemen sonra sol sütuna sorular üretin.</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="font-bold text-rose-400 block mb-0.5">3. Recite</span>
                <span className="text-slate-400">Notları kapatıp sorulara bakarak tekrarlayın.</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="font-bold text-emerald-400 block mb-0.5">4. Reflect</span>
                <span className="text-slate-400">Alt bloğa 2-3 cümlelik özeti sentezleyin.</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="font-bold text-cyan-400 block mb-0.5">5. Review</span>
                <span className="text-slate-400">Haftalık 10 dakika hızlı gözden geçirin.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-950/80 border-t border-slate-800">
          <div className="text-xs text-slate-400">
            {successToast && (
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 size={16} />
                Cornell Blokları Başarıyla Sayfaya Eklendi!
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setCornellAssistantModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              Kapat
            </button>
            <button
              type="button"
              disabled={isStamping}
              onClick={handleStampBlocks}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Stamp size={14} />
              <span>Sayfaya Cornell Bloklarını Damgala</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
