import React, { useState, useEffect } from 'react';
import { useNotebookStore } from '../../store/notebookStore';
import { handwritingService } from '../../services/handwritingService';
import {
  Type,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  X,
  FileText,
  AlignLeft,
  Volume2,
} from 'lucide-react';
import { textToSpeechService } from '../../services/textToSpeechService';

interface HandwritingOcrModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HandwritingOcrModal: React.FC<HandwritingOcrModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    lassoSelection,
    activePageIndex,
    eraseStrokesOnCurrentPage,
    addTextAnnotation,
    setLassoSelection,
  } = useNotebookStore();

  const [transcribedText, setTranscribedText] = useState('');
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen && lassoSelection && lassoSelection.originalStrokes.length > 0) {
      setIsProcessing(true);
      const timer = setTimeout(() => {
        const result = handwritingService.transcribeStrokes(lassoSelection.originalStrokes);
        setTranscribedText(result.text);
        setIsProcessing(false);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isOpen, lassoSelection]);

  if (!isOpen || !lassoSelection) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(transcribedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyToCanvas = () => {
    if (!transcribedText.trim()) return;

    // Erase the original handwritten strokes
    eraseStrokesOnCurrentPage(lassoSelection.strokeIds);

    // Place a new clean text box at the center/top-left of the original strokes
    const targetX = Math.max(20, lassoSelection.bounds.minX);
    const targetY = Math.max(20, lassoSelection.bounds.minY);

    addTextAnnotation(activePageIndex, targetX, targetY, transcribedText);

    // Dismiss lasso selection & close modal
    setLassoSelection(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-925/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Type size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                El Yazısını Metne Dönüştür
                <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-medium">
                  GoodNotes 6 OCR
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Seçili el yazısı çizimleri dijital metne çevrilir
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlignLeft size={13} className="text-indigo-400" />
                <span>Tanınan Metin (Düzenlenebilir)</span>
              </label>
              <button
                onClick={handleCopy}
                className="text-xs text-slate-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
              >
                {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                <span>{copied ? 'Kopyalandı' : 'Kopyala'}</span>
              </button>
            </div>

            {isProcessing ? (
              <div className="w-full h-32 bg-slate-800/50 border border-slate-700/60 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-400 text-xs animate-pulse">
                <Sparkles size={20} className="text-indigo-400 animate-spin" />
                <span>El yazısı analiz ediliyor...</span>
              </div>
            ) : (
              <textarea
                value={transcribedText}
                onChange={(e) => setTranscribedText(e.target.value)}
                placeholder="Dönüştürülen metin burada görünecektir..."
                rows={4}
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none leading-relaxed"
              />
            )}
          </div>

          <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-slate-400">
            <Sparkles size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong>İpucu:</strong> Metni onayladığınızda el yazısı çizimler kaldırılır ve aynı konuma düzenlenebilir zengin bir metin kutusu yerleştirilir.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2.5 pt-1">
            <button
              onClick={() => textToSpeechService.toggle(transcribedText)}
              disabled={!transcribedText.trim() || isProcessing}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-750 disabled:opacity-40 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              title="Metni Seslendir (TTS)"
            >
              <Volume2 size={14} className="text-indigo-400" />
              <span>Seslendir</span>
            </button>

            <button
              onClick={handleCopy}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copied ? 'Kopyalandı' : 'Panoya Kopyala'}</span>
            </button>

            <button
              onClick={handleApplyToCanvas}
              disabled={!transcribedText.trim() || isProcessing}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-1.5"
            >
              <ArrowRight size={14} />
              <span>Metin Olarak Tuvale Ekle</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
