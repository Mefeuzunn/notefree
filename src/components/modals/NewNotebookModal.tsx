import React, { useState } from 'react';
import { useNotebookStore } from '../../store/notebookStore';
import { PageTemplate } from '../../types/notebook';
import { X, Book, Plus } from 'lucide-react';

const COVER_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#0f172a', // Dark Slate
  '#0d9488', // Teal
];

export const NewNotebookModal: React.FC = () => {
  const { newNotebookModalOpen, setNewNotebookModalOpen, createNotebook } = useNotebookStore();

  const [title, setTitle] = useState('');
  const [coverColor, setCoverColor] = useState('#3b82f6');
  const [template, setTemplate] = useState<PageTemplate>('lined');

  if (!newNotebookModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await createNotebook(title.trim(), coverColor, template);
    setTitle('');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-sm"
              style={{ backgroundColor: coverColor }}
            >
              <Book size={14} />
            </div>
            <h2 className="text-base font-semibold text-slate-100">Yeni Defter Oluştur</h2>
          </div>
          <button
            onClick={() => setNewNotebookModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
              Defter Adı
            </label>
            <input
              type="text"
              autoFocus
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn: Fizik 101, Biyoloji Ders Notları, Günlük..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
            />
          </div>

          {/* Cover Color */}
          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
              Kapak Rengi
            </label>
            <div className="grid grid-cols-8 gap-2">
              {COVER_COLORS.map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setCoverColor(col)}
                  className={`w-8 h-8 rounded-full transition-transform hover:scale-110 shadow-sm ${
                    coverColor === col ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-105' : ''
                  }`}
                  style={{ backgroundColor: col }}
                />
              ))}
            </div>
          </div>

          {/* Initial Template */}
          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
              Başlangıç Şablonu
            </label>
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value as PageTemplate)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="lined">Çizgili Notluk</option>
              <option value="lined-margin">Çizgili & Kırmızı Kenarlı</option>
              <option value="grid-5mm">Kareli Kağıt (5mm)</option>
              <option value="dots">Noktalı (Bullet Journal)</option>
              <option value="cornell">Cornell Not Alma Metodu</option>
              <option value="planner-weekly">Haftalık Ajanda / Planlayıcı</option>
              <option value="planner-daily">Günlük Saatlik Planlayıcı</option>
              <option value="isometric-3d">İzometrik 3D Çizim</option>
              <option value="isometric-dots">İzometrik 3D Noktalı</option>
              <option value="polar-coordinate">Polar Radyal Koordinat</option>
              <option value="engineering-1mm">Milimetrik Pafta (1mm CAD)</option>
              <option value="logarithmic-grid">Yarı-Logaritmik (Semi-Log)</option>
              <option value="music">Müzik Portesi (Dizek)</option>
              <option value="blank">Düz Beyaz</option>
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setNewNotebookModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md transition-colors flex items-center gap-1.5"
            >
              <Plus size={14} />
              Oluştur
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
