// ============================================
// Export functionality
// ============================================

import { apiPost } from './api';
import { showStatus, downloadContent } from './ui';
import type { ExportResponse } from './types';

const FILE_EXTENSIONS: Record<string, string> = {
  text: 'txt',
  markdown: 'md',
  json: 'json',
};

export function getFileExtension(format: string): string {
  return FILE_EXTENSIONS[format] ?? format;
}

export async function exportAs(format: string): Promise<void> {
  const textEl = document.getElementById('text') as HTMLTextAreaElement | null;
  const synopsisEl = document.getElementById('synopsis') as HTMLTextAreaElement | null;

  const text = textEl?.value ?? '';
  const synopsis = synopsisEl?.value ?? '';

  if (!text.trim()) {
    showStatus('Please enter some text first', 'error');
    return;
  }

  try {
    const data = await apiPost<ExportResponse>(`/export/${format}`, {
      text,
      synopsis: synopsis || undefined,
    });

    downloadContent(data.content, `story-export.${getFileExtension(format)}`);
    showStatus(`Exported as ${format} successfully!`, 'success');
  } catch (error) {
    showStatus(`Export failed: ${(error as Error).message}`, 'error');
  }
}
