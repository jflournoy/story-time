// ============================================
// Timeline analysis
// ============================================

import { apiPost } from '../api';
import { showStatus, showAnalysisLoading, hideAnalysisResults } from '../ui';
import type { TimelineEvent, TimelineResponse, PacingResponse, TimelineComparison } from '../types';

function getStructureDescription(structure: string): string {
  const descriptions: Record<string, string> = {
    linear: 'Events unfold chronologically from beginning to end.',
    'non-linear': 'Timeline includes flashbacks, flash-forwards, or parallel narratives.',
    circular: 'Narrative ends where it began, creating a cyclical structure.',
    fragmented: 'Story told in disconnected pieces or vignettes.',
  };
  return descriptions[structure] ?? 'Structure pattern identified in the narrative.';
}

export async function extractEvents(): Promise<void> {
  const textEl = document.getElementById('text') as HTMLTextAreaElement | null;
  const text = textEl?.value ?? '';
  if (!text.trim()) { showStatus('Please enter some text first', 'error'); return; }

  showAnalysisLoading('timelineResults', 'timelineContent', 'Extracting events...');

  try {
    const data = await apiPost<{ events: TimelineEvent[] }>('/timeline/events', { text });
    displayEvents(data.events);
    showStatus('Events extracted!', 'success');
  } catch (error) {
    showStatus(`Event extraction failed: ${(error as Error).message}`, 'error');
    hideAnalysisResults('timelineResults');
  }
}

export async function buildTimeline(): Promise<void> {
  const textEl = document.getElementById('text') as HTMLTextAreaElement | null;
  const text = textEl?.value ?? '';
  if (!text.trim()) { showStatus('Please enter some text first', 'error'); return; }

  showAnalysisLoading('timelineResults', 'timelineContent', 'Building timeline...');

  try {
    const data = await apiPost<TimelineResponse>('/timeline/build', { text });
    displayTimeline(data);
    showStatus('Timeline built!', 'success');
  } catch (error) {
    showStatus(`Timeline build failed: ${(error as Error).message}`, 'error');
    hideAnalysisResults('timelineResults');
  }
}

export async function analyzePacing(): Promise<void> {
  const textEl = document.getElementById('text') as HTMLTextAreaElement | null;
  const text = textEl?.value ?? '';
  if (!text.trim()) { showStatus('Please enter some text first', 'error'); return; }

  showAnalysisLoading('timelineResults', 'timelineContent', 'Analyzing pacing...');

  try {
    const data = await apiPost<PacingResponse>('/timeline/pacing', { text });
    displayPacing(data);
    showStatus('Pacing analyzed!', 'success');
  } catch (error) {
    showStatus(`Pacing analysis failed: ${(error as Error).message}`, 'error');
    hideAnalysisResults('timelineResults');
  }
}

export async function detectStructure(): Promise<void> {
  const textEl = document.getElementById('text') as HTMLTextAreaElement | null;
  const text = textEl?.value ?? '';
  if (!text.trim()) { showStatus('Please enter some text first', 'error'); return; }

  showAnalysisLoading('timelineResults', 'timelineContent', 'Detecting narrative structure...');

  try {
    const data = await apiPost<{ structure: string }>('/timeline/structure', { text });
    displayStructure(data.structure);
    showStatus('Narrative structure detected!', 'success');
  } catch (error) {
    showStatus(`Structure detection failed: ${(error as Error).message}`, 'error');
    hideAnalysisResults('timelineResults');
  }
}

export async function compareTimelines(): Promise<void> {
  const textEl = document.getElementById('text') as HTMLTextAreaElement | null;
  const resultTextEl = document.getElementById('resultText');
  const text = textEl?.value ?? '';
  const resultText = resultTextEl?.textContent ?? '';

  if (!text.trim() || !resultText.trim()) {
    showStatus('Please perform a text operation first to have two versions to compare', 'error');
    return;
  }

  showAnalysisLoading('timelineResults', 'timelineContent', 'Comparing timelines...');

  try {
    const data = await apiPost<TimelineComparison>('/timeline/compare', { original: text, revised: resultText });
    displayTimelineComparison(data);
    showStatus('Timeline comparison complete!', 'success');
  } catch (error) {
    showStatus(`Timeline comparison failed: ${(error as Error).message}`, 'error');
    hideAnalysisResults('timelineResults');
  }
}

export function displayEvents(events: TimelineEvent[]): string {
  const content = document.getElementById('timelineContent');
  const html = `
    <h4>Extracted Events (${events.length})</h4>
    <div class="event-list">
      ${events.map((event, i) => `
        <div class="event-item">
          <div class="event-description"><strong>Event ${i + 1}:</strong> ${event.description}</div>
          <div class="event-details">
            Position: ${Math.round((event.temporalPosition ?? event.position ?? 0) * 100)}% |
            Participants: ${(event.characters?.join(', ') || event.participants?.join(', ')) ?? 'Unknown'}
            ${event.temporalMarker ?? event.timeIndicator ? `<br>Time: ${event.temporalMarker ?? event.timeIndicator}` : ''}
          </div>
        </div>
      `).join('') || '<p style="color: #999;">No events found</p>'}
    </div>
  `;
  if (content) {
    content.innerHTML = html;
    document.getElementById('timelineResults')?.classList.add('show');
  }
  return html;
}

function displayTimeline(data: TimelineResponse): void {
  const content = document.getElementById('timelineContent');
  if (!content) return;
  const density = data.pacing?.eventDensity ?? data.eventDensity ?? 0;
  content.innerHTML = `
    <h4>Complete Timeline</h4>
    <div class="metric"><span>Structure:</span> <strong>${data.structure}</strong></div>
    <div class="metric"><span>Total Events:</span> <strong>${data.events.length}</strong></div>
    <div class="metric"><span>Event Density:</span> <strong>${density.toFixed(2)} events per segment</strong></div>
    <div style="margin-top: 15px;">
      <h5>Timeline:</h5>
      ${displayEvents(data.events)}
    </div>
  `;
  document.getElementById('timelineResults')?.classList.add('show');
}

function displayPacing(data: PacingResponse): void {
  const content = document.getElementById('timelineContent');
  if (!content) return;
  content.innerHTML = `
    <h4>Pacing Analysis</h4>
    <div class="metric"><span>Overall Pace:</span> <strong>${data.overallPace ?? 'N/A'}</strong></div>
    <div class="metric"><span>Event Density:</span> <strong>${data.eventDensity.toFixed(2)}</strong></div>
    <div class="metric"><span>Pacing Variance:</span> <strong>${(data.pacingVariance ?? 0).toFixed(2)}</strong></div>
    ${data.recommendations?.length ? `
      <div style="margin-top: 15px;">
        <h5>Recommendations:</h5>
        <ul>${data.recommendations.map(r => `<li>${r}</li>`).join('')}</ul>
      </div>
    ` : ''}
  `;
  document.getElementById('timelineResults')?.classList.add('show');
}

function displayStructure(structure: string): void {
  const content = document.getElementById('timelineContent');
  if (!content) return;
  content.innerHTML = `
    <h4>Narrative Structure</h4>
    <div class="metric"><span>Detected Structure:</span> <strong>${structure}</strong></div>
    <p style="margin-top: 10px; font-size: 13px; color: #666;">${getStructureDescription(structure)}</p>
  `;
  document.getElementById('timelineResults')?.classList.add('show');
}

function displayTimelineComparison(data: TimelineComparison): void {
  const content = document.getElementById('timelineContent');
  if (!content) return;
  const pacingChange = typeof data.pacingChange === 'object'
    ? data.pacingChange.densityDelta
    : (data as TimelineComparison & { pacingChange: number }).pacingChange ?? 0;

  content.innerHTML = `
    <h4>Timeline Comparison</h4>
    <div style="margin-top: 15px;">
      <h5 style="color: #4CAF50;">➕ Added Events (${data.addedEvents.length})</h5>
      <div class="event-list">
        ${data.addedEvents.map(e => `<div class="event-item"><div class="event-description">${e.description}</div></div>`).join('') || '<p style="color: #999;">None</p>'}
      </div>
    </div>
    <div style="margin-top: 15px;">
      <h5 style="color: #f44336;">➖ Removed Events (${data.removedEvents.length})</h5>
      <div class="event-list">
        ${data.removedEvents.map(e => `<div class="event-item"><div class="event-description">${e.description}</div></div>`).join('') || '<p style="color: #999;">None</p>'}
      </div>
    </div>
    <div class="metric">
      <span>Pacing Change:</span>
      <strong>${pacingChange > 0 ? '+' : ''}${(pacingChange as number).toFixed(2)}</strong>
    </div>
  `;
  document.getElementById('timelineResults')?.classList.add('show');
}
