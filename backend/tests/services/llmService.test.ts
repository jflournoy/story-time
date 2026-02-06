import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMService } from '../../src/services/llmService';
import type { LLMProvider } from '../../src/providers/llm-provider';

describe('LLMService', () => {
  let llmService: LLMService;
  let mockProvider: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create a mock provider
    mockProvider = {
      expand: vi.fn().mockResolvedValue('Expanded text here'),
      refine: vi.fn().mockResolvedValue('Refined text here'),
      revise: vi.fn().mockResolvedValue('Revised text here'),
      generateSynopsis: vi.fn().mockResolvedValue('Generated synopsis'),
      healthCheck: vi.fn().mockResolvedValue(true),
    };

    llmService = new LLMService(mockProvider);
  });

  describe('expand', () => {
    it('should expand text without synopsis', async () => {
      const inputText = 'The old house stood alone.';

      const result = await llmService.expand(inputText);

      expect(result).toBe('Expanded text here');
      expect(mockProvider.expand).toHaveBeenCalledWith(inputText, undefined);
    });

    it('should expand text with synopsis', async () => {
      const inputText = 'The old house stood alone.';
      const synopsis = 'A horror story about a haunted mansion.';

      const result = await llmService.expand(inputText, synopsis);

      expect(result).toBe('Expanded text here');
      expect(mockProvider.expand).toHaveBeenCalledWith(inputText, synopsis);
    });

    it('should handle errors gracefully', async () => {
      mockProvider.expand.mockRejectedValue(new Error('Ollama connection failed'));

      await expect(llmService.expand('test text')).rejects.toThrow('Ollama connection failed');
    });
  });

  describe('refine', () => {
    it('should refine text without synopsis', async () => {
      const inputText = 'The house was old and it was alone.';

      const result = await llmService.refine(inputText);

      expect(result).toBe('Refined text here');
      expect(mockProvider.refine).toHaveBeenCalledWith(inputText, undefined);
    });

    it('should refine text with synopsis', async () => {
      const inputText = 'The house was old and it was alone.';
      const synopsis = 'A story about isolation.';

      const result = await llmService.refine(inputText, synopsis);

      expect(result).toBe('Refined text here');
      expect(mockProvider.refine).toHaveBeenCalledWith(inputText, synopsis);
    });

    it('should handle errors gracefully', async () => {
      mockProvider.refine.mockRejectedValue(new Error('Model not available'));

      await expect(llmService.refine('test text')).rejects.toThrow('Model not available');
    });
  });

  describe('revise', () => {
    it('should revise text without synopsis', async () => {
      const inputText = 'First this happened. Then that happened. Finally the end.';

      const result = await llmService.revise(inputText);

      expect(result).toBe('Revised text here');
      expect(mockProvider.revise).toHaveBeenCalledWith(inputText, undefined);
    });

    it('should revise text with synopsis', async () => {
      const inputText = 'The story begins and ends.';
      const synopsis = 'A tale of transformation.';

      const result = await llmService.revise(inputText, synopsis);

      expect(result).toBe('Revised text here');
      expect(mockProvider.revise).toHaveBeenCalledWith(inputText, synopsis);
    });

    it('should handle errors gracefully', async () => {
      mockProvider.revise.mockRejectedValue(new Error('Rate limit exceeded'));

      await expect(llmService.revise('test text')).rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('generateSynopsis', () => {
    it('should generate a synopsis from text', async () => {
      const inputText = 'A long story text here.';

      const result = await llmService.generateSynopsis(inputText);

      expect(result).toBe('Generated synopsis');
      expect(mockProvider.generateSynopsis).toHaveBeenCalledWith(inputText);
    });

    it('should handle errors gracefully', async () => {
      mockProvider.generateSynopsis.mockRejectedValue(new Error('Timeout'));

      await expect(llmService.generateSynopsis('test text')).rejects.toThrow('Timeout');
    });
  });

  describe('healthCheck', () => {
    it('should return true when provider is available', async () => {
      const result = await llmService.healthCheck();

      expect(result).toBe(true);
      expect(mockProvider.healthCheck).toHaveBeenCalled();
    });

    it('should return false when provider is unavailable', async () => {
      mockProvider.healthCheck.mockResolvedValue(false);

      const result = await llmService.healthCheck();

      expect(result).toBe(false);
    });
  });
});
