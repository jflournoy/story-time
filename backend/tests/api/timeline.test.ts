import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import express, { type Express } from 'express';
import request from 'supertest';
import { createTimelineRouter } from '../../src/api/timeline';
import { TimelineService } from '../../src/services/timelineService';
import type { LLMProvider } from '../../src/providers/llm-provider';

describe('Timeline API', () => {
  let app: Express;
  let mockProvider: LLMProvider;
  let service: TimelineService;

  beforeEach(() => {
    mockProvider = {
      expand: vi.fn(),
      refine: vi.fn(),
      revise: vi.fn(),
      restructure: vi.fn(),
      generateSynopsis: vi.fn(),
      healthCheck: vi.fn().mockResolvedValue(true),
    };

    service = new TimelineService(mockProvider);
    app = express();
    app.use(express.json());
    app.use('/api/timeline', createTimelineRouter(service));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/timeline/events', () => {
    it('should extract events from text', async () => {
      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'EVENTS:\n1|plot_point|Discovery|Elena|0.3\n2|action|Journey|Elena|0.7'
      );

      const response = await request(app)
        .post('/api/timeline/events')
        .send({ text: 'Elena made a discovery. She began her journey.' })
        .expect(200);

      expect(response.body.events).toHaveLength(2);
      expect(response.body.events[0].type).toBe('plot_point');
    });

    it('should return 400 for missing text', async () => {
      const response = await request(app)
        .post('/api/timeline/events')
        .send({})
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for empty text', async () => {
      const response = await request(app)
        .post('/api/timeline/events')
        .send({ text: '' })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should support includeRelationships option', async () => {
      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'EVENTS:\n1|action|Cause|none|0.3\n2|action|Effect|none|0.7\n' +
          'RELATIONSHIPS:\n1->2|causes'
      );

      const response = await request(app)
        .post('/api/timeline/events')
        .send({
          text: 'The cause led to the effect.',
          options: { includeRelationships: true },
        })
        .expect(200);

      expect(response.body.events[0].relationships).toBeDefined();
    });

    it('should return 500 on service error', async () => {
      vi.mocked(mockProvider.expand).mockRejectedValueOnce(new Error('LLM error'));

      const response = await request(app)
        .post('/api/timeline/events')
        .send({ text: 'Some text.' })
        .expect(500);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /api/timeline/build', () => {
    it('should build a complete timeline from text', async () => {
      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'EVENTS:\n1|plot_point|Start|Elena|0.2\n2|action|Middle|Elena|0.5\n3|plot_point|End|Elena|0.9\n' +
          'STRUCTURE: linear\n' +
          'DURATION: one week\n' +
          'PACING: density=1.0,climax=0.9,intensity=0.3|0.6|0.9'
      );

      const response = await request(app)
        .post('/api/timeline/build')
        .send({ text: 'Elena started her journey. She traveled far. She reached her destination.' })
        .expect(200);

      expect(response.body.events).toHaveLength(3);
      expect(response.body.structure).toBe('linear');
      expect(response.body.duration).toBe('one week');
      expect(response.body.pacing).toBeDefined();
    });

    it('should return 400 for missing text', async () => {
      const response = await request(app)
        .post('/api/timeline/build')
        .send({})
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /api/timeline/pacing', () => {
    it('should analyze narrative pacing', async () => {
      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'PACING: density=1.5,climax=0.75,intensity=0.2|0.5|0.9|0.3,quiet=1|3'
      );

      const response = await request(app)
        .post('/api/timeline/pacing')
        .send({ text: 'Action. Calm. Climax. Resolution.' })
        .expect(200);

      expect(response.body.eventDensity).toBeCloseTo(1.5, 1);
      expect(response.body.climaxPosition).toBeCloseTo(0.75, 1);
      expect(response.body.intensityCurve).toBeDefined();
      expect(response.body.quietMoments).toContain(1);
    });

    it('should return 400 for missing text', async () => {
      const response = await request(app)
        .post('/api/timeline/pacing')
        .send({})
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /api/timeline/compare', () => {
    it('should compare timelines between two text versions', async () => {
      vi.mocked(mockProvider.expand)
        .mockResolvedValueOnce(
          'EVENTS:\n1|action|Event A|none|0.3\n2|action|Event B|none|0.7\n' +
            'PACING: density=0.5,climax=0.7,intensity=0.5|0.8'
        )
        .mockResolvedValueOnce(
          'EVENTS:\n1|action|Event A|none|0.2\n2|action|Event C|none|0.5\n3|action|Event B|none|0.8\n' +
            'PACING: density=0.75,climax=0.8,intensity=0.4|0.6|0.9'
        );

      const response = await request(app)
        .post('/api/timeline/compare')
        .send({
          original: 'Event A happened. Event B followed.',
          revised: 'Event A happened. Event C occurred. Event B followed.',
        })
        .expect(200);

      expect(response.body.addedEvents).toBeDefined();
      expect(response.body.removedEvents).toBeDefined();
      expect(response.body.retainedEvents).toBeDefined();
      expect(response.body.pacingChange).toBeDefined();
    });

    it('should return 400 for missing original text', async () => {
      const response = await request(app)
        .post('/api/timeline/compare')
        .send({ revised: 'Some text.' })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for missing revised text', async () => {
      const response = await request(app)
        .post('/api/timeline/compare')
        .send({ original: 'Some text.' })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /api/timeline/structure', () => {
    it('should detect narrative structure type', async () => {
      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'EVENTS:\n1|marker|Memory|none|0.3\n2|action|Present|none|0.7\n' +
          'STRUCTURE: flashback'
      );

      const response = await request(app)
        .post('/api/timeline/structure')
        .send({ text: 'She remembered the past. Now she stood in the present.' })
        .expect(200);

      expect(response.body.structure).toBe('flashback');
    });

    it('should return 400 for missing text', async () => {
      const response = await request(app)
        .post('/api/timeline/structure')
        .send({})
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });
});
