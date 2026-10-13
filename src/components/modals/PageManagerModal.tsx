import React from 'react';
import { useNotebookStore } from '../../store/notebookStore';
import { Page } from '../../types/notebook';
import {
  X,
  Plus,
  Copy,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Grid,
  FilePlus,
  Check,
} from 'lucide-react';

interface PageManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PageManagerModal: React.FC<PageManagerModalProps> = ({ isOpen, onClose }) => {
  const {
    activeNotebookId,
    notebooks,
    activePageIndex,
    setActivePageIndex,
    addPage,
    removeCurrentPage,
  } = useNotebookStore();

  const activeNotebook = notebooks.find((n) => n.id === activeNotebookId);
  const pages = activeNotebook?.pages || [];

  if (!isOpen) return null;

  const handleDuplicatePage = async (index: number) => {
    const pageToClone = pages[index];
    if (!pageToClone) return;
    await addPage(pageToClone.template, pageToClone.paperColor);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex flex-col select-none animate-in fade-in duration-200">
      {/* Header */}
      <div className="h-14 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Grid size={18} className="text-indigo-400" />
          <h2 className="text-sm font-bold text-slate-100">
            Sayfa Düzenleyici ({pages.length} Sayfa)
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => addPage()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow transition-colors"
          >
            <Plus size={14} />
            <span>Sayfa Ekle</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Pages Grid */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-10">
        <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {pages.map((pg, idx) => {
            const isSelected = idx === activePageIndex;
            return (
              <div
                key={pg.id}
                onClick={() => {
                  setActivePageIndex(idx);
                  onClose();
                }}
                className={`group relative flex flex-col items-center p-3 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/30 shadow-xl scale-[1.02]'
                    : 'border-slate-800 bg-slate-850/60 hover:border-slate-700 hover:bg-slate-800'
                }`}
              >
                {/* Active Badge */}
                {isSelected && (
                  <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shadow-md z-10">
                    <Check size={11} />
                  </span>
                )}

                {/* Simulated Thumbnail Paper */}
                <div
                  className="w-full aspect-[1/1.38] rounded-xl border border-slate-700/60 shadow-md mb-2 flex flex-col items-center justify-center p-2 text-center text-[10px] overflow-hidden"
                  style={{
                    backgroundColor:
                      pg.paperColor === 'dark'
                        ? '#181b26'
                        : pg.paperColor === 'cream'
                        ? '#fcfaf2'
                        : pg.paperColor === 'yellow-pad'
                        ? '#fefce8'
                        : pg.paperColor === 'kraft'
                        ? '#e7d8be'
                        : '#ffffff',
                  }}
                >
                  {pg.backgroundImageUrl ? (
                    <span className="text-[10px] font-bold text-slate-700 bg-white/80 px-2 py-0.5 rounded shadow-sm">
                      📄 Doküman
                    </span>
                  ) : pg.strokes.length > 0 ? (
                    <span className="text-[10px] font-bold text-indigo-600 bg-white/90 px-2 py-0.5 rounded shadow-sm">
                      ✍️ {pg.strokes.length} çizgi
                    </span>
                  ) : (
                    <span className="text-slate-400 font-mono capitalize">{pg.template}</span>
                  )}
                </div>

                {/* Page Info & Actions Row */}
                <div className="w-full flex items-center justify-between text-xs px-1">
                  <span className="font-semibold text-slate-200">Sayfa {idx + 1}</span>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicatePage(idx);
                      }}
                      className="p-1 text-slate-400 hover:text-indigo-400 rounded hover:bg-slate-700"
                      title="Sayfayı Çoğalt"
                    >
                      <Copy size={12} />
                    </button>

                    {pages.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Sayfa ${idx + 1}'i silmek istediğinize emin misiniz?`)) {
                            setActivePageIndex(idx);
                            removeCurrentPage();
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-700"
                        title="Sayfayı Sil"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
