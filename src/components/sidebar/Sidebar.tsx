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
  Star,
  ListTree,
  Search,
  Edit2,
  Check,
  Lock,
  KeyRound,
} from 'lucide-react';
import { NotebookLockModal } from '../modals/NotebookLockModal';

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
    togglePageBookmark,
    setPageTitle,
    addOutlineItem,
    deleteOutlineItem,
    isNotebookSessionUnlocked,
  } = useNotebookStore();

  const [activeTab, setActiveTab] = useState<'notebooks' | 'pages' | 'bookmarks' | 'outline'>('notebooks');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTitlePageIndex, setEditingTitlePageIndex] = useState<number | null>(null);
  const [tempTitle, setTempTitle] = useState('');
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [lockModalState, setLockModalState] = useState<{
    isOpen: boolean;
    notebookId: string | null;
    mode: 'unlock' | 'set-pin' | 'remove-pin';
  }>({
    isOpen: false,
    notebookId: null,
    mode: 'unlock',
  });

  const activeNotebook = notebooks.find((n) => n.id === activeNotebookId);

  if (!sidebarOpen) return null;

  const bookmarkedPages = (activeNotebook?.pages || [])
    .map((pg, idx) => ({ ...pg, index: idx }))
    .filter((pg) => pg.isBookmarked);

  const filteredPages = (activeNotebook?.pages || [])
    .map((pg, idx) => ({ ...pg, index: idx }))
    .filter((pg) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchTitle = (pg.title || '').toLowerCase().includes(q);
      const matchTexts = (pg.texts || []).some((t) => t.text.toLowerCase().includes(q));
      return matchTitle || matchTexts;
    });

  return (
    <>
      {/* Mobile & iPad Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-35 transition-opacity"
        onClick={() => setSidebarOpen(false)}
      />

      <aside className="fixed inset-y-0 left-0 w-84 sm:w-96 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800 z-40 flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
            <BookOpen size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 tracking-tight">NotFree</h2>
            <p className="text-[10px] text-indigo-400 font-medium">Navigasyon & İçerik</p>
          </div>
        </div>

        <button
          onClick={() => setSidebarOpen(false)}
          className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Navigation Tabs (GoodNotes / Notability 4-way Drawer) */}
      <div className="grid grid-cols-4 border-b border-slate-800 px-2 pt-2 text-[11px] font-semibold text-center">
        <button
          onClick={() => setActiveTab('notebooks')}
          className={`pb-2.5 border-b-2 transition-all flex flex-col items-center gap-1 ${
            activeTab === 'notebooks'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          <Book size={14} />
          <span>Defterler</span>
        </button>

        <button
          onClick={() => setActiveTab('pages')}
          className={`pb-2.5 border-b-2 transition-all flex flex-col items-center gap-1 ${
            activeTab === 'pages'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          <Layers size={14} />
          <span>Sayfalar</span>
        </button>

        <button
          onClick={() => setActiveTab('bookmarks')}
          className={`pb-2.5 border-b-2 transition-all flex flex-col items-center gap-1 ${
            activeTab === 'bookmarks'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          <Star size={14} className={bookmarkedPages.length > 0 ? 'text-amber-400 fill-amber-400' : ''} />
          <span>Yer İmleri</span>
        </button>

        <button
          onClick={() => setActiveTab('outline')}
          className={`pb-2.5 border-b-2 transition-all flex flex-col items-center gap-1 ${
            activeTab === 'outline'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          <ListTree size={14} />
          <span>İçindekiler</span>
        </button>
      </div>

      {/* Search Input for Pages/Bookmarks */}
      {activeTab !== 'notebooks' && (
        <div className="p-3 border-b border-slate-800/80">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Başlık veya metin notu ara..."
              className="w-full bg-slate-800/60 border border-slate-750 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {/* 1. Notebooks Tab */}
        {activeTab === 'notebooks' && (
          <>
            <button
              onClick={() => setNewNotebookModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/10 text-xs font-semibold transition-all mb-3"
            >
              <Plus size={15} />
              <span>Yeni Defter Oluştur</span>
            </button>

            {notebooks.map((nb) => {
              const isActive = nb.id === activeNotebookId;
              return (
                <div
                  key={nb.id}
                  onClick={() => {
                    if (nb.isLocked && !isNotebookSessionUnlocked(nb.id)) {
                      setLockModalState({
                        isOpen: true,
                        notebookId: nb.id,
                        mode: 'unlock',
                      });
                      return;
                    }
                    setActiveNotebook(nb.id);
                  }}
                  className={`group flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    isActive
                      ? 'bg-indigo-600/15 border-indigo-500/50 text-white shadow-md ring-1 ring-indigo-500/20'
                      : 'bg-slate-850/60 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span
                      className="w-4 h-9 rounded-md shrink-0 shadow-sm flex items-center justify-center text-white"
                      style={{ backgroundColor: nb.coverColor }}
                    >
                      {nb.isLocked && <Lock size={9} />}
                    </span>
                    <div className="truncate">
                      <h4 className="text-xs font-semibold truncate group-hover:text-indigo-300 transition-colors flex items-center gap-1">
                        <span>{nb.title}</span>
                        {nb.isLocked && <span className="text-[10px] text-amber-400">🔒</span>}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {nb.pages.length} sayfa
                        {nb.flashcards && nb.flashcards.length > 0
                          ? ` • 🧠 ${nb.flashcards.length} kart`
                          : ''}
                        {nb.youtubeBookmarks && nb.youtubeBookmarks.length > 0
                          ? ` • ⏱️ ${nb.youtubeBookmarks.length} video`
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
        )}

        {/* 2. Pages Thumbnails Tab */}
        {activeTab === 'pages' && (
          <>
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

            <div className="grid grid-cols-2 gap-2.5">
              {filteredPages.map((pg) => {
                const isCurrent = pg.index === activePageIndex;
                return (
                  <div
                    key={pg.id}
                    onClick={() => setActivePageIndex(pg.index)}
                    className={`p-2 rounded-xl border cursor-pointer transition-all flex flex-col items-center relative group ${
                      isCurrent
                        ? 'border-indigo-500 bg-indigo-500/15 ring-2 ring-indigo-500/30 shadow-md'
                        : 'border-slate-800 bg-slate-850 hover:border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    {/* Bookmark Star Toggle Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePageBookmark(pg.index);
                      }}
                      className={`absolute top-3 right-3 z-10 p-1 rounded-full backdrop-blur-sm transition-all ${
                        pg.isBookmarked
                          ? 'text-amber-400 fill-amber-400 bg-slate-900/80 shadow'
                          : 'text-slate-400 hover:text-amber-300 bg-slate-900/50 opacity-0 group-hover:opacity-100'
                      }`}
                      title={pg.isBookmarked ? 'Yer İmini Kaldır' : 'Yer İmlerine Ekle'}
                    >
                      <Star size={13} className={pg.isBookmarked ? 'fill-amber-400' : ''} />
                    </button>

                    {/* Page Thumbnail */}
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
                    <span className="text-[11px] font-semibold text-slate-300 truncate max-w-full">
                      {pg.title || `Sayfa ${pg.index + 1}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* 3. Bookmarks Tab */}
        {activeTab === 'bookmarks' && (
          <div className="space-y-2">
            {bookmarkedPages.length === 0 ? (
              <div className="text-center py-10 px-3 text-slate-400">
                <Star size={24} className="mx-auto mb-2 opacity-30 text-amber-400" />
                <p className="text-xs font-medium text-slate-300 mb-1">Henüz yer imi yok</p>
                <p className="text-[11px] text-slate-500">
                  Önemli sayfaları kaydetmek için sayfa üzerindeki ⭐ yıldız ikonuna tıklayın.
                </p>
              </div>
            ) : (
              bookmarkedPages.map((pg) => (
                <div
                  key={pg.id}
                  onClick={() => setActivePageIndex(pg.index)}
                  className="p-3 rounded-xl bg-slate-850/80 border border-slate-750 hover:border-amber-500/50 cursor-pointer flex items-center justify-between group transition-all"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <Star size={16} className="text-amber-400 fill-amber-400 shrink-0" />
                    <div className="truncate">
                      <h4 className="text-xs font-semibold text-slate-200 truncate">
                        {pg.title || `Sayfa ${pg.index + 1}`}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Sayfa #{pg.index + 1} • {pg.strokes.length} çizim
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePageBookmark(pg.index);
                    }}
                    className="p-1 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-700/50 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Yer iminden çıkar"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* 4. Outline (Table of Contents) Tab */}
        {activeTab === 'outline' && (
          <div className="space-y-3">
            {/* 4.1 PDF Hierarchical Outline / Bookmarks Tree (if present) */}
            {activeNotebook?.pdfOutline && activeNotebook.pdfOutline.length > 0 && (
              <div className="space-y-1.5 pb-2 border-b border-slate-800">
                <div className="flex items-center justify-between text-[11px] font-bold text-indigo-400 uppercase tracking-wider px-1">
                  <span>Doküman İçindekiler ({activeNotebook.pdfOutline.length})</span>
                </div>
                {activeNotebook.pdfOutline.map((item) => {
                  const isCurrent = item.pageIndex === activePageIndex;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setActivePageIndex(item.pageIndex)}
                      style={{ paddingLeft: `${Math.min(item.level * 12 + 10, 40)}px` }}
                      className={`py-2 pr-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                        isCurrent
                          ? 'bg-indigo-600/20 border-indigo-500/50 text-white shadow-sm'
                          : 'bg-slate-850/60 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden flex-1">
                        <ChevronRight size={13} className="text-indigo-400 shrink-0" />
                        <span className="text-xs font-medium truncate">{item.title}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                          s. {item.pageIndex + 1}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteOutlineItem(item.id);
                          }}
                          className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-750 transition-colors"
                          title="Bölümü Sil"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 4.2 Add New Outline Chapter Button & Form */}
            <div className="pt-1">
              {showAddChapter ? (
                <div className="p-2.5 rounded-xl bg-slate-850 border border-indigo-500/50 space-y-2 mb-2">
                  <div className="text-[11px] font-semibold text-slate-300">
                    Mevcut Sayfaya Bölüm Başlığı Ekle (Sayfa {activePageIndex + 1})
                  </div>
                  <input
                    type="text"
                    value={newChapterTitle}
                    onChange={(e) => setNewChapterTitle(e.target.value)}
                    placeholder="Örn: Bölüm 3: İntegral ve Alan Hesabı"
                    className="w-full bg-slate-900 border border-slate-750 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    autoFocus
                  />
                  <div className="flex justify-end gap-1.5">
                    <button
                      onClick={() => {
                        setShowAddChapter(false);
                        setNewChapterTitle('');
                      }}
                      className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200"
                    >
                      Vazgeç
                    </button>
                    <button
                      onClick={() => {
                        if (!newChapterTitle.trim()) return;
                        addOutlineItem(newChapterTitle.trim(), activePageIndex);
                        setNewChapterTitle('');
                        setShowAddChapter(false);
                      }}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg"
                    >
                      Ekle
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddChapter(true)}
                  className="w-full py-2 px-3 rounded-xl border border-dashed border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/10 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 mb-2"
                >
                  <Plus size={14} />
                  <span>Bu Sayfayı İçindekilere Ekle</span>
                </button>
              )}
            </div>

            {/* 4.3 Page-by-Page Titles List */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                Sayfa Başlıkları
              </div>
              {(activeNotebook?.pages || []).map((pg, idx) => {
                const isCurrent = idx === activePageIndex;
                const isEditing = editingTitlePageIndex === idx;

                return (
                  <div
                    key={pg.id}
                    onClick={() => setActivePageIndex(idx)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                      isCurrent
                        ? 'bg-indigo-600/15 border-indigo-500/60 text-white ring-1 ring-indigo-500/20'
                        : 'bg-slate-850/50 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 flex-1 overflow-hidden">
                      <span className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] font-mono text-slate-400 shrink-0">
                        {idx + 1}
                      </span>

                      {isEditing ? (
                        <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={tempTitle}
                            onChange={(e) => setTempTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                setPageTitle(idx, tempTitle.trim() || `Sayfa ${idx + 1}`);
                                setEditingTitlePageIndex(null);
                              }
                            }}
                            className="w-full bg-slate-900 border border-indigo-500 rounded px-2 py-1 text-xs text-slate-100 focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => {
                              setPageTitle(idx, tempTitle.trim() || `Sayfa ${idx + 1}`);
                              setEditingTitlePageIndex(null);
                            }}
                            className="p-1 text-emerald-400 hover:bg-slate-750 rounded"
                          >
                            <Check size={13} />
                          </button>
                        </div>
                      ) : (
                        <div className="truncate flex-1">
                          <h4 className="text-xs font-semibold truncate">
                            {pg.title || `Bölüm / Sayfa ${idx + 1}`}
                          </h4>
                          <p className="text-[10px] text-slate-500">
                            {pg.strokes.length} çizgi • {pg.texts?.length || 0} metin
                          </p>
                        </div>
                      )}
                    </div>

                    {!isEditing && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTitlePageIndex(idx);
                          setTempTitle(pg.title || `Sayfa ${idx + 1}`);
                        }}
                        className="p-1 text-slate-500 hover:text-indigo-400 rounded hover:bg-slate-750 transition-colors"
                        title="Bölüm Başlığını Değiştir"
                      >
                        <Edit2 size={12} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 🔒 Notebook PIN Lock & Vault Modal */}
      <NotebookLockModal
        isOpen={lockModalState.isOpen}
        onClose={() => setLockModalState({ ...lockModalState, isOpen: false })}
        notebookId={lockModalState.notebookId}
        mode={lockModalState.mode}
        onSuccess={() => {
          if (lockModalState.mode === 'unlock' && lockModalState.notebookId) {
            setActiveNotebook(lockModalState.notebookId);
          }
        }}
      />
    </aside>
    </>
  );
};
