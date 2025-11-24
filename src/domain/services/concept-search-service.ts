/**
 * Domain service for concept-based search operations.
 * 
 * This service encapsulates the business logic for searching concepts,
 * including filtering, sorting, and result formatting. It keeps the tool
 * layer thin and focused on MCP protocol adaptation.
 * 
 * **Design Pattern**: Domain Service
 * - Orchestrates operations across repositories
 * - Contains business rules (filtering, sorting)
 * - Returns domain models, not protocol-specific formats
 * 
 * **Benefits**:
 * - Business logic is testable independently of MCP
 * - Can be reused across different UI/protocol layers
 * - Clear separation between domain logic and transport
 * 
 * @example
 * ```typescript
 * const service = new ConceptSearchService(chunkRepo, conceptRepo);
 * 
 * const result = await service.searchConcept({
 *   concept: 'clean architecture',
 *   limit: 10,
 *   sourceFilter: 'programming',
 *   sortBy: 'density'
 * });
 * 
 * console.log(`Found ${result.chunks.length} chunks`);
 * console.log(`Related concepts: ${result.relatedConcepts.join(', ')}`);
 * ```
 */

import { ChunkRepository } from '../interfaces/repositories/chunk-repository.js';
import { ConceptRepository } from '../interfaces/repositories/concept-repository.js';
import { Chunk, Concept } from '../models/index.js';
import { Option, foldOption, toNullable } from '../functional/index.js';

/**
 * Parameters for concept search operations.
 */
export interface ConceptSearchParams {
  /** The concept to search for (case-insensitive) */
  concept: string;
  
  /** Maximum number of results to return */
  limit: number;
  
  /** Optional filter for source documents (substring match) */
  sourceFilter?: string;
  
  /** Sort strategy for results */
  sortBy?: 'density' | 'relevance' | 'source';
}

/**
 * Result of a concept search operation.
 */
export interface ConceptSearchResult {
  /** The concept that was searched */
  concept: string;
  
  /** Concept metadata (None if concept not found) */
  conceptMetadata: Option<Concept>;
  
  /** Matching chunks */
  chunks: Chunk[];
  
  /** Related concepts (empty if concept not found) */
  relatedConcepts: string[];
  
  /** Total chunks found before limiting */
  totalFound: number;
}

/**
 * Domain service for concept search operations.
 * 
 * Handles the business logic of:
 * - Finding concept metadata
 * - Searching for chunks containing the concept
 * - Filtering by source
 * - Sorting results
 * - Calculating relevance scores
 */
export class ConceptSearchService {
  constructor(
    private chunkRepo: ChunkRepository,
    private conceptRepo: ConceptRepository
  ) {}
  
  /**
   * Search for chunks containing a specific concept.
   * 
   * **Business Rules**:
   * - Concept names are case-insensitive
   * - Source filter uses substring matching
   * - Results sorted by concept density by default
   * - Returns up to `limit` chunks
   * - Includes related concepts if concept exists
   * 
   * @param params - Search parameters
   * @returns Search result with chunks and metadata
   * @throws {DatabaseError} If database query fails
   * @throws {SearchError} If search operation fails
   * 
   * @example
   * ```typescript
   * const result = await service.searchConcept({
   *   concept: 'dependency injection',
   *   limit: 10,
   *   sourceFilter: 'typescript',
   *   sortBy: 'density'
   * });
   * ```
   */
  async searchConcept(params: ConceptSearchParams): Promise<ConceptSearchResult> {
    const conceptLower = params.concept.toLowerCase().trim();
    
    // Get concept metadata using Option for type-safe nullable handling
    const conceptMetadataOpt = await this.conceptRepo.findByName(conceptLower);
    
    // Find matching chunks (returns empty array if concept not found)
    // Request extra to allow for filtering
    const candidateChunks = await this.chunkRepo.findByConceptName(
      conceptLower,
      params.limit * 2
    );
    
    const totalFound = candidateChunks.length;
    
    // Apply source filter if provided
    let filteredChunks = candidateChunks;
    if (params.sourceFilter) {
      const filterLower = params.sourceFilter.toLowerCase();
      filteredChunks = candidateChunks.filter(chunk =>
        chunk.source.toLowerCase().includes(filterLower)
      );
    }
    
    // Sort results
    const sortedChunks = this.sortChunks(filteredChunks, params.sortBy || 'density', conceptLower);
    
    // Limit results
    const limitedChunks = sortedChunks.slice(0, params.limit);
    
    // Extract related concepts using Option composition
    const relatedConcepts = foldOption(
      conceptMetadataOpt,
      () => [],  // None: return empty array
      (concept) => concept.relatedConcepts?.slice(0, 10) || []  // Some: extract related
    );
    
    return {
      concept: params.concept,
      conceptMetadata: conceptMetadataOpt,
      chunks: limitedChunks,
      relatedConcepts,
      totalFound
    };
  }
  
  /**
   * Sort chunks according to specified strategy.
   * 
   * @param chunks - Chunks to sort
   * @param sortBy - Sort strategy
   * @param concept - Concept name for relevance calculation
   * @returns Sorted chunks (new array)
   */
  private sortChunks(chunks: Chunk[], sortBy: string, concept: string): Chunk[] {
    const sorted = [...chunks];  // Don't mutate input
    
    switch (sortBy) {
      case 'density':
        // Sort by concept density (high to low)
        sorted.sort((a, b) => (b.conceptDensity || 0) - (a.conceptDensity || 0));
        break;
        
      case 'relevance':
        // Sort by number of times concept appears in chunk
        sorted.sort((a, b) => {
          const aCount = this.countConceptOccurrences(a, concept);
          const bCount = this.countConceptOccurrences(b, concept);
          return bCount - aCount;
        });
        break;
        
      case 'source':
        // Sort alphabetically by source
        sorted.sort((a, b) => a.source.localeCompare(b.source));
        break;
        
      default:
        // Default to density
        sorted.sort((a, b) => (b.conceptDensity || 0) - (a.conceptDensity || 0));
    }
    
    return sorted;
  }
  
  /**
   * Count how many times a concept appears in a chunk's concept list.
   * 
   * @param chunk - Chunk to examine
   * @param concept - Concept to count (case-insensitive)
   * @returns Number of occurrences
   */
  private countConceptOccurrences(chunk: Chunk, concept: string): number {
    if (!chunk.concepts || !Array.isArray(chunk.concepts)) {
      return 0;
    }
    
    const conceptLower = concept.toLowerCase();
    return chunk.concepts.filter((c: string) =>
      c.toLowerCase() === conceptLower
    ).length;
  }
  
  /**
   * Calculate relevance score for a chunk relative to a concept.
   * 
   * Combines:
   * - Concept density (0-1)
   * - Occurrence count (normalized)
   * 
   * @param chunk - Chunk to score
   * @param concept - Target concept
   * @returns Relevance score (0-1)
   */
  calculateRelevance(chunk: Chunk, concept: string): number {
    const density = chunk.conceptDensity || 0;
    const occurrences = this.countConceptOccurrences(chunk, concept);
    
    // Normalize occurrences (cap at 5)
    const normalizedOccurrences = Math.min(occurrences / 5, 1);
    
    // Weighted average: 70% density, 30% occurrences
    return density * 0.7 + normalizedOccurrences * 0.3;
  }
}

