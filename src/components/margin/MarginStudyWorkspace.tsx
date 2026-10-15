import React, { useState } from 'react';
import { useNotebookStore } from '../../store/notebookStore';
import { MarginCardColor, MarginExcerptCard } from '../../types/notebook';
import {
  X,
  Plus,
  Bookmark,
  Pin,
  ExternalLink,
  Trash2,
  Edit2,
  Tag,
  Search,
  Check,
  FileText,
  Layers,
  Sparkles,
  ChevronRight,
  BookOpen,
} from 'lucide-react';

const COLOR_CONFIG: Record<
  MarginCardColor,
  { bg: string; border: string; text: string; badge: string; accent: string }
> = {
  amber: {
    bg: 'bg-amber-950/20',
    border: 'border-amber-500/40',
    text: 'text-amber-200',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    accent: '#f59e0b',
  },
  emerald: {
    bg: 'bg-emerald-950/20',
    border: 'border-emerald-500/40',
    text: 'text-emerald-200',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    accent: '#10b981',
  },
  sky: {
    bg: 'bg-sky-950/20',
    border: 'border-sky-500/40',
    text: 'text-sky-200',
    badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    accent: '#0ea5e9',
  },
  rose: {
    bg: 'bg-rose-950/20',
    border: 'border-rose-500/40',
    text: 'text-rose-200',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    accent: '#f43f5e',
  },
  purple: {
    bg: 'bg-purple-950/20',
    border: 'border-purple-500/40',
    text: 'text-purple-200',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    accent: '#a855f7',
  },
  slate: {
    bg: 'bg-slate-800/40',
    border: 'border-slate-750',
    text: 'text-slate-200',
    badge: 'bg-slate-800 text-slate-300 border-slate-700',
    accent: '#64748b',
  },
};

export const MarginStudyWorkspace: React.FC = () => {
  const {
    notebooks,
    activeNotebookId,
    activePageIndex,
    setActivePageIndex,
    marginWorkspaceOpen,
    setMarginWorkspaceOpen,
    addMarginCard,
    updateMarginCard,
    deleteMarginCard,
    stampMarginCardToCanvas,
    exportMarginCardsToNewPage,
  } = useNotebookStore();

  const activeNotebook = notebooks.find((n) => n.id === activeNotebookId);
  const cards = activeNotebook?.marginCards || [];

  // Local Form State
  const [isAdding, setIsAdding] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState<MarginCardColor>('amber');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [linkToCurrentPage, setLinkToCurrentPage] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterTag, setSelectedFilterTag] = useState<string | null>(null);

  if (!marginWorkspaceOpen) return null;

  // Extract unique tags
  const allTags = Array.from(
    new Set(cards.flatMap((c) => c.tags || []).filter(Boolean))
  );

  const filteredCards = cards.filter((card) => {
    const matchesSearch =
      card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (card.tags && card.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesTag = !selectedFilterTag || (card.tags && card.tags.includes(selectedFilterTag));

    return matchesSearch && matchesTag;
  });

  const handleStartAdd = () => {
    setIsAdding(true);
    setEditingCardId(null);
    setTitle('');
    setContent('');
    setColor('amber');
    setTags([]);
    setTagInput('');
    setLinkToCurrentPage(true);
  };

  const handleStartEdit = (card: MarginExcerptCard) => {
    setIsAdding(true);
    setEditingCardId(card.id);
    setTitle(card.title);
    setContent(card.content);
    setColor(card.color);
    setTags(card.tags || []);
    setTagInput('');
    setLinkToCurrentPage(card.targetPageIndex !== undefined);
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (t: string) => {
    setTags(tags.filter((tag) => tag !== t));
  };

  const handleSave = () => {
    if (!content.trim() && !title.trim()) return;

    if (editingCardId) {
      updateMarginCard(editingCardId, {
        title: title.trim(),
        content: content.trim(),
        color,
        tags,
        targetPageIndex: linkToCurrentPage ? activePageIndex : undefined,
      });
    } else {
      addMarginCard({
        title: title.trim(),
        content: content.trim(),
        color,
        tags,
        targetPageIndex: linkToCurrentPage ? activePageIndex : undefined,
      });
    }

    setIsAdding(false);
    setEditingCardId(null);
  };

  return (
    <aside className="w-84 sm:w-96 bg-slate-900/95 backdrop-blur-xl border-l border-slate-800 flex flex-col h-full shadow-2xl z-20 shrink-0 animate-in slide-in-from-right duration-250 select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-800 bg-slate-900/70">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Bookmark size={16} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
              Çalışma Kenarlığı
              <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 text-indigo-300 font-mono rounded-full border border-slate-700">
                {cards.length}
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">LiquidText Stili Alıntı & Özet Alanı</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setMarginWorkspaceOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
            title="Kenarlığı Kapat"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="px-4 py-2.5 border-b border-slate-800/80 flex items-center justify-between gap-2 bg-slate-900/40">
        <button
          onClick={handleStartAdd}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02]"
        >
          <Plus size={14} />
          <span>Alıntı / Not Ekle</span>
        </button>

        {cards.length > 0 && (
          <button
            onClick={() => exportMarginCardsToNewPage()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition-all"
            title="Tüm alıntı kartlarını yeni bir özet sayfasına dönüştür"
          >
            <BookOpen size={14} className="text-amber-400" />
            <span>Sayfaya Aktar</span>
          </button>
        )}
      </div>

      {/* Search & Tag Filter Bar */}
      <div className="px-4 py-2 border-b border-slate-800/60 space-y-2">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Alıntılarda ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
            <button
              onClick={() => setSelectedFilterTag(null)}
              className={`px-2 py-0.5 rounded-lg shrink-0 font-medium transition-colors ${
                selectedFilterTag === null
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              Tümü
            </button>
            {allTags.map((t) => (
              <button
                key={t}
                onClick={() =>
                  setSelectedFilterTag(selectedFilterTag === t ? null : t)
                }
                className={`px-2 py-0.5 rounded-lg shrink-0 font-medium transition-colors flex items-center gap-1 ${
                  selectedFilterTag === t
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>#{t}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Body: Card Creator Form or Card List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Card Editor / Creator Form */}
        {isAdding && (
          <div className="bg-slate-950 border border-indigo-500/40 rounded-2xl p-3.5 space-y-3 shadow-xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1">
                <Sparkles size={13} />
                {editingCardId ? 'Alıntı Kartını Düzenle' : 'Yeni Alıntı / Özet Kartı'}
              </span>
              <button
                onClick={() => setIsAdding(false)}
                className="text-slate-500 hover:text-slate-300 text-xs"
              >
                İptal
              </button>
            </div>

            <input
              type="text"
              placeholder="Kart Başlığı (Örn: Termodinamik 1. Yasa)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
            />

            <textarea
              placeholder="Alıntı, özet formül veya tanım metnini girin..."
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
            />

            {/* Color Palette Selector */}
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] text-slate-400 font-medium">Tema:</span>
              <div className="flex items-center gap-1.5">
                {(Object.keys(COLOR_CONFIG) as MarginCardColor[]).map((cKey) => (
                  <button
                    key={cKey}
                    type="button"
                    onClick={() => setColor(cKey)}
                    className={`w-5 h-5 rounded-full border transition-transform flex items-center justify-center ${
                      color === cKey ? 'scale-110 ring-2 ring-indigo-400' : 'opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: COLOR_CONFIG[cKey].accent }}
                  >
                    {color === cKey && <Check size={10} className="text-slate-950 font-bold" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Tag Input */}
            <div>
              <div className="flex items-center gap-1 mb-1.5">
                <input
                  type="text"
                  placeholder="#etiket ekle..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="flex-1 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs"
                >
                  Ekle
                </button>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-md text-[10px] flex items-center gap-1"
                    >
                      #{t}
                      <button
                        onClick={() => handleRemoveTag(t)}
                        className="hover:text-red-400"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Pin to Current Page Link */}
            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={linkToCurrentPage}
                onChange={(e) => setLinkToCurrentPage(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
              />
              <span className="text-xs text-slate-300">
                📍 Sayfa {activePageIndex + 1}'e Doğrudan Bağla
              </span>
            </label>

            <button
              onClick={handleSave}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
            >
              {editingCardId ? 'Değişiklikleri Kaydet' : 'Kartı Kaydet'}
            </button>
          </div>
        )}

        {/* Empty State */}
        {cards.length === 0 && !isAdding && (
          <div className="text-center py-10 px-4 border border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
            <Bookmark size={28} className="mx-auto text-slate-600 mb-2" />
            <h3 className="text-xs font-semibold text-slate-200">Henüz alıntı kartı yok</h3>
            <p className="text-[11px] text-slate-400 mt-1 max-w-[220px] mx-auto leading-relaxed">
              Ders çalışırken, PDF okurken veya not alırken önemli formül ve özetleri kenarlıkta toplayın.
            </p>
            <button
              onClick={handleStartAdd}
              className="mt-4 px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 rounded-xl text-xs font-medium transition-all"
            >
              İlk Alıntıyı Ekle
            </button>
          </div>
        )}

        {/* Filtered Empty State */}
        {cards.length > 0 && filteredCards.length === 0 && (
          <div className="text-center py-8 text-slate-500 text-xs">
            Aramaya uygun kart bulunamadı.
          </div>
        )}

        {/* Card List */}
        {filteredCards.map((card) => {
          const cfg = COLOR_CONFIG[card.color] || COLOR_CONFIG.amber;

          return (
            <div
              key={card.id}
              className={`rounded-2xl border p-3.5 transition-all group ${cfg.bg} ${cfg.border} hover:border-slate-600/80 hover:shadow-lg`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  {card.title && (
                    <h4 className={`text-xs font-semibold leading-snug ${cfg.text}`}>
                      {card.title}
                    </h4>
                  )}
                  {card.targetPageIndex !== undefined && (
                    <button
                      onClick={() => setActivePageIndex(card.targetPageIndex!)}
                      className="mt-1 inline-flex items-center gap-1 text-[10px] font-mono font-medium text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded-md border border-indigo-500/20"
                      title="Bu sayfanın olduğu konuma git"
                    >
                      <Pin size={10} />
                      <span>Sayfa {card.targetPageIndex + 1}'e Git</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => stampMarginCardToCanvas(card.id)}
                    className="p-1 text-slate-400 hover:text-amber-400 rounded hover:bg-slate-800"
                    title="Bu kartı sayfaya yapışkan not olarak yapıştır"
                  >
                    <Layers size={13} />
                  </button>
                  <button
                    onClick={() => handleStartEdit(card)}
                    className="p-1 text-slate-400 hover:text-indigo-400 rounded hover:bg-slate-800"
                    title="Düzenle"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => deleteMarginCard(card.id)}
                    className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800"
                    title="Sil"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Card Body */}
              <p className="text-xs text-slate-300 mt-2 leading-relaxed whitespace-pre-wrap font-sans">
                {card.content}
              </p>

              {/* Tags & Footer */}
              {card.tags && card.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2.5 pt-2 border-t border-slate-800/60">
                  {card.tags.map((t) => (
                    <span
                      key={t}
                      className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${cfg.badge}`}
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};
