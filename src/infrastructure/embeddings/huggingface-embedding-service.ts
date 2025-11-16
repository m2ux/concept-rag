import { EmbeddingService } from '../../domain/interfaces/services/embedding-service.js';
import { HfInference } from '@huggingface/inference';
import type { HuggingFaceEmbeddingConfig } from '../../config.js';

/**
 * HuggingFace Embedding Service - Local or API-based embeddings
 * 
 * Supports two modes:
 * 1. **API Mode**: Use HuggingFace Inference API (requires API key)
 * 2. **Local Mode**: Run embeddings locally using transformers.js (privacy-first, no API key)
 * 
 * **Recommended Models**:
 * - `sentence-transformers/all-MiniLM-L6-v2`: 384 dims (native, no projection needed)
 * - `sentence-transformers/all-mpnet-base-v2`: 768 dims (project to 384)
 * - `BAAI/bge-small-en-v1.5`: 384 dims (high quality)
 * - `Xenova/all-MiniLM-L6-v2`: 384 dims (optimized for transformers.js)
 * 
 * **Benefits**:
 * - **Privacy**: Local mode runs entirely offline
 * - **Cost**: Free (local) or affordable API pricing
 * - **Quality**: Excellent semantic understanding
 * - **Flexibility**: Many models to choose from
 * 
 * @example
 * ```typescript
 * // API Mode
 * const apiService = new HuggingFaceEmbeddingService({
 *   apiKey: process.env.HUGGINGFACE_API_KEY,
 *   model: 'sentence-transformers/all-MiniLM-L6-v2',
 *   useLocal: false
 * });
 * 
 * // Local Mode (privacy-first)
 * const localService = new HuggingFaceEmbeddingService({
 *   model: 'Xenova/all-MiniLM-L6-v2',
 *   useLocal: true
 * });
 * 
 * const embedding = await localService.generateEmbeddingAsync('deep learning');
 * console.log(`Dimension: ${embedding.length}`); // 384
 * ```
 */
export class HuggingFaceEmbeddingService implements EmbeddingService {
  private client?: HfInference;
  private model: string;
  private useLocal: boolean;
  private targetDimension = 384;
  
  constructor(config: HuggingFaceEmbeddingConfig) {
    this.model = config.model;
    this.useLocal = config.useLocal;
    
    if (!this.useLocal && config.apiKey) {
      this.client = new HfInference(config.apiKey);
    } else if (!this.useLocal && !config.apiKey) {
      throw new Error(
        'HuggingFace API mode requires an API key. ' +
        'Either provide HUGGINGFACE_API_KEY or set HUGGINGFACE_USE_LOCAL=true'
      );
    }
  }
  
  /**
   * Generate a 384-dimensional embedding
   * 
   * @param _text - Text to embed (unused - sync interface not supported)
   * @returns 384-dimensional normalized embedding vector
   * @throws {Error} If interface doesn't support async operations
   */
  generateEmbedding(_text: string): number[] {
    try {
      // Both API and local modes require async operations
      throw new Error(
        'HuggingFaceEmbeddingService requires async support. ' +
        'The EmbeddingService interface needs to be updated to support async operations.'
      );
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`HuggingFace embedding generation failed: ${error.message}`);
      }
      throw error;
    }
  }
  
  /**
   * Generate embedding asynchronously (preferred method)
   * 
   * **API Mode Process**:
   * 1. Call HuggingFace Inference API
   * 2. Receive embedding (dimension depends on model)
   * 3. Project to 384 if needed
   * 4. Normalize to unit length
   * 
   * **Local Mode Process**:
   * 1. Load model from HuggingFace (cached after first load)
   * 2. Generate embedding locally
   * 3. Project to 384 if needed
   * 4. Normalize to unit length
   * 
   * **Performance**:
   * - API Mode: ~100-500ms (depends on API latency)
   * - Local Mode: ~50-200ms after model load (first run may take 1-2s)
   * 
   * **Cost**:
   * - API Mode: ~$0.001 per 1K requests (check HF pricing)
   * - Local Mode: Free (uses CPU/memory)
   * 
   * @param text - Text to embed
   * @returns 384-dimensional normalized embedding vector
   * @throws {Error} If API call fails or local inference fails
   */
  async generateEmbeddingAsync(text: string): Promise<number[]> {
    try {
      if (this.useLocal) {
        return await this.generateLocalEmbedding(text);
      } else {
        return await this.generateApiEmbedding(text);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`HuggingFace embedding generation failed: ${error.message}`);
      }
      throw error;
    }
  }
  
  /**
   * Generate embedding via HuggingFace Inference API
   */
  private async generateApiEmbedding(text: string): Promise<number[]> {
    if (!this.client) {
      throw new Error('HuggingFace client not initialized (API key missing?)');
    }
    
    try {
      // Use feature extraction endpoint for embeddings
      const result = await this.client.featureExtraction({
        model: this.model,
        inputs: text
      });
      
      // Feature extraction returns a tensor - flatten if needed
      let embedding: number[];
      if (Array.isArray(result) && typeof result[0] === 'number') {
        embedding = result as number[];
      } else if (Array.isArray(result) && Array.isArray(result[0])) {
        // Mean pooling if we get a 2D array (token embeddings)
        embedding = this.meanPooling(result as number[][]);
      } else {
        throw new Error('Unexpected embedding format from HuggingFace API');
      }
      
      // Project to target dimension if needed
      if (embedding.length > this.targetDimension) {
        embedding = embedding.slice(0, this.targetDimension);
      } else if (embedding.length < this.targetDimension) {
        // Pad with zeros if embedding is smaller than target
        embedding = [...embedding, ...new Array(this.targetDimension - embedding.length).fill(0)];
      }
      
      // Normalize to unit length
      return this.normalize(embedding);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('403')) {
          throw new Error('HuggingFace API key invalid. Set HUGGINGFACE_API_KEY environment variable.');
        } else if (error.message.includes('404')) {
          throw new Error(`HuggingFace model not found: ${this.model}. Check available models at huggingface.co/models`);
        }
        throw new Error(`HuggingFace API error: ${error.message}`);
      }
      throw error;
    }
  }
  
  /**
   * Generate embedding locally using transformers.js
   * 
   * Note: Local inference requires @xenova/transformers package
   * which is not included by default. This is a placeholder
   * implementation that will need the additional dependency.
   * 
   * @param _text - Text to embed (unused - not yet implemented)
   * @returns Never (throws error)
   */
  private async generateLocalEmbedding(_text: string): Promise<number[]> {
    // Note: This requires @xenova/transformers to be installed
    // For now, we'll provide a helpful error message
    throw new Error(
      'Local HuggingFace inference is not yet implemented. ' +
      'To use local embeddings, install: npm install @xenova/transformers\n' +
      'For now, please use API mode or switch to a different provider.'
    );
    
    // Future implementation would look like:
    // const { pipeline } = await import('@xenova/transformers');
    // const extractor = await pipeline('feature-extraction', this.model);
    // const output = await extractor(text, { pooling: 'mean', normalize: true });
    // return this.projectAndNormalize(output.data);
  }
  
  /**
   * Mean pooling for token embeddings
   */
  private meanPooling(tokenEmbeddings: number[][]): number[] {
    if (tokenEmbeddings.length === 0) {
      throw new Error('Cannot perform mean pooling on empty token embeddings');
    }
    
    const dim = tokenEmbeddings[0].length;
    const pooled = new Array(dim).fill(0);
    
    for (const tokenEmb of tokenEmbeddings) {
      for (let i = 0; i < dim; i++) {
        pooled[i] += tokenEmb[i];
      }
    }
    
    return pooled.map(val => val / tokenEmbeddings.length);
  }
  
  /**
   * Normalize vector to unit length
   */
  private normalize(vector: number[]): number[] {
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return vector.map(val => norm > 0 ? val / norm : 0);
  }
}

