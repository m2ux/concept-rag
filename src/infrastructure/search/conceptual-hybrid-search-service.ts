import { HybridSearchService, SearchableCollection } from '../../domain/interfaces/services/hybrid-search-service.js';
import { EmbeddingService } from '../../domain/interfaces/services/embedding-service.js';
import { SearchResult } from '../../domain/models/search-result.js';
import { QueryExpander } from '../../concepts/query_expander.js';
import type { ResilientExecutor } from '../resilience/resilient-executor.js';
import { ResilienceProfiles } from '../resilience/resilient-executor.js';
import { SearchResultCache } from '../cache/search-result-cache.js';
import {
  calculateVectorScore,
  calculateWeightedBM25,
  calculateTitleScore,
  calculateWordNetBonus,
  calculateConceptMatchScore,
  getMatchedConcepts,
  type ExpandedQuery
} from './scoring-strategies.js';
import {
  analyzeQuery,
  getAdjustedCatalogWeights,
  getAdjustedChunkWeights,
  calculateDynamicHybridScore,
  type QueryAnalysis
} from './dynamic-weights.js';

/**
 * Hybrid search implementation using multiple ranking signals.
 * 
 * Combines:
 * - Vector similarity (semantic search via embeddings)
 * - BM25 keyword matching (lexical search)
 * - Title matching (document relevance)
 * - Concept matching (concept-aware scoring via QueryExpander)
 * - WordNet expansion (semantic enrichment)
 * 
 * The QueryExpander provides concept_terms derived from hybrid concept search,
 * enabling unified concept-aware searching across all search types.
 * 
 * This service orchestrates query expansion, vector search, and multi-signal
 * scoring to provide high-quality search results.
 * 
 * **Resilience:** When ResilientExecutor is provided, search operations are
 * protected with timeout (5s) and bulkhead (15 concurrent max).
 * 
 * **Caching:**
 * Optionally uses SearchResultCache to avoid redundant searches.
 * Cache key includes collection name to prevent cross-collection pollution.
 */
export class ConceptualHybridSearchService implements HybridSearchService {
  /** Optional search result cache */
  private cache?: SearchResultCache<SearchResult[]>;
  
  constructor(
    private embeddingService: EmbeddingService,
    private queryExpander: QueryExpander,
    cache?: SearchResultCache<SearchResult[]>,
    private resilientExecutor?: ResilientExecutor
  ) {
    this.cache = cache;
  }

  async search(
    collection: SearchableCollection,
    queryText: string,
    limit: number = 5,
    debug: boolean = false
  ): Promise<SearchResult[]> {
    // Check cache first (if enabled and not in debug mode)
    if (this.cache && !debug) {
      const cacheKey = `${collection.getName()}:${queryText}`;
      const cached = this.cache.get(cacheKey, { limit });
      if (cached) {
        return cached;
      }
    }
    
    // Wrap search operation with resilience if available
    if (this.resilientExecutor) {
      return this.resilientExecutor.execute(
        () => this.performSearch(collection, queryText, limit, debug),
        {
          ...ResilienceProfiles.SEARCH,
          name: 'hybrid_search'
        }
      );
    }
    
    // Fallback: execute without resilience (backward compatible)
    return this.performSearch(collection, queryText, limit, debug);
  }
  
  /**
   * Core search implementation (can be wrapped with resilience).
   * @private
   */
  private async performSearch(
    collection: SearchableCollection,
    queryText: string,
    limit: number,
    debug: boolean
  ): Promise<SearchResult[]> {
    // Step 1: Expand query with corpus concepts and WordNet synonyms
    const expanded = await this.queryExpander.expandQuery(queryText);
    
    // Step 1.5: Analyze query for dynamic weight adjustment
    const queryAnalysis = analyzeQuery(expanded);
    const collectionName = collection.getName().toLowerCase();
    const isChunkSearch = collectionName.includes('chunk');
    
    // Get adjusted weights based on query characteristics
    const weights = isChunkSearch
      ? getAdjustedChunkWeights(queryAnalysis)
      : getAdjustedCatalogWeights(queryAnalysis);
    
    if (debug) {
      this.printQueryExpansion(expanded);
      this.printWeightAdjustment(queryAnalysis, weights);
    }
    
    // Step 2: Generate query embedding and perform vector search
    const queryVector = this.embeddingService.generateEmbedding(queryText);
    const vectorResults = await collection.vectorSearch(queryVector, limit * 3);  // Get 3x results for reranking
    
    // Step 3: Score each result with all ranking signals
    const scoredResults = vectorResults.map((row: any) => {
      // Get searchable text (chunks use 'text', catalog uses 'summary')
      const searchableText = row.text || row.summary || '';
      
      // Parse string array fields (for derived text fields) - needed early for concept scoring
      const parseStringArrayField = (value: any): string[] => {
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
      
      // Calculate individual scores
      const vectorScore = calculateVectorScore(row._distance || 0);
      // For BM25 and title scoring, use source (catalog) or catalog_title (chunks)
      const sourceOrTitle = row.source || row.catalog_title || '';
      const bm25Score = calculateWeightedBM25(
        expanded.all_terms,
        expanded.weights,
        searchableText,
        sourceOrTitle
      );
      const titleScore = calculateTitleScore(expanded.original_terms, sourceOrTitle);
      
      // Calculate concept score using expanded concept terms
      const docConceptNames = parseStringArrayField(row.concept_names);
      const conceptScore = calculateConceptMatchScore(expanded.concept_terms, docConceptNames);
      
      const wordnetScore = calculateWordNetBonus(expanded.wordnet_terms, searchableText);
      
      // Calculate hybrid score using dynamic weights (adjusted based on query characteristics)
      const hybridScore = calculateDynamicHybridScore(
        { vectorScore, bm25Score, titleScore, conceptScore, wordnetScore },
        weights
      );
      
      // Parse array fields (may be Arrow Vectors from LanceDB)
      const parseArrayField = (value: any): number[] => {
        if (!value) return [];
        if (Array.isArray(value)) return value;
        if (typeof value === 'object' && 'toArray' in value) {
          return Array.from(value.toArray());
        }
        return [];
      };
      
      // Build enriched search result
      // For chunks: use catalog_title (source field was removed in v7 schema)
      // For catalog: use source (document path)
      const sourceValue = row.source || row.catalog_title || '';
      
      const result: SearchResult = {
        id: row.id || '',
        text: searchableText,  // Use text for chunks, summary for catalog
        source: sourceValue,  // Source document path or catalog_title for chunks
        catalogId: row.catalog_id || row.id || 0,
        hash: row.hash || '',
        conceptIds: parseArrayField(row.concept_ids),
        conceptNames: parseStringArrayField(row.concept_names),  // DERIVED: for display
        categoryIds: parseArrayField(row.category_ids),
        categoryNames: parseStringArrayField(row.category_names),  // DERIVED: for display
        embeddings: row.vector || [],
        distance: row._distance || 0,
        vectorScore,
        bm25Score,
        titleScore,
        conceptScore,
        wordnetScore,
        hybridScore,
        matchedConcepts: getMatchedConcepts(expanded, row),
        expandedTerms: expanded.all_terms.slice(0, 10)  // Top 10 terms
      };
      
      return result;
    });
    
    // Step 4: Re-rank by hybrid score
    scoredResults.sort((a, b) => b.hybridScore - a.hybridScore);
    
    // Step 5: Limit to requested size
    const finalResults = scoredResults.slice(0, limit);
    
    if (debug) {
      this.printDebugScores(finalResults);
    }
    
    // Cache results (if enabled and not in debug mode)
    if (this.cache && !debug) {
      const cacheKey = `${collection.getName()}:${queryText}`;
      this.cache.set(cacheKey, { limit }, finalResults);
    }
    
    return finalResults;
  }
  
  // Helper methods
  
  private printQueryExpansion(expanded: ExpandedQuery): void {
    console.error('\n🔍 Query Expansion:');
    console.error('  Original:', expanded.original_terms.join(', '));
    console.error('  + Corpus:', expanded.corpus_terms.slice(0, 5).join(', '));
    console.error('  + Concepts:', expanded.concept_terms.slice(0, 5).join(', '));
    console.error('  + WordNet:', expanded.wordnet_terms.slice(0, 5).join(', '));
    console.error('  Total terms:', expanded.all_terms.length);
  }
  
  private printDebugScores(results: SearchResult[]): void {
    console.error('\n📊 Top Results with Scores:\n');
    results.forEach((result, idx) => {
      const filename = (result.source || '').split('/').pop() || result.source || 'unknown';
      console.error(`${idx + 1}. ${filename}`);
      console.error(`   Vector: ${result.vectorScore.toFixed(3)}`);
      console.error(`   BM25: ${result.bm25Score.toFixed(3)}`);
      console.error(`   Title: ${result.titleScore.toFixed(3)}`);
      console.error(`   Concept: ${result.conceptScore.toFixed(3)}`);
      console.error(`   WordNet: ${result.wordnetScore.toFixed(3)}`);
      console.error(`   ➜ Hybrid: ${result.hybridScore.toFixed(3)}`);
      if (result.matchedConcepts && result.matchedConcepts.length > 0) {
        console.error(`   Matched: ${result.matchedConcepts.slice(0, 3).join(', ')}`);
      }
      console.error();
    });
  }
  
  private printWeightAdjustment(analysis: QueryAnalysis, weights: { wordnetWeight: number }): void {
    if (analysis.wordnetBoostFactor !== 1.0) {
      console.error('\n⚖️  Dynamic Weight Adjustment:');
      console.error(`   Reason: ${analysis.boostReason}`);
      console.error(`   WordNet boost: ${analysis.wordnetBoostFactor.toFixed(2)}x → weight: ${(weights.wordnetWeight * 100).toFixed(1)}%`);
    }
  }
}

