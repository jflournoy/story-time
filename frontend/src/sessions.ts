// ============================================
// Session management
// ============================================

import { apiFetch, apiPost } from './api';
import { getSessionId, setSessionId } from './state';
import { showStatus } from './ui';
import type { SessionMetadata } from './types';

export async function loadSessions(): Promise<void> {
  try {
    const sessions = await apiFetch<SessionMetadata[]>('/sessions');
    const selector = document.getElementById('sessionSelector') as HTMLSelectElement | null;
    if (!selector) return;

    selector.innerHTML = '<option value="">No Session (In-Memory Only)</option>';

    sessions.forEach(session => {
      const option = document.createElement('option');
      option.value = session.id;
      option.textContent = `${session.title} (${session.operationCount} ops)`;
      selector.appendChild(option);
    });

    const currentId = getSessionId();
    if (currentId) {
      selector.value = currentId;
    }
  } catch (error) {
    console.error('Failed to load sessions:', error);
  }
}

export async function createNewSession(): Promise<void> {
  const title = prompt('Enter session title:');
  if (!title) return;

  const description = prompt('Enter session description (optional):') ?? undefined;

  try {
    const session = await apiPost<SessionMetadata>('/sessions', {
      title,
      description: description || undefined,
    });

    setSessionId(session.id);
    await loadSessions();

    // refreshHistory is still in the inline script during migration
    const w = window as Window & typeof globalThis & Record<string, unknown>;
    if (typeof w.refreshHistory === 'function') {
      await (w.refreshHistory as () => Promise<void>)();
    }

    showStatus(`Session "${title}" created!`, 'success');
  } catch (error) {
    showStatus(`Failed to create session: ${(error as Error).message}`, 'error');
  }
}

export async function switchSession(): Promise<void> {
  const selector = document.getElementById('sessionSelector') as HTMLSelectElement | null;
  if (!selector) return;

  setSessionId(selector.value || null);

  if (getSessionId()) {
    showStatus('Switched to session', 'success');
  } else {
    showStatus('Using in-memory mode (no persistence)', 'success');
  }

  const w = window as Window & typeof globalThis & Record<string, unknown>;
  if (typeof w.refreshHistory === 'function') {
    await (w.refreshHistory as () => Promise<void>)();
  }
}

export async function manageSessions(): Promise<void> {
  await loadSessions();
  alert('Session management: Use the dropdown to switch sessions. To delete a session, please use the API directly for now.');
}
