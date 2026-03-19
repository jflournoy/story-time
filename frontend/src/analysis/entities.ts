// ============================================
// Entity extraction
// ============================================

import { apiPost } from '../api';
import { showStatus, showAnalysisLoading, hideAnalysisResults } from '../ui';
import type { EntityExtractionResult, EntitySummary, EntityComparison } from '../types';

export async function extractEntities(): Promise<void> {
  const textEl = document.getElementById('text') as HTMLTextAreaElement | null;
  const text = textEl?.value ?? '';
  if (!text.trim()) { showStatus('Please enter some text first', 'error'); return; }

  showAnalysisLoading('entityResults', 'entityContent', 'Extracting entities...');

  try {
    const data = await apiPost<EntityExtractionResult>('/entities/extract', {
      text,
      options: { includeRelationships: true },
    });
    displayEntities(data);
    showStatus('Entities extracted!', 'success');
  } catch (error) {
    showStatus(`Entity extraction failed: ${(error as Error).message}`, 'error');
    hideAnalysisResults('entityResults');
  }
}

export async function getEntitySummary(): Promise<void> {
  const textEl = document.getElementById('text') as HTMLTextAreaElement | null;
  const text = textEl?.value ?? '';
  if (!text.trim()) { showStatus('Please enter some text first', 'error'); return; }

  showAnalysisLoading('entityResults', 'entityContent', 'Generating entity summary...');

  try {
    const data = await apiPost<EntitySummary>('/entities/summary', { text });
    displayEntitySummary(data);
    showStatus('Entity summary generated!', 'success');
  } catch (error) {
    showStatus(`Entity summary failed: ${(error as Error).message}`, 'error');
    hideAnalysisResults('entityResults');
  }
}

export async function compareEntities(): Promise<void> {
  const textEl = document.getElementById('text') as HTMLTextAreaElement | null;
  const resultTextEl = document.getElementById('resultText');
  const text = textEl?.value ?? '';
  const resultText = resultTextEl?.textContent ?? '';

  if (!text.trim() || !resultText.trim()) {
    showStatus('Please perform a text operation first to have two versions to compare', 'error');
    return;
  }

  showAnalysisLoading('entityResults', 'entityContent', 'Comparing entities...');

  try {
    const data = await apiPost<EntityComparison>('/entities/compare', { original: text, revised: resultText });
    displayEntityComparison(data);
    showStatus('Entity comparison complete!', 'success');
  } catch (error) {
    showStatus(`Entity comparison failed: ${(error as Error).message}`, 'error');
    hideAnalysisResults('entityResults');
  }
}

function displayEntities(data: EntityExtractionResult): void {
  const content = document.getElementById('entityContent');
  if (!content) return;

  const renderEntityList = (entities: EntityExtractionResult['characters']) =>
    entities.map(e => `
      <div class="entity-item">
        <div class="entity-name">${e.name}</div>
        <div class="entity-details">
          Mentions: ${e.mentions} |
          First: Para ${e.firstAppearance.paragraph}, Sent ${e.firstAppearance.sentence}
          ${e.attributes.length > 0 ? `<br>Attributes: ${e.attributes.join(', ')}` : ''}
          ${e.relationships && e.relationships.length > 0 ? `<br>Relations: ${e.relationships.map(r => `${r.target} (${r.type})`).join(', ')}` : ''}
        </div>
      </div>
    `).join('') || '<p style="color: #999;">None found</p>';

  content.innerHTML = `
    <h4>Extracted Entities (${data.entityCount} total)</h4>
    <div style="margin-top: 15px;">
      <h5>👥 Characters (${data.characters.length})</h5>
      <div class="entity-list">${renderEntityList(data.characters)}</div>
    </div>
    <div style="margin-top: 15px;">
      <h5>📍 Locations (${data.locations.length})</h5>
      <div class="entity-list">${renderEntityList(data.locations)}</div>
    </div>
    <div style="margin-top: 15px;">
      <h5>🔧 Objects (${data.objects.length})</h5>
      <div class="entity-list">${renderEntityList(data.objects)}</div>
    </div>
  `;
  document.getElementById('entityResults')?.classList.add('show');
}

function displayEntitySummary(data: EntitySummary): void {
  const content = document.getElementById('entityContent');
  if (!content) return;
  content.innerHTML = `
    <h4>Entity Summary</h4>
    <div class="metric"><span>Characters:</span> <strong>${data.characterCount}</strong></div>
    <div class="metric"><span>Locations:</span> <strong>${data.locationCount}</strong></div>
    <div class="metric"><span>Objects:</span> <strong>${data.objectCount}</strong></div>
    <div class="metric"><span>Total Mentions:</span> <strong>${data.totalMentions}</strong></div>
    <div class="metric">
      <span>Most Mentioned:</span>
      <strong>${data.mostMentioned.name} (${data.mostMentioned.type}, ${data.mostMentioned.mentions} mentions)</strong>
    </div>
  `;
  document.getElementById('entityResults')?.classList.add('show');
}

function displayEntityComparison(data: EntityComparison): void {
  const content = document.getElementById('entityContent');
  if (!content) return;
  content.innerHTML = `
    <h4>Entity Comparison</h4>
    <div style="margin-top: 15px;">
      <h5 style="color: #4CAF50;">➕ Added Entities</h5>
      <p><strong>Characters:</strong> ${data.added.characters.join(', ') || 'None'}</p>
      <p><strong>Locations:</strong> ${data.added.locations.join(', ') || 'None'}</p>
      <p><strong>Objects:</strong> ${data.added.objects.join(', ') || 'None'}</p>
    </div>
    <div style="margin-top: 15px;">
      <h5 style="color: #f44336;">➖ Removed Entities</h5>
      <p><strong>Characters:</strong> ${data.removed.characters.join(', ') || 'None'}</p>
      <p><strong>Locations:</strong> ${data.removed.locations.join(', ') || 'None'}</p>
      <p><strong>Objects:</strong> ${data.removed.objects.join(', ') || 'None'}</p>
    </div>
    <div style="margin-top: 15px;">
      <h5 style="color: #2196F3;">✓ Retained Entities</h5>
      <p><strong>Characters:</strong> ${data.retained.characters.join(', ') || 'None'}</p>
      <p><strong>Locations:</strong> ${data.retained.locations.join(', ') || 'None'}</p>
      <p><strong>Objects:</strong> ${data.retained.objects.join(', ') || 'None'}</p>
    </div>
  `;
  document.getElementById('entityResults')?.classList.add('show');
}
