import axios from 'axios';
import type { LLMProvider } from './llm-provider';

export interface LocalLLMConfig {
  serviceUrl: string;
  temperature?: number;
}

export class LocalLLMProvider implements LLMProvider {
  private serviceUrl: string;
  private temperature: number;

  // Operation-specific token limits
  private readonly tokenLimits = {
    synopsis: 500,      // Short summary
    refine: 2048,       // Moderate improvements
    revise: 2048,       // Structural changes
    restructure: 2048,  // Reorganization
    expand: 4096,       // Maximum detail expansion
  };

  constructor(config: LocalLLMConfig) {
    this.serviceUrl = config.serviceUrl;
    this.temperature = config.temperature ?? 0.7;
  }

  async expand(text: string, synopsis?: string): Promise<string> {
    return this.complete(this.buildPrompt('expand', text, synopsis), this.tokenLimits.expand);
  }

  async refine(text: string, synopsis?: string): Promise<string> {
    return this.complete(this.buildPrompt('refine', text, synopsis), this.tokenLimits.refine);
  }

  async revise(text: string, synopsis?: string): Promise<string> {
    return this.complete(this.buildPrompt('revise', text, synopsis), this.tokenLimits.revise);
  }

  async restructure(text: string, synopsis?: string): Promise<string> {
    return this.complete(this.buildPrompt('restructure', text, synopsis), this.tokenLimits.restructure);
  }

  async generateSynopsis(text: string): Promise<string> {
    return this.complete(this.buildPrompt('synopsis', text), this.tokenLimits.synopsis);
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.serviceUrl}/health`);
      return response.data.status === 'ok';
    } catch {
      return false;
    }
  }

  getProviderName(): string {
    return 'local';
  }

  private async complete(prompt: string, maxTokens: number): Promise<string> {
    try {
      const response = await axios.post(`${this.serviceUrl}/v1/completions`, {
        prompt,
        max_tokens: maxTokens,
        temperature: this.temperature,
      });
      return response.data.choices[0].text;
    } catch (error) {
      throw new Error(`LLM service error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  private buildPrompt(operation: string, text: string, synopsis?: string): string {
    const contextLine = synopsis ? `Context: ${synopsis}\n\n` : '';
    const instructions: Record<string, string> = {
      expand: 'Expand with more detail and description',
      refine: 'Refine for clarity and style',
      revise: 'Revise structure and pacing',
      restructure: 'Reorganize content for improved narrative flow',
      synopsis: 'Generate a brief synopsis',
    };
    return `${contextLine}${instructions[operation]}:\n\n${text}\n\nResult:`;
  }
}
