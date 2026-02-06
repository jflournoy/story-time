import type { LLMProvider } from './llm-provider';
import { LocalLLMProvider } from './local-llm-provider';
import { OllamaProvider } from './ollama-provider';

export type ProviderType = 'local' | 'ollama';

export interface ProviderConfig {
  type: ProviderType;
  serviceUrl?: string;
  baseUrl?: string;
  model?: string;
}

export class ProviderFactory {
  static createProvider(config: ProviderConfig): LLMProvider {
    switch (config.type) {
      case 'local':
        return new LocalLLMProvider({
          serviceUrl: config.serviceUrl || 'http://localhost:8003',
        });
      case 'ollama':
        return new OllamaProvider({
          baseUrl: config.baseUrl || 'http://localhost:11434',
          model: config.model || 'mistral',
        });
      default:
        throw new Error(`Unknown provider type: ${config.type}`);
    }
  }

  static createFromEnv(): LLMProvider {
    const providerType = (process.env.LLM_PROVIDER || 'ollama') as ProviderType;

    switch (providerType) {
      case 'local':
        return new LocalLLMProvider({
          serviceUrl: process.env.LLM_SERVICE_URL || 'http://localhost:8003',
        });
      case 'ollama':
        return new OllamaProvider({
          baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
          model: process.env.OLLAMA_MODEL || 'mistral',
        });
      default:
        throw new Error(`Unknown provider type: ${providerType}`);
    }
  }
}
