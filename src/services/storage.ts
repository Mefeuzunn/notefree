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
    });
  }
}

export async function deleteNotebookFromDB(notebookId: string): Promise<void> {
  await db.notebooks.delete(notebookId);
  await db.pages.where('notebookId').equals(notebookId).delete();
}
