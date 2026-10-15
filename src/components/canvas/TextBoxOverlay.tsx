import React, { useState } from 'react';
import { TextAnnotation } from '../../types/notebook';
import { Trash2, Type, Move, X, Volume2 } from 'lucide-react';
import { textToSpeechService } from '../../services/textToSpeechService';

interface TextBoxOverlayProps {
  annotation: TextAnnotation;
  scale?: number;
  isSelected?: boolean;
  onUpdate: (updated: Partial<TextAnnotation>) => void;
  onDelete: () => void;
}

export const TextBoxOverlay: React.FC<TextBoxOverlayProps> = ({
  annotation,
  scale = 1.0,
  isSelected = false,
  onUpdate,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);

  const getFontFamily = (family: string) => {
    switch (family) {
      case 'Caveat':
        return "'Caveat', cursive";
      case 'serif':
        return 'Georgia, serif';
      case 'monospace':
        return "'JetBrains Mono', monospace";
      default:
        return "'Inter', sans-serif";
    }
  };

  return (
    <div
      className={`absolute z-20 group transition-all rounded-lg select-text ${
        isSelected || isEditing
          ? 'ring-2 ring-indigo-500 bg-white/95 dark:bg-slate-900/95 shadow-xl'
          : 'hover:ring-1 hover:ring-indigo-400/50'
      }`}
      style={{
        left: `${annotation.x * scale}px`,
        top: `${annotation.y * scale}px`,
        minWidth: `${Math.max(120, annotation.width) * scale}px`,
        backgroundColor: annotation.bg || 'transparent',
      }}
      onClick={(e) => {
        e.stopPropagation();
        setShowToolbar(true);
      }}
    >
      {/* Text Box Formatting Bar */}
      {showToolbar && (
        <div
          className="absolute -top-10 left-0 bg-slate-900 border border-slate-750 text-white rounded-xl px-2 py-1 flex items-center gap-1.5 shadow-2xl z-30 animate-in fade-in select-none"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Font Selector */}
          <select
            value={annotation.fontFamily}
            onChange={(e) => onUpdate({ fontFamily: e.target.value as any })}
            className="bg-slate-800 border border-slate-700 text-xs rounded-lg px-1.5 py-0.5 text-slate-200 focus:outline-none"
          >
            <option value="Inter">Normal</option>
            <option value="Caveat">El Yazısı (Script)</option>
            <option value="serif">Serif (Kitap)</option>
            <option value="monospace">Kod / Formül</option>
          </select>

          {/* Font Size */}
          <select
            value={annotation.fontSize}
            onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value, 10) })}
            className="bg-slate-800 border border-slate-700 text-xs rounded-lg px-1.5 py-0.5 text-slate-200 focus:outline-none"
          >
            <option value="14">14px</option>
            <option value="18">18px</option>
            <option value="24">24px</option>
            <option value="32">32px</option>
            <option value="44">44px</option>
          </select>

          {/* Quick Color */}
          <div className="flex gap-1">
            {['#0f172a', '#1e40af', '#b91c1c', '#047857'].map((c) => (
              <button
                key={c}
                onClick={() => onUpdate({ color: c })}
                className="w-4 h-4 rounded-full border border-white/20"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <div className="w-px h-3.5 bg-slate-750 mx-0.5" />

          {/* 🔊 Faz D: TTS Read Aloud */}
          <button
            onClick={() => textToSpeechService.toggle(annotation.text)}
            className="p-1 text-slate-400 hover:text-indigo-400 rounded transition-colors"
            title="Metni Sesli Oku (Text-to-Speech)"
          >
            <Volume2 size={13} />
          </button>

          {/* Delete Button */}
          <button
            onClick={onDelete}
            className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors"
            title="Metin Kutusunu Sil"
          >
            <Trash2 size={13} />
          </button>

          {/* Close Toolbar */}
          <button
            onClick={() => setShowToolbar(false)}
            className="p-1 text-slate-500 hover:text-white rounded"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Editable Text Area */}
      <textarea
        value={annotation.text}
        placeholder="Not yazın..."
        rows={Math.max(1, annotation.text.split('\n').length)}
        onChange={(e) => onUpdate({ text: e.target.value })}
        onFocus={() => {
          setIsEditing(true);
          setShowToolbar(true);
        }}
        onBlur={() => setIsEditing(false)}
        className="w-full bg-transparent resize-none p-1.5 focus:outline-none border-0 overflow-hidden leading-relaxed block"
        style={{
          color: annotation.color,
          fontSize: `${annotation.fontSize * scale}px`,
          fontFamily: getFontFamily(annotation.fontFamily),
        }}
      />
    </div>
  );
};
