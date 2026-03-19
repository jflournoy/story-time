// ============================================
// Cross-module shared state
// ============================================

let currentSessionId: string | null = null;
let lastResultText: string = '';

export function getSessionId(): string | null {
  return currentSessionId;
}

export function setSessionId(id: string | null): void {
  currentSessionId = id;
}

export function getLastResult(): string {
  return lastResultText;
}

export function setLastResult(text: string): void {
  lastResultText = text;
}
