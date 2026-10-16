import React, { useState, useRef, useEffect } from 'react';
import { StickyNoteItem, StickyNoteColor } from '../../types/notebook';
import { useNotebookStore } from '../../store/notebookStore';
import { Trash2, GripHorizontal, Palette, Volume2, Link2, ExternalLink, Globe } from 'lucide-react';
import { textToSpeechService } from '../../services/textToSpeechService';

interface StickyNoteOverlayProps {
  note: StickyNoteItem;
  scale?: number;
}

const COLOR_MAP: Record<
  StickyNoteColor,
  {
    bg: string;
    border: string;
    text: string;
    foldBg: string;
    shadow: string;
    dotColor: string;
  }
> = {
  yellow: {
    bg: 'bg-amber-100/95',
    border: 'border-amber-300',
    text: 'text-amber-950',
    foldBg: 'bg-amber-200',
    shadow: 'shadow-amber-900/10',
    dotColor: '#fde047',
  },
  pink: {
    bg: 'bg-rose-100/95',
    border: 'border-rose-300',
    text: 'text-rose-950',
    foldBg: 'bg-rose-200',
    shadow: 'shadow-rose-900/10',
    dotColor: '#f472b6',
  },
  mint: {
    bg: 'bg-emerald-100/95',
    border: 'border-emerald-300',
    text: 'text-emerald-950',
    foldBg: 'bg-emerald-200',
    shadow: 'shadow-emerald-900/10',
    dotColor: '#86efac',
  },
  blue: {
    bg: 'bg-sky-100/95',
    border: 'border-sky-300',
    text: 'text-sky-950',
    foldBg: 'bg-sky-200',
    shadow: 'shadow-sky-900/10',
    dotColor: '#7dd3fc',
  },
  purple: {
    bg: 'bg-purple-100/95',
    border: 'border-purple-300',
    text: 'text-purple-950',
    foldBg: 'bg-purple-200',
    shadow: 'shadow-purple-900/10',
    dotColor: '#d8b4fe',
  },
};

export const StickyNoteOverlay: React.FC<StickyNoteOverlayProps> = ({ note, scale = 1.0 }) => {
  const {
    updateStickyNoteOnCurrentPage,
    removeStickyNoteFromCurrentPage,
    openLinkModal,
    navigateToPage,
  } = useNotebookStore();

  const [isDragging, setIsDragging] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const dragStartRef = useRef<{ clientX: number; clientY: number; startX: number; startY: number }>({
    clientX: 0,
    clientY: 0,
    startX: note.x,
    startY: note.y,
  });

  const config = COLOR_MAP[note.color] || COLOR_MAP.yellow;

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only drag from the header bar, not the textarea
    if ((e.target as HTMLElement).tagName === 'TEXTAREA' || (e.target as HTMLElement).closest('button')) {
      return;
    }
    e.stopPropagation();
    setIsDragging(true);
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startX: note.x,
      startY: note.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = (e.clientX - dragStartRef.current.clientX) / scale;
    const dy = (e.clientY - dragStartRef.current.clientY) / scale;

    const newX = Math.round(dragStartRef.current.startX + dx);
    const newY = Math.round(dragStartRef.current.startY + dy);

    updateStickyNoteOnCurrentPage(note.id, { x: newX, y: newY });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  return (
    <div
      className={`absolute z-30 select-none group transition-shadow ${
        isDragging ? 'cursor-grabbing scale-[1.02] shadow-2xl' : 'cursor-default shadow-xl'
      }`}
      style={{
        left: `${note.x}px`,
        top: `${note.y}px`,
        width: `${note.width || 210}px`,
        minHeight: `${note.height || 180}px`,
        transform: `rotate(${note.rotation || 0}deg)`,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 3D Post-it Note Card Body */}
      <div
        className={`w-full h-full relative rounded-tr-none rounded-xl border ${config.border} ${config.bg} ${config.text} ${config.shadow} backdrop-blur-xs flex flex-col overflow-hidden transition-colors`}
        style={{
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Top-Right 3D Paper Fold / Dog-Ear Flap */}
        <div className="absolute top-0 right-0 w-6 h-6 overflow-hidden pointer-events-none">
          <div
            className={`w-full h-full ${config.foldBg} border-b border-l ${config.border} shadow-sm`}
            style={{
              clipPath: 'polygon(0 0, 100% 100%, 0 100%)',
            }}
          />
        </div>

        {/* Drag Bar & Actions Header */}
        <div className="h-7 px-2.5 flex items-center justify-between border-b border-black/5 bg-black/5 cursor-grab active:cursor-grabbing select-none">
          <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
            <GripHorizontal size={13} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Not</span>
          </div>

          <div className="flex items-center gap-1">
            {/* Color Switcher Button */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowColorPicker(!showColorPicker);
                }}
                className="p-1 rounded hover:bg-black/10 transition-colors opacity-70 hover:opacity-100"
                title="Renk Değiştir"
              >
                <Palette size={12} />
              </button>

              {/* Color Picker Flyout */}
              {showColorPicker && (
                <div
                  className="absolute right-0 top-full mt-1 p-1.5 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1 z-50 animate-in fade-in zoom-in-95 duration-150"
                  onClick={(e) => e.stopPropagation()}
                >
                  {(Object.keys(COLOR_MAP) as StickyNoteColor[]).map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        updateStickyNoteOnCurrentPage(note.id, { color: c });
                        setShowColorPicker(false);
                      }}
                      className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${
                        note.color === c ? 'border-indigo-600 scale-105' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: COLOR_MAP[c].dotColor }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* 🔗 Faz AA: Link to Page or URL */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                openLinkModal({
                  elementId: note.id,
                  elementType: 'sticky',
                  initialTargetPage: note.pageLink,
                  initialUrl: note.url,
                  onSave: (saved) => {
                    updateStickyNoteOnCurrentPage(note.id, {
                      pageLink: saved.targetPageIndex,
                      url: saved.url,
                    });
                  },
                });
              }}
              className={`p-1 rounded transition-colors ${
                note.pageLink !== undefined || note.url
                  ? 'text-indigo-600 bg-indigo-500/20 font-bold opacity-100 ring-1 ring-indigo-400'
                  : 'hover:bg-black/10 opacity-70 hover:opacity-100'
              }`}
              title="Sayfaya veya Web Adresine Bağla (Köprü)"
            >
              <Link2 size={12} />
            </button>

            {/* 🔊 Faz D: TTS Read Aloud */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (note.text) textToSpeechService.toggle(note.text);
              }}
              className="p-1 rounded hover:bg-black/10 transition-colors opacity-70 hover:opacity-100"
              title="Notu Sesli Oku (Text-to-Speech)"
            >
              <Volume2 size={12} />
            </button>

            {/* Delete Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeStickyNoteFromCurrentPage(note.id);
              }}
              className="p-1 rounded hover:bg-rose-500/20 hover:text-rose-600 transition-colors opacity-70 hover:opacity-100"
              title="Notu Sil"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {/* Text Content Area */}
        <div className="flex-1 p-2.5 flex flex-col relative">
          <textarea
            value={note.text}
            onChange={(e) => updateStickyNoteOnCurrentPage(note.id, { text: e.target.value })}
            placeholder="Yapışkan not yazın..."
            className="w-full flex-1 bg-transparent resize-none border-none outline-none font-sans text-xs leading-relaxed text-inherit placeholder:text-black/30 placeholder:italic select-text"
            rows={5}
            style={{
              fontFamily: "'Caveat', 'Comic Sans MS', cursive, sans-serif",
              fontSize: '15px',
              lineHeight: '1.4',
            }}
          />

          {/* 🔗 Faz AA: Clickable Jump Link Badge at bottom */}
          {note.pageLink !== undefined && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigateToPage(note.pageLink!);
              }}
              className="mt-1 self-start flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold shadow-md hover:scale-105 transition-all z-20"
              title={`Sayfa ${note.pageLink + 1}'e Atla`}
            >
              <ExternalLink size={10} />
              <span>Sayfa {note.pageLink + 1}'e Git</span>
            </button>
          )}

          {note.url && (
            <a
              href={note.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="mt-1 self-start flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold shadow-md hover:scale-105 transition-all z-20 truncate max-w-[160px]"
              title={`Web Bağlantısını Aç: ${note.url}`}
            >
              <Globe size={10} />
              <span className="truncate">{note.url.replace(/^https?:\/\//, '')}</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
