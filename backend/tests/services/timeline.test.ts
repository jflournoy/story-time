import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { LLMProvider } from '../../src/providers/llm-provider';
import { TimelineService } from '../../src/services/timelineService';

describe('TimelineService', () => {
  let service: TimelineService;
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

    service = new TimelineService(mockProvider);
  });

  describe('extractEvents', () => {
    it('should extract plot points from narrative text', async () => {
      const text = 'Elena discovered the ancient map. She decided to embark on a journey.';

      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'EVENTS:\n' +
          '1|plot_point|Elena discovered the ancient map|Elena|0.3\n' +
          '2|action|Elena decided to embark on journey|Elena|0.7'
      );

      const events = await service.extractEvents(text);

      expect(events).toHaveLength(2);
      expect(events[0].type).toBe('plot_point');
      expect(events[0].description).toContain('ancient map');
      expect(events[0].characters).toContain('Elena');
    });

    it('should extract actions with character attribution', async () => {
      const text = 'Marco led the group through the jungle. Elena documented their findings.';

      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'EVENTS:\n' +
          '1|action|Marco led group through jungle|Marco|0.4|jungle\n' +
          '2|action|Elena documented findings|Elena|0.6'
      );

      const events = await service.extractEvents(text);

      expect(events[0].characters).toContain('Marco');
      expect(events[1].characters).toContain('Elena');
      expect(events[0].location).toBe('jungle');
    });

    it('should extract state changes', async () => {
      const text = 'The temple doors opened, revealing the treasure chamber.';

      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'EVENTS:\n' +
          '1|state_change|Temple doors opened|none|0.5|temple\n' +
          '2|state_change|Treasure chamber revealed|none|0.6|treasure chamber'
      );

      const events = await service.extractEvents(text);

      expect(events[0].type).toBe('state_change');
      expect(events[1].type).toBe('state_change');
    });

    it('should extract temporal markers', async () => {
      const text = 'Three days later, they reached the summit. By morning, the storm had passed.';

      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'EVENTS:\n' +
          '1|action|They reached the summit|they|0.4|summit|three days later\n' +
          '2|state_change|Storm passed|none|0.7||by morning'
      );

      const events = await service.extractEvents(text);

      expect(events[0].temporalMarker).toBe('three days later');
      expect(events[1].temporalMarker).toBe('by morning');
    });

    it('should assign temporal positions to events', async () => {
      const text = 'First event. Second event. Third event.';

      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'EVENTS:\n' +
          '1|action|First event|none|0.2\n' +
          '2|action|Second event|none|0.5\n' +
          '3|action|Third event|none|0.8'
      );

      const events = await service.extractEvents(text);

      expect(events[0].temporalPosition).toBeLessThan(events[1].temporalPosition);
      expect(events[1].temporalPosition).toBeLessThan(events[2].temporalPosition);
    });
  });

  describe('buildTimeline', () => {
    it('should build a timeline from narrative text', async () => {
      const text = 'Elena found the map. She traveled east. She discovered the temple.';

      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'EVENTS:\n' +
          '1|plot_point|Found the map|Elena|0.2\n' +
          '2|action|Traveled east|Elena|0.5\n' +
          '3|plot_point|Discovered temple|Elena|0.9\n' +
          'STRUCTURE: linear\n' +
          'DURATION: several weeks'
      );

      const timeline = await service.buildTimeline(text);

      expect(timeline.events).toHaveLength(3);
      expect(timeline.structure).toBe('linear');
      expect(timeline.duration).toBe('several weeks');
    });

    it('should detect non-linear narrative structure', async () => {
      const text = 'She remembered her childhood. Now, years later, she stood at the crossroads.';

      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'EVENTS:\n' +
          '1|marker|Childhood memory|She|0.3\n' +
          '2|action|Standing at crossroads|She|0.7\n' +
          'STRUCTURE: flashback\n' +
          'DURATION: years'
      );

      const timeline = await service.buildTimeline(text);

      expect(timeline.structure).toBe('flashback');
    });

    it('should detect parallel narrative structure', async () => {
      const text = 'Meanwhile, in the city... At the same time, in the forest...';

      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'EVENTS:\n' +
          '1|action|Events in city|characters|0.5|city\n' +
          '2|action|Events in forest|characters|0.5|forest\n' +
          'STRUCTURE: parallel\n' +
          'DURATION: simultaneous'
      );

      const timeline = await service.buildTimeline(text);

      expect(timeline.structure).toBe('parallel');
    });

    it('should include pacing metrics', async () => {
      const text = 'Action scene. Quiet moment. Climax builds. Resolution.';

      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'EVENTS:\n' +
          '1|action|Action scene|none|0.2\n' +
          '2|state_change|Quiet moment|none|0.4\n' +
          '3|plot_point|Climax|none|0.7\n' +
          '4|state_change|Resolution|none|0.95\n' +
          'STRUCTURE: linear\n' +
          'PACING: density=0.8,climax=0.7,intensity=0.3|0.1|0.9|0.4'
      );

      const timeline = await service.buildTimeline(text);

      expect(timeline.pacing).toBeDefined();
      expect(timeline.pacing.eventDensity).toBeGreaterThan(0);
      expect(timeline.pacing.climaxPosition).toBeCloseTo(0.7, 1);
    });
  });

  describe('detectRelationships', () => {
    it('should detect causal relationships between events', async () => {
      const text = 'The explosion caused the building to collapse. Everyone fled in panic.';

      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'EVENTS:\n' +
          '1|action|Explosion occurred|none|0.2\n' +
          '2|state_change|Building collapsed|none|0.4\n' +
          '3|action|Everyone fled|everyone|0.6\n' +
          'RELATIONSHIPS:\n' +
          '1->2|causes\n' +
          '2->3|causes'
      );

      const events = await service.extractEvents(text, { includeRelationships: true });

      expect(events[0].relationships).toBeDefined();
      expect(events[0].relationships?.some((r) => r.type === 'causes')).toBe(true);
    });

    it('should detect before/after relationships', async () => {
      const text = 'First, she packed her bags. Then, she left the house.';

      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'EVENTS:\n' +
          '1|action|Packed bags|she|0.3\n' +
          '2|action|Left house|she|0.7\n' +
          'RELATIONSHIPS:\n' +
          '1->2|before\n' +
          '2->1|after'
      );

      const events = await service.extractEvents(text, { includeRelationships: true });

      const packEvent = events.find((e) => e.description.includes('Packed'));
      expect(packEvent?.relationships?.some((r) => r.type === 'before')).toBe(true);
    });

    it('should detect during/simultaneous relationships', async () => {
      const text = 'While Elena searched the room, Marco kept watch at the door.';

      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'EVENTS:\n' +
          '1|action|Elena searched room|Elena|0.5|room\n' +
          '2|action|Marco kept watch|Marco|0.5|door\n' +
          'RELATIONSHIPS:\n' +
          '1->2|during\n' +
          '2->1|during'
      );

      const events = await service.extractEvents(text, { includeRelationships: true });

      expect(events[0].relationships?.some((r) => r.type === 'during')).toBe(true);
    });
  });

  describe('analyzePacing', () => {
    it('should calculate event density', async () => {
      const text = 'Paragraph 1 with events.\n\nParagraph 2 with more events.\n\nParagraph 3.';

      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'EVENTS:\n' +
          '1|action|Event 1|none|0.2\n' +
          '2|action|Event 2|none|0.3\n' +
          '3|action|Event 3|none|0.5\n' +
          '4|action|Event 4|none|0.6\n' +
          'PACING: density=1.33'
      );

      const pacing = await service.analyzePacing(text);

      expect(pacing.eventDensity).toBeCloseTo(1.33, 1);
    });

    it('should identify climax position', async () => {
      const text = 'Rising action. Tension builds. CLIMAX! Resolution follows.';

      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'EVENTS:\n' +
          '1|action|Rising action|none|0.2\n' +
          '2|action|Tension builds|none|0.4\n' +
          '3|plot_point|CLIMAX|none|0.7\n' +
          '4|state_change|Resolution|none|0.9\n' +
          'PACING: density=1.0,climax=0.7,intensity=0.3|0.5|1.0|0.2'
      );

      const pacing = await service.analyzePacing(text);

      expect(pacing.climaxPosition).toBeCloseTo(0.7, 1);
    });

    it('should calculate intensity curve', async () => {
      const text = 'Calm opening. Tension rises. Peak action. Quiet ending.';

      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'PACING: density=1.0,climax=0.6,intensity=0.2|0.5|0.9|0.3'
      );

      const pacing = await service.analyzePacing(text);

      expect(pacing.intensityCurve).toHaveLength(4);
      expect(pacing.intensityCurve[2]).toBeGreaterThan(pacing.intensityCurve[0]);
    });

    it('should identify quiet moments', async () => {
      const text = 'Action. Reflection. More action. Peaceful scene. Finale.';

      vi.mocked(mockProvider.expand).mockResolvedValueOnce(
        'PACING: density=1.0,climax=0.8,intensity=0.8|0.2|0.7|0.1|0.9,quiet=1|3'
      );

      const pacing = await service.analyzePacing(text);

      expect(pacing.quietMoments).toContain(1);
      expect(pacing.quietMoments).toContain(3);
    });
  });

  describe('compareTimelines', () => {
    it('should compare events between two text versions', async () => {
      const original = 'Elena found the map. She traveled to the temple.';
      const revised = 'Elena found the map. Marco joined her. They traveled to the temple.';

      vi.mocked(mockProvider.expand)
        .mockResolvedValueOnce(
          'EVENTS:\n1|plot_point|Found map|Elena|0.3\n2|action|Traveled to temple|Elena|0.8'
        )
        .mockResolvedValueOnce(
          'EVENTS:\n1|plot_point|Found map|Elena|0.2\n2|action|Marco joined|Marco|0.5\n3|action|Traveled to temple|Elena,Marco|0.9'
        );

      const comparison = await service.compareTimelines(original, revised);

      expect(comparison.addedEvents).toHaveLength(1);
      expect(comparison.addedEvents[0].description).toContain('Marco');
      expect(comparison.retainedEvents).toHaveLength(2);
    });

    it('should detect removed events', async () => {
      const original = 'Elena explored. She found treasure. She celebrated.';
      const revised = 'Elena explored. She found treasure.';

      vi.mocked(mockProvider.expand)
        .mockResolvedValueOnce(
          'EVENTS:\n1|action|Explored|Elena|0.3\n2|plot_point|Found treasure|Elena|0.6\n3|action|Celebrated|Elena|0.9'
        )
        .mockResolvedValueOnce(
          'EVENTS:\n1|action|Explored|Elena|0.4\n2|plot_point|Found treasure|Elena|0.8'
        );

      const comparison = await service.compareTimelines(original, revised);

      expect(comparison.removedEvents).toHaveLength(1);
      expect(comparison.removedEvents[0].description).toContain('Celebrated');
    });

    it('should detect pacing changes', async () => {
      const original = 'Quick action. More action. Even more action.';
      const revised = 'Slow build. Reflection. Then action.';

      vi.mocked(mockProvider.expand)
        .mockResolvedValueOnce(
          'EVENTS:\n1|action|Quick|none|0.3\n2|action|More|none|0.6\n3|action|Even more|none|0.9\n' +
            'PACING: density=1.0,climax=0.9,intensity=0.8|0.8|0.9'
        )
        .mockResolvedValueOnce(
          'EVENTS:\n1|state_change|Slow build|none|0.3\n2|state_change|Reflection|none|0.6\n3|action|Action|none|0.9\n' +
            'PACING: density=1.0,climax=0.9,intensity=0.3|0.2|0.8'
        );

      const comparison = await service.compareTimelines(original, revised);

      expect(comparison.pacingChange).toBeDefined();
      expect(comparison.pacingChange.averageIntensityDelta).toBeDefined();
    });
  });

  describe('parseEventResponse', () => {
    it('should parse standard event format', () => {
      const response = 'EVENTS:\n1|action|Event description|character|0.5';

      const parsed = service.parseEventResponse(response);

      expect(parsed.events).toHaveLength(1);
      expect(parsed.events[0]).toMatchObject({
        id: '1',
        type: 'action',
        description: 'Event description',
      });
    });

    it('should parse events with locations and temporal markers', () => {
      const response = 'EVENTS:\n1|plot_point|Discovery|Elena|0.3|temple|dawn';

      const parsed = service.parseEventResponse(response);

      expect(parsed.events[0].location).toBe('temple');
      expect(parsed.events[0].temporalMarker).toBe('dawn');
    });

    it('should parse multiple characters', () => {
      const response = 'EVENTS:\n1|action|Team effort|Elena,Marco,Sofia|0.5';

      const parsed = service.parseEventResponse(response);

      expect(parsed.events[0].characters).toContain('Elena');
      expect(parsed.events[0].characters).toContain('Marco');
      expect(parsed.events[0].characters).toContain('Sofia');
    });

    it('should parse relationships', () => {
      const response = 'EVENTS:\n1|action|First|none|0.3\n2|action|Second|none|0.6\nRELATIONSHIPS:\n1->2|causes';

      const parsed = service.parseEventResponse(response);

      expect(parsed.relationships).toHaveLength(1);
      expect(parsed.relationships[0]).toMatchObject({
        sourceId: '1',
        targetId: '2',
        type: 'causes',
      });
    });

    it('should parse pacing metrics', () => {
      const response = 'PACING: density=0.8,climax=0.7,intensity=0.2|0.5|0.9,quiet=1';

      const parsed = service.parseEventResponse(response);

      expect(parsed.pacing).toMatchObject({
        eventDensity: 0.8,
        climaxPosition: 0.7,
      });
      expect(parsed.pacing?.intensityCurve).toEqual([0.2, 0.5, 0.9]);
    });

    it('should handle empty responses gracefully', () => {
      const response = 'EVENTS:\nSTRUCTURE: linear';

      const parsed = service.parseEventResponse(response);

      expect(parsed.events).toEqual([]);
      expect(parsed.structure).toBe('linear');
    });
  });
});
