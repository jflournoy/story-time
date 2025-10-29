import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMService } from '../../src/services/llmService';
import { Ollama } from 'ollama';

// Mock the Ollama module
vi.mock('ollama', () => {
  return {
    Ollama: vi.fn().mockImplementation(() => ({
      generate: vi.fn(),
      list: vi.fn(),
    })),
  };
});

describe('LLMService', () => {
  let llmService: LLMService;
  let mockOllama: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Create service instance
    llmService = new LLMService();

    // Get the mock Ollama instance
    mockOllama = (llmService as any).ollama;
  });

  describe('expand', () => {
    it('should expand text without synopsis', async () => {
      const inputText = 'The old house stood alone.';
      const expectedResponse = 'The old, weathered house stood alone on the hill, its windows dark and empty.';

      mockOllama.generate.mockResolvedValue({
        response: expectedResponse,
      });

      const result = await llmService.expand(inputText);

      expect(result).toBe(expectedResponse);
      expect(mockOllama.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: expect.any(String),
          prompt: expect.stringContaining(inputText),
          options: expect.objectContaining({
            temperature: 0.8,
            top_p: 0.9,
          }),
        })
      );
    });

    it('should expand text with synopsis', async () => {
      const inputText = 'The old house stood alone.';
      const synopsis = 'A horror story about a haunted mansion.';
      const expectedResponse = 'The old, decrepit house stood alone, emanating an eerie presence.';

      mockOllama.generate.mockResolvedValue({
        response: expectedResponse,
      });

      const result = await llmService.expand(inputText, synopsis);

      expect(result).toBe(expectedResponse);
      expect(mockOllama.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining(synopsis),
        })
      );
    });

    it('should handle errors gracefully', async () => {
      mockOllama.generate.mockRejectedValue(new Error('Ollama connection failed'));

      await expect(llmService.expand('test text')).rejects.toThrow('Ollama connection failed');
    });
  });

  describe('refine', () => {
    it('should refine text without synopsis', async () => {
      const inputText = 'The house was old and it was alone.';
      const expectedResponse = 'The house was old and solitary.';

      mockOllama.generate.mockResolvedValue({
        response: expectedResponse,
      });

      const result = await llmService.refine(inputText);

      expect(result).toBe(expectedResponse);
      expect(mockOllama.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: expect.any(String),
          prompt: expect.stringContaining(inputText),
          options: expect.objectContaining({
            temperature: 0.7,
            top_p: 0.8,
          }),
        })
      );
    });

    it('should refine text with synopsis', async () => {
      const inputText = 'The house was old and it was alone.';
      const synopsis = 'A story about isolation.';
      const expectedResponse = 'The house stood old and isolated.';

      mockOllama.generate.mockResolvedValue({
        response: expectedResponse,
      });

      const result = await llmService.refine(inputText, synopsis);

      expect(result).toBe(expectedResponse);
      expect(mockOllama.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining(synopsis),
        })
      );
    });

    it('should handle errors gracefully', async () => {
      mockOllama.generate.mockRejectedValue(new Error('Model not available'));

      await expect(llmService.refine('test text')).rejects.toThrow('Model not available');
    });
  });

  describe('revise', () => {
    it('should revise text without synopsis', async () => {
      const inputText = 'First this happened. Then that happened. Finally the end.';
      const expectedResponse = 'The sequence of events unfolded naturally, building to a satisfying conclusion.';

      mockOllama.generate.mockResolvedValue({
        response: expectedResponse,
      });

      const result = await llmService.revise(inputText);

      expect(result).toBe(expectedResponse);
      expect(mockOllama.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: expect.any(String),
          prompt: expect.stringContaining(inputText),
          options: expect.objectContaining({
            temperature: 0.75,
            top_p: 0.85,
          }),
        })
      );
    });

    it('should revise text with synopsis', async () => {
      const inputText = 'The story begins and ends.';
      const synopsis = 'A tale of transformation.';
      const expectedResponse = 'The transformative journey begins and reaches its culmination.';

      mockOllama.generate.mockResolvedValue({
        response: expectedResponse,
      });

      const result = await llmService.revise(inputText, synopsis);

      expect(result).toBe(expectedResponse);
      expect(mockOllama.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining(synopsis),
        })
      );
    });

    it('should handle errors gracefully', async () => {
      mockOllama.generate.mockRejectedValue(new Error('Rate limit exceeded'));

      await expect(llmService.revise('test text')).rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('generateSynopsis', () => {
    it('should generate synopsis from text', async () => {
      const inputText = 'A long story about a hero who saves the village from darkness.';
      const expectedSynopsis = 'This is a heroic tale of courage and determination.';

      mockOllama.generate.mockResolvedValue({
        response: expectedSynopsis,
      });

      const result = await llmService.generateSynopsis(inputText);

      expect(result).toBe(expectedSynopsis);
      expect(mockOllama.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: expect.any(String),
          prompt: expect.stringContaining(inputText),
          options: expect.objectContaining({
            temperature: 0.5,
            top_p: 0.7,
          }),
        })
      );
    });

    it('should handle short text', async () => {
      const inputText = 'A brief tale.';
      const expectedSynopsis = 'A concise narrative.';

      mockOllama.generate.mockResolvedValue({
        response: expectedSynopsis,
      });

      const result = await llmService.generateSynopsis(inputText);

      expect(result).toBe(expectedSynopsis);
    });

    it('should handle errors gracefully', async () => {
      mockOllama.generate.mockRejectedValue(new Error('Synopsis generation failed'));

      await expect(llmService.generateSynopsis('test')).rejects.toThrow('Synopsis generation failed');
    });
  });

  describe('healthCheck', () => {
    it('should return available true when model exists', async () => {
      const modelName = 'llama3:8b';
      process.env.OLLAMA_MODEL = modelName;

      mockOllama.list.mockResolvedValue({
        models: [
          { name: modelName },
          { name: 'mistral:7b' },
        ],
      });

      const result = await llmService.healthCheck();

      expect(result.available).toBe(true);
      expect(result.model).toBe(modelName);
    });

    it('should return available false when model does not exist', async () => {
      const modelName = 'llama3:8b';
      process.env.OLLAMA_MODEL = modelName;

      mockOllama.list.mockResolvedValue({
        models: [
          { name: 'mistral:7b' },
        ],
      });

      const result = await llmService.healthCheck();

      expect(result.available).toBe(false);
      expect(result.model).toBe(modelName);
    });

    it('should return available false on connection error', async () => {
      mockOllama.list.mockRejectedValue(new Error('Connection refused'));

      const result = await llmService.healthCheck();

      expect(result.available).toBe(false);
    });
  });

  describe('temperature settings', () => {
    it('should use different temperatures for each operation', async () => {
      mockOllama.generate.mockResolvedValue({ response: 'result' });

      await llmService.expand('text');
      expect(mockOllama.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({ temperature: 0.8 }),
        })
      );

      await llmService.refine('text');
      expect(mockOllama.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({ temperature: 0.7 }),
        })
      );

      await llmService.revise('text');
      expect(mockOllama.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({ temperature: 0.75 }),
        })
      );

      await llmService.generateSynopsis('text');
      expect(mockOllama.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({ temperature: 0.5 }),
        })
      );
    });
  });
});
