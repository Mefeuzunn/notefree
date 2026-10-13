import React, { useState } from 'react';
import { useNotebookStore } from '../../store/notebookStore';
import {
  Book,
  Plus,
  Trash2,
  FileText,
  X,
  Layers,
  ChevronRight,
  BookOpen,
  Calendar,
  Sparkles,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    sidebarOpen,
    setSidebarOpen,
    notebooks,
    activeNotebookId,
    setActiveNotebook,
    deleteNotebook,
    setNewNotebookModalOpen,
    activePageIndex,
    setActivePageIndex,
    addPage,
    removeCurrentPage,
  } = useNotebookStore();

  const [activeTab, setActiveTab] = useState<'notebooks' | 'pages'>('notebooks');

  const activeNotebook = notebooks.find((n) => n.id === activeNotebookId);

  if (!sidebarOpen) return null;

  return (
    <aside className="fixed inset-y-0 left-0 w-80 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800 z-40 flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
            <BookOpen size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 tracking-tight">NotFree</h2>
            <p className="text-[10px] text-indigo-400 font-medium">Dijital Not Defteri</p>
          </div>
        </div>

        <button
          onClick={() => setSidebarOpen(false)}
          className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 px-3 pt-2 gap-2">
        <button
          onClick={() => setActiveTab('notebooks')}
          className={`flex-1 pb-2.5 text-xs font-semibold border-b-2 transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'notebooks'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          <Book size={14} />
          <span>Defterler ({notebooks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pages')}
          className={`flex-1 pb-2.5 text-xs font-semibold border-b-2 transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'pages'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          <Layers size={14} />
          <span>Sayfalar ({activeNotebook?.pages.length || 0})</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {activeTab === 'notebooks' ? (
          <>
            {/* Create Notebook Button */}
            <button
              onClick={() => setNewNotebookModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/10 text-xs font-semibold transition-all mb-3"
            >
              <Plus size={15} />
              <span>Yeni Defter Oluştur</span>
            </button>

            {/* Notebooks List */}
            {notebooks.map((nb) => {
              const isActive = nb.id === activeNotebookId;
              return (
                <div
                  key={nb.id}
                  onClick={() => setActiveNotebook(nb.id)}
                  className={`group flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    isActive
                      ? 'bg-indigo-600/15 border-indigo-500/50 text-white shadow-md ring-1 ring-indigo-500/20'
                      : 'bg-slate-850/60 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span
                      className="w-4 h-9 rounded-md shrink-0 shadow-sm"
                      style={{ backgroundColor: nb.coverColor }}
                    />
                    <div className="truncate">
                      <h4 className="text-xs font-semibold truncate group-hover:text-indigo-300 transition-colors">
                        {nb.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {nb.pages.length} sayfa
                        {nb.youtubeBookmarks && nb.youtubeBookmarks.length > 0
                          ? ` • ⏱️ ${nb.youtubeBookmarks.length} video notu`
                          : ''}
                      </p>
                    </div>
                  </div>

                  {notebooks.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`"${nb.title}" defterini silmek istediğinize emin misiniz?`)) {
                          deleteNotebook(nb.id);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-700/50 transition-all"
                      title="Defteri Sil"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              );
            })}
          </>
        ) : (
          <>
            {/* Pages Action Row */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => addPage()}
                className="flex-1 flex items-center justify-center gap-1.5 p-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-colors"
              >
                <Plus size={14} />
                <span>Sayfa Ekle</span>
              </button>

              {activeNotebook && activeNotebook.pages.length > 1 && (
                <button
                  onClick={() => {
                    if (confirm('Bu sayfayı silmek istediğinize emin misiniz?')) {
                      removeCurrentPage();
                    }
                  }}
                  className="p-2 rounded-xl bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 text-xs font-medium transition-colors"
                  title="Aktif Sayfayı Sil"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            {/* Page Thumbnails List */}
            <div className="grid grid-cols-2 gap-2.5">
              {activeNotebook?.pages.map((pg, idx) => {
                const isCurrent = idx === activePageIndex;
                return (
                  <div
                    key={pg.id}
                    onClick={() => setActivePageIndex(idx)}
                    className={`p-2 rounded-xl border cursor-pointer transition-all flex flex-col items-center ${
                      isCurrent
                        ? 'border-indigo-500 bg-indigo-500/15 ring-2 ring-indigo-500/30 shadow-md'
                        : 'border-slate-800 bg-slate-850 hover:border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    {/* Simulated Page Thumbnail Box */}
                    <div
                      className="w-full aspect-[1/1.3] rounded border border-slate-700/60 shadow-sm mb-1.5 flex flex-col items-center justify-center p-2 text-center text-[10px] text-slate-500 overflow-hidden"
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
                      {pg.strokes.length > 0 ? (
                        <span className="text-[10px] text-indigo-600 font-medium">
                          ✍️ {pg.strokes.length} çizgi
                        </span>
                      ) : (
                        <span className="opacity-40">{pg.template}</span>
                      )}
                    </div>
                    <span className="text-[11px] font-semibold text-slate-300">
                      Sayfa {idx + 1}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </aside>
  );
};
