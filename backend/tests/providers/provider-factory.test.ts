import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ProviderFactory } from '../../src/providers/provider-factory';

describe('ProviderFactory', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('createProvider', () => {
    it('should create LocalLLMProvider when type is "local"', () => {
      const config = {
        type: 'local',
        serviceUrl: 'http://localhost:8003'
      };

      const provider = ProviderFactory.createProvider(config);

      expect(provider).toBeDefined();
      expect(provider.getProviderName()).toBe('local');
    });

    it('should create OllamaProvider when type is "ollama"', () => {
      const config = {
        type: 'ollama',
        baseUrl: 'http://localhost:11434',
        model: 'mistral'
      };

      const provider = ProviderFactory.createProvider(config);

      expect(provider).toBeDefined();
      expect(provider.getProviderName()).toBe('ollama');
    });

    it('should throw error for unknown provider type', () => {
      const config = {
        type: 'unknown',
        serviceUrl: 'http://localhost:1234'
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => ProviderFactory.createProvider(config as any)).toThrow('Unknown provider type: unknown');
    });
  });

  describe('createFromEnv', () => {
    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    it('should create LocalLLMProvider from LLM_PROVIDER=local', () => {
      process.env.LLM_PROVIDER = 'local';
      process.env.LLM_SERVICE_URL = 'http://localhost:8003';

      const provider = ProviderFactory.createFromEnv();

      expect(provider.getProviderName()).toBe('local');
    });

    it('should create OllamaProvider from LLM_PROVIDER=ollama', () => {
      process.env.LLM_PROVIDER = 'ollama';
      process.env.OLLAMA_BASE_URL = 'http://localhost:11434';
      process.env.OLLAMA_MODEL = 'llama2';

      const provider = ProviderFactory.createFromEnv();

      expect(provider.getProviderName()).toBe('ollama');
    });

    it('should default to ollama when LLM_PROVIDER not set', () => {
      delete process.env.LLM_PROVIDER;

      const provider = ProviderFactory.createFromEnv();

      expect(provider.getProviderName()).toBe('ollama');
    });
  });
});
