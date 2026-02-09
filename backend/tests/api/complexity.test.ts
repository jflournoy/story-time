import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import express, { type Express } from 'express';
import request from 'supertest';
import { createComplexityRouter } from '../../src/api/complexity';
import { ComplexityMetricsService } from '../../src/services/complexityMetricsService';
import type { LLMProvider } from '../../src/providers/llm-provider';

describe('Complexity API', () => {
  let app: Express;
  let mockProvider: LLMProvider;
  let service: ComplexityMetricsService;

  beforeEach(() => {
    mockProvider = {
      expand: vi.fn(),
      refine: vi.fn(),
      revise: vi.fn(),
      restructure: vi.fn(),
      generateSynopsis: vi.fn(),
      healthCheck: vi.fn().mockResolvedValue(true),
    };

    service = new ComplexityMetricsService(mockProvider);
    app = express();
    app.use(express.json());
    app.use('/api/complexity', createComplexityRouter(service));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/complexity/threads', () => {
    it('should analyze plot threads', async () => {
      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'THREADS:\n1|main_plot|Main story|active|Elena\n2|subplot|Side story|active|Marco\n' +
          'INTERWEAVING:\nsequence=1,2,1\nswitches=2\n' +
          'COMPLEXITY: 0.65'
      );

      const response = await request(app)
        .post('/api/complexity/threads')
        .send({ text: 'Elena searched for the artifact. Marco uncovered betrayal. Elena found a clue.' })
        .expect(200);

      expect(response.body.threads).toHaveLength(2);
      expect(response.body.complexityScore).toBeCloseTo(0.65, 1);
      expect(response.body.interweaving).toBeDefined();
    });

    it('should return 400 for missing text', async () => {
      const response = await request(app)
        .post('/api/complexity/threads')
        .send({})
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for empty text', async () => {
      const response = await request(app)
        .post('/api/complexity/threads')
        .send({ text: '' })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should return 500 on service error', async () => {
      vi.mocked(mockProvider.expand).mockRejectedValueOnce(new Error('LLM error'));

      const response = await request(app)
        .post('/api/complexity/threads')
        .send({ text: 'Some text.' })
        .expect(500);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /api/complexity/density', () => {
    it('should analyze narrative density', async () => {
      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'DENSITY:\n' +
          'paragraph_ideas=3|2|4\n' +
          'average=3.0\n' +
          'exposition=0.4\n' +
          'action=0.5\n' +
          'dialogue=0.1'
      );

      const response = await request(app)
        .post('/api/complexity/density')
        .send({ text: 'Multi-paragraph narrative for analysis.' })
        .expect(200);

      expect(response.body.averageDensity).toBeCloseTo(3.0, 1);
      expect(response.body.ideasPerParagraph).toEqual([3, 2, 4]);
      expect(response.body.contentBreakdown).toBeDefined();
    });

    it('should return 400 for missing text', async () => {
      const response = await request(app)
        .post('/api/complexity/density')
        .send({})
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /api/complexity/characters', () => {
    it('should analyze character involvement', async () => {
      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'CHARACTERS:\n' +
          'Elena|5|0.6\n' +
          'Marco|3|0.4\n' +
          'INTERACTIONS:\n' +
          'Elena->Marco|2\n' +
          'ROLES:\n' +
          'protagonist=Elena\n' +
          'supporting=Marco\n' +
          'POV:\n' +
          'switches=1\n' +
          'sequence=Elena|Marco'
      );

      const response = await request(app)
        .post('/api/complexity/characters')
        .send({ text: 'Elena and Marco narrative.' })
        .expect(200);

      expect(response.body.characters['Elena'].mentions).toBe(5);
      expect(response.body.roles.protagonist).toBe('Elena');
      expect(response.body.povAnalysis).toBeDefined();
    });

    it('should return 400 for missing text', async () => {
      const response = await request(app)
        .post('/api/complexity/characters')
        .send({})
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /api/complexity/scenes', () => {
    it('should analyze scene complexity', async () => {
      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'SCENES:\n' +
          '1|library|0.0|0.4\n' +
          '2|garden|0.4|0.7\n' +
          '3|temple|0.7|1.0\n' +
          'TRANSITIONS:\n' +
          '1->2|smooth\n' +
          '2->3|abrupt\n' +
          'LENGTHS: 0.4|0.3|0.3\n' +
          'VARIABILITY: 0.15\n' +
          'SMOOTHNESS: 0.65'
      );

      const response = await request(app)
        .post('/api/complexity/scenes')
        .send({ text: 'Story moving through locations.' })
        .expect(200);

      expect(response.body.scenes).toHaveLength(3);
      expect(response.body.settingChangeCount).toBe(2);
      expect(response.body.transitions).toBeDefined();
    });

    it('should return 400 for missing text', async () => {
      const response = await request(app)
        .post('/api/complexity/scenes')
        .send({})
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /api/complexity/readability', () => {
    it('should analyze readability', async () => {
      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'READABILITY:\n' +
          'avg_sentence_length=15.5\n' +
          'sentence_length_variance=8.2\n' +
          'unique_words=120\n' +
          'total_words=300\n' +
          'vocabulary_richness=0.4\n' +
          'paragraph_count=5\n' +
          'score=0.72\n' +
          'level=intermediate\n' +
          'recommendations=varied_structure|shorter_paragraphs'
      );

      const response = await request(app)
        .post('/api/complexity/readability')
        .send({ text: 'Text for readability analysis.' })
        .expect(200);

      expect(response.body.avgSentenceLength).toBeCloseTo(15.5, 1);
      expect(response.body.overallScore).toBeCloseTo(0.72, 2);
      expect(response.body.readabilityLevel).toBe('intermediate');
      expect(response.body.recommendations).toBeDefined();
    });

    it('should return 400 for missing text', async () => {
      const response = await request(app)
        .post('/api/complexity/readability')
        .send({})
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /api/complexity/report', () => {
    it('should generate full complexity report', async () => {
      // Mock all analysis calls
      vi.mocked(mockProvider.expand)
        .mockResolvedValueOnce('THREADS:\n1|main|Main|active|char\nCOMPLEXITY: 0.5')
        .mockResolvedValueOnce('DENSITY:\naverage=2.0\nexposition=0.4\naction=0.6')
        .mockResolvedValueOnce('CHARACTERS:\nchar|5|1.0\nROLES:\nprotagonist=char')
        .mockResolvedValueOnce('SCENES:\n1|loc|0|1\nTRANSITIONS: 0')
        .mockResolvedValueOnce('READABILITY:\nscore=0.7\nlevel=intermediate');

      const response = await request(app)
        .post('/api/complexity/report')
        .send({ text: 'Complete narrative for full analysis.' })
        .expect(200);

      expect(response.body.plotThreads).toBeDefined();
      expect(response.body.narrativeDensity).toBeDefined();
      expect(response.body.characterInvolvement).toBeDefined();
      expect(response.body.sceneComplexity).toBeDefined();
      expect(response.body.readability).toBeDefined();
      expect(response.body.overallComplexity).toBeDefined();
    });

    it('should return 400 for missing text', async () => {
      const response = await request(app)
        .post('/api/complexity/report')
        .send({})
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /api/complexity/compare', () => {
    it('should compare complexity between versions', async () => {
      // Mock for original
      vi.mocked(mockProvider.expand)
        .mockResolvedValueOnce('THREADS:\n1|main|Main|active|char\nCOMPLEXITY: 0.4')
        .mockResolvedValueOnce('DENSITY:\naverage=1.5')
        .mockResolvedValueOnce('CHARACTERS:\nchar|3|1.0\nROLES:\nprotagonist=char')
        .mockResolvedValueOnce('SCENES:\n1|loc|0|1\nTRANSITIONS: 0')
        .mockResolvedValueOnce('READABILITY:\nscore=0.6\nlevel=simple')
        // Mock for revised
        .mockResolvedValueOnce('THREADS:\n1|main|Main|active|char\n2|sub|Sub|active|other\nCOMPLEXITY: 0.7')
        .mockResolvedValueOnce('DENSITY:\naverage=2.5')
        .mockResolvedValueOnce('CHARACTERS:\nchar|5|0.7\nother|2|0.3\nROLES:\nprotagonist=char\nsupporting=other')
        .mockResolvedValueOnce('SCENES:\n1|loc|0|0.5\n2|loc2|0.5|1\nTRANSITIONS: 1')
        .mockResolvedValueOnce('READABILITY:\nscore=0.75\nlevel=intermediate');

      const response = await request(app)
        .post('/api/complexity/compare')
        .send({
          original: 'Original simpler text.',
          revised: 'Revised more complex text with additions.',
        })
        .expect(200);

      expect(response.body.complexityDelta).toBeDefined();
      expect(response.body.threadCountDelta).toBeDefined();
      expect(response.body.improvements).toBeDefined();
      expect(response.body.regressions).toBeDefined();
    });

    it('should return 400 for missing original', async () => {
      const response = await request(app)
        .post('/api/complexity/compare')
        .send({ revised: 'Only revised text.' })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for missing revised', async () => {
      const response = await request(app)
        .post('/api/complexity/compare')
        .send({ original: 'Only original text.' })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });
});
