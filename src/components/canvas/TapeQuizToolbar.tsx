import React, { useState } from 'react';
import { useNotebookStore } from '../../store/notebookStore';
import {
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  HelpCircle,
  XCircle,
  X,
  Brain,
  Sparkles,
  RotateCcw,
} from 'lucide-react';

export const TapeQuizToolbar: React.FC = () => {
  const {
    notebooks,
    activeNotebookId,
    activePageIndex,
    tapeQuizMode,
    tapeQuizActiveIndex,
    setTapeQuizMode,
    revealAllTapes,
    hideAllTapes,
    nextTapeQuizItem,
    prevTapeQuizItem,
    toggleTapeReveal,
  } = useNotebookStore();

  const [score, setScore] = useState<{ good: number; hard: number; again: number }>({
    good: 0,
    hard: 0,
    again: 0,
  });

  if (!tapeQuizMode) return null;

  const activeNotebook = notebooks.find((n) => n.id === activeNotebookId);
  const currentPage = activeNotebook?.pages[activePageIndex];
  const tapes = currentPage?.tapes || [];

  if (tapes.length === 0) {
    return (
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl px-5 py-3 shadow-2xl flex items-center gap-3">
        <Brain size={18} className="text-amber-400" />
        <span className="text-xs text-slate-200">
          Bu sayfada henüz ezber bandı bulunmuyor. Ezber kalemiyle metinleri bantlayın!
        </span>
        <button
          onClick={() => setTapeQuizMode(false)}
          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
        >
          <X size={15} />
        </button>
      </div>
    );
  }

  const activeTape = tapes[tapeQuizActiveIndex] || tapes[0];
  const isRevealed = activeTape?.isRevealed;

  const handleRate = (rating: 'good' | 'hard' | 'again') => {
    setScore((prev) => ({
      ...prev,
      [rating]: prev[rating] + 1,
    }));
    nextTapeQuizItem();
  };

  const handleResetQuiz = () => {
    setScore({ good: 0, hard: 0, again: 0 });
    hideAllTapes(activePageIndex);
  };

  const totalAnswered = score.good + score.hard + score.again;
  const accuracy = totalAnswered > 0 ? Math.round((score.good / totalAnswered) * 100) : 0;

  return (
    <div className="fixed top-18 left-1/2 -translate-x-1/2 z-40 flex items-center bg-slate-900/95 backdrop-blur-xl border border-indigo-500/40 rounded-2xl p-2 shadow-2xl shadow-indigo-950/40 gap-2 sm:gap-3 animate-in fade-in slide-in-from-top-4 duration-250 select-none max-w-[95vw] overflow-x-auto">
      {/* Title & Counter */}
      <div className="flex items-center gap-2 pl-2 pr-1 border-r border-slate-800 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
          <Brain size={16} />
        </div>
        <div>
          <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
            Ezber Sınavı
            <span className="text-[10px] px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 font-mono rounded-md border border-indigo-500/30">
              {tapeQuizActiveIndex + 1} / {tapes.length}
            </span>
          </h3>
          {totalAnswered > 0 && (
            <span className="text-[10px] text-slate-400 font-mono">
              Başarı: %{accuracy} ({score.good}/{totalAnswered})
            </span>
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={prevTapeQuizItem}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          title="Önceki Bant"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Current Tape Reveal / Hide Toggle */}
        <button
          onClick={() => toggleTapeReveal(activePageIndex, activeTape.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-sm ${
            isRevealed
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
          }`}
          title="Seçili bandı aç veya gizle"
        >
          {isRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
          <span>{isRevealed ? 'Cevabı Gizle' : 'Cevabı Gör'}</span>
        </button>

        <button
          onClick={nextTapeQuizItem}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          title="Sonraki Bant"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Self-Rating Feedback Buttons (Active Recall) */}
      <div className="flex items-center gap-1 pl-1 pr-1 border-l border-slate-800 shrink-0">
        <button
          onClick={() => handleRate('again')}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-medium transition-colors"
          title="Unuttum, tekrar et"
        >
          <XCircle size={13} className="text-rose-400" />
          <span>Unuttum</span>
        </button>

        <button
          onClick={() => handleRate('hard')}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-medium transition-colors"
          title="Zorlandım"
        >
          <HelpCircle size={13} className="text-amber-400" />
          <span>Zorlandım</span>
        </button>

        <button
          onClick={() => handleRate('good')}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold transition-colors"
          title="Biliyordum"
        >
          <CheckCircle size={13} className="text-emerald-400" />
          <span>Biliyordum</span>
        </button>
      </div>

      {/* Master Actions: Reveal All / Hide All */}
      <div className="flex items-center gap-1 pl-1 border-l border-slate-800 shrink-0">
        <button
          onClick={() => hideAllTapes(activePageIndex)}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          title="Tüm Bantları Gizle"
        >
          <EyeOff size={15} />
        </button>

        <button
          onClick={() => revealAllTapes(activePageIndex)}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          title="Tüm Bantları Aç"
        >
          <Eye size={15} />
        </button>

        <button
          onClick={handleResetQuiz}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          title="Testi Baştan Başlat"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {/* Exit Button */}
      <button
        onClick={() => setTapeQuizMode(false)}
        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors ml-1 shrink-0"
        title="Ezber Sınav Modundan Çık"
      >
        <X size={16} />
      </button>
    </div>
  );
};
