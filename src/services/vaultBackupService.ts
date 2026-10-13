// Full Library Backup & Restore Service (.notefree-vault)
import { Notebook, LibraryVaultBackup } from '../types/notebook';
import { saveNotebookToDB } from './storage';

export const exportEntireVault = (notebooks: Notebook[]): void => {
  const backup: LibraryVaultBackup = {
    version: 1,
    exportedAt: Date.now(),
    appName: 'Notefree',
    notebooks,
  };

  const jsonStr = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const dateStr = new Date().toISOString().slice(0, 10);
  const a = document.createElement('a');
  a.href = url;
  a.download = `notefree_tam_kutuphane_yedegi_${dateStr}.notefree-vault`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const importEntireVault = async (
  file: File
): Promise<{ success: boolean; importedCount: number; notebooks: Notebook[]; error?: string }> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text) as LibraryVaultBackup;

        if (!parsed || !Array.isArray(parsed.notebooks)) {
          resolve({
            success: false,
            importedCount: 0,
            notebooks: [],
            error: 'Geçersiz yedek dosyası formatı.',
          });
          return;
        }

        const validNotebooks: Notebook[] = [];
        for (const nb of parsed.notebooks) {
          if (nb && nb.id && Array.isArray(nb.pages)) {
            // Save to IndexedDB
            await saveNotebookToDB(nb);
            validNotebooks.push(nb);
          }
        }

        resolve({
          success: true,
          importedCount: validNotebooks.length,
          notebooks: validNotebooks,
        });
      } catch (err: any) {
        resolve({
          success: false,
          importedCount: 0,
          notebooks: [],
          error: err.message || 'Yedek dosyası okunurken hata oluştu.',
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        importedCount: 0,
        notebooks: [],
        error: 'Dosya okunamadı.',
      });
    };

    reader.readAsText(file);
  });
};
