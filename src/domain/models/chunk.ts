/**
 * Domain model representing a text chunk with concept metadata.
 * 
 * A chunk is a segment of text extracted from a document, enriched with:
 * - Vector embeddings for semantic search
 * - Extracted concepts for conceptual navigation (via ID references)
 * - Metadata for filtering and organization
 * 
 * @example
 * ```typescript
 * const chunk: Chunk = {
 *   id: 'chunk-123',
 *   text: 'Machine learning is a subset of artificial intelligence...',
 *   catalogId: 12345678,
 *   hash: 'abc123',
 *   conceptIds: [11111111, 22222222],
 *   categoryIds: [33333333],
 *   embeddings: [0.1, 0.2, ...]
 * };
 * ```
 */
export interface Chunk {
  /** Unique identifier for the chunk */
  id: string;
  
  /** The text content of the chunk (typically 100-500 words) */
  text: string;
  
  /** 
   * @deprecated Use catalogId instead. Will be removed in future version.
   * Source document path (for backward compatibility during migration)
   */
  source?: string;
  
  /** Parent document ID (hash-based integer, matches catalog.id) */
  catalogId?: number;
  
  /** Content hash for deduplication */
  hash: string;
  
  /**
   * Concepts associated with this chunk (resolved names from conceptIds).
   * This is a computed field populated by ConceptIdCache.getNames(conceptIds).
   * 
   * @deprecated Prefer using conceptIds directly. This field exists for API compatibility.
   */
  concepts?: string[];
  
  /** Hash-based concept IDs - primary authoritative field */
  conceptIds?: number[];
  
  /** Hash-based category IDs - primary authoritative field */
  categoryIds?: number[];
  
  /** 384-dimensional vector embedding for semantic similarity search */
  embeddings?: number[];
}

