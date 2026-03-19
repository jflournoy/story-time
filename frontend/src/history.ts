// ============================================
// History management
// ============================================

import { apiFetch, apiDelete } from './api';
import { getSessionId } from './state';
import { showStatus, downloadContent } from './ui';
import type { HistoryEntry, HistoryListResponse, HistoryItemResponse } from './types';

export async function refreshHistory(): Promise<void> {
  try {
    const sessionId = getSessionId();

    if (sessionId) {
      const history = await apiFetch<HistoryEntry[]>(`/sessions/${sessionId}/history`);
      displayHistory(history);
      updateHistoryCount(history.length);
    } else {
      const data = await apiFetch<HistoryListResponse>('/history');
      displayHistory(data.history);
      updateHistoryCount(data.count);
    }
  } catch (error) {
    showStatus(`Failed to load history: ${(error as Error).message}`, 'error');
  }
}

export function displayHistory(history: HistoryEntry[]): void {
  const historyList = document.getElementById('historyList');
  if (!historyList) return;

  if (!history || history.length === 0) {
    historyList.innerHTML = '<div class="history-empty">No operations yet. Start editing to see history here.</div>';
    return;
  }

  const sortedHistory = [...history].reverse();

  historyList.innerHTML = sortedHistory.map(entry => {
    const date = new Date(entry.timestamp);
    const timeStr = date.toLocaleTimeString();
    const preview = entry.resultText.substring(0, 60);

    return `
      <div class="history-item">
        <div class="history-item-info">
          <div class="history-operation">${entry.type.toUpperCase()}</div>
          <div class="history-timestamp">${timeStr}</div>
          <div class="history-preview">${preview}${entry.resultText.length > 60 ? '...' : ''}</div>
        </div>
        <div class="history-actions">
          <button data-action="viewHistoryItem" data-id="${entry.id}">👁️</button>
          <button data-action="deleteHistoryItem" data-id="${entry.id}">🗑️</button>
        </div>
      </div>
    `;
  }).join('');
}

export function updateHistoryCount(count: number): void {
  const countEl = document.getElementById('historyCount');
  if (countEl) {
    countEl.textContent = `${count} ${count === 1 ? 'operation' : 'operations'}`;
  }
}

export async function viewHistoryItem(id: string): Promise<void> {
  try {
    const data = await apiFetch<HistoryItemResponse>(`/history/${id}`);
    const op = data.operation;

    const resultDiv = document.getElementById('result');
    const resultTitle = document.getElementById('resultTitle');
    const resultText = document.getElementById('resultText');

    if (resultTitle) resultTitle.textContent = `${op.type.toUpperCase()} Result (${new Date(op.timestamp).toLocaleTimeString()})`;
    if (resultText) resultText.textContent = op.resultText;
    resultDiv?.classList.remove('error');
    resultDiv?.classList.add('show');
    showStatus('Viewing history item', 'success');
  } catch (error) {
    showStatus(`Failed to view history item: ${(error as Error).message}`, 'error');
  }
}

export async function deleteHistoryItem(id: string): Promise<void> {
  if (!confirm('Delete this history item?')) return;

  try {
    await apiDelete(`/history/${id}`);
    await refreshHistory();
    showStatus('History item deleted', 'success');
  } catch (error) {
    showStatus(`Failed to delete: ${(error as Error).message}`, 'error');
  }
}

export async function downloadHistory(): Promise<void> {
  try {
    const response = await fetch('/api/history/export/json');
    if (!response.ok) throw new Error('Failed to export history');

    const text = await response.text();
    downloadContent(text, `history-${new Date().toISOString().slice(0, 10)}.json`);
    showStatus('History exported successfully!', 'success');
  } catch (error) {
    showStatus(`Failed to export: ${(error as Error).message}`, 'error');
  }
}

export function clearHistoryConfirm(): void {
  if (!confirm('This will delete ALL history. Are you sure?')) return;
  clearAllHistory();
}

export async function clearAllHistory(): Promise<void> {
  try {
    await apiDelete('/history');
    await refreshHistory();
    showStatus('All history cleared', 'success');
  } catch (error) {
    showStatus(`Failed to clear history: ${(error as Error).message}`, 'error');
  }
}
