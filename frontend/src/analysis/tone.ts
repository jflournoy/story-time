// ============================================
// Tone analysis
// ============================================

import { apiPost } from '../api';
import { showStatus, showAnalysisLoading, hideAnalysisResults } from '../ui';
import type { ToneAnalysisResponse, ToneComparisonResponse, EmotionalArcResponse, ToneSegment } from '../types';

function getToneClass(sentiment: number): string {
  if (sentiment > 0.6) return 'positive';
  if (sentiment < 0.4) return 'negative';
  return 'neutral';
}

export async function analyzeTone(): Promise<void> {
  const textEl = document.getElementById('text') as HTMLTextAreaElement | null;
  const text = textEl?.value ?? '';
  if (!text.trim()) { showStatus('Please enter some text first', 'error'); return; }

  showAnalysisLoading('toneResults', 'toneContent', 'Analyzing emotional tone...');

  try {
    const data = await apiPost<ToneAnalysisResponse>('/analysis/tone', { text, granularity: 'paragraph' });
    displayToneAnalysis(data);
    showStatus('Tone analysis complete!', 'success');
  } catch (error) {
    showStatus(`Tone analysis failed: ${(error as Error).message}`, 'error');
    hideAnalysisResults('toneResults');
  }
}

export async function compareTone(): Promise<void> {
  const textEl = document.getElementById('text') as HTMLTextAreaElement | null;
  const resultTextEl = document.getElementById('resultText');
  const text = textEl?.value ?? '';
  const resultText = resultTextEl?.textContent ?? '';

  if (!text.trim() || !resultText.trim()) {
    showStatus('Please perform a text operation first to have two versions to compare', 'error');
    return;
  }

  showAnalysisLoading('toneResults', 'toneContent', 'Comparing tone...');

  try {
    const data = await apiPost<ToneComparisonResponse>('/analysis/compare', { original: text, revised: resultText });
    displayToneComparison(data);
    showStatus('Tone comparison complete!', 'success');
  } catch (error) {
    showStatus(`Tone comparison failed: ${(error as Error).message}`, 'error');
    hideAnalysisResults('toneResults');
  }
}

export async function computeEmotionalArc(): Promise<void> {
  const textEl = document.getElementById('text') as HTMLTextAreaElement | null;
  const text = textEl?.value ?? '';
  if (!text.trim()) { showStatus('Please enter some text first', 'error'); return; }

  showAnalysisLoading('toneResults', 'toneContent', 'Computing emotional arc...');

  try {
    const toneData = await apiPost<ToneAnalysisResponse>('/analysis/tone', { text, granularity: 'paragraph' });
    const segments = toneData.segments ?? toneData.sections ?? [];
    const sentiments = segments.map(seg => seg.sentiment);

    const arcData = await apiPost<EmotionalArcResponse>('/analysis/arc', { sentiments });
    displayEmotionalArc(arcData, segments);
    showStatus('Emotional arc computed!', 'success');
  } catch (error) {
    showStatus(`Emotional arc failed: ${(error as Error).message}`, 'error');
    hideAnalysisResults('toneResults');
  }
}

function displayToneAnalysis(data: ToneAnalysisResponse): void {
  const content = document.getElementById('toneContent');
  if (!content) return;
  const segments = data.segments ?? data.sections ?? [];
  content.innerHTML = `
    <h4>Overall Tone: ${data.overallTone ?? 'N/A'}</h4>
    <p><strong>Dominant Emotion:</strong> ${data.dominantEmotion ?? 'N/A'} (${Math.round((data.averageSentiment ?? 0) * 100)}%)</p>
    <div class="tone-segments">
      <h5>Segments:</h5>
      ${segments.map((seg, i) => `
        <div class="tone-segment">
          <strong>Segment ${i + 1}</strong>
          <span class="tone-value tone-${getToneClass(seg.sentiment)}">${Math.round(seg.sentiment * 100)}%</span>
          <div style="margin-top: 4px; font-size: 12px; color: #666;">${seg.text.substring(0, 100)}...</div>
        </div>
      `).join('')}
    </div>
  `;
  document.getElementById('toneResults')?.classList.add('show');
}

function displayToneComparison(data: ToneComparisonResponse): void {
  const content = document.getElementById('toneContent');
  if (!content) return;
  const change = data.sentimentChange ?? data.sentiment_shift ?? 0;
  const origTone = data.originalTone ?? data.original_tone?.tone ?? 'N/A';
  const revTone = data.revisedTone ?? data.revised_tone?.tone ?? 'N/A';
  const interp = data.interpretation ?? 'Tone shift detected';

  content.innerHTML = `
    <h4>Tone Comparison</h4>
    <div class="metric">
      <span>Sentiment Change:</span>
      <span class="tone-value tone-${change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral'}">
        ${change > 0 ? '+' : ''}${Math.round(change * 100)}%
      </span>
    </div>
    <div class="metric"><span>Original Tone:</span> <strong>${origTone}</strong></div>
    <div class="metric"><span>Revised Tone:</span> <strong>${revTone}</strong></div>
    <p style="margin-top: 10px;"><strong>Analysis:</strong> ${interp}</p>
  `;
  document.getElementById('toneResults')?.classList.add('show');
}

function displayEmotionalArc(arcData: EmotionalArcResponse, segments: ToneSegment[]): void {
  const content = document.getElementById('toneContent');
  if (!content) return;
  content.innerHTML = `
    <h4>Emotional Arc</h4>
    <div class="metric"><span>Arc Type:</span> <strong>${arcData.arcType ?? arcData.overall_trajectory ?? 'N/A'}</strong></div>
    <div class="metric"><span>Volatility:</span> <strong>${Math.round((arcData.volatility ?? 0) * 100)}%</strong></div>
    <div class="metric"><span>Trend:</span> <strong>${arcData.trend ?? 'N/A'}</strong></div>
    <div style="margin-top: 15px;">
      <h5>Emotional Journey:</h5>
      ${segments.map((seg, i) => `
        <div class="tone-segment">
          <strong>Point ${i + 1}</strong>
          <span class="tone-value tone-${getToneClass(seg.sentiment)}">${Math.round(seg.sentiment * 100)}%</span>
        </div>
      `).join('')}
    </div>
  `;
  document.getElementById('toneResults')?.classList.add('show');
}
