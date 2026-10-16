import React from 'react';
import { X, Keyboard, Sparkles, PenTool, Eraser, Scissors, Highlighter, Type, StickyNote, Ruler, ZoomIn, Bookmark, Search, RotateCcw, ArrowLeftRight, Map as MapIcon, Link2, TrendingUp, Stamp, FileDown, Table2 } from 'lucide-react';
import { triggerHaptic } from '../../engine/hapticFeedback';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  key: string;
  label: string;
  desc: string;
  icon?: React.ReactNode;
}

const DRAWING_SHORTCUTS: ShortcutItem[] = [
  { key: 'B', label: 'Tükenmez Kalem', desc: 'Hızlıca standart tükenmez kaleme geç', icon: <PenTool size={15} /> },
  { key: 'P', label: 'Dolma Kalem', desc: 'Kaligrafik basınca duyarlı dolma kalem', icon: <PenTool size={15} /> },
  { key: 'E', label: 'Silgi', desc: 'Vuruş veya piksel silgisine geçiş yap', icon: <Eraser size={15} /> },
  { key: 'L', label: 'Kement Aracı', desc: 'Çizimleri seçme, taşıma, renklendirme ve boyutlandırma', icon: <Scissors size={15} /> },
  { key: 'H', label: 'Fosforlu Kalem', desc: 'Ders notlarının üzerini yarı saydam çiz', icon: <Highlighter size={15} /> },
  { key: 'T', label: 'Metin Kutusu', desc: 'Klavyeyle yazı yazmak için metin alanı aç', icon: <Type size={15} /> },
  { key: 'S', label: 'Yapışkan Not', desc: 'Tuvale renkli post-it not yapıştır', icon: <StickyNote size={15} /> },
  { key: 'Tablo', label: 'İnteraktif Çizelge / Tablo', desc: 'Hücre içi metin, Tab ile gezinti ve satır/sütun ekleme özellikli tablo', icon: <Table2 size={15} /> },
];

const UTILITY_SHORTCUTS: ShortcutItem[] = [
  { key: 'Dışa Aktar', label: 'PDF / Belge Dışa Aktarma Stüdyosu', desc: 'Filigranlı, Bates numaralı, çok katmanlı PDF veya Retina PNG/JPEG olarak dışa aktar', icon: <FileDown size={15} /> },
  { key: 'Damga & Kaşe', label: 'Dinamik Kaşe & Mühür Stüdyosu', desc: 'Gerçekçi mühür efektli onay/dikkat damgaları ve kişisel çizim çıkartmalar tasarla', icon: <Stamp size={15} /> },
  { key: 'Grafik Çizici', label: 'STEM 2D Fonksiyon Çizici', desc: 'Matematiksel fonksiyon grafikleri çiz, kökleri analiz et ve sayfaya vektör olarak damgala', icon: <TrendingUp size={15} /> },
  { key: 'J', label: 'Ajanda Sekmeleri (Tabs)', desc: 'Dijital ajanda fihrist ve kenar sekmelerini göster/gizle', icon: <Bookmark size={15} /> },
  { key: 'N', label: 'Tuval Radarı (Mini Harita)', desc: 'İnteraktif radar mini harita ve hassas gezgini aç/kapat', icon: <MapIcon size={15} /> },
  { key: 'Q', label: 'Hızlı Karalama', desc: 'Yüzen Quick Note penceresini aç/kapat', icon: <Sparkles size={15} /> },
  { key: 'Z', label: 'Büyüteç Penceresi', desc: 'GoodNotes stili büyütülmüş yazma kutusunu aç/kapat', icon: <ZoomIn size={15} /> },
  { key: 'R', label: 'İnteraktif Cetvel', desc: 'Düz çizgi kılavuzu ve açı ölçer cetveli göster/gizle', icon: <Ruler size={15} /> },
  { key: 'M', label: 'Kenarlık Çalışma Alanı', desc: 'LiquidText stili alıntı ve özet çekmecesini aç', icon: <Bookmark size={15} /> },
  { key: '⌘ / Ctrl + K', label: 'Evrensel Arama', desc: 'Tüm defter ve sayfalar içinde anında arama yap', icon: <Search size={15} /> },
  { key: '?', label: 'Kısayol Kılavuzu', desc: 'Bu kısayol bilgi penceresini açar', icon: <Keyboard size={15} /> },
];

const NAV_SHORTCUTS: ShortcutItem[] = [
  { key: '← / PageUp', label: 'Önceki Sayfa', desc: 'Bir önceki sayfaya yumuşak geçiş yap' },
  { key: '→ / PageDown', label: 'Sonraki Sayfa', desc: 'Bir sonraki sayfaya yumuşak geçiş yap' },
  { key: '🔗 Köprü / Hotspot', label: 'İnteraktif Sayfa Köprüleri', desc: 'Metin, şekil, not veya çizimlere tıklanabilir sayfa geçiş ve web linkleri bağlama', icon: <Link2 size={15} /> },
  { key: '2 Parmak Kaydırma', label: 'Sayfa Çevirme', desc: 'Trackpad veya dokunmatik ekranda yatay kaydırarak sayfa çevir' },
  { key: '⌘ / Ctrl + Z', label: 'Geri Al', desc: 'Son çizimi veya işlemi geri al', icon: <RotateCcw size={15} /> },
  { key: '⌘ + ⇧ + Z / Ctrl + Y', label: 'İleri Al', desc: 'Geri alınan işlemi tekrar uygula' },
];

const GESTURE_SHORTCUTS: ShortcutItem[] = [
  { key: 'Kementle Düzleştir', label: 'El Yazısı Taban Çizgisini Düzleştirme (Straighten)', desc: 'Eğri kayan el yazısını kementle seçip "Düzleştir"e dokunarak yatay hizaya ve kılavuza oturt' },
  { key: 'Zikzak Karalama', label: 'Karalayarak Silme (Scribble-to-Erase)', desc: 'Silgiye geçmeden yanlış kelimenin/çizimin üzerini zikzak karalayarak anında sil' },
  { key: 'Daire Çizip Bekleme', label: 'Daireyle Kement (Circle-to-Lasso)', desc: 'Kalemle bir öbeğin etrafına çember çizip 400ms bekleyerek otomatik kement seçimine dönüştür' },
  { key: 'Çizip Bekleme', label: 'Şekil Sabitleme (Hold-to-Snap)', desc: 'Düz çizgi, ok, daire veya dikdörtgen çizip kalemi kaldırmadan bekleyince kusursuz şekle sabitle' },
  { key: 'Çift Dokunma (Stylus)', label: 'Apple Pencil Çift Tıklama', desc: 'Kalem gövdesine çift dokunarak hızlıca Kalem / Silgi arasında geçiş yap' },
];

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md select-none animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
              <Keyboard size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Klavye Kısayolları Kılavuzu</span>
                <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-mono">
                  Power User
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Notefree üzerinde fareye dokunmadan hızlıca çalışabilmeniz için kısayollar
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/60 rounded-xl transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-200">
          {/* Section 1: Drawing tools */}
          <div>
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <PenTool size={14} />
              <span>Çizim & Yazım Araçları</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {DRAWING_SHORTCUTS.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-2.5 bg-slate-800/50 hover:bg-slate-800/80 rounded-xl border border-slate-700/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <span className="text-indigo-400 shrink-0">{item.icon}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-100">{item.label}</div>
                      <div className="text-[11px] text-slate-400 truncate">{item.desc}</div>
                    </div>
                  </div>
                  <kbd className="px-2.5 py-1 bg-slate-950 text-amber-300 font-mono text-xs font-bold rounded-lg border border-slate-700 shadow-sm shrink-0">
                    {item.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Utilities & Floating tools */}
          <div>
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Sparkles size={14} />
              <span>Yardımcı Araçlar & Yüzen Pencereler</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {UTILITY_SHORTCUTS.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-2.5 bg-slate-800/50 hover:bg-slate-800/80 rounded-xl border border-slate-700/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <span className="text-cyan-400 shrink-0">{item.icon}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-100">{item.label}</div>
                      <div className="text-[11px] text-slate-400 truncate">{item.desc}</div>
                    </div>
                  </div>
                  <kbd className="px-2.5 py-1 bg-slate-950 text-cyan-300 font-mono text-xs font-bold rounded-lg border border-slate-700 shadow-sm shrink-0">
                    {item.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Navigation & History */}
          <div>
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <ArrowLeftRight size={14} />
              <span>Gezinme, Hareketler & Geçmiş</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {NAV_SHORTCUTS.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-2.5 bg-slate-800/50 hover:bg-slate-800/80 rounded-xl border border-slate-700/50 transition-colors"
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-semibold text-slate-100">{item.label}</div>
                    <div className="text-[11px] text-slate-400 truncate">{item.desc}</div>
                  </div>
                  <kbd className="px-2.5 py-1 bg-slate-950 text-emerald-300 font-mono text-xs font-bold rounded-lg border border-slate-700 shadow-sm shrink-0">
                    {item.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Smart Stylus & Handwriting Gestures */}
          <div>
            <h3 className="text-xs font-bold text-violet-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Sparkles size={14} />
              <span>Akıllı El Yazısı & Kalem Jestleri (GoodNotes Stili)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {GESTURE_SHORTCUTS.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-2.5 bg-slate-800/50 hover:bg-slate-800/80 rounded-xl border border-slate-700/50 transition-colors"
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-semibold text-slate-100">{item.label}</div>
                    <div className="text-[11px] text-slate-400">{item.desc}</div>
                  </div>
                  <kbd className="px-2.5 py-1 bg-slate-950 text-violet-300 font-mono text-xs font-bold rounded-lg border border-slate-700 shadow-sm shrink-0 whitespace-nowrap">
                    {item.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-800/80 border-t border-slate-700/80 flex items-center justify-between text-xs text-slate-400">
          <span>İpucu: Tuval üzerinde herhangi bir yazı alanında değilseniz tuşlara doğrudan basabilirsiniz.</span>
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors"
          >
            Anladım
          </button>
        </div>
      </div>
    </div>
  );
};
