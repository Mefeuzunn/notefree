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
import { BookOpen, Loader2 } from 'lucide-react';

export const App: React.FC = () => {
  const {
    initialize,
    isLoading,
    libraryViewOpen,
    setLibraryViewOpen,
    pageManagerModalOpen,
    setPageManagerModalOpen,
  } = useNotebookStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

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
      {/* 1. Top Control Bar */}
      <Toolbar />

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        <Sidebar />
        <NotebookWorkspace />
      </div>

      {/* 3. Global Modals & Drawers */}
      <TemplateSelectorModal />
      <DocImportModal />
      <NewNotebookModal />
      <StickersDrawer />
      <LibraryView isOpen={libraryViewOpen} onClose={() => setLibraryViewOpen(false)} />
      <PageManagerModal
        isOpen={pageManagerModalOpen}
        onClose={() => setPageManagerModalOpen(false)}
      />
    </div>
  );
};

export default App;
