import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { LLMProvider } from '../../src/providers/llm-provider';
import { ComplexityMetricsService } from '../../src/services/complexityMetricsService';

describe('ComplexityMetricsService', () => {
  let service: ComplexityMetricsService;
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

    service = new ComplexityMetricsService(mockProvider);
  });

  describe('analyzePlotThreads', () => {
    it('should identify active plot threads', async () => {
      const text = `Elena searched for the ancient artifact.
        Meanwhile, Marco uncovered a betrayal within the team.
        The storm approached the expedition camp.`;

      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'THREADS:\n' +
          '1|artifact_search|Elena searches for artifact|active|Elena\n' +
          '2|betrayal|Team betrayal uncovered|active|Marco\n' +
          '3|storm|Storm approaching|active|none'
      );

      const result = await service.analyzePlotThreads(text);

      expect(result.threads).toHaveLength(3);
      expect(result.threads[0].name).toBe('artifact_search');
      expect(result.threads[0].status).toBe('active');
    });

    it('should track thread interweaving patterns', async () => {
      const text = `Elena found a clue. Marco received a warning.
        Elena connected the dots. The storm intensified.
        Marco revealed the traitor.`;

      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'THREADS:\n' +
          '1|artifact_search|Elena searches|active|Elena\n' +
          '2|betrayal|Team betrayal|active|Marco\n' +
          '3|storm|Storm threat|active|none\n' +
          'INTERWEAVING:\n' +
          'sequence=1,2,1,3,2\n' +
          'switches=4'
      );

      const result = await service.analyzePlotThreads(text);

      expect(result.interweaving).toBeDefined();
      expect(result.interweaving.switchCount).toBe(4);
      expect(result.interweaving.sequence).toEqual([1, 2, 1, 3, 2]);
    });

    it('should detect resolved and dormant threads', async () => {
      const text = `The mystery was solved. Elena had found the artifact.
        But the storm still threatened. Marco's betrayal remained hidden.`;

      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'THREADS:\n' +
          '1|artifact_search|Elena found artifact|resolved|Elena\n' +
          '2|betrayal|Betrayal hidden|dormant|Marco\n' +
          '3|storm|Storm threatens|active|none'
      );

      const result = await service.analyzePlotThreads(text);

      expect(result.threads.find((t) => t.name === 'artifact_search')?.status).toBe('resolved');
      expect(result.threads.find((t) => t.name === 'betrayal')?.status).toBe('dormant');
    });

    it('should calculate thread complexity score', async () => {
      const text = 'Complex narrative with multiple interweaving threads.';

      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'THREADS:\n' +
          '1|thread_a|Thread A|active|char1\n' +
          '2|thread_b|Thread B|active|char2\n' +
          '3|thread_c|Thread C|resolved|char1\n' +
          'INTERWEAVING:\n' +
          'sequence=1,2,3,1,2\n' +
          'switches=4\n' +
          'COMPLEXITY: 0.72'
      );

      const result = await service.analyzePlotThreads(text);

      expect(result.complexityScore).toBeCloseTo(0.72, 1);
    });
  });

  describe('analyzeNarrativeDensity', () => {
    it('should calculate ideas per paragraph', async () => {
      const text = `First paragraph with multiple concepts and ideas.

        Second paragraph, more sparse.

        Third paragraph packed with information, details, and complexity.`;

      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'DENSITY:\n' +
          'paragraph_ideas=3|1|4\n' +
          'average=2.67'
      );

      const result = await service.analyzeNarrativeDensity(text);

      expect(result.ideasPerParagraph).toEqual([3, 1, 4]);
      expect(result.averageDensity).toBeCloseTo(2.67, 1);
    });

    it('should measure exposition vs action ratio', async () => {
      const text = `The ancient temple was built centuries ago by a lost civilization.
        Elena ran through the corridor. She ducked under a trap.
        The walls were covered in mysterious symbols.`;

      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'DENSITY:\n' +
          'exposition=0.4\n' +
          'action=0.35\n' +
          'dialogue=0.15\n' +
          'description=0.1'
      );

      const result = await service.analyzeNarrativeDensity(text);

      expect(result.contentBreakdown.exposition).toBeCloseTo(0.4, 1);
      expect(result.contentBreakdown.action).toBeCloseTo(0.35, 1);
    });

    it('should identify information load per section', async () => {
      const text = 'Text with varying information density across sections.';

      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'DENSITY:\n' +
          'section_load=0.8|0.3|0.6|0.9\n' +
          'peak_sections=0|3'
      );

      const result = await service.analyzeNarrativeDensity(text);

      expect(result.sectionLoad).toEqual([0.8, 0.3, 0.6, 0.9]);
      expect(result.peakLoadSections).toContain(0);
      expect(result.peakLoadSections).toContain(3);
    });
  });

  describe('analyzeCharacterInvolvement', () => {
    it('should calculate character appearance frequency', async () => {
      const text = `Elena explored the ruins. Marco followed behind.
        Elena discovered a hidden passage. Elena called out to Marco.
        They descended together.`;

      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'CHARACTERS:\n' +
          'Elena|3|0.6\n' +
          'Marco|2|0.4\n' +
          'TOTAL_MENTIONS: 5'
      );

      const result = await service.analyzeCharacterInvolvement(text);

      expect(result.characters['Elena'].mentions).toBe(3);
      expect(result.characters['Marco'].mentions).toBe(2);
      expect(result.characters['Elena'].frequency).toBeCloseTo(0.6, 1);
    });

    it('should track character interaction patterns', async () => {
      const text = `Elena spoke to Marco. Marco helped Sofia.
        Elena and Sofia planned together. All three met at dawn.`;

      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'CHARACTERS:\n' +
          'Elena|2|0.4\n' +
          'Marco|2|0.3\n' +
          'Sofia|2|0.3\n' +
          'INTERACTIONS:\n' +
          'Elena->Marco|1\n' +
          'Marco->Sofia|1\n' +
          'Elena->Sofia|1\n' +
          'ALL|1'
      );

      const result = await service.analyzeCharacterInvolvement(text);

      expect(result.interactions).toBeDefined();
      expect(result.interactions['Elena->Marco']).toBe(1);
      expect(result.interactions['Elena->Sofia']).toBe(1);
    });

    it('should detect POV switches', async () => {
      const text = `Elena watched the sunset. She felt at peace.
        Marco's thoughts raced. He couldn't shake the feeling.
        Elena turned to face him.`;

      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'CHARACTERS:\n' +
          'Elena|2|0.5\n' +
          'Marco|1|0.3\n' +
          'POV:\n' +
          'switches=1\n' +
          'sequence=Elena|Marco|Elena'
      );

      const result = await service.analyzeCharacterInvolvement(text);

      expect(result.povAnalysis.switches).toBe(1);
      expect(result.povAnalysis.sequence).toEqual(['Elena', 'Marco', 'Elena']);
    });

    it('should identify protagonist and supporting characters', async () => {
      const text = 'Long narrative with Elena as main character.';

      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'CHARACTERS:\n' +
          'Elena|15|0.6\n' +
          'Marco|5|0.2\n' +
          'Sofia|3|0.1\n' +
          'Guard|2|0.05\n' +
          'ROLES:\n' +
          'protagonist=Elena\n' +
          'supporting=Marco,Sofia\n' +
          'minor=Guard'
      );

      const result = await service.analyzeCharacterInvolvement(text);

      expect(result.roles.protagonist).toBe('Elena');
      expect(result.roles.supporting).toContain('Marco');
      expect(result.roles.minor).toContain('Guard');
    });
  });

  describe('analyzeSceneComplexity', () => {
    it('should track setting changes', async () => {
      const text = `In the library, Elena researched.
        She moved to the garden.
        Later, in the temple...`;

      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'SCENES:\n' +
          '1|library|0.0|0.3\n' +
          '2|garden|0.3|0.6\n' +
          '3|temple|0.6|1.0\n' +
          'TRANSITIONS: 2'
      );

      const result = await service.analyzeSceneComplexity(text);

      expect(result.scenes).toHaveLength(3);
      expect(result.scenes[0].location).toBe('library');
      expect(result.settingChangeCount).toBe(2);
    });

    it('should measure scene length variability', async () => {
      const text = 'Narrative with scenes of varying lengths.';

      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'SCENES:\n' +
          '1|location_a|0.0|0.5\n' +
          '2|location_b|0.5|0.6\n' +
          '3|location_c|0.6|1.0\n' +
          'LENGTHS: 0.5|0.1|0.4\n' +
          'VARIABILITY: 0.42'
      );

      const result = await service.analyzeSceneComplexity(text);

      expect(result.sceneLengths).toEqual([0.5, 0.1, 0.4]);
      expect(result.lengthVariability).toBeCloseTo(0.42, 1);
    });

    it('should rate transition smoothness', async () => {
      const text = 'Story with various transition types.';

      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'SCENES:\n' +
          '1|office|0.0|0.4\n' +
          '2|street|0.4|0.7\n' +
          '3|home|0.7|1.0\n' +
          'TRANSITIONS:\n' +
          '1->2|smooth\n' +
          '2->3|abrupt\n' +
          'SMOOTHNESS: 0.65'
      );

      const result = await service.analyzeSceneComplexity(text);

      expect(result.transitions[0].type).toBe('smooth');
      expect(result.transitions[1].type).toBe('abrupt');
      expect(result.overallSmoothness).toBeCloseTo(0.65, 1);
    });
  });

  describe('analyzeReadability', () => {
    it('should calculate sentence complexity metrics', async () => {
      const text = `Short sentence. This is a medium length sentence with more words.
        Here we have a particularly long and complex sentence that winds through many clauses
        and subordinate phrases before finally reaching its conclusion.`;

      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'READABILITY:\n' +
          'avg_sentence_length=12.5\n' +
          'sentence_length_variance=8.3\n' +
          'complex_sentences=1\n' +
          'simple_sentences=1'
      );

      const result = await service.analyzeReadability(text);

      expect(result.avgSentenceLength).toBeCloseTo(12.5, 1);
      expect(result.sentenceLengthVariance).toBeCloseTo(8.3, 1);
    });

    it('should measure vocabulary diversity', async () => {
      const text = 'Text with varied vocabulary and word choices.';

      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'READABILITY:\n' +
          'unique_words=45\n' +
          'total_words=100\n' +
          'vocabulary_richness=0.45\n' +
          'rare_word_ratio=0.12'
      );

      const result = await service.analyzeReadability(text);

      expect(result.uniqueWords).toBe(45);
      expect(result.vocabularyRichness).toBeCloseTo(0.45, 2);
      expect(result.rareWordRatio).toBeCloseTo(0.12, 2);
    });

    it('should analyze paragraph structure', async () => {
      const text = 'Multi-paragraph text for analysis.';

      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'READABILITY:\n' +
          'paragraph_count=4\n' +
          'avg_paragraph_length=85\n' +
          'paragraph_variance=25\n' +
          'structure_score=0.78'
      );

      const result = await service.analyzeReadability(text);

      expect(result.paragraphCount).toBe(4);
      expect(result.avgParagraphLength).toBe(85);
      expect(result.structureScore).toBeCloseTo(0.78, 2);
    });

    it('should provide overall readability score', async () => {
      const text = 'Sample text for readability scoring.';

      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'READABILITY:\n' +
          'score=0.72\n' +
          'level=intermediate\n' +
          'recommendations=shorter_sentences|varied_structure'
      );

      const result = await service.analyzeReadability(text);

      expect(result.overallScore).toBeCloseTo(0.72, 2);
      expect(result.readabilityLevel).toBe('intermediate');
      expect(result.recommendations).toContain('shorter_sentences');
    });
  });

  describe('getFullComplexityReport', () => {
    it('should generate comprehensive complexity report', async () => {
      const text = 'Full narrative text for comprehensive analysis.';

      // Mock all the LLM calls
      vi.mocked(mockProvider.expand)
        .mockResolvedValueOnce('THREADS:\n1|main|Main plot|active|protagonist\nCOMPLEXITY: 0.5')
        .mockResolvedValueOnce('DENSITY:\naverage=2.0\nexposition=0.4\naction=0.6')
        .mockResolvedValueOnce('CHARACTERS:\nprotagonist|5|0.8\nROLES:\nprotagonist=protagonist')
        .mockResolvedValueOnce('SCENES:\n1|location|0.0|1.0\nTRANSITIONS: 0')
        .mockResolvedValueOnce('READABILITY:\nscore=0.75\nlevel=intermediate');

      const report = await service.getFullComplexityReport(text);

      expect(report.plotThreads).toBeDefined();
      expect(report.narrativeDensity).toBeDefined();
      expect(report.characterInvolvement).toBeDefined();
      expect(report.sceneComplexity).toBeDefined();
      expect(report.readability).toBeDefined();
    });

    it('should calculate overall complexity score', async () => {
      const text = 'Text for overall scoring.';

      vi.mocked(mockProvider.expand)
        .mockResolvedValueOnce('THREADS:\n1|main|Plot|active|char\nCOMPLEXITY: 0.6')
        .mockResolvedValueOnce('DENSITY:\naverage=3.0')
        .mockResolvedValueOnce('CHARACTERS:\nchar|5|1.0\nROLES:\nprotagonist=char')
        .mockResolvedValueOnce('SCENES:\n1|loc|0|1\nTRANSITIONS: 0\nVARIABILITY: 0.3')
        .mockResolvedValueOnce('READABILITY:\nscore=0.7\nlevel=intermediate');

      const report = await service.getFullComplexityReport(text);

      expect(report.overallComplexity).toBeDefined();
      expect(report.overallComplexity).toBeGreaterThan(0);
      expect(report.overallComplexity).toBeLessThanOrEqual(1);
    });

    it('should provide complexity recommendations', async () => {
      const text = 'Text needing complexity improvements.';

      vi.mocked(mockProvider.expand)
        .mockResolvedValueOnce('THREADS:\n1|only|Single thread|active|char\nCOMPLEXITY: 0.2')
        .mockResolvedValueOnce('DENSITY:\naverage=1.0\nexposition=0.8\naction=0.1')
        .mockResolvedValueOnce('CHARACTERS:\nchar|10|1.0\nROLES:\nprotagonist=char')
        .mockResolvedValueOnce('SCENES:\n1|single|0|1\nTRANSITIONS: 0')
        .mockResolvedValueOnce('READABILITY:\nscore=0.5\nlevel=simple\nrecommendations=varied_structure');

      const report = await service.getFullComplexityReport(text);

      expect(report.recommendations).toBeDefined();
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('compareComplexity', () => {
    it('should compare complexity between two text versions', async () => {
      const original = 'Original simpler text.';
      const revised = 'Revised more complex text with additions.';

      // Mock for original analysis
      vi.mocked(mockProvider.expand)
        .mockResolvedValueOnce('THREADS:\n1|main|Plot|active|char\nCOMPLEXITY: 0.4')
        .mockResolvedValueOnce('DENSITY:\naverage=1.5')
        .mockResolvedValueOnce('CHARACTERS:\nchar|3|1.0\nROLES:\nprotagonist=char')
        .mockResolvedValueOnce('SCENES:\n1|loc|0|1\nTRANSITIONS: 0')
        .mockResolvedValueOnce('READABILITY:\nscore=0.6\nlevel=simple')
        // Mock for revised analysis
        .mockResolvedValueOnce('THREADS:\n1|main|Plot|active|char\n2|sub|Subplot|active|other\nCOMPLEXITY: 0.7')
        .mockResolvedValueOnce('DENSITY:\naverage=2.5')
        .mockResolvedValueOnce('CHARACTERS:\nchar|5|0.7\nother|3|0.3\nROLES:\nprotagonist=char\nsupporting=other')
        .mockResolvedValueOnce('SCENES:\n1|loc|0|0.5\n2|loc2|0.5|1\nTRANSITIONS: 1')
        .mockResolvedValueOnce('READABILITY:\nscore=0.75\nlevel=intermediate');

      const comparison = await service.compareComplexity(original, revised);

      expect(comparison.complexityDelta).toBeGreaterThan(0);
      expect(comparison.threadCountDelta).toBe(1);
      expect(comparison.characterCountDelta).toBe(1);
    });

    it('should identify areas of improvement and regression', async () => {
      const original = 'Original text.';
      const revised = 'Revised text.';

      vi.mocked(mockProvider.expand)
        .mockResolvedValueOnce('THREADS:\n1|a|A|active|x\n2|b|B|active|y\nCOMPLEXITY: 0.6')
        .mockResolvedValueOnce('DENSITY:\naverage=3.0')
        .mockResolvedValueOnce('CHARACTERS:\nx|5|0.5\ny|5|0.5\nROLES:\nprotagonist=x\nsupporting=y')
        .mockResolvedValueOnce('SCENES:\n1|a|0|0.5\n2|b|0.5|1\nTRANSITIONS: 1\nSMOOTHNESS: 0.8')
        .mockResolvedValueOnce('READABILITY:\nscore=0.8\nlevel=intermediate')
        .mockResolvedValueOnce('THREADS:\n1|a|A|active|x\nCOMPLEXITY: 0.4')
        .mockResolvedValueOnce('DENSITY:\naverage=2.0')
        .mockResolvedValueOnce('CHARACTERS:\nx|8|1.0\nROLES:\nprotagonist=x')
        .mockResolvedValueOnce('SCENES:\n1|a|0|1\nTRANSITIONS: 0\nSMOOTHNESS: 1.0')
        .mockResolvedValueOnce('READABILITY:\nscore=0.9\nlevel=advanced');

      const comparison = await service.compareComplexity(original, revised);

      expect(comparison.improvements).toBeDefined();
      expect(comparison.regressions).toBeDefined();
    });
  });

  describe('parseComplexityResponse', () => {
    it('should parse thread format', () => {
      const response = 'THREADS:\n1|main_plot|Main story|active|Elena\n2|subplot|Side story|dormant|Marco';

      const parsed = service.parseThreadResponse(response);

      expect(parsed.threads).toHaveLength(2);
      expect(parsed.threads[0].name).toBe('main_plot');
      expect(parsed.threads[0].description).toBe('Main story');
      expect(parsed.threads[0].status).toBe('active');
      expect(parsed.threads[0].characters).toContain('Elena');
    });

    it('should parse density format', () => {
      const response = 'DENSITY:\nparagraph_ideas=3|2|4\naverage=3.0\nexposition=0.4\naction=0.5\ndialogue=0.1';

      const parsed = service.parseDensityResponse(response);

      expect(parsed.ideasPerParagraph).toEqual([3, 2, 4]);
      expect(parsed.averageDensity).toBe(3.0);
      expect(parsed.contentBreakdown.exposition).toBe(0.4);
    });

    it('should parse character format', () => {
      const response = 'CHARACTERS:\nElena|5|0.6\nMarco|3|0.4\nROLES:\nprotagonist=Elena\nsupporting=Marco';

      const parsed = service.parseCharacterResponse(response);

      expect(parsed.characters['Elena'].mentions).toBe(5);
      expect(parsed.roles.protagonist).toBe('Elena');
    });

    it('should handle malformed responses gracefully', () => {
      const response = 'Invalid response format without expected structure';

      const parsed = service.parseThreadResponse(response);

      expect(parsed.threads).toEqual([]);
      expect(parsed.complexityScore).toBe(0);
    });
  });
});
