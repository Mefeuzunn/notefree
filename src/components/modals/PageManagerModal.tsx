import React, { useState } from 'react';
import { useNotebookStore } from '../../store/notebookStore';
import {
  X,
  Plus,
  Copy,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Grid,
  Check,
  GripHorizontal,
  PlusCircle,
  CheckSquare,
  Square,
  Star,
  Download,
  Layers,
  Sparkles,
} from 'lucide-react';
import { triggerHaptic } from '../../engine/hapticFeedback';
import { MiniPagePreview } from '../navigation/PageScrubberBar';
import { formatPageRange } from '../../services/exportService';

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
    reorderPages,
    movePageLeft,
    movePageRight,
    insertPageAt,
    removePagesBatch,
    duplicatePagesBatch,
    toggleBookmarksBatch,
    setExportModalOpen,
  } = useNotebookStore();

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const activeNotebook = notebooks.find((n) => n.id === activeNotebookId);
  const pages = activeNotebook?.pages || [];

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2000);
  };

  const handleDuplicatePage = async (index: number) => {
    const pageToClone = pages[index];
    if (!pageToClone) return;
    triggerHaptic('light');
    await insertPageAt(index + 1, pageToClone.template, pageToClone.paperColor);
    showToast(`Sayfa ${index + 1} çoğaltıldı`);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (isSelectionMode) return;
    e.dataTransfer.setData('text/plain', String(index));
    e.dataTransfer.effectAllowed = 'move';
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (isSelectionMode) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    if (isSelectionMode) return;
    e.preventDefault();
    const sourceIndexStr = e.dataTransfer.getData('text/plain');
    const sourceIndex = sourceIndexStr ? parseInt(sourceIndexStr, 10) : draggedIndex;

    if (sourceIndex !== null && !isNaN(sourceIndex) && sourceIndex !== targetIndex) {
      triggerHaptic('medium');
      await reorderPages(sourceIndex, targetIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Selection Mode Helpers
  const toggleSelect = (index: number) => {
    triggerHaptic('light');
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleSelectAll = () => {
    triggerHaptic('light');
    if (selectedIndices.size === pages.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(pages.map((_, i) => i)));
    }
  };

  // Batch Action Handlers
  const handleBatchDelete = async () => {
    if (selectedIndices.size === 0) return;
    const count = selectedIndices.size;
    if (!confirm(`Seçilen ${count} sayfayı kalıcı olarak silmek istediğinize emin misiniz?`)) {
      return;
    }
    triggerHaptic('heavy');
    await removePagesBatch(Array.from(selectedIndices));
    setSelectedIndices(new Set());
    showToast(`${count} sayfa silindi`);
  };

  const handleBatchDuplicate = async () => {
    if (selectedIndices.size === 0) return;
    const count = selectedIndices.size;
    triggerHaptic('medium');
    await duplicatePagesBatch(Array.from(selectedIndices));
    setSelectedIndices(new Set());
    showToast(`${count} sayfa çoğaltıldı`);
  };

  const handleBatchBookmark = async () => {
    if (selectedIndices.size === 0) return;
    triggerHaptic('light');
    await toggleBookmarksBatch(Array.from(selectedIndices));
    showToast(`${selectedIndices.size} sayfanın yer imi güncellendi`);
  };

  const handleBatchExport = () => {
    triggerHaptic('light');
    const rangeStr = formatPageRange(Array.from(selectedIndices));
    onClose();
    setExportModalOpen(true, rangeStr);
  };

  return (
    <div className="fixed inset-0 bg-[#090d16]/95 backdrop-blur-3xl z-50 flex flex-col select-none animate-in fade-in duration-200">
      {/* Toast notification */}
      {toastMsg && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-60 bg-indigo-600/95 text-white text-xs font-semibold px-4 py-2 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-2 animate-in fade-in zoom-in-95">
          <Sparkles size={14} className="text-amber-300" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="h-16 bg-slate-950/60 backdrop-blur-2xl border-b border-white/10 px-6 sm:px-8 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 ring-1 ring-white/20">
            <Grid size={18} />
          </div>
          <div>
            <h2 className="font-display text-sm font-bold text-white flex items-center gap-2 tracking-tight">
              Sayfa Düzenleyici & Sıralayıcı
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-semibold">
                {pages.length} Sayfa
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              {isSelectionMode
                ? 'Sayfaları işaretleyerek toplu çoğaltın, silin veya yer imi ekleyin'
                : 'Sürükle-bırak yaparak veya oklarla sayfaların sırasını kolayca değiştirin'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Multi-Selection Mode Toggle */}
          <button
            onClick={() => {
              triggerHaptic('light');
              setIsSelectionMode(!isSelectionMode);
              if (isSelectionMode) setSelectedIndices(new Set());
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm ${
              isSelectionMode
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-white/10'
            }`}
          >
            <CheckSquare size={14} />
            <span>{isSelectionMode ? 'Seçimi Bitir' : 'Çoklu Seç'}</span>
          </button>

          {isSelectionMode && (
            <button
              onClick={handleSelectAll}
              className="px-3 py-2 bg-slate-900/80 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-medium border border-white/10 transition-colors"
            >
              {selectedIndices.size === pages.length ? 'Tümünü Bırak' : 'Tümünü Seç'}
            </button>
          )}

          <button
            onClick={() => {
              triggerHaptic('light');
              addPage();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all active:scale-95 border border-indigo-400/30"
          >
            <Plus size={14} />
            <span>Sona Sayfa Ekle</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition-colors ml-1"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Pages Grid */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-10 pb-28">
        <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {pages.map((pg, idx) => {
            const isSelectedPage = idx === activePageIndex;
            const isChecked = selectedIndices.has(idx);
            const isDragging = draggedIndex === idx;
            const isDragTarget = dragOverIndex === idx && draggedIndex !== idx;

            return (
              <div
                key={pg.id}
                draggable={!isSelectionMode}
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
                onDrop={(e) => handleDrop(e, idx)}
                onClick={() => {
                  if (isSelectionMode) {
                    toggleSelect(idx);
                  } else {
                    triggerHaptic('light');
                    setActivePageIndex(idx);
                    onClose();
                  }
                }}
                className={`group relative flex flex-col items-center p-3 rounded-2xl border transition-all cursor-pointer ${
                  isDragging
                    ? 'opacity-40 scale-95 border-dashed border-indigo-400'
                    : isDragTarget
                    ? 'border-indigo-400 bg-indigo-500/20 scale-105 shadow-2xl ring-2 ring-indigo-400'
                    : isChecked
                    ? 'border-indigo-400 bg-indigo-600/20 ring-2 ring-indigo-400 shadow-xl scale-[1.02]'
                    : isSelectedPage
                    ? 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/40 shadow-xl'
                    : 'border-slate-800 bg-slate-850/60 hover:border-slate-700 hover:bg-slate-800'
                }`}
              >
                {/* Selection Checkbox or Drag Handle */}
                {isSelectionMode ? (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelect(idx);
                    }}
                    className={`absolute top-2 left-2 z-20 w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                      isChecked
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-slate-800/80 border border-slate-600 text-transparent hover:border-slate-400'
                    }`}
                  >
                    <Check size={12} className={isChecked ? 'stroke-[3]' : 'opacity-0'} />
                  </div>
                ) : (
                  <div
                    className="absolute top-2 left-2 text-slate-500 group-hover:text-slate-300 opacity-60 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1 z-10"
                    title="Sürükleyip sırasını değiştirin"
                  >
                    <GripHorizontal size={14} />
                  </div>
                )}

                {/* Bookmark Star Icon */}
                {pg.isBookmarked && (
                  <div
                    className="absolute top-2 right-2 text-amber-400 z-10 p-0.5"
                    title="Yer İmi Eklenmiş Sayfa"
                  >
                    <Star size={13} className="fill-amber-400" />
                  </div>
                )}

                {/* Live Real Page Canvas Preview */}
                <div className="w-full aspect-[1/1.38] rounded-xl overflow-hidden border border-slate-700/60 shadow-md mb-2 flex items-center justify-center bg-slate-900 relative group-hover:shadow-lg transition-transform">
                  <MiniPagePreview
                    page={pg}
                    width={130}
                    height={180}
                    className="w-full h-full border-none shadow-none"
                  />
                </div>

                {/* Page Number & Reorder Arrow Controls */}
                <div className="w-full flex items-center justify-between text-xs px-1 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-semibold text-slate-200 truncate">
                      {pg.title || `Sayfa ${idx + 1}`}
                    </span>
                  </div>

                  {!isSelectionMode && (
                    <div className="flex items-center gap-0.5 shrink-0">
                      {/* Move Left Button */}
                      <button
                        disabled={idx === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHaptic('light');
                          movePageLeft(idx);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-indigo-300 hover:bg-slate-700 disabled:opacity-20 disabled:hover:bg-transparent"
                        title="Sola / Öne Taşı"
                      >
                        <ChevronLeft size={13} />
                      </button>

                      {/* Move Right Button */}
                      <button
                        disabled={idx === pages.length - 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHaptic('light');
                          movePageRight(idx);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-indigo-300 hover:bg-slate-700 disabled:opacity-20 disabled:hover:bg-transparent"
                        title="Sağa / Arkaya Taşı"
                      >
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Bottom Actions Row: Duplicate, Insert After, Delete */}
                {!isSelectionMode && (
                  <div className="w-full flex items-center justify-between pt-1 border-t border-slate-800/80 text-xs">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerHaptic('light');
                        insertPageAt(idx + 1);
                        showToast(`Sayfa ${idx + 2} araya eklendi`);
                      }}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] text-slate-400 hover:text-indigo-300 hover:bg-slate-750 transition-colors"
                      title="Bu sayfanın hemen arkasına yeni sayfa ekle"
                    >
                      <PlusCircle size={11} />
                      <span>Araya Ekle</span>
                    </button>

                    <div className="flex items-center gap-1">
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
                              triggerHaptic('heavy');
                              setActivePageIndex(idx);
                              removeCurrentPage();
                              showToast(`Sayfa ${idx + 1} silindi`);
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
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ⚡ FAZ U: Floating Bottom Batch Actions Pill Bar */}
      {selectedIndices.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 backdrop-blur-xl border border-indigo-500/50 rounded-2xl p-2 shadow-2xl shadow-indigo-950/60 flex items-center gap-2 ring-1 ring-black/40 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="px-3 py-1 bg-indigo-600/25 rounded-xl border border-indigo-500/40 text-indigo-300 font-mono font-bold text-xs flex items-center gap-1.5">
            <Layers size={13} />
            <span>{selectedIndices.size} Sayfa Seçildi</span>
          </div>

          {/* Batch Duplicate */}
          <button
            onClick={handleBatchDuplicate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all hover:scale-105"
            title="Seçili sayfaları sıralarıyla çoğalt"
          >
            <Copy size={13} className="text-indigo-400" />
            <span>Çoğalt</span>
          </button>

          {/* Batch Bookmark Toggle */}
          <button
            onClick={handleBatchBookmark}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold transition-all hover:scale-105"
            title="Seçili sayfalara toplu yer imi yıldızı ekle / kaldır"
          >
            <Star size={13} className="fill-amber-400 text-amber-400" />
            <span>Yer İmi</span>
          </button>

          {/* Batch Export */}
          <button
            onClick={handleBatchExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-semibold transition-all hover:scale-105"
            title="Dışa Aktarma Stüdyosunu Aç"
          >
            <Download size={13} className="text-sky-400" />
            <span>Dışa Aktar</span>
          </button>

          {/* Batch Delete */}
          <button
            onClick={handleBatchDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all hover:scale-105"
            title="Seçili sayfaları sil"
          >
            <Trash2 size={13} className="text-rose-400" />
            <span>Sil</span>
          </button>

          <div className="w-px h-5 bg-slate-700 mx-1" />

          {/* Clear Selection */}
          <button
            onClick={() => {
              triggerHaptic('light');
              setSelectedIndices(new Set());
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            title="Seçimi Temizle"
          >
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
};
