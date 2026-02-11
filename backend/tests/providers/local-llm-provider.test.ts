import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { LocalLLMProvider } from '../../src/providers/local-llm-provider';

vi.mock('axios');

describe('LocalLLMProvider', () => {
  let provider: LocalLLMProvider;
  const mockAxios = vi.mocked(axios);

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new LocalLLMProvider({ serviceUrl: 'http://localhost:8003' });
  });

  describe('expand', () => {
    it('should call Python service and return expanded text', async () => {
      mockAxios.post.mockResolvedValue({
        data: { choices: [{ text: 'The ancient house stood weathered...' }] }
      });

      const result = await provider.expand('The house was old.');

      expect(mockAxios.post).toHaveBeenCalledWith(
        'http://localhost:8003/v1/completions',
        expect.objectContaining({
          prompt: expect.stringContaining('The house was old.')
        })
      );
      expect(result).toBe('The ancient house stood weathered...');
    });

    it('should use 4096 tokens for expand operation', async () => {
      mockAxios.post.mockResolvedValue({
        data: { choices: [{ text: 'expanded text' }] }
      });

      await provider.expand('short text');

      expect(mockAxios.post).toHaveBeenCalledWith(
        'http://localhost:8003/v1/completions',
        expect.objectContaining({
          max_tokens: 4096
        })
      );
    });
  });

  describe('refine', () => {
    it('should use 2048 tokens for refine operation', async () => {
      mockAxios.post.mockResolvedValue({
        data: { choices: [{ text: 'refined text' }] }
      });

      await provider.refine('text to refine');

      expect(mockAxios.post).toHaveBeenCalledWith(
        'http://localhost:8003/v1/completions',
        expect.objectContaining({
          max_tokens: 2048
        })
      );
    });
  });

  describe('revise', () => {
    it('should use 2048 tokens for revise operation', async () => {
      mockAxios.post.mockResolvedValue({
        data: { choices: [{ text: 'revised text' }] }
      });

      await provider.revise('text to revise');

      expect(mockAxios.post).toHaveBeenCalledWith(
        'http://localhost:8003/v1/completions',
        expect.objectContaining({
          max_tokens: 2048
        })
      );
    });
  });

  describe('restructure', () => {
    it('should use 2048 tokens for restructure operation', async () => {
      mockAxios.post.mockResolvedValue({
        data: { choices: [{ text: 'restructured text' }] }
      });

      await provider.restructure('text to restructure');

      expect(mockAxios.post).toHaveBeenCalledWith(
        'http://localhost:8003/v1/completions',
        expect.objectContaining({
          max_tokens: 2048
        })
      );
    });
  });

  describe('generateSynopsis', () => {
    it('should use 500 tokens for synopsis operation', async () => {
      mockAxios.post.mockResolvedValue({
        data: { choices: [{ text: 'brief synopsis' }] }
      });

      await provider.generateSynopsis('long story text');

      expect(mockAxios.post).toHaveBeenCalledWith(
        'http://localhost:8003/v1/completions',
        expect.objectContaining({
          max_tokens: 500
        })
      );
    });
  });

  describe('healthCheck', () => {
    it('should return true when service is healthy', async () => {
      mockAxios.get.mockResolvedValue({ data: { status: 'ok' } });
      const result = await provider.healthCheck();
      expect(result).toBe(true);
    });

    it('should return false when service is down', async () => {
      mockAxios.get.mockRejectedValue(new Error('Connection refused'));
      const result = await provider.healthCheck();
      expect(result).toBe(false);
    });
  });
});
