/**
 * Domain model representing a text chunk with concept metadata.
 * 
 * A chunk is a segment of text extracted from a document, enriched with:
 * - Vector embeddings for semantic search
 * - Extracted concepts for conceptual navigation (via ID references)
 * - Metadata for filtering and organization
 * 
 * Source path should be looked up via catalogId from the catalog table.
 * The source field is deprecated and retained only for backward compatibility.
 * 
 * @example
 * ```typescript
 * const chunk: Chunk = {
 *   id: 3847293847,  // hash-based integer
 *   text: 'Machine learning is a subset of artificial intelligence...',
 *   catalogId: 12345678,
 *   hash: 'abc123',
 *   conceptIds: [11111111, 22222222],
 *   categoryIds: [33333333],
 *   embeddings: [0.1, 0.2, ...]
 * };
 * 
 * // To get source path for display, use CatalogSourceCache:
 * const source = CatalogSourceCache.getInstance().getSource(chunk.catalogId);
 * ```
 */
export interface Chunk {
  /** Unique identifier for the chunk (hash-based integer) */
  id: number;
  
  /** The text content of the chunk (typically 100-500 words) */
  text: string;
  
  /** 
  
  /** Parent document ID (hash-based integer, matches catalog.id) */
  catalogId: number;
  
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
  
  /** Page number within source document (1-indexed, from PDF metadata) */
  pageNumber?: number;
  
  /** 
   * Concept density score (0-1) indicating conceptual richness.
   * Calculated as: concept_ids.length / (word_count / 10)
   * Higher values indicate more concept-rich content.
   */
  conceptDensity?: number;
}

