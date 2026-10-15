import React, { useEffect, useRef, useState } from 'react';
import { useNotebookStore } from '../../store/notebookStore';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  Coffee,
  Brain,
  Timer,
  CheckCircle2,
} from 'lucide-react';
import { AMBIENT_SOUNDS, AmbientSoundType } from '../../services/ambientAudioService';

export const PomodoroBarWidget: React.FC = () => {
  const {
    pomodoroOpen,
    setPomodoroOpen,
    pomodoroRunning,
    setPomodoroRunning,
    pomodoroMode,
    setPomodoroMode,
    pomodoroTimeLeft,
    tickPomodoro,
    resetPomodoro,
    activeAmbience,
    ambienceVolume,
    toggleAmbience,
    setAmbienceVolume,
  } = useNotebookStore();

  const [activeTab, setActiveTab] = useState<'timer' | 'ambient'>('timer');
  const widgetRef = useRef<HTMLDivElement>(null);

  // Interval timer tick
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (pomodoroRunning) {
      interval = setInterval(() => {
        tickPomodoro();
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [pomodoroRunning, tickPomodoro]);

  // Close dropdown when clicked outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(e.target as Node)) {
        setPomodoroOpen(false);
      }
    };
    if (pomodoroOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [pomodoroOpen, setPomodoroOpen]);

  // Format seconds to MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="relative select-none" ref={widgetRef}>
      {/* 1. Header Bar Pill Button */}
      <button
        onClick={() => setPomodoroOpen(!pomodoroOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all border shadow-sm ${
          pomodoroRunning
            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
            : activeAmbience
            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
            : 'bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border-slate-700/60'
        }`}
        title="Dahili Pomodoro Sayacı ve Ambiyans Odak Sesleri"
      >
        <span className="text-sm">
          {pomodoroMode === 'work' ? '🍅' : '☕'}
        </span>
        <span className="font-mono text-[11px] font-bold">
          {formatTime(pomodoroTimeLeft)}
        </span>
        {activeAmbience && (
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
        )}
      </button>

      {/* 2. Floating Dropdown Modal */}
      {pomodoroOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 sm:w-88 bg-slate-900 border border-slate-750 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150 text-white">
          {/* Header with Tabs */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-xl border border-slate-700">
              <button
                onClick={() => setActiveTab('timer')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === 'timer'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Timer size={13} />
                <span>Pomodoro</span>
              </button>
              <button
                onClick={() => setActiveTab('ambient')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === 'ambient'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Brain size={13} />
                <span>Ambiyans</span>
                {activeAmbience && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
              </button>
            </div>

            <button
              onClick={() => setPomodoroOpen(false)}
              className="p-1 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {/* TAB 1: Pomodoro Timer View */}
          {activeTab === 'timer' && (
            <div className="pt-3">
              {/* Mode Selectors */}
              <div className="grid grid-cols-3 gap-1.5 mb-4">
                <button
                  onClick={() => setPomodoroMode('work')}
                  className={`py-1.5 px-2 rounded-xl text-center text-xs font-medium transition-colors ${
                    pomodoroMode === 'work'
                      ? 'bg-rose-600/30 text-rose-300 border border-rose-500/50 font-bold'
                      : 'bg-slate-800/70 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  🍅 Çalışma (25m)
                </button>
                <button
                  onClick={() => setPomodoroMode('shortBreak')}
                  className={`py-1.5 px-2 rounded-xl text-center text-xs font-medium transition-colors ${
                    pomodoroMode === 'shortBreak'
                      ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 font-bold'
                      : 'bg-slate-800/70 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  ☕ Kısa (5m)
                </button>
                <button
                  onClick={() => setPomodoroMode('longBreak')}
                  className={`py-1.5 px-2 rounded-xl text-center text-xs font-medium transition-colors ${
                    pomodoroMode === 'longBreak'
                      ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50 font-bold'
                      : 'bg-slate-800/70 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  🌴 Uzun (15m)
                </button>
              </div>

              {/* Large Digital Clock Display */}
              <div className="flex flex-col items-center justify-center py-3 bg-slate-950/60 rounded-2xl border border-slate-800 mb-4 shadow-inner">
                <span className="font-mono text-4xl font-extrabold tracking-widest text-slate-100">
                  {formatTime(pomodoroTimeLeft)}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">
                  {pomodoroMode === 'work' ? 'Derin Odaklanma Modu' : 'Dinlenme Molası'}
                </span>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={resetPomodoro}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white transition-colors"
                  title="Sıfırla"
                >
                  <RotateCcw size={16} />
                </button>

                <button
                  onClick={() => setPomodoroRunning(!pomodoroRunning)}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg ${
                    pomodoroRunning
                      ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                  }`}
                >
                  {pomodoroRunning ? (
                    <>
                      <Pause size={16} />
                      <span>Duraklat</span>
                    </>
                  ) : (
                    <>
                      <Play size={16} className="fill-white" />
                      <span>Başlat</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Offline Web Audio Ambient Studio */}
          {activeTab === 'ambient' && (
            <div className="pt-3">
              <p className="text-[11px] text-slate-400 mb-2.5">
                Tarayıcı tarafından tamamen çevrimdışı üretilen çalışma sesleri:
              </p>

              {/* Sound list */}
              <div className="flex flex-col gap-1.5 mb-3">
                {AMBIENT_SOUNDS.map((sound) => {
                  const isPlaying = activeAmbience === sound.id;
                  return (
                    <button
                      key={sound.id}
                      onClick={() => toggleAmbience(sound.id)}
                      className={`flex items-center justify-between p-2 rounded-xl text-left transition-all border ${
                        isPlaying
                          ? 'bg-indigo-600/20 border-indigo-500/50 text-white shadow-md'
                          : 'bg-slate-800/60 border-slate-750 text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">{sound.icon}</span>
                        <div>
                          <span className="text-xs font-bold block">{sound.name}</span>
                          <span className="text-[10px] text-slate-400">{sound.description}</span>
                        </div>
                      </div>

                      {isPlaying ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Çalıyor 🔊
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500">Seç</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Volume Slider */}
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5">
                  <span className="flex items-center gap-1">
                    <Volume2 size={12} />
                    <span>Ambiyans Ses Seviyesi:</span>
                  </span>
                  <span className="font-mono font-bold text-slate-200">
                    {Math.round(ambienceVolume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={ambienceVolume}
                  onChange={(e) => setAmbienceVolume(parseFloat(e.target.value))}
                  className="w-full h-1.5 accent-indigo-500 rounded-lg cursor-pointer bg-slate-700"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
