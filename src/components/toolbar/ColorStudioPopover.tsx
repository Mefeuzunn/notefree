import React, { useState } from 'react';
import { useNotebookStore } from '../../store/notebookStore';
import {
  Palette,
  Pipette,
  Check,
  Plus,
  Sparkles,
  History,
  Sliders,
  X,
  BookmarkPlus,
} from 'lucide-react';
import { triggerHaptic } from '../../engine/hapticFeedback';

// Curated Professional Palettes
export const PALETTE_CATEGORIES = [
  {
    id: 'classic',
    name: 'Klasik & Ofis',
    icon: '🏢',
    colors: [
      { name: 'Kömür Siyahı', hex: '#090d16' },
      { name: 'Grafit Grisi', hex: '#334155' },
      { name: 'Gece Mavisi', hex: '#1e3a8a' },
      { name: 'Kraliyet Mavisi', hex: '#2563eb' },
      { name: 'Okyanus Camgöbeği', hex: '#0284c7' },
      { name: 'Koyu Orman', hex: '#064e3b' },
      { name: 'Zümrüt Yeşili', hex: '#10b981' },
      { name: 'Asil Bordo', hex: '#881337' },
      { name: 'Alev Kırmızısı', hex: '#dc2626' },
      { name: 'Sıcak Turuncu', hex: '#ea580c' },
      { name: 'Kehribar Sarısı', hex: '#d97706' },
      { name: 'Derin Mor', hex: '#6b21a8' },
      { name: 'Füme Arduvaz', hex: '#64748b' },
      { name: 'Saf Kar Beyazı', hex: '#ffffff' },
    ],
  },
  {
    id: 'pastel',
    name: 'Pastel Rüyası',
    icon: '🌸',
    colors: [
      { name: 'Pastel Gül', hex: '#fda4af' },
      { name: 'Toz Pembe', hex: '#f472b6' },
      { name: 'Şeftali Kreması', hex: '#fdba74' },
      { name: 'Tereyağı Sarısı', hex: '#fef08a' },
      { name: 'Pastel Nane', hex: '#86efac' },
      { name: 'Bebek Mavisi', hex: '#93c5fd' },
      { name: 'Buzul Camgöbeği', hex: '#a5f3fc' },
      { name: 'Lavanta Çiçeği', hex: '#c4b5fd' },
      { name: 'Puslu Leylak', hex: '#e9d5ff' },
      { name: 'Morandi Adaçayı', hex: '#a3b18a' },
      { name: 'Yumuşak Cappuccino', hex: '#d4a373' },
      { name: 'Krem Bej', hex: '#fef3c7' },
    ],
  },
  {
    id: 'highlighter',
    name: 'Fosforlu Kalem',
    icon: '🖍️',
    colors: [
      { name: 'Floresan Sarı', hex: '#fef08a' },
      { name: 'Elektrik Sarısı', hex: '#facc15' },
      { name: 'Fosforlu Pembe', hex: '#f472b6' },
      { name: 'Fosforlu Neon Pembe', hex: '#ff66cc' },
      { name: 'Fosforlu Nane', hex: '#4ade80' },
      { name: 'Fosforlu Camgöbeği', hex: '#38bdf8' },
      { name: 'Fosforlu Turuncu', hex: '#fb923c' },
      { name: 'Fosforlu Mor', hex: '#c084fc' },
      { name: 'Mercan Parıltısı', hex: '#fb7185' },
      { name: 'Açık Limon', hex: '#fef9c3' },
    ],
  },
  {
    id: 'morandi',
    name: 'Morandi & Doğa',
    icon: '🌿',
    colors: [
      { name: 'Zeytin Yeşili', hex: '#556b2f' },
      { name: 'Orman Yosunu', hex: '#2d6a4f' },
      { name: 'Kiremit Terracotta', hex: '#c86446' },
      { name: 'Taba Deri', hex: '#b38059' },
      { name: 'Çöl Kumu', hex: '#d8c3a5' },
      { name: 'Puslu İndigo', hex: '#466995' },
      { name: 'Koyu Haki', hex: '#4b5320' },
      { name: 'Çini Mürekkebi', hex: '#2f4f4f' },
      { name: 'Sıcak Taupe', hex: '#8e8279' },
      { name: 'Tozlu Gül', hex: '#b76e79' },
      { name: 'Antik Kömür', hex: '#2b2d42' },
      { name: 'Taş Grisi', hex: '#6c757d' },
    ],
  },
  {
    id: 'neon',
    name: 'Neon & Gece',
    icon: '⚡',
    colors: [
      { name: 'Siber Cyan', hex: '#06b6d4' },
      { name: 'Neon Zümrüt', hex: '#22c55e' },
      { name: 'Güneş Parlaması', hex: '#eab308' },
      { name: 'Akkor Fuşya', hex: '#f43f5e' },
      { name: 'Elektrik Menekşe', hex: '#a855f7' },
      { name: 'Lazer Turuncu', hex: '#ff6b00' },
      { name: 'Siber Yeşil', hex: '#10b981' },
      { name: 'Kobalt Mavi', hex: '#3b82f6' },
      { name: 'Lazer Kırmızı', hex: '#ef4444' },
      { name: 'Neon Lavanta', hex: '#8b5cf6' },
      { name: 'Neon Altın', hex: '#f59e0b' },
      { name: 'Radyan İndigo', hex: '#6366f1' },
    ],
  },
  {
    id: 'artist',
    name: 'Sanatçı & Manga',
    icon: '🎨',
    colors: [
      { name: 'Porselen Ten', hex: '#feeae6' },
      { name: 'Açık Ten', hex: '#fcd5ce' },
      { name: 'Sıcak Şeftali Ten', hex: '#f8b195' },
      { name: 'Buğday Ten', hex: '#e0a96d' },
      { name: 'Karamel Ten', hex: '#c68642' },
      { name: 'Bronz Ten', hex: '#8d5524' },
      { name: 'Koyu Çikolata', hex: '#4a2c11' },
      { name: 'Mürekkep Karası', hex: '#000000' },
      { name: 'Koyu Kurşun', hex: '#374151' },
      { name: 'Nötr Gri', hex: '#6b7280' },
      { name: 'Gümüş Gri', hex: '#d1d5db' },
      { name: 'Saf Kağıt', hex: '#ffffff' },
    ],
  },
];

interface ColorStudioPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  activeSlotIndex?: number | null;
}

export const ColorStudioPopover: React.FC<ColorStudioPopoverProps> = ({
  isOpen,
  onClose,
  activeSlotIndex = null,
}) => {
  const {
    toolSettings,
    setToolColor,
    setFavoriteColor,
    setToolOpacity,
  } = useNotebookStore();

  const [activeTab, setActiveTab] = useState<'palettes' | 'custom' | 'recents'>('palettes');
  const [selectedCategory, setSelectedCategory] = useState<string>('classic');
  const [hexInput, setHexInput] = useState<string>(toolSettings.color || '#6366f1');

  if (!isOpen) return null;

  const currentColor = toolSettings.color;
  const currentOpacity = toolSettings.opacity ?? 1;
  const recentColors = toolSettings.recentColors || [
    '#0f172a',
    '#1e40af',
    '#b91c1c',
    '#047857',
    '#6d28d9',
    '#d97706',
    '#ea580c',
    '#facc15',
  ];

  const handleApplyColor = (hex: string) => {
    triggerHaptic('light');
    setToolColor(hex);
    setHexInput(hex);
    if (activeSlotIndex !== null) {
      setFavoriteColor(activeSlotIndex, hex);
    }
  };

  const handleAssignToFavoriteSlot = (slotIndex: number) => {
    triggerHaptic('medium');
    setFavoriteColor(slotIndex, currentColor);
  };

  // Screen eyedropper support (Native EyeDropper API)
  const handleEyeDropper = async () => {
    if ('EyeDropper' in window) {
      try {
        triggerHaptic('medium');
        // @ts-ignore
        const eyeDropper = new window.EyeDropper();
        const result = await eyeDropper.open();
        if (result && result.sRGBHex) {
          handleApplyColor(result.sRGBHex);
        }
      } catch (err) {
        // User cancelled eyedropper
      }
    } else {
      alert('Ekrandan renk damlalığı bu tarayıcıda desteklenmiyor.');
    }
  };

  const currentCategoryObj =
    PALETTE_CATEGORIES.find((c) => c.id === selectedCategory) || PALETTE_CATEGORIES[0];

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="fixed bottom-18 left-1/2 -translate-x-1/2 md:absolute md:bottom-auto md:top-14 md:left-1/2 md:-translate-x-1/2 bg-[#090d16]/95 border border-white/15 shadow-2xl rounded-3xl p-4 w-[92vw] max-w-[390px] z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-3xl text-white ring-1 ring-white/10 select-none max-h-[75vh] md:max-h-[85vh] overflow-y-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/30 ring-1 ring-white/20">
            <Palette size={16} />
          </div>
          <div>
            <h3 className="font-display text-sm font-bold tracking-tight text-white flex items-center gap-2">
              Renk Stüdyosu
              {activeSlotIndex !== null && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                  Yuva {activeSlotIndex + 1}
                </span>
              )}
            </h3>
            <p className="text-[10px] text-slate-400">Tüm kalem ve fırça renkleri</p>
          </div>
        </div>

        {/* Current Color Indicator & Close */}
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-xl border border-white/20 shadow-md ring-1 ring-black/40 flex items-center justify-center"
            style={{ backgroundColor: currentColor }}
            title={`Aktif Renk: ${currentColor}`}
          >
            <div className="w-2 h-2 rounded-full bg-white/40" />
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Main Tabs (Paletler / Özel Renk / Geçmiş) */}
      <div className="grid grid-cols-3 p-1 bg-slate-900/90 rounded-2xl border border-white/10 text-xs font-semibold text-center my-3 gap-1">
        <button
          onClick={() => setActiveTab('palettes')}
          className={`py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'palettes'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles size={13} />
          <span>Paletler</span>
        </button>

        <button
          onClick={() => setActiveTab('custom')}
          className={`py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'custom'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders size={13} />
          <span>Özel Seçici</span>
        </button>

        <button
          onClick={() => setActiveTab('recents')}
          className={`py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'recents'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <History size={13} />
          <span>Geçmiş</span>
        </button>
      </div>

      {/* TAB 1: CURATED PALETTES */}
      {activeTab === 'palettes' && (
        <div className="space-y-3">
          {/* Category Pill Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
            {PALETTE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all shrink-0 flex items-center gap-1 border ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/40 ring-1 ring-indigo-400/30 shadow-xs'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border-white/5 hover:border-white/10'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>

          {/* Color Grid */}
          <div className="grid grid-cols-6 gap-2 bg-slate-900/70 p-3 rounded-2xl border border-white/10 max-h-52 overflow-y-auto">
            {currentCategoryObj.colors.map((c) => {
              const isSelected = currentColor.toLowerCase() === c.hex.toLowerCase();
              return (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => handleApplyColor(c.hex)}
                  className={`group relative aspect-square rounded-xl transition-all flex items-center justify-center hover:scale-110 shadow-sm border ${
                    isSelected
                      ? 'ring-2 ring-white scale-110 shadow-lg border-transparent'
                      : 'border-white/15 hover:border-white/40'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={`${c.name} (${c.hex})`}
                >
                  {isSelected && (
                    <Check
                      size={14}
                      className={
                        c.hex === '#ffffff' || c.hex === '#fef08a' || c.hex === '#feeae6'
                          ? 'text-slate-900 stroke-[3]'
                          : 'text-white stroke-[3]'
                      }
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: CUSTOM COLOR PICKER & SLIDERS */}
      {activeTab === 'custom' && (
        <div className="space-y-3.5 bg-slate-900/70 p-3.5 rounded-2xl border border-white/10">
          {/* HTML5 Native Color Spectrum Picker */}
          <div className="flex items-center gap-3">
            <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-white/20 shadow-md ring-1 ring-black/40 shrink-0 cursor-pointer">
              <input
                type="color"
                value={currentColor}
                onChange={(e) => handleApplyColor(e.target.value)}
                className="absolute inset-0 w-[200%] h-[200%] -top-1/2 -left-1/2 cursor-pointer border-none"
              />
            </div>

            <div className="flex-1">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                HEX Renk Kodu
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={hexInput}
                  onChange={(e) => {
                    setHexInput(e.target.value);
                    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                      handleApplyColor(e.target.value);
                    }
                  }}
                  placeholder="#000000"
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500 uppercase"
                />
                {'EyeDropper' in window && (
                  <button
                    onClick={handleEyeDropper}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 transition-colors shrink-0"
                    title="Ekrandan Renk Seç (Damlalık)"
                  >
                    <Pipette size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Opacity Slider */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-[11px] font-semibold text-slate-400">Kalem Saydamlığı (Opaklık)</span>
              <span className="font-mono text-indigo-400 font-bold">
                %{Math.round(currentOpacity * 100)}
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={currentOpacity}
              onChange={(e) => setToolOpacity(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* TAB 3: RECENT COLORS */}
      {activeTab === 'recents' && (
        <div className="space-y-2 bg-slate-900/70 p-3.5 rounded-2xl border border-white/10">
          <div className="text-[11px] font-semibold text-slate-400 mb-2">
            Son Kullanılan Renkler ({recentColors.length})
          </div>
          <div className="grid grid-cols-8 gap-2">
            {recentColors.map((hex, idx) => (
              <button
                key={`${hex}-${idx}`}
                type="button"
                onClick={() => handleApplyColor(hex)}
                className={`w-7 h-7 rounded-xl transition-all flex items-center justify-center hover:scale-110 shadow-sm border ${
                  currentColor.toLowerCase() === hex.toLowerCase()
                    ? 'ring-2 ring-white scale-110 border-transparent'
                    : 'border-white/15 hover:border-white/40'
                }`}
                style={{ backgroundColor: hex }}
                title={hex}
              >
                {currentColor.toLowerCase() === hex.toLowerCase() && (
                  <Check
                    size={11}
                    className={
                      hex === '#ffffff' || hex === '#fef08a' ? 'text-slate-900' : 'text-white'
                    }
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom: Assign to Quick Favorite Slots */}
      <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between">
        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
          Favori Yuvasına Ata:
        </span>
        <div className="flex items-center gap-1.5">
          {toolSettings.favoriteColors.map((favColor, slotIdx) => (
            <button
              key={slotIdx}
              onClick={() => handleAssignToFavoriteSlot(slotIdx)}
              className="flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-[10px] font-semibold text-slate-300 hover:text-white transition-all hover:scale-105 active:scale-95"
              title={`Aktif rengi (${currentColor}) Yuva ${slotIdx + 1}'e kaydet`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: favColor }}
              />
              <span>Y{slotIdx + 1}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
