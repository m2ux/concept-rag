/**
 * Service interface for generating vector embeddings from text.
 * 
 * Embeddings are dense vector representations of text that capture semantic meaning.
 * Text with similar meanings will have embeddings that are close in vector space
 * (measured by cosine similarity or Euclidean distance).
 * 
 * **Purpose**:
 * - Enable semantic search (find by meaning, not just keywords)
 * - Power vector similarity comparisons
 * - Support conceptual navigation
 * 
 * **Standard Dimension**: 384 (compatible with many embedding models)
 * 
 * **Implementations**:
 * - `SimpleEmbeddingService`: Hash-based embeddings for development/testing
 * - `OpenAIEmbeddingService`: Production-grade embeddings (future)
 * - `HuggingFaceEmbeddingService`: Local embeddings (future)
 * 
 * @example
 * ```typescript
 * const service: EmbeddingService = new SimpleEmbeddingService();
 * 
 * const emb1 = service.generateEmbedding('machine learning');
 * const emb2 = service.generateEmbedding('artificial intelligence');
 * 
 * // Calculate similarity
 * const similarity = cosineSimilarity(emb1, emb2);
 * console.log(`Similarity: ${similarity.toFixed(3)}`);
 * ```
 * 
 * @see {@link SimpleEmbeddingService} for the default implementation
 */
export interface EmbeddingService {
  /**
   * Generate a 384-dimensional embedding vector from text.
   * 
   * Converts arbitrary text into a fixed-size vector representation that
   * captures semantic meaning. The same text always produces the same embedding
   * (deterministic).
   * 
   * **Properties**:
   * - **Dimensionality**: Always 384 dimensions
   * - **Normalization**: Vectors are normalized to unit length (norm = 1.0)
   * - **Deterministic**: Same input → same output
   * - **Semantic**: Similar meanings → similar vectors
   * 
   * **Performance**: Typically O(n) where n is text length
   * 
   * @param text - Text to embed (any length, will be processed as-is)
   * @returns 384-dimensional embedding vector, normalized to unit length
   * 
   * @example
   * ```typescript
   * const embedding = service.generateEmbedding('Hello, world!');
   * 
   * console.log(`Length: ${embedding.length}`); // 384
   * 
   * // Verify normalization (vector length ≈ 1.0)
   * const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
   * console.log(`Norm: ${norm.toFixed(6)}`); // ~1.000000
   * 
   * // Use for vector search
   * const results = await table.vectorSearch(embedding).limit(10).toArray();
   * ```
   */
  generateEmbedding(text: string): number[];
}
