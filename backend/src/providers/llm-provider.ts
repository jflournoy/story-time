export interface LLMProvider {
  expand(text: string, synopsis?: string): Promise<string>;
  refine(text: string, synopsis?: string): Promise<string>;
  revise(text: string, synopsis?: string): Promise<string>;
  restructure(text: string, synopsis?: string): Promise<string>;
  generateSynopsis(text: string): Promise<string>;
  healthCheck(): Promise<boolean>;
  getProviderName(): string;
}
