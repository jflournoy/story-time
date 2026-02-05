# TDD Roadmap: Hybrid Architecture Integration

Complete the TypeScript backend + Python LLM microservice integration using Test-Driven Development.

## Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  CURRENT STATE                                                   │
│  ✅ TypeScript backend (Express) - working, 125 tests passing   │
│  ✅ Python LLM service (FastAPI) - created, documented          │
│  ❌ Provider abstraction - not created                          │
│  ❌ Integration - backend still expects Ollama                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  TARGET STATE                                                    │
│  ✅ TypeScript backend uses provider abstraction                │
│  ✅ LocalLLMProvider calls Python service                       │
│  ✅ OllamaProvider preserved for backwards compatibility        │
│  ✅ Configuration selects provider via environment              │
│  ✅ All tests pass with mocked providers                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## TDD Workflow Reminder

```
🔴 RED    → Write failing test (defines expected behavior)
🟢 GREEN  → Write minimal code to pass test
🔄 REFACTOR → Improve code while tests stay green
✓ COMMIT → Ship working, tested code
```

---

## Step 1: Provider Interface

**Goal:** Define the contract that all LLM providers must implement.

### 🔴 RED: Write failing test

```bash
# Create test file
touch backend/tests/providers/llm-provider.test.ts
```

```typescript
// backend/tests/providers/llm-provider.test.ts
import { describe, it, expect } from 'vitest';
import type { LLMProvider } from '../../src/providers/llm-provider';

describe('LLMProvider Interface', () => {
  // This test verifies the interface exists and is properly typed
  it('should define required methods', () => {
    // Type check: create a mock that satisfies the interface
    const mockProvider: LLMProvider = {
      expand: async (text: string, synopsis?: string) => 'expanded',
      refine: async (text: string, synopsis?: string) => 'refined',
      revise: async (text: string, synopsis?: string) => 'revised',
      generateSynopsis: async (text: string) => 'synopsis',
      healthCheck: async () => true,
    };

    expect(mockProvider.expand).toBeDefined();
    expect(mockProvider.refine).toBeDefined();
    expect(mockProvider.revise).toBeDefined();
    expect(mockProvider.generateSynopsis).toBeDefined();
    expect(mockProvider.healthCheck).toBeDefined();
  });

  it('should have correct method signatures', async () => {
    const mockProvider: LLMProvider = {
      expand: vi.fn().mockResolvedValue('expanded text'),
      refine: vi.fn().mockResolvedValue('refined text'),
      revise: vi.fn().mockResolvedValue('revised text'),
      generateSynopsis: vi.fn().mockResolvedValue('synopsis'),
      healthCheck: vi.fn().mockResolvedValue(true),
    };

    // Test expand with and without synopsis
    await mockProvider.expand('text');
    await mockProvider.expand('text', 'synopsis');

    expect(mockProvider.expand).toHaveBeenCalledTimes(2);
  });
});
```

**Run test:** `npm run backend:test -- --grep "LLMProvider Interface"`
**Expected:** ❌ FAIL (module not found)

### 🟢 GREEN: Create interface

```typescript
// backend/src/providers/llm-provider.ts
export interface LLMProvider {
  /**
   * Expand text with more detail and description
   */
  expand(text: string, synopsis?: string): Promise<string>;

  /**
   * Refine text for clarity and style
   */
  refine(text: string, synopsis?: string): Promise<string>;

  /**
   * Revise text structure and pacing
   */
  revise(text: string, synopsis?: string): Promise<string>;

  /**
   * Generate a synopsis from text
   */
  generateSynopsis(text: string): Promise<string>;

  /**
   * Check if provider is healthy and available
   */
  healthCheck(): Promise<boolean>;
}
```

**Run test:** `npm run backend:test -- --grep "LLMProvider Interface"`
**Expected:** ✅ PASS

### ✓ COMMIT

```bash
git add backend/src/providers/llm-provider.ts backend/tests/providers/llm-provider.test.ts
git commit -m "🔴 test: add LLMProvider interface with tests (TDD RED→GREEN)"
```

---

## Step 2: LocalLLMProvider (Calls Python Service)

**Goal:** Provider that calls the Python llm_service.py via HTTP.

### 🔴 RED: Write failing test

```typescript
// backend/tests/providers/local-llm-provider.test.ts
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
          prompt: expect.stringContaining('The house was old.'),
          max_tokens: expect.any(Number),
          temperature: expect.any(Number)
        })
      );
      expect(result).toBe('The ancient house stood weathered...');
    });

    it('should include synopsis in prompt when provided', async () => {
      mockAxios.post.mockResolvedValue({
        data: { choices: [{ text: 'expanded' }] }
      });

      await provider.expand('text', 'A gothic horror tale');

      expect(mockAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          prompt: expect.stringContaining('gothic horror')
        })
      );
    });
  });

  describe('refine', () => {
    it('should call Python service for refine operation', async () => {
      mockAxios.post.mockResolvedValue({
        data: { choices: [{ text: 'She sprinted to the door.' }] }
      });

      const result = await provider.refine('She ran quick to the door.');

      expect(result).toBe('She sprinted to the door.');
    });
  });

  describe('revise', () => {
    it('should call Python service for revise operation', async () => {
      mockAxios.post.mockResolvedValue({
        data: { choices: [{ text: 'Detective Morrison entered...' }] }
      });

      const result = await provider.revise('The man walked in.');

      expect(result).toBe('Detective Morrison entered...');
    });
  });

  describe('generateSynopsis', () => {
    it('should call Python service for synopsis generation', async () => {
      mockAxios.post.mockResolvedValue({
        data: { choices: [{ text: 'A story about discovery.' }] }
      });

      const result = await provider.generateSynopsis('Long story text...');

      expect(result).toBe('A story about discovery.');
    });
  });

  describe('healthCheck', () => {
    it('should return true when Python service is healthy', async () => {
      mockAxios.get.mockResolvedValue({
        data: { status: 'ok', model_loaded: true }
      });

      const result = await provider.healthCheck();

      expect(mockAxios.get).toHaveBeenCalledWith('http://localhost:8003/health');
      expect(result).toBe(true);
    });

    it('should return false when Python service is down', async () => {
      mockAxios.get.mockRejectedValue(new Error('Connection refused'));

      const result = await provider.healthCheck();

      expect(result).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should throw descriptive error when service fails', async () => {
      mockAxios.post.mockRejectedValue(new Error('Service unavailable'));

      await expect(provider.expand('text')).rejects.toThrow('LLM service error');
    });
  });
});
```

**Run test:** `npm run backend:test -- --grep "LocalLLMProvider"`
**Expected:** ❌ FAIL (module not found)

### 🟢 GREEN: Implement LocalLLMProvider

```typescript
// backend/src/providers/local-llm-provider.ts
import axios from 'axios';
import type { LLMProvider } from './llm-provider';

export interface LocalLLMConfig {
  serviceUrl: string;
  maxTokens?: number;
  temperature?: number;
}

export class LocalLLMProvider implements LLMProvider {
  private serviceUrl: string;
  private maxTokens: number;
  private temperature: number;

  constructor(config: LocalLLMConfig) {
    this.serviceUrl = config.serviceUrl;
    this.maxTokens = config.maxTokens ?? 500;
    this.temperature = config.temperature ?? 0.7;
  }

  async expand(text: string, synopsis?: string): Promise<string> {
    const prompt = this.buildExpandPrompt(text, synopsis);
    return this.complete(prompt);
  }

  async refine(text: string, synopsis?: string): Promise<string> {
    const prompt = this.buildRefinePrompt(text, synopsis);
    return this.complete(prompt);
  }

  async revise(text: string, synopsis?: string): Promise<string> {
    const prompt = this.buildRevisePrompt(text, synopsis);
    return this.complete(prompt);
  }

  async generateSynopsis(text: string): Promise<string> {
    const prompt = this.buildSynopsisPrompt(text);
    return this.complete(prompt);
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.serviceUrl}/health`);
      return response.data.status === 'ok';
    } catch {
      return false;
    }
  }

  private async complete(prompt: string): Promise<string> {
    try {
      const response = await axios.post(`${this.serviceUrl}/v1/completions`, {
        prompt,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
      });
      return response.data.choices[0].text;
    } catch (error) {
      throw new Error(`LLM service error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildExpandPrompt(text: string, synopsis?: string): string {
    let prompt = `Expand the following text with more detail and vivid description:\n\n${text}\n\n`;
    if (synopsis) {
      prompt = `Context: ${synopsis}\n\n${prompt}`;
    }
    prompt += 'Expanded version:';
    return prompt;
  }

  private buildRefinePrompt(text: string, synopsis?: string): string {
    let prompt = `Refine the following text for clarity, style, and flow:\n\n${text}\n\n`;
    if (synopsis) {
      prompt = `Context: ${synopsis}\n\n${prompt}`;
    }
    prompt += 'Refined version:';
    return prompt;
  }

  private buildRevisePrompt(text: string, synopsis?: string): string {
    let prompt = `Revise the following text to improve structure and pacing:\n\n${text}\n\n`;
    if (synopsis) {
      prompt = `Context: ${synopsis}\n\n${prompt}`;
    }
    prompt += 'Revised version:';
    return prompt;
  }

  private buildSynopsisPrompt(text: string): string {
    return `Generate a brief synopsis of the following text:\n\n${text}\n\nSynopsis:`;
  }
}
```

**Run test:** `npm run backend:test -- --grep "LocalLLMProvider"`
**Expected:** ✅ PASS

### ✓ COMMIT

```bash
git add backend/src/providers/local-llm-provider.ts backend/tests/providers/local-llm-provider.test.ts
git commit -m "🟢 feat: implement LocalLLMProvider for Python service (TDD GREEN)"
```

---

## Step 3: OllamaProvider (Backwards Compatibility)

**Goal:** Preserve existing Ollama functionality in provider pattern.

### 🔴 RED: Write failing test

```typescript
// backend/tests/providers/ollama-provider.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OllamaProvider } from '../../src/providers/ollama-provider';

// Mock the ollama module
vi.mock('ollama', () => ({
  Ollama: vi.fn().mockImplementation(() => ({
    generate: vi.fn()
  }))
}));

describe('OllamaProvider', () => {
  let provider: OllamaProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new OllamaProvider({
      host: 'http://localhost:11434',
      model: 'llama3:8b'
    });
  });

  it('should implement LLMProvider interface', () => {
    expect(provider.expand).toBeDefined();
    expect(provider.refine).toBeDefined();
    expect(provider.revise).toBeDefined();
    expect(provider.generateSynopsis).toBeDefined();
    expect(provider.healthCheck).toBeDefined();
  });

  // Add more specific tests similar to LocalLLMProvider
});
```

### 🟢 GREEN: Implement OllamaProvider

```typescript
// backend/src/providers/ollama-provider.ts
import { Ollama } from 'ollama';
import type { LLMProvider } from './llm-provider';

export interface OllamaConfig {
  host: string;
  model: string;
}

export class OllamaProvider implements LLMProvider {
  private ollama: Ollama;
  private model: string;

  constructor(config: OllamaConfig) {
    this.ollama = new Ollama({ host: config.host });
    this.model = config.model;
  }

  async expand(text: string, synopsis?: string): Promise<string> {
    // Migrate existing logic from llmService.ts
  }

  // ... implement other methods
}
```

### ✓ COMMIT

```bash
git add backend/src/providers/ollama-provider.ts backend/tests/providers/ollama-provider.test.ts
git commit -m "🟢 feat: implement OllamaProvider for backwards compatibility (TDD GREEN)"
```

---

## Step 4: Provider Configuration

**Goal:** Environment-based provider selection.

### 🔴 RED: Write failing test

```typescript
// backend/tests/config/provider-config.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getLLMProvider, providerConfig } from '../../src/config/provider-config';
import { LocalLLMProvider } from '../../src/providers/local-llm-provider';
import { OllamaProvider } from '../../src/providers/ollama-provider';

describe('Provider Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getLLMProvider', () => {
    it('should return LocalLLMProvider when PROVIDER_MODE=local', () => {
      process.env.PROVIDER_MODE = 'local';
      process.env.LLM_SERVICE_URL = 'http://localhost:8003';

      const provider = getLLMProvider();

      expect(provider).toBeInstanceOf(LocalLLMProvider);
    });

    it('should return OllamaProvider when PROVIDER_MODE=ollama', () => {
      process.env.PROVIDER_MODE = 'ollama';
      process.env.OLLAMA_HOST = 'http://localhost:11434';
      process.env.OLLAMA_MODEL = 'llama3:8b';

      const provider = getLLMProvider();

      expect(provider).toBeInstanceOf(OllamaProvider);
    });

    it('should default to local provider when PROVIDER_MODE not set', () => {
      delete process.env.PROVIDER_MODE;
      process.env.LLM_SERVICE_URL = 'http://localhost:8003';

      const provider = getLLMProvider();

      expect(provider).toBeInstanceOf(LocalLLMProvider);
    });

    it('should throw for unknown provider mode', () => {
      process.env.PROVIDER_MODE = 'invalid';

      expect(() => getLLMProvider()).toThrow('Unknown provider mode');
    });
  });
});
```

### 🟢 GREEN: Implement configuration

```typescript
// backend/src/config/provider-config.ts
import type { LLMProvider } from '../providers/llm-provider';
import { LocalLLMProvider } from '../providers/local-llm-provider';
import { OllamaProvider } from '../providers/ollama-provider';

export const providerConfig = {
  mode: process.env.PROVIDER_MODE || 'local',
  local: {
    serviceUrl: process.env.LLM_SERVICE_URL || 'http://localhost:8003',
    maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '500'),
    temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
  },
  ollama: {
    host: process.env.OLLAMA_HOST || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'llama3:8b',
  },
};

export function getLLMProvider(): LLMProvider {
  switch (providerConfig.mode) {
    case 'local':
      return new LocalLLMProvider(providerConfig.local);
    case 'ollama':
      return new OllamaProvider(providerConfig.ollama);
    default:
      throw new Error(`Unknown provider mode: ${providerConfig.mode}`);
  }
}
```

### ✓ COMMIT

```bash
git add backend/src/config/provider-config.ts backend/tests/config/provider-config.test.ts
git commit -m "🟢 feat: add provider configuration system (TDD GREEN)"
```

---

## Step 5: Update LLMService

**Goal:** Use provider abstraction instead of direct Ollama calls.

### 🔴 RED: Update existing tests

```typescript
// backend/tests/services/llmService.test.ts
// Update existing tests to verify provider delegation
describe('LLMService with Provider Abstraction', () => {
  it('should delegate expand to configured provider', async () => {
    const mockProvider = {
      expand: vi.fn().mockResolvedValue('expanded'),
      // ... other methods
    };

    const service = new LLMService(mockProvider);
    const result = await service.expand('text', 'synopsis');

    expect(mockProvider.expand).toHaveBeenCalledWith('text', 'synopsis');
    expect(result).toBe('expanded');
  });
});
```

### 🟢 GREEN: Refactor LLMService

```typescript
// backend/src/services/llmService.ts
import type { LLMProvider } from '../providers/llm-provider';
import { getLLMProvider } from '../config/provider-config';

export class LLMService {
  private provider: LLMProvider;

  constructor(provider?: LLMProvider) {
    this.provider = provider ?? getLLMProvider();
  }

  async expand(text: string, synopsis?: string): Promise<string> {
    return this.provider.expand(text, synopsis);
  }

  async refine(text: string, synopsis?: string): Promise<string> {
    return this.provider.refine(text, synopsis);
  }

  async revise(text: string, synopsis?: string): Promise<string> {
    return this.provider.revise(text, synopsis);
  }

  async generateSynopsis(text: string): Promise<string> {
    return this.provider.generateSynopsis(text);
  }

  async healthCheck(): Promise<boolean> {
    return this.provider.healthCheck();
  }
}
```

### ✓ COMMIT

```bash
git add backend/src/services/llmService.ts backend/tests/services/llmService.test.ts
git commit -m "🔄 refactor: LLMService uses provider abstraction (TDD REFACTOR)"
```

---

## Step 6: Environment & Scripts

**Goal:** Update configuration files and npm scripts.

### Tasks (no TDD needed for config)

1. **Update `.env.example`:**
```bash
# Provider Selection
PROVIDER_MODE=local  # 'local' | 'ollama'

# Local LLM Service (Python)
LLM_SERVICE_URL=http://localhost:8003
LLM_MAX_TOKENS=500
LLM_TEMPERATURE=0.7

# Ollama (backwards compatibility)
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3:8b
```

2. **Update `package.json` scripts:**
```json
{
  "scripts": {
    "dev:llm": "cd services && uvicorn llm_service:app --reload --port 8003",
    "dev:all": "concurrently \"npm run dev\" \"npm run dev:llm\"",
    "start:llm": "cd services && uvicorn llm_service:app --port 8003"
  }
}
```

3. **Update `.gitignore`:**
```
# Python
services/venv/
services/__pycache__/
*.pyc
*.pyo
*.gguf
```

### ✓ COMMIT

```bash
git add .env.example package.json .gitignore
git commit -m "chore: add environment config and npm scripts for Python service"
```

---

## Step 7: Integration Test

**Goal:** End-to-end test with real Python service.

### 🔴 RED: Write integration test

```typescript
// backend/tests/integration/local-llm-integration.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import axios from 'axios';
import { LocalLLMProvider } from '../../src/providers/local-llm-provider';

describe('LocalLLMProvider Integration', () => {
  const SERVICE_URL = 'http://localhost:8003';
  let provider: LocalLLMProvider;

  beforeAll(async () => {
    // Check if Python service is running
    try {
      await axios.get(`${SERVICE_URL}/health`);
    } catch {
      console.log('⚠️  Python LLM service not running, skipping integration tests');
      return;
    }
    provider = new LocalLLMProvider({ serviceUrl: SERVICE_URL });
  });

  it('should generate expanded text', async () => {
    const result = await provider.expand('The cat sat on the mat.');

    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(10);
  }, 30000); // 30s timeout for LLM response

  it('should handle synopsis context', async () => {
    const result = await provider.expand(
      'The house was old.',
      'A gothic horror tale'
    );

    expect(result).toBeDefined();
    // Result should reflect the gothic context
  }, 30000);
});
```

### 🟢 GREEN: Verify with running services

```bash
# Terminal 1: Start Python service
cd services
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
LLM_MODEL_FILE=/path/to/model.gguf uvicorn llm_service:app --port 8003

# Terminal 2: Run integration test
npm run backend:test -- --grep "Integration"
```

### ✓ COMMIT

```bash
git add backend/tests/integration/
git commit -m "✅ test: add integration tests for LocalLLMProvider"
```

---

## Quick Reference: Commands

```bash
# Run all backend tests
npm run backend:test

# Run specific test file
npm run backend:test -- backend/tests/providers/local-llm-provider.test.ts

# Run tests matching pattern
npm run backend:test -- --grep "LocalLLMProvider"

# Watch mode during development
npm run backend:test:watch

# Start Python service
cd services && uvicorn llm_service:app --reload --port 8003

# Start both services
npm run dev:all
```

---

## Checklist

- [ ] Step 1: LLMProvider interface + tests
- [ ] Step 2: LocalLLMProvider + tests
- [ ] Step 3: OllamaProvider + tests
- [ ] Step 4: Provider configuration + tests
- [ ] Step 5: Refactor LLMService + update tests
- [ ] Step 6: Environment & scripts
- [ ] Step 7: Integration tests

**Total estimated commits:** 7-10 atomic commits

---

## Success Criteria

After completing all steps:

1. ✅ `npm run backend:test` - All tests pass
2. ✅ `PROVIDER_MODE=local npm run dev` - Backend starts without Ollama
3. ✅ Python service responds to health checks
4. ✅ Text operations work via Python service
5. ✅ `PROVIDER_MODE=ollama npm run dev` - Still works with Ollama (if installed)
