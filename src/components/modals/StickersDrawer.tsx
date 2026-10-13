import React, { useState } from 'react';
import { useNotebookStore } from '../../store/notebookStore';
import { PRESET_STICKERS } from '../../engine/stickersLibrary';
import { StickerItem } from '../../types/notebook';
import { X, Sparkles, Upload, Bookmark, Layers } from 'lucide-react';

export const StickersDrawer: React.FC = () => {
  const {
    stickersDrawerOpen,
    setStickersDrawerOpen,
    customStickers,
    addStickerToCurrentPage,
  } = useNotebookStore();

  const [activeCategory, setActiveCategory] = useState<
    'all' | 'sticky' | 'tape' | 'icon' | 'custom'
  >('all');

  if (!stickersDrawerOpen) return null;

  const allStickers: StickerItem[] = [...PRESET_STICKERS, ...customStickers];
  const filtered =
    activeCategory === 'all'
      ? allStickers
      : allStickers.filter((s) => s.category === activeCategory);

  return (
    <div className="fixed inset-y-0 right-0 w-84 bg-slate-900/95 backdrop-blur-xl border-l border-slate-800 z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200 select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
            <Sparkles size={15} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Öğeler & Çıkartmalar</h3>
            <p className="text-[10px] text-slate-400">Elements & Stickers</p>
          </div>
        </div>

        <button
          onClick={() => setStickersDrawerOpen(false)}
          className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
        >
          <X size={16} />
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 p-3 overflow-x-auto border-b border-slate-800 text-xs">
        {[
          { id: 'all', label: 'Tümü' },
          { id: 'sticky', label: 'Notlar' },
          { id: 'tape', label: 'Bantlar' },
          { id: 'icon', label: 'Rozetler' },
          { id: 'custom', label: `Özel (${customStickers.length})` },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id as any)}
            className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeCategory === cat.id
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Stickers Grid */}
      <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-3">
        {filtered.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-slate-500 text-xs">
            <Bookmark size={24} className="mx-auto mb-2 opacity-40" />
            <p>Bu kategoride henüz çıkartma yok.</p>
            <p className="text-[11px] text-slate-600 mt-1">
              Kement aracıyla çizim seçip 'Sticker Olarak Kaydet' diyebilirsiniz.
            </p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => addStickerToCurrentPage(item)}
              className="p-2.5 rounded-xl border border-slate-800 bg-slate-850/60 hover:border-amber-500/50 hover:bg-slate-800 cursor-pointer transition-all flex flex-col items-center justify-center group hover:scale-105 shadow-sm"
            >
              <div
                className="w-full h-20 flex items-center justify-center overflow-hidden mb-1.5"
                dangerouslySetInnerHTML={{ __html: item.content }}
              />
              <span className="text-[11px] font-medium text-slate-300 truncate w-full text-center group-hover:text-amber-300">
                {item.name}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
