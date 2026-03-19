// ============================================
// Text operations (expand, refine, revise, restructure, synopsis)
// ============================================

import { apiPost } from './api';
import { getSessionId } from './state';
import { showStatus } from './ui';
import { computeAndShowDiff } from './diff';
import { loadSessions } from './sessions';
import type { TextOperationResponse, SynopsisResponse, OperationType } from './types';

export async function processText(operation: OperationType): Promise<void> {
  const textEl = document.getElementById('text') as HTMLTextAreaElement | null;
  const synopsisEl = document.getElementById('synopsis') as HTMLTextAreaElement | null;

  const text = textEl?.value ?? '';
  const synopsis = synopsisEl?.value ?? '';

  if (!text.trim()) {
    showStatus('Please enter some text first', 'error');
    return;
  }

  const resultDiv = document.getElementById('result');
  const loadingDiv = document.getElementById('loading');
  const resultTitle = document.getElementById('resultTitle');
  const resultText = document.getElementById('resultText');

  loadingDiv?.classList.add('show');
  resultDiv?.classList.remove('show');

  try {
    const data = await apiPost<TextOperationResponse>(`/text/${operation}`, {
      text,
      synopsis: synopsis || undefined,
    });

    if (resultTitle) resultTitle.textContent = `${operation.charAt(0).toUpperCase() + operation.slice(1)} Result:`;
    if (resultText) resultText.textContent = data.result;
    resultDiv?.classList.remove('error');
    resultDiv?.classList.add('show');

    // Compute diff against original
    await computeAndShowDiff(text, data.result);

    // Auto-update text field and generate synopsis
    if (textEl) textEl.value = data.result;
    await autoGenerateSynopsis(data.result);

    // Save to session if active
    const sessionId = getSessionId();
    if (sessionId) {
      try {
        await apiPost(`/sessions/${sessionId}/history`, {
          type: operation,
          originalText: text,
          resultText: data.result,
          synopsis: synopsis || undefined,
        });
        await loadSessions();
      } catch (sessionError) {
        console.error('Failed to save to session:', sessionError);
      }
    }

    showStatus(`${operation} complete! Text and synopsis updated. Check diff for changes.`, 'success');
  } catch (error) {
    if (resultTitle) resultTitle.textContent = 'Error:';
    if (resultText) resultText.textContent = (error as Error).message;
    resultDiv?.classList.add('error');
    resultDiv?.classList.add('show');
    showStatus('Operation failed', 'error');
  } finally {
    loadingDiv?.classList.remove('show');
  }
}

export async function generateSynopsis(): Promise<void> {
  const textEl = document.getElementById('text') as HTMLTextAreaElement | null;
  const text = textEl?.value ?? '';

  if (!text.trim()) {
    showStatus('Please enter some text first', 'error');
    return;
  }

  const resultDiv = document.getElementById('result');
  const loadingDiv = document.getElementById('loading');
  const resultTitle = document.getElementById('resultTitle');
  const resultText = document.getElementById('resultText');

  loadingDiv?.classList.add('show');
  resultDiv?.classList.remove('show');

  try {
    const data = await apiPost<SynopsisResponse>('/text/synopsis', { text });

    if (resultTitle) resultTitle.textContent = 'Generated Synopsis:';
    if (resultText) resultText.textContent = data.synopsis;

    const synopsisEl = document.getElementById('synopsis') as HTMLTextAreaElement | null;
    if (synopsisEl) synopsisEl.value = data.synopsis;

    resultDiv?.classList.remove('error');
    resultDiv?.classList.add('show');
    showStatus('Synopsis generated and copied to context field!', 'success');
  } catch (error) {
    if (resultTitle) resultTitle.textContent = 'Error:';
    if (resultText) resultText.textContent = (error as Error).message;
    resultDiv?.classList.add('error');
    resultDiv?.classList.add('show');
    showStatus('Synopsis generation failed', 'error');
  } finally {
    loadingDiv?.classList.remove('show');
  }
}

/**
 * Silently generate synopsis and populate field — non-critical, won't interrupt workflow.
 */
export async function autoGenerateSynopsis(text: string): Promise<void> {
  try {
    const data = await apiPost<SynopsisResponse>('/text/synopsis', { text });
    const synopsisEl = document.getElementById('synopsis') as HTMLTextAreaElement | null;
    if (synopsisEl) synopsisEl.value = data.synopsis;
  } catch (error) {
    console.warn('Auto-synopsis generation failed:', error);
  }
}
