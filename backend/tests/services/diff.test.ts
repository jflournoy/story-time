import { describe, it, expect } from 'vitest';
import { DiffService } from '../../src/services/diff';

describe('DiffService', () => {
  const diffService = new DiffService();

  describe('computeDiff', () => {
    it('should identify identical text as no changes', () => {
      const original = 'The quick brown fox';
      const modified = 'The quick brown fox';

      const result = diffService.computeDiff(original, modified);

      expect(result.changes).toHaveLength(0);
      expect(result.similarity).toBe(1);
    });

    it('should identify additions', () => {
      const original = 'The fox';
      const modified = 'The quick brown fox';

      const result = diffService.computeDiff(original, modified);

      expect(result.changes.length).toBeGreaterThan(0);
      expect(result.changes.some(c => c.type === 'add')).toBe(true);
      expect(result.similarity).toBeLessThan(1);
    });

    it('should identify deletions', () => {
      const original = 'The quick brown fox jumps';
      const modified = 'The fox';

      const result = diffService.computeDiff(original, modified);

      expect(result.changes.length).toBeGreaterThan(0);
      expect(result.changes.some(c => c.type === 'remove')).toBe(true);
      expect(result.similarity).toBeLessThan(1);
    });

    it('should identify word changes for replacements', () => {
      const original = 'The slow brown fox';
      const modified = 'The quick brown fox';

      const result = diffService.computeDiff(original, modified);

      expect(result.changes.length).toBeGreaterThan(0);
      // Word replacement shows as remove + add, not a single replace
      expect(result.changes.some(c => c.type === 'remove' || c.type === 'add')).toBe(true);
    });

    it('should handle empty strings', () => {
      const result = diffService.computeDiff('', '');
      expect(result.changes).toHaveLength(0);
      expect(result.similarity).toBe(1);
    });

    it('should handle one empty string', () => {
      const original = 'The quick brown fox';
      const modified = '';

      const result = diffService.computeDiff(original, modified);

      expect(result.changes.some(c => c.type === 'remove')).toBe(true);
      expect(result.similarity).toBeLessThan(1);
    });

    it('should compute similarity score correctly', () => {
      const original = 'Hello world';
      const modified = 'Hello world!';

      const result = diffService.computeDiff(original, modified);

      // Similarity should be relatively high but less than 1
      expect(result.similarity).toBeGreaterThan(0.5);
      expect(result.similarity).toBeLessThan(1);
    });
  });

  describe('getLineChanges', () => {
    it('should identify line-level changes', () => {
      const original = 'Line 1\nLine 2\nLine 3';
      const modified = 'Line 1\nLine 2 modified\nLine 3';

      const result = diffService.getLineChanges(original, modified);

      // Should identify the removed and added lines
      expect(result.length).toBeGreaterThanOrEqual(3);
      expect(result.some(c => c.type === 'remove')).toBe(true);
      expect(result.some(c => c.type === 'add')).toBe(true);
    });

    it('should handle added lines', () => {
      const original = 'Line 1\nLine 3';
      const modified = 'Line 1\nLine 2\nLine 3';

      const result = diffService.getLineChanges(original, modified);

      expect(result.some(c => c.type === 'add')).toBe(true);
    });

    it('should handle removed lines', () => {
      const original = 'Line 1\nLine 2\nLine 3';
      const modified = 'Line 1\nLine 3';

      const result = diffService.getLineChanges(original, modified);

      expect(result.some(c => c.type === 'remove')).toBe(true);
    });
  });

  describe('getDeltaStats', () => {
    it('should calculate addition count', () => {
      const original = 'The fox';
      const modified = 'The quick brown fox';

      const stats = diffService.getDeltaStats(original, modified);

      expect(stats.additions).toBeGreaterThan(0);
      expect(stats.deletions).toBe(0);
    });

    it('should calculate deletion count', () => {
      const original = 'The quick brown fox jumps';
      const modified = 'The fox';

      const stats = diffService.getDeltaStats(original, modified);

      expect(stats.deletions).toBeGreaterThan(0);
      expect(stats.additions).toBeGreaterThanOrEqual(0);
    });

    it('should calculate both additions and deletions', () => {
      const original = 'The quick brown fox';
      const modified = 'The slow red fox';

      const stats = diffService.getDeltaStats(original, modified);

      expect(stats.additions).toBeGreaterThan(0);
      expect(stats.deletions).toBeGreaterThan(0);
    });

    it('should include character count delta', () => {
      const original = 'Short';
      const modified = 'This is a much longer text';

      const stats = diffService.getDeltaStats(original, modified);

      expect(stats.charDelta).toBe(modified.length - original.length);
    });
  });
});
