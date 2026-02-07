import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/index';

describe('Sessions API Endpoints', () => {
  let sessionId: string;

  describe('POST /api/sessions - Create Session', () => {
    it('should create a new session', async () => {
      const response = await request(app)
        .post('/api/sessions')
        .send({
          title: 'My Story',
          description: 'A tale of adventure',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('My Story');
      expect(response.body.description).toBe('A tale of adventure');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');

      // Save for later tests
      sessionId = response.body.id;
    });

    it('should create session with only title', async () => {
      const response = await request(app)
        .post('/api/sessions')
        .send({
          title: 'Minimal Session',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Minimal Session');
    });

    it('should reject request without title', async () => {
      const response = await request(app)
        .post('/api/sessions')
        .send({
          description: 'No title provided',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/sessions - List Sessions', () => {
    it('should return list of all sessions', async () => {
      const response = await request(app)
        .get('/api/sessions')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should support pagination with skip and limit', async () => {
      const response = await request(app)
        .get('/api/sessions?skip=0&limit=10')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return sessions with metadata', async () => {
      const response = await request(app)
        .get('/api/sessions')
        .expect(200);

      if (response.body.length > 0) {
        const session = response.body[0];
        expect(session).toHaveProperty('id');
        expect(session).toHaveProperty('title');
        expect(session).toHaveProperty('createdAt');
        expect(session).toHaveProperty('operationCount');
      }
    });
  });

  describe('GET /api/sessions/:sessionId - Get Session Details', () => {
    it('should retrieve a specific session', async () => {
      const createRes = await request(app)
        .post('/api/sessions')
        .send({ title: 'Test Session' });

      const response = await request(app)
        .get(`/api/sessions/${createRes.body.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', createRes.body.id);
    });

    it('should return 404 for non-existent session', async () => {
      await request(app)
        .get('/api/sessions/non-existent')
        .expect(404);
    });

    it('should include operation count in response', async () => {
      const createRes = await request(app)
        .post('/api/sessions')
        .send({ title: 'Counter Test' });

      const response = await request(app)
        .get(`/api/sessions/${createRes.body.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('operationCount');
    });
  });

  describe('PUT /api/sessions/:sessionId - Update Session', () => {
    it('should update session metadata', async () => {
      const createRes = await request(app)
        .post('/api/sessions')
        .send({ title: 'Original Title' });

      const response = await request(app)
        .put(`/api/sessions/${createRes.body.id}`)
        .send({
          title: 'Updated Title',
          description: 'Updated description',
        })
        .expect(200);

      expect(response.body.title).toBe('Updated Title');
      expect(response.body.description).toBe('Updated description');
    });

    it('should return 404 when updating non-existent session', async () => {
      await request(app)
        .put('/api/sessions/non-existent')
        .send({ title: 'New Title' })
        .expect(404);
    });

    it('should update only provided fields', async () => {
      const createRes = await request(app)
        .post('/api/sessions')
        .send({ title: 'Test', description: 'Original' });

      const response = await request(app)
        .put(`/api/sessions/${createRes.body.id}`)
        .send({
          description: 'New description only',
        })
        .expect(200);

      expect(response.body).toHaveProperty('description', 'New description only');
    });
  });

  describe('DELETE /api/sessions/:sessionId - Delete Session', () => {
    it('should delete a session', async () => {
      const createRes = await request(app)
        .post('/api/sessions')
        .send({ title: 'To Delete' });

      await request(app)
        .delete(`/api/sessions/${createRes.body.id}`)
        .expect(204);

      // Verify it's deleted
      await request(app)
        .get(`/api/sessions/${createRes.body.id}`)
        .expect(404);
    });

    it('should return 404 when deleting non-existent session', async () => {
      await request(app)
        .delete('/api/sessions/non-existent')
        .expect(404);
    });
  });

  describe('GET /api/sessions/:sessionId/history - Get Session History', () => {
    it('should retrieve operations for a session', async () => {
      const createRes = await request(app)
        .post('/api/sessions')
        .send({ title: 'History Test' });

      const response = await request(app)
        .get(`/api/sessions/${createRes.body.id}/history`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 404 for non-existent session', async () => {
      await request(app)
        .get('/api/sessions/non-existent/history')
        .expect(404);
    });

    it('should support pagination in history', async () => {
      const createRes = await request(app)
        .post('/api/sessions')
        .send({ title: 'Pagination Test' });

      const response = await request(app)
        .get(`/api/sessions/${createRes.body.id}/history?skip=0&limit=20`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should include operation details in response', async () => {
      const createRes = await request(app)
        .post('/api/sessions')
        .send({ title: 'Details Test' });

      const response = await request(app)
        .get(`/api/sessions/${createRes.body.id}/history`)
        .expect(200);

      if (response.body.length > 0) {
        const operation = response.body[0];
        expect(operation).toHaveProperty('id');
        expect(operation).toHaveProperty('type');
        expect(operation).toHaveProperty('timestamp');
      }
    });
  });

  describe('POST /api/sessions/:sessionId/history - Add Operation to Session', () => {
    it('should add operation to session history', async () => {
      const createRes = await request(app)
        .post('/api/sessions')
        .send({ title: 'Operation Test' });

      const response = await request(app)
        .post(`/api/sessions/${createRes.body.id}/history`)
        .send({
          type: 'expand',
          originalText: 'Short text',
          resultText: 'Expanded text',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.type).toBe('expand');
    });

    it('should return 404 when adding to non-existent session', async () => {
      await request(app)
        .post('/api/sessions/non-existent/history')
        .send({
          type: 'expand',
          originalText: 'Text',
          resultText: 'Expanded',
        })
        .expect(404);
    });

    it('should validate operation type', async () => {
      const createRes = await request(app)
        .post('/api/sessions')
        .send({ title: 'Type Validation Test' });

      const response = await request(app)
        .post(`/api/sessions/${createRes.body.id}/history`)
        .send({
          type: 'invalid-type',
          originalText: 'Text',
          resultText: 'Expanded',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should require originalText and resultText', async () => {
      const createRes = await request(app)
        .post('/api/sessions')
        .send({ title: 'Required Fields Test' });

      const response = await request(app)
        .post(`/api/sessions/${createRes.body.id}/history`)
        .send({
          type: 'expand',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});
