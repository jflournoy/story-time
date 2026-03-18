import type { LLMProvider } from '../providers/llm-provider';

export interface ToneSection {
  text: string;
  tone: string;
  sentiment: number;
  emotions: string[];
}

export interface ArcMetrics {
  overall_trajectory: 'ascending' | 'descending' | 'mixed';
  peak_at: number;
  valley_at?: number;
  variance: number;
  volatility: number;
  turning_points?: Array<{ index: number; change: number }>;
}

export interface ToneAnalysisResult {
  sections: ToneSection[];
  arc: ArcMetrics;
}

export interface ToneComparison {
  original_tone: Omit<ToneSection, 'text'>;
  revised_tone: Omit<ToneSection, 'text'>;
  sentiment_shift: number;
  shift_direction: 'positive' | 'negative' | 'neutral';
  emotional_changes: string[];
}

export class ToneAnalysisService {
  constructor(private llmProvider: LLMProvider) {}

  /**
   * Analyze emotional tone of text with specified granularity
   */
  async analyzeTone(
    text: string,
    granularity: 'paragraph' | 'scene' | 'section' = 'paragraph'
  ): Promise<ToneAnalysisResult> {
    const sections = this.splitText(text, granularity);
    const toneResults: ToneSection[] = [];
    const sentiments: number[] = [];

    for (const section of sections) {
      const tonePrompt = `Analyze the emotional tone of this text. Respond with format: TONE, SENTIMENT_SCORE, EMOTIONS
Text: "${section}"
Format your response as: happy, 0.8, joy|excitement`;

      const response = await this.llmProvider.expand(tonePrompt);
      const parsed = this.parseToneResponse(response, section);
      toneResults.push(parsed);
      sentiments.push(parsed.sentiment);
    }

    const arc = this.getEmotionalArc(sentiments);

    return {
      sections: toneResults,
      arc,
    };
  }

  /**
   * Compare emotional tone between two versions of text
   */
  async compareTone(original: string, revised: string): Promise<ToneComparison> {
    const originalTone = await this.analyzeTone(original, 'paragraph');
    const revisedTone = await this.analyzeTone(revised, 'paragraph');

    const originalFirst = originalTone.sections[0];
    const revisedFirst = revisedTone.sections[0];

    const sentimentShift = revisedFirst.sentiment - originalFirst.sentiment;

    return {
      original_tone: {
        tone: originalFirst.tone,
        sentiment: originalFirst.sentiment,
        emotions: originalFirst.emotions,
      },
      revised_tone: {
        tone: revisedFirst.tone,
        sentiment: revisedFirst.sentiment,
        emotions: revisedFirst.emotions,
      },
      sentiment_shift: sentimentShift,
      shift_direction:
        sentimentShift > 0.1 ? 'positive' : sentimentShift < -0.1 ? 'negative' : 'neutral',
      emotional_changes: this.findEmotionalChanges(originalFirst.emotions, revisedFirst.emotions),
    };
  }

  /**
   * Compute emotional arc from sentiment values
   */
  getEmotionalArc(sentiments: number[]): ArcMetrics {
    if (sentiments.length === 0) {
      return {
        overall_trajectory: 'ascending',
        peak_at: 0,
        variance: 0,
        volatility: 0,
      };
    }

    // Calculate statistics
    const mean = sentiments.reduce((a, b) => a + b) / sentiments.length;
    const variance =
      sentiments.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / sentiments.length;
    const volatility = this.calculateVolatility(sentiments);

    // Find peaks and valleys
    const maxIdx = sentiments.indexOf(Math.max(...sentiments));
    const minIdx = sentiments.indexOf(Math.min(...sentiments));
    const peakAt = maxIdx / (sentiments.length - 1);
    const valleyAt = minIdx / (sentiments.length - 1);

    // Determine trajectory
    const trajectory = this.determineTrajectory(sentiments);
    const turningPoints = this.findTurningPoints(sentiments);

    return {
      overall_trajectory: trajectory,
      peak_at: peakAt,
      valley_at: valleyAt,
      variance,
      volatility,
      turning_points: turningPoints,
    };
  }

  /**
   * Parse emotion string into emotion array
   */
  parseEmotions(emotionString: string): string[] {
    return emotionString
      .split('|')
      .map((e) => e.trim().split(':')[0].trim())
      .filter((e) => e.length > 0);
  }

  /**
   * Split text by granularity
   */
  private splitText(text: string, granularity: 'paragraph' | 'scene' | 'section'): string[] {
    const trimmed = text.trim();

    if (granularity === 'paragraph') {
      return trimmed
        .split('\n\n')
        .map((p) => p.trim())
        .filter((p) => p.length > 0);
    } else if (granularity === 'scene') {
      const parts = trimmed.split(/Scene \d+:|SCENE \d+:/i);
      return parts.slice(1).map((p) => p.trim()).filter((p) => p.length > 0);
    } else {
      // section - split by headers or chunks
      return trimmed.split('\n').filter((p) => p.length > 0);
    }
  }

  /**
   * Parse tone response from LLM
   */
  private parseToneResponse(response: string, text: string): ToneSection {
    const parts = response.split(',').map((p) => p.trim());

    const tone = parts[0] || 'neutral';
    const sentimentStr = parts[1] || '0';
    const emotionStr = parts[2] || '';

    const sentiment = parseFloat(sentimentStr);
    const emotions = this.parseEmotions(emotionStr);

    return {
      text,
      tone,
      sentiment: isNaN(sentiment) ? 0 : Math.max(-1, Math.min(1, sentiment)),
      emotions: emotions.length > 0 ? emotions : ['neutral'],
    };
  }

  /**
   * Determine trajectory from sentiment progression
   */
  private determineTrajectory(
    sentiments: number[]
  ): 'ascending' | 'descending' | 'mixed' {
    if (sentiments.length < 2) return 'mixed';

    let ascendingCount = 0;
    let descendingCount = 0;

    for (let i = 1; i < sentiments.length; i++) {
      if (sentiments[i] > sentiments[i - 1]) {
        ascendingCount++;
      } else if (sentiments[i] < sentiments[i - 1]) {
        descendingCount++;
      }
    }

    if (ascendingCount > descendingCount * 1.5) {
      return 'ascending';
    } else if (descendingCount > ascendingCount * 1.5) {
      return 'descending';
    } else {
      return 'mixed';
    }
  }

  /**
   * Calculate volatility (rate of change)
   */
  private calculateVolatility(sentiments: number[]): number {
    if (sentiments.length < 2) return 0;

    const diffs = [];
    for (let i = 1; i < sentiments.length; i++) {
      diffs.push(Math.abs(sentiments[i] - sentiments[i - 1]));
    }

    return diffs.reduce((a, b) => a + b, 0) / diffs.length;
  }

  /**
   * Find turning points in emotional arc
   */
  private findTurningPoints(
    sentiments: number[]
  ): Array<{ index: number; change: number }> {
    const turningPoints: Array<{ index: number; change: number }> = [];

    for (let i = 1; i < sentiments.length - 1; i++) {
      const prev = sentiments[i - 1];
      const curr = sentiments[i];
      const next = sentiments[i + 1];

      // Local maximum
      if (curr > prev && curr > next) {
        turningPoints.push({ index: i, change: curr - prev });
      }
      // Local minimum
      else if (curr < prev && curr < next) {
        turningPoints.push({ index: i, change: prev - curr });
      }
    }

    return turningPoints;
  }

  /**
   * Find emotional changes between two emotion sets
   */
  private findEmotionalChanges(original: string[], revised: string[]): string[] {
    const changes: string[] = [];
    const originalSet = new Set(original);
    const revisedSet = new Set(revised);

    // Find removed emotions
    for (const emotion of originalSet) {
      if (!revisedSet.has(emotion)) {
        changes.push(`removed ${emotion}`);
      }
    }

    // Find new emotions
    for (const emotion of revisedSet) {
      if (!originalSet.has(emotion)) {
        changes.push(`added ${emotion}`);
      }
    }

    return changes;
  }
}
