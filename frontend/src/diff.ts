// ============================================
// Diff viewer
// ============================================

import { apiPost } from './api';
import { showStatus, escapeHtml } from './ui';
import type { DiffStatsResponse, DiffLinesResponse, DiffChange } from './types';

interface DiffState {
  lineView: boolean;
}

const diffState: DiffState = { lineView: false };

export async function computeAndShowDiff(originalText: string, modifiedText: string): Promise<void> {
  try {
    const [statsData, lineData] = await Promise.all([
      apiPost<DiffStatsResponse>('/diff/stats', { original: originalText, modified: modifiedText }),
      apiPost<DiffLinesResponse>('/diff/lines', { original: originalText, modified: modifiedText }),
    ]);

    displayDiff(originalText, modifiedText, statsData.stats, lineData.changes);
  } catch (error) {
    showStatus(`Failed to compute diff: ${(error as Error).message}`, 'error');
  }
}

export function displayDiff(
  original: string,
  modified: string,
  stats: { additions: number; deletions: number; charDelta: number },
  changes: DiffChange[]
): void {
  const diffSection = document.getElementById('diffSection');
  const diffAdded = document.getElementById('diffAdded');
  const diffRemoved = document.getElementById('diffRemoved');
  const diffSimilarity = document.getElementById('diffSimilarity');

  if (diffAdded) diffAdded.textContent = String(stats.additions);
  if (diffRemoved) diffRemoved.textContent = String(stats.deletions);
  if (diffSimilarity) {
    const sim = ((1 - Math.abs(stats.charDelta) / Math.max(original.length, modified.length)) * 100).toFixed(0);
    diffSimilarity.textContent = `${sim}%`;
  }

  if (diffState.lineView) {
    displayLineView(changes);
  } else {
    displayTextView(original, modified);
  }

  diffSection?.classList.add('show');
}

interface DisplayLine {
  number: number;
  content: string;
  type: 'equal' | 'added' | 'removed';
}

export function displayLineView(changes: DiffChange[]): void {
  const originalDiv = document.getElementById('diffOriginal');
  const modifiedDiv = document.getElementById('diffModified');
  if (!originalDiv || !modifiedDiv) return;

  const originalLines: DisplayLine[] = [];
  const modifiedLines: DisplayLine[] = [];
  let origLineNum = 1;
  let modLineNum = 1;

  changes.forEach(change => {
    const content = change.content ?? change.value ?? '';
    if (change.type === 'equal') {
      originalLines.push({ number: origLineNum, content, type: 'equal' });
      modifiedLines.push({ number: modLineNum, content, type: 'equal' });
      origLineNum++;
      modLineNum++;
    } else if (change.type === 'remove') {
      originalLines.push({ number: origLineNum, content, type: 'removed' });
      origLineNum++;
    } else if (change.type === 'add') {
      modifiedLines.push({ number: modLineNum, content, type: 'added' });
      modLineNum++;
    }
  });

  const renderLines = (lines: DisplayLine[]) =>
    lines.map(line => `
      <div class="diff-line ${line.type}">
        <span class="diff-line-number">${line.number}</span>
        <span class="diff-line-content">${escapeHtml(line.content)}</span>
      </div>
    `).join('');

  originalDiv.innerHTML = renderLines(originalLines);
  modifiedDiv.innerHTML = renderLines(modifiedLines);
}

export function displayTextView(original: string, modified: string): void {
  const originalDiv = document.getElementById('diffOriginal');
  const modifiedDiv = document.getElementById('diffModified');
  if (!originalDiv || !modifiedDiv) return;

  originalDiv.innerHTML = `<pre style="margin: 0; padding: 8px; background: white;">${escapeHtml(original)}</pre>`;
  modifiedDiv.innerHTML = `<pre style="margin: 0; padding: 8px; background: white;">${escapeHtml(modified)}</pre>`;
}

export function toggleLineView(): void {
  diffState.lineView = !diffState.lineView;
  const textEl = document.getElementById('text') as HTMLTextAreaElement | null;
  const resultText = document.getElementById('resultText');

  const text = textEl?.value ?? '';
  const result = resultText?.textContent ?? '';

  if (result && text) {
    computeAndShowDiff(text, result);
  }
}
