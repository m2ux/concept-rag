/**
 * Result-Based Fuzzy Concept Search Service
 * 
 * This service provides fuzzy/semantic search over concept summaries,
 * similar to how catalog_search searches document summaries.
 * Uses hybrid search (vector + BM25 + name matching) for comprehensive ranking.
 * 
 * Key difference from catalog search: uses concept name matching instead
 * of title/filename matching for the "title" score component.
 */

import { ConceptRepository } from '../interfaces/repositories/concept-repository.js';
import { Result, Ok, Err } from '../functional/result.js';
import { HybridSearchService } from '../interfaces/services/hybrid-search-service.js';
import { calculateNameScore, calculateHybridScore } from '../../infrastructure/search/scoring-strategies.js';

/**
 * Parameters for fuzzy concept search.
 */
export interface FuzzyConceptSearchParams {
  /** Search query text */
  text: string;
  
  /** Maximum results to return */
  limit: number;
  
  /** Enable debug output */
  debug?: boolean;
}

/**
 * Result of a fuzzy concept search.
 */
export interface FuzzyConceptSearchResult {
  /** Concept ID (hash-based) */
  id: number;
  
  /** Concept name */
  concept: string;
  
  /** Concept summary (searched field) */
  summary: string;
  
  /** Number of documents containing this concept */
  documentCount: number;
  
  /** Number of chunks containing this concept */
  chunkCount: number;
  
  /** Related concept names */
  relatedConcepts: string[];
  
  /** Synonyms */
  synonyms: string[];
  
  /** Importance weight */
  weight: number;
  
  /** Hybrid search score */
  hybridScore: number;
  
  /** Vector similarity score */
  vectorScore: number;
  
  /** BM25 keyword score */
  bm25Score: number;
  
  /** Title/name matching score */
  titleScore: number;
}

/**
 * Search error types
 */
export type FuzzySearchError =
  | { type: 'validation'; field: string; message: string }
  | { type: 'database'; message: string }
  | { type: 'empty_results'; query: string }
  | { type: 'unknown'; message: string };

/**
 * Fuzzy concept search service with Result-based error handling.
 * 
 * Searches concept summaries using the same hybrid search mechanism
 * as catalog_search, providing semantic + keyword matching.
 */
export class FuzzyConceptSearchService {
  constructor(
    private conceptRepo: ConceptRepository,
    private hybridSearchService: HybridSearchService
  ) {}
  
  /**
   * Search concepts by their summary using hybrid search.
   * 
   * @param params - Search parameters
   * @returns Result containing concept search results or error
   */
  async searchConcepts(
    params: Partial<FuzzyConceptSearchParams>
  ): Promise<Result<FuzzyConceptSearchResult[], FuzzySearchError>> {
    // Validate parameters
    if (!params.text || params.text.trim() === '') {
      return Err({
        type: 'validation',
        field: 'text',
        message: 'Search query text is required'
      });
    }
    
    const text = params.text.trim();
    const limit = params.limit || 10;
    const debug = params.debug || false;
    
    try {
      // Get the concepts table from repository
      // We need to access the underlying table for hybrid search
      const conceptsTable = (this.conceptRepo as any).conceptsTable;
      
      if (!conceptsTable) {
        return Err({
          type: 'database',
          message: 'Concepts table not available'
        });
      }
      
      // Create adapter for hybrid search
      const { SearchableCollectionAdapter } = await import('../../infrastructure/lancedb/searchable-collection-adapter.js');
      const collection = new SearchableCollectionAdapter(conceptsTable, 'concepts');
      
      // Perform hybrid search
      const rawResults = await this.hybridSearchService.search(
        collection,
        text,
        limit,
        debug
      );
      
      // Map results to ConceptSearchResult format
      // Recalculate name-based scoring (instead of title-based)
      const queryTerms = text.toLowerCase().split(/\s+/).filter(t => t.length > 0);
      
      const results: FuzzyConceptSearchResult[] = rawResults.map((row: any) => {
        // Parse array fields (handle Arrow Vectors and JSON strings)
        const parseArrayField = (value: any): any[] => {
          if (!value) return [];
          if (Array.isArray(value)) return value;
          if (typeof value === 'object' && 'toArray' in value) {
            return Array.from(value.toArray());
          }
          if (typeof value === 'string') {
            try { return JSON.parse(value); } catch { return []; }
          }
          return [];
        };
        
        const catalogIds = parseArrayField(row.catalog_ids);
        const chunkIds = parseArrayField(row.chunk_ids);
        const relatedConcepts = parseArrayField(row.related_concepts);
        const synonyms = parseArrayField(row.synonyms);
        
        // Get concept name (may be in 'concept' or 'text' field depending on how LanceDB returns it)
        const conceptName = row.concept || '';
        
        // Recalculate name score (replaces title score for concepts)
        const nameScore = calculateNameScore(queryTerms, conceptName);
        
        // Recalculate hybrid score with name-based matching
        const vectorScore = row.vectorScore || 0;
        const bm25Score = row.bm25Score || 0;
        const conceptScore = row.conceptScore || 0;
        const wordnetScore = row.wordnetScore || 0;
        
        const hybridScore = calculateHybridScore({
          vectorScore,
          bm25Score,
          titleScore: nameScore,  // Use name score in place of title score
          conceptScore,
          wordnetScore
        });
        
        return {
          id: row.id || 0,
          concept: conceptName,
          summary: row.summary || row.text || '',
          documentCount: catalogIds.filter((id: number) => id !== 0).length,
          chunkCount: chunkIds.filter((id: number) => id !== 0).length,
          relatedConcepts,
          synonyms,
          weight: row.weight || 0,
          hybridScore,
          vectorScore,
          bm25Score,
          titleScore: nameScore  // This is actually the name score
        };
      });
      
      // Re-sort by new hybrid score
      results.sort((a, b) => b.hybridScore - a.hybridScore);
      
      return Ok(results);
    } catch (error) {
      if (error instanceof Error) {
        if (error.constructor.name === 'DatabaseError') {
          return Err({
            type: 'database',
            message: error.message
          });
        }
      }
      
      return Err({
        type: 'unknown',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }
}

