export type PenType =
  | 'ballpoint'
  | 'fountain'
  | 'brush'
  | 'highlighter'
  | 'pencil'
  | 'fineliner'
  | 'neon'
  | 'dashed'
  | 'tape';

export type ToolType =
  | PenType
  | 'eraser'
  | 'lasso'
  | 'shape'
  | 'text'
  | 'laser'
  | 'ruler'
  | 'pan'
  | 'eyedropper'
  | 'fill'
  | 'audio-scrub'
  | 'sticky-note'
  | 'protractor'
  | 'compass';

export type EraserMode = 'stroke' | 'pixel';

export type RulerUnit = 'cm' | 'mm' | 'in' | 'px';

export type ShapeType = 'line' | 'rectangle' | 'circle' | 'triangle' | 'arrow';

export type PageTemplate =
  | 'blank'
  | 'lined'
  | 'lined-margin'
  | 'grid-5mm'
  | 'dots'
  | 'isometric'
  | 'cornell'
  | 'planner-weekly'
  | 'planner-daily'
  | 'music'
  | 'hexagonal'
  | 'chemistry-hex'
  | 'engineering-1mm'
  | 'language-vocab'
  | 'guitar-tab'
  | 'planner-habit'
  | 'tianzige-kanji';

export type PaperColor = 'white' | 'cream' | 'yellow-pad' | 'dark' | 'kraft';

export type CoverStyle = 'classic' | 'leather' | 'pastel' | 'spiral' | 'modern';

export interface CustomTemplateItem {
  id: string;
  name: string;
  dataUrl: string;
  width?: number;
  height?: number;
  createdAt: number;
}

export interface StrokePoint {
  x: number;
  y: number;
  pressure: number;
  timestamp?: number;
  tiltX?: number;
  tiltY?: number;
}

export interface StrokeBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface ShapeControlNode {
  id: string;    // e.g. 'tl' | 'tr' | 'bl' | 'br' | 'start' | 'end' | 'cx' | 'cy' | 'rx' | 'ry' | 'apex' | 'mid-l' | 'mid-r'
  x: number;
  y: number;
  role: 'corner' | 'edge' | 'center' | 'apex' | 'radius' | 'endpoint' | 'barb';
}

export interface Stroke {
  id: string;
  tool: PenType;
  color: string;
  size: number;
  points: StrokePoint[];
  bounds: StrokeBounds;
  timestamp: number;
  videoTimestamp?: number; // Linked YouTube timestamp in seconds
  audioTimestamp?: number; // Linked audio recording timestamp in milliseconds
  // Faz I: Shape vertex editing metadata
  shapeType?: ShapeType; // Set when drawn as explicit shape
  controlNodes?: ShapeControlNode[]; // Editable control points for shape morphing
  shapeFillColor?: string; // Optional fill inside closed shapes
  shapeFillOpacity?: number; // Optional opacity (0.0 to 1.0) for fill
  pageLink?: number; // Target page index for hyperlinks
  url?: string; // External web link
}

export interface TextAnnotation {
  id: string;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  color: string;
  fontFamily: 'Inter' | 'Caveat' | 'serif' | 'monospace';
  width: number;
  height?: number;
  bg?: string;
  pageLink?: number; // Target page index for hyperlinks
  url?: string; // External web link
}

export interface PdfOutlineItem {
  id: string;
  title: string;
  pageIndex: number;
  level: number;
}

export interface LayerVisibilitySettings {
  background: boolean;
  strokes: boolean;
  highlighters: boolean;
  texts: boolean;
  stickers: boolean;
  tapes: boolean;
  fills: boolean;
}

export interface LayerLockSettings {
  background: boolean;
  strokes: boolean;
  highlighters: boolean;
  texts: boolean;
  stickers: boolean;
  tapes: boolean;
  fills: boolean;
}

export interface StickerItem {
  id: string;
  name: string;
  category: string; // 'sticky' | 'tape' | 'icon' | 'custom' | custom collections
  content: string; // SVG string, emoji, or dataUrl
  width: number;
  height: number;
}

export interface PageSticker {
  id: string;
  stickerId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  content: string;
  category: string;
}

export interface PageImage {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  dataUrl: string;
  timestamp?: number;
  cropBounds?: { x: number; y: number; width: number; height: number };
}

export interface TapeItem {
  id: string;
  points: StrokePoint[];
  color: string;
  width: number;
  isRevealed: boolean;
  timestamp: number;
}

export interface FillItem {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  opacity: number;
  dataUrl: string;
  bounds: StrokeBounds;
  timestamp: number;
}

export interface Page {
  id: string;
  pageNumber: number;
  template: PageTemplate;
  paperColor: PaperColor;
  strokes: Stroke[];
  images?: PageImage[];
  texts?: TextAnnotation[];
  stickers?: PageSticker[];
  tapes?: TapeItem[];
  fills?: FillItem[];
  stickyNotes?: StickyNoteItem[];
  links?: PageLinkItem[]; // Interactive page hyperlinks & hotspots
  backgroundImageUrl?: string; // Rendered PDF or Word page
  width: number;
  height: number;
  title?: string;
  isBookmarked?: boolean;
  customPitch?: number; // Custom line/grid spacing in px (e.g. 20 - 64)
  customLineColor?: string; // Optional custom line hex color
  lineOpacity?: number; // Line opacity (0.1 - 1.0)
}

export interface PageLinkItem {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  targetPageIndex?: number; // Target page index in this notebook (0-indexed)
  url?: string; // External web link (e.g. https://...)
  label?: string; // Display title, e.g. "Sayfa 5'e Git"
  color?: string; // Hex color for hotspot border or badge
  isHotspot?: boolean; // When true, rendered as transparent clickable hotspot area
}

export interface PlannerTabItem {
  id: string;
  title: string;
  targetPageIndex: number;
  color: string; // e.g. '#f43f5e', '#fb923c', '#10b981', '#06b6d4', '#6366f1', '#a855f7'
}

export type MarginCardColor = 'amber' | 'emerald' | 'sky' | 'rose' | 'purple' | 'slate';

export interface MarginExcerptCard {
  id: string;
  title: string;
  content: string;
  color: MarginCardColor;
  targetPageIndex?: number; // Linked page index for fast jumping
  targetY?: number; // Optional vertical coordinate on the page
  tags?: string[];
  createdAt: number;
}

export type StickyNoteColor = 'yellow' | 'pink' | 'mint' | 'blue' | 'purple';

export interface StickyNoteItem {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: StickyNoteColor;
  text: string;
  isFolded?: boolean;
  rotation?: number;
  pageLink?: number;
  url?: string;
  createdAt: number;
}

export interface Flashcard {
  id: string;
  notebookId: string;
  pageId?: string;
  frontText: string;
  frontImage?: string;
  backText: string;
  backImage?: string;
  difficulty?: 'again' | 'hard' | 'good' | 'easy';
  reviewCount: number;
  lastReviewed?: number;
  createdAt: number;
}

export interface YouTubeBookmark {
  id: string;
  seconds: number;
  title: string;
  pageId: string;
  pageNumber: number;
  timestamp: number;
}

export interface AudioNoteRecording {
  id: string;
  notebookId: string;
  durationMs: number;
  createdAt: number;
  audioDataUrl?: string; // Stored base64 / blob URL
  transcript?: string; // Transcribed speech text
}

export interface Folder {
  id: string;
  name: string;
  color: string;
  parentId?: string | null;
  createdAt: number;
}

export interface Notebook {
  id: string;
  title: string;
  coverColor: string;
  coverStyle?: CoverStyle;
  folderId?: string | null;
  isFavorite?: boolean;
  pages: Page[];
  activePageIndex: number;
  createdAt: number;
  updatedAt: number;
  youtubeUrl?: string;
  youtubeBookmarks?: YouTubeBookmark[];
  audioRecordings?: AudioNoteRecording[];
  flashcards?: Flashcard[];
  pdfOutline?: PdfOutlineItem[];
  canvasMode?: CanvasMode;
  isLocked?: boolean;
  pinCode?: string;
  twoPageSpread?: boolean;
  marginCards?: MarginExcerptCard[];
  plannerTabs?: PlannerTabItem[]; // Customizable digital planner index tabs
}

export interface ExportOptions {
  format: 'pdf' | 'png' | 'jpeg';
  scope: 'current' | 'all';
  scale: 1 | 2 | 3;
  transparentBg: boolean;
  includeTemplate: boolean;
  includeStickyNotes: boolean;
  includeTexts: boolean;
}

export interface LibraryVaultBackup {
  version: number;
  exportedAt: number;
  appName: string;
  notebooks: Notebook[];
}

export type CanvasMode = 'paged' | 'infinite';

export interface PeerUser {
  id: string;
  name: string;
  color: string;
  cursor?: { x: number; y: number };
  lastSeen: number;
}

export interface CollaborationSession {
  isConnected: boolean;
  roomId: string | null;
  isHost: boolean;
  peers: PeerUser[];
  myName: string;
  myColor: string;
}

export interface CollabMessage {
  type:
    | 'JOIN'
    | 'LEAVE'
    | 'CURSOR'
    | 'STROKE_START'
    | 'STROKE_POINTS'
    | 'STROKE_END'
    | 'STROKE_ERASE'
    | 'STATE_SYNC';
  roomId: string;
  senderId: string;
  senderName: string;
  senderColor: string;
  timestamp: number;
  payload?: any;
}

export interface ToolSettings {
  color: string;
  size: number;
  opacity: number;
  streamline?: number; // 0.0 - 0.95 (Stabilizer / smoothing level)
  fillTolerance?: number; // 1 - 100 for paint bucket fill
  eraserMode: EraserMode;
  eraserSize: number;
  eraseHighlighterOnly: boolean;
  autoDeselectEraser: boolean;
  selectedShape: ShapeType;
  autoDetectShape: boolean;
  shapeFillColor?: string;
  shapeFillOpacity?: number; // 0.0 to 1.0 (defaults to 0.25)
  angleSnap?: boolean; // Snap to 0°, 15°, 30°, 45°, 90°
  gridSnap?: boolean; // Magnetic snap to paper grid intersections
  // GoodNotes style quick favorite slots
  favoriteColors: string[];
  favoriteSizes: number[];
  activeColorIndex: number;
  activeSizeIndex: number;
  // Text tool settings
  fontFamily: 'Inter' | 'Caveat' | 'serif' | 'monospace';
  fontSize: number;
  // Laser Pointer & Presentation
  laserStyle?: 'trail' | 'spotlight';
  smartInkInversion?: boolean;
  palmRejection?: boolean; // Reject single finger touches when stylus is active
  tiltShading?: boolean; // Enable broad graphite pencil shading when stylus is tilted
  stylusDoubleTapAction?: StylusDoubleTapAction; // Hardware / touch double tap action on stylus
  scribbleToErase?: boolean; // GoodNotes 6 scribble gesture to erase strokes automatically
  circleToLasso?: boolean; // Hold or complete circle loop with pen to convert to lasso selection
}

export type StylusDoubleTapAction =
  | 'switch-eraser'
  | 'switch-last-tool'
  | 'show-color-palette'
  | 'undo'
  | 'none';

export interface LassoSelection {
  pageId: string;
  strokeIds: string[];
  bounds: StrokeBounds;
  originalStrokes: Stroke[];
  offsetX: number;
  offsetY: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
}

// FAZ AB: STEM 2D Function Plotter & Coordinate Stamping
export interface PlotFunctionItem {
  id: string;
  expression: string;
  color: string;
  lineWidth: number;
  visible: boolean;
  label?: string;
}

export interface PlotGraphSettings {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  gridStep: number;
  showGrid: boolean;
  showAxes: boolean;
  showLabels: boolean;
  showRoots: boolean;
  theme: 'dark' | 'light' | 'blueprint' | 'chalkboard';
}
