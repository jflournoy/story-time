import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import { diffRouter } from '../../src/api/diff';

describe('Diff API', () => {
  let app: Express;

  beforeEach(() => {
    // Create Express app for testing
    app = express();
    app.use(express.json());
    app.use('/api/diff', diffRouter);
  });

  describe('POST /api/diff/compute', () => {
    it('should compute diff for identical text', async () => {
      const response = await request(app)
        .post('/api/diff/compute')
        .send({
          original: 'The quick brown fox',
          modified: 'The quick brown fox',
        })
        .expect(200);

      expect(response.body).toHaveProperty('changes');
      expect(response.body).toHaveProperty('similarity', 1);
      expect(response.body.changes).toHaveLength(0);
    });

    it('should compute diff for modified text', async () => {
      const response = await request(app)
        .post('/api/diff/compute')
        .send({
          original: 'The fox',
          modified: 'The quick brown fox',
        })
        .expect(200);

      expect(response.body).toHaveProperty('changes');
      expect(response.body).toHaveProperty('similarity');
      expect(response.body.changes.length).toBeGreaterThan(0);
      expect(response.body.changes.some((c: { type: string }) => c.type === 'add')).toBe(true);
    });

    it('should return 400 for missing fields', async () => {
      const response = await request(app)
        .post('/api/diff/compute')
        .send({ original: 'text' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for non-string values', async () => {
      const response = await request(app)
        .post('/api/diff/compute')
        .send({
          original: 'text',
          modified: 123,
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/diff/lines', () => {
    it('should compute line-level diff', async () => {
      const response = await request(app)
        .post('/api/diff/lines')
        .send({
          original: 'Line 1\nLine 2\nLine 3',
          modified: 'Line 1\nLine 2 modified\nLine 3',
        })
        .expect(200);

      expect(response.body).toHaveProperty('changes');
      expect(Array.isArray(response.body.changes)).toBe(true);
      expect(response.body.changes.length).toBeGreaterThan(0);
    });

    it('should identify added lines', async () => {
      const response = await request(app)
        .post('/api/diff/lines')
        .send({
          original: 'Line 1\nLine 3',
          modified: 'Line 1\nLine 2\nLine 3',
        })
        .expect(200);

      expect(response.body.changes.some((c: { type: string }) => c.type === 'add')).toBe(true);
    });

    it('should identify removed lines', async () => {
      const response = await request(app)
        .post('/api/diff/lines')
        .send({
          original: 'Line 1\nLine 2\nLine 3',
          modified: 'Line 1\nLine 3',
        })
        .expect(200);

      expect(response.body.changes.some((c: { type: string }) => c.type === 'remove')).toBe(true);
    });

    it('should return 400 for missing fields', async () => {
      const response = await request(app)
        .post('/api/diff/lines')
        .send({ original: 'text' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/diff/stats', () => {
    it('should compute addition statistics', async () => {
      const response = await request(app)
        .post('/api/diff/stats')
        .send({
          original: 'The fox',
          modified: 'The quick brown fox',
        })
        .expect(200);

      expect(response.body).toHaveProperty('stats');
      expect(response.body.stats).toHaveProperty('additions');
      expect(response.body.stats).toHaveProperty('deletions');
      expect(response.body.stats).toHaveProperty('charDelta');
      expect(response.body.stats.additions).toBeGreaterThan(0);
      expect(response.body.stats.deletions).toBe(0);
    });

    it('should compute deletion statistics', async () => {
      const response = await request(app)
        .post('/api/diff/stats')
        .send({
          original: 'The quick brown fox jumps',
          modified: 'The fox',
        })
        .expect(200);

      expect(response.body.stats.deletions).toBeGreaterThan(0);
    });

    it('should compute character delta correctly', async () => {
      const original = 'Short';
      const modified = 'This is a much longer text';

      const response = await request(app)
        .post('/api/diff/stats')
        .send({ original, modified })
        .expect(200);

      expect(response.body.stats.charDelta).toBe(
        modified.length - original.length
      );
    });

    it('should return 400 for missing fields', async () => {
      const response = await request(app)
        .post('/api/diff/stats')
        .send({ original: 'text' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});
