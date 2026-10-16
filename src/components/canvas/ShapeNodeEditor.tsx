import React, { useCallback, useEffect, useRef } from 'react';
import { Ban, Trash2, X, Link2 } from 'lucide-react';
import { ShapeControlNode } from '../../types/notebook';

interface ShapeNodeEditorProps {
  /** Editable control nodes for the selected shape stroke */
  nodes: ShapeControlNode[];
  /** Canvas-to-screen scale factor */
  scale: number;
  /** Called whenever a node is dragged to a new position */
  onNodesChange: (nodes: ShapeControlNode[]) => void;
  /** Called with the active dragged node and new position for synchronized shape updates */
  onNodeDrag?: (nodeId: string, newPos: { x: number; y: number }) => void;
  /** Called when the editor should be dismissed */
  onClose: () => void;
  /** Optional callback to delete the shape stroke */
  onDelete?: () => void;
  /** Optional callback to add/edit page or web link on shape */
  onLink?: () => void;
  /** FAZ L: Whether this shape has a closed interior that can have fill */
  isClosedShape?: boolean;
  /** Current fill color of the shape */
  fillColor?: string;
  /** Current fill opacity of the shape */
  fillOpacity?: number;
  /** Callback to change fill color and opacity */
  onFillChange?: (color: string | undefined, opacity?: number) => void;
}

const QUICK_FILL_COLORS = [
  { name: 'Sarı', color: '#fef08a' },
  { name: 'Yeşil', color: '#bbf7d0' },
  { name: 'Mavi', color: '#bae6fd' },
  { name: 'Lavanta', color: '#ddd6fe' },
  { name: 'Turuncu', color: '#fed7aa' },
  { name: 'Gül', color: '#fbcfe8' },
];

/** Visual style per node role */
const ROLE_COLORS: Record<string, string> = {
  corner:    'border-indigo-400 bg-white',
  edge:      'border-slate-400 bg-slate-200',
  center:    'border-amber-400 bg-amber-100',
  endpoint:  'border-emerald-400 bg-emerald-100',
  'rx-handle': 'border-rose-400 bg-rose-100',
  'ry-handle': 'border-rose-400 bg-rose-100',
  apex:      'border-purple-400 bg-purple-100',
  // named corners for rectangle
  tl: 'border-indigo-400 bg-white',
  tr: 'border-indigo-400 bg-white',
  bl: 'border-indigo-400 bg-white',
  br: 'border-indigo-400 bg-white',
  // line / arrow endpoints
  start: 'border-emerald-400 bg-emerald-100',
  end:   'border-rose-400 bg-rose-100',
};

const NODE_SIZE = 12; // px diameter

/**
 * FAZ I & FAZ L – Akıllı Geometrik Şekil Köşe Tutamaçları & Dolgu Düzenleyici
 * Renders draggable handle dots on shape control nodes and allows changing
 * shape geometry as well as interior fill color/opacity.
 */
export const ShapeNodeEditor: React.FC<ShapeNodeEditorProps> = ({
  nodes,
  scale,
  onNodesChange,
  onNodeDrag,
  onClose,
  onDelete,
  onLink,
  isClosedShape,
  fillColor,
  fillOpacity = 0.25,
  onFillChange,
}) => {
  const draggingRef = useRef<{
    nodeId: string;
    startClientX: number;
    startClientY: number;
    startNodeX: number;
    startNodeY: number;
  } | null>(null);

  /** Convert canvas coordinates → screen pixels (for positioning handles) */
  const toScreen = (v: number) => v * scale;

  // Listen for Escape key to close editor
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, node: ShapeControlNode) => {
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      draggingRef.current = {
        nodeId: node.id,
        startClientX: e.clientX,
        startClientY: e.clientY,
        startNodeX: node.x,
        startNodeY: node.y,
      };
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current) return;
      e.stopPropagation();

      const dx = (e.clientX - draggingRef.current.startClientX) / scale;
      const dy = (e.clientY - draggingRef.current.startClientY) / scale;

      const newX = draggingRef.current.startNodeX + dx;
      const newY = draggingRef.current.startNodeY + dy;

      if (onNodeDrag) {
        onNodeDrag(draggingRef.current.nodeId, { x: newX, y: newY });
      } else {
        const updatedNodes = nodes.map((n) =>
          n.id === draggingRef.current!.nodeId ? { ...n, x: newX, y: newY } : n
        );
        onNodesChange(updatedNodes);
      }
    },
    [nodes, onNodesChange, onNodeDrag, scale]
  );

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    draggingRef.current = null;
  }, []);

  // Compute bounding box for floating toolbar placement
  const minX = Math.min(...nodes.map((n) => n.x));
  const minY = Math.min(...nodes.map((n) => n.y));
  const toolbarTop = Math.max(10, toScreen(minY) - 44);
  const toolbarLeft = Math.max(10, toScreen(minX));

  return (
    <>
      {/* Invisible full-screen overlay to catch outside clicks (dismiss editor) */}
      <div
        className="absolute inset-0 z-40 bg-black/5"
        style={{ cursor: 'default' }}
        onPointerDown={onClose}
      />

      {/* Floating Action Pill above shape */}
      <div
        className="absolute z-50 flex items-center gap-2 px-3 py-1.5 bg-slate-900/95 text-white text-xs rounded-xl shadow-xl border border-slate-700/80 backdrop-blur pointer-events-auto select-none"
        style={{
          left: toolbarLeft,
          top: toolbarTop,
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <span className="font-semibold text-amber-400">📐 Şekil</span>

        {/* FAZ L: Quick Fill Palette on Selected Shape */}
        {isClosedShape && onFillChange && (
          <div className="flex items-center gap-1 pl-2 border-l border-slate-700/80">
            <button
              type="button"
              onClick={() => onFillChange(undefined, fillOpacity)}
              className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                !fillColor
                  ? 'border-rose-400 bg-rose-500/20 text-rose-300 ring-1 ring-rose-400'
                  : 'border-slate-700 bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Dolgusuz (Şeffaf)"
            >
              <Ban size={10} />
            </button>
            {QUICK_FILL_COLORS.map(({ name, color }) => (
              <button
                key={color}
                type="button"
                onClick={() => onFillChange(color, fillOpacity || 0.25)}
                className={`w-4 h-4 rounded border transition-transform hover:scale-110 ${
                  fillColor === color
                    ? 'border-white scale-110 ring-1 ring-indigo-400'
                    : 'border-slate-700/80'
                }`}
                style={{ backgroundColor: color }}
                title={`${name} Dolgu`}
              />
            ))}
            {fillColor && (
              <button
                type="button"
                onClick={() => {
                  const nextOp = fillOpacity >= 0.9 ? 0.25 : Math.round((fillOpacity + 0.25) * 100) / 100;
                  onFillChange(fillColor, nextOp);
                }}
                className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 ml-0.5"
                title="Dolguyu opaklaştır / şeffaflaştır"
              >
                %{Math.round(fillOpacity * 100)}
              </button>
            )}
          </div>
        )}

        <div className="flex items-center gap-1 pl-1 border-l border-slate-700/80">
          {onLink && (
            <button
              type="button"
              onClick={onLink}
              className="p-1 hover:text-indigo-400 text-slate-400 transition rounded hover:bg-slate-800"
              title="Şekle Sayfa/Web Bağlantısı Ekle"
            >
              <Link2 size={13} />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="p-1 hover:text-red-400 text-slate-400 transition rounded hover:bg-slate-800"
              title="Şekli Sil"
            >
              <Trash2 size={13} />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center gap-1 font-medium transition"
            title="Kapat (ESC)"
          >
            <X size={11} />
            <span>Bitti</span>
          </button>
        </div>
      </div>

      {/* Draggable node handles */}
      {nodes.map((node) => {
        const colorClass = ROLE_COLORS[node.role] ?? ROLE_COLORS['corner'];
        const screenX = toScreen(node.x) - NODE_SIZE / 2;
        const screenY = toScreen(node.y) - NODE_SIZE / 2;

        return (
          <div
            key={node.id}
            className={`absolute z-50 rounded-full border-2 shadow-md ${colorClass} select-none transition-transform hover:scale-125`}
            style={{
              left: screenX,
              top: screenY,
              width: NODE_SIZE,
              height: NODE_SIZE,
              cursor: draggingRef.current?.nodeId === node.id
                ? 'grabbing'
                : 'grab',
              touchAction: 'none',
            }}
            onPointerDown={(e) => handlePointerDown(e, node)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            title={`${node.role || node.id} tutamacı`}
          />
        );
      })}
    </>
  );
};

