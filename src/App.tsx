import React, { useEffect } from 'react';
import { useNotebookStore } from './store/notebookStore';
import { Toolbar } from './components/toolbar/Toolbar';
import { DocumentTabsBar } from './components/tabs/DocumentTabsBar';
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
import { MathSolverModal } from './components/modals/MathSolverModal';
import { SearchModal } from './components/modals/SearchModal';
import { LayersDrawer } from './components/modals/LayersDrawer';
import { OutlineDrawer } from './components/modals/OutlineDrawer';
import { CollaborationModal } from './components/modals/CollaborationModal';
import { FloatingScratchpad } from './components/scratchpad/FloatingScratchpad';
import { ShortcutsModal } from './components/modals/ShortcutsModal';
import { CornellAssistantModal } from './components/modals/CornellAssistantModal';
import { PresentationHUD } from './components/presentation/PresentationHUD';
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
    shortcutsModalOpen,
    setShortcutsModalOpen,
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
      <div className="h-screen w-screen bg-[#090d16] flex flex-col items-center justify-center text-slate-100">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-2xl shadow-indigo-600/40 mb-4 animate-pulse ring-1 ring-white/20">
          <BookOpen size={30} />
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight mb-2 text-white">Notefree</h1>
        <p className="text-xs text-slate-400 flex items-center gap-2">
          <Loader2 size={14} className="animate-spin text-indigo-400" />
          Dijital stüdyo ve çizim motoru hazırlanıyor...
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#090d16] text-slate-100 font-sans select-none">
      {/* 1. Document Tabs Bar (GoodNotes Multi-Document Tabs) */}
      {!presentationMode && <DocumentTabsBar />}

      {/* 2. Top Control Bar (Hidden in Presentation Mode) */}
      {!presentationMode && <Toolbar />}

      {/* FAZ AL: Presentation Studio & Teleprompter HUD */}
      <PresentationHUD />

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {!presentationMode && <Sidebar />}
        <NotebookWorkspace />
      </div>

      {/* 3. Handwriting Zoom Window (GoodNotes Magnifying Box) */}
      <ZoomWindow />

      {/* 4. Faz W: Floating Quick Scratchpad (GoodNotes / Apple Quick Note) */}
      <FloatingScratchpad />

      {/* 5. Global Modals & Drawers */}
      <TemplateSelectorModal />
      <CornellAssistantModal />
      <DocImportModal />
      <NewNotebookModal />
      <StickersDrawer />
      <LayersDrawer />
      <OutlineDrawer />
      <StudySetsModal />
      <MathSolverModal />
      <SearchModal />
      <CollaborationModal />
      <LibraryView isOpen={libraryViewOpen} onClose={() => setLibraryViewOpen(false)} />
      <PageManagerModal
        isOpen={pageManagerModalOpen}
        onClose={() => setPageManagerModalOpen(false)}
      />
      <ShortcutsModal
        isOpen={shortcutsModalOpen}
        onClose={() => setShortcutsModalOpen(false)}
      />
    </div>
  );
};

export default App;
