import React, { useState } from 'react';
import { useNotebookStore } from '../../store/notebookStore';
import {
  FileDown,
  Image as ImageIcon,
  FileText,
  X,
  Sparkles,
  Check,
  Layers,
  Eye,
  Download,
} from 'lucide-react';
import { ExportOptions } from '../../types/notebook';
import {
  exportPageAsImage,
  exportNotebookWithAllLayers,
  downloadBlob,
} from '../../services/exportService';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const { notebooks, activeNotebookId, activePageIndex } = useNotebookStore();

  const [format, setFormat] = useState<'pdf' | 'png' | 'jpeg'>('pdf');
  const [scope, setScope] = useState<'current' | 'all'>('current');
  const [scale, setScale] = useState<1 | 2 | 3>(2);
  const [transparentBg, setTransparentBg] = useState<boolean>(false);
  const [includeTemplate, setIncludeTemplate] = useState<boolean>(true);
  const [includeStickyNotes, setIncludeStickyNotes] = useState<boolean>(true);
  const [includeTexts, setIncludeTexts] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const activeNotebook = notebooks.find((n) => n.id === activeNotebookId);
  const currentPage = activeNotebook?.pages[activePageIndex] || activeNotebook?.pages[0];

  if (!isOpen || !activeNotebook || !currentPage) return null;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const options: ExportOptions = {
        format,
        scope,
        scale,
        transparentBg: format === 'png' && transparentBg,
        includeTemplate,
        includeStickyNotes,
        includeTexts,
      };

      const titleSafe = activeNotebook.title.replace(/[^a-zA-Z0-9_\-ğüşöçİĞÜŞÖÇ]/g, '_');

      if (format === 'pdf') {
        const blob = await exportNotebookWithAllLayers(activeNotebook, options);
        downloadBlob(blob, `${titleSafe}_${scope === 'current' ? `sayfa_${activePageIndex + 1}` : 'tamami'}.pdf`);
      } else {
        // Image export
        const blob = await exportPageAsImage(currentPage, options);
        downloadBlob(
          blob,
          `${titleSafe}_sayfa_${activePageIndex + 1}.${format === 'jpeg' ? 'jpg' : 'png'}`
        );
      }
      onClose();
    } catch (err) {
      console.error('Export error:', err);
      alert('Dışa aktarma sırasında bir hata oluştu.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-750 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150 text-white">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-925/40">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <FileDown size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Dışa Aktar & Paylaş
                <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-medium">
                  Studio Export
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {activeNotebook.title} ({activeNotebook.pages.length} sayfa)
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

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* 1. Format Selection */}
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-2 block">
              Dosya Formatı
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setFormat('pdf')}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  format === 'pdf'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold ring-1 ring-indigo-500'
                    : 'bg-slate-800/60 border-slate-750 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <FileText size={20} className="mx-auto mb-1.5 text-rose-400" />
                <span className="text-xs block font-bold">PDF Belgesi</span>
                <span className="text-[10px] text-slate-400">Tüm katmanlar</span>
              </button>

              <button
                onClick={() => setFormat('png')}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  format === 'png'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold ring-1 ring-indigo-500'
                    : 'bg-slate-800/60 border-slate-750 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <ImageIcon size={20} className="mx-auto mb-1.5 text-indigo-400" />
                <span className="text-xs block font-bold">PNG Resmi</span>
                <span className="text-[10px] text-slate-400">Saydamlık desteği</span>
              </button>

              <button
                onClick={() => setFormat('jpeg')}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  format === 'jpeg'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold ring-1 ring-indigo-500'
                    : 'bg-slate-800/60 border-slate-750 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <ImageIcon size={20} className="mx-auto mb-1.5 text-amber-400" />
                <span className="text-xs block font-bold">JPEG Resmi</span>
                <span className="text-[10px] text-slate-400">Küçük dosya boyutu</span>
              </button>
            </div>
          </div>

          {/* 2. Scope Selection (Only for PDF; images export active page) */}
          {format === 'pdf' && (
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-2 block">
                Kapsam
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setScope('current')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    scope === 'current'
                      ? 'bg-indigo-600/25 border-indigo-500 text-white'
                      : 'bg-slate-800/50 border-slate-750 text-slate-400 hover:text-white'
                  }`}
                >
                  Yalnızca Aktif Sayfa ({activePageIndex + 1})
                </button>
                <button
                  onClick={() => setScope('all')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    scope === 'all'
                      ? 'bg-indigo-600/25 border-indigo-500 text-white'
                      : 'bg-slate-800/50 border-slate-750 text-slate-400 hover:text-white'
                  }`}
                >
                  Tüm Defter ({activeNotebook.pages.length} Sayfa)
                </button>
              </div>
            </div>
          )}

          {/* 3. Quality & Resolution */}
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-2 block">
              Çözünürlük & Netlik
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { s: 1, label: '1x Standart', dpi: '96 DPI' },
                { s: 2, label: '2x Retina HD', dpi: '192 DPI (Önerilen)' },
                { s: 3, label: '3x Ultra HD', dpi: '288 DPI' },
              ].map((opt) => (
                <button
                  key={opt.s}
                  onClick={() => setScale(opt.s as any)}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    scale === opt.s
                      ? 'bg-indigo-600/30 border-indigo-500 text-white font-bold'
                      : 'bg-slate-800/40 border-slate-750 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-xs block font-bold">{opt.label}</span>
                  <span className="text-[10px] text-slate-500">{opt.dpi}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 4. Advanced Toggles */}
          <div className="bg-slate-800/50 border border-slate-750 rounded-2xl p-3.5 space-y-2.5">
            <span className="text-xs font-bold text-slate-200 block mb-1">
              Dışa Aktarma Katmanları
            </span>

            {format === 'png' && (
              <label className="flex items-center justify-between text-xs cursor-pointer select-none">
                <span className="text-slate-300">Saydam Arka Plan (Transparent PNG)</span>
                <input
                  type="checkbox"
                  checked={transparentBg}
                  onChange={(e) => setTransparentBg(e.target.checked)}
                  className="rounded accent-indigo-500 w-4 h-4 cursor-pointer"
                />
              </label>
            )}

            <label className="flex items-center justify-between text-xs cursor-pointer select-none">
              <span className="text-slate-300">Kareli / Çizgili Kağıt Şablonunu Dahil Et</span>
              <input
                type="checkbox"
                checked={includeTemplate}
                onChange={(e) => setIncludeTemplate(e.target.checked)}
                className="rounded accent-indigo-500 w-4 h-4 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between text-xs cursor-pointer select-none">
              <span className="text-slate-300">Yapışkan Post-It Notları Dahil Et</span>
              <input
                type="checkbox"
                checked={includeStickyNotes}
                onChange={(e) => setIncludeStickyNotes(e.target.checked)}
                className="rounded accent-indigo-500 w-4 h-4 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between text-xs cursor-pointer select-none">
              <span className="text-slate-300">Metin Kutularını Dahil Et</span>
              <input
                type="checkbox"
                checked={includeTexts}
                onChange={(e) => setIncludeTexts(e.target.checked)}
                className="rounded accent-indigo-500 w-4 h-4 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex gap-2.5 bg-slate-925/40">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
          >
            Vazgeç
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
          >
            {isExporting ? (
              <>
                <Sparkles size={15} className="animate-spin text-white" />
                <span>Dışa Aktarılıyor...</span>
              </>
            ) : (
              <>
                <Download size={15} />
                <span>
                  {format.toUpperCase()} Olarak İndir
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
