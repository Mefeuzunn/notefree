import React, { useState, useEffect } from 'react';
import { useNotebookStore } from '../../store/notebookStore';
import {
  solveMathEquation,
  MathSolutionResult,
} from '../../services/mathService';
import {
  X,
  Sparkles,
  Calculator,
  ArrowRight,
  Check,
  PlusCircle,
  Copy,
  RotateCcw,
} from 'lucide-react';

const PRESET_FORMULAS = [
  { label: 'Doğrusal Denklem', eq: '3x + 12 = 36' },
  { label: 'İkinci Dereceden', eq: 'x^2 - 5x + 6 = 0' },
  { label: 'Aritmetik İşlem', eq: '25 * (14 - 6) / 4' },
  { label: 'Farklı Kökler', eq: '2x^2 + 4x - 6 = 0' },
];

const MATH_SYMBOLS = ['x²', 'x', '√', 'π', '±', '+', '-', '×', '÷', '=', '(', ')'];

export const MathSolverModal: React.FC = () => {
  const {
    mathModalOpen,
    mathInputEquation,
    closeMathModal,
    addMathSolutionToCanvas,
  } = useNotebookStore();

  const [inputEq, setInputEq] = useState(mathInputEquation || '3x + 12 = 36');
  const [solution, setSolution] = useState<MathSolutionResult | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (mathInputEquation) {
      setInputEq(mathInputEquation);
    }
  }, [mathInputEquation]);

  useEffect(() => {
    if (inputEq.trim()) {
      const res = solveMathEquation(inputEq);
      setSolution(res);
    } else {
      setSolution(null);
    }
  }, [inputEq]);

  if (!mathModalOpen) return null;

  const handleInsertSymbol = (sym: string) => {
    if (sym === 'x²') {
      setInputEq((prev) => prev + '^2');
    } else if (sym === '×') {
      setInputEq((prev) => prev + ' * ');
    } else if (sym === '÷') {
      setInputEq((prev) => prev + ' / ');
    } else {
      setInputEq((prev) => prev + sym);
    }
  };

  const handleInsertToCanvas = () => {
    if (!solution) return;
    addMathSolutionToCanvas(inputEq, solution.result);
    closeMathModal();
  };

  const handleCopyResult = () => {
    if (!solution) return;
    navigator.clipboard.writeText(`${inputEq} ➔ ${solution.result}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-150 select-none">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-750 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-850/80 border-b border-slate-750">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
              <Calculator size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <span>Math AI Denklem Çözücü</span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded font-semibold border border-indigo-500/30">
                  GoodNotes Math AI
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                El yazısı ve cebirsel denklemleri otomatik çöz ve tuvale aktar
              </p>
            </div>
          </div>

          <button
            onClick={closeMathModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Formula Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Çözülecek Denklem veya İfade:
            </label>
            <div className="relative">
              <input
                type="text"
                autoFocus
                value={inputEq}
                onChange={(e) => setInputEq(e.target.value)}
                placeholder="Örn: 2x + 8 = 24 veya x^2 - 4x - 5 = 0"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-indigo-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition-all"
              />
              {inputEq && (
                <button
                  onClick={() => setInputEq('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <RotateCcw size={13} />
                </button>
              )}
            </div>

            {/* Quick Symbols Bar */}
            <div className="flex items-center gap-1 mt-2 overflow-x-auto no-scrollbar py-0.5">
              <span className="text-[10px] font-semibold text-slate-500 uppercase mr-1">Sembol:</span>
              {MATH_SYMBOLS.map((sym) => (
                <button
                  key={sym}
                  onClick={() => handleInsertSymbol(sym)}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-mono text-xs border border-slate-700/60 transition-colors"
                >
                  {sym}
                </button>
              ))}
            </div>

            {/* Quick Examples */}
            <div className="flex items-center gap-1.5 mt-2 overflow-x-auto no-scrollbar">
              <span className="text-[10px] font-semibold text-slate-500 uppercase mr-1">Örnek:</span>
              {PRESET_FORMULAS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setInputEq(p.eq)}
                  className="px-2 py-0.5 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-[10px] font-medium border border-indigo-500/20 whitespace-nowrap transition-colors"
                >
                  {p.eq}
                </button>
              ))}
            </div>
          </div>

          {/* Solution Result Card */}
          {solution && (
            <div className="rounded-xl bg-gradient-to-r from-indigo-950/60 to-purple-950/40 border border-indigo-500/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                  <Sparkles size={13} className="text-amber-400" />
                  <span>Hesaplanan Çözüm:</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-[10px] font-mono font-bold text-indigo-200 border border-indigo-500/30 uppercase">
                  {solution.solutionType}
                </span>
              </div>

              {/* Main Result Display */}
              <div className="bg-slate-950/80 rounded-lg p-3 border border-indigo-500/20 flex items-center justify-between">
                <span className="text-base font-mono font-bold text-cyan-300 tracking-wide">
                  {solution.result}
                </span>
                <button
                  onClick={handleCopyResult}
                  className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1 text-[11px]"
                  title="Sonucu Kopyala"
                >
                  {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  <span>{copied ? 'Kopyalandı' : 'Kopyala'}</span>
                </button>
              </div>

              {/* Step-by-Step Breakdown */}
              {solution.steps && solution.steps.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-slate-400 block">
                    Adım Adım Çözüm Aşamaları:
                  </span>
                  {solution.steps.map((st) => (
                    <div
                      key={st.stepNumber}
                      className="text-xs p-2 rounded-lg bg-slate-900/80 border border-slate-800 flex items-start gap-2"
                    >
                      <span className="w-4 h-4 rounded-full bg-indigo-600/30 text-indigo-300 font-mono text-[10px] flex items-center justify-center shrink-0 font-bold border border-indigo-500/30">
                        {st.stepNumber}
                      </span>
                      <div className="flex-1">
                        <p className="text-slate-300 font-medium text-[11px]">{st.explanation}</p>
                        <p className="font-mono text-cyan-400 text-xs mt-0.5 font-semibold">
                          {st.expression}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 bg-slate-850/90 border-t border-slate-750 flex items-center justify-between gap-2">
          <button
            onClick={closeMathModal}
            className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            Kapat
          </button>

          <button
            onClick={handleInsertToCanvas}
            disabled={!solution || !solution.isSolvable}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md ${
              solution && solution.isSolvable
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-600/30 hover:scale-[1.02]'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-750'
            }`}
          >
            <PlusCircle size={14} />
            <span>Tuvale Çözüm Olarak Ekle</span>
          </button>
        </div>
      </div>
    </div>
  );
};
