import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PageSticker } from '../../types/notebook';
import { useNotebookStore } from '../../store/notebookStore';
import { triggerHaptic } from '../../engine/hapticFeedback';
import {
  RotateCw,
  FlipHorizontal,
  Copy,
  Trash2,
  Check,
  Move,
  Sparkles,
} from 'lucide-react';

interface StickerItemOverlayProps {
  sticker: PageSticker;
  scale: number;
  isSelected?: boolean;
  onSelect?: () => void;
}

export const StickerItemOverlay: React.FC<StickerItemOverlayProps> = ({
  sticker,
  scale,
  isSelected: externalSelected,
  onSelect: externalSelect,
}) => {
  const {
    updateStickerOnCurrentPage,
    removeStickerFromCurrentPage,
    duplicateStickerOnCurrentPage,
  } = useNotebookStore();

  const [internalSelected, setInternalSelected] = useState(false);
  const isSelected = externalSelected !== undefined ? externalSelected : internalSelected;

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Position & transform drag tracking
  const dragRef = useRef<{
    startX: number;
    startY: number;
    initX: number;
    initY: number;
    initW: number;
    initH: number;
    initRot: number;
    corner?: 'tl' | 'tr' | 'br' | 'bl';
    centerX?: number;
    centerY?: number;
  }>({
    startX: 0,
    startY: 0,
    initX: sticker.x,
    initY: sticker.y,
    initW: sticker.width,
    initH: sticker.height,
    initRot: sticker.rotation || 0,
  });

  // Handle Drag Move (Sticker Body)
  const handleMouseDownMove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (externalSelect) externalSelect();
    else setInternalSelected(true);
    triggerHaptic('light');

    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: sticker.x,
      initY: sticker.y,
      initW: sticker.width,
      initH: sticker.height,
      initRot: sticker.rotation || 0,
    };

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = (moveEvent.clientX - dragRef.current.startX) / scale;
      const dy = (moveEvent.clientY - dragRef.current.startY) / scale;
      const nextX = Math.round(dragRef.current.initX + dx);
      const nextY = Math.round(dragRef.current.initY + dy);

      updateStickerOnCurrentPage(sticker.id, { x: nextX, y: nextY });
    };

    const onMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Handle Corner Resize
  const handleMouseDownResize = (
    e: React.MouseEvent,
    corner: 'tl' | 'tr' | 'br' | 'bl'
  ) => {
    e.stopPropagation();
    e.preventDefault();
    triggerHaptic('light');

    setIsResizing(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: sticker.x,
      initY: sticker.y,
      initW: sticker.width,
      initH: sticker.height,
      initRot: sticker.rotation || 0,
      corner,
    };

    const aspectRatio = sticker.width / sticker.height;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = (moveEvent.clientX - dragRef.current.startX) / scale;
      const dy = (moveEvent.clientY - dragRef.current.startY) / scale;

      let newW = dragRef.current.initW;
      let newH = dragRef.current.initH;
      let newX = dragRef.current.initX;
      let newY = dragRef.current.initY;

      if (corner === 'br') {
        newW = Math.max(30, dragRef.current.initW + dx);
        newH = newW / aspectRatio;
      } else if (corner === 'bl') {
        newW = Math.max(30, dragRef.current.initW - dx);
        newH = newW / aspectRatio;
        newX = dragRef.current.initX + (dragRef.current.initW - newW);
      } else if (corner === 'tr') {
        newW = Math.max(30, dragRef.current.initW + dx);
        newH = newW / aspectRatio;
        newY = dragRef.current.initY + (dragRef.current.initH - newH);
      } else if (corner === 'tl') {
        newW = Math.max(30, dragRef.current.initW - dx);
        newH = newW / aspectRatio;
        newX = dragRef.current.initX + (dragRef.current.initW - newW);
        newY = dragRef.current.initY + (dragRef.current.initH - newH);
      }

      updateStickerOnCurrentPage(sticker.id, {
        x: Math.round(newX),
        y: Math.round(newY),
        width: Math.round(newW),
        height: Math.round(newH),
      });
    };

    const onMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Handle Rotation Handle Drag
  const handleMouseDownRotate = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    triggerHaptic('light');

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    setIsRotating(true);
    dragRef.current = {
      ...dragRef.current,
      centerX,
      centerY,
      initRot: sticker.rotation || 0,
    };

    const onMouseMove = (moveEvent: MouseEvent) => {
      const angleRad = Math.atan2(
        moveEvent.clientY - centerY,
        moveEvent.clientX - centerX
      );
      let angleDeg = Math.round((angleRad * 180) / Math.PI) + 90; // stem is at top

      // Snap to 0, 45, 90, 135, 180, 225, 270, 315
      const snapAngles = [0, 45, 90, 135, 180, 225, 270, 315, 360];
      for (const snap of snapAngles) {
        if (Math.abs(angleDeg - snap) <= 4 || Math.abs(angleDeg - (snap - 360)) <= 4) {
          angleDeg = snap % 360;
          break;
        }
      }

      updateStickerOnCurrentPage(sticker.id, { rotation: angleDeg });
    };

    const onMouseUp = () => {
      setIsRotating(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Quick Actions
  const rotate90 = () => {
    triggerHaptic('light');
    const cur = sticker.rotation || 0;
    updateStickerOnCurrentPage(sticker.id, { rotation: (cur + 90) % 360 });
  };

  const toggleFlipX = () => {
    triggerHaptic('light');
    updateStickerOnCurrentPage(sticker.id, { flipX: !sticker.flipX });
  };

  const duplicate = () => {
    triggerHaptic('success');
    duplicateStickerOnCurrentPage(sticker.id);
  };

  const remove = () => {
    triggerHaptic('medium');
    removeStickerFromCurrentPage(sticker.id);
  };

  // Close selection when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setInternalSelected(false);
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const widthPx = sticker.width * scale;
  const heightPx = sticker.height * scale;
  const rotation = sticker.rotation || 0;
  const flipTransform = sticker.flipX ? 'scaleX(-1)' : '';

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDownMove}
      className={`absolute select-none cursor-move group z-20 ${
        isSelected ? 'ring-2 ring-indigo-500 shadow-xl' : 'hover:ring-1 hover:ring-indigo-400/60'
      }`}
      style={{
        left: `${sticker.x * scale}px`,
        top: `${sticker.y * scale}px`,
        width: `${widthPx}px`,
        height: `${heightPx}px`,
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'center center',
        opacity: sticker.opacity ?? 1,
      }}
    >
      {/* Content */}
      <div
        className="w-full h-full flex items-center justify-center overflow-hidden pointer-events-none"
        style={{ transform: flipTransform }}
        dangerouslySetInnerHTML={{ __html: sticker.content }}
      />

      {/* Interactive Selection UI: Handles and Floating Action Menu */}
      {isSelected && (
        <>
          {/* Top Rotation Stem and Handle */}
          <div
            className="absolute -top-7 left-1/2 -translate-x-1/2 flex flex-col items-center cursor-grab active:cursor-grabbing group/rot"
            onMouseDown={handleMouseDownRotate}
            title="Döndür (Sürükleyin veya bırakın)"
          >
            <div className="w-4 h-4 rounded-full bg-indigo-600 border-2 border-white shadow-md flex items-center justify-center hover:scale-125 transition-transform">
              <RotateCw size={9} className="text-white" />
            </div>
            <div className="w-0.5 h-3 bg-indigo-500/80" />
          </div>

          {/* 4 Corner Resize Handles */}
          <div
            onMouseDown={(e) => handleMouseDownResize(e, 'tl')}
            className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-full shadow cursor-nwse-resize hover:scale-125 transition-transform"
          />
          <div
            onMouseDown={(e) => handleMouseDownResize(e, 'tr')}
            className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-full shadow cursor-nesw-resize hover:scale-125 transition-transform"
          />
          <div
            onMouseDown={(e) => handleMouseDownResize(e, 'bl')}
            className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-full shadow cursor-nesw-resize hover:scale-125 transition-transform"
          />
          <div
            onMouseDown={(e) => handleMouseDownResize(e, 'br')}
            className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-full shadow cursor-nwse-resize hover:scale-125 transition-transform"
          />

          {/* Floating Action Pill Toolbar (Above or below sticker) */}
          <div
            onMouseDown={(e) => e.stopPropagation()}
            className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-900/95 backdrop-blur-md border border-slate-700/90 px-2 py-1 rounded-2xl shadow-2xl z-30 animate-in fade-in zoom-in-95"
            style={{ transform: `rotate(${-rotation}deg)` }} // keep toolbar upright
          >
            <button
              type="button"
              onClick={rotate90}
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="90° Döndür"
            >
              <RotateCw size={13} />
            </button>

            <button
              type="button"
              onClick={toggleFlipX}
              className={`p-1 rounded-lg transition-colors ${
                sticker.flipX
                  ? 'text-indigo-400 bg-indigo-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              title="Yatay Aynala"
            >
              <FlipHorizontal size={13} />
            </button>

            <button
              type="button"
              onClick={duplicate}
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Çoğalt"
            >
              <Copy size={13} />
            </button>

            <button
              type="button"
              onClick={remove}
              className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 rounded-lg transition-colors"
              title="Sil"
            >
              <Trash2 size={13} />
            </button>

            <div className="w-px h-3.5 bg-slate-700 mx-0.5" />

            <button
              type="button"
              onClick={() => setInternalSelected(false)}
              className="p-1 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 rounded-lg transition-colors"
              title="Tamamla"
            >
              <Check size={13} />
            </button>
          </div>
        </>
      )}
    </div>
  );
};
