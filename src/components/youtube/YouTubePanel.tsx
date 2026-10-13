import React, { useState, useRef, useEffect } from 'react';
import { useNotebookStore, extractYouTubeId } from '../../store/notebookStore';
import {
  Play,
  Pause,
  Clock,
  Bookmark,
  Trash2,
  ExternalLink,
  Maximize2,
  Minimize2,
  X,
  Camera,
  Plus,
} from 'lucide-react';

export const YouTubePanel: React.FC = () => {
  const {
    youtube,
    toggleYouTube,
    setYouTubeUrl,
    setYouTubeCurrentTime,
    setYouTubePlaying,
    setYouTubeMode,
    addYouTubeBookmark,
    jumpToBookmark,
    deleteYouTubeBookmark,
    notebooks,
    activeNotebookId,
  } = useNotebookStore();

  const [inputUrl, setInputUrl] = useState(youtube.url);
  const [bookmarkTitle, setBookmarkTitle] = useState('');
  const [showAddBookmark, setShowAddBookmark] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const activeNotebook = notebooks.find((n) => n.id === activeNotebookId);
  const bookmarks = activeNotebook?.youtubeBookmarks || [];

  // Update input when store URL changes
  useEffect(() => {
    setInputUrl(youtube.url);
  }, [youtube.url]);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;
    setYouTubeUrl(inputUrl.trim());
  };

  const handleAddBookmark = (e: React.FormEvent) => {
    e.preventDefault();
    addYouTubeBookmark(bookmarkTitle.trim() || `Video Notu [${formatTime(youtube.currentTime)}]`);
    setBookmarkTitle('');
    setShowAddBookmark(false);
  };

  const formatTime = (secs: number): string => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!youtube.isOpen) return null;

  return (
    <div
      className={`flex flex-col bg-slate-900 border-r border-slate-800 text-slate-100 h-full z-20 shadow-2xl transition-all duration-200 ${
        youtube.mode === 'floating'
          ? 'fixed bottom-6 right-6 w-96 h-[540px] rounded-2xl border ring-1 ring-slate-700/50 shadow-cyan-950/20'
          : 'relative h-full'
      }`}
      style={
        youtube.mode === 'split'
          ? { width: `${youtube.splitRatio * 100}%`, minWidth: '340px', maxWidth: '650px' }
          : undefined
      }
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-800/80 border-b border-slate-700/60 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-red-600 flex items-center justify-center text-white shadow-sm shadow-red-600/30">
            <Play size={12} className="fill-white" />
          </div>
          <span className="font-semibold text-xs tracking-wide text-slate-200">
            YouTube Not Senkronizasyonu
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setYouTubeMode(youtube.mode === 'split' ? 'floating' : 'split')}
            title={youtube.mode === 'split' ? 'Kayan Pencere Yap (PiP)' : 'Bölünmüş Ekrana Al'}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 rounded-md transition-colors"
          >
            {youtube.mode === 'split' ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          <button
            onClick={toggleYouTube}
            title="Kapat"
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700/60 rounded-md transition-colors"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* URL Input Bar */}
      <form onSubmit={handleUrlSubmit} className="p-2.5 bg-slate-800/40 border-b border-slate-800 flex gap-1.5">
        <input
          type="text"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          placeholder="YouTube video linki yapıştırın..."
          className="flex-1 bg-slate-950/80 border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/30 transition-all"
        />
        <button
          type="submit"
          className="bg-red-600 hover:bg-red-500 text-white font-medium text-xs px-3 py-1.5 rounded-lg shadow-sm transition-colors flex items-center gap-1"
        >
          Yükle
        </button>
      </form>

      {/* Video IFrame Container */}
      <div className="relative w-full aspect-video bg-black flex items-center justify-center">
        {youtube.videoId ? (
          <iframe
            ref={iframeRef}
            src={`https://www.youtube.com/embed/${youtube.videoId}?enablejsapi=1&autoplay=0`}
            title="YouTube Player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
          />
        ) : (
          <div className="text-center p-6 text-slate-500">
            <Play size={32} className="mx-auto mb-2 text-slate-600" />
            <p className="text-xs">Lütfen geçerli bir YouTube video linki girin</p>
          </div>
        )}
      </div>

      {/* Action Buttons: Add Timestamp Bookmark & Snapshot */}
      <div className="p-3 bg-slate-800/30 border-b border-slate-800 flex items-center justify-between gap-2">
        <button
          onClick={() => setShowAddBookmark(true)}
          className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600/90 hover:bg-indigo-600 text-white text-xs font-medium py-1.5 px-3 rounded-lg shadow-sm hover:shadow-indigo-600/20 transition-all"
        >
          <Clock size={14} />
          <span>Zaman Damgası Bağla</span>
        </button>

        <a
          href={`https://www.youtube.com/watch?v=${youtube.videoId || ''}`}
          target="_blank"
          rel="noreferrer"
          title="YouTube'da Aç"
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-lg transition-colors border border-slate-700/50"
        >
          <ExternalLink size={14} />
        </a>
      </div>

      {/* Add Bookmark Form */}
      {showAddBookmark && (
        <form onSubmit={handleAddBookmark} className="p-3 bg-slate-850 border-b border-slate-700 animate-in fade-in duration-150">
          <div className="text-xs font-medium text-indigo-300 mb-1.5 flex items-center gap-1">
            <Bookmark size={12} />
            <span>Bu Ana Bir Not Başlığı Belirleyin</span>
          </div>
          <div className="flex gap-1.5">
            <input
              type="text"
              autoFocus
              value={bookmarkTitle}
              onChange={(e) => setBookmarkTitle(e.target.value)}
              placeholder="Örn: Formül Tanımı, Soru Çözümü..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="bg-indigo-600 text-white px-2.5 py-1 rounded-lg text-xs font-medium hover:bg-indigo-500 transition-colors"
            >
              Kaydet
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
          <span>Kayıtlı Video Notları ({bookmarks.length})</span>
          <span className="text-slate-500">Tıkla & Git</span>
        </div>

        {bookmarks.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-xs">
            <Bookmark size={20} className="mx-auto mb-1.5 opacity-40" />
            <p>Henüz video zaman damgası eklenmedi.</p>
            <p className="text-[11px] text-slate-600 mt-1">
              Dersi dinlerken önemli yerlerde 'Zaman Damgası Bağla' butonuna basın.
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
  );
};
