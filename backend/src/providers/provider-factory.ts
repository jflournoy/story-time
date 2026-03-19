import type { LLMProvider } from './llm-provider';
import { LocalLLMProvider } from './local-llm-provider';

export type ProviderType = 'local';

export interface ProviderConfig {
  type: ProviderType;
  serviceUrl?: string;
}

export class ProviderFactory {
  static createProvider(config: ProviderConfig): LLMProvider {
    switch (config.type) {
      case 'local':
        return new LocalLLMProvider({
          serviceUrl: config.serviceUrl || 'http://localhost:8003',
        });
      default:
        throw new Error(`Unknown provider type: ${config.type}`);
    }
  }

  static createFromEnv(): LLMProvider {
    const providerType = (process.env.LLM_PROVIDER || 'local') as ProviderType;

    switch (providerType) {
      case 'local':
        return new LocalLLMProvider({
          serviceUrl: process.env.LLM_SERVICE_URL || 'http://localhost:8003',
        });
      default:
        throw new Error(`Unknown provider type: ${providerType}`);
    }
  }
}
