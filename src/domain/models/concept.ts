/**
 * Domain model representing an extracted concept from the document corpus.
 * 
 * Concepts are semantic entities identified in documents through AI extraction.
 * They are enriched with:
 * - WordNet relationships (synonyms, broader/narrower terms)
 * - Cross-document connections via catalogIds
 * - Vector embeddings for similarity search
 * 
 * @example
 * ```typescript
 * const concept: Concept = {
 *   name: 'machine learning',
 *   catalogIds: [12345678, 87654321],
 *   adjacentIds: [11111111, 22222222],  // co-occurrence
 *   relatedIds: [33333333, 44444444],   // lexical links
 *   relatedConcepts: ['deep learning', 'neural networks'],
 *   synonyms: ['ML', 'statistical learning'],
 *   broaderTerms: ['artificial intelligence'],
 *   narrowerTerms: ['supervised learning', 'unsupervised learning'],
 *   embeddings: [0.1, 0.2, ...],
 *   weight: 0.85
 * };
 * ```
 */
export interface Concept {
  /** The concept name (e.g., 'dependency injection', 'REST API') */
  name: string;
  
  /** LLM-generated one-sentence summary of the concept */
  summary?: string;
  
  /** 
   * Document catalog IDs where this concept appears (hash-based integers).
   * Primary authoritative field for document references.
   */
  catalogIds?: number[];

  /**
   * Chunk IDs where this concept appears (hash-based integers).
   * Enables fast concept → chunks lookups without scanning chunks table.
   */
  chunkIds?: number[];
  
  /**
   * Denormalized catalog titles - DERIVED field for display and text search.
   * Resolved from catalog_ids → catalog.source (title extracted from path).
   * Enables human-readable document display without lookup.
   */
  catalogTitles?: string[];
  
  /** 
   * Adjacent concept IDs - co-occurrence based (concepts appearing together in documents).
   * Hash-based integers.
   */
  adjacentIds?: number[];
  
  /** 
   * Related concept IDs - lexically linked (concepts sharing significant words).
   * E.g., "military strategy" ↔ "strategy pattern" share "strategy".
   * Hash-based integers.
   */
  relatedIds?: number[];
  
  /** 
   * Related concept names (resolved from relatedIds or adjacentIds).
   * May be populated for API compatibility.
   */
  relatedConcepts?: string[];
  
  /** Alternative names or abbreviations (from WordNet or corpus analysis) */
  synonyms?: string[];
  
  /** More general concepts in the hierarchy (WordNet: hypernyms) */
  broaderTerms?: string[];
  
  /** More specific concepts in the hierarchy (WordNet: hyponyms) */
  narrowerTerms?: string[];
  
  /** 384-dimensional vector embedding for semantic similarity */
  embeddings: number[];
  
  /** Importance weight (0-1, based on frequency and centrality) */
  weight: number;
}
