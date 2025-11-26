import * as lancedb from "@lancedb/lancedb";
import { CatalogRepository } from '../../../domain/interfaces/repositories/catalog-repository.js';
import { SearchQuery, SearchResult } from '../../../domain/models/index.js';
import { HybridSearchService } from '../../../domain/interfaces/services/hybrid-search-service.js';
import { SearchableCollectionAdapter } from '../searchable-collection-adapter.js';
import { DatabaseError, RecordNotFoundError } from '../../../domain/exceptions/index.js';
// @ts-expect-error - Type narrowing limitation
import type { Option } from "../../../../__tests__/test-helpers/../../domain/functional/index.js";
import { fromNullable, Some, None, isSome } from '../../../domain/functional/option.js';
import { hashToId } from '../../utils/hash.js';

/**
 * LanceDB implementation of CatalogRepository
 * 
 * Uses HybridSearchService for multi-signal ranking:
 * - Vector similarity (semantic understanding)
 * - BM25 (keyword matching)
 * - Title matching (document relevance)
 * - Concept alignment
 * - WordNet expansion
 */
export class LanceDBCatalogRepository implements CatalogRepository {
  constructor(
    private catalogTable: lancedb.Table,
    private hybridSearchService: HybridSearchService
  ) {}
  
  /**
   * Search the catalog using hybrid search.
   * @param query - Search query parameters
   * @returns Array of search results
   * @throws {DatabaseError} If database query fails
   * @throws {SearchError} If search operation fails
   */
  async search(query: SearchQuery): Promise<SearchResult[]> {
    try {
      // Use hybrid search for comprehensive multi-signal ranking
      const limit = query.limit || 5;
      const debug = query.debug || false;
      
      // Wrap table in adapter to prevent infrastructure leakage
      const collection = new SearchableCollectionAdapter(this.catalogTable, 'catalog');
      
      return await this.hybridSearchService.search(
        collection,
        query.text,
        limit,
        debug
      );
    } catch (error) {
      throw new DatabaseError(
        `Failed to search catalog with query "${query.text}"`,
        'search',
        error as Error
      );
    }
  }
  
  /**
   * Find a catalog entry by source path.
   * Uses hash-based ID lookup for reliability with special characters.
   * @param source - Source document path
   * @returns Some(result) if found, None otherwise
   * @throws {DatabaseError} If database query fails
   */
  async findBySource(source: string): Promise<Option<SearchResult>> {
    try {
      // Use hash-based ID lookup (more reliable than string matching with special chars)
      const sourceId = hashToId(source);
      
      const results = await this.catalogTable
        .query()
        .where(`id = ${sourceId}`)
        .limit(1)
        .toArray();
      
      // If hash lookup fails, try loading all and filtering (fallback for legacy data)
      if (results.length === 0) {
        const allDocs = await this.catalogTable.query().limit(10000).toArray();
        const matchingDoc = allDocs.find((doc: any) => doc.source === source);
        
        if (!matchingDoc) {
          return None();
        }
        
        return Some(this.docToSearchResult(matchingDoc));
      }
      
      return Some(this.docToSearchResult(results[0]));
    } catch (error) {
      throw new DatabaseError(
        `Failed to find catalog entry for source "${source}"`,
        'query',
        error as Error
      );
    }
  }
  
  /**
   * Convert a raw document row to SearchResult format.
   */
  private docToSearchResult(doc: any): SearchResult {
    return {
      id: doc.id,
      text: doc.text,
      source: doc.source,
      hash: doc.hash,
      concepts: this.parseConceptsField(doc),
      embeddings: doc.vector || [],
      distance: 0,
      hybridScore: 1.0,
      vectorScore: 0,
      bm25Score: 0,
      titleScore: 1.0,
      conceptScore: 0,
      wordnetScore: 0
    };
  }
  
  /**
   * Find documents by category ID.
   * @param categoryId - Category ID
   * @returns Array of documents in the category
   * @throws {DatabaseError} If database query fails
   */
  async findByCategory(categoryId: number): Promise<SearchResult[]> {
    try {
      // Query all catalog entries and filter by category_ids
      // Note: LanceDB query() has default limit of 10, so we need explicit high limit
      const allDocs = await this.catalogTable.query().limit(10000).toArray();
      
      const matches = allDocs.filter((doc: any) => {
        if (!doc.category_ids) return false;
        
        try {
          const categoryIds: number[] = JSON.parse(doc.category_ids);
          return categoryIds.includes(categoryId);
        } catch {
          return false;
        }
      });
      
      // Convert to SearchResult format (simplified - no scoring for direct category match)
      return matches.map((doc: any) => ({
        id: doc.id,
        text: doc.text,
        source: doc.source,
        hash: doc.hash,
        concepts: this.parseConceptsField(doc),
        embeddings: doc.vector || [],
        distance: 0, // Not a vector search
        hybridScore: 1.0, // Direct match, no ranking needed
        vectorScore: 0,
        bm25Score: 0,
        titleScore: 1.0, // Direct category match
        conceptScore: 0,
        wordnetScore: 0
      }));
    } catch (error) {
      throw new DatabaseError(
        `Failed to find documents in category ${categoryId}`,
        'query',
        error as Error
      );
    }
  }
  
  /**
   * Get all unique concept IDs in a category.
   * @param categoryId - Category ID
   * @returns Array of concept IDs
   * @throws {DatabaseError} If database query fails
   */
  async getConceptsInCategory(categoryId: number): Promise<number[]> {
    try {
      // Step 1: Find all documents in this category
      const docs = await this.findByCategory(categoryId);
      
      // Step 2: Aggregate unique concepts from these documents
      const uniqueConceptIds = new Set<number>();
      const uniqueConceptNames = new Set<string>();
      
      for (const doc of docs) {
        // Fetch full document data to access concept fields
        const docData = await this.catalogTable.query()
          .where(`id = '${doc.id}'`)
          .limit(1)
          .toArray();
        
        if (docData.length === 0) continue;
        const row = docData[0];
        
        // NEW FORMAT: concept_ids field (hash-based integer IDs)
        if (row.concept_ids) {
          try {
            const conceptIds: number[] = JSON.parse(row.concept_ids);
            conceptIds.forEach(id => uniqueConceptIds.add(id));
          } catch {
            // Skip malformed data
          }
        }
        // OLD FORMAT: concepts field with primary_concepts array (concept names)
        else if (row.concepts) {
          try {
            const concepts = JSON.parse(row.concepts);
            const conceptNames = concepts.primary_concepts || [];
            
            // Convert concept names to hash-based IDs
            conceptNames.forEach((name: string) => {
              const conceptId = this.hashConceptName(name);
              uniqueConceptIds.add(conceptId);
              uniqueConceptNames.add(name);
            });
          } catch {
            // Skip malformed data
          }
        }
      }
      
      return Array.from(uniqueConceptIds);
    } catch (error) {
      // If it's already a DatabaseError from findByCategory, re-throw
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        `Failed to get concepts in category ${categoryId}`,
        'query',
        error as Error
      );
    }
  }
  
  /**
   * Generate hash ID for concept name (fallback when ConceptIdCache not available)
   */
  private hashConceptName(name: string): number {
    // Simple FNV-1a hash (same algorithm as in hash utility)
    let hash = 2166136261;
    for (let i = 0; i < name.length; i++) {
      hash ^= name.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }
  
  private parseConceptsField(doc: any): any {
    // Helper to parse the concepts field (handles both old and new formats)
    if (doc.concepts) {
      try {
        return JSON.parse(doc.concepts);
      } catch {
        return { primary_concepts: [], technical_terms: [], categories: [] };
      }
    }
    return { primary_concepts: [], technical_terms: [], categories: [] };
  }
}

