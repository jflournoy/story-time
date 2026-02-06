import type { LLMProvider } from '../providers/llm-provider';
import { ProviderFactory } from '../providers/provider-factory';

export class LLMService {
  private provider: LLMProvider;

  constructor(provider?: LLMProvider) {
    this.provider = provider || ProviderFactory.createFromEnv();
  }

  /**
   * Expand text with more detail and development
   */
  async expand(text: string, synopsis?: string): Promise<string> {
    return this.provider.expand(text, synopsis);
  }

  /**
   * Refine text for clarity, style, and flow
   */
  async refine(text: string, synopsis?: string): Promise<string> {
    return this.provider.refine(text, synopsis);
  }

  /**
   * Revise text structure and pacing
   */
  async revise(text: string, synopsis?: string): Promise<string> {
    return this.provider.revise(text, synopsis);
  }

  /**
   * Restructure text organization and flow
   */
  async restructure(text: string, synopsis?: string): Promise<string> {
    return this.provider.restructure(text, synopsis);
  }

  /**
   * Generate a synopsis from text
   */
  async generateSynopsis(text: string): Promise<string> {
    return this.provider.generateSynopsis(text);
  }

  /**
   * Check if provider is available
   */
  async healthCheck(): Promise<boolean> {
    return this.provider.healthCheck();
  }
}
