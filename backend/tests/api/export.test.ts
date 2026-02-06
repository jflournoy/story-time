import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';

// Create mock functions
const mockExportToText = vi.fn();
const mockExportToMarkdown = vi.fn();
const mockExportToJSON = vi.fn();

// Mock the export service before importing router
vi.mock('../../src/services/exportService', () => {
  return {
    ExportService: vi.fn().mockImplementation(() => ({
      exportToText: mockExportToText,
      exportToMarkdown: mockExportToMarkdown,
      exportToJSON: mockExportToJSON,
    })),
  };
});

// Import router after mocking
const { exportRouter } = await import('../../src/api/export');

describe('Export API', () => {
  let app: Express;

  beforeEach(() => {
    vi.clearAllMocks();

    // Set default mock return values
    mockExportToText.mockReturnValue('');
    mockExportToMarkdown.mockReturnValue('');
    mockExportToJSON.mockReturnValue('');

    // Create Express app for testing
    app = express();
    app.use(express.json());
    app.use('/api/export', exportRouter);
  });

  describe('POST /api/export/text', () => {
    it('should export text content successfully', async () => {
      const payload = {
        text: 'The hero embarked on a journey.',
        synopsis: 'A story of adventure',
        format: 'text',
      };

      mockExportToText.mockReturnValue(payload.text);

      const response = await request(app)
        .post('/api/export/text')
        .send(payload)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        format: 'text',
        content: payload.text,
      });
    });

    it('should return 400 if text is missing', async () => {
      const payload = {
        synopsis: 'A story of adventure',
      };

      const response = await request(app)
        .post('/api/export/text')
        .send(payload)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should include metadata in export response', async () => {
      const payload = {
        text: 'Sample text',
        synopsis: 'Sample synopsis',
        format: 'text',
      };

      mockExportToText.mockReturnValue(payload.text);

      const response = await request(app)
        .post('/api/export/text')
        .send(payload)
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('format');
      expect(response.body).toHaveProperty('content');
    });
  });

  describe('POST /api/export/markdown', () => {
    it('should export text as markdown format', async () => {
      const payload = {
        text: '# Chapter 1\nThe story begins.',
        synopsis: 'Chapter one introduction',
      };

      const markdownContent = `# Synopsis\n\n${payload.synopsis}\n\n---\n\n# Content\n\n${payload.text}`;
      mockExportToMarkdown.mockReturnValue(markdownContent);

      const response = await request(app)
        .post('/api/export/markdown')
        .send(payload)
        .expect(200);

      expect(response.body).toHaveProperty('format');
      expect(response.body.format).toBe('markdown');
      expect(response.body).toHaveProperty('content');
    });
  });

  describe('POST /api/export/json', () => {
    it('should export text and synopsis as JSON', async () => {
      const payload = {
        text: 'Story content',
        synopsis: 'Story summary',
      };

      const jsonContent = JSON.stringify({
        text: payload.text,
        synopsis: payload.synopsis,
        exportedAt: new Date().toISOString(),
      }, null, 2);
      mockExportToJSON.mockReturnValue(jsonContent);

      const response = await request(app)
        .post('/api/export/json')
        .send(payload)
        .expect(200);

      expect(response.body).toHaveProperty('format');
      expect(response.body.format).toBe('json');
      expect(response.body).toHaveProperty('content');
    });
  });
});
