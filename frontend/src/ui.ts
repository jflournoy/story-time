// ============================================
// UI utility functions
// ============================================

export function showStatus(message: string, type: 'success' | 'error'): void {
  const status = document.getElementById('status');
  if (!status) return;
  status.textContent = message;
  status.style.background = type === 'error' ? '#f44336' : '#4CAF50';
  status.classList.add('show');

  setTimeout(() => {
    status.classList.remove('show');
  }, 3000);
}

export function showAnalysisLoading(resultsId: string, contentId: string, message: string): void {
  const results = document.getElementById(resultsId);
  const content = document.getElementById(contentId);
  if (!results || !content) return;
  content.innerHTML = `<p style="text-align: center; color: #666;">⏳ ${message}</p>`;
  results.classList.add('show');
}

export function hideAnalysisResults(resultsId: string): void {
  document.getElementById(resultsId)?.classList.remove('show');
}

export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function downloadContent(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
