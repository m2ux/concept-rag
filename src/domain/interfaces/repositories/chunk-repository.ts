import { Chunk, SearchQuery, SearchResult } from '../../models/index.js';

/**
 * Repository interface for chunk data access
 * 
 * Implementations must provide efficient queries without loading
 * all data into memory (use database capabilities like vector search).
 */
export interface ChunkRepository {
  /**
   * Find chunks by concept name
   * Uses vector search for efficiency - does NOT load all chunks
   * 
   * @param concept - Concept name to search for
   * @param limit - Maximum results to return
   * @returns Chunks containing the concept, sorted by relevance
   */
  findByConceptName(concept: string, limit: number): Promise<Chunk[]>;
  
  /**
   * Find chunks by source path
   * 
   * @param source - Source document path
   * @param limit - Maximum results to return
   * @returns Chunks from the specified source
   */
  findBySource(source: string, limit: number): Promise<Chunk[]>;
  
  /**
   * Hybrid search across all chunks
   * Uses multi-signal ranking (vector + BM25 + concepts + wordnet)
   * 
   * @param query - Search query with parameters
   * @returns Ranked search results with scoring metadata
   */
  search(query: SearchQuery): Promise<SearchResult[]>;
  
  /**
   * Count total chunks in repository
   * 
   * @returns Total number of chunks
   */
  countChunks(): Promise<number>;
}

