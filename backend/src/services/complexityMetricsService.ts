import type { LLMProvider } from '../providers/llm-provider';

// Plot Thread Types
export interface PlotThread {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'dormant' | 'resolved';
  characters: string[];
}

export interface ThreadInterweaving {
  sequence: number[];
  switchCount: number;
}

export interface PlotThreadAnalysis {
  threads: PlotThread[];
  interweaving: ThreadInterweaving;
  complexityScore: number;
}

// Narrative Density Types
export interface ContentBreakdown {
  exposition: number;
  action: number;
  dialogue: number;
  description: number;
}

export interface NarrativeDensity {
  ideasPerParagraph: number[];
  averageDensity: number;
  contentBreakdown: ContentBreakdown;
  sectionLoad: number[];
  peakLoadSections: number[];
}

// Character Involvement Types
export interface CharacterStats {
  mentions: number;
  frequency: number;
}

export interface POVAnalysis {
  switches: number;
  sequence: string[];
}

export interface CharacterRoles {
  protagonist: string;
  supporting: string[];
  minor: string[];
}

export interface CharacterInvolvement {
  characters: Record<string, CharacterStats>;
  interactions: Record<string, number>;
  povAnalysis: POVAnalysis;
  roles: CharacterRoles;
}

// Scene Complexity Types
export interface Scene {
  id: string;
  location: string;
  startPosition: number;
  endPosition: number;
}

export interface SceneTransition {
  from: string;
  to: string;
  type: 'smooth' | 'abrupt';
}

export interface SceneComplexity {
  scenes: Scene[];
  settingChangeCount: number;
  sceneLengths: number[];
  lengthVariability: number;
  transitions: SceneTransition[];
  overallSmoothness: number;
}

// Readability Types
export interface Readability {
  avgSentenceLength: number;
  sentenceLengthVariance: number;
  uniqueWords: number;
  totalWords: number;
  vocabularyRichness: number;
  rareWordRatio: number;
  paragraphCount: number;
  avgParagraphLength: number;
  paragraphVariance: number;
  structureScore: number;
  overallScore: number;
  readabilityLevel: 'simple' | 'intermediate' | 'advanced';
  recommendations: string[];
}

// Full Report Types
export interface ComplexityReport {
  plotThreads: PlotThreadAnalysis;
  narrativeDensity: NarrativeDensity;
  characterInvolvement: CharacterInvolvement;
  sceneComplexity: SceneComplexity;
  readability: Readability;
  overallComplexity: number;
  recommendations: string[];
}

export interface ComplexityComparison {
  complexityDelta: number;
  threadCountDelta: number;
  characterCountDelta: number;
  improvements: string[];
  regressions: string[];
}

export class ComplexityMetricsService {
  constructor(private llmProvider: LLMProvider) {}

  /**
   * Analyze plot threads in narrative text
   */
  async analyzePlotThreads(text: string): Promise<PlotThreadAnalysis> {
    const prompt = this.buildThreadsPrompt(text);
    const response = await this.llmProvider.expand(prompt);
    return this.parseThreadResponse(response);
  }

  /**
   * Analyze narrative density
   */
  async analyzeNarrativeDensity(text: string): Promise<NarrativeDensity> {
    const prompt = this.buildDensityPrompt(text);
    const response = await this.llmProvider.expand(prompt);
    return this.parseDensityResponse(response);
  }

  /**
   * Analyze character involvement
   */
  async analyzeCharacterInvolvement(text: string): Promise<CharacterInvolvement> {
    const prompt = this.buildCharacterPrompt(text);
    const response = await this.llmProvider.expand(prompt);
    return this.parseCharacterResponse(response);
  }

  /**
   * Analyze scene complexity
   */
  async analyzeSceneComplexity(text: string): Promise<SceneComplexity> {
    const prompt = this.buildScenePrompt(text);
    const response = await this.llmProvider.expand(prompt);
    return this.parseSceneResponse(response);
  }

  /**
   * Analyze readability
   */
  async analyzeReadability(text: string): Promise<Readability> {
    const prompt = this.buildReadabilityPrompt(text);
    const response = await this.llmProvider.expand(prompt);
    return this.parseReadabilityResponse(response);
  }

  /**
   * Generate full complexity report
   */
  async getFullComplexityReport(text: string): Promise<ComplexityReport> {
    const [plotThreads, narrativeDensity, characterInvolvement, sceneComplexity, readability] =
      await Promise.all([
        this.analyzePlotThreads(text),
        this.analyzeNarrativeDensity(text),
        this.analyzeCharacterInvolvement(text),
        this.analyzeSceneComplexity(text),
        this.analyzeReadability(text),
      ]);

    const overallComplexity = this.calculateOverallComplexity(
      plotThreads,
      narrativeDensity,
      sceneComplexity,
      readability
    );

    const recommendations = this.generateRecommendations(
      plotThreads,
      narrativeDensity,
      characterInvolvement,
      sceneComplexity,
      readability
    );

    return {
      plotThreads,
      narrativeDensity,
      characterInvolvement,
      sceneComplexity,
      readability,
      overallComplexity,
      recommendations,
    };
  }

  /**
   * Compare complexity between two text versions
   */
  async compareComplexity(original: string, revised: string): Promise<ComplexityComparison> {
    const [originalReport, revisedReport] = await Promise.all([
      this.getFullComplexityReport(original),
      this.getFullComplexityReport(revised),
    ]);

    const complexityDelta = revisedReport.overallComplexity - originalReport.overallComplexity;
    const threadCountDelta =
      revisedReport.plotThreads.threads.length - originalReport.plotThreads.threads.length;
    const characterCountDelta =
      Object.keys(revisedReport.characterInvolvement.characters).length -
      Object.keys(originalReport.characterInvolvement.characters).length;

    const improvements: string[] = [];
    const regressions: string[] = [];

    // Analyze changes
    if (revisedReport.readability.overallScore > originalReport.readability.overallScore) {
      improvements.push('readability');
    } else if (revisedReport.readability.overallScore < originalReport.readability.overallScore) {
      regressions.push('readability');
    }

    if (revisedReport.plotThreads.complexityScore > originalReport.plotThreads.complexityScore) {
      improvements.push('plot_complexity');
    } else if (
      revisedReport.plotThreads.complexityScore < originalReport.plotThreads.complexityScore
    ) {
      regressions.push('plot_complexity');
    }

    if (revisedReport.sceneComplexity.overallSmoothness > originalReport.sceneComplexity.overallSmoothness) {
      improvements.push('scene_transitions');
    } else if (
      revisedReport.sceneComplexity.overallSmoothness < originalReport.sceneComplexity.overallSmoothness
    ) {
      regressions.push('scene_transitions');
    }

    return {
      complexityDelta,
      threadCountDelta,
      characterCountDelta,
      improvements,
      regressions,
    };
  }

  /**
   * Parse thread analysis response
   */
  parseThreadResponse(response: string): PlotThreadAnalysis {
    const result: PlotThreadAnalysis = {
      threads: [],
      interweaving: { sequence: [], switchCount: 0 },
      complexityScore: 0,
    };

    const lines = response.split('\n');
    let inThreads = false;
    let inInterweaving = false;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed === 'THREADS:') {
        inThreads = true;
        inInterweaving = false;
        continue;
      }

      if (trimmed === 'INTERWEAVING:') {
        inThreads = false;
        inInterweaving = true;
        continue;
      }

      if (trimmed.startsWith('COMPLEXITY:')) {
        result.complexityScore = parseFloat(trimmed.substring('COMPLEXITY:'.length).trim()) || 0;
        continue;
      }

      if (inThreads && trimmed.length > 0) {
        const thread = this.parseThreadLine(trimmed);
        if (thread) {
          result.threads.push(thread);
        }
      }

      if (inInterweaving && trimmed.length > 0) {
        if (trimmed.startsWith('sequence=')) {
          result.interweaving.sequence = trimmed
            .substring('sequence='.length)
            .split(',')
            .map((n) => parseInt(n.trim(), 10))
            .filter((n) => !isNaN(n));
        } else if (trimmed.startsWith('switches=')) {
          result.interweaving.switchCount = parseInt(trimmed.substring('switches='.length), 10) || 0;
        }
      }
    }

    return result;
  }

  /**
   * Parse density analysis response
   */
  parseDensityResponse(response: string): NarrativeDensity {
    const result: NarrativeDensity = {
      ideasPerParagraph: [],
      averageDensity: 0,
      contentBreakdown: { exposition: 0, action: 0, dialogue: 0, description: 0 },
      sectionLoad: [],
      peakLoadSections: [],
    };

    const lines = response.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith('paragraph_ideas=')) {
        result.ideasPerParagraph = trimmed
          .substring('paragraph_ideas='.length)
          .split('|')
          .map((n) => parseInt(n.trim(), 10))
          .filter((n) => !isNaN(n));
      } else if (trimmed.startsWith('average=')) {
        result.averageDensity = parseFloat(trimmed.substring('average='.length)) || 0;
      } else if (trimmed.startsWith('exposition=')) {
        result.contentBreakdown.exposition = parseFloat(trimmed.substring('exposition='.length)) || 0;
      } else if (trimmed.startsWith('action=')) {
        result.contentBreakdown.action = parseFloat(trimmed.substring('action='.length)) || 0;
      } else if (trimmed.startsWith('dialogue=')) {
        result.contentBreakdown.dialogue = parseFloat(trimmed.substring('dialogue='.length)) || 0;
      } else if (trimmed.startsWith('description=')) {
        result.contentBreakdown.description = parseFloat(trimmed.substring('description='.length)) || 0;
      } else if (trimmed.startsWith('section_load=')) {
        result.sectionLoad = trimmed
          .substring('section_load='.length)
          .split('|')
          .map((n) => parseFloat(n.trim()))
          .filter((n) => !isNaN(n));
      } else if (trimmed.startsWith('peak_sections=')) {
        result.peakLoadSections = trimmed
          .substring('peak_sections='.length)
          .split('|')
          .map((n) => parseInt(n.trim(), 10))
          .filter((n) => !isNaN(n));
      }
    }

    return result;
  }

  /**
   * Parse character analysis response
   */
  parseCharacterResponse(response: string): CharacterInvolvement {
    const result: CharacterInvolvement = {
      characters: {},
      interactions: {},
      povAnalysis: { switches: 0, sequence: [] },
      roles: { protagonist: '', supporting: [], minor: [] },
    };

    const lines = response.split('\n');
    let inCharacters = false;
    let inInteractions = false;
    let inRoles = false;
    let inPOV = false;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed === 'CHARACTERS:') {
        inCharacters = true;
        inInteractions = false;
        inRoles = false;
        inPOV = false;
        continue;
      }

      if (trimmed === 'INTERACTIONS:') {
        inCharacters = false;
        inInteractions = true;
        inRoles = false;
        inPOV = false;
        continue;
      }

      if (trimmed === 'ROLES:') {
        inCharacters = false;
        inInteractions = false;
        inRoles = true;
        inPOV = false;
        continue;
      }

      if (trimmed === 'POV:') {
        inCharacters = false;
        inInteractions = false;
        inRoles = false;
        inPOV = true;
        continue;
      }

      if (inCharacters && trimmed.length > 0) {
        const parts = trimmed.split('|').map((p) => p.trim());
        if (parts.length >= 3) {
          result.characters[parts[0]] = {
            mentions: parseInt(parts[1], 10) || 0,
            frequency: parseFloat(parts[2]) || 0,
          };
        }
      }

      if (inInteractions && trimmed.length > 0) {
        const parts = trimmed.split('|').map((p) => p.trim());
        if (parts.length >= 2) {
          result.interactions[parts[0]] = parseInt(parts[1], 10) || 0;
        }
      }

      if (inRoles && trimmed.length > 0) {
        if (trimmed.startsWith('protagonist=')) {
          result.roles.protagonist = trimmed.substring('protagonist='.length).trim();
        } else if (trimmed.startsWith('supporting=')) {
          result.roles.supporting = trimmed
            .substring('supporting='.length)
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s.length > 0);
        } else if (trimmed.startsWith('minor=')) {
          result.roles.minor = trimmed
            .substring('minor='.length)
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s.length > 0);
        }
      }

      if (inPOV && trimmed.length > 0) {
        if (trimmed.startsWith('switches=')) {
          result.povAnalysis.switches = parseInt(trimmed.substring('switches='.length), 10) || 0;
        } else if (trimmed.startsWith('sequence=')) {
          result.povAnalysis.sequence = trimmed
            .substring('sequence='.length)
            .split('|')
            .map((s) => s.trim())
            .filter((s) => s.length > 0);
        }
      }
    }

    return result;
  }

  /**
   * Parse scene analysis response
   */
  private parseSceneResponse(response: string): SceneComplexity {
    const result: SceneComplexity = {
      scenes: [],
      settingChangeCount: 0,
      sceneLengths: [],
      lengthVariability: 0,
      transitions: [],
      overallSmoothness: 0,
    };

    const lines = response.split('\n');
    let inScenes = false;
    let inTransitions = false;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed === 'SCENES:') {
        inScenes = true;
        inTransitions = false;
        continue;
      }

      if (trimmed === 'TRANSITIONS:') {
        inScenes = false;
        inTransitions = true;
        continue;
      }

      if (trimmed.startsWith('TRANSITIONS:') && !inTransitions) {
        result.settingChangeCount = parseInt(trimmed.substring('TRANSITIONS:'.length).trim(), 10) || 0;
        continue;
      }

      if (trimmed.startsWith('LENGTHS:')) {
        result.sceneLengths = trimmed
          .substring('LENGTHS:'.length)
          .split('|')
          .map((n) => parseFloat(n.trim()))
          .filter((n) => !isNaN(n));
        continue;
      }

      if (trimmed.startsWith('VARIABILITY:')) {
        result.lengthVariability = parseFloat(trimmed.substring('VARIABILITY:'.length)) || 0;
        continue;
      }

      if (trimmed.startsWith('SMOOTHNESS:')) {
        result.overallSmoothness = parseFloat(trimmed.substring('SMOOTHNESS:'.length)) || 0;
        continue;
      }

      if (inScenes && trimmed.length > 0) {
        const scene = this.parseSceneLine(trimmed);
        if (scene) {
          result.scenes.push(scene);
        }
      }

      if (inTransitions && trimmed.length > 0) {
        const transition = this.parseTransitionLine(trimmed);
        if (transition) {
          result.transitions.push(transition);
        }
      }
    }

    // Calculate setting changes from scenes
    if (result.scenes.length > 1 && result.settingChangeCount === 0) {
      result.settingChangeCount = result.scenes.length - 1;
    }

    return result;
  }

  /**
   * Parse readability analysis response
   */
  private parseReadabilityResponse(response: string): Readability {
    const result: Readability = {
      avgSentenceLength: 0,
      sentenceLengthVariance: 0,
      uniqueWords: 0,
      totalWords: 0,
      vocabularyRichness: 0,
      rareWordRatio: 0,
      paragraphCount: 0,
      avgParagraphLength: 0,
      paragraphVariance: 0,
      structureScore: 0,
      overallScore: 0,
      readabilityLevel: 'intermediate',
      recommendations: [],
    };

    const lines = response.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith('avg_sentence_length=')) {
        result.avgSentenceLength = parseFloat(trimmed.substring('avg_sentence_length='.length)) || 0;
      } else if (trimmed.startsWith('sentence_length_variance=')) {
        result.sentenceLengthVariance =
          parseFloat(trimmed.substring('sentence_length_variance='.length)) || 0;
      } else if (trimmed.startsWith('unique_words=')) {
        result.uniqueWords = parseInt(trimmed.substring('unique_words='.length), 10) || 0;
      } else if (trimmed.startsWith('total_words=')) {
        result.totalWords = parseInt(trimmed.substring('total_words='.length), 10) || 0;
      } else if (trimmed.startsWith('vocabulary_richness=')) {
        result.vocabularyRichness = parseFloat(trimmed.substring('vocabulary_richness='.length)) || 0;
      } else if (trimmed.startsWith('rare_word_ratio=')) {
        result.rareWordRatio = parseFloat(trimmed.substring('rare_word_ratio='.length)) || 0;
      } else if (trimmed.startsWith('paragraph_count=')) {
        result.paragraphCount = parseInt(trimmed.substring('paragraph_count='.length), 10) || 0;
      } else if (trimmed.startsWith('avg_paragraph_length=')) {
        result.avgParagraphLength = parseInt(trimmed.substring('avg_paragraph_length='.length), 10) || 0;
      } else if (trimmed.startsWith('paragraph_variance=')) {
        result.paragraphVariance = parseFloat(trimmed.substring('paragraph_variance='.length)) || 0;
      } else if (trimmed.startsWith('structure_score=')) {
        result.structureScore = parseFloat(trimmed.substring('structure_score='.length)) || 0;
      } else if (trimmed.startsWith('score=')) {
        result.overallScore = parseFloat(trimmed.substring('score='.length)) || 0;
      } else if (trimmed.startsWith('level=')) {
        const level = trimmed.substring('level='.length).trim();
        if (['simple', 'intermediate', 'advanced'].includes(level)) {
          result.readabilityLevel = level as Readability['readabilityLevel'];
        }
      } else if (trimmed.startsWith('recommendations=')) {
        result.recommendations = trimmed
          .substring('recommendations='.length)
          .split('|')
          .map((r) => r.trim())
          .filter((r) => r.length > 0);
      }
    }

    return result;
  }

  /**
   * Parse a single thread line
   * Format: id|name|description|status|characters
   */
  private parseThreadLine(line: string): PlotThread | null {
    const parts = line.split('|').map((p) => p.trim());
    if (parts.length < 4) return null;

    const [id, name, description, statusStr, charactersStr] = parts;

    const validStatuses = ['active', 'dormant', 'resolved'];
    const status = validStatuses.includes(statusStr) ? statusStr : 'active';

    const characters =
      charactersStr && charactersStr !== 'none'
        ? charactersStr.split(',').map((c) => c.trim())
        : [];

    return {
      id,
      name,
      description,
      status: status as PlotThread['status'],
      characters,
    };
  }

  /**
   * Parse a single scene line
   * Format: id|location|startPosition|endPosition
   */
  private parseSceneLine(line: string): Scene | null {
    const parts = line.split('|').map((p) => p.trim());
    if (parts.length < 4) return null;

    const [id, location, startStr, endStr] = parts;

    return {
      id,
      location,
      startPosition: parseFloat(startStr) || 0,
      endPosition: parseFloat(endStr) || 1,
    };
  }

  /**
   * Parse a transition line
   * Format: fromId->toId|type
   */
  private parseTransitionLine(line: string): SceneTransition | null {
    const match = line.match(/^(\d+)->(\d+)\|(\w+)$/);
    if (!match) return null;

    const [, from, to, typeStr] = match;
    const validTypes = ['smooth', 'abrupt'];

    return {
      from,
      to,
      type: validTypes.includes(typeStr) ? (typeStr as SceneTransition['type']) : 'smooth',
    };
  }

  /**
   * Calculate overall complexity score
   */
  private calculateOverallComplexity(
    threads: PlotThreadAnalysis,
    density: NarrativeDensity,
    scenes: SceneComplexity,
    readability: Readability
  ): number {
    // Weighted average of different complexity dimensions
    const threadWeight = 0.3;
    const densityWeight = 0.2;
    const sceneWeight = 0.2;
    const readabilityWeight = 0.3;

    const threadScore = threads.complexityScore || 0;
    const densityScore = Math.min(1, density.averageDensity / 5); // Normalize to 0-1
    const sceneScore = scenes.lengthVariability || 0;
    const readabilityScore = readability.overallScore || 0;

    return (
      threadScore * threadWeight +
      densityScore * densityWeight +
      sceneScore * sceneWeight +
      readabilityScore * readabilityWeight
    );
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(
    threads: PlotThreadAnalysis,
    density: NarrativeDensity,
    characters: CharacterInvolvement,
    scenes: SceneComplexity,
    readability: Readability
  ): string[] {
    const recommendations: string[] = [];

    // Thread recommendations
    if (threads.threads.length < 2) {
      recommendations.push('Consider adding subplot threads for depth');
    }
    if (threads.interweaving.switchCount < 2 && threads.threads.length > 1) {
      recommendations.push('Increase plot thread interweaving');
    }

    // Density recommendations
    if (density.contentBreakdown.exposition > 0.6) {
      recommendations.push('Balance exposition with more action or dialogue');
    }
    if (density.averageDensity < 1.5) {
      recommendations.push('Increase narrative density with more events');
    }

    // Character recommendations
    if (Object.keys(characters.characters).length < 2) {
      recommendations.push('Introduce additional characters');
    }
    if (characters.povAnalysis.switches === 0 && Object.keys(characters.characters).length > 1) {
      recommendations.push('Consider POV variation for perspective');
    }

    // Scene recommendations
    if (scenes.scenes.length === 1) {
      recommendations.push('Vary settings to add visual interest');
    }
    if (scenes.overallSmoothness < 0.5) {
      recommendations.push('Improve scene transitions');
    }

    // Include readability recommendations
    recommendations.push(...readability.recommendations);

    return recommendations;
  }

  /**
   * Build plot threads analysis prompt
   */
  private buildThreadsPrompt(text: string): string {
    return `Analyze the plot threads in the following narrative text.

For each thread, provide in this format:
ID|NAME|DESCRIPTION|STATUS|CHARACTERS

Where:
- ID: Unique numeric identifier
- NAME: Short snake_case name for the thread
- DESCRIPTION: Brief description of the plot thread
- STATUS: active, dormant, or resolved
- CHARACTERS: Comma-separated character names involved (or "none")

Also analyze thread interweaving:
INTERWEAVING:
sequence=1,2,1,3 (order of thread appearances)
switches=N (number of thread switches)

Finally provide:
COMPLEXITY: 0.X (overall plot complexity score 0-1)

TEXT:
${text}

Analyze plot threads:`;
  }

  /**
   * Build narrative density prompt
   */
  private buildDensityPrompt(text: string): string {
    return `Analyze the narrative density of the following text.

Provide in this format:
DENSITY:
paragraph_ideas=N|N|N (ideas per paragraph)
average=X.X (average ideas per paragraph)
exposition=0.X (proportion of exposition)
action=0.X (proportion of action)
dialogue=0.X (proportion of dialogue)
description=0.X (proportion of description)
section_load=0.X|0.X|0.X (information load per section)
peak_sections=N|N (indices of high-density sections)

TEXT:
${text}

Analyze density:`;
  }

  /**
   * Build character involvement prompt
   */
  private buildCharacterPrompt(text: string): string {
    return `Analyze character involvement in the following narrative text.

Provide in this format:
CHARACTERS:
CharacterName|MentionCount|Frequency

INTERACTIONS:
Character1->Character2|Count

ROLES:
protagonist=CharacterName
supporting=Char1,Char2
minor=Char3,Char4

POV:
switches=N
sequence=Char1|Char2|Char1

TEXT:
${text}

Analyze characters:`;
  }

  /**
   * Build scene complexity prompt
   */
  private buildScenePrompt(text: string): string {
    return `Analyze scene complexity in the following narrative text.

Provide in this format:
SCENES:
ID|LOCATION|START_POSITION|END_POSITION

TRANSITIONS:
fromId->toId|smooth or abrupt

LENGTHS: 0.X|0.X|0.X (scene lengths as proportions)
VARIABILITY: 0.X (length variability 0-1)
SMOOTHNESS: 0.X (overall transition smoothness 0-1)

TEXT:
${text}

Analyze scenes:`;
  }

  /**
   * Build readability prompt
   */
  private buildReadabilityPrompt(text: string): string {
    return `Analyze the readability of the following text.

Provide in this format:
READABILITY:
avg_sentence_length=X.X
sentence_length_variance=X.X
unique_words=N
total_words=N
vocabulary_richness=0.X
rare_word_ratio=0.X
paragraph_count=N
avg_paragraph_length=N
paragraph_variance=X.X
structure_score=0.X
score=0.X (overall readability 0-1)
level=simple|intermediate|advanced
recommendations=rec1|rec2|rec3

TEXT:
${text}

Analyze readability:`;
  }
}
