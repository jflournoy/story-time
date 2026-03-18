import { describe, it, expect } from 'vitest';
import type { LLMProvider } from '../../src/providers/llm-provider';

describe('LLMProvider Interface', () => {
  it('should define required methods', () => {
    const mockProvider: LLMProvider = {
      expand: async (_text: string, _synopsis?: string) => 'expanded',
      refine: async (_text: string, _synopsis?: string) => 'refined',
      revise: async (_text: string, _synopsis?: string) => 'revised',
      generateSynopsis: async (_text: string) => 'synopsis',
      healthCheck: async () => true,
      getProviderName: () => 'mock',
    };

    expect(mockProvider.expand).toBeDefined();
    expect(mockProvider.refine).toBeDefined();
    expect(mockProvider.revise).toBeDefined();
    expect(mockProvider.generateSynopsis).toBeDefined();
    expect(mockProvider.healthCheck).toBeDefined();
    expect(mockProvider.getProviderName).toBeDefined();
    expect(mockProvider.getProviderName()).toBe('mock');
  });
});
