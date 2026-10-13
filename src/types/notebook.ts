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
  | 'audio-scrub';

export type EraserMode = 'stroke' | 'pixel';

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
  | 'planner-habit';

export type PaperColor = 'white' | 'cream' | 'yellow-pad' | 'dark' | 'kraft';

export type CoverStyle = 'classic' | 'leather' | 'pastel' | 'spiral' | 'modern';

export interface StrokePoint {
  x: number;
  y: number;
  pressure: number;
  timestamp?: number;
}

export interface StrokeBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
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
  backgroundImageUrl?: string; // Rendered PDF or Word page
  width: number;
  height: number;
  title?: string;
  isBookmarked?: boolean;
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
}

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
