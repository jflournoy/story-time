import axios from 'axios';
import type { LLMProvider } from './llm-provider';

export interface LocalLLMConfig {
  serviceUrl: string;
  maxTokens?: number;
  temperature?: number;
}

export class LocalLLMProvider implements LLMProvider {
  private serviceUrl: string;
  private maxTokens: number;
  private temperature: number;

  constructor(config: LocalLLMConfig) {
    this.serviceUrl = config.serviceUrl;
    this.maxTokens = config.maxTokens ?? 500;
    this.temperature = config.temperature ?? 0.7;
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

  async restructure(text: string, synopsis?: string): Promise<string> {
    return this.complete(this.buildPrompt('restructure', text, synopsis));
  }

  async generateSynopsis(text: string): Promise<string> {
    return this.complete(this.buildPrompt('synopsis', text));
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.serviceUrl}/health`);
      return response.data.status === 'ok';
    } catch {
      return false;
    }
  }

  private async complete(prompt: string): Promise<string> {
    try {
      const response = await axios.post(`${this.serviceUrl}/v1/completions`, {
        prompt,
        max_tokens: this.maxTokens,
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
