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
import { EmbeddingService } from '../interfaces/services/embedding-service.js';
import { 
  calculateVectorScore,
  calculateWeightedBM25,
  calculateNameScore, 
  calculateWordNetBonus,
  calculateHybridScore 
} from '../../infrastructure/search/scoring-strategies.js';
import { QueryExpander } from '../../concepts/query_expander.js';

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
  
  /** Name matching score (concept name vs query) */
  nameScore: number;
  
  /** WordNet expansion score */
  wordnetScore: number;
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
 * Searches concept summaries using hybrid search with concept-specific
 * scoring (name matching instead of title matching).
 */
export class FuzzyConceptSearchService {
  constructor(
    private conceptRepo: ConceptRepository,
    private embeddingService: EmbeddingService,
    private queryExpander: QueryExpander
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
      const conceptsTable = (this.conceptRepo as any).conceptsTable;
      
      if (!conceptsTable) {
        return Err({
          type: 'database',
          message: 'Concepts table not available'
        });
      }
      
      // Step 1: Expand query with WordNet synonyms
      const expanded = await this.queryExpander.expandQuery(text);
      
      if (debug) {
        console.error('\n🔍 Query Expansion:');
        console.error('  Original:', expanded.original_terms.join(', '));
        console.error('  + Corpus:', expanded.corpus_terms.slice(0, 5).join(', '));
        console.error('  + WordNet:', expanded.wordnet_terms.slice(0, 5).join(', '));
      }
      
      // Step 2: Generate query embedding and perform vector search
      const queryVector = this.embeddingService.generateEmbedding(text);
      const vectorResults = await conceptsTable
        .vectorSearch(queryVector)
        .limit(limit * 3)  // Get 3x results for reranking
        .toArray();
      
      // Step 3: Score each result with concept-specific signals
      const results: FuzzyConceptSearchResult[] = vectorResults.map((row: any) => {
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
        
        // Get concept name and summary
        const conceptName = row.concept || '';
        const summary = row.summary || '';
        
        // Calculate individual scores using concept-specific fields
        const vectorScore = calculateVectorScore(row._distance || 0);
        
        // BM25: search in summary (the main text content for concepts)
        const bm25Score = calculateWeightedBM25(
          expanded.all_terms,
          expanded.weights,
          summary,  // Use summary instead of text
          conceptName  // Use concept name instead of source
        );
        
        // Name score: boost concepts whose names match query
        const nameScore = calculateNameScore(expanded.original_terms, conceptName);
        
        // WordNet: check if synonyms appear in summary
        const wordnetScore = calculateWordNetBonus(expanded.wordnet_terms, summary);
        
        // Calculate hybrid score (name replaces title)
        const hybridScore = calculateHybridScore({
          vectorScore,
          bm25Score,
          titleScore: nameScore,  // Use name score in place of title
          conceptScore: 0,  // Not applicable for concept search
          wordnetScore
        });
        
        return {
          id: row.id || 0,
          concept: conceptName,
          summary,
          documentCount: catalogIds.filter((id: number) => id !== 0).length,
          chunkCount: chunkIds.filter((id: number) => id !== 0).length,
          relatedConcepts,
          synonyms,
          weight: row.weight || 0,
          hybridScore,
          vectorScore,
          bm25Score,
          nameScore,
          wordnetScore
        };
      });
      
      // Step 4: Re-sort by hybrid score
      results.sort((a, b) => b.hybridScore - a.hybridScore);
      
      // Step 5: Limit to requested size
      const finalResults = results.slice(0, limit);
      
      if (debug) {
        console.error('\n📊 Top Concept Results:\n');
        finalResults.forEach((r, idx) => {
          console.error(`${idx + 1}. ${r.concept}`);
          console.error(`   Vector: ${r.vectorScore.toFixed(3)}`);
          console.error(`   BM25: ${r.bm25Score.toFixed(3)}`);
          console.error(`   Name: ${r.nameScore.toFixed(3)}`);
          console.error(`   WordNet: ${r.wordnetScore.toFixed(3)}`);
          console.error(`   ➜ Hybrid: ${r.hybridScore.toFixed(3)}`);
          console.error();
        });
      }
      
      return Ok(finalResults);
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
