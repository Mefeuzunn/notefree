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
    reorderPages,
    movePageLeft,
    movePageRight,
    insertPageAt,
  } = useNotebookStore();

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const activeNotebook = notebooks.find((n) => n.id === activeNotebookId);
  const pages = activeNotebook?.pages || [];

  if (!isOpen) return null;

  const handleDuplicatePage = async (index: number) => {
    const pageToClone = pages[index];
    if (!pageToClone) return;
    await insertPageAt(index + 1, pageToClone.template, pageToClone.paperColor);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', String(index));
    e.dataTransfer.effectAllowed = 'move';
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
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
    e.preventDefault();
    const sourceIndexStr = e.dataTransfer.getData('text/plain');
    const sourceIndex = sourceIndexStr ? parseInt(sourceIndexStr, 10) : draggedIndex;

    if (sourceIndex !== null && !isNaN(sourceIndex) && sourceIndex !== targetIndex) {
      await reorderPages(sourceIndex, targetIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex flex-col select-none animate-in fade-in duration-200">
      {/* Header */}
      <div className="h-14 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Grid size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              Sayfa Düzenleyici & Sıralayıcı
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-normal">
                {pages.length} Sayfa
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Sürükle-bırak yaparak veya oklarla sayfaların sırasını kolayca değiştirin
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => addPage()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all active:scale-95"
          >
            <Plus size={14} />
            <span>Sona Sayfa Ekle</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
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
            const isDragging = draggedIndex === idx;
            const isDragTarget = dragOverIndex === idx && draggedIndex !== idx;

            return (
              <div
                key={pg.id}
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
                onDrop={(e) => handleDrop(e, idx)}
                onClick={() => {
                  setActivePageIndex(idx);
                  onClose();
                }}
                className={`group relative flex flex-col items-center p-3 rounded-2xl border transition-all cursor-pointer ${
                  isDragging
                    ? 'opacity-40 scale-95 border-dashed border-indigo-400'
                    : isDragTarget
                    ? 'border-indigo-400 bg-indigo-500/20 scale-105 shadow-2xl ring-2 ring-indigo-400'
                    : isSelected
                    ? 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/40 shadow-xl scale-[1.02]'
                    : 'border-slate-800 bg-slate-850/60 hover:border-slate-700 hover:bg-slate-800'
                }`}
              >
                {/* Drag Handle Icon on hover */}
                <div
                  className="absolute top-2 left-2 text-slate-500 group-hover:text-slate-300 opacity-60 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1"
                  title="Sürükleyip sırasını değiştirin"
                >
                  <GripHorizontal size={14} />
                </div>

                {/* Active Selection Badge */}
                {isSelected && (
                  <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shadow-md z-10">
                    <Check size={11} />
                  </span>
                )}

                {/* Simulated Thumbnail Paper */}
                <div
                  className="w-full aspect-[1/1.38] rounded-xl border border-slate-700/60 shadow-md mb-2 flex flex-col items-center justify-center p-2 text-center text-[10px] overflow-hidden transition-transform group-hover:shadow-lg"
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
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[10px] font-bold text-indigo-600 bg-white/90 px-2 py-0.5 rounded shadow-sm">
                        ✍️ {pg.strokes.length} çizgi
                      </span>
                      {pg.stickyNotes && pg.stickyNotes.length > 0 && (
                        <span className="text-[9px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded shadow-2xs">
                          📌 {pg.stickyNotes.length} not
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-400 font-mono capitalize">{pg.template}</span>
                  )}
                </div>

                {/* Page Number & Reorder Arrow Controls */}
                <div className="w-full flex items-center justify-between text-xs px-1 mb-1">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-slate-200">Sayfa {idx + 1}</span>
                  </div>

                  <div className="flex items-center gap-0.5">
                    {/* Move Left Button */}
                    <button
                      disabled={idx === 0}
                      onClick={(e) => {
                        e.stopPropagation();
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
                        movePageRight(idx);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-indigo-300 hover:bg-slate-700 disabled:opacity-20 disabled:hover:bg-transparent"
                      title="Sağa / Arkaya Taşı"
                    >
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>

                {/* Bottom Actions Row: Duplicate, Insert After, Delete */}
                <div className="w-full flex items-center justify-between pt-1 border-t border-slate-800/80 text-xs">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      insertPageAt(idx + 1);
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
