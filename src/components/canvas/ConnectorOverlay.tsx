import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Page, PageConnectorItem, ConnectorAnchor, ConnectorStyle, ConnectorArrowType } from '../../types/notebook';
import { useNotebookStore } from '../../store/notebookStore';
import {
  Spline,
  GitCommit,
  Minus,
  ArrowRight,
  ArrowLeftRight,
  Trash2,
  Type,
  Check,
} from 'lucide-react';

interface ConnectorOverlayProps {
  page: Page;
  scale?: number;
}

const CONNECTOR_COLORS = [
  { label: 'Mavi', value: '#3b82f6' },
  { label: 'Mor', value: '#8b5cf6' },
  { label: 'Zümrüt', value: '#10b981' },
  { label: 'Gül', value: '#f43f5e' },
  { label: 'Kehribar', value: '#f59e0b' },
  { label: 'Koyu Gri', value: '#334155' },
];

export const ConnectorOverlay: React.FC<ConnectorOverlayProps> = ({ page, scale = 1.0 }) => {
  const {
    activeTool,
    updateConnectorOnCurrentPage,
    removeConnectorFromCurrentPage,
    addConnectorToCurrentPage,
    activeConnectorDraft,
    setActiveConnectorDraft,
    layerLocks,
  } = useNotebookStore();

  const [selectedConnectorId, setSelectedConnectorId] = useState<string | null>(null);
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [labelText, setLabelText] = useState<string>('');
  const [hoveredAnchor, setHoveredAnchor] = useState<ConnectorAnchor | null>(null);

  const isLocked = !!layerLocks.connectors;
  const isConnectorTool = activeTool === 'connector';

  // Helper to compute element bounding boxes
  const getElementBounds = (elementId: string, elementType?: string) => {
    if (!elementType || elementType === 'sticky') {
      const note = page.stickyNotes?.find((s) => s.id === elementId);
      if (note) {
        return {
          x: note.x,
          y: note.y,
          width: note.width || 200,
          height: note.height || 200,
        };
      }
    }
    if (!elementType || elementType === 'table') {
      const table = page.tables?.find((t) => t.id === elementId);
      if (table) {
        const width = table.colWidths?.reduce((a, b) => a + b, 0) || table.cols * 100;
        const height = (table.rowHeights?.reduce((a, b) => a + b, 0) || table.rows * 40) + 36;
        return {
          x: table.x,
          y: table.y,
          width,
          height,
        };
      }
    }
    if (!elementType || elementType === 'text') {
      const txt = page.texts?.find((tx) => tx.id === elementId);
      if (txt) {
        return {
          x: txt.x,
          y: txt.y,
          width: txt.width || 180,
          height: txt.height || 40,
        };
      }
    }
    return null;
  };

  // Resolve anchor to absolute canvas coordinates
  const resolveAnchor = (anchor: ConnectorAnchor): { x: number; y: number } => {
    if (anchor.elementId) {
      const bounds = getElementBounds(anchor.elementId, anchor.elementType);
      if (bounds) {
        switch (anchor.side) {
          case 'top':
            return { x: bounds.x + bounds.width / 2, y: bounds.y };
          case 'bottom':
            return { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height };
          case 'left':
            return { x: bounds.x, y: bounds.y + bounds.height / 2 };
          case 'right':
            return { x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2 };
          default:
            return { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
        }
      }
    }
    return { x: anchor.x, y: anchor.y };
  };

  // Compute SVG Path string and midpoint
  const computePathData = (
    fromPos: { x: number; y: number },
    toPos: { x: number; y: number },
    style: ConnectorStyle,
    fromSide?: string,
    toSide?: string
  ) => {
    const p1 = fromPos;
    const p2 = toPos;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.hypot(dx, dy);

    if (style === 'straight') {
      return {
        d: `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`,
        midX: (p1.x + p2.x) / 2,
        midY: (p1.y + p2.y) / 2,
      };
    }

    if (style === 'curved') {
      const curvature = Math.max(30, dist * 0.4);
      let cp1x = p1.x;
      let cp1y = p1.y;
      let cp2x = p2.x;
      let cp2y = p2.y;

      if (fromSide === 'top') cp1y -= curvature;
      else if (fromSide === 'bottom') cp1y += curvature;
      else if (fromSide === 'left') cp1x -= curvature;
      else if (fromSide === 'right') cp1x += curvature;
      else cp1x += dx * 0.4;

      if (toSide === 'top') cp2y -= curvature;
      else if (toSide === 'bottom') cp2y += curvature;
      else if (toSide === 'left') cp2x -= curvature;
      else if (toSide === 'right') cp2x += curvature;
      else cp2x -= dx * 0.4;

      // Midpoint on cubic bezier at t = 0.5
      const midX = 0.125 * p1.x + 0.375 * cp1x + 0.375 * cp2x + 0.125 * p2.x;
      const midY = 0.125 * p1.y + 0.375 * cp1y + 0.375 * cp2y + 0.125 * p2.y;

      return {
        d: `M ${p1.x} ${p1.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`,
        midX,
        midY,
      };
    }

    // orthogonal (Right-angle step)
    const isHorizontal = fromSide === 'left' || fromSide === 'right' || (!fromSide && Math.abs(dx) > Math.abs(dy));
    let d: string;
    let midX: number;
    let midY: number;

    if (isHorizontal) {
      const stepX = p1.x + dx / 2;
      d = `M ${p1.x} ${p1.y} L ${stepX} ${p1.y} L ${stepX} ${p2.y} L ${p2.x} ${p2.y}`;
      midX = stepX;
      midY = (p1.y + p2.y) / 2;
    } else {
      const stepY = p1.y + dy / 2;
      d = `M ${p1.x} ${p1.y} L ${p1.x} ${stepY} L ${p2.x} ${stepY} L ${p2.x} ${p2.y}`;
      midX = (p1.x + p2.x) / 2;
      midY = stepY;
    }

    return { d, midX, midY };
  };

  // Find all connectable element magnetic anchors
  const magneticAnchors = useMemo(() => {
    const anchors: ConnectorAnchor[] = [];

    // Sticky Notes
    (page.stickyNotes || []).forEach((note) => {
      const w = note.width || 200;
      const h = note.height || 200;
      anchors.push({ elementId: note.id, elementType: 'sticky', side: 'top', x: note.x + w / 2, y: note.y });
      anchors.push({ elementId: note.id, elementType: 'sticky', side: 'bottom', x: note.x + w / 2, y: note.y + h });
      anchors.push({ elementId: note.id, elementType: 'sticky', side: 'left', x: note.x, y: note.y + h / 2 });
      anchors.push({ elementId: note.id, elementType: 'sticky', side: 'right', x: note.x + w, y: note.y + h / 2 });
    });

    // Tables
    (page.tables || []).forEach((table) => {
      const w = table.colWidths?.reduce((a, b) => a + b, 0) || table.cols * 100;
      const h = (table.rowHeights?.reduce((a, b) => a + b, 0) || table.rows * 40) + 36;
      anchors.push({ elementId: table.id, elementType: 'table', side: 'top', x: table.x + w / 2, y: table.y });
      anchors.push({ elementId: table.id, elementType: 'table', side: 'bottom', x: table.x + w / 2, y: table.y + h });
      anchors.push({ elementId: table.id, elementType: 'table', side: 'left', x: table.x, y: table.y + h / 2 });
      anchors.push({ elementId: table.id, elementType: 'table', side: 'right', x: table.x + w, y: table.y + h / 2 });
    });

    return anchors;
  }, [page.stickyNotes, page.tables]);

  // Handle pointer down on magnetic anchor to start drawing connector
  const handleAnchorPointerDown = (anchor: ConnectorAnchor, e: React.PointerEvent) => {
    if (isLocked) return;
    e.stopPropagation();
    setActiveConnectorDraft({
      from: anchor,
      to: { x: anchor.x, y: anchor.y },
    });
  };

  // Global mouse move & up handler for connector drawing
  useEffect(() => {
    if (!activeConnectorDraft) return;

    const handlePointerMove = (e: PointerEvent) => {
      // Find canvas container
      const container = document.getElementById(`canvas-page-container-${page.id || 'default'}`);
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const currentX = (e.clientX - rect.left) / scale;
      const currentY = (e.clientY - rect.top) / scale;

      // Check magnetic snap to closest anchor
      let snapAnchor: ConnectorAnchor | null = null;
      let minDistance = 28; // magnetic snap radius in pixels

      for (const anc of magneticAnchors) {
        if (anc.elementId === activeConnectorDraft.from.elementId) continue; // Don't snap to same source element
        const d = Math.hypot(anc.x - currentX, anc.y - currentY);
        if (d < minDistance) {
          minDistance = d;
          snapAnchor = anc;
        }
      }

      setHoveredAnchor(snapAnchor);

      setActiveConnectorDraft({
        from: activeConnectorDraft.from,
        to: snapAnchor ? { x: snapAnchor.x, y: snapAnchor.y } : { x: currentX, y: currentY },
      });
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (activeConnectorDraft) {
        const p1 = resolveAnchor(activeConnectorDraft.from);
        const p2 = activeConnectorDraft.to;
        const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);

        // Minimum distance to prevent accidental tiny connector lines
        if (dist > 15) {
          let targetAnchor: ConnectorAnchor = {
            elementType: 'free',
            x: p2.x,
            y: p2.y,
          };

          if (hoveredAnchor) {
            targetAnchor = { ...hoveredAnchor };
          }

          const newConnector: PageConnectorItem = {
            id: `conn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            from: activeConnectorDraft.from,
            to: targetAnchor,
            style: 'curved',
            arrowType: 'end',
            color: '#3b82f6',
            width: 2.5,
            dashed: false,
            createdAt: Date.now(),
          };

          addConnectorToCurrentPage(newConnector);
          setSelectedConnectorId(newConnector.id);
        }
      }
      setActiveConnectorDraft(null);
      setHoveredAnchor(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [activeConnectorDraft, hoveredAnchor, magneticAnchors, page.id, scale]);

  const selectedConnector = useMemo(() => {
    return page.connectors?.find((c) => c.id === selectedConnectorId) || null;
  }, [page.connectors, selectedConnectorId]);

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        width: page.width * scale,
        height: page.height * scale,
        zIndex: 15,
      }}
    >
      <svg
        className="w-full h-full pointer-events-none overflow-visible"
        viewBox={`0 0 ${page.width} ${page.height}`}
      >
        <defs>
          {/* Arrowhead markers dynamically generated for each connector */}
          {page.connectors?.map((conn) => (
            <React.Fragment key={`markers_${conn.id}`}>
              <marker
                id={`arrow-end-${conn.id}`}
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill={conn.color} />
              </marker>
              <marker
                id={`arrow-start-${conn.id}`}
                viewBox="0 0 10 10"
                refX="2"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto"
              >
                <path d="M 10 1.5 L 0 5 L 10 8.5 z" fill={conn.color} />
              </marker>
            </React.Fragment>
          ))}

          {/* Draft arrow marker */}
          <marker
            id="arrow-draft"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#3b82f6" />
          </marker>
        </defs>

        {/* Existing Connectors */}
        {page.connectors?.map((conn) => {
          const p1 = resolveAnchor(conn.from);
          const p2 = resolveAnchor(conn.to);
          const { d, midX, midY } = computePathData(p1, p2, conn.style, conn.from.side, conn.to.side);
          const isSelected = selectedConnectorId === conn.id;

          const markerEnd =
            conn.arrowType === 'end' || conn.arrowType === 'both' ? `url(#arrow-end-${conn.id})` : undefined;
          const markerStart =
            conn.arrowType === 'both' ? `url(#arrow-start-${conn.id})` : undefined;

          return (
            <g key={conn.id} className="cursor-pointer group pointer-events-auto">
              {/* Invisible wide stroke for easy clicking & hover */}
              <path
                d={d}
                fill="none"
                stroke="transparent"
                strokeWidth={Math.max(16, conn.width * 5)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedConnectorId(conn.id);
                }}
              />

              {/* Selection halo glow */}
              {isSelected && (
                <path
                  d={d}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth={conn.width + 8}
                  strokeOpacity="0.25"
                  strokeLinecap="round"
                />
              )}

              {/* Main Visible Connector Line */}
              <path
                d={d}
                fill="none"
                stroke={conn.color}
                strokeWidth={conn.width}
                strokeDasharray={conn.dashed ? '6 4' : undefined}
                strokeLinecap="round"
                markerEnd={markerEnd}
                markerStart={markerStart}
                className="transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedConnectorId(conn.id);
                }}
              />

              {/* Terminal Anchor Dots */}
              {isSelected && (
                <>
                  <circle cx={p1.x} cy={p1.y} r={4.5} fill="#ffffff" stroke={conn.color} strokeWidth={2} />
                  <circle cx={p2.x} cy={p2.y} r={4.5} fill="#ffffff" stroke={conn.color} strokeWidth={2} />
                </>
              )}
            </g>
          );
        })}

        {/* Live Draft Connector Preview */}
        {activeConnectorDraft && (
          <g>
            {(() => {
              const p1 = resolveAnchor(activeConnectorDraft.from);
              const p2 = activeConnectorDraft.to;
              const { d } = computePathData(p1, p2, 'curved', activeConnectorDraft.from.side, hoveredAnchor?.side);
              return (
                <path
                  d={d}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  strokeDasharray="5 4"
                  markerEnd="url(#arrow-draft)"
                  className="animate-pulse"
                />
              );
            })()}
          </g>
        )}
      </svg>

      {/* Center Labels for Connectors */}
      {page.connectors?.map((conn) => {
        const p1 = resolveAnchor(conn.from);
        const p2 = resolveAnchor(conn.to);
        const { midX, midY } = computePathData(p1, p2, conn.style, conn.from.side, conn.to.side);
        const hasLabel = Boolean(conn.label && conn.label.trim().length > 0);
        const isEditing = editingLabelId === conn.id;

        if (!hasLabel && !isEditing) return null;

        return (
          <div
            key={`label_${conn.id}`}
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
            style={{
              left: midX * scale,
              top: midY * scale,
            }}
          >
            {isEditing ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateConnectorOnCurrentPage(conn.id, { label: labelText.trim() });
                  setEditingLabelId(null);
                }}
                className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-blue-500 rounded-full px-2.5 py-0.5 shadow-lg shadow-blue-500/10 text-xs"
              >
                <input
                  type="text"
                  autoFocus
                  value={labelText}
                  onChange={(e) => setLabelText(e.target.value)}
                  placeholder="Metin ekle..."
                  className="bg-transparent border-none outline-none text-xs text-slate-800 dark:text-slate-100 w-24 text-center font-medium"
                />
                <button
                  type="submit"
                  className="p-0.5 text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  <Check size={12} />
                </button>
              </form>
            ) : (
              <div
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setEditingLabelId(conn.id);
                  setLabelText(conn.label || '');
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedConnectorId(conn.id);
                }}
                className="px-2 py-0.5 rounded-full bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 shadow-sm text-[11px] font-semibold text-slate-700 dark:text-slate-200 cursor-pointer select-none backdrop-blur-xs hover:border-blue-400"
              >
                {conn.label}
              </div>
            )}
          </div>
        );
      })}

      {/* Magnetic Snapping Anchors on Elements (Visible when Connector tool active or hovered) */}
      {(isConnectorTool || activeConnectorDraft) &&
        magneticAnchors.map((anc, idx) => {
          const isHovered =
            hoveredAnchor?.elementId === anc.elementId && hoveredAnchor?.side === anc.side;
          return (
            <div
              key={`anchor_${anc.elementId}_${anc.side}_${idx}`}
              onPointerDown={(e) => handleAnchorPointerDown(anc, e)}
              className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full cursor-crosshair pointer-events-auto transition-transform ${
                isHovered
                  ? 'w-4 h-4 bg-blue-500 scale-125 border-2 border-white shadow-md'
                  : 'w-2.5 h-2.5 bg-blue-400/80 hover:bg-blue-600 hover:scale-125 border border-white'
              }`}
              style={{
                left: anc.x * scale,
                top: anc.y * scale,
              }}
              title="Bağlantı Başlat"
            />
          );
        })}

      {/* Selected Connector Floating Quick Toolbar */}
      {selectedConnector && !isLocked && (
        (() => {
          const p1 = resolveAnchor(selectedConnector.from);
          const p2 = resolveAnchor(selectedConnector.to);
          const { midX, midY } = computePathData(
            p1,
            p2,
            selectedConnector.style,
            selectedConnector.from.side,
            selectedConnector.to.side
          );

          return (
            <div
              className="absolute -translate-x-1/2 -translate-y-full mb-3 pointer-events-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl px-2 py-1.5 flex items-center gap-1.5 z-30 animate-in fade-in zoom-in-95 duration-150"
              style={{
                left: midX * scale,
                top: Math.max(30, midY * scale - 12),
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Routing Style Buttons */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                <button
                  type="button"
                  onClick={() =>
                    updateConnectorOnCurrentPage(selectedConnector.id, { style: 'straight' })
                  }
                  className={`p-1 rounded-md text-xs transition-colors ${
                    selectedConnector.style === 'straight'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  title="Düz Çizgi"
                >
                  <Minus size={14} />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateConnectorOnCurrentPage(selectedConnector.id, { style: 'curved' })
                  }
                  className={`p-1 rounded-md text-xs transition-colors ${
                    selectedConnector.style === 'curved'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  title="Kıvrımlı (Bezier)"
                >
                  <Spline size={14} />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateConnectorOnCurrentPage(selectedConnector.id, { style: 'orthogonal' })
                  }
                  className={`p-1 rounded-md text-xs transition-colors ${
                    selectedConnector.style === 'orthogonal'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  title="Basamaklı (Dik Açı)"
                >
                  <GitCommit size={14} />
                </button>
              </div>

              {/* Arrow Type Buttons */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                <button
                  type="button"
                  onClick={() =>
                    updateConnectorOnCurrentPage(selectedConnector.id, { arrowType: 'end' })
                  }
                  className={`p-1 rounded-md text-xs transition-colors ${
                    selectedConnector.arrowType === 'end'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  title="Tek Yönlü Ok"
                >
                  <ArrowRight size={14} />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateConnectorOnCurrentPage(selectedConnector.id, { arrowType: 'both' })
                  }
                  className={`p-1 rounded-md text-xs transition-colors ${
                    selectedConnector.arrowType === 'both'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  title="Çift Yönlü Ok"
                >
                  <ArrowLeftRight size={14} />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateConnectorOnCurrentPage(selectedConnector.id, { arrowType: 'none' })
                  }
                  className={`p-1 rounded-md text-xs transition-colors ${
                    selectedConnector.arrowType === 'none'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  title="Oksuz Çizgi"
                >
                  <Minus size={14} />
                </button>
              </div>

              {/* Dashed toggle */}
              <button
                type="button"
                onClick={() =>
                  updateConnectorOnCurrentPage(selectedConnector.id, {
                    dashed: !selectedConnector.dashed,
                  })
                }
                className={`px-1.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                  selectedConnector.dashed
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                Kesikli
              </button>

              {/* Color dots */}
              <div className="flex items-center gap-1 pl-1">
                {CONNECTOR_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() =>
                      updateConnectorOnCurrentPage(selectedConnector.id, { color: c.value })
                    }
                    className={`w-4 h-4 rounded-full transition-transform ${
                      selectedConnector.color === c.value ? 'scale-125 ring-2 ring-blue-400' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                  />
                ))}
              </div>

              {/* Add/Edit Label Button */}
              <button
                type="button"
                onClick={() => {
                  setEditingLabelId(selectedConnector.id);
                  setLabelText(selectedConnector.label || '');
                }}
                className="p-1 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-md transition-colors"
                title="Metin Etiketi Ekle"
              >
                <Type size={15} />
              </button>

              {/* Delete Button */}
              <button
                type="button"
                onClick={() => {
                  removeConnectorFromCurrentPage(selectedConnector.id);
                  setSelectedConnectorId(null);
                }}
                className="p-1 text-red-500 hover:text-red-700 dark:hover:text-red-400 rounded-md transition-colors"
                title="Bağlantıyı Sil"
              >
                <Trash2 size={15} />
              </button>
            </div>
          );
        })()
      )}
    </div>
  );
};
