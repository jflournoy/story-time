// ============================================
// Shared TypeScript interfaces for Story Time
// ============================================

// --- Text Operations ---

export interface TextOperationResponse {
  operation: string;
  result: string;
}

export interface SynopsisResponse {
  synopsis: string;
}

// --- Sessions ---

export interface SessionMetadata {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  operationCount: number;
}

export type OperationType = 'expand' | 'refine' | 'revise' | 'restructure' | 'synopsis';

export interface SessionOperation {
  id: string;
  type: OperationType;
  originalText: string;
  resultText: string;
  synopsis?: string;
  timestamp: string;
}

// --- History ---

export interface HistoryEntry {
  id: string;
  type: OperationType;
  originalText: string;
  resultText: string;
  synopsis?: string;
  timestamp: string;
}

export interface HistoryListResponse {
  success: boolean;
  count: number;
  history: HistoryEntry[];
}

export interface HistoryItemResponse {
  success: boolean;
  operation: HistoryEntry;
}

// --- Diff ---

export interface DiffChange {
  type: 'add' | 'remove' | 'replace' | 'equal';
  value?: string;
  content?: string;
  lineNumber?: number;
  index?: number;
}

export interface DiffStats {
  additions: number;
  deletions: number;
  charDelta: number;
}

export interface DiffStatsResponse {
  original: string;
  modified: string;
  stats: DiffStats;
}

export interface DiffLinesResponse {
  original: string;
  modified: string;
  changes: DiffChange[];
}

// --- Export ---

export interface ExportResponse {
  success: boolean;
  format: string;
  content: string;
}

// --- Entities ---

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

export interface EntitySummary {
  characterCount: number;
  locationCount: number;
  objectCount: number;
  totalMentions: number;
  mostMentioned: { name: string; mentions: number; type: string };
}

export interface EntityComparison {
  added: { characters: string[]; locations: string[]; objects: string[] };
  removed: { characters: string[]; locations: string[]; objects: string[] };
  retained: { characters: string[]; locations: string[]; objects: string[] };
}

// --- Tone Analysis ---

export interface ToneSegment {
  text: string;
  tone: string;
  sentiment: number;
  emotions: string[];
}

export interface ToneArc {
  overall_trajectory: 'ascending' | 'descending' | 'mixed';
  peak_at: number;
  valley_at?: number;
  variance: number;
  volatility: number;
  turning_points: Array<{ index: number; change: number }>;
}

export interface ToneAnalysisResponse {
  sections: ToneSegment[];
  arc: ToneArc;
  // Legacy fields from current frontend usage
  overallTone?: string;
  dominantEmotion?: string;
  averageSentiment?: number;
  segments?: ToneSegment[];
}

export interface ToneComparisonResponse {
  original_tone: { tone: string; sentiment: number; emotions: string[] };
  revised_tone: { tone: string; sentiment: number; emotions: string[] };
  sentiment_shift: number;
  shift_direction: 'positive' | 'negative' | 'neutral';
  emotional_changes: string[];
  // Legacy fields
  sentimentChange?: number;
  originalTone?: string;
  revisedTone?: string;
  interpretation?: string;
}

export interface EmotionalArcResponse {
  arcType?: string;
  volatility?: number;
  trend?: string;
  overall_trajectory?: string;
  peak_at?: number;
  variance?: number;
  turning_points?: Array<{ index: number; change: number }>;
}

// --- Complexity ---

export interface PlotThread {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'dormant' | 'resolved';
  characters: string[];
}

export interface PlotThreadAnalysis {
  threads: PlotThread[];
  interweaving: { sequence: number[]; switchCount: number };
  complexityScore: number;
}

export interface NarrativeDensity {
  ideasPerParagraph: number[];
  averageDensity: number;
  contentBreakdown: {
    exposition: number;
    action: number;
    dialogue: number;
    description: number;
  };
  sectionLoad: number[];
  peakLoadSections: number[];
}

export interface CharacterStats {
  mentions: number;
  frequency: number;
}

export interface CharacterInvolvement {
  characters: Record<string, CharacterStats>;
  interactions: Record<string, number>;
  povAnalysis: { switches: number; sequence: string[] };
  roles: { protagonist: string; supporting: string[]; minor: string[] };
}

export interface SceneData {
  id: string;
  location: string;
  startPosition: number;
  endPosition: number;
}

export interface SceneComplexity {
  scenes: SceneData[];
  settingChangeCount: number;
  sceneLengths: number[];
  lengthVariability: number;
  transitions: Array<{ from: string; to: string; type: 'smooth' | 'abrupt' }>;
  overallSmoothness: number;
}

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

export interface ComplexityReport {
  plotThreads?: PlotThreadAnalysis;
  characterInvolvement?: CharacterInvolvement;
  sceneComplexity?: SceneComplexity;
  readability?: Readability;
  narrativeDensity?: NarrativeDensity;
  overallComplexity?: number;
  recommendations?: string[];
  // Legacy field names
  plotThreadAnalysis?: PlotThreadAnalysis;
}

// --- Timeline ---

export interface TimelineEvent {
  id: string;
  type: 'plot_point' | 'action' | 'state_change' | 'marker';
  description: string;
  characters: string[];
  location?: string;
  temporalPosition: number;
  temporalMarker?: string;
  // Legacy fields
  position?: number;
  participants?: string[];
  timeIndicator?: string;
  relationships?: Array<{
    targetEventId: string;
    type: 'before' | 'after' | 'during' | 'causes' | 'caused_by';
  }>;
}

export interface TimelineResponse {
  events: TimelineEvent[];
  structure: 'linear' | 'non_linear' | 'flashback' | 'parallel';
  duration?: string;
  pacing?: {
    eventDensity: number;
    intensityCurve: number[];
    quietMoments: number[];
    climaxPosition: number;
  };
  // Legacy fields
  eventDensity?: number;
}

export interface PacingResponse {
  eventDensity: number;
  intensityCurve: number[];
  quietMoments: number[];
  climaxPosition: number;
  // Legacy fields
  overallPace?: string;
  pacingVariance?: number;
  recommendations?: string[];
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
  // Legacy field
  pacingChange_legacy?: number;
}
