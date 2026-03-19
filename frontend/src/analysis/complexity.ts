// ============================================
// Complexity analysis
// ============================================

import { apiPost } from '../api';
import { showStatus } from '../ui';
import type {
  ComplexityReport,
  PlotThreadAnalysis,
  CharacterInvolvement,
  SceneComplexity,
  Readability,
  NarrativeDensity,
} from '../types';

function showComplexityLoading(): void {
  const results = document.getElementById('complexityResults');
  const content = document.getElementById('complexityContent');
  if (content) content.innerHTML = '<p style="text-align: center; color: #666;">⏳ Analyzing narrative complexity...</p>';
  results?.classList.add('show');
}

function hideComplexityResults(): void {
  document.getElementById('complexityResults')?.classList.remove('show');
}

function formatRecommendation(rec: string): string {
  const formatted = rec.replace(/_/g, ' ');
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function getText(): string {
  return (document.getElementById('text') as HTMLTextAreaElement | null)?.value ?? '';
}

export async function analyzeFullComplexity(): Promise<void> {
  const text = getText();
  if (!text.trim()) { showStatus('Please enter some text first', 'error'); return; }

  showComplexityLoading();

  try {
    const data = await apiPost<ComplexityReport>('/complexity/report', { text });
    displayFullComplexityReport(data);
    showStatus('Complexity analysis complete!', 'success');
  } catch (error) {
    showStatus(`Analysis failed: ${(error as Error).message}`, 'error');
    hideComplexityResults();
  }
}

async function analyzeComplexityType<T>(
  endpoint: string,
  title: string,
  displayFn: (data: T) => void
): Promise<void> {
  const text = getText();
  if (!text.trim()) { showStatus('Please enter some text first', 'error'); return; }

  showComplexityLoading();

  try {
    const data = await apiPost<T>(`/complexity/${endpoint}`, { text });
    displayFn(data);
    showStatus(`${title} analysis complete!`, 'success');
  } catch (error) {
    showStatus(`Analysis failed: ${(error as Error).message}`, 'error');
    hideComplexityResults();
  }
}

export async function analyzeThreads(): Promise<void> {
  await analyzeComplexityType<PlotThreadAnalysis>('threads', 'Plot Threads', displayThreads);
}

export async function analyzeCharacters(): Promise<void> {
  await analyzeComplexityType<CharacterInvolvement>('characters', 'Characters', displayCharacters);
}

export async function analyzeScenes(): Promise<void> {
  await analyzeComplexityType<SceneComplexity>('scenes', 'Scenes', displayScenes);
}

export async function analyzeReadability(): Promise<void> {
  await analyzeComplexityType<Readability>('readability', 'Readability', displayReadability);
}

export async function analyzeDensity(): Promise<void> {
  await analyzeComplexityType<NarrativeDensity>('density', 'Narrative Density', displayDensity);
}

export async function compareComplexity(): Promise<void> {
  const text = getText();
  const resultText = document.getElementById('resultText')?.textContent ?? '';

  if (!text.trim() || !resultText.trim()) {
    showStatus('Please perform a text operation first to have two versions to compare', 'error');
    return;
  }

  showComplexityLoading();

  try {
    const data = await apiPost('/complexity/compare', { original: text, revised: resultText });
    displayComplexityComparison(data as Record<string, unknown>);
    showStatus('Complexity comparison complete!', 'success');
  } catch (error) {
    showStatus(`Complexity comparison failed: ${(error as Error).message}`, 'error');
    hideComplexityResults();
  }
}

// --- Render helpers ---

function renderThreadsCard(threads: PlotThreadAnalysis | undefined): string {
  if (!threads) return '';
  return `
    <div class="complexity-card">
      <h4>🧵 Plot Threads</h4>
      <div class="metric">
        <span class="metric-label">Active Threads</span>
        <span class="metric-value">${threads.threads?.filter(t => t.status === 'active').length ?? 0}</span>
      </div>
      <div class="metric">
        <span class="metric-label">Thread Complexity</span>
        <span class="metric-value">${Math.round((threads.complexityScore ?? 0) * 100)}%</span>
      </div>
      <div class="metric">
        <span class="metric-label">Interweaving</span>
        <span class="metric-value">${threads.interweaving?.switchCount ?? 0} switches</span>
      </div>
    </div>
  `;
}

function renderCharactersCard(chars: CharacterInvolvement | undefined): string {
  if (!chars) return '';
  const charCount = Object.keys(chars.characters ?? {}).length;
  return `
    <div class="complexity-card">
      <h4>👥 Characters</h4>
      <div class="metric">
        <span class="metric-label">Total Characters</span>
        <span class="metric-value">${charCount}</span>
      </div>
      <div class="metric">
        <span class="metric-label">Protagonist</span>
        <span class="metric-value">${chars.roles?.protagonist ?? 'Unknown'}</span>
      </div>
      <div class="metric">
        <span class="metric-label">POV Switches</span>
        <span class="metric-value">${chars.povAnalysis?.switches ?? 0}</span>
      </div>
    </div>
  `;
}

function renderScenesCard(scenes: SceneComplexity | undefined): string {
  if (!scenes) return '';
  return `
    <div class="complexity-card">
      <h4>🎬 Scenes</h4>
      <div class="metric">
        <span class="metric-label">Scene Count</span>
        <span class="metric-value">${scenes.scenes?.length ?? 0}</span>
      </div>
      <div class="metric">
        <span class="metric-label">Setting Changes</span>
        <span class="metric-value">${scenes.settingChangeCount ?? 0}</span>
      </div>
      <div class="metric">
        <span class="metric-label">Transition Smoothness</span>
        <span class="metric-value">${Math.round((scenes.overallSmoothness ?? 0) * 100)}%</span>
      </div>
    </div>
  `;
}

function renderReadabilityCard(read: Readability | undefined): string {
  if (!read) return '';
  return `
    <div class="complexity-card">
      <h4>📖 Readability</h4>
      <div class="metric">
        <span class="metric-label">Score</span>
        <span class="metric-value">${Math.round((read.overallScore ?? 0) * 100)}%</span>
      </div>
      <div class="metric">
        <span class="metric-label">Level</span>
        <span class="metric-value">${read.readabilityLevel ?? 'Unknown'}</span>
      </div>
      <div class="metric">
        <span class="metric-label">Avg Sentence Length</span>
        <span class="metric-value">${read.avgSentenceLength?.toFixed(1) ?? 0} words</span>
      </div>
    </div>
  `;
}

function renderDensityCard(density: NarrativeDensity | undefined): string {
  if (!density) return '';
  return `
    <div class="complexity-card">
      <h4>📊 Narrative Density</h4>
      <div class="metric">
        <span class="metric-label">Ideas per Paragraph</span>
        <span class="metric-value">${density.averageDensity?.toFixed(1) ?? 0}</span>
      </div>
      <div class="metric">
        <span class="metric-label">Exposition</span>
        <span class="metric-value">${Math.round((density.contentBreakdown?.exposition ?? 0) * 100)}%</span>
      </div>
      <div class="metric">
        <span class="metric-label">Action</span>
        <span class="metric-value">${Math.round((density.contentBreakdown?.action ?? 0) * 100)}%</span>
      </div>
    </div>
  `;
}

// --- Display functions ---

function displayFullComplexityReport(data: ComplexityReport): void {
  const content = document.getElementById('complexityContent');
  if (!content) return;
  const scorePercent = Math.round((data.overallComplexity ?? 0) * 100);
  const threads = data.plotThreads ?? data.plotThreadAnalysis;

  content.innerHTML = `
    <div class="complexity-score">
      <div class="score-value">${scorePercent}%</div>
      <div class="score-label">Overall Complexity Score</div>
    </div>
    <div class="complexity-grid">
      ${renderThreadsCard(threads)}
      ${renderCharactersCard(data.characterInvolvement)}
      ${renderScenesCard(data.sceneComplexity)}
      ${renderReadabilityCard(data.readability)}
      ${renderDensityCard(data.narrativeDensity)}
    </div>
    ${data.recommendations?.length ? `
      <div class="recommendations-list">
        <h4>💡 Recommendations</h4>
        <ul>${data.recommendations.map(r => `<li>${formatRecommendation(r)}</li>`).join('')}</ul>
      </div>
    ` : ''}
  `;
  document.getElementById('complexityResults')?.classList.add('show');
}

function displayThreads(data: PlotThreadAnalysis): void {
  const content = document.getElementById('complexityContent');
  if (!content) return;
  content.innerHTML = `
    <div class="complexity-card" style="max-width: 100%;">
      <h4>🧵 Plot Threads Analysis</h4>
      <div class="metric">
        <span class="metric-label">Complexity Score</span>
        <span class="metric-value">${Math.round((data.complexityScore ?? 0) * 100)}%</span>
      </div>
      <div class="metric">
        <span class="metric-label">Thread Switches</span>
        <span class="metric-value">${data.interweaving?.switchCount ?? 0}</span>
      </div>
      <div class="thread-list" style="margin-top: 15px;">
        ${(data.threads ?? []).map(t => `
          <div class="thread-item">
            <strong>${t.name}</strong>
            <span class="thread-status ${t.status}">${t.status}</span>
            <div style="margin-top: 4px; color: #666;">${t.description}</div>
            ${t.characters?.length ? `<div style="font-size: 11px; color: #999; margin-top: 2px;">Characters: ${t.characters.join(', ')}</div>` : ''}
          </div>
        `).join('') || '<p style="color: #999;">No threads detected</p>'}
      </div>
    </div>
  `;
  document.getElementById('complexityResults')?.classList.add('show');
}

function displayCharacters(data: CharacterInvolvement): void {
  const content = document.getElementById('complexityContent');
  if (!content) return;
  const chars = Object.entries(data.characters ?? {});
  content.innerHTML = `
    <div class="complexity-card" style="max-width: 100%;">
      <h4>👥 Character Analysis</h4>
      <div class="metric">
        <span class="metric-label">Protagonist</span>
        <span class="metric-value">${data.roles?.protagonist ?? 'Unknown'}</span>
      </div>
      <div class="metric">
        <span class="metric-label">POV Switches</span>
        <span class="metric-value">${data.povAnalysis?.switches ?? 0}</span>
      </div>
      <div class="character-list" style="margin-top: 15px;">
        ${chars.map(([name, stats]) => `
          <div class="character-item">
            <strong>${name}</strong>
            <span style="float: right;">${stats.mentions} mentions (${Math.round(stats.frequency * 100)}%)</span>
          </div>
        `).join('') || '<p style="color: #999;">No characters detected</p>'}
      </div>
    </div>
  `;
  document.getElementById('complexityResults')?.classList.add('show');
}

function displayScenes(data: SceneComplexity): void {
  const content = document.getElementById('complexityContent');
  if (!content) return;
  content.innerHTML = `
    <div class="complexity-card" style="max-width: 100%;">
      <h4>🎬 Scene Analysis</h4>
      <div class="metric">
        <span class="metric-label">Total Scenes</span>
        <span class="metric-value">${data.scenes?.length ?? 0}</span>
      </div>
      <div class="metric">
        <span class="metric-label">Setting Changes</span>
        <span class="metric-value">${data.settingChangeCount ?? 0}</span>
      </div>
      <div class="metric">
        <span class="metric-label">Transition Smoothness</span>
        <span class="metric-value">${Math.round((data.overallSmoothness ?? 0) * 100)}%</span>
      </div>
      <div class="scene-list" style="margin-top: 15px;">
        ${(data.scenes ?? []).map(s => `
          <div class="scene-item">
            <strong>${s.location}</strong>
            <span style="float: right; font-size: 11px; color: #666;">
              ${Math.round(s.startPosition * 100)}% - ${Math.round(s.endPosition * 100)}%
            </span>
          </div>
        `).join('') || '<p style="color: #999;">No scenes detected</p>'}
      </div>
    </div>
  `;
  document.getElementById('complexityResults')?.classList.add('show');
}

function displayReadability(data: Readability): void {
  const content = document.getElementById('complexityContent');
  if (!content) return;
  content.innerHTML = `
    <div class="complexity-card" style="max-width: 100%;">
      <h4>📖 Readability Analysis</h4>
      <div class="metric">
        <span class="metric-label">Overall Score</span>
        <span class="metric-value">${Math.round((data.overallScore ?? 0) * 100)}%</span>
      </div>
      <div class="metric">
        <span class="metric-label">Readability Level</span>
        <span class="metric-value">${data.readabilityLevel ?? 'Unknown'}</span>
      </div>
      <div class="metric">
        <span class="metric-label">Avg Sentence Length</span>
        <span class="metric-value">${data.avgSentenceLength?.toFixed(1) ?? 0} words</span>
      </div>
      <div class="metric">
        <span class="metric-label">Vocabulary Richness</span>
        <span class="metric-value">${Math.round((data.vocabularyRichness ?? 0) * 100)}%</span>
      </div>
      <div class="metric">
        <span class="metric-label">Paragraph Count</span>
        <span class="metric-value">${data.paragraphCount ?? 0}</span>
      </div>
      ${data.recommendations?.length ? `
        <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #eee;">
          <strong style="font-size: 12px; color: #666;">Suggestions:</strong>
          <ul style="margin: 8px 0 0 0; padding-left: 20px; font-size: 12px;">
            ${data.recommendations.map(r => `<li>${formatRecommendation(r)}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
  `;
  document.getElementById('complexityResults')?.classList.add('show');
}

function displayDensity(data: NarrativeDensity): void {
  const content = document.getElementById('complexityContent');
  if (!content) return;
  content.innerHTML = `
    <div class="complexity-card" style="max-width: 100%;">
      <h4>📊 Narrative Density Analysis</h4>
      <div class="metric">
        <span class="metric-label">Average Density</span>
        <span class="metric-value">${data.averageDensity.toFixed(2)} ideas/paragraph</span>
      </div>
      <div class="metric">
        <span class="metric-label">Exposition</span>
        <span class="metric-value">${Math.round(data.contentBreakdown.exposition * 100)}%</span>
      </div>
      <div class="metric">
        <span class="metric-label">Action</span>
        <span class="metric-value">${Math.round(data.contentBreakdown.action * 100)}%</span>
      </div>
      <div class="metric">
        <span class="metric-label">Dialogue</span>
        <span class="metric-value">${Math.round(data.contentBreakdown.dialogue * 100)}%</span>
      </div>
      <div class="metric">
        <span class="metric-label">Description</span>
        <span class="metric-value">${Math.round(data.contentBreakdown.description * 100)}%</span>
      </div>
    </div>
  `;
  document.getElementById('complexityResults')?.classList.add('show');
}

function displayComplexityComparison(data: Record<string, unknown>): void {
  const content = document.getElementById('complexityContent');
  if (!content) return;
  const overallChange = (data.overallChange as number) ?? 0;
  const threadCountChange = (data.threadCountChange as number) ?? 0;
  const characterCountChange = (data.characterCountChange as number) ?? 0;
  const readabilityChange = (data.readabilityChange as number) ?? 0;
  const summary = (data.summary as string) ?? 'Complexity metrics compared';

  content.innerHTML = `
    <h4>Complexity Comparison</h4>
    <div class="metric">
      <span>Overall Change:</span>
      <span style="color: ${overallChange > 0 ? '#4CAF50' : '#f44336'}">
        ${overallChange > 0 ? '+' : ''}${Math.round(overallChange * 100)}%
      </span>
    </div>
    <div class="metric">
      <span>Thread Count Change:</span>
      <strong>${threadCountChange > 0 ? '+' : ''}${threadCountChange}</strong>
    </div>
    <div class="metric">
      <span>Character Count Change:</span>
      <strong>${characterCountChange > 0 ? '+' : ''}${characterCountChange}</strong>
    </div>
    <div class="metric">
      <span>Readability Change:</span>
      <span style="color: ${readabilityChange > 0 ? '#4CAF50' : '#f44336'}">
        ${readabilityChange > 0 ? '+' : ''}${Math.round(readabilityChange * 100)}%
      </span>
    </div>
    <p style="margin-top: 10px;"><strong>Summary:</strong> ${summary}</p>
  `;
  document.getElementById('complexityResults')?.classList.add('show');
}
