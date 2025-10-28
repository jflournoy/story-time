import { Ollama } from 'ollama';
import { LLMConfig } from '../config/llmConfig';

export class LLMService {
  private ollama: Ollama;
  private config: LLMConfig;

  constructor() {
    this.config = new LLMConfig();
    this.ollama = new Ollama({
      host: this.config.ollamaHost,
    });
  }

  /**
   * Expand text with more detail and development
   */
  async expand(text: string, synopsis?: string): Promise<string> {
    const prompt = this.buildPrompt('expand', text, synopsis);

    const response = await this.ollama.generate({
      model: this.config.model,
      prompt,
      options: {
        temperature: 0.8,
        top_p: 0.9,
      },
    });

    return response.response;
  }

  /**
   * Refine text for clarity, style, and flow
   */
  async refine(text: string, synopsis?: string): Promise<string> {
    const prompt = this.buildPrompt('refine', text, synopsis);

    const response = await this.ollama.generate({
      model: this.config.model,
      prompt,
      options: {
        temperature: 0.7,
        top_p: 0.8,
      },
    });

    return response.response;
  }

  /**
   * Revise text structure and pacing
   */
  async revise(text: string, synopsis?: string): Promise<string> {
    const prompt = this.buildPrompt('revise', text, synopsis);

    const response = await this.ollama.generate({
      model: this.config.model,
      prompt,
      options: {
        temperature: 0.75,
        top_p: 0.85,
      },
    });

    return response.response;
  }

  /**
   * Generate a synopsis from text
   */
  async generateSynopsis(text: string): Promise<string> {
    const prompt = `Analyze the following text and create a concise synopsis that captures the key narrative elements, themes, and structure.

TEXT:
${text}

Provide a synopsis (2-3 paragraphs) that would help guide future revisions:`;

    const response = await this.ollama.generate({
      model: this.config.model,
      prompt,
      options: {
        temperature: 0.5,
        top_p: 0.7,
      },
    });

    return response.response;
  }

  /**
   * Build prompt with context and operation-specific instructions
   */
  private buildPrompt(
    operation: 'expand' | 'refine' | 'revise',
    text: string,
    synopsis?: string
  ): string {
    const contextSection = synopsis
      ? `\nNARRATIVE CONTEXT:\n${synopsis}\n`
      : '';

    const instructions = {
      expand: `You are a creative writing assistant. Expand and develop the following text by:
- Adding vivid details and sensory descriptions
- Developing character thoughts and emotions
- Expanding dialogue and interactions
- Fleshing out scenes and settings

Keep the core narrative intact while enriching it with depth and detail.`,

      refine: `You are an editorial assistant. Refine the following text by:
- Improving clarity and readability
- Enhancing word choice and sentence flow
- Maintaining the author's voice and style
- Fixing awkward phrasing without changing meaning

Polish the writing while preserving the original narrative.`,

      revise: `You are a story development assistant. Revise the following text by:
- Improving narrative structure and pacing
- Strengthening transitions between sections
- Enhancing dramatic tension and flow
- Reworking weak passages for better impact

Restructure for maximum narrative effectiveness.`,
    };

    return `${instructions[operation]}${contextSection}

TEXT TO ${operation.toUpperCase()}:
${text}

Provide the ${operation}d version:`;
  }

  /**
   * Check if Ollama is available and model is pulled
   */
  async healthCheck(): Promise<{ available: boolean; model: string }> {
    try {
      const models = await this.ollama.list();
      const modelAvailable = models.models.some(
        (m) => m.name === this.config.model
      );

      return {
        available: modelAvailable,
        model: this.config.model,
      };
    } catch (error) {
      return {
        available: false,
        model: this.config.model,
      };
    }
  }
}
