import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OllamaProvider } from '../../src/providers/ollama-provider';

vi.mock('ollama', () => {
  return {
    Ollama: vi.fn().mockImplementation(() => ({
      generate: vi.fn(),
      list: vi.fn(),
    })),
  };
});

describe('OllamaProvider', () => {
  let provider: OllamaProvider;
  let mockOllama: any;

  beforeEach(() => {
    vi.clearAllMocks();

    provider = new OllamaProvider({ baseUrl: 'http://localhost:11434' });
    mockOllama = (provider as any).ollama;

    mockOllama.generate.mockResolvedValue({
      response: 'Generated text response'
    });

    mockOllama.list.mockResolvedValue({
      models: [
        { name: 'mistral' },
        { name: 'llama2' }
      ]
    });
  });

  describe('expand', () => {
    it('should call Ollama API and return expanded text', async () => {
      const result = await provider.expand('The house was old.');
      expect(result).toBe('Generated text response');
      expect(mockOllama.generate).toHaveBeenCalled();
    });
  });

  describe('refine', () => {
    it('should call Ollama API and return refined text', async () => {
      const result = await provider.refine('The house was old.');
      expect(result).toBe('Generated text response');
      expect(mockOllama.generate).toHaveBeenCalled();
    });
  });

  describe('revise', () => {
    it('should call Ollama API and return revised text', async () => {
      const result = await provider.revise('The house was old.');
      expect(result).toBe('Generated text response');
      expect(mockOllama.generate).toHaveBeenCalled();
    });
  });

  describe('generateSynopsis', () => {
    it('should call Ollama API and return synopsis', async () => {
      const result = await provider.generateSynopsis('The house was old. It stood on the hill.');
      expect(result).toBe('Generated text response');
      expect(mockOllama.generate).toHaveBeenCalled();
    });
  });

  describe('healthCheck', () => {
    it('should return true when model is available', async () => {
      const result = await provider.healthCheck();
      expect(result).toBe(true);
      expect(mockOllama.list).toHaveBeenCalled();
    });

    it('should return false when model is not available', async () => {
      mockOllama.list.mockResolvedValueOnce({
        models: [{ name: 'llama2' }]
      });
      const result = await provider.healthCheck();
      expect(result).toBe(false);
    });

    it('should return false when Ollama is unavailable', async () => {
      mockOllama.list.mockRejectedValueOnce(new Error('Connection refused'));
      const result = await provider.healthCheck();
      expect(result).toBe(false);
    });
  });
});
