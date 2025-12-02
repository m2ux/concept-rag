/**
 * Domain model representing a text chunk with concept metadata.
 * 
 * A chunk is a segment of text extracted from a document, enriched with:
 * - Vector embeddings for semantic search
 * - Extracted concepts for conceptual navigation (via ID references)
 * - Derived fields for display (catalog_title, concept_names)
 * 
 * @example
 * ```typescript
 * const chunk: Chunk = {
 *   id: 3847293847,  // hash-based integer
 *   text: 'Machine learning is a subset of artificial intelligence...',
 *   catalogId: 12345678,
 *   catalogTitle: 'Machine Learning Fundamentals',  // derived from catalog
 *   hash: 'abc123',
 *   conceptIds: [11111111, 22222222],
 *   conceptNames: ['machine learning', 'artificial intelligence'],  // derived
 *   embeddings: [0.1, 0.2, ...]
 * };
 * 
 * // Display uses derived fields directly - no cache lookup needed
 * console.log(`Title: ${chunk.catalogTitle}`);
 * console.log(`Concepts: ${chunk.conceptNames.join(', ')}`);
 * ```
 */
export interface Chunk {
  /** Unique identifier for the chunk (hash-based integer) */
  id: number;
  
  /** The text content of the chunk (typically 100-500 words) */
  text: string;
  
  /** Parent document ID (hash-based integer, matches catalog.id) */
  catalogId: number;
  
  /**
   * Document title from catalog - DERIVED field for display.
   * Populated from catalog.title during seeding.
   * Use this for display instead of looking up via catalogId.
   */
  catalogTitle?: string;
  
  /** Content hash for deduplication */
  hash: string;
  
  /** Hash-based concept IDs - primary authoritative field */
  conceptIds?: number[];
  
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
  
  /**
   * Denormalized concept names - DERIVED field for display and text search.
   * Regenerated from concept_ids → concepts.name lookup.
   * Enables queries like: `array_contains(concept_names, 'dependency injection')`
   */
  conceptNames?: string[];
}
