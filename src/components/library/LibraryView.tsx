import React, { useState, useRef } from 'react';
import { useNotebookStore } from '../../store/notebookStore';
import { CoverStyle, Notebook, PageTemplate, PaperColor } from '../../types/notebook';
import { NotebookLockModal } from '../modals/NotebookLockModal';
import {
  Plus,
  Search,
  Trash2,
  UploadCloud,
  X,
  BookOpen,
  FileUp,
  Lock,
  Unlock,
  KeyRound,
  Archive,
  Star,
  Clock,
  Sparkles,
  LayoutGrid,
  List,
  Layers,
  MoreVertical,
  Download,
  Book,
  Check,
  FileText,
  Palette,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { exportNotebookAsNotefree } from '../../services/storage';
import { triggerHaptic } from '../../engine/hapticFeedback';

const COVER_COLORS = [
  '#3b82f6', // Sapphire Blue
  '#10b981', // Emerald Green
  '#8b5cf6', // Amethyst Violet
  '#ec4899', // Ruby Pink
  '#f59e0b', // Amber Gold
  '#ef4444', // Crimson Red
  '#0f172a', // Obsidian Black
  '#0d9488', // Nordic Teal
  '#6366f1', // Electric Indigo
  '#78350f', // Warm Leather Brown
];

const COVER_STYLES: Array<{ id: CoverStyle; label: string; desc: string }> = [
  { id: 'classic', label: 'Klasik', desc: 'Minimalist & Şık' },
  { id: 'spiral', label: 'Spiral Cilt', desc: 'Metalik Tel Cilt' },
  { id: 'leather', label: 'Dikişli Deri', desc: 'Vintage & Dikişli' },
];

const PAPER_COLORS_LIST: Array<{ id: PaperColor; name: string; bg: string }> = [
  { id: 'white', name: 'Beyaz', bg: '#ffffff' },
  { id: 'cream', name: 'Krem', bg: '#fcfaf2' },
  { id: 'yellow-pad', name: 'Sarı Notluk', bg: '#fefce8' },
  { id: 'kraft', name: 'Kraft', bg: '#e7d8be' },
  { id: 'dark', name: 'Koyu Gece', bg: '#181b26' },
];

const SUGGESTED_TITLES = [
  'Ders Notları',
  'Günlük & Düşünceler',
  'Proje Taslağı',
  'Matematik & Fizik',
  'Fikir Defteri',
  'Haftalık Planlayıcı',
];

interface LibraryViewProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({ isOpen, onClose }) => {
  const {
    notebooks,
    activeNotebookId,
    setActiveNotebook,
    deleteNotebook,
    createNotebook,
    customTemplates,
    setDocImportModalOpen,
    exportVaultBackup,
    importVaultBackup,
    isNotebookSessionUnlocked,
  } = useNotebookStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'favorites' | 'locked'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [menuOpenNotebookId, setMenuOpenNotebookId] = useState<string | null>(null);

  // Integrated Notebook Creator State (directly within LibraryView)
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCoverColor, setNewCoverColor] = useState('#3b82f6');
  const [newCoverStyle, setNewCoverStyle] = useState<CoverStyle>('classic');
  const [newTemplate, setNewTemplate] = useState<PageTemplate>('lined');
  const [newPaperColor, setNewPaperColor] = useState<PaperColor>('white');
  const [templateTab, setTemplateTab] = useState<'builtin' | 'custom'>('builtin');
  const [selectedCustomTemplateId, setSelectedCustomTemplateId] = useState<string | null>(null);

  const [lockModalState, setLockModalState] = useState<{
    isOpen: boolean;
    notebookId: string | null;
    mode: 'unlock' | 'set-pin' | 'remove-pin';
  }>({
    isOpen: false,
    notebookId: null,
    mode: 'unlock',
  });

  const vaultFileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const totalPages = notebooks.reduce((acc, nb) => acc + (nb.pages?.length || 0), 0);
  const lockedCount = notebooks.filter((nb) => nb.isLocked).length;

  const handleVaultImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await importVaultBackup(file);
      if (res.success) {
        alert(`Kütüphane başarıyla geri yüklendi! (${res.importedCount} defter)`);
      } else {
        alert(`Geri yükleme hatası: ${res.error || 'Dosya okunamadı'}`);
      }
    } catch (err: any) {
      console.error('Vault import error:', err);
      alert(`Hata: ${err.message || 'Geçersiz yedek dosyası'}`);
    } finally {
      if (vaultFileInputRef.current) vaultFileInputRef.current.value = '';
    }
  };

  const handleNotebookClick = (nb: Notebook) => {
    if (nb.isLocked && !isNotebookSessionUnlocked(nb.id)) {
      setLockModalState({
        isOpen: true,
        notebookId: nb.id,
        mode: 'unlock',
      });
      return;
    }
    setActiveNotebook(nb.id);
    onClose();
  };

  const handleCreateNewNotebook = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = newTitle.trim() || 'Yeni Defter';
    triggerHaptic('medium');

    if (templateTab === 'custom' && selectedCustomTemplateId) {
      await createNotebook(
        finalTitle,
        newCoverColor,
        'blank',
        newCoverStyle,
        newPaperColor,
        selectedCustomTemplateId
      );
    } else {
      await createNotebook(
        finalTitle,
        newCoverColor,
        newTemplate,
        newCoverStyle,
        newPaperColor
      );
    }

    setIsCreatingNew(false);
    setNewTitle('');
    onClose();
  };

  const filteredNotebooks = notebooks.filter((nb) => {
    const matchesSearch = nb.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      activeFilter === 'all' ||
      (activeFilter === 'favorites' && nb.isFavorite) ||
      (activeFilter === 'locked' && nb.isLocked);
    return matchesSearch && matchesFilter;
  });

  const renderCover = (nb: Notebook) => {
    const style: CoverStyle = nb.coverStyle || 'classic';
    const isLockedAndHidden = nb.isLocked && !isNotebookSessionUnlocked(nb.id);

    return (
      <div
        className="relative w-full aspect-[1/1.38] rounded-2xl shadow-2xl overflow-hidden cursor-pointer group-hover:-translate-y-1 group-hover:shadow-indigo-500/20 transition-all duration-300 border border-white/10 flex flex-col justify-between p-4.5 select-none"
        style={{
          backgroundColor: nb.coverColor,
          backgroundImage:
            style === 'leather'
              ? 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0.55) 100%)'
              : style === 'spiral'
              ? 'linear-gradient(to right, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 14%), linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0.2) 100%)'
              : 'linear-gradient(145deg, rgba(255,255,255,0.12) 0%, rgba(0,0,0,0.28) 100%)',
        }}
      >
        {/* Spine 3D Shadow on Left */}
        <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/40 via-black/15 to-transparent pointer-events-none" />

        {/* Spiral Binder Simulation */}
        {style === 'spiral' && (
          <div className="absolute left-1.5 inset-y-3 flex flex-col justify-between w-2.5 pointer-events-none z-10">
            {Array.from({ length: 14 }).map((_, i) => (
              <div
                key={i}
                className="w-3.5 h-1.5 rounded-full bg-gradient-to-r from-slate-300 via-white to-slate-400 border border-slate-500 shadow-sm -ml-1"
              />
            ))}
          </div>
        )}

        {/* Leather Stitching Simulation */}
        {style === 'leather' && (
          <div className="absolute inset-2 border-2 border-dashed border-amber-200/30 rounded-xl pointer-events-none" />
        )}

        {/* Ribbon Bookmark simulation */}
        <div className="absolute top-0 right-5 w-4 h-9 bg-gradient-to-b from-rose-600 to-rose-700 shadow-md shadow-black/40 rounded-b-sm pointer-events-none transform -translate-y-1">
          <div className="absolute bottom-0 inset-x-0 h-2 bg-slate-950/20" />
        </div>

        {/* Lock Overlay Badge if locked */}
        {nb.isLocked && (
          <div className="absolute top-3 left-4 z-10">
            <span
              className={`p-1.5 rounded-xl shadow-lg backdrop-blur-md flex items-center justify-center text-xs font-semibold ${
                isLockedAndHidden
                  ? 'bg-rose-500/90 text-white ring-2 ring-rose-400/50 shadow-rose-900/50'
                  : 'bg-emerald-500/90 text-white ring-2 ring-emerald-400/50'
              }`}
              title={isLockedAndHidden ? 'Kilitli Kasa (PIN Gerekli)' : 'PIN Kilidi Açık (Bu Oturum)'}
            >
              {isLockedAndHidden ? <Lock size={13} /> : <Unlock size={13} />}
            </span>
          </div>
        )}

        {/* Notebook Title Badge */}
        <div className="relative z-10 bg-slate-950/85 backdrop-blur-xl rounded-xl p-3 shadow-xl border border-white/10 mt-6 mx-1">
          <h3 className="font-display font-bold text-xs text-white line-clamp-2 leading-snug tracking-tight">
            {isLockedAndHidden ? '🔒 Şifreli Kasa' : nb.title}
          </h3>
          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
            <span className="flex items-center gap-1 font-medium text-indigo-400">
              <Layers size={10} />
              {isLockedAndHidden ? 'Gizli' : `${nb.pages.length} sayfa`}
            </span>
            <span>•</span>
            <span className="truncate">{new Date(nb.updatedAt).toLocaleDateString('tr-TR')}</span>
          </div>
        </div>

        {/* Foil Seal at Bottom Right */}
        <div className="relative z-10 flex items-center justify-between text-[10px] text-white/90 font-medium px-1 pt-2">
          <span className="font-display tracking-widest uppercase text-[9px] text-white/70">Notefree</span>
          <span className="w-5 h-5 rounded-full bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-amber-300 text-[8px] font-bold shadow-inner">
            ★
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-[#090d16]/95 backdrop-blur-3xl z-50 flex flex-col overflow-hidden select-none animate-in fade-in duration-200">
      {/* Top Header */}
      <header className="h-18 border-b border-white/10 px-6 sm:px-8 flex items-center justify-between bg-slate-950/60 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-xl shadow-indigo-600/30 ring-1 ring-white/20">
            <BookOpen size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-lg font-bold text-white tracking-tight">Kütüphane</h1>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[10px] font-bold">
                {notebooks.length} Defter
              </span>
            </div>
            <p className="text-xs text-slate-400">Tüm dijital not defterleriniz ve şifreli kasanız</p>
          </div>
        </div>

        {/* Search Bar (Only shown when not in creation mode) */}
        {!isCreatingNew && (
          <div className="flex-1 max-w-md mx-6 relative hidden md:block">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Defter adında ara..."
              className="w-full bg-slate-900/90 border border-white/10 rounded-xl pl-9 pr-8 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Hidden full vault file input */}
          <input
            ref={vaultFileInputRef}
            type="file"
            accept=".notefree-vault,.json"
            onChange={handleVaultImport}
            className="hidden"
          />

          {!isCreatingNew ? (
            <>
              {/* Full Vault Restore */}
              <button
                onClick={() => vaultFileInputRef.current?.click()}
                className="flex items-center gap-1.5 bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all hover:scale-[1.02] active:scale-95 shadow-sm"
                title="Tüm Kütüphaneyi (.notefree-vault) dosyasından geri yükle"
              >
                <FileUp size={15} className="text-indigo-400" />
                <span className="hidden sm:inline">Yedekten Yükle</span>
              </button>

              {/* Full Vault Export Backup */}
              <button
                onClick={exportVaultBackup}
                className="flex items-center gap-1.5 bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-500/30 text-indigo-300 hover:text-indigo-200 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all hover:scale-[1.02] active:scale-95 shadow-sm"
                title="Tüm Kütüphaneyi tek dosya olarak yedekle (.notefree-vault)"
              >
                <Archive size={15} />
                <span className="hidden lg:inline">Kütüphaneyi Yedekle</span>
              </button>

              {/* PDF / Word Import */}
              <button
                onClick={() => setDocImportModalOpen(true)}
                className="flex items-center gap-1.5 bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all hover:scale-[1.02] active:scale-95 hidden md:flex"
                title="PDF veya Word belgesi içe aktar"
              >
                <UploadCloud size={15} className="text-emerald-400" />
                <span>PDF/Word</span>
              </button>

              {/* New Notebook Button -> Activates Integrated Creator */}
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setIsCreatingNew(true);
                }}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.03] active:scale-95 border border-indigo-400/30"
              >
                <Plus size={16} />
                <span>Yeni Defter</span>
              </button>
            </>
          ) : (
            /* Cancel Creator & Return to Bookshelf */
            <button
              onClick={() => setIsCreatingNew(false)}
              className="flex items-center gap-1.5 bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all"
            >
              <ArrowLeft size={15} />
              <span>Defterlere Dön</span>
            </button>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 border border-transparent hover:border-white/10 transition-colors ml-1"
            title="Kapat ve Çalışma Alanına Dön"
          >
            <X size={20} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-6 sm:px-10 py-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* ======================================================== */}
          {/* INTEGRATED NOTEBOOK CREATOR (DIRECTLY WITHIN LIBRARYVIEW) */}
          {/* ======================================================== */}
          {isCreatingNew ? (
            <div className="bg-slate-950/70 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-6 border-b border-white/10 mb-6">
                <div>
                  <h2 className="font-display text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
                    <Sparkles size={20} className="text-indigo-400" />
                    <span>Yeni Defter Özelleştirme & Başlatma</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Kapak stilinizi, renklerinizi ve başlangıç kağıt şablonunuzu belirleyin.
                  </p>
                </div>

                <button
                  onClick={() => setIsCreatingNew(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition-colors"
                  title="Vazgeç"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateNewNotebook} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* LEFT: Live 3D Cover Preview */}
                <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 bg-slate-900/50 rounded-2xl border border-white/10">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <Book size={13} className="text-indigo-400" />
                    Canlı Kapak Önizlemesi
                  </span>

                  {/* 3D Realistic Live Cover */}
                  <div
                    className="relative w-48 sm:w-56 aspect-[1/1.38] rounded-2xl shadow-2xl overflow-hidden border border-white/15 flex flex-col justify-between p-4.5 select-none transition-all duration-300"
                    style={{
                      backgroundColor: newCoverColor,
                      backgroundImage:
                        newCoverStyle === 'leather'
                          ? 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0.55) 100%)'
                          : newCoverStyle === 'spiral'
                          ? 'linear-gradient(to right, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 14%), linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0.2) 100%)'
                          : 'linear-gradient(145deg, rgba(255,255,255,0.12) 0%, rgba(0,0,0,0.28) 100%)',
                    }}
                  >
                    {/* Spine Shadow */}
                    <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/40 via-black/15 to-transparent pointer-events-none" />

                    {/* Spiral Coils */}
                    {newCoverStyle === 'spiral' && (
                      <div className="absolute left-1.5 inset-y-3 flex flex-col justify-between w-2.5 pointer-events-none z-10">
                        {Array.from({ length: 14 }).map((_, i) => (
                          <div
                            key={i}
                            className="w-3.5 h-1.5 rounded-full bg-gradient-to-r from-slate-300 via-white to-slate-400 border border-slate-500 shadow-sm -ml-1"
                          />
                        ))}
                      </div>
                    )}

                    {/* Leather Stitching */}
                    {newCoverStyle === 'leather' && (
                      <div className="absolute inset-2 border-2 border-dashed border-amber-200/30 rounded-xl pointer-events-none" />
                    )}

                    {/* Ribbon Bookmark */}
                    <div className="absolute top-0 right-5 w-4 h-9 bg-gradient-to-b from-rose-600 to-rose-700 shadow-md shadow-black/40 rounded-b-sm pointer-events-none transform -translate-y-1">
                      <div className="absolute bottom-0 inset-x-0 h-2 bg-slate-950/20" />
                    </div>

                    {/* Title Badge */}
                    <div className="relative z-10 bg-slate-950/85 backdrop-blur-xl rounded-xl p-3 shadow-xl border border-white/10 mt-6 mx-1">
                      <h3 className="font-display font-bold text-xs text-white line-clamp-2 leading-snug tracking-tight">
                        {newTitle.trim() || 'Yeni Not Defteri'}
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                        <span className="text-indigo-400 font-medium">1. Sayfa</span>
                        <span>•</span>
                        <span className="capitalize">{newPaperColor} Kağıt</span>
                      </div>
                    </div>

                    {/* Seal */}
                    <div className="relative z-10 flex items-center justify-between text-[10px] text-white/90 font-medium px-1 pt-2">
                      <span className="font-display tracking-widest uppercase text-[9px] text-white/70">Notefree</span>
                      <span className="w-5 h-5 rounded-full bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-amber-300 text-[8px] font-bold shadow-inner">
                        ★
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-4 text-center">
                    Girdiğiniz başlık ve seçtiğiniz renk anlık olarak kapağa uygulanır.
                  </p>
                </div>

                {/* RIGHT: Properties Form */}
                <div className="lg:col-span-8 space-y-5">
                  {/* Title & Quick Suggestions */}
                  <div>
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                      Defter Başlığı
                    </label>
                    <input
                      type="text"
                      autoFocus
                      required
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Örn: Fizik 101, Biyoloji Notları, Günlük, Proje Taslağı..."
                      className="w-full bg-slate-900 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                    />

                    {/* Quick Title Suggestions */}
                    <div className="flex items-center gap-1.5 mt-2 overflow-x-auto scrollbar-none pb-1">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider shrink-0 mr-1">Öneriler:</span>
                      {SUGGESTED_TITLES.map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setNewTitle(st)}
                          className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-white/5 hover:border-white/15 text-[11px] text-slate-300 hover:text-white shrink-0 transition-colors"
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cover Style Picker */}
                  <div>
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                      Kapak Ciltleme Stili
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {COVER_STYLES.map((cs) => (
                        <button
                          key={cs.id}
                          type="button"
                          onClick={() => setNewCoverStyle(cs.id)}
                          className={`p-3 rounded-2xl border text-left transition-all ${
                            newCoverStyle === cs.id
                              ? 'border-indigo-500 bg-indigo-500/15 ring-2 ring-indigo-500/30'
                              : 'border-white/10 bg-slate-900/60 hover:bg-slate-800/80'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-xs text-white">{cs.label}</span>
                            {newCoverStyle === cs.id && (
                              <Check size={14} className="text-indigo-400 stroke-[3]" />
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 block">{cs.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cover Color Picker */}
                  <div>
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                      Kapak Rengi
                    </label>
                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                      {COVER_COLORS.map((col) => (
                        <button
                          key={col}
                          type="button"
                          onClick={() => setNewCoverColor(col)}
                          className={`h-9 rounded-xl transition-all hover:scale-105 shadow-sm flex items-center justify-center border ${
                            newCoverColor === col
                              ? 'ring-2 ring-white scale-105 border-transparent shadow-lg'
                              : 'border-white/10 hover:border-white/30'
                          }`}
                          style={{ backgroundColor: col }}
                        >
                          {newCoverColor === col && <Check size={14} className="text-white drop-shadow stroke-[3]" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Paper Color & Texture */}
                  <div>
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                      İç Sayfa Kağıt Rengi & Dokusu
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      {PAPER_COLORS_LIST.map((col) => (
                        <button
                          key={col.id}
                          type="button"
                          onClick={() => setNewPaperColor(col.id)}
                          className={`py-2 px-3 rounded-xl border flex items-center gap-2.5 transition-all ${
                            newPaperColor === col.id
                              ? 'border-indigo-500 bg-indigo-500/15 ring-2 ring-indigo-500/30'
                              : 'border-white/10 bg-slate-900/60 hover:bg-slate-800'
                          }`}
                        >
                          <span
                            className="w-5 h-5 rounded-full border border-slate-600 shadow-sm flex items-center justify-center shrink-0"
                            style={{ backgroundColor: col.bg }}
                          >
                            {newPaperColor === col.id && (
                              <Check size={11} className={col.id === 'white' ? 'text-slate-900 stroke-[3]' : 'text-slate-700 stroke-[3]'} />
                            )}
                          </span>
                          <span className="text-xs font-medium text-slate-200">{col.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Starting Template Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                        Başlangıç Sayfa Şablonu
                      </label>
                      <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-white/10 text-xs">
                        <button
                          type="button"
                          onClick={() => setTemplateTab('builtin')}
                          className={`px-3 py-1 rounded-md transition-colors ${
                            templateTab === 'builtin'
                              ? 'bg-indigo-600 text-white font-semibold'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Yerleşik Kılavuzlar
                        </button>
                        <button
                          type="button"
                          onClick={() => setTemplateTab('custom')}
                          className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1 ${
                            templateTab === 'custom'
                              ? 'bg-indigo-600 text-white font-semibold'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Sparkles size={11} className="text-amber-400" />
                          <span>Özel PDF Şablonlarım ({customTemplates.length})</span>
                        </button>
                      </div>
                    </div>

                    {templateTab === 'builtin' ? (
                      <select
                        value={newTemplate}
                        onChange={(e) => setNewTemplate(e.target.value as PageTemplate)}
                        className="w-full bg-slate-900 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                      >
                        <option value="lined">📝 Çizgili Notluk (Klasik)</option>
                        <option value="lined-margin">📖 Çizgili & Sol Kenar Çizgili (Marjinli)</option>
                        <option value="grid-5mm">📐 Kareli Kağıt (5mm Standart)</option>
                        <option value="dots">⁖ Noktalı Izgara (Bullet Journal)</option>
                        <option value="cornell">🎓 Cornell Not Alma Metodu (Walter Pauk)</option>
                        <option value="planner-weekly">📅 Haftalık Ajanda / Zaman Blokları</option>
                        <option value="planner-daily">⏱️ Günlük Saatlik Planlayıcı</option>
                        <option value="planner-habit">🎯 Alışkanlık & Hedef Takibi</option>
                        <option value="isometric-3d">🎲 İzometrik 3D Çizim (CAD)</option>
                        <option value="isometric-dots">⁖ İzometrik 3D Noktalı</option>
                        <option value="polar-coordinate">🎯 Polar Radyal Koordinat</option>
                        <option value="engineering-1mm">📐 Milimetrik Pafta (1mm CAD)</option>
                        <option value="logarithmic-grid">📈 Yarı-Logaritmik (Semi-Log)</option>
                        <option value="music">🎵 Müzik Portesi (Dizek)</option>
                        <option value="blank">📄 Düz Beyaz (Serbest Çizim Tuvali)</option>
                      </select>
                    ) : (
                      <div>
                        {customTemplates.length === 0 ? (
                          <div className="p-4 rounded-xl border border-white/10 bg-slate-900/60 text-center text-xs text-slate-400">
                            <FileText size={22} className="mx-auto mb-1.5 text-slate-500" />
                            <p className="font-semibold text-slate-300">Henüz kayıtlı özel şablonunuz bulunmuyor.</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Defteri açtıktan sonra Şablon menüsünden çok sayfalı PDF planlayıcı yükleyebilirsiniz.
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                            {customTemplates.map((ct) => (
                              <div
                                key={ct.id}
                                onClick={() => setSelectedCustomTemplateId(ct.id)}
                                className={`p-2 rounded-xl border cursor-pointer flex items-center gap-2.5 transition-all ${
                                  selectedCustomTemplateId === ct.id
                                    ? 'border-indigo-500 bg-indigo-500/15 ring-1 ring-indigo-500'
                                    : 'border-white/10 bg-slate-900/50 hover:bg-slate-800'
                                }`}
                              >
                                <div className="w-8 h-10 rounded bg-white overflow-hidden border border-slate-700 shrink-0">
                                  <img src={ct.dataUrl} alt={ct.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="truncate">
                                  <span className="text-xs font-semibold text-slate-200 truncate block">
                                    {ct.name}
                                  </span>
                                  <span className="text-[10px] text-slate-500 block truncate">
                                    {ct.sourceFileName || 'Özel Şablon'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Submit Actions */}
                  <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setIsCreatingNew(false)}
                      className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 border border-indigo-400/30 active:scale-95"
                    >
                      <Plus size={16} />
                      <span>Defteri Oluştur ve Başlat</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          ) : (
            /* ======================================================== */
            /* BOOKSHELF LIST VIEW / GRID VIEW                          */
            /* ======================================================== */
            <>
              {/* Subheader Filters & View Toggle */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-950/40 p-3 rounded-2xl border border-white/5">
                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
                  <button
                    onClick={() => setActiveFilter('all')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                      activeFilter === 'all'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    Tümü ({notebooks.length})
                  </button>
                  <button
                    onClick={() => setActiveFilter('favorites')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                      activeFilter === 'favorites'
                        ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <Star size={13} className={activeFilter === 'favorites' ? 'fill-white' : ''} />
                    <span>Favoriler</span>
                  </button>
                  {lockedCount > 0 && (
                    <button
                      onClick={() => setActiveFilter('locked')}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                        activeFilter === 'locked'
                          ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      }`}
                    >
                      <Lock size={13} />
                      <span>Şifreli Kasa ({lockedCount})</span>
                    </button>
                  )}
                </div>

                {/* View Mode Switcher & Stats */}
                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                  <span className="text-xs text-slate-400 hidden lg:inline">
                    Toplam <strong className="text-slate-200">{totalPages}</strong> sayfa
                  </span>
                  <div className="flex items-center bg-slate-900/90 border border-white/10 rounded-xl p-1 gap-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded-lg transition-colors ${
                        viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                      }`}
                      title="Kapak Izgarası"
                    >
                      <LayoutGrid size={15} />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 rounded-lg transition-colors ${
                        viewMode === 'list' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                      }`}
                      title="Liste Görünümü"
                    >
                      <List size={15} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Notebooks Grid View */}
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 sm:gap-7">
                  {/* First Card: Quick Add Notebook Card (Apple Notes / GoodNotes style) */}
                  <div
                    onClick={() => {
                      triggerHaptic('light');
                      setIsCreatingNew(true);
                    }}
                    className="group relative w-full aspect-[1/1.38] rounded-2xl border-2 border-dashed border-indigo-500/30 hover:border-indigo-400/80 bg-indigo-500/5 hover:bg-indigo-500/10 flex flex-col items-center justify-center p-4 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/15"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center shadow-lg transition-all group-hover:scale-110 mb-2.5">
                      <Plus size={24} />
                    </div>
                    <span className="font-display font-bold text-xs text-indigo-300 group-hover:text-white tracking-tight text-center">
                      Yeni Defter
                    </span>
                    <span className="text-[10px] text-slate-500 text-center mt-0.5">
                      Özelleştir ve Başlat
                    </span>
                  </div>

                  {filteredNotebooks.map((nb) => {
                    const isActive = nb.id === activeNotebookId;
                    const isMenuOpen = menuOpenNotebookId === nb.id;

                    return (
                      <div key={nb.id} className="group relative flex flex-col items-center">
                        {/* Active Notebook Indicator Glow */}
                        {isActive && (
                          <span className="absolute -top-2.5 px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[9px] font-bold shadow-lg shadow-indigo-600/50 z-20 animate-pulse">
                            Açık Defter
                          </span>
                        )}

                        {/* Cover Wrapper */}
                        <div className="w-full" onClick={() => handleNotebookClick(nb)}>
                          {renderCover(nb)}
                        </div>

                        {/* Bottom Metadata & Controls */}
                        <div className="w-full mt-3 flex items-center justify-between px-1 gap-2">
                          <div className="min-w-0 flex-1" onClick={() => handleNotebookClick(nb)}>
                            <h4 className="text-xs font-semibold text-slate-200 truncate cursor-pointer group-hover:text-indigo-400 transition-colors">
                              {nb.title}
                            </h4>
                            <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                              {new Date(nb.updatedAt).toLocaleDateString('tr-TR', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </p>
                          </div>

                          {/* Quick Menu Toggle */}
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setMenuOpenNotebookId(isMenuOpen ? null : nb.id);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                              title="Defter Seçenekleri"
                            >
                              <MoreVertical size={14} />
                            </button>

                            {/* Floating Action Menu */}
                            {isMenuOpen && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 bottom-full mb-2 w-48 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-1.5 z-40 animate-in fade-in zoom-in-95 duration-150"
                              >
                                <button
                                  onClick={() => {
                                    setLockModalState({
                                      isOpen: true,
                                      notebookId: nb.id,
                                      mode: nb.isLocked ? 'remove-pin' : 'set-pin',
                                    });
                                    setMenuOpenNotebookId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
                                >
                                  <KeyRound size={13} className="text-indigo-400" />
                                  <span>{nb.isLocked ? 'PIN Kilidini Kaldır' : 'PIN Şifresi Koy'}</span>
                                </button>

                                <button
                                  onClick={() => {
                                    exportNotebookAsNotefree(nb);
                                    setMenuOpenNotebookId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
                                >
                                  <Download size={13} className="text-emerald-400" />
                                  <span>Defteri İndir (.notefree)</span>
                                </button>

                                <div className="my-1 border-t border-slate-800" />

                                <button
                                  onClick={() => {
                                    if (window.confirm(`"${nb.title}" defterini silmek istediğinize emin misiniz?`)) {
                                      deleteNotebook(nb.id);
                                    }
                                    setMenuOpenNotebookId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                                >
                                  <Trash2 size={13} />
                                  <span>Defteri Sil</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* List View */
                <div className="bg-slate-950/60 rounded-2xl border border-white/10 overflow-hidden shadow-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/90 text-slate-400 border-b border-white/10">
                      <tr>
                        <th className="py-3 px-4 font-semibold">Defter Adı</th>
                        <th className="py-3 px-4 font-semibold hidden sm:table-cell">Sayfa Sayısı</th>
                        <th className="py-3 px-4 font-semibold hidden md:table-cell">Son Güncelleme</th>
                        <th className="py-3 px-4 font-semibold text-center">Durum</th>
                        <th className="py-3 px-4 font-semibold text-right">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredNotebooks.map((nb) => (
                        <tr
                          key={nb.id}
                          onClick={() => handleNotebookClick(nb)}
                          className="hover:bg-slate-900/60 transition-colors cursor-pointer"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <span
                                className="w-3.5 h-4.5 rounded-xs shrink-0 shadow-xs border border-white/20"
                                style={{ backgroundColor: nb.coverColor }}
                              />
                              <span className="font-semibold text-slate-100 hover:text-indigo-400 transition-colors">
                                {nb.title}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-400 hidden sm:table-cell">
                            {nb.pages.length} sayfa
                          </td>
                          <td className="py-3 px-4 text-slate-400 hidden md:table-cell">
                            {new Date(nb.updatedAt).toLocaleDateString('tr-TR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {nb.isLocked ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-bold border border-rose-500/20">
                                <Lock size={10} /> Kilitli
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                                Açık
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`"${nb.title}" defterini silmek istediğinize emin misiniz?`)) {
                                  deleteNotebook(nb.id);
                                }
                              }}
                              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                              title="Sil"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Empty State */}
              {filteredNotebooks.length === 0 && (
                <div className="py-16 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-white/10 flex items-center justify-center text-slate-400 shadow-xl mb-4">
                    <BookOpen size={28} />
                  </div>
                  <h3 className="font-display text-base font-bold text-white mb-1">Defter Bulunamadı</h3>
                  <p className="text-xs text-slate-400 max-w-sm mb-6">
                    {searchQuery
                      ? `"${searchQuery}" aramasıyla eşleşen defter bulunamadı.`
                      : 'Henüz bu kategoride bir defteriniz bulunmuyor.'}
                  </p>
                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      setIsCreatingNew(true);
                    }}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95"
                  >
                    <Plus size={15} />
                    <span>İlk Defterinizi Oluşturun</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 🔒 Notebook PIN Lock & Vault Modal */}
      <NotebookLockModal
        isOpen={lockModalState.isOpen}
        onClose={() => setLockModalState({ ...lockModalState, isOpen: false })}
        notebookId={lockModalState.notebookId}
        mode={lockModalState.mode}
        onSuccess={() => {
          if (lockModalState.mode === 'unlock' && lockModalState.notebookId) {
            setActiveNotebook(lockModalState.notebookId);
            onClose();
          }
        }}
      />
    </div>
  );
};
