import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ProviderFactory } from '../../src/providers/provider-factory';
import { LLMService } from '../../src/services/llmService';

describe('Provider Integration Tests', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('LocalLLMProvider Integration', () => {
    beforeEach(() => {
      process.env.LLM_PROVIDER = 'local';
      process.env.LLM_SERVICE_URL = 'http://localhost:8003';
    });

    it('should create local provider from environment', () => {
      const provider = ProviderFactory.createFromEnv();
      expect(provider.getProviderName()).toBe('local');
    });

    it('should create LLMService with local provider and expose provider name', () => {
      const provider = ProviderFactory.createFromEnv();
      const service = new LLMService(provider);
      expect(service.getProviderName()).toBe('local');
    });
  });

  describe('OllamaProvider Integration', () => {
    beforeEach(() => {
      process.env.LLM_PROVIDER = 'ollama';
      process.env.OLLAMA_BASE_URL = 'http://localhost:11434';
      process.env.OLLAMA_MODEL = 'mistral';
    });

    it('should create ollama provider from environment', () => {
      const provider = ProviderFactory.createFromEnv();
      expect(provider.getProviderName()).toBe('ollama');
    });

    it('should create LLMService with ollama provider and expose provider name', () => {
      const provider = ProviderFactory.createFromEnv();
      const service = new LLMService(provider);
      expect(service.getProviderName()).toBe('ollama');
    });
  });

  describe('Default Provider', () => {
    beforeEach(() => {
      delete process.env.LLM_PROVIDER;
    });

    it('should default to ollama when no provider specified', () => {
      const provider = ProviderFactory.createFromEnv();
      expect(provider.getProviderName()).toBe('ollama');
    });
  });

  describe('Provider Methods Work Through LLMService', () => {
    it('should delegate expand to provider', async () => {
      const mockProvider = {
        expand: async () => 'expanded text',
        refine: async () => 'refined text',
        revise: async () => 'revised text',
        generateSynopsis: async () => 'synopsis',
        healthCheck: async () => true,
      };

      const service = new LLMService(mockProvider);
      const result = await service.expand('test text');

      expect(result).toBe('expanded text');
    });

    it('should delegate generateSynopsis to provider', async () => {
      const mockProvider = {
        expand: async () => '',
        refine: async () => '',
        revise: async () => '',
        generateSynopsis: async () => 'auto-generated synopsis',
        healthCheck: async () => true,
      };

      const service = new LLMService(mockProvider);
      const result = await service.generateSynopsis('story text');

      expect(result).toBe('auto-generated synopsis');
    });

    it('should delegate healthCheck to provider', async () => {
      const mockProvider = {
        expand: async () => '',
        refine: async () => '',
        revise: async () => '',
        generateSynopsis: async () => '',
        healthCheck: async () => false,
      };

      const service = new LLMService(mockProvider);
      const result = await service.healthCheck();

      expect(result).toBe(false);
    });
  });
});
