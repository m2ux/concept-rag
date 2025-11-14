import { Chunk } from './chunk.js';

/**
 * Domain model for search results with multi-signal scoring metadata.
 * 
 * Extends {@link Chunk} with scoring information from the hybrid search algorithm.
 * Results are ranked using a weighted combination of multiple signals:
 * - **Vector similarity**: Semantic understanding (25% weight)
 * - **BM25**: Keyword matching (25% weight)
 * - **Title matching**: Document relevance (20% weight)
 * - **Concept alignment**: Conceptual relevance (20% weight)
 * - **WordNet expansion**: Semantic enrichment (10% weight)
 * 
 * @example
 * ```typescript
 * const result: SearchResult = {
 *   // Chunk properties
 *   id: 'chunk-123',
 *   text: 'Dependency injection is a design pattern...',
 *   source: '/docs/design-patterns.pdf',
 *   hash: 'abc123',
 *   concepts: ['dependency injection', 'design patterns'],
 *   
 *   // Scoring components
 *   distance: 0.15,
 *   vectorScore: 0.85,
 *   bm25Score: 0.72,
 *   titleScore: 0.90,
 *   conceptScore: 0.68,
 *   wordnetScore: 0.45,
 *   hybridScore: 0.74, // Weighted combination
 *   
 *   // Match metadata
 *   matchedConcepts: ['dependency injection'],
 *   expandedTerms: ['DI', 'inversion of control']
 * };
 * ```
 * 
 * @see {@link Chunk} for base chunk properties
 * @see {@link SearchQuery} for query parameters
 */
export interface SearchResult extends Chunk {
  /** Vector distance from query (0 = identical, higher = more different) */
  distance: number;
  
  /** Vector similarity score (0-1, higher = more similar) */
  vectorScore: number;
  
  /** BM25 keyword matching score (0-1, higher = better keyword match) */
  bm25Score: number;
  
  /** Title/source matching score (0-1, higher = query appears in title) */
  titleScore: number;
  
  /** Concept alignment score (0-1, higher = more conceptual overlap) */
  conceptScore: number;
  
  /** WordNet semantic expansion score (0-1, higher = more synonym matches) */
  wordnetScore: number;
  
  /**
   * Final hybrid score combining all signals (0-1, higher = more relevant).
   * 
   * Formula: `0.25*vector + 0.25*bm25 + 0.20*title + 0.20*concept + 0.10*wordnet`
   */
  hybridScore: number;
  
  /** Concepts from the chunk that matched the query */
  matchedConcepts?: string[];
  
  /** Query terms expanded via WordNet and corpus analysis */
  expandedTerms?: string[];
}

/**
 * Query parameters for search operations across all search modalities.
 * 
 * Used by all repository search methods to provide consistent query interface
 * with optional filtering and debugging capabilities.
 * 
 * @example
 * ```typescript
 * const query: SearchQuery = {
 *   text: 'dependency injection patterns',
 *   limit: 10,
 *   sourceFilter: 'design-patterns',
 *   debug: true
 * };
 * 
 * const results = await chunkRepo.search(query);
 * ```
 */
export interface SearchQuery {
  /** The search query text (natural language or keywords) */
  text: string;
  
  /** Maximum number of results to return (default varies by operation, typically 5-10) */
  limit?: number;
  
  /** Filter results to sources containing this substring (case-insensitive) */
  sourceFilter?: string;
  
  /** Enable debug logging for score breakdown (outputs to stderr) */
  debug?: boolean;
}

