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
  PdfOutlineItem,
  LayerVisibilitySettings,
  LayerLockSettings,
  CanvasMode,
  PeerUser,
  CollaborationSession,
  StickyNoteItem,
  MarginExcerptCard,
  MarginCardColor,
  StylusDoubleTapAction,
  RulerUnit,
  CustomTemplateItem,
  StickyNoteColor,
  PageLinkItem,
  PlannerTabItem,
  PageTableItem,
  TableCell,
  PageConnectorItem,
  ConnectorAnchor,
  ConnectorStyle,
  ConnectorArrowType,
  CornellStudyMode,
  CornellBlockConfig,
} from '../types/notebook';
import { renderPageToCanvas } from '../services/exportService';
import { collaborationService } from '../services/collaborationService';
import { db, initStorage, saveNotebookToDB, importNotebookFromNotefree } from '../services/storage';
import {
  computeGroupBounds,
  recolorStrokes,
  scaleStrokes,
  translateStrokes,
  flipStrokes,
  alignStrokes,
  AlignmentType,
  pushStrokesDown,
  straightenHandwritingStrokes,
} from '../engine/lassoHelper';
import { PRESET_STICKERS } from '../engine/stickersLibrary';
import { audioRecorder } from '../services/audioService';
import { speechTranscriptionService } from '../services/speechTranscriptionService';
import { exportEntireVault, importEntireVault } from '../services/vaultBackupService';
import { ambientAudioService, AmbientSoundType } from '../services/ambientAudioService';
import { textToSpeechService } from '../services/textToSpeechService';

export const DEFAULT_PLANNER_TABS: PlannerTabItem[] = [
  { id: 'tab_intro', title: 'Giriş', targetPageIndex: 0, color: '#6366f1' },
  { id: 'tab_sec1', title: 'Bölüm 1', targetPageIndex: 1, color: '#38bdf8' },
  { id: 'tab_sec2', title: 'Bölüm 2', targetPageIndex: 2, color: '#10b981' },
  { id: 'tab_sec3', title: 'Bölüm 3', targetPageIndex: 3, color: '#f59e0b' },
  { id: 'tab_summary', title: 'Özet', targetPageIndex: 4, color: '#ec4899' },
  { id: 'tab_notes', title: 'Notlar', targetPageIndex: 5, color: '#8b5cf6' },
];

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

interface SplitNotebookState {
  isOpen: boolean;
  secondaryNotebookId: string | null;
  secondaryPageIndex: number;
  splitRatio: number;
}

interface LaserPoint {
  x: number;
  y: number;
  time: number;
}

interface NotebookStoreState {
  notebooks: Notebook[];
  activeNotebookId: string | null;
  openNotebookIds: string[];
  activePageIndex: number;
  isLoading: boolean;

  // View Settings
  viewMode: 'continuous' | 'single';
  zoom: number;
  panOffset: { x: number; y: number };
  sidebarOpen: boolean;
  libraryViewOpen: boolean;
  presentationMode: boolean;
  speakerNotesOpen: boolean;
  filmstripOpen: boolean;
  presentationTimer: number;
  isPresentationTimerRunning: boolean;

  // Active Tool & Settings
  activeTool: ToolType;
  previousTool: ToolType;
  toolSettings: ToolSettings;

  // Lasso Engine State
  lassoSelection: LassoSelection | null;

  // Ruler & Laser
  rulerVisible: boolean;
  rulerAngle: number;
  rulerPosition: { x: number; y: number };
  rulerWidth: number;
  rulerUnit: RulerUnit;
  rulerEdgeSnap: boolean;
  laserPoints: LaserPoint[];

  // Zoom Window Box (GoodNotes Magnifying Area)
  zoomWindowOpen: boolean;
  zoomWindowPos: { x: number; y: number };
  zoomBoxWidth: number;
  zoomBoxHeight: number;
  zoomScale: number;

  // Stickers / Elements Drawer
  stickersDrawerOpen: boolean;
  customStickers: StickerItem[];

  // Audio Note Replay
  isRecordingAudio: boolean;
  recordingDurationMs: number;
  audioPlaybackTimeMs: number;
  audioPlaying: boolean;
  audioSyncReplay: boolean;
  toggleAudioSyncReplay: () => void;

  // History Stacks
  undoStack: Stroke[][];
  redoStack: Stroke[][];

  // YouTube Multitasking
  youtube: YouTubeState;

  // Modals & Panels
  templateModalOpen: boolean;
  customTemplates: CustomTemplateItem[];
  cornellStudyMode: CornellStudyMode;
  cornellAssistantModalOpen: boolean;
  docImportModalOpen: boolean;
  newNotebookModalOpen: boolean;
  pageManagerModalOpen: boolean;
  studySetsModalOpen: boolean;
  searchModalOpen: boolean;
  shortcutsModalOpen: boolean;

  // Faz 2: AI & Dual Multitasking
  mathModalOpen: boolean;
  mathInputEquation: string;
  splitNotebook: SplitNotebookState;

  // Faz 3: Multi-Layer & Precision Engine
  layersDrawerOpen: boolean;
  outlineDrawerOpen: boolean;
  layers: LayerVisibilitySettings;
  layerLocks: LayerLockSettings;

  // Faz 4: Infinite Canvas & Live Collaboration
  canvasMode: CanvasMode;
  infinitePan: { x: number; y: number };
  collaborationModalOpen: boolean;
  collaboration: CollaborationSession;
  remoteLiveStrokes: { [senderId: string]: { points: any[]; tool: string; color: string; size: number } };
  setCanvasMode: (mode: CanvasMode) => void;
  setInfinitePan: (pan: { x: number; y: number }) => void;
  resetInfinitePan: () => void;
  setCollaborationModalOpen: (open: boolean) => void;
  startCollaborationRoom: (roomId?: string, userName?: string) => string;
  joinCollaborationRoom: (roomId: string, userName?: string) => void;
  leaveCollaborationRoom: () => void;
  updateMyCursor: (x: number, y: number) => void;
  setRemotePeers: (peers: PeerUser[]) => void;
  setRemoteLiveStroke: (senderId: string, strokeData: { points: any[]; tool: string; color: string; size: number } | null) => void;

  // Core Actions
  initialize: () => Promise<void>;
  setActiveNotebook: (id: string) => void;
  openNotebookTab: (notebookId: string) => void;
  closeNotebookTab: (notebookId: string) => void;
  reorderNotebookTabs: (fromIndex: number, toIndex: number) => void;
  createNotebook: (
    title: string,
    coverColor: string,
    template?: PageTemplate,
    coverStyle?: CoverStyle,
    paperColor?: PaperColor,
    customTemplateId?: string
  ) => Promise<string>;
  deleteNotebook: (id: string) => Promise<void>;
  updateNotebookTitle: (id: string, title: string) => Promise<void>;

  // Page Actions
  setActivePageIndex: (index: number) => void;
  addPage: (template?: PageTemplate, paperColor?: PaperColor) => Promise<void>;
  removeCurrentPage: () => Promise<void>;
  setViewMode: (mode: 'continuous' | 'single') => void;
  updateCurrentPageTemplate: (
    template: PageTemplate,
    paperColor: PaperColor,
    customPitch?: number,
    customLineColor?: string,
    lineOpacity?: number,
    backgroundImageUrl?: string,
    applyToAllPages?: boolean
  ) => Promise<void>;
  addCustomTemplate: (template: CustomTemplateItem) => void;
  addCustomTemplates: (templates: CustomTemplateItem[]) => void;
  renameCustomTemplate: (id: string, newName: string) => void;
  deleteCustomTemplate: (id: string) => void;
  saveCurrentPageAsCustomTemplate: (name: string, category?: CustomTemplateItem['category']) => Promise<CustomTemplateItem | null>;
  setCornellStudyMode: (mode: CornellStudyMode) => void;
  toggleCornellStudyMode: () => void;
  setCornellAssistantModalOpen: (open: boolean) => void;
  stampCornellBlocksToPage: (pageIndex?: number, config?: CornellBlockConfig) => Promise<void>;
  updateCurrentPagePitch: (
    customPitch?: number,
    customLineColor?: string,
    lineOpacity?: number
  ) => Promise<void>;
  togglePageBookmark: (pageIndex: number) => void;
  setPageTitle: (pageIndex: number, title: string) => void;
  invertCurrentPageInks: () => void;
  reorderPages: (fromIndex: number, toIndex: number) => Promise<void>;
  movePageLeft: (index: number) => Promise<void>;
  movePageRight: (index: number) => Promise<void>;
  insertPageAt: (index: number, template?: PageTemplate, paperColor?: PaperColor) => Promise<void>;
  removePagesBatch: (indices: number[]) => Promise<void>;
  duplicatePagesBatch: (indices: number[]) => Promise<void>;
  toggleBookmarksBatch: (indices: number[], forceState?: boolean) => Promise<void>;

  // Drawing & Strokes Actions
  setActiveTool: (tool: ToolType) => void;
  setToolColor: (color: string) => void;
  setToolOpacity: (opacity: number) => void;
  setToolSize: (size: number) => void;
  setEraserMode: (mode: 'stroke' | 'pixel') => void;
  toggleEraseHighlighterOnly: () => void;
  toggleAutoDeselectEraser: () => void;
  setSelectedShape: (shape: ShapeType) => void;
  toggleAutoDetectShape: () => void;
  setShapeFillColor: (color: string | undefined) => void;
  setShapeFillOpacity: (opacity: number) => void;
  togglePalmRejection: () => void;
  toggleTiltShading: () => void;
  setStylusDoubleTapAction: (action: StylusDoubleTapAction) => void;
  toggleScribbleToErase: () => void;
  toggleCircleToLasso: () => void;
  addStrokeToCurrentPage: (stroke: Stroke) => void;
  addStrokesToCurrentPage: (strokes: Stroke[]) => void;
  eraseStrokesOnCurrentPage: (strokeIds: string[]) => void;
  updateStrokeOnCurrentPage: (strokeId: string, partial: Partial<Stroke>) => void;
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
  flipLassoSelection: (direction: 'horizontal' | 'vertical') => void;
  alignLassoSelection: (alignment: AlignmentType) => void;
  duplicateLassoSelection: () => void;
  straightenLassoSelection: () => { angleDegrees: number; snappedDeltaY: number } | null;
  pushContentDownOnCurrentPage: (startY: number, amount: number) => void;

  // Zoom Window Controls
  toggleZoomWindow: () => void;
  setZoomWindowPos: (pos: { x: number; y: number }) => void;
  setZoomBoxSize: (width: number, height: number) => void;
  setZoomScale: (scale: number) => void;
  advanceZoomWindow: () => void;
  rewindZoomWindow: () => void;
  newLineZoomWindow: () => void;

  // Study Sets / Flashcards Actions
  setStudySetsModalOpen: (open: boolean) => void;
  setSearchModalOpen: (open: boolean) => void;
  setShortcutsModalOpen: (open: boolean) => void;
  addFlashcard: (frontText: string, backText: string) => void;
  deleteFlashcard: (cardId: string) => void;
  rateFlashcard: (cardId: string, rating: 'again' | 'hard' | 'good' | 'easy') => void;

  // Stickers & Rubber Stamps Actions (Faz AC)
  setStickersDrawerOpen: (open: boolean) => void;
  addStickerToCurrentPage: (
    sticker: StickerItem,
    customPos?: { x?: number; y?: number; width?: number; height?: number; rotation?: number }
  ) => void;
  removeStickerFromCurrentPage: (pageStickerId: string) => void;
  updateStickerOnCurrentPage: (pageStickerId: string, partial: Partial<PageSticker>) => void;
  duplicateStickerOnCurrentPage: (pageStickerId: string) => void;
  addCustomSticker: (sticker: StickerItem) => void;
  deleteCustomSticker: (stickerId: string) => void;
  stickerCreatorModalOpen: boolean;
  setStickerCreatorModalOpen: (open: boolean) => void;
  stampCreatorModalOpen: boolean;
  setStampCreatorModalOpen: (open: boolean) => void;

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

  // Faz 2: Math AI Solver Actions
  openMathModal: (initialEquation?: string) => void;
  closeMathModal: () => void;
  addMathSolutionToCanvas: (equation: string, result: string) => void;

  // Faz 2: Dual Notebook Split Screen Actions
  openDualNotebook: (secondaryNotebookId: string) => void;
  closeDualNotebook: () => void;
  setDualNotebookRatio: (ratio: number) => void;
  setSecondaryPageIndex: (index: number) => void;

  // Faz 2: Tape to Flashcard Auto Generator
  generateFlashcardsFromTapes: (notebookId: string) => number;

  // Faz 3 & FAZ AK: Multi-Layer, Precision & Outline Actions
  setLayersDrawerOpen: (open: boolean) => void;
  setOutlineDrawerOpen: (open: boolean) => void;
  toggleLayerVisibility: (layer: keyof LayerVisibilitySettings) => void;
  toggleLayerLock: (layer: keyof LayerLockSettings) => void;
  toggleAngleSnap: () => void;
  toggleGridSnap: () => void;
  addOutlineItem: (title: string, pageIndex: number, level?: number, color?: string) => void;
  updateOutlineItem: (id: string, updates: Partial<PdfOutlineItem>) => void;
  deleteOutlineItem: (outlineId: string) => void;
  reorderOutlineItems: (startIndex: number, endIndex: number) => void;
  generateAutoOutlineFromNotebook: () => number;
  clearOutline: () => void;

  // Faz B: Protractor & Sticky Notes
  protractorVisible: boolean;
  protractorAngle: number;
  toggleProtractor: () => void;
  setProtractorAngle: (angle: number) => void;
  addStickyNoteToCurrentPage: (note: StickyNoteItem) => void;
  updateStickyNoteOnCurrentPage: (noteId: string, partial: Partial<StickyNoteItem>) => void;
  removeStickyNoteFromCurrentPage: (noteId: string) => void;

  // Faz AF: Interactive Tables & Data Matrices
  addTableToCurrentPage: (rows?: number, cols?: number, x?: number, y?: number) => string;
  updateTableOnCurrentPage: (tableId: string, updates: Partial<PageTableItem>) => void;
  updateTableCell: (tableId: string, row: number, col: number, updates: Partial<TableCell>) => void;
  addRowToTable: (tableId: string, atIndex?: number) => void;
  deleteRowFromTable: (tableId: string, rowIndex: number) => void;
  addColToTable: (tableId: string, atIndex?: number) => void;
  deleteColFromTable: (tableId: string, colIndex: number) => void;
  deleteTableFromCurrentPage: (tableId: string) => void;

  // FAZ AH: Smart Magnetic Connectors & Flowchart Mind Map Lines
  addConnectorToCurrentPage: (connector: PageConnectorItem) => void;
  updateConnectorOnCurrentPage: (connectorId: string, updates: Partial<PageConnectorItem>) => void;
  removeConnectorFromCurrentPage: (connectorId: string) => void;
  activeConnectorDraft: { from: ConnectorAnchor; to: { x: number; y: number } } | null;
  setActiveConnectorDraft: (draft: { from: ConnectorAnchor; to: { x: number; y: number } } | null) => void;

  // Faz C: Live Speech-to-Text Transcription & Dictation
  liveTranscript: string;
  isTranscribing: boolean;
  startSpeechTranscription: (lang?: string) => boolean;
  stopSpeechTranscription: () => void;
  clearSpeechTranscript: () => void;
  addTranscriptToCurrentPageAsNote: () => void;

  // Faz C: Notebook PIN Vault Security
  unlockedNotebookIds: string[];
  setNotebookPin: (notebookId: string, pin: string | null) => Promise<void>;
  unlockNotebookSession: (notebookId: string) => void;
  isNotebookSessionUnlocked: (notebookId: string) => boolean;

  // FAZ AN: Page-level PIN lock & auto-lock
  unlockedPageIds: string[];
  autoLockMinutes: number;
  setPagePin: (notebookId: string, pageId: string, pin: string | null) => Promise<void>;
  unlockPageSession: (pageId: string) => void;
  isPageSessionUnlocked: (pageId: string) => boolean;
  lockAllNotebooks: () => void;
  setAutoLockMinutes: (minutes: number) => void;

  // Faz C: Full Library Backup & Restore
  exportVaultBackup: () => void;
  importVaultBackup: (file: File) => Promise<{ success: boolean; importedCount: number; error?: string }>;

  // Faz D: Compass (Pergel), Symmetry (Ayna Çizimi), Pomodoro & Ambiyans
  compassVisible: boolean;
  compassRadius: number;
  compassAngle: number;
  toggleCompass: () => void;
  setCompassRadius: (radius: number) => void;
  setCompassAngle: (angle: number) => void;

  symmetryEnabled: boolean;
  symmetryAxis: 'vertical' | 'horizontal';
  symmetryPosition: number;
  toggleSymmetry: () => void;
  setSymmetryAxis: (axis: 'vertical' | 'horizontal') => void;
  setSymmetryPosition: (pos: number) => void;

  pomodoroOpen: boolean;
  pomodoroRunning: boolean;
  pomodoroMode: 'work' | 'shortBreak' | 'longBreak';
  pomodoroTimeLeft: number;
  pomodoroTotalDuration: number;
  setPomodoroOpen: (open: boolean) => void;
  setPomodoroRunning: (running: boolean) => void;
  setPomodoroMode: (mode: 'work' | 'shortBreak' | 'longBreak') => void;
  setPomodoroTimeLeft: (time: number) => void;
  tickPomodoro: () => void;
  resetPomodoro: () => void;

  activeAmbience: AmbientSoundType | null;
  ambienceVolume: number;
  toggleAmbience: (type: AmbientSoundType) => void;
  setAmbienceVolume: (volume: number) => void;

  // Faz E & Faz AD: Two-Page Book Spread & Export Studio
  twoPageSpread: boolean;
  toggleTwoPageSpread: () => void;
  exportModalOpen: boolean;
  exportInitialPageRange?: string;
  setExportModalOpen: (open: boolean, initialRange?: string) => void;

  // Faz F: LiquidText Study Margin & Excerpt Workspace
  marginWorkspaceOpen: boolean;
  toggleMarginWorkspace: () => void;
  setMarginWorkspaceOpen: (open: boolean) => void;
  addMarginCard: (card: Omit<MarginExcerptCard, 'id' | 'createdAt'>) => void;
  updateMarginCard: (id: string, partial: Partial<MarginExcerptCard>) => void;
  deleteMarginCard: (id: string) => void;
  stampMarginCardToCanvas: (cardId: string) => void;
  exportMarginCardsToNewPage: () => Promise<void>;

  // Faz H: Active Recall Tape Quiz Mode
  tapeQuizMode: boolean;
  tapeQuizActiveIndex: number;
  setTapeQuizMode: (active: boolean) => void;
  revealAllTapes: (pageIndex: number) => void;
  hideAllTapes: (pageIndex: number) => void;
  nextTapeQuizItem: () => void;
  prevTapeQuizItem: () => void;

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
  setRulerPosition: (pos: { x: number; y: number }) => void;
  setRulerWidth: (width: number) => void;
  setRulerUnit: (unit: RulerUnit) => void;
  toggleRulerEdgeSnap: () => void;
  addLaserPoint: (x: number, y: number) => void;
  clearLaserPoints: () => void;
  setPresentationMode: (enabled: boolean) => void;
  setLaserStyle: (style: 'trail' | 'spotlight') => void;
  setLaserColor: (color: string) => void;
  setSpotlightRadius: (radius: number) => void;
  setSpeakerNotesOpen: (open: boolean) => void;
  updateCurrentPageSpeakerNotes: (notes: string) => void;
  setFilmstripOpen: (open: boolean) => void;
  startPresentationTimer: () => void;
  pausePresentationTimer: () => void;
  resetPresentationTimer: () => void;
  tickPresentationTimer: () => void;

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
  minimapVisible: boolean;
  toggleMinimap: () => void;
  setMinimapVisible: (visible: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  setLibraryViewOpen: (open: boolean) => void;
  setTemplateModalOpen: (open: boolean) => void;
  setDocImportModalOpen: (open: boolean) => void;
  setNewNotebookModalOpen: (open: boolean) => void;
  setPageManagerModalOpen: (open: boolean) => void;

  // Faz AA: Interactive Hyperlinks & Digital Planner Tabs
  plannerTabsVisible: boolean;
  togglePlannerTabs: () => void;
  setPlannerTabsVisible: (visible: boolean) => void;
  addPlannerTab: (tab: PlannerTabItem) => void;
  updatePlannerTab: (tabId: string, partial: Partial<PlannerTabItem>) => void;
  removePlannerTab: (tabId: string) => void;
  reorderPlannerTabs: (tabs: PlannerTabItem[]) => void;
  navigateToPage: (targetIndex: number) => void;
  addPageLinkToCurrentPage: (link: PageLinkItem) => void;
  removePageLinkFromCurrentPage: (linkId: string) => void;
  updatePageLinkOnCurrentPage: (linkId: string, partial: Partial<PageLinkItem>) => void;
  linkModalState: {
    isOpen: boolean;
    elementId?: string;
    elementType?: 'text' | 'sticky' | 'shape' | 'hotspot';
    initialTargetPage?: number;
    initialUrl?: string;
    initialLabel?: string;
    initialColor?: string;
    onSave?: (link: { targetPageIndex?: number; url?: string; label?: string; color?: string }) => void;
    onRemove?: () => void;
  };
  openLinkModal: (params: {
    elementId?: string;
    elementType?: 'text' | 'sticky' | 'shape' | 'hotspot';
    initialTargetPage?: number;
    initialUrl?: string;
    initialLabel?: string;
    initialColor?: string;
    onSave?: (link: { targetPageIndex?: number; url?: string; label?: string; color?: string }) => void;
    onRemove?: () => void;
  }) => void;
  closeLinkModal: () => void;

  // Faz AB: STEM 2D Function Plotter & Coordinate Stamping
  functionPlotterModalOpen: boolean;
  functionPlotterInitialExpr: string;
  openFunctionPlotterModal: (initialExpr?: string) => void;
  closeFunctionPlotterModal: () => void;
  stampPlotGraphToCurrentPage: (params: { strokes: Stroke[]; texts: TextAnnotation[] }) => void;

  // Faz W: Floating Quick Scratchpad
  scratchpadOpen: boolean;
  scratchpadMinimized: boolean;
  scratchpadMode: 'draw' | 'text';
  scratchpadText: string;
  scratchpadColor: StickyNoteColor;
  toggleScratchpad: () => void;
  setScratchpadOpen: (open: boolean) => void;
  setScratchpadMinimized: (minimized: boolean) => void;
  setScratchpadMode: (mode: 'draw' | 'text') => void;
  setScratchpadText: (text: string) => void;
  setScratchpadColor: (color: StickyNoteColor) => void;

  // Document & Notebook Import
  importPagesAsNotebook: (pages: Page[], title: string, pdfOutline?: PdfOutlineItem[]) => Promise<void>;
  importNotebook: (jsonString: string) => Promise<void>;
}

export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

let collabUnsub: (() => void) | null = null;

function setupCollaborationListener(set: any, get: any) {
  if (collabUnsub) collabUnsub();
  collabUnsub = collaborationService.subscribe((msg) => {
    const { collaboration, notebooks, activeNotebookId, activePageIndex } = get();
    if (!collaboration.isConnected || msg.roomId !== collaboration.roomId) return;

    if (msg.type === 'JOIN') {
      const now = Date.now();
      const existing = collaboration.peers.find((p: PeerUser) => p.id === msg.senderId);
      let updatedPeers: PeerUser[];
      if (existing) {
        updatedPeers = collaboration.peers.map((p: PeerUser) =>
          p.id === msg.senderId ? { ...p, name: msg.senderName, color: msg.senderColor, lastSeen: now } : p
        );
      } else {
        updatedPeers = [
          ...collaboration.peers,
          { id: msg.senderId, name: msg.senderName, color: msg.senderColor, lastSeen: now },
        ];
      }
      set({
        collaboration: {
          ...collaboration,
          peers: updatedPeers,
        },
      });

      // If host, send full notebook state to newly joined participant
      if (collaboration.isHost && activeNotebookId) {
        const curNb = notebooks.find((n: Notebook) => n.id === activeNotebookId);
        if (curNb) {
          collaborationService.broadcastStateSync({ notebook: curNb });
        }
      }
    } else if (msg.type === 'LEAVE') {
      set({
        collaboration: {
          ...collaboration,
          peers: collaboration.peers.filter((p: PeerUser) => p.id !== msg.senderId),
        },
      });
    } else if (msg.type === 'CURSOR') {
      const { x, y } = msg.payload || {};
      const now = Date.now();
      set({
        collaboration: {
          ...collaboration,
          peers: collaboration.peers.map((p: PeerUser) =>
            p.id === msg.senderId ? { ...p, cursor: { x, y }, lastSeen: now } : p
          ),
        },
      });
    } else if (msg.type === 'STROKE_POINTS') {
      const { points, tool, color, size } = msg.payload || {};
      set((state: any) => ({
        remoteLiveStrokes: {
          ...state.remoteLiveStrokes,
          [msg.senderId]: { points, tool, color, size },
        },
      }));
    } else if (msg.type === 'STROKE_END') {
      const { stroke, pageIndex } = msg.payload || {};
      if (stroke && activeNotebookId) {
        set((state: any) => {
          const nextLive = { ...state.remoteLiveStrokes };
          delete nextLive[msg.senderId];
          const curNb = state.notebooks.find((n: any) => n.id === activeNotebookId);
          if (!curNb) return { remoteLiveStrokes: nextLive };
          const targetIndex = pageIndex !== undefined ? pageIndex : state.activePageIndex;
          const targetPage = curNb.pages[targetIndex];
          if (!targetPage) return { remoteLiveStrokes: nextLive };

          const updatedStrokes = [...targetPage.strokes, stroke];
          const updatedPages = curNb.pages.map((p: any, idx: number) =>
            idx === targetIndex ? { ...p, strokes: updatedStrokes } : p
          );
          const updatedNb = { ...curNb, pages: updatedPages, updatedAt: Date.now() };
          db.pages.update(targetPage.id, { strokes: updatedStrokes });
          return {
            remoteLiveStrokes: nextLive,
            notebooks: state.notebooks.map((n: any) => (n.id === activeNotebookId ? updatedNb : n)),
          };
        });
      }
    } else if (msg.type === 'STROKE_ERASE') {
      const { strokeIds, pageIndex } = msg.payload || {};
      if (strokeIds && strokeIds.length > 0 && activeNotebookId) {
        set((state: any) => {
          const curNb = state.notebooks.find((n: any) => n.id === activeNotebookId);
          if (!curNb) return {};
          const targetIndex = pageIndex !== undefined ? pageIndex : state.activePageIndex;
          const targetPage = curNb.pages[targetIndex];
          if (!targetPage) return {};
          const idSet = new Set(strokeIds);
          const filteredStrokes = targetPage.strokes.filter((s: any) => !idSet.has(s.id));
          const updatedPages = curNb.pages.map((p: any, idx: number) =>
            idx === targetIndex ? { ...p, strokes: filteredStrokes } : p
          );
          const updatedNb = { ...curNb, pages: updatedPages, updatedAt: Date.now() };
          db.pages.update(targetPage.id, { strokes: filteredStrokes });
          return {
            notebooks: state.notebooks.map((n: any) => (n.id === activeNotebookId ? updatedNb : n)),
          };
        });
      }
    } else if (msg.type === 'STATE_SYNC') {
      const { notebook: hostNb } = msg.payload || {};
      if (hostNb && !collaboration.isHost && activeNotebookId) {
        set((state: any) => {
          const curNb = state.notebooks.find((n: any) => n.id === activeNotebookId);
          if (!curNb) return {};
          const updatedNb = { ...curNb, pages: hostNb.pages, updatedAt: Date.now() };
          saveNotebookToDB(updatedNb);
          return {
            notebooks: state.notebooks.map((n: any) => (n.id === activeNotebookId ? updatedNb : n)),
          };
        });
      }
    }
  });
}

export const useNotebookStore = create<NotebookStoreState>((set, get) => ({
  notebooks: [],
  activeNotebookId: null,
  openNotebookIds: [],
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
    shapeFillColor: undefined,
    shapeFillOpacity: 0.25,
    favoriteColors: ['#0f172a', '#1e40af', '#b91c1c'],
    recentColors: ['#0f172a', '#1e40af', '#b91c1c', '#047857', '#6d28d9', '#d97706', '#ea580c', '#facc15'],
    favoriteSizes: [2.0, 3.5, 6.0],
    activeColorIndex: 0,
    activeSizeIndex: 1,
    streamline: 0.55,
    fillTolerance: 35,
    fontFamily: 'Inter',
    fontSize: 18,
    laserStyle: 'trail',
    laserColor: '#ef4444',
    spotlightRadius: 95,
    angleSnap: true,
    gridSnap: false,
    palmRejection: true,
    tiltShading: true,
    stylusDoubleTapAction: 'switch-eraser',
    scribbleToErase: true,
    circleToLasso: true,
  },

  presentationMode: false,
  speakerNotesOpen: false,
  filmstripOpen: false,
  presentationTimer: 0,
  isPresentationTimerRunning: false,
  lassoSelection: null,

  minimapVisible: false,
  plannerTabsVisible: false,
  linkModalState: {
    isOpen: false,
  },
  rulerVisible: false,
  rulerAngle: 0,
  rulerPosition: { x: 180, y: 350 },
  rulerWidth: 600,
  rulerUnit: 'cm',
  rulerEdgeSnap: true,
  protractorVisible: false,
  protractorAngle: 0,
  laserPoints: [],

  zoomWindowOpen: false,
  zoomWindowPos: { x: 80, y: 160 },
  zoomBoxWidth: 280,
  zoomBoxHeight: 140,
  zoomScale: 2.4,

  stickersDrawerOpen: false,
  customStickers: [],
  stickerCreatorModalOpen: false,
  stampCreatorModalOpen: false,

  isRecordingAudio: false,
  recordingDurationMs: 0,
  audioPlaybackTimeMs: 0,
  audioPlaying: false,
  audioSyncReplay: true,

  // Faz C Initial State
  liveTranscript: '',
  isTranscribing: false,
  unlockedNotebookIds: [],

  // FAZ AN Initial State
  unlockedPageIds: [],
  autoLockMinutes: 0,

  // Faz D Initial State
  compassVisible: false,
  compassRadius: 140,
  compassAngle: 0,

  symmetryEnabled: false,
  symmetryAxis: 'vertical',
  symmetryPosition: 0.5,

  pomodoroOpen: false,
  pomodoroRunning: false,
  pomodoroMode: 'work',
  pomodoroTimeLeft: 25 * 60,
  pomodoroTotalDuration: 25 * 60,

  activeAmbience: null,
  ambienceVolume: 0.5,

  // Faz E & Faz AD Initial State
  twoPageSpread: false,
  exportModalOpen: false,
  exportInitialPageRange: undefined,

  // Faz F & H Initial State
  marginWorkspaceOpen: false,
  tapeQuizMode: false,
  tapeQuizActiveIndex: 0,

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
  customTemplates: (() => {
    try {
      const saved = localStorage.getItem('notefree_custom_templates');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  })(),
  cornellStudyMode: 'none',
  cornellAssistantModalOpen: false,
  docImportModalOpen: false,
  newNotebookModalOpen: false,
  pageManagerModalOpen: false,
  studySetsModalOpen: false,
  searchModalOpen: false,
  shortcutsModalOpen: false,

  // Faz W Initial State
  scratchpadOpen: false,
  scratchpadMinimized: false,
  scratchpadMode: 'draw',
  scratchpadText: '',
  scratchpadColor: 'yellow',

  // Faz 2 Initial State
  mathModalOpen: false,
  mathInputEquation: '',
  functionPlotterModalOpen: false,
  functionPlotterInitialExpr: 'x^2 - 4',
  splitNotebook: {
    isOpen: false,
    secondaryNotebookId: null,
    secondaryPageIndex: 0,
    splitRatio: 0.5,
  },

  // Faz 3 & FAZ AK Initial State
  layersDrawerOpen: false,
  outlineDrawerOpen: false,
  layers: {
    background: true,
    strokes: true,
    highlighters: true,
    texts: true,
    stickers: true,
    tapes: true,
    fills: true,
    tables: true,
    connectors: true,
  },
  layerLocks: {
    background: false,
    strokes: false,
    highlighters: false,
    texts: false,
    stickers: false,
    tapes: false,
    fills: false,
    tables: false,
    connectors: false,
  },
  activeConnectorDraft: null,

  // Faz 4 Initial State: Infinite Canvas & Realtime Collaboration
  canvasMode: 'paged',
  infinitePan: { x: 0, y: 0 },
  collaborationModalOpen: false,
  collaboration: {
    isConnected: false,
    roomId: null,
    isHost: false,
    peers: [],
    myName: 'Öğrenci',
    myColor: '#6366f1',
  },
  remoteLiveStrokes: {},

  initialize: async () => {
    try {
      const notebooks = await initStorage();
      const firstNb = notebooks[0];
      const initialOpen = notebooks.slice(0, 4).map((n) => n.id);
      set({
        notebooks,
        activeNotebookId: firstNb ? firstNb.id : null,
        openNotebookIds: initialOpen.length > 0 ? initialOpen : (firstNb ? [firstNb.id] : []),
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
    const { openNotebookIds } = get();
    const newOpen = openNotebookIds.includes(id) ? openNotebookIds : [...openNotebookIds, id];
    set({
      activeNotebookId: id,
      openNotebookIds: newOpen,
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

  openNotebookTab: (notebookId: string) => {
    get().setActiveNotebook(notebookId);
  },

  closeNotebookTab: (notebookId: string) => {
    const { openNotebookIds, activeNotebookId, notebooks } = get();
    const nextTabs = openNotebookIds.filter((id) => id !== notebookId);

    if (activeNotebookId === notebookId) {
      const closedIndex = openNotebookIds.indexOf(notebookId);
      let nextActiveId: string | null = null;
      if (nextTabs.length > 0) {
        const nextIndex = Math.min(closedIndex, nextTabs.length - 1);
        nextActiveId = nextTabs[nextIndex];
      } else if (notebooks.length > 0) {
        nextActiveId = notebooks[0].id;
        nextTabs.push(nextActiveId);
      }

      if (nextActiveId) {
        get().setActiveNotebook(nextActiveId);
      } else {
        set({ activeNotebookId: null, openNotebookIds: [] });
      }
    }

    set({ openNotebookIds: nextTabs });
  },

  reorderNotebookTabs: (fromIndex: number, toIndex: number) => {
    const { openNotebookIds } = get();
    if (
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= openNotebookIds.length ||
      toIndex >= openNotebookIds.length ||
      fromIndex === toIndex
    ) {
      return;
    }
    const newTabs = [...openNotebookIds];
    const [removed] = newTabs.splice(fromIndex, 1);
    newTabs.splice(toIndex, 0, removed);
    set({ openNotebookIds: newTabs });
  },

  createNotebook: async (
    title: string,
    coverColor: string,
    template: PageTemplate = 'lined',
    coverStyle: CoverStyle = 'classic',
    paperColor: PaperColor = 'white',
    customTemplateId?: string
  ) => {
    const newId = `nb_${Date.now()}`;
    const pageId = `pg_${Date.now()}_1`;
    let backgroundImageUrl: string | undefined = undefined;
    let width = 800;
    let height = 1130;

    if (customTemplateId) {
      const customTpl = get().customTemplates.find((t) => t.id === customTemplateId);
      if (customTpl) {
        backgroundImageUrl = customTpl.dataUrl;
        if (customTpl.width) width = customTpl.width;
        if (customTpl.height) height = customTpl.height;
      }
    }

    const newPage: Page = {
      id: pageId,
      pageNumber: 1,
      template: customTemplateId ? 'blank' : template,
      paperColor,
      strokes: [],
      backgroundImageUrl,
      width,
      height,
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
      openNotebookIds: [...get().openNotebookIds, newId],
      activePageIndex: 0,
      undoStack: [],
      redoStack: [],
      newNotebookModalOpen: false,
      libraryViewOpen: false,
    });

    await saveNotebookToDB(newNotebook);
    return newId;
  },

  deleteNotebook: async (id: string) => {
    const filtered = get().notebooks.filter((n) => n.id !== id);
    const nextTabs = get().openNotebookIds.filter((tabId) => tabId !== id);
    const nextActive = nextTabs.length > 0 ? nextTabs[0] : (filtered[0] ? filtered[0].id : null);
    if (nextActive && !nextTabs.includes(nextActive)) {
      nextTabs.push(nextActive);
    }
    set({
      notebooks: filtered,
      openNotebookIds: nextTabs,
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

  updateCurrentPageTemplate: async (
    template: PageTemplate,
    paperColor: PaperColor,
    customPitch?: number,
    customLineColor?: string,
    lineOpacity?: number,
    backgroundImageUrl?: string,
    applyToAllPages?: boolean
  ) => {
    const { activeNotebookId, notebooks, activePageIndex } = get();
    if (!activeNotebookId) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb) return;

    const updatedPages = currentNb.pages.map((p, idx) =>
      applyToAllPages || idx === activePageIndex
        ? {
            ...p,
            template,
            paperColor,
            customPitch: customPitch !== undefined ? customPitch : p.customPitch,
            customLineColor: customLineColor !== undefined ? customLineColor : p.customLineColor,
            lineOpacity: lineOpacity !== undefined ? lineOpacity : p.lineOpacity,
            backgroundImageUrl: backgroundImageUrl !== undefined ? backgroundImageUrl : p.backgroundImageUrl,
          }
        : p
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

  addCustomTemplate: (template: CustomTemplateItem) => {
    set((state) => {
      const updated = [template, ...state.customTemplates.filter((t) => t.id !== template.id)];
      try {
        localStorage.setItem('notefree_custom_templates', JSON.stringify(updated));
      } catch (e) {
        console.warn('Could not save custom template to localStorage', e);
      }
      return { customTemplates: updated };
    });
  },

  addCustomTemplates: (templates: CustomTemplateItem[]) => {
    set((state) => {
      const newIds = new Set(templates.map((t) => t.id));
      const filteredExisting = state.customTemplates.filter((t) => !newIds.has(t.id));
      const updated = [...templates, ...filteredExisting];
      try {
        localStorage.setItem('notefree_custom_templates', JSON.stringify(updated));
      } catch (e) {
        console.warn('Could not save custom templates to localStorage', e);
      }
      return { customTemplates: updated };
    });
  },

  renameCustomTemplate: (id: string, newName: string) => {
    set((state) => {
      const updated = state.customTemplates.map((t) =>
        t.id === id ? { ...t, name: newName.trim() || t.name } : t
      );
      try {
        localStorage.setItem('notefree_custom_templates', JSON.stringify(updated));
      } catch (e) {
        console.warn('Could not update custom templates in localStorage', e);
      }
      return { customTemplates: updated };
    });
  },

  deleteCustomTemplate: (id: string) => {
    set((state) => {
      const updated = state.customTemplates.filter((t) => t.id !== id);
      try {
        localStorage.setItem('notefree_custom_templates', JSON.stringify(updated));
      } catch (e) {
        console.warn('Could not update custom templates in localStorage', e);
      }
      return { customTemplates: updated };
    });
  },

  saveCurrentPageAsCustomTemplate: async (name: string, category: CustomTemplateItem['category'] = 'custom') => {
    const { notebooks, activeNotebookId, activePageIndex, addCustomTemplate } = get();
    const currentNotebook = notebooks.find((n) => n.id === activeNotebookId);
    const currentPage = currentNotebook?.pages[activePageIndex];
    if (!currentPage) return null;

    try {
      const canvas = await renderPageToCanvas(currentPage, {
        scale: 1.5,
        includeTemplate: true,
        includeTexts: true,
        includeStickers: true,
        includeStickyNotes: true,
      });
      const dataUrl = canvas.toDataURL('image/png');
      const newTemplate: CustomTemplateItem = {
        id: `custom_tpl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: name.trim() || `${currentNotebook.title} - Sayfa ${activePageIndex + 1}`,
        dataUrl,
        width: currentPage.width,
        height: currentPage.height,
        createdAt: Date.now(),
        category,
        sourceFileName: currentNotebook.title,
        pageNumber: activePageIndex + 1,
      };
      addCustomTemplate(newTemplate);
      return newTemplate;
    } catch (err) {
      console.error('Failed to capture page as custom template', err);
      return null;
    }
  },

  setCornellStudyMode: (mode: CornellStudyMode) => {
    set({ cornellStudyMode: mode });
  },

  toggleCornellStudyMode: () => {
    set((state) => ({
      cornellStudyMode:
        state.cornellStudyMode === 'none'
          ? 'hide-notes'
          : state.cornellStudyMode === 'hide-notes'
          ? 'hide-cues'
          : 'none',
    }));
  },

  setCornellAssistantModalOpen: (open: boolean) => {
    set({ cornellAssistantModalOpen: open });
  },

  stampCornellBlocksToPage: async (pageIndex?: number, config?: CornellBlockConfig) => {
    const { notebooks, activeNotebookId, activePageIndex } = get();
    if (!activeNotebookId) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb) return;
    const targetIndex = pageIndex ?? activePageIndex;
    const targetPage = currentNb.pages[targetIndex];
    if (!targetPage) return;

    const width = targetPage.width || 800;
    const height = targetPage.height || 1100;
    const headerY = 70;
    const summaryY = height - 160;
    const cueColX = 220;

    const todayStr =
      config?.date ||
      new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    const courseStr = config?.course || 'Genel Konu & Ders';
    const topicStr = config?.topic || 'Ders Başlığı';

    const now = Date.now();
    const isDark = targetPage.paperColor === 'dark';

    const newAnnotations: TextAnnotation[] = [
      // 1. Header Box
      {
        id: `txt_cornell_header_${now}`,
        x: 35,
        y: 16,
        text: `📚 ${courseStr}   |   🎯 ${topicStr}   |   📅 ${todayStr}`,
        fontSize: 15,
        color: isDark ? '#93c5fd' : '#1e3a8a',
        fontFamily: 'Inter',
        width: Math.max(300, width - 70),
      },
      // 2. Cue Box
      {
        id: `txt_cornell_cue_${now + 1}`,
        x: 35,
        y: headerY + 12,
        text:
          config?.cues ||
          `❓ İPUÇLARI / SORULAR:\n• Anahtar terimler\n• Hatırlatıcı kelimeler\n• Sınav sorusu: ...?`,
        fontSize: 14,
        color: isDark ? '#fcd34d' : '#b45309',
        fontFamily: 'Inter',
        width: cueColX - 45,
      },
      // 3. Notes Box
      {
        id: `txt_cornell_notes_${now + 2}`,
        x: cueColX + 15,
        y: headerY + 12,
        text:
          config?.notes ||
          `📝 DERS NOTLARI:\n1. Ana fikirler ve detaylar\n2. Tanımlar ve formüller\n3. Adım adım açıklamalar`,
        fontSize: 15,
        color: isDark ? '#f8fafc' : '#0f172a',
        fontFamily: 'Inter',
        width: width - cueColX - 50,
      },
      // 4. Summary Box
      {
        id: `txt_cornell_summary_${now + 3}`,
        x: 35,
        y: summaryY + 12,
        text:
          config?.summary ||
          `📌 ÖZET (2-3 Cümle):\nBu sayfanın en kritik çıkarımı ve temel ana fikri burada sentezlenir.`,
        fontSize: 14,
        color: isDark ? '#86efac' : '#15803d',
        fontFamily: 'Inter',
        width: Math.max(300, width - 70),
      },
    ];

    const updatedPage = {
      ...targetPage,
      template: 'cornell' as PageTemplate,
      texts: [...(targetPage.texts || []), ...newAnnotations],
    };

    const updatedPages = currentNb.pages.map((p, idx) => (idx === targetIndex ? updatedPage : p));
    const updatedNotebook = { ...currentNb, pages: updatedPages, updatedAt: Date.now() };

    set({
      notebooks: notebooks.map((n) => (n.id === activeNotebookId ? updatedNotebook : n)),
    });
    await saveNotebookToDB(updatedNotebook);
  },

  updateCurrentPagePitch: async (
    customPitch?: number,
    customLineColor?: string,
    lineOpacity?: number
  ) => {
    const { activeNotebookId, notebooks, activePageIndex } = get();
    if (!activeNotebookId) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb) return;

    const updatedPages = currentNb.pages.map((p, idx) =>
      idx === activePageIndex
        ? {
            ...p,
            customPitch: customPitch !== undefined ? customPitch : p.customPitch,
            customLineColor: customLineColor !== undefined ? customLineColor : p.customLineColor,
            lineOpacity: lineOpacity !== undefined ? lineOpacity : p.lineOpacity,
          }
        : p
    );

    const updatedNotebook = { ...currentNb, pages: updatedPages, updatedAt: Date.now() };
    const updatedNotebooks = notebooks.map((n) =>
      n.id === activeNotebookId ? updatedNotebook : n
    );

    set({
      notebooks: updatedNotebooks,
    });

    await saveNotebookToDB(updatedNotebook);
  },

  reorderPages: async (fromIndex: number, toIndex: number) => {
    const { activeNotebookId, notebooks, activePageIndex } = get();
    if (!activeNotebookId) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb) return;
    if (
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= currentNb.pages.length ||
      toIndex >= currentNb.pages.length
    )
      return;

    const newPages = [...currentNb.pages];
    const [movedPage] = newPages.splice(fromIndex, 1);
    newPages.splice(toIndex, 0, movedPage);

    // Re-index all pages sequentially
    const reindexedPages = newPages.map((p, idx) => ({
      ...p,
      pageNumber: idx + 1,
    }));

    // If active page moved, track it
    let newActiveIndex = activePageIndex;
    if (activePageIndex === fromIndex) {
      newActiveIndex = toIndex;
    } else if (fromIndex < activePageIndex && toIndex >= activePageIndex) {
      newActiveIndex = activePageIndex - 1;
    } else if (fromIndex > activePageIndex && toIndex <= activePageIndex) {
      newActiveIndex = activePageIndex + 1;
    }

    const updatedNotebook: Notebook = {
      ...currentNb,
      pages: reindexedPages,
      activePageIndex: newActiveIndex,
      updatedAt: Date.now(),
    };

    const updatedNotebooks = notebooks.map((n) =>
      n.id === activeNotebookId ? updatedNotebook : n
    );

    set({
      notebooks: updatedNotebooks,
      activePageIndex: newActiveIndex,
    });

    await saveNotebookToDB(updatedNotebook);
  },

  movePageLeft: async (index: number) => {
    if (index <= 0) return;
    await get().reorderPages(index, index - 1);
  },

  movePageRight: async (index: number) => {
    const { activeNotebookId, notebooks } = get();
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb || index >= currentNb.pages.length - 1) return;
    await get().reorderPages(index, index + 1);
  },

  insertPageAt: async (index: number, template?: PageTemplate, paperColor?: PaperColor) => {
    const { activeNotebookId, notebooks } = get();
    if (!activeNotebookId) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb) return;

    const insertIdx = Math.max(0, Math.min(index, currentNb.pages.length));
    const refPage = currentNb.pages[Math.max(0, insertIdx - 1)] || currentNb.pages[0];

    const newPage: Page = {
      id: `pg_${Date.now()}_${insertIdx + 1}`,
      pageNumber: insertIdx + 1,
      template: template || refPage?.template || 'lined',
      paperColor: paperColor || refPage?.paperColor || 'white',
      strokes: [],
      width: 800,
      height: 1130,
      title: `Sayfa ${insertIdx + 1}`,
    };

    const newPages = [...currentNb.pages];
    newPages.splice(insertIdx, 0, newPage);

    // Re-index all pages
    const reindexedPages = newPages.map((p, idx) => ({
      ...p,
      pageNumber: idx + 1,
    }));

    const updatedNotebook: Notebook = {
      ...currentNb,
      pages: reindexedPages,
      activePageIndex: insertIdx,
      updatedAt: Date.now(),
    };

    const updatedNotebooks = notebooks.map((n) =>
      n.id === activeNotebookId ? updatedNotebook : n
    );

    set({
      notebooks: updatedNotebooks,
      activePageIndex: insertIdx,
      undoStack: [],
      redoStack: [],
    });

    await saveNotebookToDB(updatedNotebook);
  },

  removePagesBatch: async (indices: number[]) => {
    const { activeNotebookId, notebooks, activePageIndex } = get();
    if (!activeNotebookId || indices.length === 0) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb) return;

    const indexSet = new Set(indices);
    let remainingPages = currentNb.pages.filter((_, idx) => !indexSet.has(idx));

    // If all pages were removed, leave at least 1 blank page
    if (remainingPages.length === 0) {
      remainingPages = [
        {
          id: `pg_${Date.now()}_1`,
          pageNumber: 1,
          template: 'lined',
          paperColor: 'white',
          strokes: [],
          width: 800,
          height: 1130,
          title: 'Sayfa 1',
        },
      ];
    }

    const reindexedPages = remainingPages.map((p, idx) => ({
      ...p,
      pageNumber: idx + 1,
    }));

    const nextPageIndex = Math.min(reindexedPages.length - 1, Math.max(0, activePageIndex));
    const updatedNotebook: Notebook = {
      ...currentNb,
      pages: reindexedPages,
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

  duplicatePagesBatch: async (indices: number[]) => {
    const { activeNotebookId, notebooks } = get();
    if (!activeNotebookId || indices.length === 0) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb) return;

    const indexSet = new Set(indices);
    const newPages: Page[] = [];

    currentNb.pages.forEach((p, idx) => {
      newPages.push(p);
      if (indexSet.has(idx)) {
        const clonedPage: Page = {
          ...p,
          id: `pg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          title: `${p.title || `Sayfa ${idx + 1}`} (Kopya)`,
          strokes: (p.strokes || []).map((s) => ({
            ...s,
            id: `str_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          })),
          texts: (p.texts || []).map((t) => ({
            ...t,
            id: `txt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          })),
          images: (p.images || []).map((img) => ({
            ...img,
            id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          })),
          fills: (p.fills || []).map((f) => ({
            ...f,
            id: `fill_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          })),
          stickyNotes: (p.stickyNotes || []).map((sn) => ({
            ...sn,
            id: `sn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          })),
          tapes: (p.tapes || []).map((tp) => ({
            ...tp,
            id: `tp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          })),
          stickers: (p.stickers || []).map((stk) => ({
            ...stk,
            id: `stk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          })),
          tables: (p.tables || []).map((tbl) => ({
            ...tbl,
            id: `tbl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            cells: tbl.cells.map((row) =>
              row.map((cell) => ({
                ...cell,
                id: `c_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              }))
            ),
          })),
          connectors: (p.connectors || []).map((conn) => ({
            ...conn,
            id: `conn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          })),
        };
        newPages.push(clonedPage);
      }
    });

    const reindexedPages = newPages.map((p, idx) => ({
      ...p,
      pageNumber: idx + 1,
    }));

    const updatedNotebook: Notebook = {
      ...currentNb,
      pages: reindexedPages,
      updatedAt: Date.now(),
    };

    const updatedNotebooks = notebooks.map((n) =>
      n.id === activeNotebookId ? updatedNotebook : n
    );

    set({ notebooks: updatedNotebooks });
    await saveNotebookToDB(updatedNotebook);
  },

  toggleBookmarksBatch: async (indices: number[], forceState?: boolean) => {
    const { activeNotebookId, notebooks } = get();
    if (!activeNotebookId || indices.length === 0) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb) return;

    const indexSet = new Set(indices);
    const updatedPages = currentNb.pages.map((p, idx) => {
      if (!indexSet.has(idx)) return p;
      return {
        ...p,
        isBookmarked: typeof forceState === 'boolean' ? forceState : !p.isBookmarked,
      };
    });

    const updatedNotebook: Notebook = {
      ...currentNb,
      pages: updatedPages,
      updatedAt: Date.now(),
    };

    const updatedNotebooks = notebooks.map((n) =>
      n.id === activeNotebookId ? updatedNotebook : n
    );

    set({ notebooks: updatedNotebooks });
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
    if (tool === 'protractor') {
      get().toggleProtractor();
      return;
    }
    set((state) => ({
      previousTool: state.activeTool !== 'eraser' ? state.activeTool : state.previousTool,
      activeTool: tool,
      lassoSelection: tool !== 'lasso' ? null : state.lassoSelection,
    }));
  },

  setToolColor: (color: string) => {
    set((state) => {
      const existingRecent = state.toolSettings.recentColors || [];
      const filtered = existingRecent.filter((c) => c.toLowerCase() !== color.toLowerCase());
      const updatedRecent = [color, ...filtered].slice(0, 16);
      return {
        toolSettings: {
          ...state.toolSettings,
          color,
          recentColors: updatedRecent,
        },
      };
    });
  },

  setToolOpacity: (opacity: number) => {
    set((state) => ({
      toolSettings: {
        ...state.toolSettings,
        opacity: Math.max(0.05, Math.min(1, opacity)),
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

  setShapeFillColor: (color: string | undefined) => {
    set((state) => ({
      toolSettings: {
        ...state.toolSettings,
        shapeFillColor: color,
      },
    }));
  },

  setShapeFillOpacity: (opacity: number) => {
    set((state) => ({
      toolSettings: {
        ...state.toolSettings,
        shapeFillOpacity: Math.max(0.05, Math.min(1.0, opacity)),
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

    // Live Collaboration: Broadcast to peers
    const { collaboration } = get();
    if (collaboration.isConnected) {
      collaborationService.broadcastAddStroke(strokeWithAudio, activePageIndex);
    }
  },

  addStrokesToCurrentPage: (strokesToAdd: Stroke[]) => {
    if (!strokesToAdd || strokesToAdd.length === 0) return;
    const {
      activeNotebookId,
      notebooks,
      activePageIndex,
      undoStack,
      isRecordingAudio,
      collaboration,
    } = get();
    if (!activeNotebookId) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb) return;
    const currentPage = currentNb.pages[activePageIndex];
    if (!currentPage) return;

    const audioMs = isRecordingAudio ? audioRecorder.getElapsedMs() : undefined;
    const stampedStrokes = strokesToAdd.map((s) => ({
      ...s,
      audioTimestamp: audioMs,
    }));

    const newUndoStack = [...undoStack, [...currentPage.strokes]];
    const updatedStrokes = [...currentPage.strokes, ...stampedStrokes];

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

    if (collaboration.isConnected) {
      stampedStrokes.forEach((st) => {
        collaborationService.broadcastAddStroke(st, activePageIndex);
      });
    }
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
      collaboration,
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

    // Live Collaboration: Broadcast erase to peers
    if (collaboration.isConnected) {
      collaborationService.broadcastEraseStrokes(strokeIds, activePageIndex);
    }

    db.pages.update(currentPage.id, { strokes: filteredStrokes });

    if (toolSettings.autoDeselectEraser) {
      set({ activeTool: previousTool });
    }
  },

  updateStrokeOnCurrentPage: (strokeId: string, partial: Partial<Stroke>) => {
    const { activeNotebookId, notebooks, activePageIndex, undoStack } = get();
    if (!activeNotebookId) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb) return;
    const currentPage = currentNb.pages[activePageIndex];
    if (!currentPage) return;

    const newUndoStack = [...undoStack, [...currentPage.strokes]];
    const updatedStrokes = currentPage.strokes.map((s) =>
      s.id === strokeId ? { ...s, ...partial } : s
    );

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

  // FAZ J: Flip selected strokes horizontally or vertically
  flipLassoSelection: (direction: 'horizontal' | 'vertical') => {
    const { lassoSelection, activeNotebookId, notebooks, activePageIndex, undoStack } = get();
    if (!lassoSelection || !activeNotebookId) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb) return;
    const currentPage = currentNb.pages[activePageIndex];
    if (!currentPage) return;

    const selectedIdSet = new Set(lassoSelection.strokeIds);
    const cx = (lassoSelection.bounds.minX + lassoSelection.bounds.maxX) / 2;
    const cy = (lassoSelection.bounds.minY + lassoSelection.bounds.maxY) / 2;

    const selectedStrokes = currentPage.strokes.filter((s) => selectedIdSet.has(s.id));
    const flippedSelected = flipStrokes(selectedStrokes, direction, cx, cy);
    const flippedMap = new Map(flippedSelected.map((s) => [s.id, s]));

    const updatedStrokes = currentPage.strokes.map((s) => flippedMap.get(s.id) || s);
    const newBounds = computeGroupBounds(flippedSelected);

    const updatedPages = currentNb.pages.map((p, idx) =>
      idx === activePageIndex ? { ...p, strokes: updatedStrokes } : p
    );

    const updatedNotebook = { ...currentNb, pages: updatedPages, updatedAt: Date.now() };

    set({
      notebooks: notebooks.map((n) => (n.id === activeNotebookId ? updatedNotebook : n)),
      undoStack: [...undoStack, [...currentPage.strokes]],
      redoStack: [],
      lassoSelection: {
        ...lassoSelection,
        bounds: newBounds,
      },
    });

    db.pages.update(currentPage.id, { strokes: updatedStrokes });
  },

  // FAZ J: Align selected strokes relative to the group boundary
  alignLassoSelection: (alignment: AlignmentType) => {
    const { lassoSelection, activeNotebookId, notebooks, activePageIndex, undoStack } = get();
    if (!lassoSelection || !activeNotebookId) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb) return;
    const currentPage = currentNb.pages[activePageIndex];
    if (!currentPage) return;

    const selectedIdSet = new Set(lassoSelection.strokeIds);
    const selectedStrokes = currentPage.strokes.filter((s) => selectedIdSet.has(s.id));
    if (selectedStrokes.length <= 1) return;

    const alignedSelected = alignStrokes(selectedStrokes, alignment, lassoSelection.bounds);
    const alignedMap = new Map(alignedSelected.map((s) => [s.id, s]));

    const updatedStrokes = currentPage.strokes.map((s) => alignedMap.get(s.id) || s);
    const newBounds = computeGroupBounds(alignedSelected);

    const updatedPages = currentNb.pages.map((p, idx) =>
      idx === activePageIndex ? { ...p, strokes: updatedStrokes } : p
    );

    const updatedNotebook = { ...currentNb, pages: updatedPages, updatedAt: Date.now() };

    set({
      notebooks: notebooks.map((n) => (n.id === activeNotebookId ? updatedNotebook : n)),
      undoStack: [...undoStack, [...currentPage.strokes]],
      redoStack: [],
      lassoSelection: {
        ...lassoSelection,
        bounds: newBounds,
      },
    });

    db.pages.update(currentPage.id, { strokes: updatedStrokes });
  },

  // FAZ J: Duplicate selected strokes with a slight offset
  duplicateLassoSelection: () => {
    const { lassoSelection, activeNotebookId, notebooks, activePageIndex, undoStack } = get();
    if (!lassoSelection || !activeNotebookId) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb) return;
    const currentPage = currentNb.pages[activePageIndex];
    if (!currentPage) return;

    const selectedIdSet = new Set(lassoSelection.strokeIds);
    const selectedStrokes = currentPage.strokes.filter((s) => selectedIdSet.has(s.id));
    if (selectedStrokes.length === 0) return;

    const offset = 25;
    const clonedStrokes: Stroke[] = selectedStrokes.map((s) => {
      const newId = `st_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const shifted = translateStrokes([s], offset, offset)[0];
      return {
        ...shifted,
        id: newId,
        timestamp: Date.now(),
      };
    });

    const updatedStrokes = [...currentPage.strokes, ...clonedStrokes];
    const newBounds = computeGroupBounds(clonedStrokes);

    const updatedPages = currentNb.pages.map((p, idx) =>
      idx === activePageIndex ? { ...p, strokes: updatedStrokes } : p
    );

    const updatedNotebook = { ...currentNb, pages: updatedPages, updatedAt: Date.now() };

    set({
      notebooks: notebooks.map((n) => (n.id === activeNotebookId ? updatedNotebook : n)),
      undoStack: [...undoStack, [...currentPage.strokes]],
      redoStack: [],
      lassoSelection: {
        pageId: currentPage.id,
        strokeIds: clonedStrokes.map((s) => s.id),
        bounds: newBounds,
        originalStrokes: clonedStrokes,
        offsetX: 0,
        offsetY: 0,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
      },
    });

    db.pages.update(currentPage.id, { strokes: updatedStrokes });
  },

  // FAZ AG: Straighten handwriting baseline & snap to nearest notebook rule line
  straightenLassoSelection: () => {
    const { lassoSelection, activeNotebookId, notebooks, activePageIndex, undoStack } = get();
    if (!lassoSelection || !activeNotebookId) return null;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb) return null;
    const currentPage = currentNb.pages[activePageIndex];
    if (!currentPage) return null;

    const selectedIdSet = new Set(lassoSelection.strokeIds);
    const selectedStrokes = currentPage.strokes.filter((s) => selectedIdSet.has(s.id));
    if (selectedStrokes.length === 0) return null;

    // Run baseline regression and rule-line snapping
    const result = straightenHandwritingStrokes(
      selectedStrokes,
      currentPage.template,
      currentPage.customPitch
    );

    const straightenedMap = new Map(result.strokes.map((s) => [s.id, s]));
    const updatedStrokes = currentPage.strokes.map((s) => straightenedMap.get(s.id) || s);

    const updatedPages = currentNb.pages.map((p, idx) =>
      idx === activePageIndex ? { ...p, strokes: updatedStrokes } : p
    );

    const updatedNotebook = { ...currentNb, pages: updatedPages, updatedAt: Date.now() };

    set({
      notebooks: notebooks.map((n) => (n.id === activeNotebookId ? updatedNotebook : n)),
      undoStack: [...undoStack, [...currentPage.strokes]],
      redoStack: [],
      lassoSelection: {
        ...lassoSelection,
        bounds: result.newBounds,
        originalStrokes: result.strokes,
        offsetX: 0,
        offsetY: 0,
      },
    });

    db.pages.update(currentPage.id, { strokes: updatedStrokes });

    return {
      angleDegrees: result.angleDegrees,
      snappedDeltaY: result.snappedDeltaY,
    };
  },

  // FAZ J: Insert space / push all content below startY downwards by amount
  pushContentDownOnCurrentPage: (startY: number, amount: number) => {
    const { activeNotebookId, notebooks, activePageIndex, undoStack } = get();
    if (!activeNotebookId) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb) return;
    const currentPage = currentNb.pages[activePageIndex];
    if (!currentPage) return;

    // 1. Shift strokes below startY
    const updatedStrokes = pushStrokesDown(currentPage.strokes, startY, amount);

    // 2. Shift texts below startY
    const updatedTexts = currentPage.texts?.map((t) =>
      t.y >= startY ? { ...t, y: t.y + amount } : t
    );

    // 3. Shift sticky notes below startY
    const updatedStickyNotes = currentPage.stickyNotes?.map((sn) =>
      sn.y >= startY ? { ...sn, y: sn.y + amount } : sn
    );

    // 4. Shift tapes below startY
    const updatedTapes = currentPage.tapes?.map((tape) => {
      const isBelow = tape.points.some((p) => p.y >= startY);
      if (isBelow) {
        return {
          ...tape,
          points: tape.points.map((p) => ({ ...p, y: p.y + amount })),
        };
      }
      return tape;
    });

    // 5. Shift stickers below startY
    const updatedStickers = currentPage.stickers?.map((stk: PageSticker) =>
      stk.y >= startY ? { ...stk, y: stk.y + amount } : stk
    );

    // 6. Shift tables below startY
    const updatedTables = currentPage.tables?.map((tbl) =>
      tbl.y >= startY ? { ...tbl, y: tbl.y + amount } : tbl
    );

    // 7. Shift free connectors below startY
    const updatedConnectors = currentPage.connectors?.map((conn) => {
      const fromShifted =
        !conn.from.elementId && conn.from.y >= startY ? { ...conn.from, y: conn.from.y + amount } : conn.from;
      const toShifted =
        !conn.to.elementId && conn.to.y >= startY ? { ...conn.to, y: conn.to.y + amount } : conn.to;
      return {
        ...conn,
        from: fromShifted,
        to: toShifted,
      };
    });

    // Calculate maximum Y to expand page height if needed
    let maxY = currentPage.height;
    for (const s of updatedStrokes) {
      if (s.bounds.maxY > maxY) maxY = s.bounds.maxY;
    }
    if (updatedTables) {
      for (const tbl of updatedTables) {
        if (tbl.y + tbl.height > maxY) maxY = tbl.y + tbl.height;
      }
    }
    const newHeight = Math.max(currentPage.height, Math.ceil(maxY + 100));

    const updatedPage: Page = {
      ...currentPage,
      strokes: updatedStrokes,
      texts: updatedTexts,
      stickyNotes: updatedStickyNotes,
      tapes: updatedTapes,
      stickers: updatedStickers,
      tables: updatedTables,
      connectors: updatedConnectors,
      height: newHeight,
    };

    const updatedPages = currentNb.pages.map((p, idx) =>
      idx === activePageIndex ? updatedPage : p
    );

    const updatedNotebook = { ...currentNb, pages: updatedPages, updatedAt: Date.now() };

    set({
      notebooks: notebooks.map((n) => (n.id === activeNotebookId ? updatedNotebook : n)),
      undoStack: [...undoStack, [...currentPage.strokes]],
      redoStack: [],
      lassoSelection: null,
    });

    db.pages.update(currentPage.id, {
      strokes: updatedStrokes,
      texts: updatedTexts,
      stickyNotes: updatedStickyNotes,
      tapes: updatedTapes,
      stickers: updatedStickers,
      height: newHeight,
    });
  },

  // STICKERS ACTIONS
  setStickersDrawerOpen: (open: boolean) => {
    set({ stickersDrawerOpen: open });
  },

  addStickerToCurrentPage: (
    sticker: StickerItem,
    customPos?: { x?: number; y?: number; width?: number; height?: number; rotation?: number }
  ) => {
    const { activeNotebookId, notebooks, activePageIndex } = get();
    if (!activeNotebookId) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb) return;
    const currentPage = currentNb.pages[activePageIndex];
    if (!currentPage) return;

    const newPageSticker: PageSticker = {
      id: `pstk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      stickerId: sticker.id,
      x: customPos?.x !== undefined ? customPos.x : 100,
      y: customPos?.y !== undefined ? customPos.y : 150,
      width: customPos?.width !== undefined ? customPos.width : sticker.width,
      height: customPos?.height !== undefined ? customPos.height : sticker.height,
      rotation: customPos?.rotation !== undefined ? customPos.rotation : 0,
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

  updateStickerOnCurrentPage: (pageStickerId: string, partial: Partial<PageSticker>) => {
    const { activeNotebookId, notebooks, activePageIndex } = get();
    if (!activeNotebookId) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb) return;
    const currentPage = currentNb.pages[activePageIndex];
    if (!currentPage) return;

    const updatedStickers = (currentPage.stickers || []).map((s) =>
      s.id === pageStickerId ? { ...s, ...partial } : s
    );
    const updatedPages = currentNb.pages.map((p, idx) =>
      idx === activePageIndex ? { ...p, stickers: updatedStickers } : p
    );
    const updatedNotebook = { ...currentNb, pages: updatedPages, updatedAt: Date.now() };
    set({
      notebooks: notebooks.map((n) => (n.id === activeNotebookId ? updatedNotebook : n)),
    });
    saveNotebookToDB(updatedNotebook).catch(console.error);
  },

  duplicateStickerOnCurrentPage: (pageStickerId: string) => {
    const { activeNotebookId, notebooks, activePageIndex } = get();
    if (!activeNotebookId) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb) return;
    const currentPage = currentNb.pages[activePageIndex];
    if (!currentPage) return;

    const target = (currentPage.stickers || []).find((s) => s.id === pageStickerId);
    if (!target) return;

    const cloned: PageSticker = {
      ...target,
      id: `pstk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      x: target.x + 30,
      y: target.y + 30,
    };

    const updatedStickers = [...(currentPage.stickers || []), cloned];
    const updatedPages = currentNb.pages.map((p, idx) =>
      idx === activePageIndex ? { ...p, stickers: updatedStickers } : p
    );
    const updatedNotebook = { ...currentNb, pages: updatedPages, updatedAt: Date.now() };
    set({
      notebooks: notebooks.map((n) => (n.id === activeNotebookId ? updatedNotebook : n)),
    });
    saveNotebookToDB(updatedNotebook).catch(console.error);
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

  addCustomSticker: (sticker: StickerItem) => {
    set((state) => ({
      customStickers: [sticker, ...state.customStickers],
    }));
  },

  deleteCustomSticker: (stickerId: string) => {
    set((state) => ({
      customStickers: state.customStickers.filter((s) => s.id !== stickerId),
    }));
  },

  setStickerCreatorModalOpen: (open: boolean) => {
    set({ stickerCreatorModalOpen: open });
  },

  setStampCreatorModalOpen: (open: boolean) => {
    set({ stampCreatorModalOpen: open });
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
      // Start live lecture speech transcription if supported
      if (speechTranscriptionService.isSupported()) {
        speechTranscriptionService.clearTranscript();
        speechTranscriptionService.startListening((full, interim) => {
          set({
            liveTranscript: full + (interim ? (full ? ' ' : '') + interim : ''),
            isTranscribing: true,
          });
        });
        set({ isTranscribing: true, liveTranscript: '' });
      }
    }
  },

  stopAudioRecording: async () => {
    try {
      const res = await audioRecorder.stopRecording();
      let capturedTranscript = '';
      if (speechTranscriptionService.getIsListening()) {
        capturedTranscript = speechTranscriptionService.stopListening();
        set({ isTranscribing: false });
      }

      const { activeNotebookId, notebooks, liveTranscript } = get();
      const finalTranscript = capturedTranscript || liveTranscript || undefined;

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
        transcript: finalTranscript,
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

  // FAZ C: SPEECH TRANSCRIPTION ACTIONS
  startSpeechTranscription: (lang: string = 'tr-TR') => {
    if (!speechTranscriptionService.isSupported()) return false;
    speechTranscriptionService.clearTranscript();
    const success = speechTranscriptionService.startListening((full, interim) => {
      set({
        liveTranscript: full + (interim ? (full ? ' ' : '') + interim : ''),
        isTranscribing: true,
      });
    }, lang as any);
    if (success) {
      set({ isTranscribing: true, liveTranscript: '' });
    }
    return success;
  },

  stopSpeechTranscription: () => {
    const transcript = speechTranscriptionService.stopListening();
    set({ isTranscribing: false, liveTranscript: transcript || get().liveTranscript });
  },

  clearSpeechTranscript: () => {
    speechTranscriptionService.clearTranscript();
    set({ liveTranscript: '' });
  },

  addTranscriptToCurrentPageAsNote: () => {
    const { liveTranscript, activePageIndex, addTextAnnotation } = get();
    if (!liveTranscript.trim()) return;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    addTextAnnotation(
      activePageIndex,
      80,
      140,
      `🎙️ Dikte / Transkripsiyon [${timeStr}]:\n${liveTranscript}`
    );
  },

  // FAZ C: NOTEBOOK PIN VAULT SECURITY ACTIONS
  setNotebookPin: async (notebookId: string, pin: string | null) => {
    const { notebooks } = get();
    const updatedNotebooks = notebooks.map((nb) =>
      nb.id === notebookId
        ? {
            ...nb,
            isLocked: !!pin,
            pinCode: pin || undefined,
            updatedAt: Date.now(),
          }
        : nb
    );
    set({ notebooks: updatedNotebooks });
    const target = updatedNotebooks.find((n) => n.id === notebookId);
    if (target) await saveNotebookToDB(target);
  },

  unlockNotebookSession: (notebookId: string) => {
    set((state) => ({
      unlockedNotebookIds: Array.from(new Set([...state.unlockedNotebookIds, notebookId])),
    }));
  },

  isNotebookSessionUnlocked: (notebookId: string) => {
    const { notebooks, unlockedNotebookIds } = get();
    const nb = notebooks.find((n) => n.id === notebookId);
    if (!nb || !nb.isLocked) return true;
    return unlockedNotebookIds.includes(notebookId);
  },

  // FAZ AN: Page-level PIN lock & auto-lock
  setPagePin: async (notebookId: string, pageId: string, pin: string | null) => {
    const { notebooks } = get();
    const updatedNotebooks = notebooks.map((nb) =>
      nb.id === notebookId
        ? {
            ...nb,
            pages: nb.pages.map((p) =>
              p.id === pageId
                ? { ...p, isLocked: !!pin, pagePinCode: pin || undefined }
                : p
            ),
            updatedAt: Date.now(),
          }
        : nb
    );
    set({ notebooks: updatedNotebooks });
    const target = updatedNotebooks.find((n) => n.id === notebookId);
    if (target) await saveNotebookToDB(target);
  },

  unlockPageSession: (pageId: string) => {
    set((state) => ({
      unlockedPageIds: Array.from(new Set([...state.unlockedPageIds, pageId])),
    }));
  },

  isPageSessionUnlocked: (pageId: string) => {
    const { unlockedPageIds } = get();
    return unlockedPageIds.includes(pageId);
  },

  lockAllNotebooks: () => {
    set({ unlockedNotebookIds: [], unlockedPageIds: [] });
  },

  setAutoLockMinutes: (minutes: number) => {
    set({ autoLockMinutes: minutes });
  },

  // FAZ C: FULL LIBRARY VAULT BACKUP & RESTORE ACTIONS
  exportVaultBackup: () => {
    const { notebooks } = get();
    exportEntireVault(notebooks);
  },

  importVaultBackup: async (file: File) => {
    const res = await importEntireVault(file);
    if (res.success && res.notebooks.length > 0) {
      const existing = get().notebooks;
      const existingIds = new Set(existing.map((n) => n.id));
      const newItems = res.notebooks.filter((n) => !existingIds.has(n.id));
      const updatedList = [
        ...res.notebooks.filter((n) => existingIds.has(n.id)),
        ...newItems,
        ...existing.filter((n) => !res.notebooks.some((r) => r.id === n.id)),
      ];

      set({
        notebooks: updatedList,
        activeNotebookId: updatedList[0]?.id || null,
        activePageIndex: 0,
      });
      return { success: true, importedCount: res.importedCount };
    }
    return { success: false, importedCount: 0, error: res.error || 'İçe aktarma başarısız.' };
  },

  setAudioPlaybackTimeMs: (ms: number) => {
    set({ audioPlaybackTimeMs: ms });
  },

  setAudioPlaying: (playing: boolean) => {
    set({ audioPlaying: playing });
  },

  toggleAudioSyncReplay: () => {
    set((state) => ({ audioSyncReplay: !state.audioSyncReplay }));
  },

  // RULER & LASER
  toggleRuler: () => {
    set((state) => ({ rulerVisible: !state.rulerVisible }));
  },

  setRulerAngle: (angle: number) => {
    set({ rulerAngle: angle });
  },

  setRulerPosition: (pos: { x: number; y: number }) => {
    set({ rulerPosition: pos });
  },

  setRulerWidth: (width: number) => {
    set({ rulerWidth: width });
  },

  setRulerUnit: (unit: RulerUnit) => {
    set({ rulerUnit: unit });
  },

  toggleRulerEdgeSnap: () => {
    set((state) => ({ rulerEdgeSnap: !state.rulerEdgeSnap }));
  },

  // Faz B: Protractor & Sticky Notes
  toggleProtractor: () => {
    set((state) => ({ protractorVisible: !state.protractorVisible }));
  },

  setProtractorAngle: (angle: number) => {
    set({ protractorAngle: angle });
  },

  // Faz D: Compass (Pergel), Symmetry, Pomodoro & Ambience
  toggleCompass: () => {
    set((state) => ({ compassVisible: !state.compassVisible }));
  },

  setCompassRadius: (radius: number) => {
    set({ compassRadius: Math.max(20, Math.min(500, radius)) });
  },

  setCompassAngle: (angle: number) => {
    set({ compassAngle: angle });
  },

  toggleSymmetry: () => {
    set((state) => ({ symmetryEnabled: !state.symmetryEnabled }));
  },

  setSymmetryAxis: (axis: 'vertical' | 'horizontal') => {
    set({ symmetryAxis: axis });
  },

  setSymmetryPosition: (pos: number) => {
    set({ symmetryPosition: Math.max(0.1, Math.min(0.9, pos)) });
  },

  setPomodoroOpen: (open: boolean) => {
    set({ pomodoroOpen: open });
  },

  setPomodoroRunning: (running: boolean) => {
    set({ pomodoroRunning: running });
  },

  setPomodoroMode: (mode: 'work' | 'shortBreak' | 'longBreak') => {
    const duration = mode === 'work' ? 25 * 60 : mode === 'shortBreak' ? 5 * 60 : 15 * 60;
    set({
      pomodoroMode: mode,
      pomodoroTotalDuration: duration,
      pomodoroTimeLeft: duration,
      pomodoroRunning: false,
    });
  },

  setPomodoroTimeLeft: (time: number) => {
    set({ pomodoroTimeLeft: time });
  },

  tickPomodoro: () => {
    const { pomodoroTimeLeft, pomodoroRunning } = get();
    if (!pomodoroRunning) return;
    if (pomodoroTimeLeft <= 1) {
      set({ pomodoroTimeLeft: 0, pomodoroRunning: false });
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.6);
          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.6);
        }
      } catch (_) {}
    } else {
      set({ pomodoroTimeLeft: pomodoroTimeLeft - 1 });
    }
  },

  resetPomodoro: () => {
    const { pomodoroTotalDuration } = get();
    set({ pomodoroTimeLeft: pomodoroTotalDuration, pomodoroRunning: false });
  },

  toggleAmbience: (type: AmbientSoundType) => {
    const current = ambientAudioService.getActiveSound();
    if (current === type) {
      ambientAudioService.stop();
      set({ activeAmbience: null });
    } else {
      ambientAudioService.play(type);
      set({ activeAmbience: type });
    }
  },

  setAmbienceVolume: (volume: number) => {
    ambientAudioService.setVolume(volume);
    set({ ambienceVolume: volume });
  },

  // Faz E: Two-Page Book Spread & Export Studio Actions
  toggleTwoPageSpread: () => {
    set((state) => ({ twoPageSpread: !state.twoPageSpread }));
  },

  setExportModalOpen: (open: boolean, initialRange?: string) => {
    set({
      exportModalOpen: open,
      exportInitialPageRange: open ? initialRange : undefined,
    });
  },

  // Faz F: LiquidText Study Margin & Excerpt Workspace Actions
  toggleMarginWorkspace: () => {
    set((state) => ({ marginWorkspaceOpen: !state.marginWorkspaceOpen }));
  },

  setMarginWorkspaceOpen: (open: boolean) => {
    set({ marginWorkspaceOpen: open });
  },

  addMarginCard: (cardData: Omit<MarginExcerptCard, 'id' | 'createdAt'>) => {
    const { notebooks, activeNotebookId } = get();
    const nb = notebooks.find((n) => n.id === activeNotebookId);
    if (!nb) return;

    const newCard: MarginExcerptCard = {
      ...cardData,
      id: `margin-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: Date.now(),
    };

    const updatedNotebook: Notebook = {
      ...nb,
      marginCards: [...(nb.marginCards || []), newCard],
      updatedAt: Date.now(),
    };

    set({
      notebooks: notebooks.map((n) => (n.id === activeNotebookId ? updatedNotebook : n)),
    });
    saveNotebookToDB(updatedNotebook);
  },

  updateMarginCard: (id: string, partial: Partial<MarginExcerptCard>) => {
    const { notebooks, activeNotebookId } = get();
    const nb = notebooks.find((n) => n.id === activeNotebookId);
    if (!nb) return;

    const updatedCards = (nb.marginCards || []).map((c) =>
      c.id === id ? { ...c, ...partial } : c
    );

    const updatedNotebook: Notebook = {
      ...nb,
      marginCards: updatedCards,
      updatedAt: Date.now(),
    };

    set({
      notebooks: notebooks.map((n) => (n.id === activeNotebookId ? updatedNotebook : n)),
    });
    saveNotebookToDB(updatedNotebook);
  },

  deleteMarginCard: (id: string) => {
    const { notebooks, activeNotebookId } = get();
    const nb = notebooks.find((n) => n.id === activeNotebookId);
    if (!nb) return;

    const updatedCards = (nb.marginCards || []).filter((c) => c.id !== id);

    const updatedNotebook: Notebook = {
      ...nb,
      marginCards: updatedCards,
      updatedAt: Date.now(),
    };

    set({
      notebooks: notebooks.map((n) => (n.id === activeNotebookId ? updatedNotebook : n)),
    });
    saveNotebookToDB(updatedNotebook);
  },

  stampMarginCardToCanvas: (cardId: string) => {
    const { notebooks, activeNotebookId, addStickyNoteToCurrentPage } = get();
    const nb = notebooks.find((n) => n.id === activeNotebookId);
    if (!nb) return;
    const card = (nb.marginCards || []).find((c) => c.id === cardId);
    if (!card) return;

    const colorMap: Record<MarginCardColor, 'yellow' | 'pink' | 'mint' | 'blue' | 'purple'> = {
      amber: 'yellow',
      emerald: 'mint',
      sky: 'blue',
      rose: 'pink',
      purple: 'purple',
      slate: 'yellow',
    };

    addStickyNoteToCurrentPage({
      id: `sticky-${Date.now()}`,
      x: 120 + Math.random() * 60,
      y: 120 + Math.random() * 60,
      width: 220,
      height: 180,
      color: colorMap[card.color] || 'yellow',
      text: `${card.title ? `📌 ${card.title}\n\n` : ''}${card.content}`,
      createdAt: Date.now(),
    });
  },

  exportMarginCardsToNewPage: async () => {
    const { notebooks, activeNotebookId, addPage } = get();
    const nb = notebooks.find((n) => n.id === activeNotebookId);
    if (!nb || !nb.marginCards || nb.marginCards.length === 0) return;

    await addPage('lined-margin', 'cream');
    const updatedNb = get().notebooks.find((n) => n.id === activeNotebookId);
    if (!updatedNb) return;
    const newPageIndex = updatedNb.pages.length - 1;

    const colorMap: Record<MarginCardColor, 'yellow' | 'pink' | 'mint' | 'blue' | 'purple'> = {
      amber: 'yellow',
      emerald: 'mint',
      sky: 'blue',
      rose: 'pink',
      purple: 'purple',
      slate: 'yellow',
    };

    const newStickies: StickyNoteItem[] = nb.marginCards.map((card, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      return {
        id: `sticky-summary-${Date.now()}-${idx}`,
        x: 100 + col * 260,
        y: 80 + row * 220,
        width: 230,
        height: 190,
        color: colorMap[card.color] || 'yellow',
        text: `${card.title ? `📌 ${card.title}\n` : ''}${card.tags && card.tags.length > 0 ? `[${card.tags.join(', ')}]\n\n` : '\n'}${card.content}`,
        createdAt: Date.now(),
      };
    });

    const curPages = [...updatedNb.pages];
    const targetPage = curPages[newPageIndex];
    if (targetPage) {
      curPages[newPageIndex] = {
        ...targetPage,
        stickyNotes: [...(targetPage.stickyNotes || []), ...newStickies],
      };
      const finalNb = { ...updatedNb, pages: curPages, updatedAt: Date.now() };
      set({
        notebooks: get().notebooks.map((n) => (n.id === activeNotebookId ? finalNb : n)),
      });
      await saveNotebookToDB(finalNb);
    }
  },

  // Faz H: Active Recall Tape Quiz Mode Actions
  setTapeQuizMode: (active: boolean) => {
    set({ tapeQuizMode: active, tapeQuizActiveIndex: 0 });
    if (active) {
      const { activePageIndex, hideAllTapes } = get();
      hideAllTapes(activePageIndex);
    }
  },

  revealAllTapes: (pageIndex: number) => {
    const { notebooks, activeNotebookId } = get();
    const nb = notebooks.find((n) => n.id === activeNotebookId);
    if (!nb || !nb.pages[pageIndex]) return;

    const targetPage = nb.pages[pageIndex];
    const updatedTapes = (targetPage.tapes || []).map((t) => ({ ...t, isRevealed: true }));
    const updatedPages = [...nb.pages];
    updatedPages[pageIndex] = { ...targetPage, tapes: updatedTapes };
    const updatedNotebook = { ...nb, pages: updatedPages, updatedAt: Date.now() };

    set({
      notebooks: notebooks.map((n) => (n.id === activeNotebookId ? updatedNotebook : n)),
    });
    saveNotebookToDB(updatedNotebook);
  },

  hideAllTapes: (pageIndex: number) => {
    const { notebooks, activeNotebookId } = get();
    const nb = notebooks.find((n) => n.id === activeNotebookId);
    if (!nb || !nb.pages[pageIndex]) return;

    const targetPage = nb.pages[pageIndex];
    const updatedTapes = (targetPage.tapes || []).map((t) => ({ ...t, isRevealed: false }));
    const updatedPages = [...nb.pages];
    updatedPages[pageIndex] = { ...targetPage, tapes: updatedTapes };
    const updatedNotebook = { ...nb, pages: updatedPages, updatedAt: Date.now() };

    set({
      notebooks: notebooks.map((n) => (n.id === activeNotebookId ? updatedNotebook : n)),
    });
    saveNotebookToDB(updatedNotebook);
  },

  nextTapeQuizItem: () => {
    const { notebooks, activeNotebookId, activePageIndex, tapeQuizActiveIndex } = get();
    const nb = notebooks.find((n) => n.id === activeNotebookId);
    const tapes = nb?.pages[activePageIndex]?.tapes || [];
    if (tapes.length === 0) return;
    const nextIdx = (tapeQuizActiveIndex + 1) % tapes.length;
    set({ tapeQuizActiveIndex: nextIdx });
  },

  prevTapeQuizItem: () => {
    const { notebooks, activeNotebookId, activePageIndex, tapeQuizActiveIndex } = get();
    const nb = notebooks.find((n) => n.id === activeNotebookId);
    const tapes = nb?.pages[activePageIndex]?.tapes || [];
    if (tapes.length === 0) return;
    const prevIdx = tapeQuizActiveIndex === 0 ? tapes.length - 1 : tapeQuizActiveIndex - 1;
    set({ tapeQuizActiveIndex: prevIdx });
  },

  addStickyNoteToCurrentPage: (note: StickyNoteItem) => {
    const { activeNotebookId, notebooks, activePageIndex } = get();
    if (!activeNotebookId) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb) return;
    const targetPage = currentNb.pages[activePageIndex];
    if (!targetPage) return;

    const updatedStickyNotes = [...(targetPage.stickyNotes || []), note];
    const updatedPages = currentNb.pages.map((p, idx) =>
      idx === activePageIndex ? { ...p, stickyNotes: updatedStickyNotes } : p
    );

    const updatedNotebook = { ...currentNb, pages: updatedPages, updatedAt: Date.now() };
    set({
      notebooks: notebooks.map((n) =>
        n.id === activeNotebookId ? updatedNotebook : n
      ),
    });
    saveNotebookToDB(updatedNotebook);
  },

  updateStickyNoteOnCurrentPage: (noteId: string, partial: Partial<StickyNoteItem>) => {
    const { activeNotebookId, notebooks, activePageIndex } = get();
    if (!activeNotebookId) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb) return;
    const targetPage = currentNb.pages[activePageIndex];
    if (!targetPage) return;

    const updatedStickyNotes = (targetPage.stickyNotes || []).map((sn) =>
      sn.id === noteId ? { ...sn, ...partial } : sn
    );
    const updatedPages = currentNb.pages.map((p, idx) =>
      idx === activePageIndex ? { ...p, stickyNotes: updatedStickyNotes } : p
    );

    const updatedNotebook = { ...currentNb, pages: updatedPages, updatedAt: Date.now() };
    set({
      notebooks: notebooks.map((n) =>
        n.id === activeNotebookId ? updatedNotebook : n
      ),
    });
    saveNotebookToDB(updatedNotebook);
  },

  removeStickyNoteFromCurrentPage: (noteId: string) => {
    const { activeNotebookId, notebooks, activePageIndex } = get();
    if (!activeNotebookId) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb) return;
    const targetPage = currentNb.pages[activePageIndex];
    if (!targetPage) return;

    const updatedStickyNotes = (targetPage.stickyNotes || []).filter((sn) => sn.id !== noteId);
    const updatedPages = currentNb.pages.map((p, idx) =>
      idx === activePageIndex ? { ...p, stickyNotes: updatedStickyNotes } : p
    );

    const updatedNotebook = { ...currentNb, pages: updatedPages, updatedAt: Date.now() };
    set({
      notebooks: notebooks.map((n) =>
        n.id === activeNotebookId ? updatedNotebook : n
      ),
    });
    saveNotebookToDB(updatedNotebook);
  },

  // Faz AF: Interactive Tables & Data Matrices Actions
  addTableToCurrentPage: (rows = 3, cols = 3, x = 140, y = 180) => {
    const { activeNotebookId, notebooks, activePageIndex } = get();
    if (!activeNotebookId) return '';
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb) return '';
    const targetPage = currentNb.pages[activePageIndex];
    if (!targetPage) return '';

    const rowCount = Math.max(1, Math.min(20, rows));
    const colCount = Math.max(1, Math.min(12, cols));
    const cellW = 150;
    const cellH = 38;
    const tableW = colCount * cellW;
    const tableH = rowCount * cellH;

    const initialCells: TableCell[][] = [];
    for (let r = 0; r < rowCount; r++) {
      const row: TableCell[] = [];
      for (let c = 0; c < colCount; c++) {
        row.push({
          id: `c_${Date.now()}_${r}_${c}_${Math.random().toString(36).slice(2, 5)}`,
          text: '',
          align: 'left',
          bold: r === 0,
        });
      }
      initialCells.push(row);
    }

    const newTable: PageTableItem = {
      id: `tbl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      x,
      y,
      width: tableW,
      height: tableH,
      rows: rowCount,
      cols: colCount,
      cells: initialCells,
      hasHeaderRow: true,
      headerBgColor: 'rgba(99, 102, 241, 0.12)',
      borderColor: '#94a3b8',
      borderWidth: 1,
      createdAt: Date.now(),
    };

    const updatedTables = [...(targetPage.tables || []), newTable];
    const updatedPages = currentNb.pages.map((p, idx) =>
      idx === activePageIndex ? { ...p, tables: updatedTables } : p
    );

    const updatedNotebook = { ...currentNb, pages: updatedPages, updatedAt: Date.now() };
    set({
      notebooks: notebooks.map((n) =>
        n.id === activeNotebookId ? updatedNotebook : n
      ),
    });
    saveNotebookToDB(updatedNotebook);
    return newTable.id;
  },

  updateTableOnCurrentPage: (tableId: string, updates: Partial<PageTableItem>) => {
    const { activeNotebookId, notebooks, activePageIndex } = get();
    if (!activeNotebookId) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb) return;
    const targetPage = currentNb.pages[activePageIndex];
    if (!targetPage) return;

    const updatedTables = (targetPage.tables || []).map((t) =>
      t.id === tableId ? { ...t, ...updates } : t
    );
    const updatedPages = currentNb.pages.map((p, idx) =>
      idx === activePageIndex ? { ...p, tables: updatedTables } : p
    );

    const updatedNotebook = { ...currentNb, pages: updatedPages, updatedAt: Date.now() };
    set({
      notebooks: notebooks.map((n) =>
        n.id === activeNotebookId ? updatedNotebook : n
      ),
    });
    saveNotebookToDB(updatedNotebook);
  },

  updateTableCell: (tableId: string, row: number, col: number, cellUpdates: Partial<TableCell>) => {
    const { activeNotebookId, notebooks, activePageIndex } = get();
    if (!activeNotebookId) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb) return;
    const targetPage = currentNb.pages[activePageIndex];
    if (!targetPage) return;

    const targetTable = (targetPage.tables || []).find((t) => t.id === tableId);
    if (!targetTable) return;

    const newCells = targetTable.cells.map((rCells, rIdx) => {
      if (rIdx !== row) return rCells;
      return rCells.map((cCell, cIdx) => {
        if (cIdx !== col) return cCell;
        return { ...cCell, ...cellUpdates };
      });
    });

    const updatedTables = (targetPage.tables || []).map((t) =>
      t.id === tableId ? { ...t, cells: newCells } : t
    );
    const updatedPages = currentNb.pages.map((p, idx) =>
      idx === activePageIndex ? { ...p, tables: updatedTables } : p
    );

    const updatedNotebook = { ...currentNb, pages: updatedPages, updatedAt: Date.now() };
    set({
      notebooks: notebooks.map((n) =>
        n.id === activeNotebookId ? updatedNotebook : n
      ),
    });
    saveNotebookToDB(updatedNotebook);
  },

  addRowToTable: (tableId: string, atIndex?: number) => {
    const { activeNotebookId, notebooks, activePageIndex } = get();
    if (!activeNotebookId) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb) return;
    const targetPage = currentNb.pages[activePageIndex];
    if (!targetPage) return;

    const targetTable = (targetPage.tables || []).find((t) => t.id === tableId);
    if (!targetTable) return;

    const newRowCells: TableCell[] = [];
    for (let c = 0; c < targetTable.cols; c++) {
      newRowCells.push({
        id: `c_${Date.now()}_${targetTable.rows}_${c}_${Math.random().toString(36).slice(2, 5)}`,
        text: '',
        align: 'left',
      });
    }

    const insertIdx = atIndex !== undefined ? atIndex : targetTable.rows;
    const newCells = [...targetTable.cells];
    newCells.splice(insertIdx, 0, newRowCells);

    const rowH = targetTable.height / targetTable.rows;
    const updatedTable: PageTableItem = {
      ...targetTable,
      rows: targetTable.rows + 1,
      height: targetTable.height + rowH,
      cells: newCells,
    };

    const updatedTables = (targetPage.tables || []).map((t) =>
      t.id === tableId ? updatedTable : t
    );
    const updatedPages = currentNb.pages.map((p, idx) =>
      idx === activePageIndex ? { ...p, tables: updatedTables } : p
    );

    const updatedNotebook = { ...currentNb, pages: updatedPages, updatedAt: Date.now() };
    set({
      notebooks: notebooks.map((n) =>
        n.id === activeNotebookId ? updatedNotebook : n
      ),
    });
    saveNotebookToDB(updatedNotebook);
  },

  deleteRowFromTable: (tableId: string, rowIndex: number) => {
    const { activeNotebookId, notebooks, activePageIndex } = get();
    if (!activeNotebookId) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb) return;
    const targetPage = currentNb.pages[activePageIndex];
    if (!targetPage) return;

    const targetTable = (targetPage.tables || []).find((t) => t.id === tableId);
    if (!targetTable || targetTable.rows <= 1) return; // Keep at least 1 row

    const newCells = targetTable.cells.filter((_, idx) => idx !== rowIndex);
    const rowH = targetTable.height / targetTable.rows;
    const updatedTable: PageTableItem = {
      ...targetTable,
      rows: targetTable.rows - 1,
      height: Math.max(38, targetTable.height - rowH),
      cells: newCells,
    };

    const updatedTables = (targetPage.tables || []).map((t) =>
      t.id === tableId ? updatedTable : t
    );
    const updatedPages = currentNb.pages.map((p, idx) =>
      idx === activePageIndex ? { ...p, tables: updatedTables } : p
    );

    const updatedNotebook = { ...currentNb, pages: updatedPages, updatedAt: Date.now() };
    set({
      notebooks: notebooks.map((n) =>
        n.id === activeNotebookId ? updatedNotebook : n
      ),
    });
    saveNotebookToDB(updatedNotebook);
  },

  addColToTable: (tableId: string, atIndex?: number) => {
    const { activeNotebookId, notebooks, activePageIndex } = get();
    if (!activeNotebookId) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb) return;
    const targetPage = currentNb.pages[activePageIndex];
    if (!targetPage) return;

    const targetTable = (targetPage.tables || []).find((t) => t.id === tableId);
    if (!targetTable) return;

    const insertIdx = atIndex !== undefined ? atIndex : targetTable.cols;
    const newCells = targetTable.cells.map((rCells, rIdx) => {
      const copy = [...rCells];
      copy.splice(insertIdx, 0, {
        id: `c_${Date.now()}_${rIdx}_${targetTable.cols}_${Math.random().toString(36).slice(2, 5)}`,
        text: '',
        align: 'left',
        bold: rIdx === 0 && targetTable.hasHeaderRow,
      });
      return copy;
    });

    const colW = targetTable.width / targetTable.cols;
    const updatedTable: PageTableItem = {
      ...targetTable,
      cols: targetTable.cols + 1,
      width: targetTable.width + colW,
      cells: newCells,
    };

    const updatedTables = (targetPage.tables || []).map((t) =>
      t.id === tableId ? updatedTable : t
    );
    const updatedPages = currentNb.pages.map((p, idx) =>
      idx === activePageIndex ? { ...p, tables: updatedTables } : p
    );

    const updatedNotebook = { ...currentNb, pages: updatedPages, updatedAt: Date.now() };
    set({
      notebooks: notebooks.map((n) =>
        n.id === activeNotebookId ? updatedNotebook : n
      ),
    });
    saveNotebookToDB(updatedNotebook);
  },

  deleteColFromTable: (tableId: string, colIndex: number) => {
    const { activeNotebookId, notebooks, activePageIndex } = get();
    if (!activeNotebookId) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb) return;
    const targetPage = currentNb.pages[activePageIndex];
    if (!targetPage) return;

    const targetTable = (targetPage.tables || []).find((t) => t.id === tableId);
    if (!targetTable || targetTable.cols <= 1) return; // Keep at least 1 column

    const newCells = targetTable.cells.map((rCells) =>
      rCells.filter((_, idx) => idx !== colIndex)
    );
    const colW = targetTable.width / targetTable.cols;
    const updatedTable: PageTableItem = {
      ...targetTable,
      cols: targetTable.cols - 1,
      width: Math.max(80, targetTable.width - colW),
      cells: newCells,
    };

    const updatedTables = (targetPage.tables || []).map((t) =>
      t.id === tableId ? updatedTable : t
    );
    const updatedPages = currentNb.pages.map((p, idx) =>
      idx === activePageIndex ? { ...p, tables: updatedTables } : p
    );

    const updatedNotebook = { ...currentNb, pages: updatedPages, updatedAt: Date.now() };
    set({
      notebooks: notebooks.map((n) =>
        n.id === activeNotebookId ? updatedNotebook : n
      ),
    });
    saveNotebookToDB(updatedNotebook);
  },

  deleteTableFromCurrentPage: (tableId: string) => {
    const { activeNotebookId, notebooks, activePageIndex } = get();
    if (!activeNotebookId) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb) return;
    const targetPage = currentNb.pages[activePageIndex];
    if (!targetPage) return;

    const updatedTables = (targetPage.tables || []).filter((t) => t.id !== tableId);
    const updatedPages = currentNb.pages.map((p, idx) =>
      idx === activePageIndex ? { ...p, tables: updatedTables } : p
    );

    const updatedNotebook = { ...currentNb, pages: updatedPages, updatedAt: Date.now() };
    set({
      notebooks: notebooks.map((n) =>
        n.id === activeNotebookId ? updatedNotebook : n
      ),
    });
    saveNotebookToDB(updatedNotebook);
  },

  // FAZ AH: Smart Magnetic Connectors & Flowchart Mind Map Lines
  addConnectorToCurrentPage: (connector: PageConnectorItem) => {
    const { notebooks, activeNotebookId, activePageIndex } = get();
    if (!activeNotebookId) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb) return;
    const targetPage = currentNb.pages[activePageIndex];
    if (!targetPage) return;

    const updatedConnectors = [...(targetPage.connectors || []), connector];
    const updatedPages = currentNb.pages.map((p, idx) =>
      idx === activePageIndex ? { ...p, connectors: updatedConnectors } : p
    );

    const updatedNotebook = { ...currentNb, pages: updatedPages, updatedAt: Date.now() };
    set({
      notebooks: notebooks.map((n) =>
        n.id === activeNotebookId ? updatedNotebook : n
      ),
    });
    saveNotebookToDB(updatedNotebook);
  },

  updateConnectorOnCurrentPage: (connectorId: string, updates: Partial<PageConnectorItem>) => {
    const { notebooks, activeNotebookId, activePageIndex } = get();
    if (!activeNotebookId) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb) return;
    const targetPage = currentNb.pages[activePageIndex];
    if (!targetPage) return;

    const updatedConnectors = (targetPage.connectors || []).map((c) =>
      c.id === connectorId ? { ...c, ...updates } : c
    );
    const updatedPages = currentNb.pages.map((p, idx) =>
      idx === activePageIndex ? { ...p, connectors: updatedConnectors } : p
    );

    const updatedNotebook = { ...currentNb, pages: updatedPages, updatedAt: Date.now() };
    set({
      notebooks: notebooks.map((n) =>
        n.id === activeNotebookId ? updatedNotebook : n
      ),
    });
    saveNotebookToDB(updatedNotebook);
  },

  removeConnectorFromCurrentPage: (connectorId: string) => {
    const { notebooks, activeNotebookId, activePageIndex } = get();
    if (!activeNotebookId) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb) return;
    const targetPage = currentNb.pages[activePageIndex];
    if (!targetPage) return;

    const updatedConnectors = (targetPage.connectors || []).filter((c) => c.id !== connectorId);
    const updatedPages = currentNb.pages.map((p, idx) =>
      idx === activePageIndex ? { ...p, connectors: updatedConnectors } : p
    );

    const updatedNotebook = { ...currentNb, pages: updatedPages, updatedAt: Date.now() };
    set({
      notebooks: notebooks.map((n) =>
        n.id === activeNotebookId ? updatedNotebook : n
      ),
    });
    saveNotebookToDB(updatedNotebook);
  },

  setActiveConnectorDraft: (draft: { from: ConnectorAnchor; to: { x: number; y: number } } | null) => {
    set({ activeConnectorDraft: draft });
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

  toggleMinimap: () => {
    set((state) => ({ minimapVisible: !state.minimapVisible }));
  },

  setMinimapVisible: (visible: boolean) => {
    set({ minimapVisible: visible });
  },

  togglePlannerTabs: () => {
    set((state) => ({ plannerTabsVisible: !state.plannerTabsVisible }));
  },

  setPlannerTabsVisible: (visible: boolean) => {
    set({ plannerTabsVisible: visible });
  },

  openLinkModal: (params) => {
    set({
      linkModalState: {
        isOpen: true,
        ...params,
      },
    });
  },

  closeLinkModal: () => {
    set({
      linkModalState: {
        isOpen: false,
      },
    });
  },

  navigateToPage: (targetIndex: number) => {
    const { notebooks, activeNotebookId, viewMode } = get();
    if (!activeNotebookId) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb || !currentNb.pages.length) return;
    const boundedIndex = Math.max(0, Math.min(currentNb.pages.length - 1, targetIndex));
    set({ activePageIndex: boundedIndex });
    if (viewMode === 'continuous') {
      setTimeout(() => {
        const el = document.getElementById(`page-card-${boundedIndex}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
    }
  },

  addPageLinkToCurrentPage: (link: PageLinkItem) => {
    const { notebooks, activeNotebookId, activePageIndex } = get();
    if (!activeNotebookId) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb || !currentNb.pages[activePageIndex]) return;

    const page = currentNb.pages[activePageIndex];
    const updatedLinks = [...(page.links || []), link];
    const updatedPages = currentNb.pages.map((p, idx) =>
      idx === activePageIndex ? { ...p, links: updatedLinks } : p
    );
    const updatedNotebook = { ...currentNb, pages: updatedPages, updatedAt: Date.now() };

    set({
      notebooks: notebooks.map((n) => (n.id === activeNotebookId ? updatedNotebook : n)),
    });
    saveNotebookToDB(updatedNotebook).catch(console.error);
  },

  removePageLinkFromCurrentPage: (linkId: string) => {
    const { notebooks, activeNotebookId, activePageIndex } = get();
    if (!activeNotebookId) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb || !currentNb.pages[activePageIndex]) return;

    const page = currentNb.pages[activePageIndex];
    const updatedLinks = (page.links || []).filter((l) => l.id !== linkId);
    const updatedPages = currentNb.pages.map((p, idx) =>
      idx === activePageIndex ? { ...p, links: updatedLinks } : p
    );
    const updatedNotebook = { ...currentNb, pages: updatedPages, updatedAt: Date.now() };

    set({
      notebooks: notebooks.map((n) => (n.id === activeNotebookId ? updatedNotebook : n)),
    });
    saveNotebookToDB(updatedNotebook).catch(console.error);
  },

  updatePageLinkOnCurrentPage: (linkId: string, partial: Partial<PageLinkItem>) => {
    const { notebooks, activeNotebookId, activePageIndex } = get();
    if (!activeNotebookId) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb || !currentNb.pages[activePageIndex]) return;

    const page = currentNb.pages[activePageIndex];
    const updatedLinks = (page.links || []).map((l) =>
      l.id === linkId ? { ...l, ...partial } : l
    );
    const updatedPages = currentNb.pages.map((p, idx) =>
      idx === activePageIndex ? { ...p, links: updatedLinks } : p
    );
    const updatedNotebook = { ...currentNb, pages: updatedPages, updatedAt: Date.now() };

    set({
      notebooks: notebooks.map((n) => (n.id === activeNotebookId ? updatedNotebook : n)),
    });
    saveNotebookToDB(updatedNotebook).catch(console.error);
  },

  addPlannerTab: (tab: PlannerTabItem) => {
    const { notebooks, activeNotebookId } = get();
    if (!activeNotebookId) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb) return;

    const currentTabs = currentNb.plannerTabs || DEFAULT_PLANNER_TABS;
    const updatedTabs = [...currentTabs, tab];
    const updatedNotebook = { ...currentNb, plannerTabs: updatedTabs, updatedAt: Date.now() };

    set({
      notebooks: notebooks.map((n) => (n.id === activeNotebookId ? updatedNotebook : n)),
    });
    saveNotebookToDB(updatedNotebook).catch(console.error);
  },

  updatePlannerTab: (tabId: string, partial: Partial<PlannerTabItem>) => {
    const { notebooks, activeNotebookId } = get();
    if (!activeNotebookId) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb) return;

    const currentTabs = currentNb.plannerTabs || DEFAULT_PLANNER_TABS;
    const updatedTabs = currentTabs.map((t) => (t.id === tabId ? { ...t, ...partial } : t));
    const updatedNotebook = { ...currentNb, plannerTabs: updatedTabs, updatedAt: Date.now() };

    set({
      notebooks: notebooks.map((n) => (n.id === activeNotebookId ? updatedNotebook : n)),
    });
    saveNotebookToDB(updatedNotebook).catch(console.error);
  },

  removePlannerTab: (tabId: string) => {
    const { notebooks, activeNotebookId } = get();
    if (!activeNotebookId) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb) return;

    const currentTabs = currentNb.plannerTabs || DEFAULT_PLANNER_TABS;
    const updatedTabs = currentTabs.filter((t) => t.id !== tabId);
    const updatedNotebook = { ...currentNb, plannerTabs: updatedTabs, updatedAt: Date.now() };

    set({
      notebooks: notebooks.map((n) => (n.id === activeNotebookId ? updatedNotebook : n)),
    });
    saveNotebookToDB(updatedNotebook).catch(console.error);
  },

  reorderPlannerTabs: (tabs: PlannerTabItem[]) => {
    const { notebooks, activeNotebookId } = get();
    if (!activeNotebookId) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb) return;

    const updatedNotebook = { ...currentNb, plannerTabs: tabs, updatedAt: Date.now() };
    set({
      notebooks: notebooks.map((n) => (n.id === activeNotebookId ? updatedNotebook : n)),
    });
    saveNotebookToDB(updatedNotebook).catch(console.error);
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

  setSearchModalOpen: (open: boolean) => {
    set({ searchModalOpen: open });
  },

  setShortcutsModalOpen: (open: boolean) => {
    set({ shortcutsModalOpen: open });
  },

  importPagesAsNotebook: async (pages: Page[], title: string, pdfOutline?: PdfOutlineItem[]) => {
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
      pdfOutline: pdfOutline || [],
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

  setZoomBoxSize: (width: number, height: number) => {
    set({
      zoomBoxWidth: Math.max(160, Math.min(600, width)),
      zoomBoxHeight: Math.max(80, Math.min(350, height)),
    });
  },

  setZoomScale: (scale: number) => {
    set({ zoomScale: Math.max(1.5, Math.min(4.0, scale)) });
  },

  advanceZoomWindow: () => {
    const { zoomWindowPos, zoomBoxWidth, activeNotebookId, notebooks, activePageIndex } = get();
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    const currentPage = currentNb?.pages[activePageIndex];
    const pageWidth = currentPage?.width || 800;

    const nextX = zoomWindowPos.x + zoomBoxWidth * 0.72;
    if (nextX + zoomBoxWidth * 0.45 > pageWidth - 30) {
      get().newLineZoomWindow();
    } else {
      set({ zoomWindowPos: { ...zoomWindowPos, x: Math.min(pageWidth - zoomBoxWidth, nextX) } });
    }
  },

  rewindZoomWindow: () => {
    const { zoomWindowPos, zoomBoxWidth, activeNotebookId, notebooks, activePageIndex } = get();
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    const currentPage = currentNb?.pages[activePageIndex];
    const minLeft = currentPage?.template === 'lined-margin' ? 90 : 40;

    const prevX = Math.max(minLeft, zoomWindowPos.x - zoomBoxWidth * 0.72);
    set({ zoomWindowPos: { ...zoomWindowPos, x: prevX } });
  },

  newLineZoomWindow: () => {
    const { zoomWindowPos, zoomBoxHeight, activeNotebookId, notebooks, activePageIndex } = get();
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    const currentPage = currentNb?.pages[activePageIndex];
    const pageHeight = currentPage?.height || 1130;

    const startX = currentPage?.template === 'lined-margin' ? 95 : 45;
    const linePitch = currentPage?.customPitch || 32;
    const linesPerBox = Math.max(1, Math.round(zoomBoxHeight / linePitch));
    const stepY = linesPerBox * linePitch;

    const nextY = Math.min(pageHeight - zoomBoxHeight - 20, zoomWindowPos.y + stepY);
    set({ zoomWindowPos: { x: startX, y: nextY } });
  },

  // Faz W: Floating Quick Scratchpad Actions
  toggleScratchpad: () => {
    set((state) => ({ scratchpadOpen: !state.scratchpadOpen, scratchpadMinimized: false }));
  },
  setScratchpadOpen: (open: boolean) => {
    set({ scratchpadOpen: open });
  },
  setScratchpadMinimized: (minimized: boolean) => {
    set({ scratchpadMinimized: minimized });
  },
  setScratchpadMode: (mode: 'draw' | 'text') => {
    set({ scratchpadMode: mode });
  },
  setScratchpadText: (text: string) => {
    set({ scratchpadText: text });
  },
  setScratchpadColor: (color: StickyNoteColor) => {
    set({ scratchpadColor: color });
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

  setLaserColor: (color: string) => {
    set({
      toolSettings: {
        ...get().toolSettings,
        laserColor: color,
      },
    });
  },

  setSpotlightRadius: (radius: number) => {
    set({
      toolSettings: {
        ...get().toolSettings,
        spotlightRadius: radius,
      },
    });
  },

  setSpeakerNotesOpen: (open: boolean) => {
    set({ speakerNotesOpen: open });
  },

  updateCurrentPageSpeakerNotes: (notes: string) => {
    const { notebooks, activeNotebookId, activePageIndex } = get();
    if (!activeNotebookId) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb || !currentNb.pages[activePageIndex]) return;

    const updatedPages = [...currentNb.pages];
    updatedPages[activePageIndex] = {
      ...updatedPages[activePageIndex],
      speakerNotes: notes,
    };

    const updatedNb = {
      ...currentNb,
      pages: updatedPages,
      updatedAt: Date.now(),
    };

    set({
      notebooks: notebooks.map((n) => (n.id === activeNotebookId ? updatedNb : n)),
    });
    saveNotebookToDB(updatedNb);
  },

  setFilmstripOpen: (open: boolean) => {
    set({ filmstripOpen: open });
  },

  startPresentationTimer: () => {
    set({ isPresentationTimerRunning: true });
  },

  pausePresentationTimer: () => {
    set({ isPresentationTimerRunning: false });
  },

  resetPresentationTimer: () => {
    set({ presentationTimer: 0, isPresentationTimerRunning: false });
  },

  tickPresentationTimer: () => {
    if (get().isPresentationTimerRunning) {
      set({ presentationTimer: get().presentationTimer + 1 });
    }
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

  // Faz 2: Math AI Solver Actions
  openMathModal: (initialEquation?: string) => {
    set({
      mathModalOpen: true,
      mathInputEquation: initialEquation || '',
    });
  },

  closeMathModal: () => {
    set({ mathModalOpen: false });
  },

  addMathSolutionToCanvas: (equation: string, result: string) => {
    const { activePageIndex, addTextAnnotation } = get();
    addTextAnnotation(activePageIndex, 120, 220, `∑ Math AI:\n${equation}\n➔ ${result}`);
  },

  // Faz AB: STEM 2D Function Plotter & Coordinate Stamping Actions
  openFunctionPlotterModal: (initialExpr?: string) => {
    set({
      functionPlotterModalOpen: true,
      functionPlotterInitialExpr: initialExpr || 'x^2 - 4',
    });
  },

  closeFunctionPlotterModal: () => {
    set({ functionPlotterModalOpen: false });
  },

  stampPlotGraphToCurrentPage: ({ strokes, texts }: { strokes: Stroke[]; texts: TextAnnotation[] }) => {
    const { notebooks, activeNotebookId, activePageIndex, undoStack } = get();
    if (!activeNotebookId) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb || !currentNb.pages[activePageIndex]) return;

    const currentPage = currentNb.pages[activePageIndex];
    const newUndoStack = [...undoStack, [...currentPage.strokes]];

    const updatedStrokes = [...currentPage.strokes, ...strokes];
    const updatedTexts = [...(currentPage.texts || []), ...texts];

    const updatedPages = currentNb.pages.map((p, idx) =>
      idx === activePageIndex
        ? { ...p, strokes: updatedStrokes, texts: updatedTexts }
        : p
    );

    const updatedNotebook = { ...currentNb, pages: updatedPages, updatedAt: Date.now() };

    set({
      notebooks: notebooks.map((n) => (n.id === activeNotebookId ? updatedNotebook : n)),
      undoStack: newUndoStack,
      redoStack: [],
      functionPlotterModalOpen: false,
    });

    saveNotebookToDB(updatedNotebook).catch(console.error);
  },

  // Faz 2: Dual Notebook Split Screen Actions
  openDualNotebook: (secondaryNotebookId: string) => {
    const { notebooks } = get();
    const secNb = notebooks.find((n) => n.id === secondaryNotebookId);
    set({
      splitNotebook: {
        isOpen: true,
        secondaryNotebookId,
        secondaryPageIndex: secNb ? secNb.activePageIndex || 0 : 0,
        splitRatio: 0.5,
      },
    });
  },

  closeDualNotebook: () => {
    set((state) => ({
      splitNotebook: {
        ...state.splitNotebook,
        isOpen: false,
        secondaryNotebookId: null,
      },
    }));
  },

  setDualNotebookRatio: (ratio: number) => {
    const clamped = Math.max(0.25, Math.min(0.75, ratio));
    set((state) => ({
      splitNotebook: {
        ...state.splitNotebook,
        splitRatio: clamped,
      },
    }));
  },

  setSecondaryPageIndex: (index: number) => {
    const { splitNotebook, notebooks } = get();
    if (!splitNotebook.secondaryNotebookId) return;
    const secNb = notebooks.find((n) => n.id === splitNotebook.secondaryNotebookId);
    if (!secNb) return;
    const clamped = Math.max(0, Math.min(secNb.pages.length - 1, index));
    set((state) => ({
      splitNotebook: {
        ...state.splitNotebook,
        secondaryPageIndex: clamped,
      },
    }));
  },

  // Faz 2: Tape to Flashcard Auto Generator
  generateFlashcardsFromTapes: (notebookId: string) => {
    const { notebooks } = get();
    const nb = notebooks.find((n) => n.id === notebookId);
    if (!nb) return 0;

    let generatedCount = 0;
    const newCards: Flashcard[] = [];

    nb.pages.forEach((page) => {
      if (page.tapes && page.tapes.length > 0) {
        page.tapes.forEach((_tape, index) => {
          generatedCount++;
          const frontQuestion = `Sayfa ${page.pageNumber} (${page.title || 'Ders Notu'}) - Gizlenen Kısım #${index + 1}`;
          const backAnswer = `Bu bant Sayfa ${page.pageNumber} üzerinde bulunmaktadır. Notu inceleyin ve cevabı hatırlamaya çalışın.`;

          newCards.push({
            id: `fc_tape_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            notebookId: nb.id,
            pageId: page.id,
            frontText: frontQuestion,
            backText: backAnswer,
            difficulty: 'again',
            reviewCount: 0,
            createdAt: Date.now(),
          });
        });
      }
    });

    if (newCards.length > 0) {
      const existingCards = nb.flashcards || [];
      const updatedNotebook = {
        ...nb,
        flashcards: [...existingCards, ...newCards],
        updatedAt: Date.now(),
      };
      set({
        notebooks: notebooks.map((n) => (n.id === notebookId ? updatedNotebook : n)),
        studySetsModalOpen: true,
      });
      saveNotebookToDB(updatedNotebook);
    }

    return generatedCount;
  },

  // Faz 3: Multi-Layer, Precision & Outline Actions
  setLayersDrawerOpen: (open: boolean) => {
    set({ layersDrawerOpen: open });
  },

  toggleLayerVisibility: (layer: keyof LayerVisibilitySettings) => {
    set((state) => ({
      layers: {
        ...state.layers,
        [layer]: !state.layers[layer],
      },
    }));
  },

  toggleLayerLock: (layer: keyof LayerLockSettings) => {
    set((state) => ({
      layerLocks: {
        ...state.layerLocks,
        [layer]: !state.layerLocks[layer],
      },
    }));
  },

  toggleAngleSnap: () => {
    set((state) => ({
      toolSettings: {
        ...state.toolSettings,
        angleSnap: !state.toolSettings.angleSnap,
      },
    }));
  },

  toggleGridSnap: () => {
    set((state) => ({
      toolSettings: {
        ...state.toolSettings,
        gridSnap: !state.toolSettings.gridSnap,
      },
    }));
  },

  togglePalmRejection: () => {
    set((state) => ({
      toolSettings: {
        ...state.toolSettings,
        palmRejection: !state.toolSettings.palmRejection,
      },
    }));
  },

  toggleTiltShading: () => {
    set((state) => ({
      toolSettings: {
        ...state.toolSettings,
        tiltShading: !state.toolSettings.tiltShading,
      },
    }));
  },

  setStylusDoubleTapAction: (action: StylusDoubleTapAction) => {
    set((state) => ({
      toolSettings: {
        ...state.toolSettings,
        stylusDoubleTapAction: action,
      },
    }));
  },

  toggleScribbleToErase: () => {
    set((state) => ({
      toolSettings: {
        ...state.toolSettings,
        scribbleToErase: state.toolSettings.scribbleToErase !== false ? false : true,
      },
    }));
  },

  toggleCircleToLasso: () => {
    set((state) => ({
      toolSettings: {
        ...state.toolSettings,
        circleToLasso: state.toolSettings.circleToLasso !== false ? false : true,
      },
    }));
  },

  setOutlineDrawerOpen: (open: boolean) => {
    set({ outlineDrawerOpen: open });
  },

  addOutlineItem: (title: string, pageIndex: number, level: number = 0, color?: string) => {
    const { notebooks, activeNotebookId } = get();
    if (!activeNotebookId) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb) return;

    const newItem: PdfOutlineItem = {
      id: `toc_manual_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: title.trim(),
      pageIndex: Math.max(0, Math.min(pageIndex, (currentNb.pages?.length || 1) - 1)),
      level: Math.max(0, Math.min(level, 2)),
      color,
      isAutoGenerated: false,
    };

    const updatedOutline = [...(currentNb.pdfOutline || []), newItem].sort(
      (a, b) => a.pageIndex - b.pageIndex || a.level - b.level
    );

    const updatedNb = {
      ...currentNb,
      pdfOutline: updatedOutline,
      updatedAt: Date.now(),
    };

    set({
      notebooks: notebooks.map((n) => (n.id === activeNotebookId ? updatedNb : n)),
    });
    saveNotebookToDB(updatedNb);
  },

  updateOutlineItem: (id: string, updates: Partial<PdfOutlineItem>) => {
    const { notebooks, activeNotebookId } = get();
    if (!activeNotebookId) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb || !currentNb.pdfOutline) return;

    const updatedOutline = currentNb.pdfOutline
      .map((item) => {
        if (item.id === id) {
          return { ...item, ...updates };
        }
        return item;
      })
      .sort((a, b) => a.pageIndex - b.pageIndex || a.level - b.level);

    const updatedNb = {
      ...currentNb,
      pdfOutline: updatedOutline,
      updatedAt: Date.now(),
    };

    set({
      notebooks: notebooks.map((n) => (n.id === activeNotebookId ? updatedNb : n)),
    });
    saveNotebookToDB(updatedNb);
  },

  deleteOutlineItem: (outlineId: string) => {
    const { notebooks, activeNotebookId } = get();
    if (!activeNotebookId) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb || !currentNb.pdfOutline) return;

    const updatedOutline = currentNb.pdfOutline.filter((it) => it.id !== outlineId);
    const updatedNb = {
      ...currentNb,
      pdfOutline: updatedOutline,
      updatedAt: Date.now(),
    };

    set({
      notebooks: notebooks.map((n) => (n.id === activeNotebookId ? updatedNb : n)),
    });
    saveNotebookToDB(updatedNb);
  },

  reorderOutlineItems: (startIndex: number, endIndex: number) => {
    const { notebooks, activeNotebookId } = get();
    if (!activeNotebookId) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb || !currentNb.pdfOutline) return;

    const items = [...currentNb.pdfOutline];
    if (startIndex < 0 || startIndex >= items.length || endIndex < 0 || endIndex >= items.length) return;
    const [removed] = items.splice(startIndex, 1);
    items.splice(endIndex, 0, removed);

    const updatedNb = {
      ...currentNb,
      pdfOutline: items,
      updatedAt: Date.now(),
    };

    set({
      notebooks: notebooks.map((n) => (n.id === activeNotebookId ? updatedNb : n)),
    });
    saveNotebookToDB(updatedNb);
  },

  generateAutoOutlineFromNotebook: (): number => {
    const { notebooks, activeNotebookId } = get();
    if (!activeNotebookId) return 0;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb || !currentNb.pages) return 0;

    const existingOutline = currentNb.pdfOutline || [];
    const existingKeys = new Set(existingOutline.map((it) => `${it.pageIndex}_${it.title.toLowerCase().trim()}`));
    const newItems: PdfOutlineItem[] = [];

    currentNb.pages.forEach((page, pageIdx) => {
      // 1. Page Title
      if (page.title && page.title.trim().length > 0) {
        const title = page.title.trim();
        const key = `${pageIdx}_${title.toLowerCase()}`;
        if (!existingKeys.has(key)) {
          existingKeys.add(key);
          newItems.push({
            id: `toc_page_${pageIdx}_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
            title,
            pageIndex: pageIdx,
            level: 0,
            color: '#6366f1',
            isAutoGenerated: true,
          });
        }
      }

      // 2. Bookmarked Pages
      if (page.isBookmarked) {
        const bookmarkTitle = page.title?.trim() || `Sayfa ${pageIdx + 1} (Yer İmi)`;
        const key = `${pageIdx}_${bookmarkTitle.toLowerCase()}`;
        if (!existingKeys.has(key)) {
          existingKeys.add(key);
          newItems.push({
            id: `toc_bm_${pageIdx}_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
            title: bookmarkTitle,
            pageIndex: pageIdx,
            level: 1,
            color: '#f59e0b',
            isBookmark: true,
            isAutoGenerated: true,
          });
        }
      }

      // 3. Scan Text Annotations for Markdown Headings (# , ## , ### ) or Prominent Headings
      if (page.texts && page.texts.length > 0) {
        page.texts.forEach((txt) => {
          const raw = txt.text.trim();
          if (!raw) return;

          let detectedTitle = '';
          let detectedLevel = 1;
          let isHeading = false;

          if (raw.startsWith('### ')) {
            detectedTitle = raw.replace(/^###\s+/, '').split('\n')[0].trim();
            detectedLevel = 2;
            isHeading = true;
          } else if (raw.startsWith('## ')) {
            detectedTitle = raw.replace(/^##\s+/, '').split('\n')[0].trim();
            detectedLevel = 1;
            isHeading = true;
          } else if (raw.startsWith('# ')) {
            detectedTitle = raw.replace(/^#\s+/, '').split('\n')[0].trim();
            detectedLevel = 0;
            isHeading = true;
          } else if (txt.fontSize >= 22 && raw.length <= 60 && !raw.includes('\n')) {
            detectedTitle = raw;
            detectedLevel = txt.fontSize >= 28 ? 0 : 1;
            isHeading = true;
          }

          if (isHeading && detectedTitle) {
            const key = `${pageIdx}_${detectedTitle.toLowerCase()}`;
            if (!existingKeys.has(key)) {
              existingKeys.add(key);
              newItems.push({
                id: `toc_auto_${pageIdx}_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
                title: detectedTitle,
                pageIndex: pageIdx,
                level: detectedLevel,
                color: detectedLevel === 0 ? '#6366f1' : detectedLevel === 1 ? '#06b6d4' : '#10b981',
                isAutoGenerated: true,
              });
            }
          }
        });
      }
    });

    if (newItems.length === 0) return 0;

    const merged = [...existingOutline, ...newItems].sort(
      (a, b) => a.pageIndex - b.pageIndex || a.level - b.level
    );

    const updatedNb = {
      ...currentNb,
      pdfOutline: merged,
      updatedAt: Date.now(),
    };

    set({
      notebooks: notebooks.map((n) => (n.id === activeNotebookId ? updatedNb : n)),
    });
    saveNotebookToDB(updatedNb);
    return newItems.length;
  },

  clearOutline: () => {
    const { notebooks, activeNotebookId } = get();
    if (!activeNotebookId) return;
    const currentNb = notebooks.find((n) => n.id === activeNotebookId);
    if (!currentNb) return;

    const updatedNb = {
      ...currentNb,
      pdfOutline: [],
      updatedAt: Date.now(),
    };

    set({
      notebooks: notebooks.map((n) => (n.id === activeNotebookId ? updatedNb : n)),
    });
    saveNotebookToDB(updatedNb);
  },

  // Faz 4: Infinite Canvas Mode Actions
  setCanvasMode: (mode: CanvasMode) => {
    set({ canvasMode: mode });
  },

  setInfinitePan: (pan: { x: number; y: number }) => {
    set({ infinitePan: pan });
  },

  resetInfinitePan: () => {
    set({ infinitePan: { x: 0, y: 0 }, zoom: 1.0 });
  },

  // Faz 4: WebRTC & P2P Live Collaboration Actions
  setCollaborationModalOpen: (open: boolean) => {
    set({ collaborationModalOpen: open });
  },

  startCollaborationRoom: (roomId?: string, userName?: string) => {
    const finalRoomId = roomId || collaborationService.generateRoomCode();
    const finalName = userName || 'Oda Kurucu (Host)';
    collaborationService.setMyProfile(finalName);
    collaborationService.joinRoom(finalRoomId, finalName);

    set({
      collaboration: {
        isConnected: true,
        roomId: finalRoomId,
        isHost: true,
        peers: [],
        myName: finalName,
        myColor: collaborationService.getMyColor(),
      },
      collaborationModalOpen: false,
    });

    setupCollaborationListener(set, get);
    return finalRoomId;
  },

  joinCollaborationRoom: (roomId: string, userName?: string) => {
    const finalName = userName || 'Katılımcı';
    collaborationService.setMyProfile(finalName);
    collaborationService.joinRoom(roomId, finalName);

    set({
      collaboration: {
        isConnected: true,
        roomId: roomId.trim().toUpperCase(),
        isHost: false,
        peers: [],
        myName: finalName,
        myColor: collaborationService.getMyColor(),
      },
      collaborationModalOpen: false,
    });

    setupCollaborationListener(set, get);
  },

  leaveCollaborationRoom: () => {
    collaborationService.leaveRoom();
    if (collabUnsub) {
      collabUnsub();
      collabUnsub = null;
    }
    set({
      collaboration: {
        isConnected: false,
        roomId: null,
        isHost: false,
        peers: [],
        myName: 'Öğrenci',
        myColor: '#6366f1',
      },
      remoteLiveStrokes: {},
    });
  },

  updateMyCursor: (x: number, y: number) => {
    const { collaboration } = get();
    if (collaboration.isConnected) {
      collaborationService.broadcastCursor(x, y);
    }
  },

  setRemotePeers: (peers: PeerUser[]) => {
    set((state) => ({
      collaboration: {
        ...state.collaboration,
        peers,
      },
    }));
  },

  setRemoteLiveStroke: (senderId: string, strokeData: { points: any[]; tool: string; color: string; size: number } | null) => {
    set((state) => {
      const next = { ...state.remoteLiveStrokes };
      if (strokeData) {
        next[senderId] = strokeData;
      } else {
        delete next[senderId];
      }
      return { remoteLiveStrokes: next };
    });
  },
}));
