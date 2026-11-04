import React from 'react';
import {
  X,
  PenTool,
  Hand,
  Sparkles,
  RotateCcw,
  Palette,
  Eraser,
  Sliders,
  PanelLeft,
  PanelRight,
  Maximize2,
  Check,
  Zap,
} from 'lucide-react';
import { useNotebookStore } from '../../store/notebookStore';
import { StylusDoubleTapAction } from '../../types/notebook';
import { triggerHaptic } from '../../engine/hapticFeedback';

interface StylusSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StylusSettingsModal: React.FC<StylusSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    toolSettings,
    togglePalmRejection,
    toggleOnlyStylusDraw,
    toggleTiltShading,
    setStylusDoubleTapAction,
    toggleScribbleToErase,
    toggleCircleToLasso,
    tabletToolbarPlacement,
    setTabletToolbarPlacement,
  } = useNotebookStore();

  if (!isOpen) return null;

  const DOUBLE_TAP_OPTIONS: {
    id: StylusDoubleTapAction;
    title: string;
    desc: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'switch-eraser',
      title: 'Kalem ⇄ Silgi Geçişi',
      desc: 'Mevcut kalem ile silgi arasında anında geçiş yapın (Apple Notes stili)',
      icon: <Eraser size={18} className="text-rose-400" />,
    },
    {
      id: 'switch-last-tool',
      title: 'Son Kullanılan Araca Geç',
      desc: 'En son kullandığınız iki çizim aracı arasında hızlıca geçiş yapın',
      icon: <PenTool size={18} className="text-indigo-400" />,
    },
    {
      id: 'show-radial-menu',
      title: 'Hızlı Radyal Menü (HUD)',
      desc: 'Kalemin tam ucunda dairesel renk, kalınlık ve araç paletini açın',
      icon: <Sparkles size={18} className="text-amber-400" />,
    },
    {
      id: 'show-color-palette',
      title: 'Renk Stüdyosunu Aç',
      desc: 'Favori renkleri ve özel renk seçici paletini açın',
      icon: <Palette size={18} className="text-cyan-400" />,
    },
    {
      id: 'undo',
      title: 'Son İşlemi Geri Al',
      desc: 'Çift dokunarak son çizgi veya silme hareketini geri alın',
      icon: <RotateCcw size={18} className="text-emerald-400" />,
    },
    {
      id: 'none',
      title: 'Devre Dışı Bırak',
      desc: 'Çift dokunma hareketini kapatın',
      icon: <X size={18} className="text-slate-400" />,
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-[#090d16] border border-white/15 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-100 ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/60 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-inner">
              <PenTool size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Apple Pencil & Dokunmatik Stüdyosu
              </h2>
              <p className="text-xs text-slate-400">
                Stylus donanımı, avuç içi engelleme ve el ergonomisi ayarları
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Kapat"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs text-slate-300">
          {/* Section 1: Apple Pencil Hardware Double Tap */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-indigo-300 font-bold uppercase tracking-wider text-[11px]">
              <Zap size={14} />
              <span>Apple Pencil & Stylus Çift Dokunma Eylemi</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Apple Pencil 2 / Pro gövdesine parmağınızla iki kez dokunduğunuzda veya kalem düğmesine bastığınızda çalışacak eylem:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {DOUBLE_TAP_OPTIONS.map((opt) => {
                const isSelected = toolSettings.stylusDoubleTapAction === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setStylusDoubleTapAction(opt.id);
                    }}
                    className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 text-white ring-1 ring-indigo-400/40 shadow-md'
                        : 'bg-slate-900/60 border-white/5 hover:border-white/20 text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-slate-950/60 border border-white/5 shrink-0 mt-0.5">
                      {opt.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-white">
                          {opt.title}
                        </span>
                        {isSelected && (
                          <Check size={14} className="text-indigo-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed line-clamp-2">
                        {opt.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Section 2: Inking & Palm Rejection Ergonomics */}
          <section className="space-y-3 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-emerald-300 font-bold uppercase tracking-wider text-[11px]">
              <Hand size={14} />
              <span>Çizim & Avuç İçi Ergonomisi</span>
            </div>

            <div className="space-y-2.5">
              {/* Only Stylus Draws Toggle */}
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="font-semibold text-xs text-white flex items-center gap-2">
                    <span>Yalnızca Apple Pencil ile Çizim</span>
                    {toolSettings.onlyStylusDraw && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                        Aktif
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Açıkken parmaklarınız yalnızca sayfayı kaydırır ve yakınlaştırır. Ekrana elinizi dayasanız bile yalnızca kalem mürekkep bırakır.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    toggleOnlyStylusDraw();
                  }}
                  className={`w-12 h-7 rounded-full p-1 transition-colors relative shrink-0 ${
                    toolSettings.onlyStylusDraw ? 'bg-emerald-600' : 'bg-slate-750'
                  }`}
                  title="Yalnızca Kalem Modunu Aç/Kapat"
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform shadow-md ${
                      toolSettings.onlyStylusDraw ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Hardware Palm Rejection Toggle */}
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="font-semibold text-xs text-white">
                    Akıllı Avuç İçi Koruması (Palm Rejection)
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Yazarken ekrana değen el ayasının geniş temas alanını otomatik filtreleyerek istenmeyen lekeleri önler.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    togglePalmRejection();
                  }}
                  className={`w-12 h-7 rounded-full p-1 transition-colors relative shrink-0 ${
                    toolSettings.palmRejection ? 'bg-indigo-600' : 'bg-slate-750'
                  }`}
                  title="Avuç İçi Filtresini Aç/Kapat"
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform shadow-md ${
                      toolSettings.palmRejection ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Tilt Shading Toggle */}
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="font-semibold text-xs text-white">
                    Kurşun Kalem Eğim Gölgelendirmesi (Tilt Shading)
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Apple Pencil veya kalemi açılı tuttuğunuzda kurşun kalem gerçek grafit tozu gibi geniş ve yumuşak gölgeleme yapar.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    toggleTiltShading();
                  }}
                  className={`w-12 h-7 rounded-full p-1 transition-colors relative shrink-0 ${
                    toolSettings.tiltShading ? 'bg-indigo-600' : 'bg-slate-750'
                  }`}
                  title="Eğimle Gölgelendirmeyi Aç/Kapat"
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform shadow-md ${
                      toolSettings.tiltShading ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>

          {/* Section 3: Smart Gestures */}
          <section className="space-y-3 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-amber-300 font-bold uppercase tracking-wider text-[11px]">
              <Sparkles size={14} />
              <span>Akıllı El Yazısı Jestleri</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Scribble to Erase */}
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-semibold text-xs text-white">
                    Zikzakla Karalayarak Silme
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Yanlış yazdığınız bir kelimenin veya şeklin üzerini zikzakla karaladığınızda anında silinir.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    toggleScribbleToErase();
                  }}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors relative shrink-0 ${
                    toolSettings.scribbleToErase !== false ? 'bg-indigo-600' : 'bg-slate-750'
                  }`}
                  title="Karalayarak Silmeyi Aç/Kapat"
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform shadow-md ${
                      toolSettings.scribbleToErase !== false ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Circle to Lasso */}
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-semibold text-xs text-white">
                    Daire Çizip Kement Seçimi
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Yazı veya nesnelerin etrafına çember çizip kalemi 300ms beklettiğinizde otomatik kemente dönüşür.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    toggleCircleToLasso();
                  }}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors relative shrink-0 ${
                    toolSettings.circleToLasso !== false ? 'bg-indigo-600' : 'bg-slate-750'
                  }`}
                  title="Daire ile Kement Seçimini Aç/Kapat"
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform shadow-md ${
                      toolSettings.circleToLasso !== false ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>

          {/* Section 4: Tablet / iPad Dock Placement */}
          <section className="space-y-3 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-cyan-300 font-bold uppercase tracking-wider text-[11px]">
              <Sliders size={14} />
              <span>iPad Araç Çubuğu Konumu</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Tablet yatay moddayken araç kutusunu elinizin ulaştığı konuma sabitleyin:
            </p>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setTabletToolbarPlacement('top');
                }}
                className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-2 transition-all ${
                  tabletToolbarPlacement === 'top'
                    ? 'bg-indigo-600/25 border-indigo-500 text-white font-bold ring-1 ring-indigo-400'
                    : 'bg-slate-900/60 border-white/5 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Maximize2 size={16} className="text-indigo-400" />
                <span className="text-xs">Üst Çubuk</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setTabletToolbarPlacement('left');
                }}
                className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-2 transition-all ${
                  tabletToolbarPlacement === 'left'
                    ? 'bg-indigo-600/25 border-indigo-500 text-white font-bold ring-1 ring-indigo-400'
                    : 'bg-slate-900/60 border-white/5 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <PanelLeft size={16} className="text-cyan-400" />
                <span className="text-xs">Sol Kenar (Dikey)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setTabletToolbarPlacement('right');
                }}
                className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-2 transition-all ${
                  tabletToolbarPlacement === 'right'
                    ? 'bg-indigo-600/25 border-indigo-500 text-white font-bold ring-1 ring-indigo-400'
                    : 'bg-slate-900/60 border-white/5 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <PanelRight size={16} className="text-amber-400" />
                <span className="text-xs">Sağ Kenar (Solaklar)</span>
              </button>
            </div>
          </section>

          {/* Section 5: Multi-Touch Gestures Reference Card */}
          <section className="space-y-3 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
              <Sparkles size={14} />
              <span>Çoklu Dokunma Jest Kılavuzu</span>
            </div>

            <div className="bg-slate-900/70 border border-white/5 rounded-2xl p-3.5 space-y-2 text-[11px]">
              <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                <span className="font-bold text-white flex items-center gap-2">
                  <span>✌️ 2 Parmakla Dokun</span>
                </span>
                <span className="text-indigo-300 font-mono font-semibold">Geri Al (Undo ↺)</span>
              </div>
              <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                <span className="font-bold text-white flex items-center gap-2">
                  <span>🤟 3 Parmakla Dokun</span>
                </span>
                <span className="text-emerald-300 font-mono font-semibold">İleri Al (Redo ↻)</span>
              </div>
              <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                <span className="font-bold text-white flex items-center gap-2">
                  <span>🤏 2 Parmakla Çimdik</span>
                </span>
                <span className="text-amber-300 font-mono font-semibold">Yakınlaştır / Uzaklaştır (%40 - %300)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-2">
                  <span>🖐️ 2 Parmak Yatay Kaydırma</span>
                </span>
                <span className="text-cyan-300 font-mono font-semibold">Sonraki / Önceki Sayfaya Geç</span>
              </div>
            </div>
          </section>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-white/10 bg-slate-900/60 backdrop-blur-xl flex items-center justify-end">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="px-5 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
          >
            Tamam
          </button>
        </div>
      </div>
    </div>
  );
};
