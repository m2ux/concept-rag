/**
 * Result-Based Concept Search Service
 * 
 * This service provides functional error handling for concept search operations
 * using Result types instead of exceptions. It complements the exception-based
 * ConceptSearchService for callers who prefer functional composition.
 * 
 * **Use this when you want to:**
 * - Compose search operations functionally
 * - Handle errors explicitly without try-catch
 * - Use railway patterns (retry, fallback, etc.)
 */

import { ChunkRepository } from '../interfaces/repositories/chunk-repository.js';
import { ConceptRepository } from '../interfaces/repositories/concept-repository.js';
import { Chunk, Concept } from '../models/index.js';
import { Result, Ok, Err } from '../functional/result.js';
import { foldOption } from '../functional/index.js';
import { InputValidator } from './validation/InputValidator.js';

/**
 * Parameters for concept search.
 */
export interface ConceptSearchParams {
  /** Concept name to search for */
  concept: string;
  
  /** Maximum results to return */
  limit: number;
  
  /** Optional source filter */
  sourceFilter?: string;
  
  /** Sort strategy */
  sortBy?: 'density' | 'relevance' | 'source';
}

/**
 * Concept search result with metadata.
 */
export interface ConceptSearchResult {
  concept: string;
  // @ts-expect-error - Type narrowing limitation
  conceptMetadata: Option<Concept>;
  chunks: Chunk[];
  relatedConcepts: string[];
  totalFound: number;
}

/**
 * Search error types
 */
export type SearchError =
  | { type: 'validation'; field: string; message: string }
  | { type: 'database'; message: string }
  | { type: 'concept_not_found'; concept: string }
  | { type: 'unknown'; message: string };

/**
 * Concept search service with Result-based error handling.
 * 
 * Returns Result<T, SearchError> instead of throwing exceptions,
 * enabling functional composition and explicit error handling.
 */
export class ConceptSearchService {
  private validator = new InputValidator();
  
  constructor(
    private chunkRepo: ChunkRepository,
    private conceptRepo: ConceptRepository
  ) {}
  
  /**
   * Search for chunks tagged with a specific concept.
   * 
   * @param params - Search parameters
   * @returns Result containing concept search results or error
   * 
   * @example
   * ```typescript
   * const result = await service.searchConcept({
   *   concept: 'dependency injection',
   *   limit: 10,
   *   sortBy: 'density'
   * });
   * 
   * if (result.ok) {
   *   console.log('Found:', result.value.chunks.length, 'chunks');
   * } else {
   *   console.error('Error:', result.error);
   * }
   * ```
   * 
   * @example With Railway Pattern
   * ```typescript
   * const result = await pipe(
   *   () => service.searchConcept({ concept: 'ddd', limit: 10 }),
   *   async (searchResult) => enrichChunks(searchResult.chunks),
   *   async (enriched) => formatOutput(enriched)
   * )();
   * ```
   */
  async searchConcept(
    params: Partial<ConceptSearchParams>
  ): Promise<Result<ConceptSearchResult, SearchError>> {
    // Validate parameters
    try {
      this.validator.validateConceptSearch(params);
    } catch (error) {
      return Err({
        type: 'validation',
        field: 'params',
        message: error instanceof Error ? error.message : String(error)
      });
    }
    
    const validParams = params as ConceptSearchParams;
    const conceptLower = validParams.concept.toLowerCase().trim();
    
    try {
      // Get concept metadata using Option for type-safe nullable handling
      // @ts-expect-error - Type narrowing limitation
      const conceptMetadataOpt: Option<Concept> = 
        await this.conceptRepo.findByName(conceptLower);
      
      // Find matching chunks
      const candidateChunks = await this.chunkRepo.findByConceptName(
        conceptLower,
        validParams.limit * 2
      );
      
      const totalFound = candidateChunks.length;
      
      // Apply source filter if provided
      let filteredChunks = candidateChunks;
      if (validParams.sourceFilter) {
        const filterLower = validParams.sourceFilter.toLowerCase();
        filteredChunks = candidateChunks.filter(chunk =>
          (chunk.source || '').toLowerCase().includes(filterLower)
        );
      }
      
      // Sort results
      const sortedChunks = this.sortChunks(
        filteredChunks,
        validParams.sortBy || 'density',
        conceptLower
      );
      
      // Limit results
      const limitedChunks = sortedChunks.slice(0, validParams.limit);
      
      // Extract related concepts using Option composition
      const relatedConcepts = foldOption(
        conceptMetadataOpt,
        () => [],
        // @ts-expect-error - Type narrowing limitation
        (concept) => concept.relatedConcepts?.slice(0, 10) || []
      );
      
      return Ok({
        concept: validParams.concept,
        conceptMetadata: conceptMetadataOpt,
        chunks: limitedChunks,
        relatedConcepts,
        totalFound
      });
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
  
  /**
   * Sort chunks according to specified strategy.
   */
  private sortChunks(
    chunks: Chunk[],
    sortBy: 'density' | 'relevance' | 'source',
    concept: string
  ): Chunk[] {
    const sorted = [...chunks];
    
    switch (sortBy) {
      case 'density':
        // Sort by concept count as proxy for density (since conceptDensity removed)
        return sorted.sort((a, b) => 
          (b.concepts?.length || 0) - (a.concepts?.length || 0)
        );
      
      case 'relevance':
        return sorted.sort((a, b) => {
          const relA = this.calculateRelevance(a, concept);
          const relB = this.calculateRelevance(b, concept);
          return relB - relA;
        });
      
      case 'source':
        return sorted.sort((a, b) => 
          (a.source || '').localeCompare(b.source || '')
        );
      
      default:
        return sorted;
    }
  }
  
  /**
   * Calculate relevance score for a chunk.
   */
  /** @internal - Exposed for testing */
  calculateRelevance(chunk: Chunk, concept: string): number {
    let score = 0;
    
    // Concept count score (normalized by text length as proxy for density)
    const conceptCount = chunk.concepts?.length || 0;
    const textLength = chunk.text.length;
    const normalizedDensity = textLength > 0 ? Math.min(conceptCount / (textLength / 500), 1) : 0;
    score += normalizedDensity * 0.5;
    
    // Concept appears in chunk
    if (chunk.concepts?.includes(concept)) {
      score += 0.3;
    }
    
    // Text length (prefer substantial chunks)
    if (textLength > 200 && textLength < 2000) {
      score += 0.2;
    }
    
    return score;
  }
}

