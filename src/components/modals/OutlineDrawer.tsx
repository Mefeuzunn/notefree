import React, { useState, useMemo } from 'react';
import { useNotebookStore } from '../../store/notebookStore';
import { PdfOutlineItem } from '../../types/notebook';
import {
  ListTree,
  X,
  Plus,
  Sparkles,
  Search,
  Trash2,
  Edit2,
  ChevronRight,
  Bookmark,
  ArrowUp,
  ArrowDown,
  Check,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import { triggerHaptic } from '../../engine/hapticFeedback';

const LEVEL_COLORS = [
  { label: 'İndigo', color: '#6366f1' },
  { label: 'Zümrüt', color: '#10b981' },
  { label: 'Kehribar', color: '#f59e0b' },
  { label: 'Gül', color: '#f43f5e' },
  { label: 'Gök Mavisi', color: '#0ea5e9' },
  { label: 'Mor', color: '#8b5cf6' },
];

export const OutlineDrawer: React.FC = () => {
  const {
    outlineDrawerOpen,
    setOutlineDrawerOpen,
    notebooks,
    activeNotebookId,
    activePageIndex,
    setActivePageIndex,
    addOutlineItem,
    updateOutlineItem,
    deleteOutlineItem,
    reorderOutlineItems,
    generateAutoOutlineFromNotebook,
    clearOutline,
  } = useNotebookStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<'all' | '0' | '1' | '2' | 'bookmarks'>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states (for add / edit)
  const [formTitle, setFormTitle] = useState('');
  const [formPageIndex, setFormPageIndex] = useState<number>(activePageIndex);
  const [formLevel, setFormLevel] = useState<number>(0);
  const [formColor, setFormColor] = useState<string>('#6366f1');
  const [notification, setNotification] = useState<string | null>(null);

  const activeNotebook = notebooks.find((n) => n.id === activeNotebookId);
  const totalPages = activeNotebook?.pages.length || 1;
  const outlineItems = activeNotebook?.pdfOutline || [];

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleStartAdd = () => {
    setFormTitle('');
    setFormPageIndex(activePageIndex);
    setFormLevel(0);
    setFormColor('#6366f1');
    setEditingId(null);
    setIsAdding(true);
  };

  const handleStartEdit = (item: PdfOutlineItem) => {
    setFormTitle(item.title);
    setFormPageIndex(item.pageIndex);
    setFormLevel(item.level);
    setFormColor(item.color || '#6366f1');
    setIsAdding(false);
    setEditingId(item.id);
  };

  const handleSaveForm = () => {
    if (!formTitle.trim()) return;

    if (editingId) {
      updateOutlineItem(editingId, {
        title: formTitle.trim(),
        pageIndex: formPageIndex,
        level: formLevel,
        color: formColor,
      });
      triggerHaptic('light');
      showToast('Başlık güncellendi');
      setEditingId(null);
    } else {
      addOutlineItem(formTitle.trim(), formPageIndex, formLevel, formColor);
      triggerHaptic('success');
      showToast('Yeni başlık fihriste eklendi');
      setIsAdding(false);
    }
  };

  const handleAutoGenerate = () => {
    triggerHaptic('medium');
    const count = generateAutoOutlineFromNotebook();
    if (count > 0) {
      showToast(`✨ ${count} yeni başlık ve yer imi otomatik eklendi!`);
    } else {
      showToast('Mevcut başlıklara uygun yeni öge bulunamadı.');
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Tüm fihrist ve içindekiler tablosunu temizlemek istediğinizden emin misiniz?')) {
      clearOutline();
      triggerHaptic('medium');
      showToast('İçindekiler tablosu temizlendi');
    }
  };

  const filteredItems = useMemo(() => {
    return outlineItems.filter((item) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!item.title.toLowerCase().includes(q)) return false;
      }
      // Filter tab
      if (filterLevel === '0' && item.level !== 0) return false;
      if (filterLevel === '1' && item.level !== 1) return false;
      if (filterLevel === '2' && item.level !== 2) return false;
      if (filterLevel === 'bookmarks' && !item.isBookmark) return false;

      return true;
    });
  }, [outlineItems, searchQuery, filterLevel]);

  if (!outlineDrawerOpen) return null;

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden"
        onClick={() => setOutlineDrawerOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 w-84 max-w-[90vw] sm:w-96 bg-slate-900/95 backdrop-blur-xl border-l border-slate-800 z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200 select-none">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-md">
              <ListTree size={17} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>İçindekiler & Fihrist</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                  {outlineItems.length}
                </span>
              </h3>
              <p className="text-[10px] text-slate-400">Başlık Hiyerarşisi & PDF Yer İmleri</p>
            </div>
          </div>

          <button
            onClick={() => setOutlineDrawerOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Toast Notification */}
        {notification && (
          <div className="mx-4 mt-2 px-3 py-1.5 bg-indigo-600/90 text-white text-xs rounded-xl shadow-lg flex items-center justify-between animate-in fade-in slide-in-from-top-1">
            <span>{notification}</span>
            <button onClick={() => setNotification(null)} className="ml-2 hover:opacity-75">
              <X size={13} />
            </button>
          </div>
        )}

        {/* Quick Action Toolbar */}
        <div className="p-3 border-b border-slate-800/80 bg-slate-900/60 flex items-center gap-1.5">
          <button
            onClick={handleAutoGenerate}
            className="flex-1 py-1.5 px-2.5 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 hover:from-indigo-600/30 hover:to-purple-600/30 border border-indigo-500/40 text-indigo-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm"
            title="Defterdeki sayfa başlıklarını, # markdown başlıklarını ve yer imlerini otomatik tara"
          >
            <Sparkles size={13} className="text-indigo-400" />
            <span>Otomatik Üret</span>
          </button>

          <button
            onClick={handleStartAdd}
            className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-all shadow-md shadow-indigo-600/20 shrink-0"
            title="Yeni Bölüm veya Başlık Ekle"
          >
            <Plus size={14} />
            <span>Yeni Başlık</span>
          </button>

          {outlineItems.length > 0 && (
            <button
              onClick={handleClearAll}
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-slate-800 transition-colors"
              title="Tüm Fihristi Temizle"
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="px-4 pt-3 pb-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Fihristte ara..."
              className="w-full bg-slate-800/70 border border-slate-750 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-4 pb-2 flex gap-1 overflow-x-auto text-[11px] font-medium border-b border-slate-800/80">
          {[
            { id: 'all', label: 'Tümü' },
            { id: '0', label: 'H1 Bölümler' },
            { id: '1', label: 'H2 Başlıklar' },
            { id: '2', label: 'H3 Alt' },
            { id: 'bookmarks', label: '★ Yer İmleri' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterLevel(tab.id as any)}
              className={`px-2.5 py-1 rounded-lg transition-colors shrink-0 ${
                filterLevel === tab.id
                  ? 'bg-indigo-600/25 border border-indigo-500/40 text-indigo-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Inline Add / Edit Panel */}
        {(isAdding || editingId) && (
          <div className="p-4 mx-3 my-2.5 bg-slate-850 border border-indigo-500/40 rounded-2xl space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">
                {editingId ? 'Başlığı Düzenle' : 'Yeni Başlık Ekle'}
              </span>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setEditingId(null);
                }}
                className="text-slate-400 hover:text-white p-1"
              >
                <X size={14} />
              </button>
            </div>

            {/* Title Input */}
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                Başlık Metni
              </label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Örn: Bölüm 2: Matrisler ve Determinant"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                autoFocus
              />
            </div>

            {/* Page & Level Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                  Hedef Sayfa
                </label>
                <select
                  value={formPageIndex}
                  onChange={(e) => setFormPageIndex(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {Array.from({ length: totalPages }, (_, i) => (
                    <option key={i} value={i}>
                      Sayfa {i + 1}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                  Hiyerarşi Seviyesi
                </label>
                <select
                  value={formLevel}
                  onChange={(e) => setFormLevel(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value={0}>H1 - Ana Bölüm</option>
                  <option value={1}>H2 - Konu Başlığı</option>
                  <option value={2}>H3 - Alt Konu / Detay</option>
                </select>
              </div>
            </div>

            {/* Color Tag Picker */}
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                Renk Etiketi
              </label>
              <div className="flex items-center gap-2">
                {LEVEL_COLORS.map((c) => (
                  <button
                    key={c.color}
                    type="button"
                    onClick={() => setFormColor(c.color)}
                    style={{ backgroundColor: c.color }}
                    className={`w-6 h-6 rounded-full border-2 transition-transform flex items-center justify-center ${
                      formColor === c.color ? 'border-white scale-110 shadow-md' : 'border-transparent opacity-80'
                    }`}
                  >
                    {formColor === c.color && <Check size={12} className="text-white drop-shadow" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setEditingId(null);
                }}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleSaveForm}
                disabled={!formTitle.trim()}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30"
              >
                {editingId ? 'Değişiklikleri Kaydet' : 'Fihriste Ekle'}
              </button>
            </div>
          </div>
        )}

        {/* Outline Items Tree List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {filteredItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-750 flex items-center justify-center text-slate-400">
                <BookOpen size={22} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-300">İçindekiler Kaydı Bulunamadı</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                  Yukarıdaki <span className="text-indigo-400 font-medium">"Otomatik Üret"</span> butonuna tıklayarak
                  defterinizdeki sayfa başlıklarından ve yer imlerinden anında fihrist oluşturabilirsiniz.
                </p>
              </div>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isCurrent = item.pageIndex === activePageIndex;
              const indentPx = Math.min((item.level || 0) * 16, 48);

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setActivePageIndex(item.pageIndex);
                    triggerHaptic('light');
                  }}
                  style={{ paddingLeft: `${indentPx + 10}px` }}
                  className={`group relative py-2.5 pr-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                    isCurrent
                      ? 'bg-indigo-600/20 border-indigo-500/50 text-white shadow-sm ring-1 ring-indigo-500/30'
                      : 'bg-slate-850/60 border-slate-800/90 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Left hierarchy level pip / color indicator */}
                  <div
                    className="absolute left-2.5 top-3 w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color || '#6366f1' }}
                  />

                  {/* Level & Title */}
                  <div className="flex items-center gap-2 overflow-hidden flex-1 pl-1">
                    <span
                      className={`text-[9px] font-mono font-bold px-1 py-0.5 rounded uppercase shrink-0 ${
                        item.level === 0
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          : item.level === 1
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : 'bg-slate-700/50 text-slate-400 border border-slate-600/30'
                      }`}
                    >
                      {item.isBookmark ? '★ İM' : `H${(item.level || 0) + 1}`}
                    </span>

                    <span
                      className={`text-xs truncate ${
                        item.level === 0 ? 'font-bold text-slate-100' : item.level === 1 ? 'font-semibold text-slate-200' : 'text-slate-300'
                      }`}
                    >
                      {item.title}
                    </span>
                  </div>

                  {/* Page Number & Action buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                      s. {item.pageIndex + 1}
                    </span>

                    {/* Move Up / Down (visible on hover) */}
                    <div className="hidden group-hover:flex items-center">
                      {idx > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            reorderOutlineItems(idx, idx - 1);
                            triggerHaptic('light');
                          }}
                          className="p-1 text-slate-400 hover:text-white"
                          title="Yukarı Taşı"
                        >
                          <ArrowUp size={11} />
                        </button>
                      )}
                      {idx < filteredItems.length - 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            reorderOutlineItems(idx, idx + 1);
                            triggerHaptic('light');
                          }}
                          className="p-1 text-slate-400 hover:text-white"
                          title="Aşağı Taşı"
                        >
                          <ArrowDown size={11} />
                        </button>
                      )}
                    </div>

                    {/* Edit Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEdit(item);
                      }}
                      className="p-1 text-slate-500 hover:text-indigo-300 rounded hover:bg-slate-750 transition-colors"
                      title="Başlığı Düzenle"
                    >
                      <Edit2 size={12} />
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteOutlineItem(item.id);
                        triggerHaptic('light');
                        showToast('Başlık silindi');
                      }}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-750 transition-colors"
                      title="Fihristten Sil"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Info */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/80 text-[11px] text-slate-400 flex items-center justify-between px-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>PDF Yer İmleri Uyumlu</span>
          </div>
          <span className="text-indigo-400 font-medium">GoodNotes 6 Standardı</span>
        </div>
      </div>
    </>
  );
};
