import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNotebookStore } from '../../store/notebookStore';
import {
  Search,
  X,
  FileText,
  Star,
  Brain,
  Bandage,
  Book,
  ArrowRight,
  Sparkles,
  Layers,
} from 'lucide-react';

interface SearchResultItem {
  id: string;
  type: 'text' | 'bookmark' | 'tape' | 'flashcard' | 'notebook';
  title: string;
  subtitle: string;
  notebookId: string;
  notebookTitle: string;
  pageIndex: number;
  badge: string;
  badgeColor: string;
}

export const SearchModal: React.FC = () => {
  const {
    searchModalOpen,
    setSearchModalOpen,
    notebooks,
    activeNotebookId,
    setActiveNotebook,
    setActivePageIndex,
  } = useNotebookStore();

  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'text' | 'bookmark' | 'tape' | 'flashcard' | 'notebook'>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto focus input when opened
  useEffect(() => {
    if (searchModalOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery('');
    }
  }, [searchModalOpen]);

  // Global keyboard shortcut: Cmd+K / Ctrl+K and Cmd+F / Ctrl+F
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'f')) {
        // Do not intercept if inside a textarea or input that is not our search input
        const target = e.target as HTMLElement;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') && target !== inputRef.current) {
          return;
        }
        e.preventDefault();
        setSearchModalOpen(!searchModalOpen);
      } else if (e.key === 'Escape' && searchModalOpen) {
        setSearchModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchModalOpen, setSearchModalOpen]);

  // Search indexing
  const results = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      // Return recent or bookmarked items when query is empty
      const recentItems: SearchResultItem[] = [];
      notebooks.forEach((nb) => {
        nb.pages.forEach((pg, pIdx) => {
          if (pg.isBookmarked) {
            recentItems.push({
              id: `bm_${nb.id}_${pg.id}`,
              type: 'bookmark',
              title: pg.title || `Sayfa ${pg.pageNumber}`,
              subtitle: `${nb.title} içinde yer işareti eklenmiş sayfa`,
              notebookId: nb.id,
              notebookTitle: nb.title,
              pageIndex: pIdx,
              badge: 'Yer İmi',
              badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
            });
          }
        });
      });
      return recentItems.slice(0, 10);
    }

    const items: SearchResultItem[] = [];

    notebooks.forEach((nb) => {
      // 1. Match notebook title
      if (nb.title.toLowerCase().includes(trimmed)) {
        items.push({
          id: `nb_${nb.id}`,
          type: 'notebook',
          title: nb.title,
          subtitle: `${nb.pages.length} sayfa içeriyor`,
          notebookId: nb.id,
          notebookTitle: nb.title,
          pageIndex: 0,
          badge: 'Defter',
          badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
        });
      }

      // 2. Match pages, text annotations, bookmarks, tapes
      nb.pages.forEach((page, pIdx) => {
        // Page Title
        if (page.title && page.title.toLowerCase().includes(trimmed)) {
          items.push({
            id: `pg_title_${nb.id}_${page.id}`,
            type: 'text',
            title: page.title,
            subtitle: `${nb.title} • Sayfa ${page.pageNumber}`,
            notebookId: nb.id,
            notebookTitle: nb.title,
            pageIndex: pIdx,
            badge: 'Sayfa Başlığı',
            badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
          });
        }

        // Bookmarks
        if (page.isBookmarked && `sayfa ${page.pageNumber} yer imi`.includes(trimmed)) {
          items.push({
            id: `bm_${nb.id}_${page.id}`,
            type: 'bookmark',
            title: page.title || `Sayfa ${page.pageNumber}`,
            subtitle: `${nb.title} • Yer İmi Eklenmiş`,
            notebookId: nb.id,
            notebookTitle: nb.title,
            pageIndex: pIdx,
            badge: 'Yer İmi',
            badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          });
        }

        // Text Annotations
        if (page.texts && page.texts.length > 0) {
          page.texts.forEach((txt, tIdx) => {
            if (txt.text.toLowerCase().includes(trimmed)) {
              items.push({
                id: `txt_${nb.id}_${page.id}_${tIdx}`,
                type: 'text',
                title: txt.text.slice(0, 80) + (txt.text.length > 80 ? '...' : ''),
                subtitle: `${nb.title} • Sayfa ${page.pageNumber} (Metin Kutusu)`,
                notebookId: nb.id,
                notebookTitle: nb.title,
                pageIndex: pIdx,
                badge: 'Metin Notu',
                badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
              });
            }
          });
        }

        // Tapes (Ezber Bantları)
        if (page.tapes && page.tapes.length > 0) {
          if (trimmed.includes('bant') || trimmed.includes('tape') || trimmed.includes('ezber')) {
            items.push({
              id: `tape_${nb.id}_${page.id}`,
              type: 'tape',
              title: `Sayfa ${page.pageNumber} (${page.tapes.length} Ezber Bandı)`,
              subtitle: `${nb.title} • Gizlenmiş çalışma alanları`,
              notebookId: nb.id,
              notebookTitle: nb.title,
              pageIndex: pIdx,
              badge: 'Ezber Bandı',
              badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
            });
          }
        }
      });

      // 3. Flashcards
      if (nb.flashcards && nb.flashcards.length > 0) {
        nb.flashcards.forEach((fc) => {
          if (
            fc.frontText.toLowerCase().includes(trimmed) ||
            fc.backText.toLowerCase().includes(trimmed)
          ) {
            const pageIndex = nb.pages.findIndex((p) => p.id === fc.pageId);
            items.push({
              id: `fc_${nb.id}_${fc.id}`,
              type: 'flashcard',
              title: fc.frontText,
              subtitle: `Cevap: ${fc.backText.slice(0, 60)}... (${nb.title})`,
              notebookId: nb.id,
              notebookTitle: nb.title,
              pageIndex: pageIndex >= 0 ? pageIndex : 0,
              badge: 'Flaş Kart',
              badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
            });
          }
        });
      }
    });

    return items;
  }, [notebooks, query]);

  // Filtered by selected category tab
  const filteredResults = useMemo(() => {
    if (filterType === 'all') return results;
    return results.filter((r) => r.type === filterType);
  }, [results, filterType]);

  const handleSelect = (item: SearchResultItem) => {
    if (activeNotebookId !== item.notebookId) {
      setActiveNotebook(item.notebookId);
    }
    setActivePageIndex(item.pageIndex);
    setSearchModalOpen(false);
  };

  // Keyboard navigation up / down / enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < filteredResults.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filteredResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredResults[selectedIndex]) {
        handleSelect(filteredResults[selectedIndex]);
      }
    }
  };

  if (!searchModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-start justify-center pt-20 px-4 select-none animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150">
        {/* Search Bar Input */}
        <div className="flex items-center px-5 py-4 border-b border-slate-800 gap-3">
          <Search size={20} className="text-indigo-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Defterler, el yazısı notları, yer imleri, flaş kartlar ara... (Cmd+K)"
            className="flex-1 bg-transparent text-sm sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
            >
              <X size={16} />
            </button>
          )}
          <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
            ESC
          </span>
        </div>

        {/* Filter Chips Bar */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-slate-800/80 bg-slate-900/60 overflow-x-auto text-xs">
          {[
            { id: 'all', label: 'Tümü' },
            { id: 'notebook', label: 'Defterler' },
            { id: 'text', label: 'Metin Notları' },
            { id: 'bookmark', label: 'Yer İmleri' },
            { id: 'tape', label: 'Ezber Bantları' },
            { id: 'flashcard', label: 'Flaş Kartlar' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setFilterType(cat.id as any);
                setSelectedIndex(0);
              }}
              className={`px-3 py-1 rounded-xl font-medium transition-colors shrink-0 ${
                filterType === cat.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-[50vh]">
          {filteredResults.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Search size={32} className="text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-300">Sonuç bulunamadı</p>
              <p className="text-xs text-slate-500 mt-1">
                "{query}" ile eşleşen bir not, yer imi veya defter yok.
              </p>
            </div>
          ) : (
            filteredResults.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-600/20 border border-indigo-500/40 shadow-sm'
                      : 'hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        item.type === 'bookmark'
                          ? 'bg-amber-500/10 text-amber-400'
                          : item.type === 'notebook'
                          ? 'bg-indigo-500/10 text-indigo-400'
                          : item.type === 'tape'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : item.type === 'flashcard'
                          ? 'bg-rose-500/10 text-rose-400'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {item.type === 'bookmark' ? (
                        <Star size={16} className="fill-amber-400" />
                      ) : item.type === 'notebook' ? (
                        <Book size={16} />
                      ) : item.type === 'tape' ? (
                        <Bandage size={16} />
                      ) : item.type === 'flashcard' ? (
                        <Brain size={16} />
                      ) : (
                        <FileText size={16} />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-semibold text-slate-100 truncate">
                          {item.title}
                        </span>
                        <span
                          className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${item.badgeColor}`}
                        >
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-3 shrink-0">
                    <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">
                      Aç
                    </span>
                    <ArrowRight
                      size={14}
                      className={isSelected ? 'text-indigo-400' : 'text-slate-600'}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div className="px-5 py-2.5 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-[11px] text-slate-400 select-none">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 font-mono text-[10px]">
                ↑
              </kbd>
              <kbd className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 font-mono text-[10px]">
                ↓
              </kbd>
              Gezin
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 font-mono text-[10px]">
                ↵
              </kbd>
              Aç
            </span>
          </div>

          <div className="flex items-center gap-1 text-indigo-400 font-medium">
            <Sparkles size={12} />
            <span>NotFree Küresel İndeks</span>
          </div>
        </div>
      </div>
    </div>
  );
};
