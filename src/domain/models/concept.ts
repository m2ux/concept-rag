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
 *   concept: 'machine learning',
 *   catalogIds: [12345678, 87654321],
 *   relatedConceptIds: [11111111, 22222222],
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
  concept: string;
  
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
   * Related concept IDs (hash-based integers).
   * Primary authoritative field for related concepts.
   */
  relatedConceptIds?: number[];
  
  /** 
   * Related concept names (resolved from relatedConceptIds or from corpus analysis).
   * May be populated for API compatibility when relatedConceptIds are resolved.
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

