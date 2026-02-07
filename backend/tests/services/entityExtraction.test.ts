import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { LLMProvider } from '../../src/providers/llm-provider';
import { EntityExtractionService } from '../../src/services/entityExtractionService';

describe('EntityExtractionService', () => {
  let service: EntityExtractionService;
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

    service = new EntityExtractionService(mockProvider);
  });

  describe('extractEntities', () => {
    it('should extract characters from narrative text', async () => {
      const text = 'Elena walked through the forest. Marco followed her closely.';

      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'CHARACTERS: Elena|Marco\nLOCATIONS: forest\nOBJECTS: none'
      );

      const result = await service.extractEntities(text);

      expect(result.characters).toHaveLength(2);
      expect(result.characters.map((c) => c.name)).toContain('Elena');
      expect(result.characters.map((c) => c.name)).toContain('Marco');
    });

    it('should extract locations from narrative text', async () => {
      const text = 'The Amazon jungle stretched before them. The research station was nearby.';

      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'CHARACTERS: none\nLOCATIONS: Amazon jungle|research station\nOBJECTS: none'
      );

      const result = await service.extractEntities(text);

      expect(result.locations).toHaveLength(2);
      expect(result.locations.map((l) => l.name)).toContain('Amazon jungle');
      expect(result.locations.map((l) => l.name)).toContain('research station');
    });

    it('should extract significant objects from narrative text', async () => {
      const text = 'She found an ancient map. The compass pointed north.';

      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'CHARACTERS: none\nLOCATIONS: none\nOBJECTS: ancient map|compass'
      );

      const result = await service.extractEntities(text);

      expect(result.objects).toHaveLength(2);
      expect(result.objects.map((o) => o.name)).toContain('ancient map');
      expect(result.objects.map((o) => o.name)).toContain('compass');
    });

    it('should track mention count for each entity', async () => {
      const text = 'Elena examined the artifact. Elena was fascinated. The artifact glowed.';

      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'CHARACTERS: Elena(2)\nLOCATIONS: none\nOBJECTS: artifact(2)'
      );

      const result = await service.extractEntities(text);

      const elena = result.characters.find((c) => c.name === 'Elena');
      expect(elena?.mentions).toBe(2);

      const artifact = result.objects.find((o) => o.name === 'artifact');
      expect(artifact?.mentions).toBe(2);
    });

    it('should return total entity count', async () => {
      const text = 'Elena and Marco explored the temple with the golden idol.';

      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'CHARACTERS: Elena|Marco\nLOCATIONS: temple\nOBJECTS: golden idol'
      );

      const result = await service.extractEntities(text);

      expect(result.entityCount).toBe(4);
    });
  });

  describe('extractWithAttributes', () => {
    it('should extract character attributes', async () => {
      const text = 'Dr. Elena Martinez, a renowned marine biologist, studied the coral.';

      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'CHARACTERS: Elena Martinez[title:Dr.,occupation:marine biologist,trait:renowned]\n' +
          'LOCATIONS: none\nOBJECTS: coral'
      );

      const result = await service.extractEntities(text);

      const elena = result.characters.find((c) => c.name === 'Elena Martinez');
      expect(elena?.attributes).toContain('marine biologist');
    });

    it('should extract location attributes', async () => {
      const text = 'The ancient temple, hidden deep in the jungle, stood before them.';

      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'CHARACTERS: none\n' +
          'LOCATIONS: ancient temple[condition:ancient,location:deep in jungle,state:hidden]\n' +
          'OBJECTS: none'
      );

      const result = await service.extractEntities(text);

      const temple = result.locations.find((l) => l.name === 'ancient temple');
      expect(temple?.attributes).toContain('ancient');
    });

    it('should extract object attributes', async () => {
      const text = 'The ornate golden compass was centuries old.';

      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'CHARACTERS: none\nLOCATIONS: none\n' +
          'OBJECTS: golden compass[material:gold,appearance:ornate,age:centuries old]'
      );

      const result = await service.extractEntities(text);

      const compass = result.objects.find((o) => o.name === 'golden compass');
      expect(compass?.attributes).toContain('gold');
      expect(compass?.attributes).toContain('ornate');
    });
  });

  describe('trackFirstAppearance', () => {
    it('should track paragraph of first appearance', async () => {
      const text = 'The story begins.\n\nElena arrived at dawn.\n\nShe explored the area.';

      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'CHARACTERS: Elena[first:1]\nLOCATIONS: none\nOBJECTS: none'
      );

      const result = await service.extractEntities(text);

      const elena = result.characters.find((c) => c.name === 'Elena');
      expect(elena?.firstAppearance.paragraph).toBe(1);
    });

    it('should track sentence of first appearance within paragraph', async () => {
      const text = 'The forest was quiet. Then Elena appeared. She looked around.';

      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'CHARACTERS: Elena[first:0:1]\nLOCATIONS: forest[first:0:0]\nOBJECTS: none'
      );

      const result = await service.extractEntities(text);

      const elena = result.characters.find((c) => c.name === 'Elena');
      expect(elena?.firstAppearance.paragraph).toBe(0);
      expect(elena?.firstAppearance.sentence).toBe(1);
    });
  });

  describe('extractRelationships', () => {
    it('should detect relationships between characters', async () => {
      const text = 'Elena hired Marco as her guide. He led the expedition.';

      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'CHARACTERS: Elena|Marco\nLOCATIONS: none\nOBJECTS: none\n' +
          'RELATIONSHIPS: Elena->Marco[hired as guide]'
      );

      const result = await service.extractEntities(text, { includeRelationships: true });

      const elena = result.characters.find((c) => c.name === 'Elena');
      expect(elena?.relationships).toBeDefined();
      expect(elena?.relationships?.some((r) => r.target === 'Marco')).toBe(true);
    });

    it('should detect character-location relationships', async () => {
      const text = 'Elena lived at the research station for three years.';

      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'CHARACTERS: Elena\nLOCATIONS: research station\nOBJECTS: none\n' +
          'RELATIONSHIPS: Elena->research station[resided:3 years]'
      );

      const result = await service.extractEntities(text, { includeRelationships: true });

      const elena = result.characters.find((c) => c.name === 'Elena');
      expect(elena?.relationships?.some((r) => r.target === 'research station')).toBe(true);
    });

    it('should detect character-object relationships', async () => {
      const text = 'Elena discovered the ancient artifact. She protected it carefully.';

      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'CHARACTERS: Elena\nLOCATIONS: none\nOBJECTS: ancient artifact\n' +
          'RELATIONSHIPS: Elena->ancient artifact[discovered,protects]'
      );

      const result = await service.extractEntities(text, { includeRelationships: true });

      const elena = result.characters.find((c) => c.name === 'Elena');
      expect(elena?.relationships?.some((r) => r.target === 'ancient artifact')).toBe(true);
    });
  });

  describe('compareEntities', () => {
    it('should detect new entities between text versions', async () => {
      const original = 'Elena explored the forest.';
      const revised = 'Elena and Marco explored the ancient temple.';

      vi.mocked(mockProvider.expand)
        .mockResolvedValueOnce('CHARACTERS: Elena\nLOCATIONS: forest\nOBJECTS: none')
        .mockResolvedValueOnce(
          'CHARACTERS: Elena|Marco\nLOCATIONS: ancient temple\nOBJECTS: none'
        );

      const comparison = await service.compareEntities(original, revised);

      expect(comparison.added.characters).toContain('Marco');
      expect(comparison.added.locations).toContain('ancient temple');
      expect(comparison.removed.locations).toContain('forest');
    });

    it('should detect removed entities between text versions', async () => {
      const original = 'Elena, Marco, and Sofia traveled together.';
      const revised = 'Elena traveled alone.';

      vi.mocked(mockProvider.expand)
        .mockResolvedValueOnce('CHARACTERS: Elena|Marco|Sofia\nLOCATIONS: none\nOBJECTS: none')
        .mockResolvedValueOnce('CHARACTERS: Elena\nLOCATIONS: none\nOBJECTS: none');

      const comparison = await service.compareEntities(original, revised);

      expect(comparison.removed.characters).toContain('Marco');
      expect(comparison.removed.characters).toContain('Sofia');
      expect(comparison.retained.characters).toContain('Elena');
    });
  });

  describe('getEntitySummary', () => {
    it('should generate a summary of all entities', async () => {
      const text = 'Elena found the map in the temple. Marco helped her decode it.';

      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'CHARACTERS: Elena(2)|Marco(1)\nLOCATIONS: temple(1)\nOBJECTS: map(2)'
      );

      const summary = await service.getEntitySummary(text);

      expect(summary.characterCount).toBe(2);
      expect(summary.locationCount).toBe(1);
      expect(summary.objectCount).toBe(1);
      expect(summary.totalMentions).toBeGreaterThan(0);
    });

    it('should identify most mentioned entities', async () => {
      const text = 'Elena examined the artifact. Elena was amazed by the artifact. The artifact was ancient.';

      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'CHARACTERS: Elena(2)\nLOCATIONS: none\nOBJECTS: artifact(3)'
      );

      const summary = await service.getEntitySummary(text);

      expect(summary.mostMentioned.name).toBe('artifact');
      expect(summary.mostMentioned.mentions).toBe(3);
    });
  });

  describe('parseEntityResponse', () => {
    it('should parse standard entity format', () => {
      const response = 'CHARACTERS: Elena|Marco\nLOCATIONS: temple\nOBJECTS: map';

      const parsed = service.parseEntityResponse(response);

      expect(parsed.characters).toHaveLength(2);
      expect(parsed.characters[0]).toMatchObject({ name: 'Elena' });
      expect(parsed.characters[1]).toMatchObject({ name: 'Marco' });
      expect(parsed.locations[0]).toMatchObject({ name: 'temple' });
      expect(parsed.objects[0]).toMatchObject({ name: 'map' });
    });

    it('should handle entities with mention counts', () => {
      const response = 'CHARACTERS: Elena(3)|Marco(1)\nLOCATIONS: temple(2)\nOBJECTS: none';

      const parsed = service.parseEntityResponse(response);

      expect(parsed.characters[0]).toMatchObject({ name: 'Elena', mentions: 3 });
      expect(parsed.characters[1]).toMatchObject({ name: 'Marco', mentions: 1 });
    });

    it('should handle entities with attributes', () => {
      const response =
        'CHARACTERS: Elena[occupation:biologist,trait:determined]\nLOCATIONS: none\nOBJECTS: none';

      const parsed = service.parseEntityResponse(response);

      expect(parsed.characters[0]).toMatchObject({
        name: 'Elena',
        attributes: ['biologist', 'determined'],
      });
    });

    it('should handle empty responses gracefully', () => {
      const response = 'CHARACTERS: none\nLOCATIONS: none\nOBJECTS: none';

      const parsed = service.parseEntityResponse(response);

      expect(parsed.characters).toEqual([]);
      expect(parsed.locations).toEqual([]);
      expect(parsed.objects).toEqual([]);
    });
  });
});
