import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNotebookStore, extractYouTubeId } from '../../store/notebookStore';
import {
  CURATED_VIDEOS,
  YOUTUBE_CATEGORIES,
  POPULAR_SEARCH_CHIPS,
  CuratedVideo,
} from '../../data/youtubeCatalog';
import {
  Play,
  Clock,
  Bookmark,
  Trash2,
  ExternalLink,
  Maximize2,
  Minimize2,
  X,
  Search,
  Sparkles,
  Compass,
  Radio,
  Tv,
  Link2,
  ChevronRight,
  RefreshCw,
  History,
} from 'lucide-react';

export const YouTubePanel: React.FC = () => {
  const {
    youtube,
    toggleYouTube,
    setYouTubeUrl,
    setYouTubeVideo,
    setYouTubeSearchQuery,
    setYouTubeMode,
    addYouTubeBookmark,
    jumpToBookmark,
    deleteYouTubeBookmark,
    notebooks,
    activeNotebookId,
  } = useNotebookStore();

  const [activeTab, setActiveTab] = useState<'player' | 'explore'>(
    youtube.videoId || youtube.searchQuery ? 'player' : 'explore'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showDirectUrlInput, setShowDirectUrlInput] = useState(false);
  const [directUrl, setDirectUrl] = useState('');

  const [bookmarkTitle, setBookmarkTitle] = useState('');
  const [showAddBookmark, setShowAddBookmark] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const activeNotebook = notebooks.find((n) => n.id === activeNotebookId);
  const bookmarks = activeNotebook?.youtubeBookmarks || [];

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('notefree_yt_recent_searches');
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  const saveRecentSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 8);
      try {
        localStorage.setItem('notefree_yt_recent_searches', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    saveRecentSearch(query);

    // Check if query exactly matches or closely matches one of our curated videos
    const lower = query.toLowerCase();
    const exactMatch = CURATED_VIDEOS.find(
      (v) =>
        v.title.toLowerCase().includes(lower) ||
        v.tags.some((t) => t.toLowerCase().includes(lower)) ||
        v.channel.toLowerCase().includes(lower)
    );

    if (exactMatch) {
      setYouTubeVideo(exactMatch.id, exactMatch.title, exactMatch.channel);
    } else {
      // Use YouTube embed search playlist directly! No link needed!
      setYouTubeSearchQuery(query);
    }

    setActiveTab('player');
  };

  const handleSelectCuratedVideo = (video: CuratedVideo) => {
    setYouTubeVideo(video.id, video.title, video.channel);
    saveRecentSearch(video.title);
    setActiveTab('player');
  };

  const handleChipClick = (chipText: string) => {
    setSearchQuery(chipText);
    saveRecentSearch(chipText);

    const lower = chipText.toLowerCase();
    const match = CURATED_VIDEOS.find(
      (v) =>
        v.title.toLowerCase().includes(lower) ||
        v.tags.some((t) => t.toLowerCase().includes(lower)) ||
        v.channel.toLowerCase().includes(lower)
    );

    if (match) {
      setYouTubeVideo(match.id, match.title, match.channel);
    } else {
      setYouTubeSearchQuery(chipText);
    }
    setActiveTab('player');
  };

  const handleDirectUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directUrl.trim()) return;
    setYouTubeUrl(directUrl.trim());
    setDirectUrl('');
    setShowDirectUrlInput(false);
    setActiveTab('player');
  };

  const handleAddBookmark = (e: React.FormEvent) => {
    e.preventDefault();
    addYouTubeBookmark(bookmarkTitle.trim() || `Ders Notu [${formatTime(youtube.currentTime)}]`);
    setBookmarkTitle('');
    setShowAddBookmark(false);
  };

  const formatTime = (secs: number): string => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Filter curated videos based on category and live search query
  const filteredVideos = useMemo(() => {
    return CURATED_VIDEOS.filter((v) => {
      const matchesCat = selectedCategory === 'all' || v.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        v.title.toLowerCase().includes(q) ||
        v.channel.toLowerCase().includes(q) ||
        v.tags.some((t) => t.toLowerCase().includes(q));
      return matchesCat && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  if (!youtube.isOpen) return null;

  // Compute embed source: video ID or search playlist
  const embedSrc = youtube.videoId
    ? `https://www.youtube.com/embed/${youtube.videoId}?enablejsapi=1&autoplay=1&rel=0`
    : youtube.searchQuery
    ? `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(
        youtube.searchQuery
      )}&autoplay=1`
    : null;

  return (
    <div
      className={`flex flex-col bg-slate-900 border-r border-slate-800 text-slate-100 h-full z-20 shadow-2xl transition-all duration-200 select-none ${
        youtube.mode === 'floating'
          ? 'fixed bottom-6 right-6 w-96 h-[580px] rounded-2xl border ring-1 ring-slate-700/50 shadow-cyan-950/20 z-50'
          : 'relative h-full'
      }`}
      style={
        youtube.mode === 'split'
          ? { width: `${youtube.splitRatio * 100}%`, minWidth: '340px', maxWidth: '650px' }
          : undefined
      }
    >
      {/* 1. Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-800/90 border-b border-slate-700/60 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-red-600 flex items-center justify-center text-white shadow-sm shadow-red-600/30">
            <Play size={12} className="fill-white" />
          </div>
          <div>
            <span className="font-semibold text-xs tracking-wide text-slate-200 block leading-tight">
              YouTube Ders & Odak
            </span>
            <span className="text-[10px] text-slate-400">Not Senkronizasyonu</span>
          </div>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center bg-slate-950/60 p-0.5 rounded-lg border border-slate-700/60">
          <button
            onClick={() => setActiveTab('player')}
            className={`px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 transition-all ${
              activeTab === 'player'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tv size={12} />
            <span>Oynatıcı</span>
          </button>
          <button
            onClick={() => setActiveTab('explore')}
            className={`px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 transition-all ${
              activeTab === 'explore'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass size={12} />
            <span>Keşfet & Ara</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setYouTubeMode(youtube.mode === 'split' ? 'floating' : 'split')}
            title={youtube.mode === 'split' ? 'Kayan Pencere Yap (PiP)' : 'Bölünmüş Ekrana Al'}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 rounded-md transition-colors"
          >
            {youtube.mode === 'split' ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
          <button
            onClick={toggleYouTube}
            title="Kapat"
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700/60 rounded-md transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* 2. Main Content Area */}
      {activeTab === 'player' ? (
        /* --- PLAYER & BOOKMARKS TAB --- */
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Video IFrame Container */}
          <div className="relative w-full aspect-video bg-black flex items-center justify-center shrink-0">
            {embedSrc ? (
              <iframe
                ref={iframeRef}
                src={embedSrc}
                title="YouTube Player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            ) : (
              <div className="text-center p-6 text-slate-500">
                <Compass size={32} className="mx-auto mb-2 text-indigo-400 animate-pulse" />
                <p className="text-xs text-slate-300 font-medium">Henüz bir video seçilmedi</p>
                <button
                  onClick={() => setActiveTab('explore')}
                  className="mt-3 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg font-medium transition-all shadow-sm flex items-center gap-1.5 mx-auto"
                >
                  <Search size={12} />
                  <span>Ders veya Video Ara</span>
                </button>
              </div>
            )}
          </div>

          {/* Current Video Info Banner & Quick Action */}
          <div className="px-3 py-2 bg-slate-800/60 border-b border-slate-700/60 flex items-center justify-between gap-2 shrink-0">
            <div className="truncate flex-1">
              <p className="text-xs font-semibold text-slate-200 truncate">
                {youtube.videoTitle ||
                  (youtube.searchQuery ? `Arama: "${youtube.searchQuery}"` : 'Aktif Ders Videosu')}
              </p>
              {youtube.channelName && (
                <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block"></span>
                  {youtube.channelName}
                </p>
              )}
            </div>

            <button
              onClick={() => setActiveTab('explore')}
              className="text-[11px] px-2.5 py-1 bg-slate-700/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg flex items-center gap-1 transition-all shrink-0"
              title="Yeni konu veya video ara"
            >
              <Search size={11} />
              <span>Değiştir</span>
            </button>
          </div>

          {/* Bookmark & Note Action Bar */}
          <div className="p-2.5 bg-slate-850/80 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
            <button
              onClick={() => setShowAddBookmark(true)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium py-1.5 px-3 rounded-lg shadow-sm hover:shadow-indigo-600/20 transition-all"
            >
              <Clock size={13} />
              <span>Sayfaya Zaman Damgası Bağla</span>
            </button>

            {youtube.videoId && (
              <a
                href={`https://www.youtube.com/watch?v=${youtube.videoId}`}
                target="_blank"
                rel="noreferrer"
                title="YouTube'da Aç"
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-lg transition-colors border border-slate-700/50 shrink-0"
              >
                <ExternalLink size={13} />
              </a>
            )}
          </div>

          {/* Add Bookmark Pop-down Form */}
          {showAddBookmark && (
            <form
              onSubmit={handleAddBookmark}
              className="p-3 bg-slate-800 border-b border-slate-700 animate-in fade-in duration-150 shrink-0"
            >
              <div className="text-xs font-medium text-indigo-300 mb-1.5 flex items-center gap-1">
                <Bookmark size={12} />
                <span>Bu Anı Defterin Geçerli Sayfasına Bağla</span>
              </div>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  autoFocus
                  value={bookmarkTitle}
                  onChange={(e) => setBookmarkTitle(e.target.value)}
                  placeholder="Örn: Formül Tanımı, Soru 3 Çözümü..."
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-2.5 py-1 rounded-lg text-xs font-medium hover:bg-indigo-500 transition-colors"
                >
                  Ekle
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddBookmark(false)}
                  className="px-2 py-1 text-xs text-slate-400 hover:text-slate-200"
                >
                  İptal
                </button>
              </div>
            </form>
          )}

          {/* Bookmarks & Linked Notes List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              <span>Deftere Bağlı Video Notları ({bookmarks.length})</span>
              <span className="text-slate-500 text-[10px]">Tıkla & Sayfaya Git</span>
            </div>

            {bookmarks.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">
                <Bookmark size={20} className="mx-auto mb-1.5 opacity-40 text-slate-400" />
                <p className="font-medium text-slate-400">Henüz video bağlantısı eklenmedi.</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Dersi dinlerken önemli formül veya açıklamalarda 'Zaman Damgası Bağla' butonuna
                  basın.
                </p>
              </div>
            ) : (
              bookmarks.map((bm) => (
                <div
                  key={bm.id}
                  onClick={() => jumpToBookmark(bm)}
                  className="group flex items-center justify-between p-2.5 bg-slate-800/60 hover:bg-slate-750 border border-slate-750 hover:border-indigo-500/40 rounded-xl cursor-pointer transition-all hover:shadow-md"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-mono text-[11px] font-semibold border border-indigo-500/30 flex items-center gap-1 shrink-0">
                      <Play size={10} className="fill-indigo-300" />
                      {formatTime(bm.seconds)}
                    </span>
                    <div className="truncate">
                      <p className="text-xs font-medium text-slate-200 truncate group-hover:text-indigo-200 transition-colors">
                        {bm.title}
                      </p>
                      <p className="text-[10px] text-slate-400">Sayfa {bm.pageNumber}</p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteYouTubeBookmark(bm.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 rounded transition-all"
                    title="Sil"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* --- EXPLORE & IN-APP SEARCH TAB (NO LINK REQUIRED!) --- */
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search Box */}
          <div className="p-3 bg-slate-850 border-b border-slate-800 shrink-0">
            <form onSubmit={handleSearchSubmit} className="relative flex gap-1.5">
              <div className="relative flex-1">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Konu veya ders ara... (Örn: Limit, Lo-Fi, Fizik)"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1 shrink-0"
              >
                <span>Ara</span>
              </button>
            </form>

            {/* Popular Search Chips */}
            <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Sparkles size={10} className="text-indigo-400" />
                Trend:
              </span>
              {POPULAR_SEARCH_CHIPS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleChipClick(chip)}
                  className="px-2 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-indigo-200 text-[10px] font-medium transition-colors border border-slate-700/60 shrink-0 whitespace-nowrap"
                >
                  #{chip}
                </button>
              ))}
            </div>

            {/* Direct URL Accordion (Optional, secondary) */}
            <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
              <button
                onClick={() => setShowDirectUrlInput(!showDirectUrlInput)}
                className="text-slate-400 hover:text-slate-200 flex items-center gap-1 text-[10px] transition-colors"
              >
                <Link2 size={11} />
                <span>Özel bir YouTube linkiniz var mı?</span>
              </button>

              {recentSearches.length > 0 && (
                <button
                  onClick={() => {
                    localStorage.removeItem('notefree_yt_recent_searches');
                    setRecentSearches([]);
                  }}
                  className="text-[10px] text-slate-500 hover:text-red-400 transition-colors"
                >
                  Geçmişi Temizle
                </button>
              )}
            </div>

            {showDirectUrlInput && (
              <form
                onSubmit={handleDirectUrlSubmit}
                className="mt-2 flex gap-1.5 animate-in fade-in duration-150"
              >
                <input
                  type="text"
                  value={directUrl}
                  onChange={(e) => setDirectUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-500 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                >
                  Aç
                </button>
              </form>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="px-3 py-2 bg-slate-900 border-b border-slate-800/80 flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0">
            {YOUTUBE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-all shrink-0 whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-slate-800 text-indigo-300 border border-indigo-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Curated Video Feed & Results */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {/* If user typed a search query that isn't in curated catalog, offer 1-click YouTube Search Embed */}
            {searchQuery.trim() && (
              <div
                onClick={() => handleSearchSubmit()}
                className="p-3 rounded-xl bg-gradient-to-r from-indigo-900/40 to-purple-900/30 border border-indigo-500/40 hover:border-indigo-400 cursor-pointer transition-all flex items-center justify-between group shadow-sm"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-300 shrink-0">
                    <Search size={15} />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-semibold text-slate-100 group-hover:text-indigo-200 transition-colors">
                      YouTube'da Canlı Ara: "{searchQuery.trim()}"
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Tüm YouTube üzerinde arama oynatma listesini doğrudan başlat
                    </p>
                  </div>
                </div>
                <ChevronRight
                  size={15}
                  className="text-indigo-400 group-hover:translate-x-0.5 transition-transform shrink-0"
                />
              </div>
            )}

            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Öne Çıkan Ders & Odak Videoları</span>
              <span className="text-slate-500 text-[10px]">{filteredVideos.length} Video</span>
            </div>

            {filteredVideos.map((video) => (
              <div
                key={video.id}
                onClick={() => handleSelectCuratedVideo(video)}
                className="group p-2 rounded-xl bg-slate-850/80 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 cursor-pointer transition-all flex gap-3 shadow-sm hover:shadow-md"
              >
                {/* Thumbnail Container */}
                <div className="relative w-28 aspect-video rounded-lg overflow-hidden bg-slate-950 shrink-0 border border-slate-700/50">
                  <img
                    src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`}
                    alt={video.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Play Overlay */}
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 flex items-center justify-center transition-colors">
                    <div className="w-6 h-6 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <Play size={10} className="fill-white ml-0.5" />
                    </div>
                  </div>
                  {/* Duration Badge */}
                  <span className="absolute bottom-1 right-1 bg-black/80 text-[9px] font-mono font-medium text-slate-200 px-1 py-0.2 rounded">
                    {video.duration}
                  </span>
                </div>

                {/* Video Info */}
                <div className="flex-1 flex flex-col justify-between overflow-hidden">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200 group-hover:text-indigo-200 transition-colors line-clamp-2 leading-snug">
                      {video.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate flex items-center gap-1">
                      <span>{video.channel}</span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-800">
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                      {video.categoryLabel}
                    </span>
                    <span className="text-[10px] font-medium text-indigo-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      Başlat
                      <ChevronRight size={10} />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
