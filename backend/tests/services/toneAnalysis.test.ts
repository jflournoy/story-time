import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { LLMProvider } from '../../src/providers/llm-provider';
import { ToneAnalysisService } from '../../src/services/toneAnalysisService';

describe('ToneAnalysisService', () => {
  let service: ToneAnalysisService;
  let mockProvider: LLMProvider;

  beforeEach(() => {
    mockProvider = {
      expand: vi.fn(),
      refine: vi.fn(),
      revise: vi.fn(),
      restructure: vi.fn(),
      generateSynopsis: vi.fn(),
      healthCheck: vi.fn().mockResolvedValue(true),
    };

    service = new ToneAnalysisService(mockProvider);
  });

  describe('analyzeTone', () => {
    it('should analyze emotional tone of text by paragraphs', async () => {
      const text = 'This is a happy moment.\n\nSadness overwhelms me.\n\nHope returns.';

      vi.mocked(mockProvider.expand)
        .mockResolvedValueOnce('sad, -0.4, sadness')
        .mockResolvedValueOnce('happy, 0.8, joy')
        .mockResolvedValueOnce('hopeful, 0.6, hope');

      const result = await service.analyzeTone(text, 'paragraph');

      expect(result.sections).toHaveLength(3);
      expect(result.sections[0]).toMatchObject({
        tone: expect.any(String),
        sentiment: expect.any(Number),
        emotions: expect.any(Array),
      });
    });

    it('should support scene-level granularity', async () => {
      const text = 'Scene 1: Beginning.\nScene 2: Middle.\nScene 3: End.';

      vi.mocked(mockProvider.expand)
        .mockResolvedValueOnce('neutral, 0.0, calm')
        .mockResolvedValueOnce('tense, -0.3, anxiety')
        .mockResolvedValueOnce('resolved, 0.5, relief');

      const result = await service.analyzeTone(text, 'scene');

      expect(result.sections).toHaveLength(3);
    });

    it('should calculate narrative arc from tone progression', async () => {
      const text = 'Happy start.\n\nGrowing tension.\n\nCathartic resolution.';

      vi.mocked(mockProvider.expand)
        .mockResolvedValueOnce('happy, 0.8, joy')
        .mockResolvedValueOnce('angry, -0.7, anger')
        .mockResolvedValueOnce('joyful, 0.9, joy');

      const result = await service.analyzeTone(text, 'paragraph');

      expect(result.arc).toBeDefined();
      expect(result.arc.overall_trajectory).toMatch(/ascending|descending|mixed/);
      expect(result.arc.peak_at).toBeGreaterThanOrEqual(0);
      expect(result.arc.peak_at).toBeLessThanOrEqual(1);
      expect(result.arc.variance).toBeGreaterThanOrEqual(0);
    });

    it('should detect tone consistency across narrative', async () => {
      const text = 'Very happy.\nVery happy.\nVery happy.';

      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'happy, 0.9\nhappy, 0.85\nhappy, 0.88'
      );

      const result = await service.analyzeTone(text, 'paragraph');

      expect(result.arc.variance).toBeLessThan(0.1);
    });

    it('should handle complex emotional shifts', async () => {
      const text = 'Happy times.\n\nSad moments.\n\nJoyful again.';

      vi.mocked(mockProvider.expand)
        .mockResolvedValueOnce('happy, 0.8, joy|excitement')
        .mockResolvedValueOnce('sad, -0.6, sadness|loss')
        .mockResolvedValueOnce('happy, 0.7, relief|joy');

      const result = await service.analyzeTone(text, 'paragraph');

      expect(result.sections[0].emotions).toContain('joy');
      expect(result.sections[1].emotions).toContain('sadness');
    });
  });

  describe('compareTone', () => {
    it('should detect tone changes between two versions of text', async () => {
      const original = 'This is sad.';
      const revised = 'This is happy!';

      vi.mocked(mockProvider.expand)
        .mockResolvedValueOnce('sad, -0.6, sadness')
        .mockResolvedValueOnce('happy, 0.8, joy');

      const comparison = await service.compareTone(original, revised);

      expect(comparison.original_tone).toEqual(expect.objectContaining({
        tone: expect.any(String),
        sentiment: expect.any(Number),
      }));
      expect(comparison.revised_tone).toEqual(expect.objectContaining({
        tone: expect.any(String),
        sentiment: expect.any(Number),
      }));
      expect(comparison.sentiment_shift).toBeGreaterThan(0);
    });

    it('should identify emotional direction of changes', async () => {
      const original = 'Angry tone throughout.';
      const revised = 'Calm and peaceful.';

      vi.mocked(mockProvider.expand)
        .mockResolvedValueOnce('angry, -0.8, anger|rage')
        .mockResolvedValueOnce('calm, 0.7, peace|tranquility');

      const comparison = await service.compareTone(original, revised);

      expect(comparison.sentiment_shift).toBeGreaterThan(0);
      expect(comparison.shift_direction).toBe('positive');
    });
  });

  describe('getEmotionalArc', () => {
    it('should compute emotional trajectory metrics', async () => {
      const sentiments = [0.2, 0.4, 0.7, 0.5, 0.8];

      const arc = service.getEmotionalArc(sentiments);

      expect(arc.overall_trajectory).toBeDefined();
      expect(arc.peak_at).toBeDefined();
      expect(arc.valley_at).toBeDefined();
      expect(arc.variance).toBeGreaterThan(0);
      expect(arc.volatility).toBeGreaterThanOrEqual(0);
    });

    it('should identify ascending narrative arc', () => {
      const sentiments = [0.1, 0.3, 0.5, 0.7, 0.9];

      const arc = service.getEmotionalArc(sentiments);

      expect(arc.overall_trajectory).toBe('ascending');
    });

    it('should identify descending narrative arc', () => {
      const sentiments = [0.9, 0.7, 0.5, 0.3, 0.1];

      const arc = service.getEmotionalArc(sentiments);

      expect(arc.overall_trajectory).toBe('descending');
    });

    it('should identify mixed narrative arc with turning points', () => {
      const sentiments = [0.2, 0.8, 0.3, 0.9, 0.4];

      const arc = service.getEmotionalArc(sentiments);

      expect(arc.overall_trajectory).toBe('mixed');
      expect(arc.turning_points).toBeDefined();
      expect(arc.turning_points!.length).toBeGreaterThan(0);
    });
  });

  describe('extractEmotions', () => {
    it('should extract distinct emotions from tone analysis', async () => {
      const text = 'I am happy and sad at the same time.';

      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'mixed, 0.0, joy|sadness|confusion'
      );

      const result = await service.analyzeTone(text, 'paragraph');

      expect(result.sections[0].emotions).toEqual(expect.arrayContaining(['joy', 'sadness']));
    });

    it('should rank emotions by intensity', () => {
      const emotionString = 'anger:0.9, frustration:0.7, annoyance:0.5';

      const emotions = service.parseEmotions(emotionString);

      expect(emotions[0]).toBe('anger');
      expect(emotions.length).toBeGreaterThan(0);
    });
  });

  describe('integration with sessions', () => {
    it('should analyze tone for a session iteration', async () => {
      const sessionId = 'test-session-123';
      const text = 'Narrative content.';

      vi.mocked(mockProvider.expand).mockResolvedValueOnce('neutral, 0.1, calm');

      const result = await service.analyzeTone(text, 'paragraph');

      expect(result).toBeDefined();
      expect(result.sections).toBeDefined();
    });
  });
});
