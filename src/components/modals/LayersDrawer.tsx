import React from 'react';
import { useNotebookStore } from '../../store/notebookStore';
import { LayerVisibilitySettings, LayerLockSettings } from '../../types/notebook';
import {
  Layers,
  X,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  PenTool,
  Highlighter,
  Type,
  Sparkles,
  Bandage,
  PaintBucket,
  FileText,
  RotateCcw,
  Table2,
} from 'lucide-react';

export const LayersDrawer: React.FC = () => {
  const {
    layersDrawerOpen,
    setLayersDrawerOpen,
    layers,
    layerLocks,
    toggleLayerVisibility,
    toggleLayerLock,
    notebooks,
    activeNotebookId,
    activePageIndex,
  } = useNotebookStore();

  if (!layersDrawerOpen) return null;

  const activeNotebook = notebooks.find((n) => n.id === activeNotebookId);
  const currentPage = activeNotebook?.pages[activePageIndex];

  const strokeCount = (currentPage?.strokes || []).filter((s) => s.tool !== 'highlighter').length;
  const highlighterCount = (currentPage?.strokes || []).filter((s) => s.tool === 'highlighter').length;
  const textCount = currentPage?.texts?.length || 0;
  const stickerCount = currentPage?.stickers?.length || 0;
  const tapeCount = currentPage?.tapes?.length || 0;
  const fillCount = currentPage?.fills?.length || 0;
  const tableCount = currentPage?.tables?.length || 0;

  const layerItems: {
    key: keyof LayerVisibilitySettings;
    name: string;
    description: string;
    count: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      key: 'tables',
      name: 'İnteraktif Tablolar',
      description: 'Tablo ve çizelge matrisleri',
      count: `${tableCount} tablo`,
      icon: <Table2 size={16} />,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    },
    {
      key: 'stickers',
      name: 'Öğeler & Çıkartmalar',
      description: 'Eklenen çıkartma ve grafikler',
      count: `${stickerCount} adet`,
      icon: <Sparkles size={16} />,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
    {
      key: 'texts',
      name: 'Metin Kutuları',
      description: 'Yazılı açıklamalar ve notlar',
      count: `${textCount} metin`,
      icon: <Type size={16} />,
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    },
    {
      key: 'tapes',
      name: 'Gizleme Bantları',
      description: 'Çalışma ve soru-cevap bantları',
      count: `${tapeCount} bant`,
      icon: <Bandage size={16} />,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      key: 'strokes',
      name: 'Mürekkep Çizimleri',
      description: 'Dolma, tükenmez ve kurşun kalemler',
      count: `${strokeCount} çizim`,
      icon: <PenTool size={16} />,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    },
    {
      key: 'highlighters',
      name: 'Fosforlu Vurgulamalar',
      description: 'Metin ve çizim vurguları',
      count: `${highlighterCount} vurgu`,
      icon: <Highlighter size={16} />,
      color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    },
    {
      key: 'fills',
      name: 'Boya Kovası Dolguları',
      description: 'Kapalı alan renk dolguları',
      count: `${fillCount} dolgu`,
      icon: <PaintBucket size={16} />,
      color: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    },
    {
      key: 'background',
      name: 'Arka Plan & Şablon',
      description: 'PDF dokümanı veya defter ızgarası',
      count: currentPage?.backgroundImageUrl ? 'PDF Sayfası' : 'Kağıt Şablonu',
      icon: <FileText size={16} />,
      color: 'text-slate-400 bg-slate-800 border-slate-700',
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden"
        onClick={() => setLayersDrawerOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 w-80 max-w-[85vw] sm:w-92 bg-slate-900/95 backdrop-blur-xl border-l border-slate-800 z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200 select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-md">
            <Layers size={17} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Katmanlar (Layers)</h3>
            <p className="text-[10px] text-slate-400">Görünürlük & Kilit Yönetimi</p>
          </div>
        </div>

        <button
          onClick={() => setLayersDrawerOpen(false)}
          className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
        >
          <X size={16} />
        </button>
      </div>

      {/* Info Banner */}
      <div className="p-3 bg-slate-850/60 border-b border-slate-800/80 text-[11px] text-slate-400 px-4">
        💡 Kilitli katmanlar silgiden ve kement seçiminden etkilenmez. Gizlenen katmanlar geçici olarak ekrandan kaldırılır.
      </div>

      {/* Layer Stacks List */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-2">
        {layerItems.map((layer) => {
          const isVisible = layers[layer.key];
          const isLocked = layerLocks[layer.key];

          return (
            <div
              key={layer.key}
              className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                !isVisible
                  ? 'bg-slate-900/40 border-slate-850 opacity-60'
                  : isLocked
                  ? 'bg-slate-850/80 border-amber-500/30'
                  : 'bg-slate-850/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${layer.color}`}
                >
                  {layer.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-200 truncate">
                      {layer.name}
                    </span>
                    {isLocked && (
                      <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-medium">
                        Kilitli
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">
                    {layer.count} • {layer.description}
                  </p>
                </div>
              </div>

              {/* Action Toggles: Visibility & Lock */}
              <div className="flex items-center gap-1 shrink-0">
                {/* Lock Toggle */}
                <button
                  onClick={() => toggleLayerLock(layer.key)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isLocked
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                  }`}
                  title={isLocked ? 'Katman Kilidini Kaldır' : 'Katmanı Kilitle (Seçilmez/Silinmez)'}
                >
                  {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
                </button>

                {/* Visibility Toggle */}
                <button
                  onClick={() => toggleLayerVisibility(layer.key)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isVisible
                      ? 'text-indigo-400 hover:text-indigo-300 hover:bg-slate-800'
                      : 'bg-slate-800 text-slate-500 hover:text-slate-400'
                  }`}
                  title={isVisible ? 'Katmanı Gizle' : 'Katmanı Göster'}
                >
                  {isVisible ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/80 text-[11px] text-slate-400 flex items-center justify-between px-4">
        <span>Sayfa #{activePageIndex + 1} Katmanları</span>
        <span className="text-indigo-400 font-medium">Concepts & Procreate Motoru</span>
      </div>
    </div>
  </>
);
};
