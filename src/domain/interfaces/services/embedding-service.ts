/**
 * Service interface for generating text embeddings
 */
export interface EmbeddingService {
  /**
   * Generate embedding vector for text
   * 
   * @param text - Text to embed
   * @returns 384-dimensional embedding vector
   */
  generateEmbedding(text: string): number[];
}

