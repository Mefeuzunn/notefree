import React, { useState } from 'react';
import { useNotebookStore, DEFAULT_PLANNER_TABS } from '../../store/notebookStore';
import { PlannerTabItem } from '../../types/notebook';
import { triggerHaptic } from '../../engine/hapticFeedback';
import {
  Bookmark,
  ChevronRight,
  ChevronLeft,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Palette,
  Sparkles,
} from 'lucide-react';

const TAB_COLOR_PRESETS = [
  '#f43f5e', // Rose
  '#fb923c', // Orange
  '#eab308', // Amber
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#6366f1', // Indigo
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#64748b', // Slate
];

export const PlannerTabsBar: React.FC = () => {
  const {
    notebooks,
    activeNotebookId,
    activePageIndex,
    plannerTabsVisible,
    togglePlannerTabs,
    addPlannerTab,
    updatePlannerTab,
    removePlannerTab,
    navigateToPage,
  } = useNotebookStore();

  const [editingTab, setEditingTab] = useState<PlannerTabItem | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTargetPage, setNewTargetPage] = useState<number>(0);
  const [newColor, setNewColor] = useState<string>('#6366f1');

  const activeNotebook = notebooks.find((n) => n.id === activeNotebookId);
  const pages = activeNotebook?.pages || [];
  const tabs = activeNotebook?.plannerTabs || DEFAULT_PLANNER_TABS;

  if (!plannerTabsVisible) {
    return (
      <button
        onClick={() => {
          triggerHaptic('light');
          togglePlannerTabs();
        }}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-30 bg-slate-900/90 hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 py-3 px-1.5 rounded-l-2xl shadow-xl border-y border-l border-indigo-500/30 hover:border-indigo-400 flex flex-col items-center gap-1.5 transition-all hover:pl-2 group backdrop-blur-md"
        title="Dijital Ajanda Sekmelerini Göster (Planner Tabs)"
      >
        <Bookmark size={15} className="group-hover:scale-110 transition-transform" />
        <span className="[writing-mode:vertical-rl] text-[10px] font-bold tracking-wider uppercase text-slate-300">
          Sekmeler
        </span>
      </button>
    );
  }

  const handleSaveEdit = () => {
    if (!editingTab) return;
    triggerHaptic('success');
    updatePlannerTab(editingTab.id, {
      title: editingTab.title.trim() || 'Sekme',
      targetPageIndex: editingTab.targetPageIndex,
      color: editingTab.color,
    });
    setEditingTab(null);
  };

  const handleAddNewTab = () => {
    if (!newTitle.trim()) return;
    triggerHaptic('success');
    const newTab: PlannerTabItem = {
      id: `tab_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: newTitle.trim(),
      targetPageIndex: newTargetPage,
      color: newColor,
    };
    addPlannerTab(newTab);
    setIsAddingNew(false);
    setNewTitle('');
  };

  return (
    <>
      {/* Edge Binder Tabs Sidebar */}
      <div className="fixed right-0 top-24 bottom-24 z-30 flex items-center pointer-events-none select-none">
        <div className="pointer-events-auto flex flex-col items-end pr-0.5">
          {/* Header Toggle / Collapse Handle */}
          <div className="flex items-center gap-1 bg-slate-900/95 backdrop-blur-md border border-slate-750 rounded-l-xl px-2 py-1 shadow-lg mb-2">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
              <Bookmark size={11} className="text-indigo-400" />
              <span>Ajanda</span>
            </span>
            <button
              onClick={() => {
                triggerHaptic('light');
                togglePlannerTabs();
              }}
              className="p-0.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
              title="Sekmeleri Gizle"
            >
              <ChevronRight size={13} />
            </button>
          </div>

          {/* Vertical Stack of Tabs */}
          <div className="flex flex-col gap-1.5 max-h-[70vh] overflow-y-auto pr-0.5 pl-2 custom-scrollbar">
            {tabs.map((tab) => {
              const isActive = activePageIndex === tab.targetPageIndex;
              return (
                <div key={tab.id} className="relative group/tab flex items-center justify-end">
                  {/* Context edit button on hover */}
                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      setEditingTab(tab);
                    }}
                    className="opacity-0 group-hover/tab:opacity-100 mr-1 p-1 bg-slate-800/90 text-slate-300 hover:text-white rounded-md shadow-md border border-slate-700 transition-opacity"
                    title="Sekmeyi Düzenle"
                  >
                    <Edit2 size={11} />
                  </button>

                  {/* Physical Planner Tab Button */}
                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      navigateToPage(tab.targetPageIndex);
                    }}
                    style={{
                      borderLeftColor: tab.color,
                      backgroundColor: isActive ? tab.color : '#0f172a',
                    }}
                    className={`flex items-center gap-1.5 py-1.5 px-3 rounded-l-xl border-l-[5px] shadow-lg transition-all text-xs font-bold ${
                      isActive
                        ? 'translate-x-0 text-white font-extrabold shadow-indigo-500/20 ring-1 ring-white/30 pr-4'
                        : 'translate-x-2 hover:translate-x-0 text-slate-200 hover:text-white border-y border-slate-850'
                    }`}
                    title={`${tab.title} (Sayfa ${tab.targetPageIndex + 1}'e Atla)`}
                  >
                    <span
                      style={{
                        backgroundColor: isActive ? '#ffffff' : tab.color,
                      }}
                      className="w-2 h-2 rounded-full shrink-0 shadow-sm"
                    />
                    <span className="truncate max-w-[85px]">{tab.title}</span>
                    <span
                      className={`text-[9px] font-mono px-1 rounded ${
                        isActive
                          ? 'bg-black/30 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {tab.targetPageIndex + 1}
                    </span>
                  </button>
                </div>
              );
            })}

            {/* Add New Tab Button */}
            <button
              onClick={() => {
                triggerHaptic('light');
                setNewTargetPage(activePageIndex);
                setIsAddingNew(true);
              }}
              className="flex items-center justify-center gap-1 py-1.5 px-3 rounded-l-xl bg-slate-900/90 hover:bg-slate-850 text-indigo-400 hover:text-indigo-300 border border-dashed border-indigo-500/40 text-[11px] font-semibold transition-all hover:translate-x-0 translate-x-1 shadow-md"
              title="Yeni Ajanda Sekmesi Ekle"
            >
              <Plus size={13} />
              <span>Yeni Sekme</span>
            </button>
          </div>
        </div>
      </div>

      {/* Edit Tab Modal */}
      {editingTab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md select-none animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm bg-slate-900 border border-slate-750 rounded-3xl shadow-2xl overflow-hidden p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Bookmark size={15} className="text-indigo-400" />
                <span>Sekmeyi Düzenle</span>
              </h3>
              <button
                onClick={() => setEditingTab(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X size={15} />
              </button>
            </div>

            {/* Title Input */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Sekme Başlığı</label>
              <input
                type="text"
                value={editingTab.title}
                onChange={(e) => setEditingTab({ ...editingTab, title: e.target.value })}
                className="w-full bg-slate-950 border border-slate-750 text-slate-100 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>

            {/* Target Page Selector */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Bağlı Sayfa</label>
              <select
                value={editingTab.targetPageIndex}
                onChange={(e) =>
                  setEditingTab({ ...editingTab, targetPageIndex: parseInt(e.target.value, 10) })
                }
                className="w-full bg-slate-950 border border-slate-750 text-slate-200 text-xs rounded-xl px-2.5 py-2 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {pages.map((p, idx) => (
                  <option key={p.id} value={idx}>
                    Sayfa {idx + 1} {p.title ? `- ${p.title}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Color Swatches */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Sekme Rengi</label>
              <div className="flex items-center gap-2 flex-wrap">
                {TAB_COLOR_PRESETS.map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setEditingTab({ ...editingTab, color: col })}
                    style={{ backgroundColor: col }}
                    className={`w-6 h-6 rounded-full transition-all ${
                      editingTab.color === col
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110 shadow-lg'
                        : 'opacity-70 hover:opacity-100 hover:scale-105'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('medium');
                  removePlannerTab(editingTab.id);
                  setEditingTab(null);
                }}
                className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2.5 py-1.5 rounded-xl border border-rose-500/20 font-semibold"
              >
                <Trash2 size={13} />
                <span>Sil</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTab(null)}
                  className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-white text-xs font-medium"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all"
                >
                  Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Tab Modal */}
      {isAddingNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md select-none animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm bg-slate-900 border border-slate-750 rounded-3xl shadow-2xl overflow-hidden p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus size={15} className="text-indigo-400" />
                <span>Yeni Ajanda Sekmesi</span>
              </h3>
              <button
                onClick={() => setIsAddingNew(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X size={15} />
              </button>
            </div>

            {/* Title Input */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Sekme Başlığı</label>
              <input
                type="text"
                placeholder="Örn: Final Özeti, Mart, Formüller..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-750 text-slate-100 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 font-medium"
                autoFocus
              />
            </div>

            {/* Target Page Selector */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Bağlanacak Sayfa</label>
              <select
                value={newTargetPage}
                onChange={(e) => setNewTargetPage(parseInt(e.target.value, 10))}
                className="w-full bg-slate-950 border border-slate-750 text-slate-200 text-xs rounded-xl px-2.5 py-2 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {pages.map((p, idx) => (
                  <option key={p.id} value={idx}>
                    Sayfa {idx + 1} {p.title ? `- ${p.title}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Color Swatches */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Sekme Rengi</label>
              <div className="flex items-center gap-2 flex-wrap">
                {TAB_COLOR_PRESETS.map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setNewColor(col)}
                    style={{ backgroundColor: col }}
                    className={`w-6 h-6 rounded-full transition-all ${
                      newColor === col
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110 shadow-lg'
                        : 'opacity-70 hover:opacity-100 hover:scale-105'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-white text-xs font-medium"
              >
                İptal
              </button>
              <button
                type="button"
                disabled={!newTitle.trim()}
                onClick={handleAddNewTab}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-md transition-all"
              >
                Ekle
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
