import React, { useState, useRef, useEffect } from 'react';
import { Crop, Scissors, Check, X, RotateCcw, Sparkles } from 'lucide-react';

interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onApplyCrop: (croppedDataUrl: string) => void;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onApplyCrop,
}) => {
  const [cropMode, setCropMode] = useState<'rect' | 'lasso'>('rect');
  const [rectCrop, setRectCrop] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 40,
    y: 40,
    width: 240,
    height: 180,
  });
  const [lassoPoints, setLassoPoints] = useState<{ x: number; y: number }[]>([]);
  const [isDrawingLasso, setIsDrawingLasso] = useState(false);
  const [isDraggingRect, setIsDraggingRect] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!isOpen || !imageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      // Initialize rect crop to 80% of image
      setRectCrop({
        x: Math.round(img.width * 0.1),
        y: Math.round(img.height * 0.1),
        width: Math.round(img.width * 0.8),
        height: Math.round(img.height * 0.8),
      });
      setLassoPoints([]);
    };
    img.src = imageSrc;
  }, [isOpen, imageSrc]);

  if (!isOpen || !imageSrc) return null;

  // Handle Rectangular Crop Execution
  const applyRectangularCrop = () => {
    if (!imgRef.current) return;
    const img = imgRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = rectCrop.width;
    canvas.height = rectCrop.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(
      img,
      rectCrop.x,
      rectCrop.y,
      rectCrop.width,
      rectCrop.height,
      0,
      0,
      rectCrop.width,
      rectCrop.height
    );

    const croppedData = canvas.toDataURL('image/png');
    onApplyCrop(croppedData);
    onClose();
  };

  // Handle Freehand Lasso Mask Crop Execution
  const applyLassoCrop = () => {
    if (!imgRef.current || lassoPoints.length < 3) return;
    const img = imgRef.current;

    // Find bounding box of lasso
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    lassoPoints.forEach((p) => {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    });

    const cropW = Math.max(10, maxX - minX);
    const cropH = Math.max(10, maxY - minY);

    const canvas = document.createElement('canvas');
    canvas.width = cropW;
    canvas.height = cropH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Create clipping mask from polygon
    ctx.beginPath();
    ctx.moveTo(lassoPoints[0].x - minX, lassoPoints[0].y - minY);
    for (let i = 1; i < lassoPoints.length; i++) {
      ctx.lineTo(lassoPoints[i].x - minX, lassoPoints[i].y - minY);
    }
    ctx.closePath();
    ctx.clip();

    // Draw image masked
    ctx.drawImage(img, -minX, -minY, img.width, img.height);

    const croppedData = canvas.toDataURL('image/png');
    onApplyCrop(croppedData);
    onClose();
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !imgRef.current) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (cropMode === 'lasso') {
      setIsDrawingLasso(true);
      setLassoPoints([{ x, y }]);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingLasso || cropMode !== 'lasso') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setLassoPoints((prev) => [...prev, { x, y }]);
  };

  const handlePointerUp = () => {
    setIsDrawingLasso(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-750 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-150 text-white flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-925/40">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Crop size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold">Görsel Kırpma Stüdyosu</h3>
              <p className="text-[11px] text-slate-400">Dikdörtgen veya serbest kement ile kırpın</p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-xl border border-slate-700">
            <button
              onClick={() => setCropMode('rect')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                cropMode === 'rect' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Crop size={13} />
              <span>Dikdörtgen</span>
            </button>
            <button
              onClick={() => setCropMode('lasso')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                cropMode === 'lasso' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Scissors size={13} />
              <span>Serbest Kement</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Canvas Workspace Area */}
        <div className="flex-1 p-4 overflow-auto flex items-center justify-center bg-slate-950/60 relative">
          <div className="relative inline-block border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
            <img
              src={imageSrc}
              alt="Crop target"
              className="max-h-[50vh] max-w-full block select-none pointer-events-none"
            />

            {/* Lasso Drawing Overlay Canvas */}
            {cropMode === 'lasso' && (
              <canvas
                ref={canvasRef}
                width={imgRef.current?.width || 600}
                height={imgRef.current?.height || 400}
                className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
              />
            )}

            {/* SVG trace for lasso */}
            {cropMode === 'lasso' && lassoPoints.length > 1 && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <polygon
                  points={lassoPoints.map((p) => `${p.x},${p.y}`).join(' ')}
                  fill="rgba(99, 102, 241, 0.25)"
                  stroke="#6366f1"
                  strokeWidth="2.5"
                  strokeDasharray="4 4"
                />
              </svg>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-925/40">
          <span className="text-xs text-slate-400">
            {cropMode === 'lasso'
              ? 'Görsel üzerinde istediğiniz nesnenin etrafını çizerek kırpın'
              : 'Görseli kırpmak için onaylayın'}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-semibold"
            >
              Vazgeç
            </button>
            <button
              onClick={cropMode === 'lasso' ? applyLassoCrop : applyRectangularCrop}
              disabled={cropMode === 'lasso' && lassoPoints.length < 3}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5"
            >
              <Check size={14} />
              <span>Kırp ve Uygula</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
