import React, { useState } from 'react';
import { PageLinkItem } from '../../types/notebook';
import { useNotebookStore } from '../../store/notebookStore';
import { triggerHaptic } from '../../engine/hapticFeedback';
import {
  Link as LinkIcon,
  ExternalLink,
  Globe,
  Edit2,
  Trash2,
  Move,
} from 'lucide-react';

interface PageLinkOverlayProps {
  link: PageLinkItem;
  scale?: number;
}

export const PageLinkOverlay: React.FC<PageLinkOverlayProps> = ({ link, scale = 1.0 }) => {
  const {
    navigateToPage,
    openLinkModal,
    updatePageLinkOnCurrentPage,
    removePageLinkFromCurrentPage,
    activeTool,
    notebooks,
    activeNotebookId,
  } = useNotebookStore();

  const [showPill, setShowPill] = useState(false);

  const activeNotebook = notebooks.find((n) => n.id === activeNotebookId);
  const targetPageTitle =
    link.targetPageIndex !== undefined && activeNotebook?.pages[link.targetPageIndex]
      ? activeNotebook.pages[link.targetPageIndex].title || `Sayfa ${link.targetPageIndex + 1}`
      : `Sayfa ${(link.targetPageIndex ?? 0) + 1}`;

  const handleJump = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('medium');
    if (link.targetPageIndex !== undefined) {
      navigateToPage(link.targetPageIndex);
    } else if (link.url) {
      window.open(link.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    openLinkModal({
      elementId: link.id,
      elementType: 'hotspot',
      initialTargetPage: link.targetPageIndex,
      initialUrl: link.url,
      initialLabel: link.label,
      onSave: (saved) => {
        updatePageLinkOnCurrentPage(link.id, saved);
      },
    });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('medium');
    removePageLinkFromCurrentPage(link.id);
  };

  const isInteractiveMode = activeTool === 'pan' || activeTool === 'lasso' || activeTool === 'text';
  const accentColor = link.color || '#6366f1';

  return (
    <div
      style={{
        left: `${link.x * scale}px`,
        top: `${link.y * scale}px`,
        width: `${Math.max(40, link.width) * scale}px`,
        height: `${Math.max(28, link.height) * scale}px`,
      }}
      onMouseEnter={() => setShowPill(true)}
      onMouseLeave={() => setShowPill(false)}
      onClick={handleJump}
      className={`absolute z-20 group rounded-xl transition-all cursor-pointer select-none ${
        isInteractiveMode || showPill
          ? 'border-2 border-dashed shadow-md backdrop-blur-[1px]'
          : 'border border-dashed border-indigo-400/40 hover:border-indigo-400'
      }`}
    >
      {/* Semi-transparent tint background */}
      <div
        style={{
          backgroundColor: accentColor,
          opacity: showPill ? 0.22 : 0.08,
          borderColor: accentColor,
        }}
        className="w-full h-full rounded-xl transition-opacity"
      />

      {/* Center Link Badge Icon (subtle indicator) */}
      <div className="absolute top-1 left-1 flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
        <span
          style={{ backgroundColor: accentColor }}
          className="p-1 rounded-md text-white shadow-sm flex items-center justify-center"
        >
          {link.targetPageIndex !== undefined ? <LinkIcon size={10} /> : <Globe size={10} />}
        </span>
        {link.label && (
          <span
            style={{ backgroundColor: `${accentColor}33`, color: accentColor }}
            className="text-[10px] font-bold px-1.5 py-0.2 rounded-md truncate max-w-[120px] backdrop-blur-md"
          >
            {link.label}
          </span>
        )}
      </div>

      {/* Floating Action Pill on Hover */}
      {showPill && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute -top-10 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 bg-slate-900/95 backdrop-blur-md border border-slate-750 text-white rounded-xl px-2 py-1 shadow-2xl animate-in fade-in zoom-in-95"
        >
          {/* Jump Button */}
          <button
            onClick={handleJump}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold shadow transition-all hover:scale-105"
            title={
              link.targetPageIndex !== undefined
                ? `Sayfa ${link.targetPageIndex + 1}'e Atla`
                : 'Web Adresini Aç'
            }
          >
            {link.targetPageIndex !== undefined ? (
              <>
                <ExternalLink size={11} />
                <span className="truncate max-w-[110px]">{targetPageTitle}</span>
              </>
            ) : (
              <>
                <Globe size={11} />
                <span className="truncate max-w-[110px]">
                  {link.label || (link.url ? link.url.replace(/^https?:\/\//, '') : 'Web')}
                </span>
              </>
            )}
          </button>

          {/* Edit Button */}
          <button
            onClick={handleEdit}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Bağlantıyı Düzenle"
          >
            <Edit2 size={12} />
          </button>

          {/* Delete Button */}
          <button
            onClick={handleDelete}
            className="p-1 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
            title="Bağlantı Alanını Sil"
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </div>
  );
};
