// ============================================
// Entry point — Story Time frontend
// Imports all modules and wires event handlers
// ============================================

import { showStatus } from './ui';
import { loadSessions, createNewSession, switchSession, manageSessions } from './sessions';
import { refreshHistory, viewHistoryItem, deleteHistoryItem, downloadHistory, clearHistoryConfirm } from './history';
import { exportAs } from './export';
import { computeAndShowDiff, toggleLineView } from './diff';
import { processText, generateSynopsis } from './text-operations';
import { analyzeTone, compareTone, computeEmotionalArc } from './analysis/tone';
import { extractEntities, getEntitySummary, compareEntities } from './analysis/entities';
import { extractEvents, buildTimeline, analyzePacing, detectStructure, compareTimelines } from './analysis/timeline';
import {
  analyzeFullComplexity, analyzeThreads, analyzeCharacters,
  analyzeScenes, analyzeReadability, analyzeDensity, compareComplexity
} from './analysis/complexity';
import type { OperationType } from './types';

// ---- Action dispatch ----

type ActionHandler = (el: Element) => void | Promise<void>;

const actions: Record<string, ActionHandler> = {
  // Text operations
  processText: (el) => processText(el.getAttribute('data-operation') as OperationType),
  generateSynopsis: () => generateSynopsis(),

  // Export
  exportAs: (el) => exportAs(el.getAttribute('data-format') ?? 'text'),

  // History
  refreshHistory: () => refreshHistory(),
  viewHistoryItem: (el) => viewHistoryItem(el.getAttribute('data-id') ?? ''),
  deleteHistoryItem: (el) => deleteHistoryItem(el.getAttribute('data-id') ?? ''),
  downloadHistory: () => downloadHistory(),
  clearHistoryConfirm: () => clearHistoryConfirm(),

  // Diff
  computeAndShowDiff: () => {
    const textEl = document.getElementById('text') as HTMLTextAreaElement | null;
    const resultEl = document.getElementById('resultText');
    const text = textEl?.value ?? '';
    const result = resultEl?.textContent ?? '';
    if (text && result) computeAndShowDiff(text, result);
  },
  toggleLineView: () => toggleLineView(),

  // Sessions
  loadSessions: () => loadSessions(),
  createNewSession: () => createNewSession(),
  switchSession: () => switchSession(),
  manageSessions: () => manageSessions(),

  // Tone analysis
  analyzeTone: () => analyzeTone(),
  compareTone: () => compareTone(),
  computeEmotionalArc: () => computeEmotionalArc(),

  // Entity analysis
  extractEntities: () => extractEntities(),
  getEntitySummary: () => getEntitySummary(),
  compareEntities: () => compareEntities(),

  // Timeline analysis
  extractEvents: () => extractEvents(),
  buildTimeline: () => buildTimeline(),
  analyzePacing: () => analyzePacing(),
  detectStructure: () => detectStructure(),
  compareTimelines: () => compareTimelines(),

  // Complexity analysis
  analyzeFullComplexity: () => analyzeFullComplexity(),
  analyzeThreads: () => analyzeThreads(),
  analyzeCharacters: () => analyzeCharacters(),
  analyzeScenes: () => analyzeScenes(),
  analyzeReadability: () => analyzeReadability(),
  analyzeDensity: () => analyzeDensity(),
  compareComplexity: () => compareComplexity(),
};

function dispatch(actionName: string | null, el: Element): void {
  if (!actionName) return;
  const handler = actions[actionName];
  if (handler) {
    handler(el);
  } else {
    console.warn(`Unknown action: ${actionName}`);
  }
}

// ---- Health check ----

async function checkHealth(): Promise<void> {
  try {
    const response = await fetch('/health');
    if (response.ok) {
      showStatus('Connected to Story Time server', 'success');
      await refreshHistory();
      await loadSessions();
    }
  } catch {
    showStatus('Cannot connect to server. Please start the backend.', 'error');
  }
}

// ---- Event wiring ----

document.addEventListener('DOMContentLoaded', () => {
  // Global click handler using data-action dispatch
  document.addEventListener('click', (e) => {
    const btn = (e.target as Element).closest('[data-action]');
    if (!btn) return;
    dispatch(btn.getAttribute('data-action'), btn);
  });

  // Session selector change
  document.getElementById('sessionSelector')?.addEventListener('change', () => switchSession());

  checkHealth();
});
