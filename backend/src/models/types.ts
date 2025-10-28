/**
 * Text operation types
 */
export type TextOperation = 'expand' | 'refine' | 'revise' | 'restructure';

/**
 * Request body for text operations
 */
export interface TextOperationRequest {
  text: string;
  synopsis?: string;
  operation: TextOperation;
}

/**
 * Response from text operations
 */
export interface TextOperationResponse {
  operation: TextOperation;
  result: string;
  timestamp: string;
}

/**
 * Synopsis request/response
 */
export interface SynopsisRequest {
  text: string;
}

export interface SynopsisResponse {
  synopsis: string;
  timestamp: string;
}

/**
 * LLM generation options
 */
export interface LLMOptions {
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
}
