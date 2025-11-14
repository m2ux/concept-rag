/**
 * Domain model representing a text chunk with concept metadata.
 * 
 * A chunk is a segment of text extracted from a document, enriched with:
 * - Vector embeddings for semantic search
 * - Extracted concepts for conceptual navigation
 * - Metadata for filtering and organization
 * 
 * **Two Formats**:
 * - **Regular chunks**: `concepts` is an array of concept names
 * - **Catalog entries**: `concepts` is a rich object with primary_concepts, technical_terms, etc.
 * 
 * @example
 * ```typescript
 * const chunk: Chunk = {
 *   id: 'chunk-123',
 *   text: 'Machine learning is a subset of artificial intelligence...',
 *   source: '/docs/ai-intro.pdf',
 *   hash: 'abc123',
 *   concepts: ['machine learning', 'artificial intelligence'],
 *   conceptCategories: ['computer science', 'AI'],
 *   conceptDensity: 0.8,
 *   embeddings: [0.1, 0.2, ...] // 384 dimensions
 * };
 * ```
 */
export interface Chunk {
  /** Unique identifier for the chunk */
  id: string;
  
  /** The text content of the chunk (typically 100-500 words) */
  text: string;
  
  /** Source document path or identifier */
  source: string;
  
  /** Content hash for deduplication */
  hash: string;
  
  /**
   * Extracted concepts associated with this chunk.
   * 
   * - For regular chunks: Array of concept names
   * - For catalog entries: Rich object with primary_concepts, technical_terms, etc.
   */
  concepts?: string[] | any;
  
  /** Semantic categories the chunk belongs to (e.g., 'software engineering', 'architecture') */
  conceptCategories?: string[];
  
  /** Density of concepts in the text (0-1, higher = more concept-rich) */
  conceptDensity?: number;
  
  /** 384-dimensional vector embedding for semantic similarity search */
  embeddings?: number[];
}

