import { describe, it, expect, beforeEach } from 'vitest';
import { HistoryService, HistoryEntry } from '../../src/services/historyService';

describe('HistoryService', () => {
  let historyService: HistoryService;

  beforeEach(() => {
    historyService = new HistoryService();
  });

  describe('Recording Operations', () => {
    it('should record a text operation with timestamp', () => {
      const operation = {
        type: 'expand',
        originalText: 'The house was old.',
        resultText: 'The ancient house stood weathered and worn.',
        synopsis: 'A story about an old house',
      };

      const entry = historyService.recordOperation(operation);

      expect(entry).toHaveProperty('id');
      expect(entry.type).toBe('expand');
      expect(entry.originalText).toBe(operation.originalText);
      expect(entry.resultText).toBe(operation.resultText);
      expect(entry.timestamp).toBeDefined();
      expect(new Date(entry.timestamp).getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should generate unique IDs for each operation', () => {
      const operation1 = historyService.recordOperation({
        type: 'expand',
        originalText: 'Text 1',
        resultText: 'Expanded text 1',
      });

      const operation2 = historyService.recordOperation({
        type: 'refine',
        originalText: 'Text 2',
        resultText: 'Refined text 2',
      });

      expect(operation1.id).not.toBe(operation2.id);
    });

    it('should store synopsis if provided', () => {
      const synopsis = 'A narrative about adventure';
      const entry = historyService.recordOperation({
        type: 'expand',
        originalText: 'Beginning',
        resultText: 'Beginning of the adventure',
        synopsis,
      });

      expect(entry.synopsis).toBe(synopsis);
    });
  });

  describe('Retrieving History', () => {
    it('should retrieve all recorded operations in order', () => {
      historyService.recordOperation({
        type: 'expand',
        originalText: 'Text 1',
        resultText: 'Expanded 1',
      });

      historyService.recordOperation({
        type: 'refine',
        originalText: 'Text 2',
        resultText: 'Refined 2',
      });

      const history = historyService.getHistory();

      expect(history).toHaveLength(2);
      expect(history[0].type).toBe('expand');
      expect(history[1].type).toBe('refine');
    });

    it('should return empty array when no operations recorded', () => {
      const history = historyService.getHistory();
      expect(history).toEqual([]);
    });

    it('should retrieve a specific operation by ID', () => {
      const entry = historyService.recordOperation({
        type: 'expand',
        originalText: 'Original',
        resultText: 'Expanded',
      });

      const retrieved = historyService.getOperationById(entry.id);

      expect(retrieved).toEqual(entry);
    });

    it('should return undefined for non-existent operation ID', () => {
      const retrieved = historyService.getOperationById('non-existent-id');
      expect(retrieved).toBeUndefined();
    });

    it('should retrieve operations filtered by type', () => {
      historyService.recordOperation({
        type: 'expand',
        originalText: 'Text 1',
        resultText: 'Expanded 1',
      });

      historyService.recordOperation({
        type: 'refine',
        originalText: 'Text 2',
        resultText: 'Refined 2',
      });

      historyService.recordOperation({
        type: 'expand',
        originalText: 'Text 3',
        resultText: 'Expanded 3',
      });

      const expandOps = historyService.getHistoryByType('expand');

      expect(expandOps).toHaveLength(2);
      expect(expandOps.every((op) => op.type === 'expand')).toBe(true);
    });

    it('should retrieve recent history with limit', () => {
      for (let i = 0; i < 10; i++) {
        historyService.recordOperation({
          type: 'expand',
          originalText: `Text ${i}`,
          resultText: `Expanded ${i}`,
        });
      }

      const recent = historyService.getRecentHistory(5);

      expect(recent).toHaveLength(5);
      expect(recent[0].originalText).toBe('Text 5');
      expect(recent[4].originalText).toBe('Text 9');
    });
  });

  describe('Clearing History', () => {
    it('should clear all history', () => {
      historyService.recordOperation({
        type: 'expand',
        originalText: 'Text',
        resultText: 'Expanded',
      });

      historyService.recordOperation({
        type: 'refine',
        originalText: 'Text',
        resultText: 'Refined',
      });

      historyService.clearHistory();

      expect(historyService.getHistory()).toHaveLength(0);
    });

    it('should clear specific operation by ID', () => {
      const entry1 = historyService.recordOperation({
        type: 'expand',
        originalText: 'Text 1',
        resultText: 'Expanded 1',
      });

      historyService.recordOperation({
        type: 'refine',
        originalText: 'Text 2',
        resultText: 'Refined 2',
      });

      historyService.removeOperation(entry1.id);

      expect(historyService.getHistory()).toHaveLength(1);
      expect(historyService.getHistory()[0].type).toBe('refine');
    });

    it('should return true when removing existing operation', () => {
      const entry = historyService.recordOperation({
        type: 'expand',
        originalText: 'Text',
        resultText: 'Expanded',
      });

      const removed = historyService.removeOperation(entry.id);

      expect(removed).toBe(true);
    });

    it('should return false when removing non-existent operation', () => {
      const removed = historyService.removeOperation('non-existent');
      expect(removed).toBe(false);
    });
  });

  describe('History Statistics', () => {
    it('should get operation count', () => {
      historyService.recordOperation({
        type: 'expand',
        originalText: 'Text',
        resultText: 'Expanded',
      });

      historyService.recordOperation({
        type: 'refine',
        originalText: 'Text',
        resultText: 'Refined',
      });

      expect(historyService.getOperationCount()).toBe(2);
    });

    it('should get count by operation type', () => {
      historyService.recordOperation({
        type: 'expand',
        originalText: 'Text',
        resultText: 'Expanded',
      });

      historyService.recordOperation({
        type: 'expand',
        originalText: 'Text',
        resultText: 'Expanded',
      });

      historyService.recordOperation({
        type: 'refine',
        originalText: 'Text',
        resultText: 'Refined',
      });

      const expandCount = historyService.getOperationCountByType('expand');
      const refineCount = historyService.getOperationCountByType('refine');

      expect(expandCount).toBe(2);
      expect(refineCount).toBe(1);
    });

    it('should get summary of all operation types', () => {
      historyService.recordOperation({
        type: 'expand',
        originalText: 'Text',
        resultText: 'Expanded',
      });

      historyService.recordOperation({
        type: 'expand',
        originalText: 'Text',
        resultText: 'Expanded',
      });

      historyService.recordOperation({
        type: 'refine',
        originalText: 'Text',
        resultText: 'Refined',
      });

      const summary = historyService.getHistorySummary();

      expect(summary.expand).toBe(2);
      expect(summary.refine).toBe(1);
      expect(summary.revise).toBe(0);
      expect(summary.restructure).toBe(0);
      expect(summary.synopsis).toBe(0);
    });
  });

  describe('History Serialization', () => {
    it('should export history as JSON', () => {
      historyService.recordOperation({
        type: 'expand',
        originalText: 'Text 1',
        resultText: 'Expanded 1',
        synopsis: 'Story synopsis',
      });

      const json = historyService.exportAsJSON();
      const parsed = JSON.parse(json);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed[0].type).toBe('expand');
      expect(parsed[0].synopsis).toBe('Story synopsis');
    });

    it('should import history from JSON', () => {
      const historyData = [
        {
          id: 'test-id-1',
          type: 'expand',
          originalText: 'Original',
          resultText: 'Expanded',
          timestamp: new Date().toISOString(),
          synopsis: 'Test synopsis',
        },
      ];

      const newService = new HistoryService();
      newService.importFromJSON(JSON.stringify(historyData));

      expect(newService.getHistory()).toHaveLength(1);
      expect(newService.getHistory()[0].type).toBe('expand');
    });
  });
});
