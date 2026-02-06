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
