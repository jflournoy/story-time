import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import express, { type Express } from 'express';
import request from 'supertest';
import { createEntitiesRouter } from '../../src/api/entities';
import { EntityExtractionService } from '../../src/services/entityExtractionService';
import type { LLMProvider } from '../../src/providers/llm-provider';

describe('Entities API', () => {
  let app: Express;
  let mockProvider: LLMProvider;
  let service: EntityExtractionService;

  beforeEach(() => {
    mockProvider = {
      expand: vi.fn(),
      refine: vi.fn(),
      revise: vi.fn(),
      restructure: vi.fn(),
      generateSynopsis: vi.fn(),
      healthCheck: vi.fn().mockResolvedValue(true),
    };

    service = new EntityExtractionService(mockProvider);
    app = express();
    app.use(express.json());
    app.use('/api/entities', createEntitiesRouter(service));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/entities/extract', () => {
    it('should extract entities from text', async () => {
      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'CHARACTERS: Elena|Marco\nLOCATIONS: temple\nOBJECTS: ancient map'
      );

      const response = await request(app)
        .post('/api/entities/extract')
        .send({ text: 'Elena and Marco found an ancient map in the temple.' })
        .expect(200);

      expect(response.body.characters).toHaveLength(2);
      expect(response.body.locations).toHaveLength(1);
      expect(response.body.objects).toHaveLength(1);
      expect(response.body.entityCount).toBe(4);
    });

    it('should return 400 for missing text', async () => {
      const response = await request(app)
        .post('/api/entities/extract')
        .send({})
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for empty text', async () => {
      const response = await request(app)
        .post('/api/entities/extract')
        .send({ text: '' })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should support includeRelationships option', async () => {
      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'CHARACTERS: Elena|Marco\nLOCATIONS: none\nOBJECTS: none\n' +
          'RELATIONSHIPS: Elena->Marco[hired as guide]'
      );

      const response = await request(app)
        .post('/api/entities/extract')
        .send({
          text: 'Elena hired Marco as her guide.',
          options: { includeRelationships: true },
        })
        .expect(200);

      expect(response.body.characters[0].relationships).toBeDefined();
    });

    it('should return 500 on service error', async () => {
      vi.mocked(mockProvider.expand).mockRejectedValueOnce(new Error('LLM error'));

      const response = await request(app)
        .post('/api/entities/extract')
        .send({ text: 'Some text.' })
        .expect(500);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /api/entities/compare', () => {
    it('should compare entities between two text versions', async () => {
      vi.mocked(mockProvider.expand)
        .mockResolvedValueOnce('CHARACTERS: Elena\nLOCATIONS: forest\nOBJECTS: none')
        .mockResolvedValueOnce('CHARACTERS: Elena|Marco\nLOCATIONS: temple\nOBJECTS: none');

      const response = await request(app)
        .post('/api/entities/compare')
        .send({
          original: 'Elena explored the forest.',
          revised: 'Elena and Marco explored the temple.',
        })
        .expect(200);

      expect(response.body.added.characters).toContain('Marco');
      expect(response.body.removed.locations).toContain('forest');
      expect(response.body.retained.characters).toContain('Elena');
    });

    it('should return 400 for missing original text', async () => {
      const response = await request(app)
        .post('/api/entities/compare')
        .send({ revised: 'Some text.' })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for missing revised text', async () => {
      const response = await request(app)
        .post('/api/entities/compare')
        .send({ original: 'Some text.' })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /api/entities/summary', () => {
    it('should return entity summary for text', async () => {
      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'CHARACTERS: Elena(2)|Marco(1)\nLOCATIONS: temple(1)\nOBJECTS: map(3)'
      );

      const response = await request(app)
        .post('/api/entities/summary')
        .send({ text: 'Elena found the map. Elena showed Marco the map in the temple. The map was old.' })
        .expect(200);

      expect(response.body.characterCount).toBe(2);
      expect(response.body.locationCount).toBe(1);
      expect(response.body.objectCount).toBe(1);
      expect(response.body.mostMentioned).toBeDefined();
    });

    it('should return 400 for missing text', async () => {
      const response = await request(app)
        .post('/api/entities/summary')
        .send({})
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /api/entities/track', () => {
    it('should track entity appearances across paragraphs', async () => {
      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'CHARACTERS: Elena[first:0:0,mentions:3]|Marco[first:1:0,mentions:2]\n' +
          'LOCATIONS: temple[first:0:1,mentions:2]\nOBJECTS: none'
      );

      const response = await request(app)
        .post('/api/entities/track')
        .send({
          text: 'Elena entered the temple.\n\nMarco joined her later.\n\nThey explored together.',
        })
        .expect(200);

      expect(response.body.characters[0].firstAppearance).toBeDefined();
      expect(response.body.characters[0].firstAppearance.paragraph).toBe(0);
    });

    it('should return 400 for missing text', async () => {
      const response = await request(app)
        .post('/api/entities/track')
        .send({})
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });
});
