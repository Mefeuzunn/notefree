import React, { useState, useRef } from 'react';
import { useNotebookStore } from '../../store/notebookStore';
import { convertPdfToPages } from '../../services/pdfService';
import { convertDocxToPages } from '../../services/wordService';
import { X, FileText, UploadCloud, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export const DocImportModal: React.FC = () => {
  const { docImportModalOpen, setDocImportModalOpen, importPagesAsNotebook } =
    useNotebookStore();

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!docImportModalOpen) return null;

  const handleFile = async (file: File) => {
    setErrorMsg(null);
    setIsProcessing(true);

    try {
      if (file.name.toLowerCase().endsWith('.pdf')) {
        setProgressMsg('PDF Sayfaları ve içindekiler tablosu işleniyor...');
        const { pages, outline } = await convertPdfToPages(file);
        if (pages.length === 0) throw new Error('PDF içinde sayfa bulunamadı.');
        await importPagesAsNotebook(pages, `📄 ${file.name.replace(/\.pdf$/i, '')}`, outline);
      } else if (file.name.toLowerCase().endsWith('.docx')) {
        setProgressMsg('Word belgesi çözümleniyor ve sayfalara bölünüyor...');
        const pages = await convertDocxToPages(file);
        if (pages.length === 0) throw new Error('Word belgesinden sayfa üretilemedi.');
        await importPagesAsNotebook(pages, `📝 ${file.name.replace(/\.docx$/i, '')}`);
      } else {
        throw new Error('Lütfen sadece PDF (.pdf) veya Word (.docx) dosyası yükleyin.');
      }
    } catch (err: any) {
      console.error('Document import error:', err);
      setErrorMsg(err.message || 'Dosya içe aktarılırken bir hata oluştu.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              Doküman İçe Aktar (PDF & Word)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Ders slaytları, PDF kitapları veya Word çalışma kağıtları üzerine el yazısıyla not alın.
            </p>
          </div>
          <button
            onClick={() => setDocImportModalOpen(false)}
            disabled={isProcessing}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => !isProcessing && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
              isProcessing
                ? 'border-indigo-500/50 bg-indigo-500/5 cursor-wait'
                : 'border-slate-700 hover:border-indigo-500 hover:bg-slate-800/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf, .docx, application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFile(e.target.files[0]);
                }
              }}
            />

            {isProcessing ? (
              <div className="space-y-3">
                <Loader2 size={36} className="text-indigo-400 animate-spin mx-auto" />
                <p className="text-sm font-medium text-slate-200">{progressMsg}</p>
                <p className="text-xs text-slate-500">Lütfen bekleyin...</p>
              </div>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3 shadow-inner">
                  <UploadCloud size={28} />
                </div>
                <h3 className="text-sm font-semibold text-slate-200 mb-1">
                  Dosyayı buraya sürükleyin veya seçin
                </h3>
                <p className="text-xs text-slate-400 max-w-xs mb-3">
                  Desteklenen formatlar: <strong className="text-slate-300">.pdf</strong> ve{' '}
                  <strong className="text-slate-300">.docx</strong>
                </p>
                <span className="inline-block px-3 py-1 bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium rounded-lg">
                  Dosya Seç
                </span>
              </>
            )}
          </div>

          {errorMsg && (
            <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-300 text-xs">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick Info Box */}
          <div className="mt-4 p-3 bg-slate-800/40 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
            <p className="font-semibold text-slate-300">💡 İpuçları:</p>
            <p>• PDF içe aktarıldığında her sayfa defter sayfası olarak açılır.</p>
            <p>• Kalemlerle üzerine yazı yazabilir, fosforlu kalemle metinleri vurgulayabilirsiniz.</p>
            <p>• İşiniz bitince sağ üstteki 'PDF İndir' butonundan notlu halini dışa aktarabilirsiniz.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
