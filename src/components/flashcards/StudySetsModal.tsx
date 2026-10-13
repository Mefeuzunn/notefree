import React, { useState } from 'react';
import { useNotebookStore } from '../../store/notebookStore';
import { Flashcard } from '../../types/notebook';
import {
  Brain,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flame,
  Plus,
  RotateCw,
  Sparkles,
  Trash2,
  Trophy,
  X,
  Layers,
  BookOpen,
  Bandage,
} from 'lucide-react';

export const StudySetsModal: React.FC = () => {
  const {
    studySetsModalOpen,
    setStudySetsModalOpen,
    activeNotebookId,
    notebooks,
    addFlashcard,
    deleteFlashcard,
    rateFlashcard,
    generateFlashcardsFromTapes,
  } = useNotebookStore();

  const activeNotebook = notebooks.find((n) => n.id === activeNotebookId);
  const flashcards: Flashcard[] = activeNotebook?.flashcards || [];

  const [activeTab, setActiveTab] = useState<'study' | 'manage'>('study');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [sessionScores, setSessionScores] = useState<{ [id: string]: string }>({});

  // Form state for creating a new card
  const [frontText, setFrontText] = useState('');
  const [backText, setBackText] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; success: boolean } | null>(null);

  const handleGenerateFromTapes = () => {
    if (!activeNotebookId) return;
    const count = generateFlashcardsFromTapes(activeNotebookId);
    if (count > 0) {
      setFeedbackMsg({
        text: `${count} adet ezber bandı başarıyla çalışma kartına dönüştürüldü! 🎉`,
        success: true,
      });
      setActiveTab('study');
      restartSession();
    } else {
      setFeedbackMsg({
        text: 'Bu defterdeki sayfalarda henüz gizleme bandı bulunamadı. Bant (Tape) aracını kullanarak notlarınızın üzerini kapatın.',
        success: false,
      });
    }
    setTimeout(() => setFeedbackMsg(null), 4500);
  };

  if (!studySetsModalOpen) return null;

  const currentCard = flashcards[currentCardIndex];

  const handleRate = (rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (!currentCard) return;
    rateFlashcard(currentCard.id, rating);
    setSessionScores((prev) => ({ ...prev, [currentCard.id]: rating }));

    if (currentCardIndex + 1 < flashcards.length) {
      setIsFlipped(false);
      setCurrentCardIndex((prev) => prev + 1);
    } else {
      setSessionCompleted(true);
    }
  };

  const restartSession = () => {
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setSessionCompleted(false);
    setSessionScores({});
  };

  const handleCreateCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!frontText.trim() || !backText.trim()) return;
    addFlashcard(frontText.trim(), backText.trim());
    setFrontText('');
    setBackText('');
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <Brain size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100">Çalışma Kartları (Study Sets)</h3>
                <span className="text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  GoodNotes 6 Modu
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {activeNotebook?.title} • {flashcards.length} Kart
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-800/80 p-1 rounded-xl text-xs font-medium">
              <button
                onClick={() => {
                  setActiveTab('study');
                  restartSession();
                }}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === 'study'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Flame size={14} />
                <span>Çalış</span>
              </button>
              <button
                onClick={() => setActiveTab('manage')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === 'manage'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers size={14} />
                <span>Kartlarım ({flashcards.length})</span>
              </button>
            </div>

            <button
              onClick={() => setStudySetsModalOpen(false)}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors ml-2"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Feedback Alert Toast */}
        {feedbackMsg && (
          <div
            className={`px-6 py-2.5 text-xs font-medium flex items-center justify-between border-b animate-in fade-in duration-200 ${
              feedbackMsg.success
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
            }`}
          >
            <span>{feedbackMsg.text}</span>
            <button
              onClick={() => setFeedbackMsg(null)}
              className="p-1 hover:opacity-75 rounded"
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* Tab 1: Interactive Study Mode */}
        {activeTab === 'study' && (
          <div className="flex-1 p-6 flex flex-col items-center justify-center overflow-y-auto">
            {flashcards.length === 0 ? (
              <div className="text-center py-12 px-4 max-w-md mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-3">
                  <Brain size={28} />
                </div>
                <h4 className="text-sm font-semibold text-slate-200 mb-1">
                  Bu defterde henüz çalışma kartı yok
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mb-5">
                  Ders notlarınızdan aktif hatırlama (active recall) yapmak için kart ekleyin veya gizleme bantlarından otomatik üretin.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2.5">
                  <button
                    onClick={() => {
                      setActiveTab('manage');
                      setShowAddForm(true);
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus size={15} />
                    <span>İlk Kartı Ekle</span>
                  </button>
                  <button
                    onClick={handleGenerateFromTapes}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                    title="Sayfalardaki gizleme bantlarını tek tıkla çalışma kartlarına çevirir"
                  >
                    <Bandage size={15} />
                    <span>Bantlardan Kart Üret</span>
                  </button>
                </div>
              </div>
            ) : sessionCompleted ? (
              /* Session Congratulations Screen */
              <div className="text-center py-8 animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-400 to-emerald-400 flex items-center justify-center text-slate-950 mx-auto mb-4 shadow-xl shadow-amber-500/20">
                  <Trophy size={32} />
                </div>
                <h4 className="text-lg font-bold text-slate-100 mb-1">
                  Harika İş! Çalışma Tamamlandı 🎉
                </h4>
                <p className="text-xs text-slate-400 mb-6">
                  {flashcards.length} kartın tamamını başarıyla gözden geçirdiniz.
                </p>

                {/* Score Summary */}
                <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto mb-6">
                  <div className="bg-slate-800/60 border border-slate-700/60 p-3 rounded-2xl">
                    <span className="text-[10px] text-slate-400 block mb-0.5">Toplam Kart</span>
                    <span className="text-base font-bold text-white">{flashcards.length}</span>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-2xl">
                    <span className="text-[10px] text-emerald-400 block mb-0.5">Kolay / İyi</span>
                    <span className="text-base font-bold text-emerald-300">
                      {
                        Object.values(sessionScores).filter(
                          (s) => s === 'easy' || s === 'good'
                        ).length
                      }
                    </span>
                  </div>
                  <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-2xl">
                    <span className="text-[10px] text-rose-400 block mb-0.5">Tekrar Gereken</span>
                    <span className="text-base font-bold text-rose-300">
                      {Object.values(sessionScores).filter((s) => s === 'again').length}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 justify-center">
                  <button
                    onClick={restartSession}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <RotateCw size={14} />
                    <span>Tekrar Başlat</span>
                  </button>
                  <button
                    onClick={() => setStudySetsModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
                  >
                    Kapat
                  </button>
                </div>
              </div>
            ) : (
              /* Active Flashcard View */
              <div className="w-full flex flex-col items-center">
                {/* Progress Bar */}
                <div className="w-full max-w-md flex items-center justify-between text-xs text-slate-400 mb-3">
                  <span>
                    Kart {currentCardIndex + 1} / {flashcards.length}
                  </span>
                  <div className="w-40 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-amber-400 rounded-full transition-all duration-300"
                      style={{
                        width: `${((currentCardIndex + 1) / flashcards.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* 3D Flippable Card */}
                <div
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="w-full max-w-md h-72 rounded-3xl bg-slate-850 border border-slate-750 p-6 flex flex-col justify-between cursor-pointer hover:border-indigo-500/50 shadow-xl transition-all relative overflow-hidden group select-text"
                >
                  {/* Top Status */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 select-none">
                    <span className="font-semibold text-indigo-400 flex items-center gap-1">
                      <Sparkles size={13} />
                      {isFlipped ? 'Cevap (Arka Yüz)' : 'Soru (Ön Yüz)'}
                    </span>
                    <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                      Tıklayarak çevir 🔄
                    </span>
                  </div>

                  {/* Card Content */}
                  <div className="flex-1 flex items-center justify-center text-center p-4 overflow-y-auto">
                    <p className="text-base sm:text-lg font-medium text-slate-100 whitespace-pre-wrap leading-relaxed">
                      {isFlipped ? currentCard.backText : currentCard.frontText}
                    </p>
                  </div>

                  {/* Footer Hint */}
                  <div className="text-center text-[10px] text-slate-500 select-none border-t border-slate-800/80 pt-2">
                    {isFlipped ? 'Cevabınızı aşağıdan puanlayın' : 'Cevabı görmek için karta dokunun'}
                  </div>
                </div>

                {/* Rating Bar (shown when card is flipped) */}
                {isFlipped ? (
                  <div className="grid grid-cols-4 gap-2 w-full max-w-md mt-5 animate-in fade-in slide-in-from-bottom-2 duration-150">
                    <button
                      onClick={() => handleRate('again')}
                      className="p-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold transition-all text-center flex flex-col items-center gap-0.5"
                    >
                      <span>🔴 Tekrar</span>
                      <span className="text-[10px] text-rose-400/70 font-mono">&lt; 1 dk</span>
                    </button>

                    <button
                      onClick={() => handleRate('hard')}
                      className="p-2.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-xs font-semibold transition-all text-center flex flex-col items-center gap-0.5"
                    >
                      <span>🟠 Zor</span>
                      <span className="text-[10px] text-amber-400/70 font-mono">&lt; 10 dk</span>
                    </button>

                    <button
                      onClick={() => handleRate('good')}
                      className="p-2.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold transition-all text-center flex flex-col items-center gap-0.5"
                    >
                      <span>🟢 İyi</span>
                      <span className="text-[10px] text-emerald-400/70 font-mono">1 gün</span>
                    </button>

                    <button
                      onClick={() => handleRate('easy')}
                      className="p-2.5 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-xs font-semibold transition-all text-center flex flex-col items-center gap-0.5"
                    >
                      <span>🔵 Kolay</span>
                      <span className="text-[10px] text-blue-400/70 font-mono">4 gün</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsFlipped(true)}
                    className="mt-5 px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all flex items-center gap-2"
                  >
                    <RotateCw size={14} />
                    <span>Cevabı Göster</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Manage & Add Cards */}
        {activeTab === 'manage' && (
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Kayıtlı Çalışma Kartları ({flashcards.length})
              </h4>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleGenerateFromTapes}
                  className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
                  title="Tüm gizleme bantlarını tek tıkla çalışma kartına çevirir"
                >
                  <Bandage size={14} />
                  <span>Bantlardan Üret</span>
                </button>
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>{showAddForm ? 'İptal' : 'Yeni Kart Ekle'}</span>
                </button>
              </div>
            </div>

            {/* Create Card Form */}
            {showAddForm && (
              <form
                onSubmit={handleCreateCard}
                className="bg-slate-850 border border-slate-750 p-4 rounded-2xl space-y-3 animate-in fade-in"
              >
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Ön Yüz (Soru veya Kavram)
                  </label>
                  <textarea
                    rows={2}
                    value={frontText}
                    onChange={(e) => setFrontText(e.target.value)}
                    placeholder="Örn: Newton'un 2. Hareket Yasası nedir?"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Arka Yüz (Cevap veya Formül)
                  </label>
                  <textarea
                    rows={3}
                    value={backText}
                    onChange={(e) => setBackText(e.target.value)}
                    placeholder="Örn: F = m * a (Kuvvet = Kütle x İvme)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl"
                  >
                    Kartı Kaydet
                  </button>
                </div>
              </form>
            )}

            {/* Cards List */}
            <div className="space-y-2">
              {flashcards.map((card, idx) => (
                <div
                  key={card.id}
                  className="bg-slate-850/70 border border-slate-800 p-3.5 rounded-2xl flex items-start justify-between gap-3 group hover:border-slate-700 transition-colors"
                >
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                        #{idx + 1}
                      </span>
                      {card.difficulty && (
                        <span
                          className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${
                            card.difficulty === 'easy'
                              ? 'bg-blue-500/20 text-blue-300'
                              : card.difficulty === 'good'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : card.difficulty === 'hard'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {card.difficulty.toUpperCase()}
                        </span>
                      )}
                      {card.reviewCount > 0 && (
                        <span className="text-[10px] text-slate-500">
                          {card.reviewCount} kez çalışıldı
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-semibold text-slate-200 leading-snug">
                      ❓ {card.frontText}
                    </p>
                    <p className="text-[11px] text-slate-400 whitespace-pre-wrap leading-snug pl-4 border-l border-slate-700">
                      💡 {card.backText}
                    </p>
                  </div>

                  <button
                    onClick={() => deleteFlashcard(card.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors opacity-0 group-hover:opacity-100"
                    title="Kartı Sil"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
