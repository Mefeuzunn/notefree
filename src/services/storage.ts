import Dexie, { type EntityTable } from 'dexie';
import { Notebook, Page, PageTemplate, PaperColor, Stroke } from '../types/notebook';

export interface DBNotebook {
  id: string;
  title: string;
  coverColor: string;
  activePageIndex: number;
  createdAt: number;
  updatedAt: number;
  youtubeUrl?: string;
  youtubeBookmarks?: any[];
  flashcards?: any[];
}

export interface DBPage {
  id: string;
  notebookId: string;
  pageNumber: number;
  template: PageTemplate;
  paperColor: PaperColor;
  strokes: Stroke[];
  images?: any[];
  texts?: any[];
  backgroundImageUrl?: string;
  width: number;
  height: number;
  title?: string;
  isBookmarked?: boolean;
}

class NotFreeDatabase extends Dexie {
  notebooks!: EntityTable<DBNotebook, 'id'>;
  pages!: EntityTable<DBPage, 'id'>;

  constructor() {
    super('NotFreeDB');
    this.version(1).stores({
      notebooks: 'id, title, createdAt, updatedAt',
      pages: 'id, notebookId, pageNumber',
    });
  }
}

export const db = new NotFreeDatabase();

export async function initStorage(): Promise<Notebook[]> {
  const existingNotebooks = await db.notebooks.toArray();

  if (existingNotebooks.length === 0) {
    // Seed starter demo notebooks
    const defaultNotebookId = 'nb_starter_1';
    const samplePage1Id = 'pg_starter_1';
    const samplePage2Id = 'pg_starter_2';

    const starterNotebook: DBNotebook = {
      id: defaultNotebookId,
      title: '🎓 Matematik & YouTube Video Ders Notları',
      coverColor: '#3b82f6',
      activePageIndex: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      youtubeUrl: 'https://www.youtube.com/watch?v=aircAruvnKk', // 3Blue1Brown Neural Networks
      youtubeBookmarks: [
        {
          id: 'bm_1',
          seconds: 45,
          title: 'Giriş & Temel Tanım',
          pageId: samplePage1Id,
          pageNumber: 1,
          timestamp: Date.now(),
        },
        {
          id: 'bm_2',
          seconds: 180,
          title: 'Aktivasyon Fonksiyonları',
          pageId: samplePage1Id,
          pageNumber: 1,
          timestamp: Date.now(),
        },
      ],
      flashcards: [
        {
          id: 'fc_1',
          notebookId: defaultNotebookId,
          frontText: 'Yapay Sinir Ağlarında Sigmoid Fonksiyonu formülü nedir?',
          backText: 'σ(x) = 1 / (1 + e^(-x))\nDeğer aralığı (0, 1) arasındadır.',
          difficulty: 'good',
          reviewCount: 2,
          lastReviewed: Date.now() - 3600000,
          createdAt: Date.now(),
        },
        {
          id: 'fc_2',
          notebookId: defaultNotebookId,
          frontText: 'Gradyan İnişi (Gradient Descent) temel amacı nedir?',
          backText: 'Kayıp fonksiyonunu (Loss Function) minimize ederek ağırlıkları ve bias değerlerini en uygun hale getirmek.',
          difficulty: 'easy',
          reviewCount: 3,
          lastReviewed: Date.now() - 7200000,
          createdAt: Date.now(),
        },
        {
          id: 'fc_3',
          notebookId: defaultNotebookId,
          frontText: 'ReLU Aktivasyon Fonksiyonu avantajı nedir?',
          backText: 'f(x) = max(0, x)\nKaybolan gradyan (vanishing gradient) problemini azaltır ve hesaplama hızı çok yüksektir.',
          difficulty: 'again',
          reviewCount: 1,
          lastReviewed: Date.now() - 86400000,
          createdAt: Date.now(),
        },
      ],
    };

    const starterPage1: DBPage = {
      id: samplePage1Id,
      notebookId: defaultNotebookId,
      pageNumber: 1,
      template: 'cornell',
      paperColor: 'cream',
      width: 800,
      height: 1130,
      strokes: [],
      title: 'Ders 1 - Giriş Notları',
      isBookmarked: true,
    };

    const starterPage2: DBPage = {
      id: samplePage2Id,
      notebookId: defaultNotebookId,
      pageNumber: 2,
      template: 'grid-5mm',
      paperColor: 'white',
      width: 800,
      height: 1130,
      strokes: [],
      title: 'Ders 1 - Çizimler ve Grafikler',
      isBookmarked: false,
    };

    // Second notebook: Weekly Planner
    const plannerNotebookId = 'nb_planner_2';
    const plannerPageId = 'pg_planner_1';
    const plannerNotebook: DBNotebook = {
      id: plannerNotebookId,
      title: '📅 2026 Haftalık Planlayıcı & Ajanda',
      coverColor: '#10b981',
      activePageIndex: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const plannerPage: DBPage = {
      id: plannerPageId,
      notebookId: plannerNotebookId,
      pageNumber: 1,
      template: 'planner-weekly',
      paperColor: 'white',
      width: 800,
      height: 1130,
      strokes: [],
      title: 'Haftalık Program',
      isBookmarked: true,
    };

    await db.notebooks.bulkAdd([starterNotebook, plannerNotebook]);
    await db.pages.bulkAdd([starterPage1, starterPage2, plannerPage]);
  }

  return await loadAllNotebooksWithPages();
}

export async function loadAllNotebooksWithPages(): Promise<Notebook[]> {
  const notebooks = await db.notebooks.orderBy('updatedAt').reverse().toArray();
  const allPages = await db.pages.toArray();

  return notebooks.map((nb) => {
    const pages = allPages
      .filter((p) => p.notebookId === nb.id)
      .sort((a, b) => a.pageNumber - b.pageNumber)
      .map((p) => ({
        id: p.id,
        pageNumber: p.pageNumber,
        template: p.template,
        paperColor: p.paperColor,
        strokes: p.strokes || [],
        images: p.images || [],
        texts: p.texts || [],
        backgroundImageUrl: p.backgroundImageUrl,
        width: p.width || 800,
        height: p.height || 1130,
        title: p.title,
        isBookmarked: Boolean(p.isBookmarked),
      }));

    return {
      id: nb.id,
      title: nb.title,
      coverColor: nb.coverColor,
      activePageIndex: Math.min(nb.activePageIndex || 0, Math.max(0, pages.length - 1)),
      createdAt: nb.createdAt,
      updatedAt: nb.updatedAt,
      youtubeUrl: nb.youtubeUrl,
      youtubeBookmarks: nb.youtubeBookmarks || [],
      flashcards: nb.flashcards || [],
      pages,
    };
  });
}

export async function savePageStrokes(pageId: string, strokes: Stroke[]): Promise<void> {
  await db.pages.update(pageId, { strokes });
}

export async function saveNotebookToDB(notebook: Notebook): Promise<void> {
  await db.notebooks.put({
    id: notebook.id,
    title: notebook.title,
    coverColor: notebook.coverColor,
    activePageIndex: notebook.activePageIndex,
    createdAt: notebook.createdAt,
    updatedAt: Date.now(),
    youtubeUrl: notebook.youtubeUrl,
    youtubeBookmarks: notebook.youtubeBookmarks,
    flashcards: notebook.flashcards,
  });

  for (const page of notebook.pages) {
    await db.pages.put({
      id: page.id,
      notebookId: notebook.id,
      pageNumber: page.pageNumber,
      template: page.template,
      paperColor: page.paperColor,
      strokes: page.strokes,
      images: page.images,
      texts: page.texts,
      backgroundImageUrl: page.backgroundImageUrl,
      width: page.width,
      height: page.height,
      title: page.title,
      isBookmarked: page.isBookmarked,
    });
  }
}

export async function deleteNotebookFromDB(notebookId: string): Promise<void> {
  await db.notebooks.delete(notebookId);
  await db.pages.where('notebookId').equals(notebookId).delete();
}

/**
 * Export a single Notebook as a .notefree format file
 */
export function exportNotebookAsNotefree(notebook: Notebook): void {
  const exportData = {
    app: 'NotFree',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    notebook,
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeTitle = notebook.title.replace(/[^a-zA-Z0-9çğıöşüÇĞİÖŞÜ_-]/g, '_');
  a.download = `${safeTitle}.notefree`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Import a Notebook from a .notefree file content
 */
export async function importNotebookFromNotefree(jsonString: string): Promise<Notebook> {
  const parsed = JSON.parse(jsonString);
  const rawNotebook: Notebook = parsed.notebook || parsed;

  if (!rawNotebook.title || !Array.isArray(rawNotebook.pages)) {
    throw new Error('Geçersiz NotFree dosya formatı.');
  }

  // Generate new IDs to prevent collisions
  const newNotebookId = `nb_imported_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const pages: Page[] = rawNotebook.pages.map((p, index) => ({
    ...p,
    id: `pg_imported_${Date.now()}_${index}`,
    pageNumber: index + 1,
    strokes: p.strokes || [],
    texts: p.texts || [],
    images: p.images || [],
    isBookmarked: Boolean(p.isBookmarked),
  }));

  const importedNotebook: Notebook = {
    ...rawNotebook,
    id: newNotebookId,
    title: `${rawNotebook.title} (İçe Aktarıldı)`,
    pages,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    flashcards: rawNotebook.flashcards || [],
  };

  await saveNotebookToDB(importedNotebook);
  return importedNotebook;
}

/**
 * Export all notebooks as a complete workspace JSON backup
 */
export function exportAllNotebooksBackup(notebooks: Notebook[]): void {
  const exportData = {
    app: 'NotFree',
    version: '1.0.0',
    type: 'full_backup',
    exportedAt: new Date().toISOString(),
    notebooks,
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `NotFree_Tum_Defterler_Yedek_${new Date().toISOString().slice(0, 10)}.notefree`;
  a.click();
  URL.revokeObjectURL(url);
}
