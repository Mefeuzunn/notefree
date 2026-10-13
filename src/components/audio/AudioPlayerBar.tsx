import React, { useState, useRef, useEffect } from 'react';
import { useNotebookStore } from '../../store/notebookStore';
import { audioRecorder } from '../../services/audioService';
import {
  Mic,
  Square,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Trash2,
  Radio,
  Sparkles,
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
  } = useNotebookStore();

  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
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

  return (
    <div className="flex items-center gap-2 select-none">
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
        title={isRecordingAudio ? 'Kaydı Durdur' : 'Ders/Toplantı Sesi Kaydet (Note Replay)'}
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
            <span className="hidden sm:inline">Ses Kaydı</span>
          </>
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
        </div>
      )}
    </div>
  );
};
