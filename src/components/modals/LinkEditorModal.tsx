import React, { useState, useEffect } from 'react';
import { useNotebookStore } from '../../store/notebookStore';
import { triggerHaptic } from '../../engine/hapticFeedback';
import {
  Link as LinkIcon,
  X,
  FileText,
  Globe,
  Trash2,
  Check,
  ExternalLink,
  ChevronRight,
  Layers,
} from 'lucide-react';

const HOTSPOT_COLORS = [
  '#6366f1', // Indigo
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#f43f5e', // Rose
  '#a855f7', // Purple
];

export const LinkEditorModal: React.FC = () => {
  const {
    linkModalState,
    closeLinkModal,
    notebooks,
    activeNotebookId,
  } = useNotebookStore();

  const [linkType, setLinkType] = useState<'page' | 'url'>('page');
  const [targetPage, setTargetPage] = useState<number>(0);
  const [url, setUrl] = useState<string>('');
  const [label, setLabel] = useState<string>('');
  const [color, setColor] = useState<string>('#6366f1');

  const activeNotebook = notebooks.find((n) => n.id === activeNotebookId);
  const pages = activeNotebook?.pages || [];

  useEffect(() => {
    if (linkModalState.isOpen) {
      if (linkModalState.initialUrl) {
        setLinkType('url');
        setUrl(linkModalState.initialUrl);
      } else {
        setLinkType('page');
        setTargetPage(linkModalState.initialTargetPage ?? 0);
      }
      setLabel(linkModalState.initialLabel || '');
    }
  }, [linkModalState]);

  if (!linkModalState.isOpen) return null;

  const handleSave = () => {
    triggerHaptic('success');
    if (linkModalState.onSave) {
      if (linkType === 'page') {
        linkModalState.onSave({
          targetPageIndex: targetPage,
          url: undefined,
          label: label.trim() || undefined,
        });
      } else {
        let cleanUrl = url.trim();
        if (cleanUrl && !cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
          cleanUrl = `https://${cleanUrl}`;
        }
        linkModalState.onSave({
          targetPageIndex: undefined,
          url: cleanUrl || undefined,
          label: label.trim() || undefined,
        });
      }
    }
    closeLinkModal();
  };

  const handleRemove = () => {
    triggerHaptic('medium');
    if (linkModalState.onSave) {
      linkModalState.onSave({
        targetPageIndex: undefined,
        url: undefined,
        label: undefined,
      });
    }
    closeLinkModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md select-none animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-750 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-800/80 border-b border-slate-750 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-md">
              <LinkIcon size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">İnteraktif Bağlantı Ekle</h3>
              <p className="text-[11px] text-slate-400">
                Öğeye tıklandığında sayfaya zıpla veya web sitesini aç
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic('light');
              closeLinkModal();
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/60 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Link Type Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950/60 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setLinkType('page');
              }}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                linkType === 'page'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText size={14} />
              <span>Defter Sayfası</span>
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setLinkType('url');
              }}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                linkType === 'url'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe size={14} />
              <span>Web Bağlantısı</span>
            </button>
          </div>

          {/* Page Selector */}
          {linkType === 'page' ? (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Hedef Sayfa</span>
                <span className="text-[10px] text-indigo-400 font-mono">
                  Toplam {pages.length} Sayfa
                </span>
              </label>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                {pages.map((p, idx) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setTargetPage(idx);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                      targetPage === idx
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200 ring-1 ring-indigo-500/50'
                        : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-700 text-indigo-400 font-mono font-bold text-[11px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="truncate font-medium">
                        {p.title || `Sayfa ${idx + 1}`}
                      </span>
                      {p.isBookmarked && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-semibold shrink-0">
                          Yer İmi
                        </span>
                      )}
                    </div>
                    {targetPage === idx && (
                      <Check size={14} className="text-indigo-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* External URL Input */
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Web Adresi (URL)
              </label>
              <div className="relative">
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-750 text-slate-100 placeholder-slate-500 text-xs rounded-xl pl-3 pr-8 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                />
                <ExternalLink
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                />
              </div>
            </div>
          )}

          {/* Optional Label */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Bağlantı Başlığı (İsteğe Bağlı)
            </label>
            <input
              type="text"
              placeholder={
                linkType === 'page'
                  ? `Sayfa ${targetPage + 1}'e Git`
                  : 'Web Sitesini Ziyaret Et'
              }
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full bg-slate-950 border border-slate-750 text-slate-100 placeholder-slate-500 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-800/80 border-t border-slate-750 flex items-center justify-between gap-2">
          {(linkModalState.initialTargetPage !== undefined || linkModalState.initialUrl) ? (
            <button
              type="button"
              onClick={handleRemove}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 text-xs font-semibold transition-colors"
            >
              <Trash2 size={13} />
              <span>Bağlantıyı Kaldır</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                closeLinkModal();
              }}
              className="px-4 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-700/60 text-xs font-medium transition-colors"
            >
              İptal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            >
              <Check size={14} />
              <span>Kaydet</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
