import React, { useState } from 'react';
import { useNotebookStore } from '../../store/notebookStore';
import {
  RubberStampConfig,
  generateRubberStampSVG,
  PRESET_RUBBER_STAMPS,
} from '../../engine/rubberStamps';
import { StickerItem } from '../../types/notebook';
import { triggerHaptic } from '../../engine/hapticFeedback';
import {
  Stamp,
  X,
  Check,
  RotateCw,
  Sparkles,
  Calendar,
  Layers,
  Palette,
  BookmarkPlus,
  Plus,
} from 'lucide-react';

const STAMP_COLORS = [
  { name: 'Kırmızı', color: '#dc2626' },
  { name: 'Zümrüt Yeşili', color: '#059669' },
  { name: 'İndigo Mavi', color: '#4f46e5' },
  { name: 'Amber / Turuncu', color: '#d97706' },
  { name: 'Gül / Fuşya', color: '#e11d48' },
  { name: 'Koyu Bordo', color: '#991b1b' },
  { name: 'Gece Mavisi', color: '#0284c7' },
  { name: 'Grafit Siyah', color: '#1e293b' },
];

const STAMP_STYLES: { id: RubberStampConfig['style']; label: string }[] = [
  { id: 'double-rect', label: 'Çift Çerçeve' },
  { id: 'circular', label: 'Dairesel Mühür' },
  { id: 'boxed', label: 'Klasik Kutu' },
  { id: 'badge', label: 'Rozet Mühür' },
  { id: 'stars', label: 'Yıldızlı Başarı' },
];

export const RubberStampCreatorModal: React.FC = () => {
  const {
    stampCreatorModalOpen,
    setStampCreatorModalOpen,
    addStickerToCurrentPage,
    addCustomSticker,
  } = useNotebookStore();

  const [title, setTitle] = useState('ONAYLANDI');
  const [subtitle, setSubtitle] = useState('KONTROL EDİLDİ');
  const [includeDate, setIncludeDate] = useState(true);
  const [color, setColor] = useState('#059669');
  const [style, setStyle] = useState<RubberStampConfig['style']>('double-rect');
  const [rotationDeg, setRotationDeg] = useState(-10);
  const [distressed, setDistressed] = useState(true);

  if (!stampCreatorModalOpen) return null;

  const todayStr = new Date().toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const stampConfig: RubberStampConfig = {
    id: `custom_stamp_${Date.now()}`,
    title: title.trim() || 'DAMGA',
    subtitle: subtitle.trim() || undefined,
    dateText: includeDate ? todayStr : undefined,
    color,
    style,
    rotationDeg,
    distressed,
  };

  const previewSvg = generateRubberStampSVG(stampConfig);

  const handleApplyPreset = (preset: (typeof PRESET_RUBBER_STAMPS)[0]) => {
    triggerHaptic('light');
    setTitle(preset.title);
    setSubtitle(preset.subtitle || '');
    setColor(preset.color);
    setStyle(preset.style);
    setRotationDeg(preset.rotationDeg);
  };

  // Stamp immediately to active page
  const handleStampToPage = () => {
    triggerHaptic('success');
    const stickerItem: StickerItem = {
      id: `stamp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: title.trim() || 'Özel Damga',
      category: 'damga',
      content: previewSvg,
      width: style === 'circular' ? 140 : 200,
      height: style === 'circular' ? 140 : 100,
    };
    addStickerToCurrentPage(stickerItem);
    setStampCreatorModalOpen(false);
  };

  // Save to user's personal sticker drawer collection
  const handleSaveToCollection = () => {
    triggerHaptic('success');
    const stickerItem: StickerItem = {
      id: `stamp_saved_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: title.trim() || 'Özel Damga',
      category: 'damga',
      content: previewSvg,
      width: style === 'circular' ? 140 : 200,
      height: style === 'circular' ? 140 : 100,
    };
    addCustomSticker(stickerItem);
    setStampCreatorModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md select-none animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-850 border-b border-slate-750 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
              <Stamp size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Dinamik Kaşe & Mühür Tasarım Stüdyosu</span>
                <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full font-mono font-semibold">
                  Faz AC
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Gerçekçi kaşe/mühür efektli renkli onay ve dikkat damgaları oluşturun
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic('light');
              setStampCreatorModalOpen(false);
            }}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-200">
          {/* Live Preview Box */}
          <div className="flex flex-col items-center justify-center p-8 bg-slate-950/90 rounded-2xl border border-slate-800 shadow-inner min-h-[180px] relative overflow-hidden">
            <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px]" />
            <div
              className="transition-transform duration-100 flex items-center justify-center"
              dangerouslySetInnerHTML={{ __html: previewSvg }}
            />
          </div>

          {/* Quick Presets Bar */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">
              Hazır Şablonlar
            </span>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {PRESET_RUBBER_STAMPS.map((pst) => (
                <button
                  key={pst.id}
                  type="button"
                  onClick={() => handleApplyPreset(pst)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-xs font-semibold rounded-xl border border-slate-700/80 hover:border-slate-600 transition-all whitespace-nowrap text-slate-300 hover:text-white"
                >
                  {pst.name}
                </button>
              ))}
            </div>
          </div>

          {/* Form Controls Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Title Input */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Damga Başlığı (Büyük Harf)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value.toUpperCase())}
                placeholder="Örn: ONAYLANDI, ÖNEMLİ, ÇÖZÜLDÜ"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold tracking-wider text-white focus:outline-none focus:border-rose-500 uppercase"
              />
            </div>

            {/* Subtitle Input */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Alt Metin / Açıklama
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Örn: KONTROL EDİLDİ, DERS NOTU"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            {/* Style Selector */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Damga & Mühür Geometrisi
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {STAMP_STYLES.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setStyle(st.id);
                    }}
                    className={`py-1.5 px-2 rounded-xl text-xs font-medium border text-center transition-all ${
                      style === st.id
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Rotation and Date */}
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-1">
                  <span>Eğim / Açı (Döndürme):</span>
                  <span className="font-mono text-rose-400">{rotationDeg}°</span>
                </div>
                <input
                  type="range"
                  min="-30"
                  max="30"
                  value={rotationDeg}
                  onChange={(e) => setRotationDeg(Number(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between bg-slate-800/80 p-2 rounded-xl border border-slate-700">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-300 cursor-pointer">
                  <Calendar size={14} className="text-rose-400" />
                  <span>Otomatik Tarih Ekle ({todayStr})</span>
                </label>
                <input
                  type="checkbox"
                  checked={includeDate}
                  onChange={(e) => setIncludeDate(e.target.checked)}
                  className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Color Palette Swatches */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-2">
              Mürekkep Rengi
            </label>
            <div className="flex items-center gap-2.5 flex-wrap">
              {STAMP_COLORS.map((c) => (
                <button
                  key={c.color}
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setColor(c.color);
                  }}
                  className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center ${
                    color === c.color ? 'scale-125 border-white shadow-lg' : 'border-transparent hover:scale-110'
                  }`}
                  style={{ backgroundColor: c.color }}
                  title={c.name}
                >
                  {color === c.color && <Check size={14} className="text-white drop-shadow" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-850 border-t border-slate-750 flex items-center justify-between">
          <button
            type="button"
            onClick={handleSaveToCollection}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
          >
            <BookmarkPlus size={15} />
            <span>Koleksiyonuma Kaydet</span>
          </button>

          <button
            type="button"
            onClick={handleStampToPage}
            className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-lg shadow-rose-600/30 hover:scale-105 transition-all"
          >
            <Stamp size={16} />
            <span>Doğrudan Sayfaya Damgala</span>
          </button>
        </div>
      </div>
    </div>
  );
};
