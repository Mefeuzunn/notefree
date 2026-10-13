import React, { useState, useRef, useEffect } from 'react';
import { useNotebookStore } from '../../store/notebookStore';
import {
  Mic,
  Square,
  Play,
  Pause,
  Volume2,
  Sparkles,
  FileText,
  Copy,
  Check,
  Plus,
  X,
  Languages,
} from 'lucide-react';

export const AudioPlayerBar: React.FC = () => {
  const {
    activeNotebookId,
    notebooks,
    isRecordingAudio,
    recordingDurationMs,
    startAudioRecording,
    stopAudioRecording,
    audioPlaybackTimeMs,
    setAudioPlaybackTimeMs,
    audioPlaying,
    setAudioPlaying,
    liveTranscript,
    isTranscribing,
    startSpeechTranscription,
    stopSpeechTranscription,
    clearSpeechTranscript,
    addTranscriptToCurrentPageAsNote,
  } = useNotebookStore();

  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [transcriptOpen, setTranscriptOpen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const activeNotebook = notebooks.find((n) => n.id === activeNotebookId);
  const currentRecording = activeNotebook?.audioRecordings?.[0];

  const formatMs = (ms: number): string => {
    const totalSecs = Math.floor(ms / 1000);
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const toggleRecording = async () => {
    if (isRecordingAudio) {
      await stopAudioRecording();
    } else {
      await startAudioRecording();
      setTranscriptOpen(true);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || !currentRecording?.audioDataUrl) return;
    if (audioPlaying) {
      audioRef.current.pause();
      setAudioPlaying(false);
    } else {
      audioRef.current.play();
      setAudioPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const ms = Math.floor(audioRef.current.currentTime * 1000);
    setAudioPlaybackTimeMs(ms);
  };

  // Synchronize audio element currentTime when store audioPlaybackTimeMs changes
  useEffect(() => {
    if (audioRef.current && Math.abs(audioRef.current.currentTime * 1000 - audioPlaybackTimeMs) > 350) {
      audioRef.current.currentTime = audioPlaybackTimeMs / 1000;
    }
  }, [audioPlaybackTimeMs]);

  // Synchronize play/pause state from store
  useEffect(() => {
    if (!audioRef.current || !currentRecording?.audioDataUrl) return;
    if (audioPlaying && audioRef.current.paused) {
      audioRef.current.play().catch(() => {});
    } else if (!audioPlaying && !audioRef.current.paused) {
      audioRef.current.pause();
    }
  }, [audioPlaying, currentRecording?.audioDataUrl]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const ms = parseInt(e.target.value, 10);
    setAudioPlaybackTimeMs(ms);
    if (audioRef.current) {
      audioRef.current.currentTime = ms / 1000;
    }
  };

  const cyclePlaybackRate = () => {
    const rates = [1.0, 1.25, 1.5, 2.0];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIdx];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const activeTranscriptText =
    liveTranscript || currentRecording?.transcript || '';

  const handleCopyTranscript = () => {
    if (!activeTranscriptText) return;
    navigator.clipboard.writeText(activeTranscriptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative flex items-center gap-2 select-none">
      {/* Hidden Audio Element */}
      {currentRecording?.audioDataUrl && (
        <audio
          ref={audioRef}
          src={currentRecording.audioDataUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setAudioPlaying(false)}
        />
      )}

      {/* Record Mic Button */}
      <button
        onClick={toggleRecording}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-medium text-xs transition-all shadow-sm ${
          isRecordingAudio
            ? 'bg-rose-600 text-white animate-pulse shadow-rose-600/30 ring-2 ring-rose-400'
            : 'bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/60'
        }`}
        title={isRecordingAudio ? 'Kaydı Durdur' : 'Ders/Toplantı Sesi Kaydet & Canlı Dikte (Note Replay)'}
      >
        {isRecordingAudio ? (
          <>
            <Square size={13} className="fill-white" />
            <span className="font-mono text-[11px] font-bold">
              {formatMs(recordingDurationMs)}
            </span>
          </>
        ) : (
          <>
            <Mic size={14} className="text-rose-400" />
            <span className="hidden sm:inline">Ses & Dikte</span>
          </>
        )}
      </button>

      {/* Live Transcript / Speech to Text Button */}
      <button
        onClick={() => setTranscriptOpen(!transcriptOpen)}
        className={`flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
          transcriptOpen || isTranscribing
            ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 shadow-sm'
            : 'bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-700/60'
        }`}
        title="Canlı Transkripsiyon & Dikte Altyazıları"
      >
        <FileText size={13} className={isTranscribing ? 'text-indigo-400 animate-pulse' : ''} />
        <span className="hidden md:inline">Transkript</span>
        {isTranscribing && (
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
        )}
      </button>

      {/* Playback Controls if a recording exists */}
      {!isRecordingAudio && currentRecording?.audioDataUrl && (
        <div className="flex items-center bg-slate-800/90 border border-slate-700/80 rounded-xl px-2 py-1 gap-2 shadow-inner">
          <button
            onClick={togglePlay}
            className="p-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
            title={audioPlaying ? 'Duraklat' : 'Ses Kaydını Oynat'}
          >
            {audioPlaying ? <Pause size={12} /> : <Play size={12} className="fill-white" />}
          </button>

          <span className="font-mono text-[10px] text-slate-300">
            {formatMs(audioPlaybackTimeMs)} / {formatMs(currentRecording.durationMs)}
          </span>

          <input
            type="range"
            min="0"
            max={currentRecording.durationMs}
            value={audioPlaybackTimeMs}
            onChange={handleSeek}
            className="w-16 sm:w-24 h-1.5 accent-indigo-500 rounded-lg cursor-pointer bg-slate-700"
          />

          <button
            onClick={cyclePlaybackRate}
            className="font-mono text-[10px] font-bold text-slate-400 hover:text-white px-1 py-0.5 rounded hover:bg-slate-700"
            title="Oynatma Hızı"
          >
            {playbackRate}x
          </button>

          <span
            className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-semibold border border-indigo-500/30"
            title="Tuvaldeki herhangi bir nota tıklayarak tam o yazılma anına atlayabilirsiniz"
          >
            <Sparkles size={10} />
            <span>Vuruşa Tıkla & Dinle</span>
          </span>
        </div>
      )}

      {/* Floating Live Speech-to-Text Popup Panel */}
      {transcriptOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-750 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <FileText size={14} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                  Canlı Ders Transkripti
                  {isTranscribing && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      🔴 Dinleniyor
                    </span>
                  )}
                </h4>
                <p className="text-[10px] text-slate-400">Web Speech Canlı Ses-Metin Çevirici</p>
              </div>
            </div>

            <button
              onClick={() => setTranscriptOpen(false)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X size={15} />
            </button>
          </div>

          {/* Transcript Box */}
          <div className="my-3 min-h-[90px] max-h-48 overflow-y-auto p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs leading-relaxed text-slate-200 select-text">
            {activeTranscriptText ? (
              <p className="whitespace-pre-wrap">{activeTranscriptText}</p>
            ) : (
              <p className="text-slate-500 italic text-center py-4">
                {isRecordingAudio
                  ? 'Konuşulanlar dinleniyor ve yazıya dökülüyor...'
                  : 'Henüz bir konuşma veya transkript kaydı yok. "Ses & Dikte" butonuna basarak derste konuşulanları yazıya dökebilirsiniz.'}
              </p>
            )}
          </div>

          {/* Actions: Add to page as note, Copy, Clear */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs">
            <button
              disabled={!activeTranscriptText}
              onClick={() => {
                addTranscriptToCurrentPageAsNote();
                setTranscriptOpen(false);
              }}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow disabled:opacity-40 transition-all"
              title="Transkript metnini mevcut sayfaya not kutusu olarak yapıştır"
            >
              <Plus size={13} />
              <span>Sayfaya Not Ekle</span>
            </button>

            <button
              disabled={!activeTranscriptText}
              onClick={handleCopyTranscript}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 disabled:opacity-40 transition-colors"
              title="Metni Kopyala"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            </button>

            <button
              disabled={!activeTranscriptText}
              onClick={clearSpeechTranscript}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 border border-slate-700 disabled:opacity-40 transition-colors text-[11px]"
              title="Transkripti Temizle"
            >
              Temizle
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
