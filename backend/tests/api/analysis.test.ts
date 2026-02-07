import { describe, it, expect, beforeEach, vi } from 'vitest';
import express, { Express } from 'express';
import request from 'supertest';
import { ToneAnalysisService } from '../../src/services/toneAnalysisService';
import type { LLMProvider } from '../../src/providers/llm-provider';
import { analysisRouter } from '../../src/api/analysis';

describe('Analysis API', () => {
  let app: Express;
  let mockProvider: LLMProvider;
  let analysisService: ToneAnalysisService;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    mockProvider = {
      expand: vi.fn(),
      refine: vi.fn(),
      revise: vi.fn(),
      restructure: vi.fn(),
      generateSynopsis: vi.fn(),
      healthCheck: vi.fn().mockResolvedValue(true),
    };

    analysisService = new ToneAnalysisService(mockProvider);
    app.use('/api/analysis', analysisRouter(analysisService));
  });

  describe('POST /api/analysis/tone', () => {
    it('should analyze tone of provided text', async () => {
      vi.mocked(mockProvider.expand)
        .mockResolvedValueOnce('happy, 0.8, joy')
        .mockResolvedValueOnce('sad, -0.5, sadness');

      const response = await request(app)
        .post('/api/analysis/tone')
        .send({
          text: 'Happy text.\n\nSad text.',
          granularity: 'paragraph',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('sections');
      expect(response.body).toHaveProperty('arc');
      expect(response.body.sections).toHaveLength(2);
    });

    it('should support different granularities', async () => {
      vi.mocked(mockProvider.expand).mockResolvedValue('neutral, 0.1, calm');

      const response = await request(app)
        .post('/api/analysis/tone')
        .send({
          text: 'Some narrative content.',
          granularity: 'scene',
        });

      expect(response.status).toBe(200);
      expect(response.body.sections).toBeDefined();
    });

    it('should return 400 for missing text', async () => {
      const response = await request(app)
        .post('/api/analysis/tone')
        .send({
          granularity: 'paragraph',
        });

      expect(response.status).toBe(400);
    });

    it('should default to paragraph granularity', async () => {
      vi.mocked(mockProvider.expand).mockResolvedValue('happy, 0.8, joy');

      const response = await request(app)
        .post('/api/analysis/tone')
        .send({
          text: 'Just some text.',
        });

      expect(response.status).toBe(200);
    });

    it('should include emotional arc in response', async () => {
      vi.mocked(mockProvider.expand)
        .mockResolvedValueOnce('happy, 0.8, joy')
        .mockResolvedValueOnce('sad, -0.6, sadness')
        .mockResolvedValueOnce('happy, 0.7, joy');

      const response = await request(app)
        .post('/api/analysis/tone')
        .send({
          text: 'Happy.\n\nSad.\n\nHappy again.',
          granularity: 'paragraph',
        });

      expect(response.body.arc).toHaveProperty('overall_trajectory');
      expect(response.body.arc).toHaveProperty('peak_at');
      expect(response.body.arc).toHaveProperty('variance');
    });

    it('should handle LLM provider errors gracefully', async () => {
      vi.mocked(mockProvider.expand).mockRejectedValueOnce(
        new Error('LLM service unavailable')
      );

      const response = await request(app)
        .post('/api/analysis/tone')
        .send({
          text: 'Some text.',
        });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/analysis/compare', () => {
    it('should compare tone between two versions', async () => {
      vi.mocked(mockProvider.expand)
        .mockResolvedValueOnce('sad, -0.6, sadness')
        .mockResolvedValueOnce('happy, 0.8, joy');

      const response = await request(app)
        .post('/api/analysis/compare')
        .send({
          original: 'This is sad.',
          revised: 'This is happy!',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('original_tone');
      expect(response.body).toHaveProperty('revised_tone');
      expect(response.body).toHaveProperty('sentiment_shift');
      expect(response.body).toHaveProperty('shift_direction');
    });

    it('should detect positive sentiment shift', async () => {
      vi.mocked(mockProvider.expand)
        .mockResolvedValueOnce('sad, -0.6, sadness')
        .mockResolvedValueOnce('happy, 0.8, joy');

      const response = await request(app)
        .post('/api/analysis/compare')
        .send({
          original: 'Sad text.',
          revised: 'Happy text!',
        });

      expect(response.body.sentiment_shift).toBeGreaterThan(0);
      expect(response.body.shift_direction).toBe('positive');
    });

    it('should detect negative sentiment shift', async () => {
      vi.mocked(mockProvider.expand)
        .mockResolvedValueOnce('happy, 0.8, joy')
        .mockResolvedValueOnce('angry, -0.8, anger');

      const response = await request(app)
        .post('/api/analysis/compare')
        .send({
          original: 'Happy text.',
          revised: 'Angry text!',
        });

      expect(response.body.sentiment_shift).toBeLessThan(0);
      expect(response.body.shift_direction).toBe('negative');
    });

    it('should return 400 if missing original or revised', async () => {
      const response = await request(app)
        .post('/api/analysis/compare')
        .send({
          original: 'Some text.',
        });

      expect(response.status).toBe(400);
    });

    it('should track emotional changes', async () => {
      vi.mocked(mockProvider.expand)
        .mockResolvedValueOnce('sad, -0.5, sadness|loss')
        .mockResolvedValueOnce('happy, 0.7, joy|relief');

      const response = await request(app)
        .post('/api/analysis/compare')
        .send({
          original: 'Sad story.',
          revised: 'Happy ending!',
        });

      expect(response.body).toHaveProperty('emotional_changes');
      expect(Array.isArray(response.body.emotional_changes)).toBe(true);
    });
  });

  describe('POST /api/analysis/arc', () => {
    it('should compute emotional arc from sentiment array', async () => {
      const response = await request(app)
        .post('/api/analysis/arc')
        .send({
          sentiments: [0.2, 0.4, 0.7, 0.5, 0.8],
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('overall_trajectory');
      expect(response.body).toHaveProperty('peak_at');
      expect(response.body).toHaveProperty('variance');
      expect(response.body).toHaveProperty('volatility');
    });

    it('should identify ascending arc', async () => {
      const response = await request(app)
        .post('/api/analysis/arc')
        .send({
          sentiments: [0.1, 0.3, 0.5, 0.7, 0.9],
        });

      expect(response.body.overall_trajectory).toBe('ascending');
    });

    it('should identify descending arc', async () => {
      const response = await request(app)
        .post('/api/analysis/arc')
        .send({
          sentiments: [0.9, 0.7, 0.5, 0.3, 0.1],
        });

      expect(response.body.overall_trajectory).toBe('descending');
    });

    it('should return 400 for invalid input', async () => {
      const response = await request(app)
        .post('/api/analysis/arc')
        .send({
          sentiments: 'not an array',
        });

      expect(response.status).toBe(400);
    });
  });
});
