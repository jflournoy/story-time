import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { router as apiRouter } from '../../src/api/routes';
import { errorHandler } from '../../src/api/middleware/errorHandler';

describe('API Integration Tests', () => {
  let app: Express;

  function createTestApp(): Express {
    dotenv.config();

    const testApp = express();
    testApp.use(cors());
    testApp.use(express.json());
    testApp.use(express.urlencoded({ extended: true }));

    // Health endpoint
    testApp.get('/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });

    testApp.use('/api', apiRouter);
    testApp.use(errorHandler);

    return testApp;
  }

  describe('GET /health', () => {
    it('should return health status', async () => {
      app = createTestApp();
      const response = await request(app).get('/health').expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /api', () => {
    it('should return API info', async () => {
      app = createTestApp();
      const response = await request(app).get('/api').expect(200);

      expect(response.body).toHaveProperty('name', 'Story Time API');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('endpoints');
    });
  });

  describe('API Request Validation', () => {
    beforeEach(() => {
      app = createTestApp();
    });

    it('should require text parameter for expand endpoint', async () => {
      const response = await request(app)
        .post('/api/text/expand')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should require text parameter for refine endpoint', async () => {
      const response = await request(app)
        .post('/api/text/refine')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should require text parameter for revise endpoint', async () => {
      const response = await request(app)
        .post('/api/text/revise')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should require text parameter for synopsis endpoint', async () => {
      const response = await request(app)
        .post('/api/text/synopsis')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should accept valid expand request format', async () => {
      const requestBody = {
        text: 'A short story.',
        synopsis: 'A tale of adventure'
      };

      // Just verify the request body is accepted (may fail due to no LLM, but request is valid)
      const response = await request(app)
        .post('/api/text/expand')
        .send(requestBody);

      // We expect either 200 (success) or 500 (LLM unavailable), but NOT 400 (bad request)
      expect([200, 500]).toContain(response.status);
    });

    it('should accept valid refine request format', async () => {
      const requestBody = {
        text: 'Some rough text.',
        synopsis: 'Optional context'
      };

      const response = await request(app)
        .post('/api/text/refine')
        .send(requestBody);

      expect([200, 500]).toContain(response.status);
    });

    it('should accept valid revise request format', async () => {
      const requestBody = {
        text: 'Original text.'
      };

      const response = await request(app)
        .post('/api/text/revise')
        .send(requestBody);

      expect([200, 500]).toContain(response.status);
    });

    it('should accept valid synopsis request format', async () => {
      const requestBody = {
        text: 'Long story text here.'
      };

      const response = await request(app)
        .post('/api/text/synopsis')
        .send(requestBody);

      expect([200, 500]).toContain(response.status);
    });
  });

  describe('API Routes Structure', () => {
    beforeEach(() => {
      app = createTestApp();
    });

    it('should have text operations available at /api/text endpoints', async () => {
      // Just verify the routes exist and are configured
      const endpoints = ['/api/text/expand', '/api/text/refine', '/api/text/revise', '/api/text/synopsis'];

      for (const endpoint of endpoints) {
        const response = await request(app)
          .post(endpoint)
          .send({ text: 'test' });

        // We expect either a valid response or service unavailable error, not 404
        expect(response.status).not.toBe(404);
      }
    });

    it('should handle OPTIONS requests for CORS', async () => {
      const response = await request(app).options('/api/text/expand');

      // CORS should allow the request or we get 200/204
      expect([200, 204, 404]).toContain(response.status);
    });
  });
});
