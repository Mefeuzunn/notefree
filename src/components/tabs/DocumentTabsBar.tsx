import React from 'react';
import { useNotebookStore } from '../../store/notebookStore';
import {
  Plus,
  X,
  BookOpen,
  Lock,
  Columns2,
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
    <div className="h-9 bg-slate-950 border-b border-slate-800/80 px-2 flex items-center justify-between z-30 select-none overflow-hidden">
      {/* Scrollable Tabs List */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none flex-1 py-1">
        {openNotebookIds.map((nbId) => {
          const nb = notebooks.find((n) => n.id === nbId);
          if (!nb) return null;

          const isActive = nb.id === activeNotebookId;
          const isLocked = nb.isLocked || !!nb.pinCode;

          return (
            <div
              key={nb.id}
              onClick={() => openNotebookTab(nb.id)}
              className={`group relative flex items-center gap-2 h-7 px-2.5 sm:px-3 rounded-t-lg text-xs cursor-pointer transition-all max-w-[200px] min-w-[85px] sm:min-w-[110px] shrink-0 border-t-2 ${
                isActive
                  ? 'bg-slate-900 text-slate-100 border-t-indigo-500 border-x border-slate-800 shadow-sm font-medium'
                  : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border-t-transparent'
              }`}
              title={nb.title}
            >
              {/* Color indicator dot or book icon */}
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                style={{ backgroundColor: nb.coverColor || '#6366f1' }}
              />

              {/* Title with Lock if protected */}
              <span className="truncate flex-1 text-[11px]">
                {nb.title || 'İsimsiz Defter'}
              </span>

              {isLocked && (
                <Lock size={10} className="text-amber-400 shrink-0" />
              )}

              {/* Close Tab Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  closeNotebookTab(nb.id);
                }}
                className={`p-0.5 rounded-full text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors shrink-0 ${
                  isActive ? 'opacity-90 hover:opacity-100' : 'opacity-50 sm:opacity-0 sm:group-hover:opacity-100 hover:opacity-100'
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
          className="h-6 w-6 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-900 flex items-center justify-center transition-colors shrink-0 ml-0.5"
          title="Defter Aç / Kütüphaneye Git"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Right Quick Controls */}
      <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800/80 shrink-0">
        {/* Quick Split Screen Toggle (if more than 1 notebook exists) */}
        {notebooks.length > 1 && !splitNotebook.isOpen && (
          <button
            type="button"
            onClick={() => {
              const secondary = notebooks.find((n) => n.id !== activeNotebookId);
              if (secondary) openDualNotebook(secondary.id);
            }}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium text-slate-400 hover:text-cyan-300 hover:bg-slate-900 transition-colors"
            title="İkili Defter Görünümü (Yan Yana Çalış)"
          >
            <Columns2 size={12} />
            <span className="hidden sm:inline">İkili Görünüm</span>
          </button>
        )}
      </div>
    </div>
  );
};
