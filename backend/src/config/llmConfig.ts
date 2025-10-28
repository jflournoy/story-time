export class LLMConfig {
  public readonly ollamaHost: string;
  public readonly model: string;

  constructor() {
    this.ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434';
    this.model = process.env.OLLAMA_MODEL || 'llama3:8b';
  }
}
