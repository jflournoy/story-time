import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';

// Create mock functions that will be shared
const mockExpand = vi.fn();
const mockRefine = vi.fn();
const mockRevise = vi.fn();
const mockRestructure = vi.fn();
const mockGenerateSynopsis = vi.fn();

// Mock the LLMService before importing the router
vi.mock('../../src/services/llmService', () => {
  return {
    LLMService: vi.fn().mockImplementation(() => ({
      expand: mockExpand,
      refine: mockRefine,
      revise: mockRevise,
      restructure: mockRestructure,
      generateSynopsis: mockGenerateSynopsis,
    })),
  };
});

// Import router after mocking
const { textOperationsRouter } = await import('../../src/api/textOperations');

describe('Text Operations API', () => {
  let app: Express;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create Express app for testing
    app = express();
    app.use(express.json());
    app.use('/api/text', textOperationsRouter);
  });

  describe('POST /api/text/expand', () => {
    it('should expand text successfully', async () => {
      const inputText = 'The house was old.';
      const expandedText = 'The ancient house stood weathered and worn.';

      mockExpand.mockResolvedValue(expandedText);

      const response = await request(app)
        .post('/api/text/expand')
        .send({ text: inputText })
        .expect(200);

      expect(response.body).toEqual({
        operation: 'expand',
        result: expandedText,
      });
      expect(mockExpand).toHaveBeenCalledWith(inputText, undefined);
    });

    it('should expand text with synopsis', async () => {
      const inputText = 'The house was old.';
      const synopsis = 'A gothic horror tale.';
      const expandedText = 'The ominous house loomed, decrepit and foreboding.';

      mockExpand.mockResolvedValue(expandedText);

      const response = await request(app)
        .post('/api/text/expand')
        .send({ text: inputText, synopsis })
        .expect(200);

      expect(response.body).toEqual({
        operation: 'expand',
        result: expandedText,
      });
      expect(mockExpand).toHaveBeenCalledWith(inputText, synopsis);
    });

    it('should return 400 if text is missing', async () => {
      const response = await request(app)
        .post('/api/text/expand')
        .send({})
        .expect(400);

      expect(response.body).toEqual({
        error: 'Text is required',
      });
      expect(mockExpand).not.toHaveBeenCalled();
    });

    it('should return 400 if text is empty string', async () => {
      const response = await request(app)
        .post('/api/text/expand')
        .send({ text: '' })
        .expect(400);

      expect(response.body).toEqual({
        error: 'Text is required',
      });
    });

    it('should return 500 on service error', async () => {
      mockExpand.mockRejectedValue(new Error('LLM service unavailable'));

      const response = await request(app)
        .post('/api/text/expand')
        .send({ text: 'test' })
        .expect(500);

      expect(response.body).toEqual({
        error: 'Failed to expand text',
      });
    });
  });

  describe('POST /api/text/refine', () => {
    it('should refine text successfully', async () => {
      const inputText = 'The house was old and it was big.';
      const refinedText = 'The house was old and imposing.';

      mockRefine.mockResolvedValue(refinedText);

      const response = await request(app)
        .post('/api/text/refine')
        .send({ text: inputText })
        .expect(200);

      expect(response.body).toEqual({
        operation: 'refine',
        result: refinedText,
      });
      expect(mockRefine).toHaveBeenCalledWith(inputText, undefined);
    });

    it('should refine text with synopsis', async () => {
      const inputText = 'The house was old and it was big.';
      const synopsis = 'A minimalist story.';
      const refinedText = 'The house: old, imposing.';

      mockRefine.mockResolvedValue(refinedText);

      const response = await request(app)
        .post('/api/text/refine')
        .send({ text: inputText, synopsis })
        .expect(200);

      expect(response.body).toEqual({
        operation: 'refine',
        result: refinedText,
      });
      expect(mockRefine).toHaveBeenCalledWith(inputText, synopsis);
    });

    it('should return 400 if text is missing', async () => {
      const response = await request(app)
        .post('/api/text/refine')
        .send({})
        .expect(400);

      expect(response.body).toEqual({
        error: 'Text is required',
      });
    });

    it('should return 500 on service error', async () => {
      mockRefine.mockRejectedValue(new Error('Model error'));

      const response = await request(app)
        .post('/api/text/refine')
        .send({ text: 'test' })
        .expect(500);

      expect(response.body).toEqual({
        error: 'Failed to refine text',
      });
    });
  });

  describe('POST /api/text/revise', () => {
    it('should revise text successfully', async () => {
      const inputText = 'First this. Then that. The end.';
      const revisedText = 'Events unfolded naturally, leading to a conclusion.';

      mockRevise.mockResolvedValue(revisedText);

      const response = await request(app)
        .post('/api/text/revise')
        .send({ text: inputText })
        .expect(200);

      expect(response.body).toEqual({
        operation: 'revise',
        result: revisedText,
      });
      expect(mockRevise).toHaveBeenCalledWith(inputText, undefined);
    });

    it('should revise text with synopsis', async () => {
      const inputText = 'Events happened.';
      const synopsis = 'A story of transformation.';
      const revisedText = 'Transformative events unfolded.';

      mockRevise.mockResolvedValue(revisedText);

      const response = await request(app)
        .post('/api/text/revise')
        .send({ text: inputText, synopsis })
        .expect(200);

      expect(response.body).toEqual({
        operation: 'revise',
        result: revisedText,
      });
      expect(mockRevise).toHaveBeenCalledWith(inputText, synopsis);
    });

    it('should return 400 if text is missing', async () => {
      const response = await request(app)
        .post('/api/text/revise')
        .send({})
        .expect(400);

      expect(response.body).toEqual({
        error: 'Text is required',
      });
    });

    it('should return 500 on service error', async () => {
      mockRevise.mockRejectedValue(new Error('Connection timeout'));

      const response = await request(app)
        .post('/api/text/revise')
        .send({ text: 'test' })
        .expect(500);

      expect(response.body).toEqual({
        error: 'Failed to revise text',
      });
    });
  });

  describe('POST /api/text/restructure', () => {
    it('should restructure text successfully', async () => {
      const inputText = 'Start. Middle. End. Start. Middle. End. Conclusion.';
      const restructuredText = 'The narrative unfolds logically through beginning, center, and conclusion.';

      mockRestructure.mockResolvedValue(restructuredText);

      const response = await request(app)
        .post('/api/text/restructure')
        .send({ text: inputText })
        .expect(200);

      expect(response.body).toEqual({
        operation: 'restructure',
        result: restructuredText,
      });
      expect(mockRestructure).toHaveBeenCalledWith(inputText, undefined);
    });

    it('should restructure text with synopsis', async () => {
      const inputText = 'Random events. Chaotic order. Unclear flow.';
      const synopsis = 'A mystery unfolding.';
      const restructuredText = 'Clues emerge, building suspense toward revelation.';

      mockRestructure.mockResolvedValue(restructuredText);

      const response = await request(app)
        .post('/api/text/restructure')
        .send({ text: inputText, synopsis })
        .expect(200);

      expect(response.body).toEqual({
        operation: 'restructure',
        result: restructuredText,
      });
      expect(mockRestructure).toHaveBeenCalledWith(inputText, synopsis);
    });

    it('should return 400 if text is missing', async () => {
      const response = await request(app)
        .post('/api/text/restructure')
        .send({})
        .expect(400);

      expect(response.body).toEqual({
        error: 'Text is required',
      });
    });

    it('should return 400 if text is empty string', async () => {
      const response = await request(app)
        .post('/api/text/restructure')
        .send({ text: '' })
        .expect(400);

      expect(response.body).toEqual({
        error: 'Text is required',
      });
    });

    it('should return 500 on service error', async () => {
      mockRestructure.mockRejectedValue(new Error('Restructure failed'));

      const response = await request(app)
        .post('/api/text/restructure')
        .send({ text: 'test' })
        .expect(500);

      expect(response.body).toEqual({
        error: 'Failed to restructure text',
      });
    });
  });

  describe('POST /api/text/synopsis', () => {
    it('should generate synopsis successfully', async () => {
      const inputText = 'A long story about heroes and villains.';
      const synopsis = 'An epic tale of good versus evil.';

      mockGenerateSynopsis.mockResolvedValue(synopsis);

      const response = await request(app)
        .post('/api/text/synopsis')
        .send({ text: inputText })
        .expect(200);

      expect(response.body).toEqual({
        synopsis,
      });
      expect(mockGenerateSynopsis).toHaveBeenCalledWith(inputText);
    });

    it('should return 400 if text is missing', async () => {
      const response = await request(app)
        .post('/api/text/synopsis')
        .send({})
        .expect(400);

      expect(response.body).toEqual({
        error: 'Text is required',
      });
    });

    it('should return 400 if text is empty', async () => {
      const response = await request(app)
        .post('/api/text/synopsis')
        .send({ text: '' })
        .expect(400);

      expect(response.body).toEqual({
        error: 'Text is required',
      });
    });

    it('should return 500 on service error', async () => {
      mockGenerateSynopsis.mockRejectedValue(new Error('Synopsis failed'));

      const response = await request(app)
        .post('/api/text/synopsis')
        .send({ text: 'test' })
        .expect(500);

      expect(response.body).toEqual({
        error: 'Failed to generate synopsis',
      });
    });
  });

  describe('Request validation', () => {
    it('should handle malformed JSON', async () => {
      await request(app)
        .post('/api/text/expand')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);
    });

    it('should handle missing Content-Type header', async () => {
      const response = await request(app)
        .post('/api/text/expand')
        .send('text=test');

      // Should still work or return appropriate error
      expect([200, 400, 415]).toContain(response.status);
    });
  });
});
