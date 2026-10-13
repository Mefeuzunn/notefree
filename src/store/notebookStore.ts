import { create } from 'zustand';
import {
  AudioNoteRecording,
  CoverStyle,
  FillItem,
  Flashcard,
  LassoSelection,
  Notebook,
  Page,
  PageSticker,
  PageTemplate,
  PaperColor,
  PenType,
  ShapeType,
  StickerItem,
  Stroke,
  TapeItem,
  TextAnnotation,
  ToolSettings,
  ToolType,
  YouTubeBookmark,
} from '../types/notebook';
import { db, initStorage, saveNotebookToDB, importNotebookFromNotefree } from '../services/storage';
import {
  computeGroupBounds,
  recolorStrokes,
  scaleStrokes,
  translateStrokes,
} from '../engine/lassoHelper';
import { PRESET_STICKERS } from '../engine/stickersLibrary';
import { audioRecorder } from '../services/audioService';

interface YouTubeState {
  isOpen: boolean;
  url: string;
  videoId: string | null;
  currentTime: number;
  isPlaying: boolean;
  splitRatio: number;
  mode: 'split' | 'floating';
  searchQuery?: string;
  videoTitle?: string;
  channelName?: string;
}

interface LaserPoint {
  x: number;
  y: number;
  time: number;
}

interface NotebookStoreState {
  notebooks: Notebook[];
  activeNotebookId: string | null;
  activePageIndex: number;
  isLoading: boolean;

  // View Settings
  viewMode: 'continuous' | 'single';
  zoom: number;
  panOffset: { x: number; y: number };
  sidebarOpen: boolean;
  libraryViewOpen: boolean;
  presentationMode: boolean;

  // Active Tool & Settings
  activeTool: ToolType;
  previousTool: ToolType;
  toolSettings: ToolSettings;

  // Lasso Engine State
  lassoSelection: LassoSelection | null;

  // Ruler & Laser
  rulerVisible: boolean;
  rulerAngle: number;
  laserPoints: LaserPoint[];

  // Zoom Window Box (GoodNotes Magnifying Area)
  zoomWindowOpen: boolean;
  zoomWindowPos: { x: number; y: number };
  zoomBoxWidth: number;
  zoomBoxHeight: number;

  // Stickers / Elements Drawer
  stickersDrawerOpen: boolean;
  customStickers: StickerItem[];

  // Audio Note Replay
  isRecordingAudio: boolean;
  recordingDurationMs: number;
  audioPlaybackTimeMs: number;
  audioPlaying: boolean;

  // History Stacks
  undoStack: Stroke[][];
  redoStack: Stroke[][];

  // YouTube Multitasking
  youtube: YouTubeState;

  // Modals & Panels
  templateModalOpen: boolean;
  docImportModalOpen: boolean;
  newNotebookModalOpen: boolean;
  pageManagerModalOpen: boolean;
  studySetsModalOpen: boolean;

  // Core Actions
  initialize: () => Promise<void>;
  setActiveNotebook: (id: string) => void;
  createNotebook: (
    title: string,
    coverColor: string,
    template?: PageTemplate,
    coverStyle?: CoverStyle
  ) => Promise<string>;
  deleteNotebook: (id: string) => Promise<void>;
  updateNotebookTitle: (id: string, title: string) => Promise<void>;

  // Page Actions
  setActivePageIndex: (index: number) => void;
  addPage: (template?: PageTemplate, paperColor?: PaperColor) => Promise<void>;
  removeCurrentPage: () => Promise<void>;
  updateCurrentPageTemplate: (template: PageTemplate, paperColor: PaperColor) => Promise<void>;
  setViewMode: (mode: 'continuous' | 'single') => void;
  togglePageBookmark: (pageIndex: number) => void;
  setPageTitle: (pageIndex: number, title: string) => void;
  invertCurrentPageInks: () => void;

  // Drawing & Strokes Actions
  setActiveTool: (tool: ToolType) => void;
  setToolColor: (color: string) => void;
  setToolSize: (size: number) => void;
  setEraserMode: (mode: 'stroke' | 'pixel') => void;
  toggleEraseHighlighterOnly: () => void;
  toggleAutoDeselectEraser: () => void;
  setSelectedShape: (shape: ShapeType) => void;
  toggleAutoDetectShape: () => void;
  addStrokeToCurrentPage: (stroke: Stroke) => void;
  eraseStrokesOnCurrentPage: (strokeIds: string[]) => void;
  undo: () => void;
  redo: () => void;
  clearCurrentPageStrokes: () => void;

  // GoodNotes Favorite Slots
  selectFavoriteColor: (index: number) => void;
  selectFavoriteSize: (index: number) => void;
  setFavoriteColor: (index: number, color: string) => void;
  setFavoriteSize: (index: number, size: number) => void;

  // Lasso Engine Actions
  setLassoSelection: (selection: LassoSelection | null) => void;
  moveLassoSelection: (dx: number, dy: number) => void;
  scaleLassoSelection: (factor: number) => void;
  recolorLassoSelection: (color: string) => void;
  deleteLassoSelection: () => void;
  saveLassoSelectionAsSticker: (name: string) => void;

  // Zoom Window Controls
  toggleZoomWindow: () => void;
  setZoomWindowPos: (pos: { x: number; y: number }) => void;
  advanceZoomWindow: () => void;
  rewindZoomWindow: () => void;
  newLineZoomWindow: () => void;

  // Study Sets / Flashcards Actions
  setStudySetsModalOpen: (open: boolean) => void;
  addFlashcard: (frontText: string, backText: string) => void;
  deleteFlashcard: (cardId: string) => void;
  rateFlashcard: (cardId: string, rating: 'again' | 'hard' | 'good' | 'easy') => void;

  // Stickers Actions
  setStickersDrawerOpen: (open: boolean) => void;
  addStickerToCurrentPage: (sticker: StickerItem) => void;
  removeStickerFromCurrentPage: (pageStickerId: string) => void;

  // GoodNotes 6 Tape Actions
  toggleTapeReveal: (pageIndex: number, tapeId: string) => void;
  addTapeToCurrentPage: (tape: TapeItem) => void;
  removeTapeFromCurrentPage: (tapeId: string) => void;

  // Artist & Ink Engine Enhancements (Faz 1)
  setStreamline: (streamline: number) => void;
  setFillTolerance: (tolerance: number) => void;
  addFavoriteColor: (color: string) => void;
  addFillToCurrentPage: (fill: FillItem) => void;
  removeFillFromCurrentPage: (fillId: string) => void;
  seekAudioToStroke: (stroke: Stroke) => void;

  // Text Annotations
  addTextAnnotation: (
    pageIndex: number,
    x: number,
    y: number,
    text?: string
  ) => void;
  updateTextAnnotation: (
    pageIndex: number,
    id: string,
    partial: Partial<TextAnnotation>
  ) => void;
  deleteTextAnnotation: (pageIndex: number, id: string) => void;

  // Audio Note Replay Actions
  startAudioRecording: () => Promise<void>;
  stopAudioRecording: () => Promise<void>;
  setAudioPlaybackTimeMs: (ms: number) => void;
  setAudioPlaying: (playing: boolean) => void;

  // Ruler, Laser & Presentation Actions
  toggleRuler: () => void;
  setRulerAngle: (angle: number) => void;
  addLaserPoint: (x: number, y: number) => void;
  clearLaserPoints: () => void;
  setPresentationMode: (enabled: boolean) => void;
  setLaserStyle: (style: 'trail' | 'spotlight') => void;

  // YouTube Actions
  toggleYouTube: () => void;
  setYouTubeUrl: (url: string) => void;
  setYouTubeVideo: (videoId: string, title?: string, channel?: string) => void;
  setYouTubeSearchQuery: (query: string) => void;
  clearYouTubeSearch: () => void;
  setYouTubeCurrentTime: (seconds: number) => void;
  setYouTubePlaying: (isPlaying: boolean) => void;
  setYouTubeSplitRatio: (ratio: number) => void;
  setYouTubeMode: (mode: 'split' | 'floating') => void;
  addYouTubeBookmark: (title: string) => void;
  jumpToBookmark: (bookmark: YouTubeBookmark) => void;
  deleteYouTubeBookmark: (bookmarkId: string) => void;

  // View Controls
  setZoom: (zoom: number) => void;
  resetView: () => void;
  setSidebarOpen: (open: boolean) => void;
  setLibraryViewOpen: (open: boolean) => void;
  setTemplateModalOpen: (open: boolean) => void;
  setDocImportModalOpen: (open: boolean) => void;
  setNewNotebookModalOpen: (open: boolean) => void;
  setPageManagerModalOpen: (open: boolean) => void;

  // Document & Notebook Import
  importPagesAsNotebook: (pages: Page[], title: string) => Promise<void>;
  importNotebook: (jsonString: string) => Promise<void>;
}

export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export const useNotebookStore = create<NotebookStoreState>((set, get) => ({
  notebooks: [],
  activeNotebookId: null,
  activePageIndex: 0,
  isLoading: true,

  viewMode: 'continuous',
  zoom: 1.0,
  panOffset: { x: 0, y: 0 },
  sidebarOpen: false,
  libraryViewOpen: false,

  activeTool: 'fountain',
  previousTool: 'fountain',
  toolSettings: {
    color: '#0f172a',
    size: 3.5,
    opacity: 1,
    eraserMode: 'stroke',
    eraserSize: 25,
    eraseHighlighterOnly: false,
    autoDeselectEraser: false,
    selectedShape: 'line',
    autoDetectShape: true,
    favoriteColors: ['#0f172a', '#1e40af', '#b91c1c'],
    favoriteSizes: [2.0, 3.5, 6.0],
    activeColorIndex: 0,
    activeSizeIndex: 1,
    streamline: 0.55,
    fillTolerance: 35,
    fontFamily: 'Inter',
    fontSize: 18,
    laserStyle: 'trail',
  },

  presentationMode: false,
  lassoSelection: null,

  rulerVisible: false,
  rulerAngle: 0,
  laserPoints: [],

  zoomWindowOpen: false,
  zoomWindowPos: { x: 80, y: 160 },
  zoomBoxWidth: 280,
  zoomBoxHeight: 140,

  stickersDrawerOpen: false,
  customStickers: [],

  isRecordingAudio: false,
  recordingDurationMs: 0,
  audioPlaybackTimeMs: 0,
  audioPlaying: false,

  undoStack: [],
  redoStack: [],

  youtube: {
    isOpen: true,
    url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
    videoId: 'jfKfPfyJRdk',
    videoTitle: 'Lofi Girl - Beats to relax/study to (7/24 Kesintisiz)',
    channelName: 'Lofi Girl',
    currentTime: 0,
    isPlaying: false,
    splitRatio: 0.36,
    mode: 'split',
    searchQuery: '',
  },

  templateModalOpen: false,
  docImportModalOpen: false,
  newNotebookModalOpen: false,
  pageManagerModalOpen: false,
  studySetsModalOpen: false,

  initialize: async () => {
    try {
      const notebooks = await initStorage();
      const firstNb = notebooks[0];
      set({
        notebooks,
        activeNotebookId: firstNb ? firstNb.id : null,
        activePageIndex: firstNb ? firstNb.activePageIndex : 0,
        youtube: {
          ...get().youtube,
          url: firstNb?.youtubeUrl || get().youtube.url,
          videoId: firstNb?.youtubeUrl
            ? extractYouTubeId(firstNb.youtubeUrl)
            : get().youtube.videoId,
        },
        isLoading: false,
      });
    } catch (err) {
      console.error('Storage init failed:', err);
      set({ isLoading: false });
    }
  },

  setActiveNotebook: (id: string) => {
    const nb = get().notebooks.find((n) => n.id === id);
    if (!nb) return;
    set({
      activeNotebookId: id,
      activePageIndex: Math.min(nb.activePageIndex, Math.max(0, nb.pages.length - 1)),
      undoStack: [],
      redoStack: [],
      lassoSelection: null,
      youtube: {
        ...get().youtube,
        url: nb.youtubeUrl || get().youtube.url,
        videoId: nb.youtubeUrl ? extractYouTubeId(nb.youtubeUrl) : get().youtube.videoId,
      },
    });
  },

  createNotebook: async (
    title: string,
    coverColor: string,
    template: PageTemplate = 'lined',
    coverStyle: CoverStyle = 'classic'
  ) => {
    const newId = `nb_${Date.now()}`;
    const pageId = `pg_${Date.now()}_1`;
    const newPage: Page = {
      id: pageId,
      pageNumber: 1,
      template,
      paperColor: 'white',
      strokes: [],
      width: 800,
      height: 1130,
      title: 'Sayfa 1',
    };

    const newNotebook: Notebook = {
      id: newId,
      title,
      coverColor,
      coverStyle,
      pages: [newPage],
      activePageIndex: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      youtubeBookmarks: [],
      audioRecordings: [],
    };

    const updated = [newNotebook, ...get().notebooks];
    set({
      notebooks: updated,
      activeNotebookId: newId,
      activePageIndex: 0,
      undoStack: [],
      redoStack: [],
      newNotebookModalOpen: false,
    });

    await saveNotebookToDB(newNotebook);
    return newId;
  },

  deleteNotebook: async (id: string) => {
    const filtered = get().notebooks.filter((n) => n.id !== id);
    const nextActive = filtered[0] ? filtered[0].id : null;
    set({
      notebooks: filtered,
      activeNotebookId: nextActive,
      activePageIndex: 0,
    });
    await db.notebooks.delete(id);
    await db.pages.where('notebookId').equals(id).delete();
  },

  updateNotebookTitle: async (id: string, title: string) => {
    const updated = get().notebooks.map((nb) =>
      nb.id === id ? { ...nb, title, updatedAt: Date.now() } : nb
    );
    set({ notebooks: updated });
    const target = updated.find((n) => n.id === id);
    if (target) await saveNotebookToDB(target);
  },

  setActivePageIndex: (index: number) => {
    const { activeNotebookId, notebooks } = get();
    if (!activeNotebookId) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb) return;
    const safeIndex = Math.max(0, Math.min(index, currentNb.pages.length - 1));

    const updatedNotebooks = notebooks.map((n) =>
      n.id === activeNotebookId ? { ...n, activePageIndex: safeIndex } : n
    );

    set({
      notebooks: updatedNotebooks,
      activePageIndex: safeIndex,
      undoStack: [],
      redoStack: [],
      lassoSelection: null,
    });
  },

  addPage: async (template?: PageTemplate, paperColor?: PaperColor) => {
    const { activeNotebookId, notebooks } = get();
    if (!activeNotebookId) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb) return;

    const prevPage = currentNb.pages[currentNb.pages.length - 1];
    const newPageNum = currentNb.pages.length + 1;
    const newPage: Page = {
      id: `pg_${Date.now()}_${newPageNum}`,
      pageNumber: newPageNum,
      template: template || prevPage?.template || 'lined',
      paperColor: paperColor || prevPage?.paperColor || 'white',
      strokes: [],
      width: 800,
      height: 1130,
      title: `Sayfa ${newPageNum}`,
    };

    const updatedPages = [...currentNb.pages, newPage];
    const updatedNotebook: Notebook = {
      ...currentNb,
      pages: updatedPages,
      activePageIndex: updatedPages.length - 1,
      updatedAt: Date.now(),
    };

    const updatedNotebooks = notebooks.map((n) =>
      n.id === activeNotebookId ? updatedNotebook : n
    );

    set({
      notebooks: updatedNotebooks,
      activePageIndex: updatedPages.length - 1,
      undoStack: [],
      redoStack: [],
    });

    await saveNotebookToDB(updatedNotebook);
  },

  removeCurrentPage: async () => {
    const { activeNotebookId, notebooks, activePageIndex } = get();
    if (!activeNotebookId) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb || currentNb.pages.length <= 1) return;

    const updatedPages = currentNb.pages
      .filter((_, idx) => idx !== activePageIndex)
      .map((p, idx) => ({ ...p, pageNumber: idx + 1 }));

    const nextPageIndex = Math.max(0, activePageIndex - 1);
    const updatedNotebook: Notebook = {
      ...currentNb,
      pages: updatedPages,
      activePageIndex: nextPageIndex,
      updatedAt: Date.now(),
    };

    const updatedNotebooks = notebooks.map((n) =>
      n.id === activeNotebookId ? updatedNotebook : n
    );

    set({
      notebooks: updatedNotebooks,
      activePageIndex: nextPageIndex,
      undoStack: [],
      redoStack: [],
    });

    await saveNotebookToDB(updatedNotebook);
  },

  updateCurrentPageTemplate: async (template: PageTemplate, paperColor: PaperColor) => {
    const { activeNotebookId, notebooks, activePageIndex } = get();
    if (!activeNotebookId) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb) return;

    const updatedPages = currentNb.pages.map((p, idx) =>
      idx === activePageIndex ? { ...p, template, paperColor } : p
    );

    const updatedNotebook = { ...currentNb, pages: updatedPages, updatedAt: Date.now() };
    const updatedNotebooks = notebooks.map((n) =>
      n.id === activeNotebookId ? updatedNotebook : n
    );

    set({
      notebooks: updatedNotebooks,
      templateModalOpen: false,
    });

    await saveNotebookToDB(updatedNotebook);
  },

  setViewMode: (mode: 'continuous' | 'single') => {
    set({ viewMode: mode });
  },

  setActiveTool: (tool: ToolType) => {
    if (tool === 'ruler') {
      get().toggleRuler();
      return;
    }
    set((state) => ({
      previousTool: state.activeTool !== 'eraser' ? state.activeTool : state.previousTool,
      activeTool: tool,
      lassoSelection: tool !== 'lasso' ? null : state.lassoSelection,
    }));
  },

  setToolColor: (color: string) => {
    set((state) => ({
      toolSettings: {
        ...state.toolSettings,
        color,
      },
    }));
  },

  setToolSize: (size: number) => {
    set((state) => ({
      toolSettings: {
        ...state.toolSettings,
        size,
      },
    }));
  },

  selectFavoriteColor: (index: number) => {
    const { toolSettings } = get();
    const color = toolSettings.favoriteColors[index] || toolSettings.color;
    set((state) => ({
      toolSettings: {
        ...state.toolSettings,
        color,
        activeColorIndex: index,
      },
    }));
  },

  selectFavoriteSize: (index: number) => {
    const { toolSettings } = get();
    const size = toolSettings.favoriteSizes[index] || toolSettings.size;
    set((state) => ({
      toolSettings: {
        ...state.toolSettings,
        size,
        activeSizeIndex: index,
      },
    }));
  },

  setFavoriteColor: (index: number, color: string) => {
    set((state) => {
      const favs = [...state.toolSettings.favoriteColors];
      favs[index] = color;
      return {
        toolSettings: {
          ...state.toolSettings,
          favoriteColors: favs,
          color,
          activeColorIndex: index,
        },
      };
    });
  },

  setFavoriteSize: (index: number, size: number) => {
    set((state) => {
      const favs = [...state.toolSettings.favoriteSizes];
      favs[index] = size;
      return {
        toolSettings: {
          ...state.toolSettings,
          favoriteSizes: favs,
          size,
          activeSizeIndex: index,
        },
      };
    });
  },

  setEraserMode: (mode: 'stroke' | 'pixel') => {
    set((state) => ({
      toolSettings: { ...state.toolSettings, eraserMode: mode },
    }));
  },

  toggleEraseHighlighterOnly: () => {
    set((state) => ({
      toolSettings: {
        ...state.toolSettings,
        eraseHighlighterOnly: !state.toolSettings.eraseHighlighterOnly,
      },
    }));
  },

  toggleAutoDeselectEraser: () => {
    set((state) => ({
      toolSettings: {
        ...state.toolSettings,
        autoDeselectEraser: !state.toolSettings.autoDeselectEraser,
      },
    }));
  },

  setSelectedShape: (shape: ShapeType) => {
    set((state) => ({
      activeTool: 'shape',
      toolSettings: { ...state.toolSettings, selectedShape: shape },
    }));
  },

  toggleAutoDetectShape: () => {
    set((state) => ({
      toolSettings: {
        ...state.toolSettings,
        autoDetectShape: !state.toolSettings.autoDetectShape,
      },
    }));
  },

  addStrokeToCurrentPage: (stroke: Stroke) => {
    const {
      activeNotebookId,
      notebooks,
      activePageIndex,
      undoStack,
      isRecordingAudio,
    } = get();
    if (!activeNotebookId) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb) return;
    const currentPage = currentNb.pages[activePageIndex];
    if (!currentPage) return;

    // Attach audio timestamp if recording is active!
    const strokeWithAudio: Stroke = {
      ...stroke,
      audioTimestamp: isRecordingAudio ? audioRecorder.getElapsedMs() : undefined,
    };

    const newUndoStack = [...undoStack, [...currentPage.strokes]];
    const updatedStrokes = [...currentPage.strokes, strokeWithAudio];

    const updatedPages = currentNb.pages.map((p, idx) =>
      idx === activePageIndex ? { ...p, strokes: updatedStrokes } : p
    );

    const updatedNotebook = { ...currentNb, pages: updatedPages, updatedAt: Date.now() };
    const updatedNotebooks = notebooks.map((n) =>
      n.id === activeNotebookId ? updatedNotebook : n
    );

    set({
      notebooks: updatedNotebooks,
      undoStack: newUndoStack,
      redoStack: [],
    });

    db.pages.update(currentPage.id, { strokes: updatedStrokes });
  },

  eraseStrokesOnCurrentPage: (strokeIds: string[]) => {
    if (strokeIds.length === 0) return;
    const {
      activeNotebookId,
      notebooks,
      activePageIndex,
      undoStack,
      toolSettings,
      previousTool,
    } = get();
    if (!activeNotebookId) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb) return;
    const currentPage = currentNb.pages[activePageIndex];
    if (!currentPage) return;

    const idSet = new Set(strokeIds);
    const newUndoStack = [...undoStack, [...currentPage.strokes]];

    const filteredStrokes = currentPage.strokes.filter((s) => {
      if (!idSet.has(s.id)) return true;
      if (toolSettings.eraseHighlighterOnly && s.tool !== 'highlighter') {
        return true;
      }
      return false;
    });

    const updatedPages = currentNb.pages.map((p, idx) =>
      idx === activePageIndex ? { ...p, strokes: filteredStrokes } : p
    );

    const updatedNotebook = { ...currentNb, pages: updatedPages, updatedAt: Date.now() };
    const updatedNotebooks = notebooks.map((n) =>
      n.id === activeNotebookId ? updatedNotebook : n
    );

    set({
      notebooks: updatedNotebooks,
      undoStack: newUndoStack,
      redoStack: [],
    });

    db.pages.update(currentPage.id, { strokes: filteredStrokes });

    if (toolSettings.autoDeselectEraser) {
      set({ activeTool: previousTool });
    }
  },

  undo: () => {
    const { activeNotebookId, notebooks, activePageIndex, undoStack, redoStack } = get();
    if (!activeNotebookId || undoStack.length === 0) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb) return;
    const currentPage = currentNb.pages[activePageIndex];
    if (!currentPage) return;

    const previousStrokes = undoStack[undoStack.length - 1];
    const nextUndoStack = undoStack.slice(0, -1);
    const nextRedoStack = [...redoStack, [...currentPage.strokes]];

    const updatedPages = currentNb.pages.map((p, idx) =>
      idx === activePageIndex ? { ...p, strokes: previousStrokes } : p
    );

    const updatedNotebook = { ...currentNb, pages: updatedPages, updatedAt: Date.now() };
    const updatedNotebooks = notebooks.map((n) =>
      n.id === activeNotebookId ? updatedNotebook : n
    );

    set({
      notebooks: updatedNotebooks,
      undoStack: nextUndoStack,
      redoStack: nextRedoStack,
      lassoSelection: null,
    });

    db.pages.update(currentPage.id, { strokes: previousStrokes });
  },

  redo: () => {
    const { activeNotebookId, notebooks, activePageIndex, undoStack, redoStack } = get();
    if (!activeNotebookId || redoStack.length === 0) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb) return;
    const currentPage = currentNb.pages[activePageIndex];
    if (!currentPage) return;

    const nextStrokes = redoStack[redoStack.length - 1];
    const nextRedoStack = redoStack.slice(0, -1);
    const nextUndoStack = [...undoStack, [...currentPage.strokes]];

    const updatedPages = currentNb.pages.map((p, idx) =>
      idx === activePageIndex ? { ...p, strokes: nextStrokes } : p
    );

    const updatedNotebook = { ...currentNb, pages: updatedPages, updatedAt: Date.now() };
    const updatedNotebooks = notebooks.map((n) =>
      n.id === activeNotebookId ? updatedNotebook : n
    );

    set({
      notebooks: updatedNotebooks,
      undoStack: nextUndoStack,
      redoStack: nextRedoStack,
      lassoSelection: null,
    });

    db.pages.update(currentPage.id, { strokes: nextStrokes });
  },

  clearCurrentPageStrokes: () => {
    const { activeNotebookId, notebooks, activePageIndex, undoStack } = get();
    if (!activeNotebookId) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb) return;
    const currentPage = currentNb.pages[activePageIndex];
    if (!currentPage || currentPage.strokes.length === 0) return;

    const newUndoStack = [...undoStack, [...currentPage.strokes]];
    const updatedPages = currentNb.pages.map((p, idx) =>
      idx === activePageIndex ? { ...p, strokes: [] } : p
    );

    const updatedNotebook = { ...currentNb, pages: updatedPages, updatedAt: Date.now() };
    const updatedNotebooks = notebooks.map((n) =>
      n.id === activeNotebookId ? updatedNotebook : n
    );

    set({
      notebooks: updatedNotebooks,
      undoStack: newUndoStack,
      redoStack: [],
      lassoSelection: null,
    });

    db.pages.update(currentPage.id, { strokes: [] });
  },

  // LASSO SELECTION ACTIONS
  setLassoSelection: (selection: LassoSelection | null) => {
    set({ lassoSelection: selection });
  },

  moveLassoSelection: (dx: number, dy: number) => {
    const { lassoSelection, activeNotebookId, notebooks, activePageIndex } = get();
    if (!lassoSelection || !activeNotebookId) return;

    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb) return;
    const currentPage = currentNb.pages[activePageIndex];
    if (!currentPage) return;

    const selectedIdSet = new Set(lassoSelection.strokeIds);
    const updatedStrokes = currentPage.strokes.map((s) => {
      if (selectedIdSet.has(s.id)) {
        return translateStrokes([s], dx, dy)[0];
      }
      return s;
    });

    const newBounds = computeGroupBounds(
      updatedStrokes.filter((s) => selectedIdSet.has(s.id))
    );

    const updatedPages = currentNb.pages.map((p, idx) =>
      idx === activePageIndex ? { ...p, strokes: updatedStrokes } : p
    );

    set({
      notebooks: notebooks.map((n) =>
        n.id === activeNotebookId ? { ...n, pages: updatedPages } : n
      ),
      lassoSelection: {
        ...lassoSelection,
        bounds: newBounds,
        offsetX: lassoSelection.offsetX + dx,
        offsetY: lassoSelection.offsetY + dy,
      },
    });

    db.pages.update(currentPage.id, { strokes: updatedStrokes });
  },

  scaleLassoSelection: (factor: number) => {
    const { lassoSelection, activeNotebookId, notebooks, activePageIndex } = get();
    if (!lassoSelection || !activeNotebookId) return;

    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb) return;
    const currentPage = currentNb.pages[activePageIndex];
    if (!currentPage) return;

    const selectedIdSet = new Set(lassoSelection.strokeIds);
    const cx = (lassoSelection.bounds.minX + lassoSelection.bounds.maxX) / 2;
    const cy = (lassoSelection.bounds.minY + lassoSelection.bounds.maxY) / 2;

    const updatedStrokes = currentPage.strokes.map((s) => {
      if (selectedIdSet.has(s.id)) {
        return scaleStrokes([s], factor, cx, cy)[0];
      }
      return s;
    });

    const newBounds = computeGroupBounds(
      updatedStrokes.filter((s) => selectedIdSet.has(s.id))
    );

    const updatedPages = currentNb.pages.map((p, idx) =>
      idx === activePageIndex ? { ...p, strokes: updatedStrokes } : p
    );

    set({
      notebooks: notebooks.map((n) =>
        n.id === activeNotebookId ? { ...n, pages: updatedPages } : n
      ),
      lassoSelection: {
        ...lassoSelection,
        bounds: newBounds,
      },
    });

    db.pages.update(currentPage.id, { strokes: updatedStrokes });
  },

  recolorLassoSelection: (color: string) => {
    const { lassoSelection, activeNotebookId, notebooks, activePageIndex } = get();
    if (!lassoSelection || !activeNotebookId) return;

    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb) return;
    const currentPage = currentNb.pages[activePageIndex];
    if (!currentPage) return;

    const selectedIdSet = new Set(lassoSelection.strokeIds);
    const updatedStrokes = currentPage.strokes.map((s) => {
      if (selectedIdSet.has(s.id)) {
        return recolorStrokes([s], color)[0];
      }
      return s;
    });

    const updatedPages = currentNb.pages.map((p, idx) =>
      idx === activePageIndex ? { ...p, strokes: updatedStrokes } : p
    );

    set({
      notebooks: notebooks.map((n) =>
        n.id === activeNotebookId ? { ...n, pages: updatedPages } : n
      ),
    });

    db.pages.update(currentPage.id, { strokes: updatedStrokes });
  },

  deleteLassoSelection: () => {
    const { lassoSelection } = get();
    if (!lassoSelection) return;
    get().eraseStrokesOnCurrentPage(lassoSelection.strokeIds);
    set({ lassoSelection: null });
  },

  saveLassoSelectionAsSticker: (name: string) => {
    const { lassoSelection, activeNotebookId, notebooks, activePageIndex } = get();
    if (!lassoSelection || !activeNotebookId) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb) return;
    const currentPage = currentNb.pages[activePageIndex];
    if (!currentPage) return;

    const selectedStrokes = currentPage.strokes.filter((s) =>
      lassoSelection.strokeIds.includes(s.id)
    );
    if (selectedStrokes.length === 0) return;

    const b = lassoSelection.bounds;
    const w = Math.max(80, b.maxX - b.minX + 20);
    const h = Math.max(80, b.maxY - b.minY + 20);

    const newSticker: StickerItem = {
      id: `stk_custom_${Date.now()}`,
      name: name || `Öğe ${get().customStickers.length + 1}`,
      category: 'custom',
      width: w,
      height: h,
      content: JSON.stringify(selectedStrokes),
    };

    set((state) => ({
      customStickers: [...state.customStickers, newSticker],
      stickersDrawerOpen: true,
    }));
  },

  // STICKERS ACTIONS
  setStickersDrawerOpen: (open: boolean) => {
    set({ stickersDrawerOpen: open });
  },

  addStickerToCurrentPage: (sticker: StickerItem) => {
    const { activeNotebookId, notebooks, activePageIndex } = get();
    if (!activeNotebookId) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb) return;
    const currentPage = currentNb.pages[activePageIndex];
    if (!currentPage) return;

    const newPageSticker: PageSticker = {
      id: `pstk_${Date.now()}`,
      stickerId: sticker.id,
      x: 100,
      y: 150,
      width: sticker.width,
      height: sticker.height,
      rotation: 0,
      content: sticker.content,
      category: sticker.category,
    };

    const updatedStickers = [...(currentPage.stickers || []), newPageSticker];
    const updatedPages = currentNb.pages.map((p, idx) =>
      idx === activePageIndex ? { ...p, stickers: updatedStickers } : p
    );

    const updatedNotebook = { ...currentNb, pages: updatedPages, updatedAt: Date.now() };
    set({
      notebooks: notebooks.map((n) =>
        n.id === activeNotebookId ? updatedNotebook : n
      ),
      stickersDrawerOpen: false,
    });

    saveNotebookToDB(updatedNotebook);
  },

  removeStickerFromCurrentPage: (pageStickerId: string) => {
    const { activeNotebookId, notebooks, activePageIndex } = get();
    if (!activeNotebookId) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb) return;
    const currentPage = currentNb.pages[activePageIndex];
    if (!currentPage) return;

    const updatedStickers = (currentPage.stickers || []).filter(
      (s) => s.id !== pageStickerId
    );
    const updatedPages = currentNb.pages.map((p, idx) =>
      idx === activePageIndex ? { ...p, stickers: updatedStickers } : p
    );

    const updatedNotebook = { ...currentNb, pages: updatedPages, updatedAt: Date.now() };
    set({
      notebooks: notebooks.map((n) =>
        n.id === activeNotebookId ? updatedNotebook : n
      ),
    });

    saveNotebookToDB(updatedNotebook);
  },

  // TEXT ANNOTATIONS ACTIONS
  addTextAnnotation: (
    pageIndex: number,
    x: number,
    y: number,
    text: string = ''
  ) => {
    const { activeNotebookId, notebooks, toolSettings } = get();
    if (!activeNotebookId) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb) return;
    const targetPage = currentNb.pages[pageIndex];
    if (!targetPage) return;

    const newAnnotation: TextAnnotation = {
      id: `txt_${Date.now()}`,
      x,
      y,
      text,
      fontSize: toolSettings.fontSize || 18,
      color: toolSettings.color || '#0f172a',
      fontFamily: toolSettings.fontFamily || 'Inter',
      width: 180,
    };

    const updatedTexts = [...(targetPage.texts || []), newAnnotation];
    const updatedPages = currentNb.pages.map((p, idx) =>
      idx === pageIndex ? { ...p, texts: updatedTexts } : p
    );

    const updatedNotebook = { ...currentNb, pages: updatedPages, updatedAt: Date.now() };
    set({
      notebooks: notebooks.map((n) =>
        n.id === activeNotebookId ? updatedNotebook : n
      ),
    });
    saveNotebookToDB(updatedNotebook);
  },

  updateTextAnnotation: (
    pageIndex: number,
    id: string,
    partial: Partial<TextAnnotation>
  ) => {
    const { activeNotebookId, notebooks } = get();
    if (!activeNotebookId) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb) return;
    const targetPage = currentNb.pages[pageIndex];
    if (!targetPage) return;

    const updatedTexts = (targetPage.texts || []).map((t) =>
      t.id === id ? { ...t, ...partial } : t
    );
    const updatedPages = currentNb.pages.map((p, idx) =>
      idx === pageIndex ? { ...p, texts: updatedTexts } : p
    );

    const updatedNotebook = { ...currentNb, pages: updatedPages, updatedAt: Date.now() };
    set({
      notebooks: notebooks.map((n) =>
        n.id === activeNotebookId ? updatedNotebook : n
      ),
    });
    saveNotebookToDB(updatedNotebook);
  },

  deleteTextAnnotation: (pageIndex: number, id: string) => {
    const { activeNotebookId, notebooks } = get();
    if (!activeNotebookId) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb) return;
    const targetPage = currentNb.pages[pageIndex];
    if (!targetPage) return;

    const updatedTexts = (targetPage.texts || []).filter((t) => t.id !== id);
    const updatedPages = currentNb.pages.map((p, idx) =>
      idx === pageIndex ? { ...p, texts: updatedTexts } : p
    );

    const updatedNotebook = { ...currentNb, pages: updatedPages, updatedAt: Date.now() };
    set({
      notebooks: notebooks.map((n) =>
        n.id === activeNotebookId ? updatedNotebook : n
      ),
    });
    saveNotebookToDB(updatedNotebook);
  },

  // AUDIO RECORDING ACTIONS
  startAudioRecording: async () => {
    const ok = await audioRecorder.startRecording((elapsedMs) => {
      set({ recordingDurationMs: elapsedMs });
    });
    if (ok) {
      set({ isRecordingAudio: true, recordingDurationMs: 0 });
    }
  },

  stopAudioRecording: async () => {
    try {
      const res = await audioRecorder.stopRecording();
      const { activeNotebookId, notebooks } = get();
      if (!activeNotebookId) {
        set({ isRecordingAudio: false });
        return;
      }
      const currentNb = notebooks.find((n) => n.id === activeNotebookId);
      if (!currentNb) {
        set({ isRecordingAudio: false });
        return;
      }

      const newRec: AudioNoteRecording = {
        id: `aud_${Date.now()}`,
        notebookId: activeNotebookId,
        durationMs: res.durationMs,
        createdAt: Date.now(),
        audioDataUrl: res.dataUrl,
      };

      const updatedRecordings = [newRec, ...(currentNb.audioRecordings || [])];
      const updatedNotebook = {
        ...currentNb,
        audioRecordings: updatedRecordings,
        updatedAt: Date.now(),
      };

      set({
        isRecordingAudio: false,
        notebooks: notebooks.map((n) =>
          n.id === activeNotebookId ? updatedNotebook : n
        ),
      });

      saveNotebookToDB(updatedNotebook);
    } catch (err) {
      console.error('Stop recording error:', err);
      set({ isRecordingAudio: false });
    }
  },

  setAudioPlaybackTimeMs: (ms: number) => {
    set({ audioPlaybackTimeMs: ms });
  },

  setAudioPlaying: (playing: boolean) => {
    set({ audioPlaying: playing });
  },

  // RULER & LASER
  toggleRuler: () => {
    set((state) => ({ rulerVisible: !state.rulerVisible }));
  },

  setRulerAngle: (angle: number) => {
    set({ rulerAngle: angle });
  },

  addLaserPoint: (x: number, y: number) => {
    const now = Date.now();
    set((state) => ({
      laserPoints: [
        ...state.laserPoints.filter((p) => now - p.time < 1200),
        { x, y, time: now },
      ],
    }));
  },

  clearLaserPoints: () => {
    set({ laserPoints: [] });
  },

  // YOUTUBE ACTIONS
  toggleYouTube: () => {
    set((state) => ({
      youtube: { ...state.youtube, isOpen: !state.youtube.isOpen },
    }));
  },

  setYouTubeUrl: (url: string) => {
    const videoId = extractYouTubeId(url);
    const { activeNotebookId, notebooks } = get();
    if (activeNotebookId) {
      const updated = notebooks.map((nb) =>
        nb.id === activeNotebookId ? { ...nb, youtubeUrl: url } : nb
      );
      set({ notebooks: updated });
      const target = updated.find((n) => n.id === activeNotebookId);
      if (target) saveNotebookToDB(target);
    }
    set((state) => ({
      youtube: { ...state.youtube, url, videoId, searchQuery: '' },
    }));
  },

  setYouTubeVideo: (videoId: string, title?: string, channel?: string) => {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const { activeNotebookId, notebooks } = get();
    if (activeNotebookId) {
      const updated = notebooks.map((nb) =>
        nb.id === activeNotebookId ? { ...nb, youtubeUrl: url } : nb
      );
      set({ notebooks: updated });
      const target = updated.find((n) => n.id === activeNotebookId);
      if (target) saveNotebookToDB(target);
    }
    set((state) => ({
      youtube: {
        ...state.youtube,
        url,
        videoId,
        videoTitle: title || '',
        channelName: channel || '',
        searchQuery: '',
      },
    }));
  },

  setYouTubeSearchQuery: (query: string) => {
    set((state) => ({
      youtube: {
        ...state.youtube,
        searchQuery: query,
        videoId: null,
      },
    }));
  },

  clearYouTubeSearch: () => {
    set((state) => ({
      youtube: {
        ...state.youtube,
        searchQuery: '',
      },
    }));
  },

  setYouTubeCurrentTime: (seconds: number) => {
    set((state) => ({
      youtube: { ...state.youtube, currentTime: seconds },
    }));
  },

  setYouTubePlaying: (isPlaying: boolean) => {
    set((state) => ({
      youtube: { ...state.youtube, isPlaying },
    }));
  },

  setYouTubeSplitRatio: (ratio: number) => {
    const clamped = Math.max(0.2, Math.min(0.65, ratio));
    set((state) => ({
      youtube: { ...state.youtube, splitRatio: clamped },
    }));
  },

  setYouTubeMode: (mode: 'split' | 'floating') => {
    set((state) => ({
      youtube: { ...state.youtube, mode },
    }));
  },

  addYouTubeBookmark: (title: string) => {
    const { activeNotebookId, notebooks, activePageIndex, youtube } = get();
    if (!activeNotebookId) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb) return;
    const currentPage = currentNb.pages[activePageIndex];
    if (!currentPage) return;

    const newBookmark: YouTubeBookmark = {
      id: `bm_${Date.now()}`,
      seconds: Math.floor(youtube.currentTime),
      title: title || `Zaman Damgası [${Math.floor(youtube.currentTime)}s]`,
      pageId: currentPage.id,
      pageNumber: currentPage.pageNumber,
      timestamp: Date.now(),
    };

    const existingBookmarks = currentNb.youtubeBookmarks || [];
    const updatedBookmarks = [...existingBookmarks, newBookmark];

    const updatedNotebook = {
      ...currentNb,
      youtubeBookmarks: updatedBookmarks,
      updatedAt: Date.now(),
    };

    const updatedNotebooks = notebooks.map((n) =>
      n.id === activeNotebookId ? updatedNotebook : n
    );

    set({ notebooks: updatedNotebooks });
    saveNotebookToDB(updatedNotebook);
  },

  jumpToBookmark: (bookmark: YouTubeBookmark) => {
    const { activeNotebookId, notebooks } = get();
    if (!activeNotebookId) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb) return;

    const pageIdx = currentNb.pages.findIndex((p) => p.id === bookmark.pageId);
    if (pageIdx !== -1) {
      set({ activePageIndex: pageIdx });
    }

    set((state) => ({
      youtube: {
        ...state.youtube,
        isOpen: true,
        currentTime: bookmark.seconds,
      },
    }));
  },

  deleteYouTubeBookmark: (bookmarkId: string) => {
    const { activeNotebookId, notebooks } = get();
    if (!activeNotebookId) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb) return;

    const updatedBookmarks = (currentNb.youtubeBookmarks || []).filter(
      (b) => b.id !== bookmarkId
    );

    const updatedNotebook = {
      ...currentNb,
      youtubeBookmarks: updatedBookmarks,
      updatedAt: Date.now(),
    };

    const updatedNotebooks = notebooks.map((n) =>
      n.id === activeNotebookId ? updatedNotebook : n
    );

    set({ notebooks: updatedNotebooks });
    saveNotebookToDB(updatedNotebook);
  },

  setZoom: (zoom: number) => {
    set({ zoom: Math.max(0.4, Math.min(3.5, zoom)) });
  },

  resetView: () => {
    set({ zoom: 1.0, panOffset: { x: 0, y: 0 } });
  },

  setSidebarOpen: (open: boolean) => {
    set({ sidebarOpen: open });
  },

  setLibraryViewOpen: (open: boolean) => {
    set({ libraryViewOpen: open });
  },

  setTemplateModalOpen: (open: boolean) => {
    set({ templateModalOpen: open });
  },

  setDocImportModalOpen: (open: boolean) => {
    set({ docImportModalOpen: open });
  },

  setNewNotebookModalOpen: (open: boolean) => {
    set({ newNotebookModalOpen: open });
  },

  setPageManagerModalOpen: (open: boolean) => {
    set({ pageManagerModalOpen: open });
  },

  importPagesAsNotebook: async (pages: Page[], title: string) => {
    const newId = `nb_doc_${Date.now()}`;
    const newNotebook: Notebook = {
      id: newId,
      title,
      coverColor: '#8b5cf6',
      coverStyle: 'classic',
      pages,
      activePageIndex: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      youtubeBookmarks: [],
      audioRecordings: [],
    };

    const updatedNotebooks = [newNotebook, ...get().notebooks];
    set({
      notebooks: updatedNotebooks,
      activeNotebookId: newId,
      activePageIndex: 0,
      undoStack: [],
      redoStack: [],
      docImportModalOpen: false,
    });

    await saveNotebookToDB(newNotebook);
  },

  // Bookmarks & Page Outline
  togglePageBookmark: (pageIndex: number) => {
    const { notebooks, activeNotebookId } = get();
    const nb = notebooks.find((n) => n.id === activeNotebookId);
    if (!nb || !nb.pages[pageIndex]) return;

    const updatedPages = [...nb.pages];
    updatedPages[pageIndex] = {
      ...updatedPages[pageIndex],
      isBookmarked: !updatedPages[pageIndex].isBookmarked,
    };

    const updatedNotebook = { ...nb, pages: updatedPages, updatedAt: Date.now() };
    set({
      notebooks: notebooks.map((n) => (n.id === activeNotebookId ? updatedNotebook : n)),
    });
    saveNotebookToDB(updatedNotebook);
  },

  setPageTitle: (pageIndex: number, title: string) => {
    const { notebooks, activeNotebookId } = get();
    const nb = notebooks.find((n) => n.id === activeNotebookId);
    if (!nb || !nb.pages[pageIndex]) return;

    const updatedPages = [...nb.pages];
    updatedPages[pageIndex] = {
      ...updatedPages[pageIndex],
      title,
    };

    const updatedNotebook = { ...nb, pages: updatedPages, updatedAt: Date.now() };
    set({
      notebooks: notebooks.map((n) => (n.id === activeNotebookId ? updatedNotebook : n)),
    });
    saveNotebookToDB(updatedNotebook);
  },

  // Smart Ink Contrast Inversion
  invertCurrentPageInks: () => {
    const { notebooks, activeNotebookId, activePageIndex, undoStack } = get();
    const nb = notebooks.find((n) => n.id === activeNotebookId);
    if (!nb || !nb.pages[activePageIndex]) return;

    const currentPage = nb.pages[activePageIndex];
    if (currentPage.strokes.length === 0) return;

    const newUndoStack = [...undoStack, [...currentPage.strokes]];

    const invertedStrokes = currentPage.strokes.map((stroke) => {
      let newColor = stroke.color;
      if (['#0f172a', '#000000', '#1e293b', '#181b26', '#334155'].includes(stroke.color.toLowerCase())) {
        newColor = '#ffffff';
      } else if (['#ffffff', '#f8fafc', '#f1f5f9'].includes(stroke.color.toLowerCase())) {
        newColor = '#0f172a';
      }
      return { ...stroke, color: newColor };
    });

    const updatedPages = [...nb.pages];
    updatedPages[activePageIndex] = {
      ...currentPage,
      strokes: invertedStrokes,
    };

    const updatedNotebook = { ...nb, pages: updatedPages, updatedAt: Date.now() };
    set({
      notebooks: notebooks.map((n) => (n.id === activeNotebookId ? updatedNotebook : n)),
      undoStack: newUndoStack,
      redoStack: [],
    });
    saveNotebookToDB(updatedNotebook);
  },

  // Zoom Window Controls (GoodNotes Magnifying Box)
  toggleZoomWindow: () => {
    set({ zoomWindowOpen: !get().zoomWindowOpen });
  },

  setZoomWindowPos: (pos: { x: number; y: number }) => {
    set({ zoomWindowPos: pos });
  },

  advanceZoomWindow: () => {
    const { zoomWindowPos, zoomBoxWidth } = get();
    const nextX = zoomWindowPos.x + zoomBoxWidth * 0.72;
    if (nextX + zoomBoxWidth > 760) {
      get().newLineZoomWindow();
    } else {
      set({ zoomWindowPos: { ...zoomWindowPos, x: nextX } });
    }
  },

  rewindZoomWindow: () => {
    const { zoomWindowPos, zoomBoxWidth } = get();
    const prevX = Math.max(50, zoomWindowPos.x - zoomBoxWidth * 0.72);
    set({ zoomWindowPos: { ...zoomWindowPos, x: prevX } });
  },

  newLineZoomWindow: () => {
    const { zoomWindowPos, zoomBoxHeight } = get();
    const nextY = Math.min(1000, zoomWindowPos.y + zoomBoxHeight * 0.85);
    set({ zoomWindowPos: { x: 60, y: nextY } });
  },

  // Study Sets / Flashcards Actions
  setStudySetsModalOpen: (open: boolean) => {
    set({ studySetsModalOpen: open });
  },

  addFlashcard: (frontText: string, backText: string) => {
    const { notebooks, activeNotebookId } = get();
    if (!activeNotebookId) return;
    const nb = notebooks.find((n) => n.id === activeNotebookId);
    if (!nb) return;

    const newCard: Flashcard = {
      id: `fc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      notebookId: activeNotebookId,
      frontText,
      backText,
      reviewCount: 0,
      createdAt: Date.now(),
    };

    const updatedFlashcards = [...(nb.flashcards || []), newCard];
    const updatedNotebook = { ...nb, flashcards: updatedFlashcards, updatedAt: Date.now() };

    set({
      notebooks: notebooks.map((n) => (n.id === activeNotebookId ? updatedNotebook : n)),
    });
    saveNotebookToDB(updatedNotebook);
  },

  deleteFlashcard: (cardId: string) => {
    const { notebooks, activeNotebookId } = get();
    const nb = notebooks.find((n) => n.id === activeNotebookId);
    if (!nb) return;

    const updatedFlashcards = (nb.flashcards || []).filter((c) => c.id !== cardId);
    const updatedNotebook = { ...nb, flashcards: updatedFlashcards, updatedAt: Date.now() };

    set({
      notebooks: notebooks.map((n) => (n.id === activeNotebookId ? updatedNotebook : n)),
    });
    saveNotebookToDB(updatedNotebook);
  },

  rateFlashcard: (cardId: string, rating: 'again' | 'hard' | 'good' | 'easy') => {
    const { notebooks, activeNotebookId } = get();
    const nb = notebooks.find((n) => n.id === activeNotebookId);
    if (!nb) return;

    const updatedFlashcards = (nb.flashcards || []).map((c) => {
      if (c.id === cardId) {
        return {
          ...c,
          difficulty: rating,
          reviewCount: c.reviewCount + 1,
          lastReviewed: Date.now(),
        };
      }
      return c;
    });

    const updatedNotebook = { ...nb, flashcards: updatedFlashcards, updatedAt: Date.now() };

    set({
      notebooks: notebooks.map((n) => (n.id === activeNotebookId ? updatedNotebook : n)),
    });
    saveNotebookToDB(updatedNotebook);
  },

  // Presentation & Laser Actions
  setPresentationMode: (enabled: boolean) => {
    set({
      presentationMode: enabled,
      activeTool: enabled ? 'laser' : get().previousTool || 'ballpoint',
    });
  },

  setLaserStyle: (style: 'trail' | 'spotlight') => {
    set({
      toolSettings: {
        ...get().toolSettings,
        laserStyle: style,
      },
    });
  },

  // Import .notefree Notebook
  importNotebook: async (jsonString: string) => {
    const importedNb = await importNotebookFromNotefree(jsonString);
    const updatedNotebooks = [importedNb, ...get().notebooks];
    set({
      notebooks: updatedNotebooks,
      activeNotebookId: importedNb.id,
      activePageIndex: 0,
      undoStack: [],
      redoStack: [],
    });
  },

  // GoodNotes 6 Tape Actions
  toggleTapeReveal: (pageIndex: number, tapeId: string) => {
    const { notebooks, activeNotebookId } = get();
    const nb = notebooks.find((n) => n.id === activeNotebookId);
    if (!nb || !nb.pages[pageIndex]) return;

    const targetPage = nb.pages[pageIndex];
    const updatedTapes = (targetPage.tapes || []).map((t) =>
      t.id === tapeId ? { ...t, isRevealed: !t.isRevealed } : t
    );

    const updatedPages = [...nb.pages];
    updatedPages[pageIndex] = { ...targetPage, tapes: updatedTapes };
    const updatedNotebook = { ...nb, pages: updatedPages, updatedAt: Date.now() };

    set({
      notebooks: notebooks.map((n) => (n.id === activeNotebookId ? updatedNotebook : n)),
    });
    saveNotebookToDB(updatedNotebook);
  },

  addTapeToCurrentPage: (tape: TapeItem) => {
    const { notebooks, activeNotebookId, activePageIndex } = get();
    const nb = notebooks.find((n) => n.id === activeNotebookId);
    if (!nb || !nb.pages[activePageIndex]) return;

    const currentPage = nb.pages[activePageIndex];
    const updatedTapes = [...(currentPage.tapes || []), tape];

    const updatedPages = [...nb.pages];
    updatedPages[activePageIndex] = { ...currentPage, tapes: updatedTapes };
    const updatedNotebook = { ...nb, pages: updatedPages, updatedAt: Date.now() };

    set({
      notebooks: notebooks.map((n) => (n.id === activeNotebookId ? updatedNotebook : n)),
    });
    saveNotebookToDB(updatedNotebook);
  },

  removeTapeFromCurrentPage: (tapeId: string) => {
    const { notebooks, activeNotebookId, activePageIndex } = get();
    const nb = notebooks.find((n) => n.id === activeNotebookId);
    if (!nb || !nb.pages[activePageIndex]) return;

    const currentPage = nb.pages[activePageIndex];
    const updatedTapes = (currentPage.tapes || []).filter((t) => t.id !== tapeId);

    const updatedPages = [...nb.pages];
    updatedPages[activePageIndex] = { ...currentPage, tapes: updatedTapes };
    const updatedNotebook = { ...nb, pages: updatedPages, updatedAt: Date.now() };

    set({
      notebooks: notebooks.map((n) => (n.id === activeNotebookId ? updatedNotebook : n)),
    });
    saveNotebookToDB(updatedNotebook);
  },

  // Faz 1: Artist & Ink Engine Implementations
  setStreamline: (streamline: number) => {
    set((state) => ({
      toolSettings: {
        ...state.toolSettings,
        streamline: Math.max(0.0, Math.min(0.95, streamline)),
      },
    }));
  },

  setFillTolerance: (fillTolerance: number) => {
    set((state) => ({
      toolSettings: {
        ...state.toolSettings,
        fillTolerance: Math.max(1, Math.min(100, fillTolerance)),
      },
    }));
  },

  addFavoriteColor: (color: string) => {
    set((state) => {
      const existing = state.toolSettings.favoriteColors || [];
      const filtered = existing.filter((c) => c.toLowerCase() !== color.toLowerCase());
      const updated = [color, ...filtered].slice(0, 8);
      return {
        toolSettings: {
          ...state.toolSettings,
          color,
          favoriteColors: updated,
          activeColorIndex: 0,
        },
      };
    });
  },

  addFillToCurrentPage: (fill: FillItem) => {
    const { notebooks, activeNotebookId, activePageIndex } = get();
    const nb = notebooks.find((n) => n.id === activeNotebookId);
    if (!nb || !nb.pages[activePageIndex]) return;

    const currentPage = nb.pages[activePageIndex];
    const updatedFills = [...(currentPage.fills || []), fill];

    const updatedPages = [...nb.pages];
    updatedPages[activePageIndex] = { ...currentPage, fills: updatedFills };
    const updatedNotebook = { ...nb, pages: updatedPages, updatedAt: Date.now() };

    set({
      notebooks: notebooks.map((n) => (n.id === activeNotebookId ? updatedNotebook : n)),
    });
    saveNotebookToDB(updatedNotebook);
  },

  removeFillFromCurrentPage: (fillId: string) => {
    const { notebooks, activeNotebookId, activePageIndex } = get();
    const nb = notebooks.find((n) => n.id === activeNotebookId);
    if (!nb || !nb.pages[activePageIndex]) return;

    const currentPage = nb.pages[activePageIndex];
    const updatedFills = (currentPage.fills || []).filter((f) => f.id !== fillId);

    const updatedPages = [...nb.pages];
    updatedPages[activePageIndex] = { ...currentPage, fills: updatedFills };
    const updatedNotebook = { ...nb, pages: updatedPages, updatedAt: Date.now() };

    set({
      notebooks: notebooks.map((n) => (n.id === activeNotebookId ? updatedNotebook : n)),
    });
    saveNotebookToDB(updatedNotebook);
  },

  seekAudioToStroke: (stroke: Stroke) => {
    if (stroke.audioTimestamp !== undefined) {
      set({ audioPlaybackTimeMs: stroke.audioTimestamp });
      const audioEl = document.querySelector('audio');
      if (audioEl) {
        audioEl.currentTime = stroke.audioTimestamp / 1000;
        if (audioEl.paused) {
          audioEl.play().catch(() => {});
          set({ audioPlaying: true });
        }
      }
    }
  },
}));
