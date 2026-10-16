import React, { useState, useEffect, useRef } from 'react';
import { useNotebookStore } from '../../store/notebookStore';
import {
  Zap,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  X,
  Play,
  Pause,
  RotateCcw,
  ScrollText,
  Film,
  Maximize,
  Minimize,
  Tv,
  Edit3,
  Check,
  Eye,
  Type,
  Clock,
  Sparkles,
} from 'lucide-react';
import { triggerHaptic } from '../../engine/hapticFeedback';

const LASER_COLORS = [
  { label: 'Kırmızı', color: '#ef4444' },
  { label: 'Neon Yeşil', color: '#22c55e' },
  { label: 'Elektrik Mavisi', color: '#06b6d4' },
  { label: 'Mor', color: '#a855f7' },
];

const SPOTLIGHT_SIZES = [
  { label: 'Küçük', radius: 65 },
  { label: 'Orta', radius: 95 },
  { label: 'Geniş', radius: 140 },
];

export const PresentationHUD: React.FC = () => {
  const {
    presentationMode,
    setPresentationMode,
    notebooks,
    activeNotebookId,
    activePageIndex,
    setActivePageIndex,
    toolSettings,
    setLaserStyle,
    setLaserColor,
    setSpotlightRadius,
    speakerNotesOpen,
    setSpeakerNotesOpen,
    updateCurrentPageSpeakerNotes,
    filmstripOpen,
    setFilmstripOpen,
    presentationTimer,
    isPresentationTimerRunning,
    startPresentationTimer,
    pausePresentationTimer,
    resetPresentationTimer,
    tickPresentationTimer,
  } = useNotebookStore();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [prompterFontSize, setPrompterFontSize] = useState(16);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState<number>(1);
  const [tempNotes, setTempNotes] = useState('');

  const prompterContentRef = useRef<HTMLDivElement | null>(null);

  const activeNotebook = notebooks.find((n) => n.id === activeNotebookId);
  const totalPages = activeNotebook?.pages.length || 1;
  const currentPage = activeNotebook?.pages[activePageIndex];

  // Sync temp notes when slide changes
  useEffect(() => {
    setTempNotes(currentPage?.speakerNotes || '');
    setIsEditingNotes(false);
    setIsAutoScrolling(false);
  }, [activePageIndex, currentPage?.speakerNotes]);

  // Presentation Timer Ticker (1 second interval)
  useEffect(() => {
    if (!presentationMode) return;
    const interval = setInterval(() => {
      tickPresentationTimer();
    }, 1000);
    return () => clearInterval(interval);
  }, [presentationMode, tickPresentationTimer]);

  // Teleprompter Auto-Scroll Engine
  useEffect(() => {
    if (!isAutoScrolling || !prompterContentRef.current) return;
    const el = prompterContentRef.current;

    const scrollInterval = setInterval(() => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight) {
        setIsAutoScrolling(false);
      } else {
        el.scrollTop += scrollSpeed * 0.75;
      }
    }, 30);

    return () => clearInterval(scrollInterval);
  }, [isAutoScrolling, scrollSpeed]);

  // Format stopwatch seconds (MM:SS)
  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Open clean audience window on secondary display
  const openAudienceWindow = () => {
    triggerHaptic('medium');
    const width = 1280;
    const height = 720;
    const left = window.screen.width ? (window.screen.width - width) / 2 : 100;
    const top = window.screen.height ? (window.screen.height - height) / 2 : 100;

    const audienceWin = window.open(
      `${window.location.origin}${window.location.pathname}?mode=audience&notebook=${activeNotebookId}`,
      'NotefreeAudienceScreen',
      `width=${width},height=${height},top=${top},left=${left},menubar=no,toolbar=no,location=no,status=no`
    );

    if (audienceWin) {
      audienceWin.focus();
    }
  };

  // Save Speaker Notes
  const handleSaveNotes = () => {
    updateCurrentPageSpeakerNotes(tempNotes);
    setIsEditingNotes(false);
    triggerHaptic('light');
  };

  // Word count & estimated read time
  const wordCount = (tempNotes || '').trim() ? tempNotes.trim().split(/\s+/).length : 0;
  const estimatedSeconds = Math.round((wordCount / 130) * 60); // Average speaking pace ~130 wpm

  if (!presentationMode) return null;

  const currentLaserColor = toolSettings.laserColor || '#ef4444';
  const currentSpotRadius = toolSettings.spotlightRadius || 95;

  return (
    <>
      {/* 1. TOP FLOATING PRESENTER HUD */}
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 backdrop-blur-2xl border border-indigo-500/40 rounded-2xl shadow-2xl p-1.5 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 select-none max-w-[96vw] overflow-x-auto">
        {/* Laser Style Switcher (Trail vs Spotlight) */}
        <div className="flex bg-slate-800 p-0.5 rounded-xl text-xs shrink-0">
          <button
            onClick={() => {
              setLaserStyle('trail');
              triggerHaptic('light');
            }}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              toolSettings.laserStyle !== 'spotlight'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Kuyruklu Neon Lazer Çizgisi"
          >
            <Zap size={13} />
            <span className="hidden sm:inline">İz Lazer</span>
          </button>

          <button
            onClick={() => {
              setLaserStyle('spotlight');
              triggerHaptic('light');
            }}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              toolSettings.laserStyle === 'spotlight'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Karanlık Sahne Spot Işığı"
          >
            <Lightbulb size={13} />
            <span className="hidden sm:inline">Spot Işığı</span>
          </button>
        </div>

        {/* Color Palette (Red, Green, Cyan, Purple) */}
        <div className="hidden md:flex items-center gap-1.5 px-1 bg-slate-800/60 py-1 rounded-xl shrink-0">
          {LASER_COLORS.map((c) => (
            <button
              key={c.color}
              onClick={() => {
                setLaserColor(c.color);
                triggerHaptic('light');
              }}
              style={{ backgroundColor: c.color }}
              className={`w-4.5 h-4.5 rounded-full border-2 transition-transform ${
                currentLaserColor === c.color ? 'border-white scale-110 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
              title={c.label}
            />
          ))}
        </div>

        {/* Spotlight Size Selector (if spotlight mode) */}
        {toolSettings.laserStyle === 'spotlight' && (
          <div className="hidden lg:flex items-center gap-1 bg-slate-800 p-0.5 rounded-xl text-[11px] font-semibold text-slate-300 shrink-0">
            {SPOTLIGHT_SIZES.map((sz) => (
              <button
                key={sz.radius}
                onClick={() => {
                  setSpotlightRadius(sz.radius);
                  triggerHaptic('light');
                }}
                className={`px-2 py-0.5 rounded-lg transition-colors ${
                  currentSpotRadius === sz.radius
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {sz.label}
              </button>
            ))}
          </div>
        )}

        <div className="w-px h-4 bg-slate-750 shrink-0" />

        {/* Presentation Stopwatch / Timer */}
        <div className="flex items-center gap-1.5 bg-slate-800/80 px-2 py-1 rounded-xl text-xs font-mono text-slate-200 border border-slate-750 shrink-0">
          <Clock size={12} className={isPresentationTimerRunning ? 'text-emerald-400 animate-pulse' : 'text-slate-400'} />
          <span className="font-bold">{formatTimer(presentationTimer)}</span>
          <button
            onClick={() => {
              if (isPresentationTimerRunning) {
                pausePresentationTimer();
              } else {
                startPresentationTimer();
              }
              triggerHaptic('light');
            }}
            className="p-1 hover:text-white text-slate-400 rounded transition-colors"
            title={isPresentationTimerRunning ? 'Zamanlayıcıyı Duraklat' : 'Zamanlayıcıyı Başlat'}
          >
            {isPresentationTimerRunning ? <Pause size={11} /> : <Play size={11} />}
          </button>
          <button
            onClick={() => {
              resetPresentationTimer();
              triggerHaptic('light');
            }}
            className="p-1 hover:text-white text-slate-400 rounded transition-colors"
            title="Sıfırla"
          >
            <RotateCcw size={11} />
          </button>
        </div>

        <div className="w-px h-4 bg-slate-750 shrink-0" />

        {/* Slide Navigation Stepper */}
        <div className="flex items-center gap-1 text-xs shrink-0">
          <button
            onClick={() => {
              setActivePageIndex(Math.max(0, activePageIndex - 1));
              triggerHaptic('light');
            }}
            disabled={activePageIndex === 0}
            className="p-1 text-slate-300 hover:text-white disabled:opacity-30 rounded-lg hover:bg-slate-800"
            title="Önceki Slayt (←)"
          >
            <ChevronLeft size={16} />
          </button>

          <span className="font-mono text-slate-200 px-1 font-semibold text-xs">
            {activePageIndex + 1} / {totalPages}
          </span>

          <button
            onClick={() => {
              setActivePageIndex(Math.min(totalPages - 1, activePageIndex + 1));
              triggerHaptic('light');
            }}
            disabled={activePageIndex >= totalPages - 1}
            className="p-1 text-slate-300 hover:text-white disabled:opacity-30 rounded-lg hover:bg-slate-800"
            title="Sonraki Slayt (→)"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="w-px h-4 bg-slate-750 shrink-0" />

        {/* Teleprompter / Speaker Notes Toggle */}
        <button
          onClick={() => {
            setSpeakerNotesOpen(!speakerNotesOpen);
            triggerHaptic('light');
          }}
          className={`p-1.5 rounded-xl transition-all relative ${
            speakerNotesOpen
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Konuşmacı Notları & Teleprompter (Gizli Notlar)"
        >
          <ScrollText size={15} />
          {currentPage?.speakerNotes && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400" />
          )}
        </button>

        {/* Filmstrip / Slayt Şeridi Toggle */}
        <button
          onClick={() => {
            setFilmstripOpen(!filmstripOpen);
            triggerHaptic('light');
          }}
          className={`p-1.5 rounded-xl transition-all ${
            filmstripOpen
              ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Slayt Şeridi (Küçük Resimler)"
        >
          <Film size={15} />
        </button>

        {/* Audience Second Screen Button */}
        <button
          onClick={openAudienceWindow}
          className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded-xl transition-colors"
          title="İkinci Ekran / Projeksiyon Çıkışı Aç (Audience Window)"
        >
          <Tv size={15} />
        </button>

        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          title={isFullscreen ? 'Tam Ekrandan Çık' : 'Tam Ekrana Geç'}
        >
          {isFullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
        </button>

        <div className="w-px h-4 bg-slate-750 shrink-0" />

        {/* Exit Presentation Mode */}
        <button
          onClick={() => {
            setPresentationMode(false);
            setSpeakerNotesOpen(false);
            setFilmstripOpen(false);
            triggerHaptic('medium');
          }}
          className="flex items-center gap-1 px-3 py-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold transition-colors shrink-0"
          title="Sunumu Bitir (Esc)"
        >
          <X size={14} />
          <span className="hidden sm:inline">Sunumu Bitir</span>
        </button>
      </div>

      {/* 2. TELEPROMPTER & SPEAKER NOTES DOCK (Presenter-Only Private Window) */}
      {speakerNotesOpen && (
        <div className="fixed right-4 bottom-20 w-88 max-w-[92vw] max-h-[65vh] z-50 bg-slate-900/95 backdrop-blur-2xl border border-amber-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-3 select-none">
          {/* Notes Header */}
          <div className="px-4 py-3 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <ScrollText size={15} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Konuşmacı Teleprompter</span>
                  <span className="text-[10px] text-amber-400 font-mono font-medium">
                    (Sayfa {activePageIndex + 1})
                  </span>
                </h4>
                <p className="text-[10px] text-slate-400">
                  {wordCount} kelime • ~{estimatedSeconds} sn konuşma
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsEditingNotes(!isEditingNotes)}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  isEditingNotes
                    ? 'bg-amber-500 text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title={isEditingNotes ? 'Okuma Moduna Geç' : 'Notları Düzenle'}
              >
                {isEditingNotes ? <Check size={14} /> : <Edit3 size={14} />}
              </button>

              <button
                onClick={() => setSpeakerNotesOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Teleprompter Controls (Font Size, Auto-Scroll) */}
          {!isEditingNotes && (
            <div className="px-4 py-2 bg-slate-850/60 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
              {/* Font Sizer */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPrompterFontSize(Math.max(12, prompterFontSize - 2))}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-750 rounded text-slate-300 text-[11px]"
                  title="Yazıyı Küçült"
                >
                  A-
                </button>
                <span className="text-[11px] font-mono text-slate-400 px-1">{prompterFontSize}px</span>
                <button
                  onClick={() => setPrompterFontSize(Math.min(28, prompterFontSize + 2))}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-750 rounded text-slate-300 text-[11px]"
                  title="Yazıyı Büyüt"
                >
                  A+
                </button>
              </div>

              {/* Auto Scroll Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsAutoScrolling(!isAutoScrolling)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                    isAutoScrolling
                      ? 'bg-amber-500 text-slate-950 font-bold shadow'
                      : 'bg-slate-800 hover:bg-slate-750 text-slate-300'
                  }`}
                >
                  {isAutoScrolling ? <Pause size={12} /> : <Play size={12} />}
                  <span>Otomatik Kaydır</span>
                </button>

                {isAutoScrolling && (
                  <button
                    onClick={() => setScrollSpeed(scrollSpeed === 1 ? 2 : scrollSpeed === 2 ? 3 : 1)}
                    className="px-1.5 py-1 bg-slate-800 hover:bg-slate-750 text-[11px] rounded text-amber-300 font-mono"
                    title="Kaydırma Hızı"
                  >
                    {scrollSpeed}x
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Notes Body */}
          <div className="flex-1 overflow-y-auto p-4" ref={prompterContentRef}>
            {isEditingNotes ? (
              <div className="space-y-3">
                <textarea
                  value={tempNotes}
                  onChange={(e) => setTempNotes(e.target.value)}
                  placeholder="Bu slayt için konuşmacı notlarınızı, vurgulamak istediğiniz terimleri veya ipuçlarını buraya yazın..."
                  className="w-full h-44 bg-slate-950/80 border border-slate-750 rounded-2xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 font-sans leading-relaxed resize-none"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setTempNotes(currentPage?.speakerNotes || '');
                      setIsEditingNotes(false);
                    }}
                    className="px-3 py-1 text-xs text-slate-400 hover:text-white"
                  >
                    Vazgeç
                  </button>
                  <button
                    onClick={handleSaveNotes}
                    className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-amber-500/20"
                  >
                    Kaydet
                  </button>
                </div>
              </div>
            ) : (
              <div
                style={{ fontSize: `${prompterFontSize}px`, lineHeight: 1.6 }}
                className="text-slate-100 font-sans whitespace-pre-wrap select-text selection:bg-amber-500/30"
              >
                {tempNotes ? (
                  tempNotes
                ) : (
                  <div className="text-center py-8 text-slate-500 text-xs">
                    <p className="font-medium text-slate-400">Bu slayt için konuşmacı notu yok.</p>
                    <p className="text-[11px] mt-1 text-slate-500">
                      Yukarıdaki kalem ikonuna tıklayarak sunum notlarınızı ekleyebilirsiniz.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. SLIDE FILMSTRIP (Bottom Thumbnail Reel) */}
      {filmstripOpen && (
        <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 backdrop-blur-2xl border border-indigo-500/40 rounded-3xl shadow-2xl p-2.5 flex items-center gap-2 max-w-[92vw] overflow-x-auto animate-in fade-in slide-in-from-bottom-2 select-none">
          <div className="flex items-center gap-2 px-1">
            {(activeNotebook?.pages || []).map((page, idx) => {
              const isCurrent = idx === activePageIndex;
              return (
                <button
                  key={page.id}
                  onClick={() => {
                    setActivePageIndex(idx);
                    triggerHaptic('light');
                  }}
                  className={`group relative shrink-0 w-24 h-16 rounded-xl border-2 transition-all overflow-hidden flex flex-col justify-between p-1.5 text-left bg-slate-800/80 ${
                    isCurrent
                      ? 'border-indigo-500 ring-2 ring-indigo-500/40 bg-indigo-950/40 scale-105 shadow-lg'
                      : 'border-slate-750 hover:border-slate-600 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-mono font-bold text-slate-300 bg-slate-900/90 px-1 rounded">
                      {idx + 1}
                    </span>
                    {page.isBookmarked && (
                      <span className="text-[10px] text-amber-400">★</span>
                    )}
                  </div>

                  <span className="text-[10px] font-medium text-slate-200 truncate w-full">
                    {page.title || `Slayt ${idx + 1}`}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setFilmstripOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 shrink-0 ml-1"
            title="Şeridi Gizle"
          >
            <X size={15} />
          </button>
        </div>
      )}
    </>
  );
};
