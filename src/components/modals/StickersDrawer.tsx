import React, { useState, useRef } from 'react';
import { useNotebookStore } from '../../store/notebookStore';
import { PRESET_STICKERS } from '../../engine/stickersLibrary';
import { StickerItem } from '../../types/notebook';
import {
  X,
  Sparkles,
  Upload,
  Bookmark,
  Plus,
  Trash2,
  FolderPlus,
  Check,
} from 'lucide-react';

export const StickersDrawer: React.FC = () => {
  const {
    stickersDrawerOpen,
    setStickersDrawerOpen,
    customStickers,
    addStickerToCurrentPage,
    addCustomSticker,
    deleteCustomSticker,
  } = useNotebookStore();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [customCollections, setCustomCollections] = useState<string[]>([
    'Diyagramlar',
    'Matematik & Fen',
    'Tasarım & İkonlar',
  ]);
  const [showNewCollectionInput, setShowNewCollectionInput] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!stickersDrawerOpen) return null;

  const allStickers: StickerItem[] = [...PRESET_STICKERS, ...customStickers];
  const filtered =
    activeCategory === 'all'
      ? allStickers
      : allStickers.filter((s) => s.category === activeCategory);

  // Handle uploading external image/SVG as an element
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const newSticker: StickerItem = {
        id: `el_user_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: file.name.replace(/\.[^/.]+$/, '').slice(0, 20),
        category: activeCategory === 'all' ? 'custom' : activeCategory,
        content: result.startsWith('data:image/svg+xml')
          ? atob(result.split(',')[1])
          : `<img src="${result}" style="max-width:100%; max-height:100%; object-fit:contain;" />`,
        width: 140,
        height: 140,
      };

      addCustomSticker(newSticker);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.readAsDataURL(file);
  };

  const handleAddCollection = () => {
    if (!newCollectionName.trim()) return;
    const trimmed = newCollectionName.trim();
    if (!customCollections.includes(trimmed)) {
      setCustomCollections([...customCollections, trimmed]);
      setActiveCategory(trimmed);
    }
    setNewCollectionName('');
    setShowNewCollectionInput(false);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-84 sm:w-96 bg-slate-900/95 backdrop-blur-xl border-l border-slate-800 z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200 select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Öğeler (Elements)</h3>
            <p className="text-[10px] text-slate-400">GoodNotes 6 Öğeler & Çıkartmalar</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1"
            title="Görsel veya SVG İçe Aktar"
          >
            <Upload size={15} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.svg"
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            onClick={() => setStickersDrawerOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Category Pills & Collections */}
      <div className="p-3 border-b border-slate-800 text-xs space-y-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'Tümü' },
            { id: 'sticky', label: 'Notlar' },
            { id: 'tape', label: 'Bantlar' },
            { id: 'icon', label: 'Rozetler' },
            { id: 'custom', label: `Özel (${customStickers.length})` },
            ...customCollections.map((col) => ({ id: col, label: col })),
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-2.5 py-1 rounded-xl font-medium whitespace-nowrap transition-colors shrink-0 ${
                activeCategory === cat.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}

          {/* New Collection Button */}
          <button
            onClick={() => setShowNewCollectionInput(!showNewCollectionInput)}
            className="p-1 text-slate-500 hover:text-amber-400 rounded hover:bg-slate-800 shrink-0"
            title="Yeni Koleksiyon Ekle"
          >
            <FolderPlus size={14} />
          </button>
        </div>

        {/* New Collection Form */}
        {showNewCollectionInput && (
          <div className="flex items-center gap-1.5 animate-in fade-in pt-1">
            <input
              type="text"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              placeholder="Koleksiyon Adı (örn: Geometri)"
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              autoFocus
            />
            <button
              onClick={handleAddCollection}
              className="p-1 bg-amber-500 text-slate-950 rounded-lg hover:bg-amber-400 transition-colors"
            >
              <Check size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Stickers Grid */}
      <div className="flex-1 overflow-y-auto p-3.5 grid grid-cols-2 gap-2.5">
        {filtered.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-slate-500 text-xs">
            <Bookmark size={24} className="mx-auto mb-2 opacity-40 text-amber-500" />
            <p className="font-semibold text-slate-300">Bu koleksiyonda henüz öğe yok</p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-[220px] mx-auto">
              Kement aracıyla tuvaldeki çizimleri seçip 'Sticker Olarak Kaydet' diyebilir veya yukarıdan görsel yükleyebilirsiniz.
            </p>
          </div>
        ) : (
          filtered.map((item) => {
            const isCustom = customStickers.some((s) => s.id === item.id);
            return (
              <div
                key={item.id}
                onClick={() => addStickerToCurrentPage(item)}
                className="p-2.5 rounded-2xl border border-slate-800 bg-slate-850/60 hover:border-amber-500/50 hover:bg-slate-800 cursor-pointer transition-all flex flex-col items-center justify-between group hover:scale-[1.02] shadow-sm relative overflow-hidden"
              >
                {/* Delete button for user-added items */}
                {isCustom && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteCustomSticker(item.id);
                    }}
                    className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-slate-900/80 text-slate-400 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    title="Öğeyi Sil"
                  >
                    <Trash2 size={12} />
                  </button>
                )}

                <div
                  className="w-full h-20 flex items-center justify-center overflow-hidden mb-1.5 p-1"
                  dangerouslySetInnerHTML={{ __html: item.content }}
                />

                <span className="text-[11px] font-medium text-slate-300 truncate w-full text-center group-hover:text-amber-300">
                  {item.name}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/60 text-[11px] text-slate-400 flex items-center justify-between">
        <span>{filtered.length} Öğe Listelendi</span>
        <span className="text-amber-400 font-medium">Tıkla ve Tuvale Ekle</span>
      </div>
    </div>
  );
};
