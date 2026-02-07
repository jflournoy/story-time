import type { LLMProvider } from '../providers/llm-provider';

export interface EntityRelationship {
  target: string;
  type: string;
  details?: string;
}

export interface Entity {
  type: 'character' | 'location' | 'object';
  name: string;
  mentions: number;
  firstAppearance: { paragraph: number; sentence: number };
  attributes: string[];
  relationships?: EntityRelationship[];
}

export interface EntityExtractionResult {
  characters: Entity[];
  locations: Entity[];
  objects: Entity[];
  entityCount: number;
}

export interface EntityComparison {
  added: {
    characters: string[];
    locations: string[];
    objects: string[];
  };
  removed: {
    characters: string[];
    locations: string[];
    objects: string[];
  };
  retained: {
    characters: string[];
    locations: string[];
    objects: string[];
  };
}

export interface EntitySummary {
  characterCount: number;
  locationCount: number;
  objectCount: number;
  totalMentions: number;
  mostMentioned: { name: string; mentions: number; type: string };
}

export interface ExtractionOptions {
  includeRelationships?: boolean;
}

interface ParsedEntity {
  name: string;
  mentions?: number;
  attributes?: string[];
  firstParagraph?: number;
  firstSentence?: number;
}

interface ParsedResponse {
  characters: ParsedEntity[] | string[];
  locations: ParsedEntity[] | string[];
  objects: ParsedEntity[] | string[];
  relationships?: string[];
}

export class EntityExtractionService {
  constructor(private llmProvider: LLMProvider) {}

  /**
   * Extract entities from narrative text
   */
  async extractEntities(
    text: string,
    options: ExtractionOptions = {}
  ): Promise<EntityExtractionResult> {
    const prompt = this.buildExtractionPrompt(text, options);
    const response = await this.llmProvider.expand(prompt);
    const parsed = this.parseEntityResponse(response);

    const characters = this.buildEntities('character', parsed.characters);
    const locations = this.buildEntities('location', parsed.locations);
    const objects = this.buildEntities('object', parsed.objects);

    // Parse relationships if present
    if (options.includeRelationships && parsed.relationships) {
      this.attachRelationships(characters, locations, objects, parsed.relationships);
    }

    return {
      characters,
      locations,
      objects,
      entityCount: characters.length + locations.length + objects.length,
    };
  }

  /**
   * Compare entities between two text versions
   */
  async compareEntities(original: string, revised: string): Promise<EntityComparison> {
    const [originalEntities, revisedEntities] = await Promise.all([
      this.extractEntities(original),
      this.extractEntities(revised),
    ]);

    const originalCharNames = new Set(originalEntities.characters.map((c) => c.name));
    const revisedCharNames = new Set(revisedEntities.characters.map((c) => c.name));

    const originalLocNames = new Set(originalEntities.locations.map((l) => l.name));
    const revisedLocNames = new Set(revisedEntities.locations.map((l) => l.name));

    const originalObjNames = new Set(originalEntities.objects.map((o) => o.name));
    const revisedObjNames = new Set(revisedEntities.objects.map((o) => o.name));

    return {
      added: {
        characters: Array.from(revisedCharNames).filter((n) => !originalCharNames.has(n)),
        locations: Array.from(revisedLocNames).filter((n) => !originalLocNames.has(n)),
        objects: Array.from(revisedObjNames).filter((n) => !originalObjNames.has(n)),
      },
      removed: {
        characters: Array.from(originalCharNames).filter((n) => !revisedCharNames.has(n)),
        locations: Array.from(originalLocNames).filter((n) => !revisedLocNames.has(n)),
        objects: Array.from(originalObjNames).filter((n) => !revisedObjNames.has(n)),
      },
      retained: {
        characters: Array.from(originalCharNames).filter((n) => revisedCharNames.has(n)),
        locations: Array.from(originalLocNames).filter((n) => revisedLocNames.has(n)),
        objects: Array.from(originalObjNames).filter((n) => revisedObjNames.has(n)),
      },
    };
  }

  /**
   * Get a summary of entities in text
   */
  async getEntitySummary(text: string): Promise<EntitySummary> {
    const entities = await this.extractEntities(text);

    const allEntities = [
      ...entities.characters.map((e) => ({ ...e, type: 'character' })),
      ...entities.locations.map((e) => ({ ...e, type: 'location' })),
      ...entities.objects.map((e) => ({ ...e, type: 'object' })),
    ];

    const totalMentions = allEntities.reduce((sum, e) => sum + e.mentions, 0);

    const mostMentioned = allEntities.reduce(
      (max, e) => (e.mentions > max.mentions ? e : max),
      { name: '', mentions: 0, type: '' }
    );

    return {
      characterCount: entities.characters.length,
      locationCount: entities.locations.length,
      objectCount: entities.objects.length,
      totalMentions,
      mostMentioned: {
        name: mostMentioned.name,
        mentions: mostMentioned.mentions,
        type: mostMentioned.type,
      },
    };
  }

  /**
   * Parse LLM response into structured entity data
   */
  parseEntityResponse(response: string): ParsedResponse {
    const result: ParsedResponse = {
      characters: [],
      locations: [],
      objects: [],
      relationships: [],
    };

    const lines = response.split('\n');

    for (const line of lines) {
      if (line.startsWith('CHARACTERS:')) {
        result.characters = this.parseEntityLine(line.substring('CHARACTERS:'.length));
      } else if (line.startsWith('LOCATIONS:')) {
        result.locations = this.parseEntityLine(line.substring('LOCATIONS:'.length));
      } else if (line.startsWith('OBJECTS:')) {
        result.objects = this.parseEntityLine(line.substring('OBJECTS:'.length));
      } else if (line.startsWith('RELATIONSHIPS:')) {
        result.relationships = line
          .substring('RELATIONSHIPS:'.length)
          .trim()
          .split('|')
          .map((r) => r.trim())
          .filter((r) => r.length > 0);
      }
    }

    return result;
  }

  /**
   * Parse a single line of entities
   */
  private parseEntityLine(line: string): ParsedEntity[] | string[] {
    const trimmed = line.trim();

    if (trimmed === 'none' || trimmed === '') {
      return [];
    }

    const entities = trimmed.split('|').map((e) => e.trim());
    const result: ParsedEntity[] = [];

    for (const entity of entities) {
      const parsed = this.parseEntityWithMetadata(entity);
      if (parsed) {
        result.push(parsed);
      }
    }

    return result;
  }

  /**
   * Parse entity with optional metadata (mentions, attributes, first appearance)
   */
  private parseEntityWithMetadata(entity: string): ParsedEntity | null {
    if (!entity || entity === 'none') {
      return null;
    }

    // Pattern: Name(mentions)[attr1,attr2][first:p:s]
    // Examples: Elena(2), Elena[occupation:biologist], Elena[first:1:0]
    let name = entity;
    let mentions = 1;
    const attributes: string[] = [];
    let firstParagraph = 0;
    let firstSentence = 0;

    // Extract mention count: Name(count)
    const mentionMatch = entity.match(/^([^(]+)\((\d+)\)/);
    if (mentionMatch) {
      name = mentionMatch[1].trim();
      mentions = parseInt(mentionMatch[2], 10);
    }

    // Extract attributes: Name[attr:val,attr:val]
    const attrMatch = entity.match(/\[([^\]]+)\]/g);
    if (attrMatch) {
      for (const match of attrMatch) {
        const content = match.slice(1, -1);

        // Check for first appearance: first:p:s or first:p
        if (content.startsWith('first:')) {
          const parts = content.substring('first:'.length).split(':');
          firstParagraph = parseInt(parts[0], 10) || 0;
          firstSentence = parseInt(parts[1], 10) || 0;
        } else {
          // Parse attributes: key:value pairs
          const attrPairs = content.split(',');
          for (const pair of attrPairs) {
            const [, value] = pair.split(':').map((p) => p.trim());
            if (value) {
              attributes.push(value);
            }
          }
        }
      }

      // Remove brackets from name
      name = name.replace(/\[[^\]]+\]/g, '').trim();
    }

    // Clean up name from mention count
    name = name.replace(/\(\d+\)/, '').trim();

    return {
      name,
      mentions,
      attributes: attributes.length > 0 ? attributes : undefined,
      firstParagraph,
      firstSentence,
    };
  }

  /**
   * Build Entity objects from parsed data
   */
  private buildEntities(
    type: 'character' | 'location' | 'object',
    parsed: ParsedEntity[] | string[]
  ): Entity[] {
    return parsed.map((p) => {
      if (typeof p === 'string') {
        return {
          type,
          name: p,
          mentions: 1,
          firstAppearance: { paragraph: 0, sentence: 0 },
          attributes: [],
        };
      }

      return {
        type,
        name: p.name,
        mentions: p.mentions ?? 1,
        firstAppearance: {
          paragraph: p.firstParagraph ?? 0,
          sentence: p.firstSentence ?? 0,
        },
        attributes: p.attributes ?? [],
      };
    });
  }

  /**
   * Attach relationships to entities
   */
  private attachRelationships(
    characters: Entity[],
    locations: Entity[],
    objects: Entity[],
    relationships: string[]
  ): void {
    for (const rel of relationships) {
      // Format: Source->Target[relationship type]
      const match = rel.match(/^([^->]+)->([^[]+)\[([^\]]+)\]/);
      if (!match) continue;

      const [, sourceName, targetName, relDetails] = match;

      // Find source entity
      const source =
        characters.find((c) => c.name === sourceName.trim()) ||
        locations.find((l) => l.name === sourceName.trim()) ||
        objects.find((o) => o.name === sourceName.trim());

      if (source) {
        if (!source.relationships) {
          source.relationships = [];
        }
        source.relationships.push({
          target: targetName.trim(),
          type: relDetails.trim(),
        });
      }
    }
  }

  /**
   * Build the extraction prompt for the LLM
   */
  private buildExtractionPrompt(text: string, options: ExtractionOptions): string {
    let prompt = `Extract all entities from the following narrative text.

Respond in this exact format:
CHARACTERS: Name1|Name2|Name3 (or "none" if no characters)
LOCATIONS: Place1|Place2 (or "none" if no locations)
OBJECTS: Item1|Item2 (or "none" if no objects)

For each entity, optionally include:
- Mention count: Name(count) e.g., Elena(3)
- Attributes: Name[attr:value,attr:value] e.g., Elena[occupation:biologist,trait:curious]
- First appearance: Name[first:paragraph:sentence] e.g., Elena[first:0:1]`;

    if (options.includeRelationships) {
      prompt += `
RELATIONSHIPS: Source->Target[relationship] e.g., Elena->Marco[hired as guide]`;
    }

    prompt += `

TEXT:
${text}

Extract entities:`;

    return prompt;
  }
}
