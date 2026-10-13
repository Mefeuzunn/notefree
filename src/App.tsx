import React, { useEffect } from 'react';
import { useNotebookStore } from './store/notebookStore';
import { Toolbar } from './components/toolbar/Toolbar';
import { Sidebar } from './components/sidebar/Sidebar';
import { NotebookWorkspace } from './components/NotebookWorkspace';
import { TemplateSelectorModal } from './components/modals/TemplateSelectorModal';
import { DocImportModal } from './components/modals/DocImportModal';
import { NewNotebookModal } from './components/modals/NewNotebookModal';
import { StickersDrawer } from './components/modals/StickersDrawer';
import { LibraryView } from './components/library/LibraryView';
import { PageManagerModal } from './components/modals/PageManagerModal';
import { ZoomWindow } from './components/canvas/ZoomWindow';
import { StudySetsModal } from './components/flashcards/StudySetsModal';
import {
  BookOpen,
  Loader2,
  X,
  Zap,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  Maximize2,
} from 'lucide-react';

export const App: React.FC = () => {
  const {
    initialize,
    isLoading,
    libraryViewOpen,
    setLibraryViewOpen,
    pageManagerModalOpen,
    setPageManagerModalOpen,
    presentationMode,
    setPresentationMode,
    toolSettings,
    setLaserStyle,
    activePageIndex,
    setActivePageIndex,
    notebooks,
    activeNotebookId,
  } = useNotebookStore();

  const activeNotebook = notebooks.find((n) => n.id === activeNotebookId);
  const totalPages = activeNotebook ? activeNotebook.pages.length : 1;

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Handle Escape key to exit presentation mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && presentationMode) {
        setPresentationMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [presentationMode, setPresentationMode]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-xl shadow-indigo-600/30 mb-4 animate-pulse">
          <BookOpen size={28} />
        </div>
        <h1 className="text-xl font-bold tracking-tight mb-2">NotFree</h1>
        <p className="text-xs text-slate-400 flex items-center gap-2">
          <Loader2 size={14} className="animate-spin text-indigo-400" />
          Defterler ve çizim motoru hazırlanıyor...
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-950 text-slate-100 font-sans select-none">
      {/* 1. Top Control Bar (Hidden in Presentation Mode) */}
      {!presentationMode && <Toolbar />}

      {/* Presentation Mode Floating Minimal HUD */}
      {presentationMode && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900/90 backdrop-blur-xl border border-indigo-500/40 rounded-2xl shadow-2xl p-1.5 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          {/* Laser Style Switcher */}
          <div className="flex bg-slate-800 p-0.5 rounded-xl text-xs">
            <button
              onClick={() => setLaserStyle('trail')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                toolSettings.laserStyle !== 'spotlight'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap size={13} />
              <span>İz Lazer</span>
            </button>
            <button
              onClick={() => setLaserStyle('spotlight')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                toolSettings.laserStyle === 'spotlight'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Lightbulb size={13} />
              <span>Spot Işığı</span>
            </button>
          </div>

          {/* Page Stepper */}
          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => setActivePageIndex(Math.max(0, activePageIndex - 1))}
              disabled={activePageIndex === 0}
              className="p-1 text-slate-300 hover:text-white disabled:opacity-30 rounded-lg hover:bg-slate-800"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-mono text-slate-300 px-1 font-semibold">
              {activePageIndex + 1}/{totalPages}
            </span>
            <button
              onClick={() => setActivePageIndex(Math.min(totalPages - 1, activePageIndex + 1))}
              disabled={activePageIndex >= totalPages - 1}
              className="p-1 text-slate-300 hover:text-white disabled:opacity-30 rounded-lg hover:bg-slate-800"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="w-px h-4 bg-slate-700" />

          {/* Exit Presentation Mode */}
          <button
            onClick={() => setPresentationMode(false)}
            className="flex items-center gap-1 px-3 py-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold transition-colors"
          >
            <X size={14} />
            <span>Sunumu Bitir</span>
          </button>
        </div>
      )}

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {!presentationMode && <Sidebar />}
        <NotebookWorkspace />
      </div>

      {/* 3. Handwriting Zoom Window (GoodNotes Magnifying Box) */}
      <ZoomWindow />

      {/* 4. Global Modals & Drawers */}
      <TemplateSelectorModal />
      <DocImportModal />
      <NewNotebookModal />
      <StickersDrawer />
      <StudySetsModal />
      <LibraryView isOpen={libraryViewOpen} onClose={() => setLibraryViewOpen(false)} />
      <PageManagerModal
        isOpen={pageManagerModalOpen}
        onClose={() => setPageManagerModalOpen(false)}
      />
    </div>
  );
};

export default App;
