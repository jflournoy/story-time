import { Ollama } from 'ollama';
import type { LLMProvider } from './llm-provider';

export interface OllamaProviderConfig {
  baseUrl?: string;
  model?: string;
}

export class OllamaProvider implements LLMProvider {
  private ollama: Ollama;
  private model: string;

  constructor(config: OllamaProviderConfig = {}) {
    const baseUrl = config.baseUrl || 'http://localhost:11434';
    this.model = config.model || 'mistral';
    this.ollama = new Ollama({ host: baseUrl });
  }

  async expand(text: string, synopsis?: string): Promise<string> {
    return this.complete(this.buildPrompt('expand', text, synopsis));
  }

  async refine(text: string, synopsis?: string): Promise<string> {
    return this.complete(this.buildPrompt('refine', text, synopsis));
  }

  async revise(text: string, synopsis?: string): Promise<string> {
    return this.complete(this.buildPrompt('revise', text, synopsis));
  }

  async generateSynopsis(text: string): Promise<string> {
    return this.complete(this.buildPrompt('synopsis', text));
  }

  async healthCheck(): Promise<boolean> {
    try {
      const models = await this.ollama.list();
      return models.models.some((m) => m.name === this.model);
    } catch {
      return false;
    }
  }

  private async complete(prompt: string): Promise<string> {
    const response = await this.ollama.generate({
      model: this.model,
      prompt,
      stream: false,
    });

    return response.response;
  }

  private buildPrompt(
    operation: 'expand' | 'refine' | 'revise' | 'synopsis',
    text: string,
    synopsis?: string
  ): string {
    const contextSection = synopsis ? `\nNARRATIVE CONTEXT:\n${synopsis}\n` : '';

    const instructions: Record<string, string> = {
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

      synopsis: `Analyze the following text and create a concise synopsis that captures the key narrative elements, themes, and structure.

Provide a synopsis (2-3 paragraphs) that would help guide future revisions:`,
    };

    return `${instructions[operation]}${contextSection}

TEXT TO ${operation.toUpperCase()}:
${text}

Provide the ${operation === 'synopsis' ? 'synopsis' : operation + 'd version'}:`;
  }
}
