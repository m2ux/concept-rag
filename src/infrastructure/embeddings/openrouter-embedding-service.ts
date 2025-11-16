import { EmbeddingService } from '../../domain/interfaces/services/embedding-service.js';
import OpenAI from 'openai';
import type { OpenRouterEmbeddingConfig } from '../../config.js';

/**
 * OpenRouter Embedding Service - Multi-model embeddings via OpenRouter API
 * 
 * OpenRouter provides access to multiple embedding models through a unified
 * OpenAI-compatible API. Supports automatic fallback, usage tracking, and
 * competitive pricing.
 * 
 * **Supported Models**:
 * - `openai/text-embedding-3-small`: 1536 dims, $0.02/1M tokens
 * - `openai/text-embedding-3-large`: 3072 dims, $0.13/1M tokens
 * - `openai/text-embedding-ada-002`: 1536 dims (legacy)
 * - Additional models as OpenRouter adds support
 * 
 * **Benefits**:
 * - Unified API for multiple providers
 * - Automatic model availability checks
 * - Usage tracking and analytics
 * - Competitive pricing
 * 
 * @example
 * ```typescript
 * const service = new OpenRouterEmbeddingService({
 *   apiKey: process.env.OPENROUTER_API_KEY!,
 *   model: 'openai/text-embedding-3-small',
 *   baseUrl: 'https://openrouter.ai/api/v1'
 * });
 * 
 * const embedding = await service.generateEmbeddingAsync('artificial intelligence');
 * console.log(`Dimension: ${embedding.length}`); // 384
 * ```
 */
export class OpenRouterEmbeddingService implements EmbeddingService {
  private client: OpenAI;
  private model: string;
  private targetDimension = 384;
  
  constructor(config: OpenRouterEmbeddingConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
      defaultHeaders: {
        'HTTP-Referer': 'https://github.com/m2ux/concept-rag',
        'X-Title': 'Concept-RAG'
      }
    });
    this.model = config.model;
  }
  
  /**
   * Generate a 384-dimensional embedding using OpenRouter API
   * 
   * OpenRouter uses an OpenAI-compatible API, so the implementation
   * is similar to OpenAIEmbeddingService but with OpenRouter-specific headers.
   * 
   * **Performance**: ~100-300ms per request (depends on selected model and API latency)
   * **Cost**: Variable by model (check OpenRouter pricing)
   * 
   * @param _text - Text to embed (unused - sync interface not supported)
   * @returns 384-dimensional normalized embedding vector
   * @throws {Error} If API call fails or interface doesn't support async
   */
  generateEmbedding(_text: string): number[] {
    try {
      // Synchronous wrapper - OpenRouter API is async only
      // In practice, this should be async throughout the codebase
      throw new Error(
        'OpenRouterEmbeddingService requires async support. ' +
        'The EmbeddingService interface needs to be updated to support async operations.'
      );
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`OpenRouter embedding generation failed: ${error.message}`);
      }
      throw error;
    }
  }
  
  /**
   * Generate embedding asynchronously (preferred method)
   * 
   * Process:
   * 1. Call OpenRouter embeddings API (OpenAI-compatible)
   * 2. Receive embedding (dimension depends on model)
   * 3. Project to 384 dimensions via truncation
   * 4. Normalize to unit length
   * 
   * @param text - Text to embed
   * @returns 384-dimensional normalized embedding vector
   * @throws {Error} If API call fails (network, auth, rate limit, model unavailable)
   */
  async generateEmbeddingAsync(text: string): Promise<number[]> {
    try {
      const response = await this.client.embeddings.create({
        model: this.model,
        input: text,
        encoding_format: 'float'
      });
      
      if (!response.data || response.data.length === 0) {
        throw new Error('No embedding returned from OpenRouter API');
      }
      
      const fullEmbedding = response.data[0].embedding;
      
      // Project to target dimension (384) via truncation
      const truncated = fullEmbedding.slice(0, this.targetDimension);
      
      // Normalize to unit length
      return this.normalize(truncated);
    } catch (error) {
      if (error instanceof Error) {
        // Provide helpful error messages for common issues
        if (error.message.includes('401')) {
          throw new Error('OpenRouter API key invalid or missing. Set OPENROUTER_API_KEY environment variable.');
        } else if (error.message.includes('402') || error.message.includes('insufficient')) {
          throw new Error('OpenRouter account has insufficient credits. Please add credits at openrouter.ai');
        } else if (error.message.includes('404') || error.message.includes('not found')) {
          throw new Error(`OpenRouter model not found: ${this.model}. Check available models at openrouter.ai/docs`);
        }
        throw new Error(`OpenRouter embedding generation failed: ${error.message}`);
      }
      throw error;
    }
  }
  
  /**
   * Normalize vector to unit length
   */
  private normalize(vector: number[]): number[] {
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return vector.map(val => norm > 0 ? val / norm : 0);
  }
}

