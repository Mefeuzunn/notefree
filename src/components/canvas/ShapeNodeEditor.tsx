import React, { useCallback, useEffect, useRef } from 'react';
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
}

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
 * FAZ I – Akıllı Geometrik Şekil Köşe Tutamaçları
 * Renders draggable handle dots on shape control nodes so the user
 * can morph a shape after it has been drawn.
 */
export const ShapeNodeEditor: React.FC<ShapeNodeEditorProps> = ({
  nodes,
  scale,
  onNodesChange,
  onNodeDrag,
  onClose,
  onDelete,
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
  const toolbarTop = Math.max(10, toScreen(minY) - 38);
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
        className="absolute z-50 flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/90 text-white text-xs rounded-full shadow-lg border border-slate-700/60 backdrop-blur pointer-events-auto select-none"
        style={{
          left: toolbarLeft,
          top: toolbarTop,
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <span className="font-medium text-amber-400">📐 Şekil Düzenle</span>
        <span className="text-slate-400 text-[10px] hidden sm:inline">• Tutamaçları sürükle</span>
        {onDelete && (
          <button
            onClick={onDelete}
            className="ml-1 p-0.5 hover:text-red-400 text-slate-400 transition"
            title="Şekli Sil"
          >
            Sil
          </button>
        )}
        <button
          onClick={onClose}
          className="ml-1 px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
          title="Kapat (ESC)"
        >
          Tamam
        </button>
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

