import { Chunk } from './chunk.js';

/**
 * Domain model for search results with multi-signal scoring metadata.
 * 
 * Extends {@link Chunk} with scoring information from the hybrid search algorithm.
 * Results are ranked using a weighted combination of multiple signals:
 * - **Vector similarity**: Semantic understanding (30% catalog, 35% chunk)
 * - **BM25**: Keyword matching (25% catalog, 35% chunk)
 * - **Title matching**: Document relevance (20% catalog only)
 * - **Concept matching**: Concept alignment (15% both)
 * - **WordNet expansion**: Semantic enrichment (10% catalog, 15% chunk)
 * 
 * @example
 * ```typescript
 * const result: SearchResult = {
 *   // Chunk properties
 *   id: 3847293847,  // hash-based integer
 *   text: 'Dependency injection is a design pattern...',
 *   catalogId: 12345678,
 *   hash: 'abc123',
 *   conceptIds: [11111111, 22222222],
 *   // Display fields (resolved from catalog)
 *   source: '/docs/design-patterns.pdf',  // Optional, from catalog lookup
 *   
 *   // Scoring components
 *   distance: 0.15,
 *   vectorScore: 0.85,
 *   bm25Score: 0.72,
 *   titleScore: 0.90,
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
  /** 
   * Source document path (for display purposes).
   * Chunks no longer store source - this is populated from catalog lookup or cache.
   */
  source?: string;
  
  /**
   * Concept IDs associated with this document (for catalog entries).
   * Foreign keys to the concepts table.
   * For catalog entries only - chunks have their own conceptIds in the Chunk model.
   */
  documentConceptIds?: number[];
  
  /** Vector distance from query (0 = identical, higher = more different) */
  distance: number;
  
  /** Vector similarity score (0-1, higher = more similar) */
  vectorScore: number;
  
  /** BM25 keyword matching score (0-1, higher = better keyword match) */
  bm25Score: number;
  
  /** Title/source matching score (0-1, higher = query appears in title) */
  titleScore: number;
  
  /** Concept alignment score based on expanded concept terms (0-1, higher = better concept match) */
  conceptScore: number;
  
  /** WordNet semantic expansion score (0-1, higher = more synonym matches) */
  wordnetScore: number;
  
  /**
   * Final hybrid score combining all signals (0-1, higher = more relevant).
   * 
   * Catalog formula: `0.30*vector + 0.25*bm25 + 0.20*title + 0.15*concept + 0.10*wordnet`
   * Chunk formula: `0.35*vector + 0.35*bm25 + 0.15*concept + 0.15*wordnet`
   */
  hybridScore: number;
  
  /** Concepts from the chunk that matched the query */
  matchedConcepts?: string[];
  
  /** Query terms expanded via WordNet and corpus analysis */
  expandedTerms?: string[];
  
  /**
   * Denormalized concept names - DERIVED field for display and text search.
   * For catalog entries: resolved from documentConceptIds → concepts.name
   * Enables queries like: `array_contains(concept_names, 'dependency injection')`
   */
  conceptNames?: string[];
  
  /**
   * Denormalized category names - DERIVED field for display and text search.
   * Resolved from catalog.category_ids → categories.category
   * Enables human-readable category display without lookup.
   */
  categoryNames?: string[];
  
  /**
   * Category IDs associated with this document (for catalog entries).
   * Foreign keys to the categories table.
   */
  categoryIds?: number[];
  
  // ============================================
  // Research Paper Metadata Fields
  // ============================================
  
  /**
   * Document type classification.
   * Determined by heuristics: page count, section patterns, metadata.
   */
  documentType?: 'book' | 'paper' | 'article' | 'unknown';
  
  /**
   * Digital Object Identifier for academic papers.
   * Format: "10.1109/MS.2022.3166266"
   */
  doi?: string;
  
  /**
   * ArXiv identifier for preprints.
   * Format: "2204.11193" or "2204.11193v1"
   */
  arxivId?: string;
  
  /**
   * Publication venue (journal or conference name).
   * Examples: "IEEE Software", "NeurIPS 2023", "Journal of Finance"
   */
  venue?: string;
  
  /**
   * Keywords from paper metadata or extracted from content.
   * Native array for text search.
   */
  keywords?: string[];
  
  /**
   * Paper abstract (distinct from LLM-generated summary).
   * Extracted from document content or PDF metadata.
   */
  abstract?: string;
  
  /**
   * Array of author names (for multi-author papers).
   * Complements the single 'author' string field for papers with many authors.
   */
  authors?: string[];
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
  
  /** Exclude reference/bibliography chunks from results (default: true for chunk searches) */
  excludeReferences?: boolean;
  
  /** Exclude chunks with extraction issues (garbled math) */
  excludeExtractionIssues?: boolean;
}

