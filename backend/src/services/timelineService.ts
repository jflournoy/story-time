import type { LLMProvider } from '../providers/llm-provider';

export interface EventRelationship {
  targetEventId: string;
  type: 'before' | 'after' | 'during' | 'causes' | 'caused_by';
}

export interface TimelineEvent {
  id: string;
  type: 'plot_point' | 'action' | 'state_change' | 'marker';
  description: string;
  characters: string[];
  location?: string;
  temporalPosition: number;
  temporalMarker?: string;
  relationships?: EventRelationship[];
}

export interface PacingMetrics {
  eventDensity: number;
  intensityCurve: number[];
  quietMoments: number[];
  climaxPosition: number;
}

export interface Timeline {
  events: TimelineEvent[];
  structure: 'linear' | 'non_linear' | 'flashback' | 'parallel';
  duration?: string;
  pacing: PacingMetrics;
}

export interface TimelineComparison {
  addedEvents: TimelineEvent[];
  removedEvents: TimelineEvent[];
  retainedEvents: TimelineEvent[];
  pacingChange: {
    densityDelta: number;
    climaxPositionDelta: number;
    averageIntensityDelta: number;
  };
}

export interface ExtractionOptions {
  includeRelationships?: boolean;
}

interface ParsedRelationship {
  sourceId: string;
  targetId: string;
  type: 'before' | 'after' | 'during' | 'causes' | 'caused_by';
}

interface ParsedResponse {
  events: TimelineEvent[];
  relationships: ParsedRelationship[];
  structure?: 'linear' | 'non_linear' | 'flashback' | 'parallel';
  duration?: string;
  pacing?: PacingMetrics;
}

export class TimelineService {
  constructor(private llmProvider: LLMProvider) {}

  /**
   * Extract events from narrative text
   */
  async extractEvents(
    text: string,
    options: ExtractionOptions = {}
  ): Promise<TimelineEvent[]> {
    const prompt = this.buildExtractionPrompt(text, options);
    const response = await this.llmProvider.expand(prompt);
    const parsed = this.parseEventResponse(response);

    // Attach relationships to events if requested
    if (options.includeRelationships && parsed.relationships.length > 0) {
      this.attachRelationships(parsed.events, parsed.relationships);
    }

    return parsed.events;
  }

  /**
   * Build a complete timeline from narrative text
   */
  async buildTimeline(text: string): Promise<Timeline> {
    const prompt = this.buildTimelinePrompt(text);
    const response = await this.llmProvider.expand(prompt);
    const parsed = this.parseEventResponse(response);

    return {
      events: parsed.events,
      structure: parsed.structure || 'linear',
      duration: parsed.duration,
      pacing: parsed.pacing || this.defaultPacing(),
    };
  }

  /**
   * Analyze pacing of narrative text
   */
  async analyzePacing(text: string): Promise<PacingMetrics> {
    const prompt = this.buildPacingPrompt(text);
    const response = await this.llmProvider.expand(prompt);
    const parsed = this.parseEventResponse(response);

    return parsed.pacing || this.defaultPacing();
  }

  /**
   * Compare timelines between two text versions
   */
  async compareTimelines(original: string, revised: string): Promise<TimelineComparison> {
    const [originalTimeline, revisedTimeline] = await Promise.all([
      this.buildTimeline(original),
      this.buildTimeline(revised),
    ]);

    const originalDescriptions = new Set(originalTimeline.events.map((e) => e.description));
    const revisedDescriptions = new Set(revisedTimeline.events.map((e) => e.description));

    const addedEvents = revisedTimeline.events.filter(
      (e) => !originalDescriptions.has(e.description)
    );
    const removedEvents = originalTimeline.events.filter(
      (e) => !revisedDescriptions.has(e.description)
    );
    const retainedEvents = originalTimeline.events.filter((e) =>
      revisedDescriptions.has(e.description)
    );

    const avgIntensityOriginal = this.averageIntensity(originalTimeline.pacing.intensityCurve);
    const avgIntensityRevised = this.averageIntensity(revisedTimeline.pacing.intensityCurve);

    return {
      addedEvents,
      removedEvents,
      retainedEvents,
      pacingChange: {
        densityDelta: revisedTimeline.pacing.eventDensity - originalTimeline.pacing.eventDensity,
        climaxPositionDelta:
          revisedTimeline.pacing.climaxPosition - originalTimeline.pacing.climaxPosition,
        averageIntensityDelta: avgIntensityRevised - avgIntensityOriginal,
      },
    };
  }

  /**
   * Parse LLM response into structured event data
   */
  parseEventResponse(response: string): ParsedResponse {
    const result: ParsedResponse = {
      events: [],
      relationships: [],
      structure: undefined,
      duration: undefined,
      pacing: undefined,
    };

    const lines = response.split('\n');
    let inEvents = false;
    let inRelationships = false;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed === 'EVENTS:') {
        inEvents = true;
        inRelationships = false;
        continue;
      }

      if (trimmed === 'RELATIONSHIPS:') {
        inEvents = false;
        inRelationships = true;
        continue;
      }

      if (trimmed.startsWith('STRUCTURE:')) {
        const structure = trimmed.substring('STRUCTURE:'.length).trim().toLowerCase();
        if (['linear', 'non_linear', 'flashback', 'parallel'].includes(structure)) {
          result.structure = structure as ParsedResponse['structure'];
        }
        inEvents = false;
        inRelationships = false;
        continue;
      }

      if (trimmed.startsWith('DURATION:')) {
        result.duration = trimmed.substring('DURATION:'.length).trim();
        inEvents = false;
        inRelationships = false;
        continue;
      }

      if (trimmed.startsWith('PACING:')) {
        result.pacing = this.parsePacingLine(trimmed.substring('PACING:'.length).trim());
        inEvents = false;
        inRelationships = false;
        continue;
      }

      if (inEvents && trimmed.length > 0) {
        const event = this.parseEventLine(trimmed);
        if (event) {
          result.events.push(event);
        }
      }

      if (inRelationships && trimmed.length > 0) {
        const relationship = this.parseRelationshipLine(trimmed);
        if (relationship) {
          result.relationships.push(relationship);
        }
      }
    }

    return result;
  }

  /**
   * Parse a single event line
   * Format: id|type|description|characters|position|location|temporalMarker
   */
  private parseEventLine(line: string): TimelineEvent | null {
    const parts = line.split('|').map((p) => p.trim());

    if (parts.length < 5) return null;

    const [id, typeStr, description, charactersStr, positionStr, location, temporalMarker] = parts;

    const validTypes = ['plot_point', 'action', 'state_change', 'marker'];
    const type = validTypes.includes(typeStr) ? typeStr : 'action';

    const characters =
      charactersStr && charactersStr !== 'none'
        ? charactersStr.split(',').map((c) => c.trim())
        : [];

    const temporalPosition = parseFloat(positionStr) || 0;

    return {
      id,
      type: type as TimelineEvent['type'],
      description,
      characters,
      location: location && location !== '' ? location : undefined,
      temporalPosition: Math.max(0, Math.min(1, temporalPosition)),
      temporalMarker: temporalMarker && temporalMarker !== '' ? temporalMarker : undefined,
    };
  }

  /**
   * Parse a relationship line
   * Format: sourceId->targetId|type
   */
  private parseRelationshipLine(line: string): ParsedRelationship | null {
    const match = line.match(/^(\d+)->(\d+)\|(\w+)$/);
    if (!match) return null;

    const [, sourceId, targetId, typeStr] = match;
    const validTypes = ['before', 'after', 'during', 'causes', 'caused_by'];

    if (!validTypes.includes(typeStr)) return null;

    return {
      sourceId,
      targetId,
      type: typeStr as ParsedRelationship['type'],
    };
  }

  /**
   * Parse pacing metrics from a line
   * Format: density=X,climax=Y,intensity=A|B|C,quiet=1|2
   */
  private parsePacingLine(line: string): PacingMetrics {
    const metrics: PacingMetrics = {
      eventDensity: 0,
      climaxPosition: 0.5,
      intensityCurve: [],
      quietMoments: [],
    };

    const parts = line.split(',');

    for (const part of parts) {
      const [key, value] = part.split('=').map((s) => s.trim());

      if (key === 'density') {
        metrics.eventDensity = parseFloat(value) || 0;
      } else if (key === 'climax') {
        metrics.climaxPosition = parseFloat(value) || 0.5;
      } else if (key === 'intensity') {
        metrics.intensityCurve = value.split('|').map((v) => parseFloat(v) || 0);
      } else if (key === 'quiet') {
        metrics.quietMoments = value.split('|').map((v) => parseInt(v, 10)).filter((n) => !isNaN(n));
      }
    }

    return metrics;
  }

  /**
   * Attach relationships to events
   */
  private attachRelationships(events: TimelineEvent[], relationships: ParsedRelationship[]): void {
    const eventMap = new Map(events.map((e) => [e.id, e]));

    for (const rel of relationships) {
      const source = eventMap.get(rel.sourceId);
      if (source) {
        if (!source.relationships) {
          source.relationships = [];
        }
        source.relationships.push({
          targetEventId: rel.targetId,
          type: rel.type,
        });
      }
    }
  }

  /**
   * Calculate average intensity from curve
   */
  private averageIntensity(curve: number[]): number {
    if (curve.length === 0) return 0;
    return curve.reduce((sum, v) => sum + v, 0) / curve.length;
  }

  /**
   * Default pacing metrics
   */
  private defaultPacing(): PacingMetrics {
    return {
      eventDensity: 0,
      climaxPosition: 0.5,
      intensityCurve: [],
      quietMoments: [],
    };
  }

  /**
   * Build extraction prompt for LLM
   */
  private buildExtractionPrompt(text: string, options: ExtractionOptions): string {
    let prompt = `Extract events from the following narrative text.

For each event, provide in this format:
ID|TYPE|DESCRIPTION|CHARACTERS|POSITION|LOCATION|TEMPORAL_MARKER

Where:
- ID: Unique numeric identifier
- TYPE: plot_point, action, state_change, or marker
- DESCRIPTION: Brief description of the event
- CHARACTERS: Comma-separated character names (or "none")
- POSITION: 0-1 normalized position in narrative
- LOCATION: Where event occurs (optional)
- TEMPORAL_MARKER: Time reference like "three days later" (optional)

Example:
EVENTS:
1|plot_point|Elena discovered the map|Elena|0.3|library|morning
2|action|Marco joined the expedition|Marco|0.5`;

    if (options.includeRelationships) {
      prompt += `

Also identify relationships between events:
RELATIONSHIPS:
sourceId->targetId|type

Types: before, after, during, causes, caused_by`;
    }

    prompt += `

TEXT:
${text}

Extract events:`;

    return prompt;
  }

  /**
   * Build timeline prompt for LLM
   */
  private buildTimelinePrompt(text: string): string {
    return `Analyze the following narrative text and build a timeline.

Extract all events and provide:
1. EVENTS in format: ID|TYPE|DESCRIPTION|CHARACTERS|POSITION|LOCATION|TEMPORAL_MARKER
2. STRUCTURE: linear, non_linear, flashback, or parallel
3. DURATION: Overall narrative timespan (e.g., "several weeks", "one day")
4. PACING: density=X,climax=Y,intensity=A|B|C (values 0-1)

TEXT:
${text}

Build timeline:`;
  }

  /**
   * Build pacing analysis prompt for LLM
   */
  private buildPacingPrompt(text: string): string {
    return `Analyze the pacing of the following narrative text.

Provide pacing metrics in this format:
PACING: density=X,climax=Y,intensity=A|B|C,quiet=1|2|3

Where:
- density: Events per paragraph (float)
- climax: Position of climax in narrative (0-1)
- intensity: Tension/action level for each section (0-1 values separated by |)
- quiet: Indices of low-intensity sections (separated by |)

TEXT:
${text}

Analyze pacing:`;
  }
}
