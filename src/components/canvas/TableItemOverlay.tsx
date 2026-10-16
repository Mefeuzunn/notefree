import React, { useState, useRef, useEffect } from 'react';
import { PageTableItem, TableCell } from '../../types/notebook';
import { useNotebookStore } from '../../store/notebookStore';
import {
  GripHorizontal,
  Plus,
  Trash2,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Heading,
  Check,
  Columns,
  Rows,
} from 'lucide-react';

interface TableItemOverlayProps {
  table: PageTableItem;
  scale?: number;
}

const CELL_BG_PALETTE = [
  { name: 'Şeffaf', color: '' },
  { name: 'Sarı', color: '#fef9c3' },
  { name: 'Nane', color: '#dcfce7' },
  { name: 'Mavi', color: '#e0f2fe' },
  { name: 'Gül', color: '#fce7f3' },
  { name: 'Lavanta', color: '#f3e8ff' },
  { name: 'Gri', color: '#f1f5f9' },
];

export const TableItemOverlay: React.FC<TableItemOverlayProps> = ({ table, scale = 1.0 }) => {
  const {
    updateTableOnCurrentPage,
    updateTableCell,
    addRowToTable,
    deleteRowFromTable,
    addColToTable,
    deleteColFromTable,
    deleteTableFromCurrentPage,
  } = useNotebookStore();

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [activeCell, setActiveCell] = useState<{ row: number; col: number } | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef<{ clientX: number; clientY: number; startX: number; startY: number }>({
    clientX: 0,
    clientY: 0,
    startX: table.x,
    startY: table.y,
  });

  const resizeStartRef = useRef<{ clientX: number; clientY: number; startW: number; startH: number }>({
    clientX: 0,
    clientY: 0,
    startW: table.width,
    startH: table.height,
  });

  // Calculate cell widths and heights
  const colWidth = table.width / table.cols;
  const rowHeight = Math.max(34, table.height / table.rows);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsSelected(false);
        setActiveCell(null);
        setShowColorPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Dragging
  const handleDragPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    setIsSelected(true);
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startX: table.x,
      startY: table.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleDragPointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = (e.clientX - dragStartRef.current.clientX) / scale;
    const dy = (e.clientY - dragStartRef.current.clientY) / scale;
    const newX = Math.max(0, Math.round(dragStartRef.current.startX + dx));
    const newY = Math.max(0, Math.round(dragStartRef.current.startY + dy));
    updateTableOnCurrentPage(table.id, { x: newX, y: newY });
  };

  const handleDragPointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  // Handle Resizing
  const handleResizePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setIsSelected(true);
    resizeStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startW: table.width,
      startH: table.height,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleResizePointerMove = (e: React.PointerEvent) => {
    if (!isResizing) return;
    const dx = (e.clientX - resizeStartRef.current.clientX) / scale;
    const dy = (e.clientY - resizeStartRef.current.clientY) / scale;
    const minW = table.cols * 65;
    const minH = table.rows * 30;
    const newW = Math.max(minW, Math.round(resizeStartRef.current.startW + dx));
    const newH = Math.max(minH, Math.round(resizeStartRef.current.startH + dy));
    updateTableOnCurrentPage(table.id, { width: newW, height: newH });
  };

  const handleResizePointerUp = (e: React.PointerEvent) => {
    if (isResizing) {
      setIsResizing(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  // Cell Keyboard Navigation
  const handleCellKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    r: number,
    c: number
  ) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        // Shift + Tab: Move to previous cell
        if (c > 0) {
          focusCell(r, c - 1);
        } else if (r > 0) {
          focusCell(r - 1, table.cols - 1);
        }
      } else {
        // Tab: Move to next cell
        if (c < table.cols - 1) {
          focusCell(r, c + 1);
        } else if (r < table.rows - 1) {
          focusCell(r + 1, 0);
        } else {
          // Last cell: Auto-add a new row!
          addRowToTable(table.id);
          setTimeout(() => focusCell(r + 1, 0), 40);
        }
      }
    } else if (e.key === 'ArrowUp' && r > 0 && e.currentTarget.selectionStart === 0) {
      e.preventDefault();
      focusCell(r - 1, c);
    } else if (
      e.key === 'ArrowDown' &&
      r < table.rows - 1 &&
      e.currentTarget.selectionStart === e.currentTarget.value.length
    ) {
      e.preventDefault();
      focusCell(r + 1, c);
    }
  };

  const focusCell = (r: number, c: number) => {
    setActiveCell({ row: r, col: c });
    const input = document.getElementById(`tbl_cell_${table.id}_${r}_${c}`) as HTMLTextAreaElement | null;
    if (input) {
      input.focus();
    }
  };

  // Styling Actions for Active Cell
  const handleApplyColor = (color: string) => {
    if (!activeCell) return;
    updateTableCell(table.id, activeCell.row, activeCell.col, { bgColor: color });
    setShowColorPicker(false);
  };

  const handleToggleBold = () => {
    if (!activeCell) return;
    const currentCell = table.cells[activeCell.row]?.[activeCell.col];
    const isBold = currentCell?.bold ?? (activeCell.row === 0 && table.hasHeaderRow);
    updateTableCell(table.id, activeCell.row, activeCell.col, { bold: !isBold });
  };

  const handleSetAlign = (align: 'left' | 'center' | 'right') => {
    if (!activeCell) return;
    updateTableCell(table.id, activeCell.row, activeCell.col, { align });
  };

  return (
    <div
      ref={containerRef}
      onClick={() => setIsSelected(true)}
      style={{
        position: 'absolute',
        left: `${table.x * scale}px`,
        top: `${table.y * scale}px`,
        width: `${table.width * scale}px`,
        zIndex: isSelected ? 40 : 25,
      }}
      className={`group select-none transition-shadow ${
        isSelected ? 'ring-2 ring-indigo-500/80 shadow-2xl rounded-xl' : 'hover:ring-1 hover:ring-slate-500/50'
      }`}
    >
      {/* 1. Header Drag & Action Bar */}
      <div
        onPointerDown={handleDragPointerDown}
        onPointerMove={handleDragPointerMove}
        onPointerUp={handleDragPointerUp}
        className={`flex items-center justify-between px-2.5 py-1.5 rounded-t-xl bg-slate-900/95 backdrop-blur-md border border-b-0 border-slate-700/80 cursor-grab active:cursor-grabbing text-slate-200 transition-opacity ${
          isSelected ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'
        }`}
        style={{ fontSize: `${Math.max(10, 11 * scale)}px` }}
      >
        <div className="flex items-center gap-1.5">
          <GripHorizontal size={14} className="text-slate-400 shrink-0" />
          <span className="font-semibold text-indigo-400">
            {table.rows} × {table.cols} Tablo
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          {/* Header Row Toggle */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              updateTableOnCurrentPage(table.id, { hasHeaderRow: !table.hasHeaderRow });
            }}
            className={`p-1 rounded-md text-[10px] font-medium flex items-center gap-1 transition-colors ${
              table.hasHeaderRow
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Başlık Satırını Aç/Kapat"
          >
            <Heading size={12} />
            <span className="hidden sm:inline">Başlık</span>
          </button>

          {/* Cell Formatting Menu (when active cell is selected) */}
          {activeCell && (
            <div className="flex items-center gap-0.5 border-l border-slate-700 pl-1 ml-0.5">
              {/* Bold */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleBold();
                }}
                className={`p-1 rounded hover:bg-slate-800 transition-colors ${
                  table.cells[activeCell.row]?.[activeCell.col]?.bold ? 'text-indigo-400 bg-slate-800' : 'text-slate-400'
                }`}
                title="Kalın Yazı"
              >
                <Bold size={12} />
              </button>

              {/* Alignments */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSetAlign('left');
                }}
                className={`p-1 rounded hover:bg-slate-800 transition-colors ${
                  table.cells[activeCell.row]?.[activeCell.col]?.align === 'left' ? 'text-indigo-400' : 'text-slate-400'
                }`}
                title="Sola Hizala"
              >
                <AlignLeft size={12} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSetAlign('center');
                }}
                className={`p-1 rounded hover:bg-slate-800 transition-colors ${
                  table.cells[activeCell.row]?.[activeCell.col]?.align === 'center' ? 'text-indigo-400' : 'text-slate-400'
                }`}
                title="Ortala"
              >
                <AlignCenter size={12} />
              </button>

              {/* Color Palette Toggle */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowColorPicker(!showColorPicker);
                  }}
                  className="p-1 rounded text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                  title="Hücre Rengi"
                >
                  <Palette size={12} />
                </button>

                {showColorPicker && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-full right-0 mt-1 p-2 bg-slate-900 border border-slate-700 rounded-xl shadow-xl flex items-center gap-1.5 z-50 animate-in fade-in zoom-in-95"
                  >
                    {CELL_BG_PALETTE.map((item) => (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => handleApplyColor(item.color)}
                        className={`w-5 h-5 rounded-full border transition-transform hover:scale-110 flex items-center justify-center ${
                          table.cells[activeCell.row]?.[activeCell.col]?.bgColor === item.color
                            ? 'ring-2 ring-indigo-400'
                            : 'border-slate-600'
                        }`}
                        style={{ backgroundColor: item.color || '#334155' }}
                        title={item.name}
                      >
                        {table.cells[activeCell.row]?.[activeCell.col]?.bgColor === item.color && (
                          <Check size={10} className="text-slate-900" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Delete Table Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              deleteTableFromCurrentPage(table.id);
            }}
            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors ml-0.5"
            title="Tabloyu Sil"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* 2. Table Matrix Grid Body */}
      <div
        className="relative bg-white/95 rounded-b-xl border border-slate-400/80 shadow-md overflow-hidden"
        style={{
          width: `${table.width * scale}px`,
          minHeight: `${table.height * scale}px`,
        }}
      >
        <table
          className="w-full h-full border-collapse"
          style={{
            tableLayout: 'fixed',
          }}
        >
          <tbody>
            {table.cells.map((rowCells, rIdx) => {
              const isHeaderRow = rIdx === 0 && table.hasHeaderRow;
              return (
                <tr key={`row_${rIdx}`} className="group/row relative">
                  {rowCells.map((cell, cIdx) => {
                    const isCellActive = activeCell?.row === rIdx && activeCell?.col === cIdx;
                    const cellBg =
                      cell.bgColor ||
                      (isHeaderRow
                        ? table.headerBgColor || '#f1f5f9'
                        : rIdx % 2 === 1
                        ? '#fafafa'
                        : '#ffffff');

                    return (
                      <td
                        key={cell.id || `cell_${rIdx}_${cIdx}`}
                        onClick={() => setActiveCell({ row: rIdx, col: cIdx })}
                        style={{
                          backgroundColor: cellBg,
                          width: `${colWidth * scale}px`,
                          height: `${rowHeight * scale}px`,
                          borderWidth: '1px',
                          borderColor: table.borderColor || '#cbd5e1',
                          padding: '2px',
                          verticalAlign: 'middle',
                        }}
                        className={`relative transition-colors ${
                          isCellActive ? 'ring-2 ring-indigo-500 z-10' : ''
                        }`}
                      >
                        <textarea
                          id={`tbl_cell_${table.id}_${rIdx}_${cIdx}`}
                          value={cell.text}
                          onChange={(e) =>
                            updateTableCell(table.id, rIdx, cIdx, { text: e.target.value })
                          }
                          onKeyDown={(e) => handleCellKeyDown(e, rIdx, cIdx)}
                          onFocus={() => setActiveCell({ row: rIdx, col: cIdx })}
                          placeholder={isHeaderRow ? `Başlık ${cIdx + 1}` : ''}
                          className="w-full h-full resize-none bg-transparent border-0 outline-none text-slate-800 leading-snug px-1.5 py-1 text-xs"
                          style={{
                            textAlign: cell.align || (isHeaderRow ? 'center' : 'left'),
                            fontWeight: cell.bold || isHeaderRow ? 600 : 400,
                            fontSize: `${Math.max(10, 12 * scale)}px`,
                            color: isHeaderRow ? '#0f172a' : '#1e293b',
                          }}
                        />

                        {/* Column Delete Button on top of first row cell when selected */}
                        {isSelected && rIdx === 0 && table.cols > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteColFromTable(table.id, cIdx);
                            }}
                            className="absolute -top-3.5 left-1/2 -translate-x-1/2 opacity-0 hover:opacity-100 group-hover:opacity-60 bg-rose-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] shadow-sm transition-opacity"
                            title="Sütunu Sil"
                          >
                            ×
                          </button>
                        )}
                      </td>
                    );
                  })}

                  {/* Row Delete Button on left edge when selected */}
                  {isSelected && table.rows > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteRowFromTable(table.id, rIdx);
                      }}
                      className="absolute -left-3.5 top-1/2 -translate-y-1/2 opacity-0 hover:opacity-100 group-hover:opacity-60 bg-rose-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] shadow-sm transition-opacity z-20"
                      title="Satırı Sil"
                    >
                      ×
                    </button>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 3. Quick Column Add Button (+ Right) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          addColToTable(table.id);
        }}
        className="absolute top-1/2 -right-4 -translate-y-1/2 w-6 h-6 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg flex items-center justify-center text-xs opacity-70 hover:opacity-100 transition-all hover:scale-110 z-30"
        title="Yeni Sütun Ekle"
      >
        <Plus size={13} />
      </button>

      {/* 4. Quick Row Add Button (+ Bottom) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          addRowToTable(table.id);
        }}
        className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg flex items-center gap-1 text-[10px] font-medium opacity-70 hover:opacity-100 transition-all hover:scale-105 z-30"
        title="Yeni Satır Ekle"
      >
        <Plus size={11} />
        <span>Satır Ekle</span>
      </button>

      {/* 5. Bottom Right Resize Handle */}
      {isSelected && (
        <div
          onPointerDown={handleResizePointerDown}
          onPointerMove={handleResizePointerMove}
          onPointerUp={handleResizePointerUp}
          className="absolute -bottom-1 -right-1 w-4 h-4 bg-indigo-500 hover:bg-indigo-400 rounded-br-lg cursor-nwse-resize shadow-md flex items-center justify-center text-white z-40"
          title="Boyutlandır"
        >
          <div className="w-1.5 h-1.5 border-r border-b border-white" />
        </div>
      )}
    </div>
  );
};
