import { Chunk } from './chunk.js';

/**
 * Domain model for search results with scoring metadata
 */
export interface SearchResult extends Chunk {
  // Scoring components
  distance: number;
  vectorScore: number;
  bm25Score: number;
  titleScore: number;
  conceptScore: number;
  wordnetScore: number;
  hybridScore: number;
  
  // Metadata
  matchedConcepts?: string[];
  expandedTerms?: string[];
}

/**
 * Query parameters for search operations
 */
export interface SearchQuery {
  text: string;
  limit?: number;
  sourceFilter?: string;
  debug?: boolean;
}

