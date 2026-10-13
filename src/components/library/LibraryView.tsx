import React, { useState, useRef } from 'react';
import { useNotebookStore } from '../../store/notebookStore';
import { CoverStyle, Notebook } from '../../types/notebook';
import { NotebookLockModal } from '../modals/NotebookLockModal';
import {
  Book,
  Plus,
  Search,
  Trash2,
  UploadCloud,
  X,
  BookOpen,
  FolderDown,
  FileUp,
  Lock,
  Unlock,
  KeyRound,
  Archive,
  Download,
  ShieldCheck,
} from 'lucide-react';

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
    setNewNotebookModalOpen,
    setDocImportModalOpen,
    exportVaultBackup,
    importVaultBackup,
    isNotebookSessionUnlocked,
  } = useNotebookStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'favorites'>('all');
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

  const filteredNotebooks = notebooks.filter((nb) => {
    const matchesSearch = nb.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'all' || (activeFilter === 'favorites' && nb.isFavorite);
    return matchesSearch && matchesFilter;
  });

  const renderCover = (nb: Notebook) => {
    const style: CoverStyle = nb.coverStyle || 'classic';
    const isLockedAndHidden = nb.isLocked && !isNotebookSessionUnlocked(nb.id);

    return (
      <div
        className="relative w-full aspect-[1/1.38] rounded-xl shadow-xl overflow-hidden cursor-pointer group-hover:scale-[1.03] transition-transform duration-200 border border-slate-700/60 flex flex-col justify-between p-4"
        style={{
          backgroundColor: nb.coverColor,
          backgroundImage:
            style === 'leather'
              ? 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.3) 100%)'
              : style === 'spiral'
              ? 'linear-gradient(to right, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 12%)'
              : undefined,
        }}
      >
        {/* Spiral Binder Simulation */}
        {style === 'spiral' && (
          <div className="absolute left-1.5 inset-y-2 flex flex-col justify-between w-2 pointer-events-none">
            {Array.from({ length: 14 }).map((_, i) => (
              <div
                key={i}
                className="w-3 h-1.5 rounded-full bg-slate-200 border border-slate-400 shadow-sm -ml-1"
              />
            ))}
          </div>
        )}

        {/* Leather Stitching Simulation */}
        {style === 'leather' && (
          <div className="absolute inset-1.5 border border-dashed border-amber-200/40 rounded-lg pointer-events-none" />
        )}

        {/* Lock Overlay Badge if locked */}
        {nb.isLocked && (
          <div className="absolute top-2 right-2 z-10">
            <span
              className={`p-1.5 rounded-full shadow-md flex items-center justify-center text-xs ${
                isLockedAndHidden
                  ? 'bg-rose-600/90 text-white ring-2 ring-rose-400'
                  : 'bg-emerald-600/90 text-white'
              }`}
              title={isLockedAndHidden ? 'Kilitli Defter (PIN Gerekli)' : 'PIN Kilidi Açık (Bu Oturum)'}
            >
              {isLockedAndHidden ? <Lock size={12} /> : <Unlock size={12} />}
            </span>
          </div>
        )}

        {/* Notebook Title Badge */}
        <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-md rounded-lg p-2.5 shadow-md border border-black/5 dark:border-white/10 mt-3 mx-1">
          <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 line-clamp-2 leading-tight">
            {isLockedAndHidden ? '🔒 Kilitli Defter' : nb.title}
          </h3>
          <p className="text-[10px] text-slate-500 mt-1">
            {isLockedAndHidden ? 'Şifreli Kasa' : `${nb.pages.length} sayfa`}
          </p>
        </div>

        {/* Footer info on cover */}
        <div className="flex items-center justify-between text-[10px] text-white/80 font-medium px-1">
          <span>NotFree</span>
          <span>{new Date(nb.updatedAt).toLocaleDateString('tr-TR')}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-2xl z-50 flex flex-col overflow-hidden select-none animate-in fade-in duration-200">
      {/* Top Header */}
      <header className="h-16 border-b border-slate-800 px-6 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <BookOpen size={18} />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Kütüphanem</h1>
            <p className="text-[11px] text-slate-400">Tüm Defterler ve Güvenli Kasa</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md mx-6 relative hidden sm:block">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Defterlerde ara..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Hidden full vault file input */}
          <input
            ref={vaultFileInputRef}
            type="file"
            accept=".notefree-vault,.json"
            onChange={handleVaultImport}
            className="hidden"
          />

          {/* Full Vault Restore */}
          <button
            onClick={() => vaultFileInputRef.current?.click()}
            className="flex items-center gap-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-750 text-slate-300 hover:text-white px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
            title="Tüm Kütüphaneyi (.notefree-vault) dosyasından geri yükle"
          >
            <FileUp size={14} className="text-indigo-400" />
            <span className="hidden sm:inline">Yedekten Yükle</span>
          </button>

          {/* Full Vault Export Backup */}
          <button
            onClick={exportVaultBackup}
            className="flex items-center gap-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 px-3 py-2 rounded-xl text-xs font-semibold transition-colors shadow-sm"
            title="Tüm Kütüphaneyi ve ses kayıtlarını tek dosya olarak yedekle (.notefree-vault)"
          >
            <Archive size={14} />
            <span className="hidden md:inline">Tam Kütüphane Yedeği</span>
          </button>

          {/* New Notebook */}
          <button
            onClick={() => setNewNotebookModalOpen(true)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-md transition-colors"
          >
            <Plus size={15} />
            <span>Yeni Defter</span>
          </button>

          {/* PDF / Word Import */}
          <button
            onClick={() => setDocImportModalOpen(true)}
            className="flex items-center gap-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-750 text-slate-300 hover:text-white px-3 py-2 rounded-xl text-xs font-semibold transition-colors hidden lg:flex"
          >
            <UploadCloud size={15} />
            <span>PDF/Word</span>
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-850 ml-2"
            title="Kapat ve Deftere Dön"
          >
            <X size={20} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-10">
        <div className="max-w-6xl mx-auto">
          {/* Section Title */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span>Defterlerim ({filteredNotebooks.length})</span>
            </h2>
          </div>

          {/* Grid of Notebook Covers */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {filteredNotebooks.map((nb) => {
              const isActive = nb.id === activeNotebookId;
              return (
                <div key={nb.id} className="group flex flex-col items-center">
                  <div className="w-full" onClick={() => handleNotebookClick(nb)}>
                    {renderCover(nb)}
                  </div>

                  <div className="w-full mt-2.5 flex items-center justify-between px-1">
                    <h4
                      onClick={() => handleNotebookClick(nb)}
                      className="text-xs font-semibold text-slate-200 truncate flex-1 cursor-pointer group-hover:text-indigo-400 transition-colors"
                    >
                      {nb.title}
                    </h4>

                    {/* Lock / PIN Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setLockModalState({
                          isOpen: true,
                          notebookId: nb.id,
                          mode: nb.isLocked ? 'remove-pin' : 'set-pin',
                        });
                      }}
                      className="p-1 text-slate-500 hover:text-indigo-300 rounded hover:bg-slate-800 transition-colors"
                      title={nb.isLocked ? 'PIN Kilidini Kaldır' : 'PIN Şifresi Koy (Gizli Kasa)'}
                    >
                      {nb.isLocked ? <Lock size={12} className="text-amber-400" /> : <KeyRound size={12} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
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
