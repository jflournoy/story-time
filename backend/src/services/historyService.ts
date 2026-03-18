export type OperationType = 'expand' | 'refine' | 'revise' | 'restructure' | 'synopsis';

export interface HistoryEntry {
  id: string;
  type: OperationType;
  originalText: string;
  resultText: string;
  synopsis?: string;
  timestamp: string;
}

export interface HistoryRecordOptions {
  type: OperationType;
  originalText: string;
  resultText: string;
  synopsis?: string;
}

/**
 * HistoryService manages the history of text operations performed on user content.
 * Allows users to track, retrieve, and manage their editing operations.
 */
export class HistoryService {
  private history: HistoryEntry[] = [];

  /**
   * Record a new operation in history
   */
  recordOperation(options: HistoryRecordOptions): HistoryEntry {
    const entry: HistoryEntry = {
      id: this.generateId(),
      type: options.type,
      originalText: options.originalText,
      resultText: options.resultText,
      synopsis: options.synopsis,
      timestamp: new Date().toISOString(),
    };

    this.history.push(entry);
    return entry;
  }

  /**
   * Get all recorded operations
   */
  getHistory(): HistoryEntry[] {
    return [...this.history];
  }

  /**
   * Get a specific operation by ID
   */
  getOperationById(id: string): HistoryEntry | undefined {
    return this.history.find((entry) => entry.id === id);
  }

  /**
   * Get operations filtered by type
   */
  getHistoryByType(type: OperationType): HistoryEntry[] {
    return this.history.filter((entry) => entry.type === type);
  }

  /**
   * Get the most recent N operations
   */
  getRecentHistory(limit: number): HistoryEntry[] {
    return this.history.slice(-limit);
  }

  /**
   * Clear all history
   */
  clearHistory(): void {
    this.history = [];
  }

  /**
   * Remove a specific operation by ID
   */
  removeOperation(id: string): boolean {
    const initialLength = this.history.length;
    this.history = this.history.filter((entry) => entry.id !== id);
    return this.history.length < initialLength;
  }

  /**
   * Get total operation count
   */
  getOperationCount(): number {
    return this.history.length;
  }

  /**
   * Get operation count by type
   */
  getOperationCountByType(type: OperationType): number {
    return this.history.filter((entry) => entry.type === type).length;
  }

  /**
   * Get summary of all operation types and their counts
   */
  getHistorySummary(): Record<OperationType, number> {
    const summary: Record<OperationType, number> = {
      expand: 0,
      refine: 0,
      revise: 0,
      restructure: 0,
      synopsis: 0,
    };

    this.history.forEach((entry) => {
      summary[entry.type]++;
    });

    return summary;
  }

  /**
   * Export history as JSON string
   */
  exportAsJSON(): string {
    return JSON.stringify(this.history, null, 2);
  }

  /**
   * Import history from JSON string
   */
  importFromJSON(json: string): void {
    try {
      const data = JSON.parse(json) as HistoryEntry[];
      if (Array.isArray(data)) {
        this.history = data;
      }
    } catch (error) {
      console.error('Failed to import history from JSON:', error);
    }
  }

  /**
   * Generate unique ID for history entry
   */
  private generateId(): string {
    return `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
