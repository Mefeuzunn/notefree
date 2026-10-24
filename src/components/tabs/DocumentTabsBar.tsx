import React from 'react';
import { useNotebookStore } from '../../store/notebookStore';
import {
  Plus,
  X,
  BookOpen,
  Lock,
  Columns2,
  Library,
} from 'lucide-react';

/**
 * FAZ K – Çoklu Belge Sekmeleri (GoodNotes Style Multi-Document Tabs Bar)
 * Displays all currently open notebooks as top tabs for instant document switching.
 */
export const DocumentTabsBar: React.FC = () => {
  const {
    notebooks,
    activeNotebookId,
    openNotebookIds,
    openNotebookTab,
    closeNotebookTab,
    setLibraryViewOpen,
    openDualNotebook,
    splitNotebook,
  } = useNotebookStore();

  // If no tabs or no active notebook, don't take vertical space
  if (!openNotebookIds || openNotebookIds.length === 0) {
    return null;
  }

  return (
    <div className="h-10 bg-[#090d16]/90 backdrop-blur-xl border-b border-white/10 px-3 flex items-center justify-between z-30 select-none overflow-hidden shrink-0">
      {/* Scrollable Tabs List */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-1 py-1">
        {openNotebookIds.map((nbId) => {
          const nb = notebooks.find((n) => n.id === nbId);
          if (!nb) return null;

          const isActive = nb.id === activeNotebookId;
          const isLocked = nb.isLocked || !!nb.pinCode;

          return (
            <div
              key={nb.id}
              onClick={() => openNotebookTab(nb.id)}
              className={`group relative flex items-center gap-2.5 h-8 px-3 rounded-xl text-xs cursor-pointer transition-all max-w-[220px] min-w-[95px] sm:min-w-[125px] shrink-0 border ${
                isActive
                  ? 'bg-slate-900/90 text-white border-white/15 shadow-md shadow-black/40 font-semibold ring-1 ring-indigo-500/30'
                  : 'bg-slate-950/40 text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 border-white/5'
              }`}
              title={nb.title}
            >
              {/* Color indicator dot */}
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm ring-1 ring-white/20"
                style={{ backgroundColor: nb.coverColor || '#6366f1' }}
              />

              {/* Title with Lock if protected */}
              <span className="truncate flex-1 text-[11px] tracking-tight">
                {nb.title || 'İsimsiz Defter'}
              </span>

              {isLocked && (
                <Lock size={11} className="text-amber-400 shrink-0" />
              )}

              {/* Close Tab Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  closeNotebookTab(nb.id);
                }}
                className={`p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors shrink-0 ${
                  isActive ? 'opacity-90 hover:opacity-100' : 'opacity-40 group-hover:opacity-100'
                }`}
                title="Sekmeyi Kapat"
              >
                <X size={12} />
              </button>
            </div>
          );
        })}

        {/* Plus Button to open library and choose/create notebook */}
        <button
          type="button"
          onClick={() => setLibraryViewOpen(true)}
          className="h-7 w-7 rounded-xl text-slate-400 hover:text-indigo-400 hover:bg-slate-900 border border-transparent hover:border-white/10 flex items-center justify-center transition-all shrink-0 ml-1 active:scale-95"
          title="Yeni Defter Aç veya Kütüphaneye Git"
        >
          <Plus size={15} />
        </button>
      </div>

      {/* Right Quick Controls */}
      <div className="flex items-center gap-2 pl-3 border-l border-white/10 shrink-0">
        {/* Quick Split Screen Toggle (if more than 1 notebook exists) */}
        {notebooks.length > 1 && !splitNotebook.isOpen && (
          <button
            type="button"
            onClick={() => {
              const secondary = notebooks.find((n) => n.id !== activeNotebookId);
              if (secondary) openDualNotebook(secondary.id);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold text-slate-400 hover:text-cyan-300 hover:bg-slate-900/80 border border-transparent hover:border-cyan-500/30 transition-all"
            title="İkili Defter Görünümü (Yan Yana Çalış)"
          >
            <Columns2 size={13} />
            <span className="hidden sm:inline">İkili Görünüm</span>
          </button>
        )}
      </div>
    </div>
  );
};
