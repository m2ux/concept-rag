import * as lancedb from "@lancedb/lancedb";
import { CatalogRepository } from '../../../domain/interfaces/repositories/catalog-repository.js';
import { SearchQuery, SearchResult } from '../../../domain/models/index.js';
import { HybridSearchService } from '../../../domain/interfaces/services/hybrid-search-service.js';
import { SearchableCollectionAdapter } from '../searchable-collection-adapter.js';
import { DatabaseError } from '../../../domain/exceptions/index.js';
// @ts-expect-error - Type narrowing limitation
import type { Option } from "../../../../__tests__/test-helpers/../../domain/functional/index.js";
import { Some, None } from '../../../domain/functional/option.js';
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
   * Find a catalog entry by ID.
   * @param catalogId - Hash-based document ID
   * @returns Some(result) if found, None otherwise
   * @throws {DatabaseError} If database query fails
   */
  async findById(catalogId: number): Promise<Option<SearchResult>> {
    try {
      const results = await this.catalogTable
        .query()
        .where(`id = ${catalogId}`)
        .limit(1)
        .toArray();
      
      if (results.length === 0) {
        return None();
      }
      
      return Some(this.docToSearchResult(results[0]));
    } catch (error) {
      throw new DatabaseError(
        `Failed to find catalog entry for ID ${catalogId}`,
        'query',
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
    // Parse category_ids (native array, Arrow Vector, or JSON string)
    let categoryIds: number[] = [];
    if (doc.category_ids) {
      if (Array.isArray(doc.category_ids)) {
        categoryIds = doc.category_ids;
      } else if (typeof doc.category_ids === 'object' && 'toArray' in doc.category_ids) {
        // Arrow Vector - convert to JavaScript array
        categoryIds = Array.from(doc.category_ids.toArray());
      } else {
        categoryIds = this.parseJsonArray(doc.category_ids);
      }
    }
    
    return {
      id: doc.id,
      catalogId: doc.id,  // For catalog entries, catalogId = id
      text: doc.summary || doc.text || '',  // 'summary' is new field name, 'text' for backward compat
      source: doc.source || doc.filename || '',  // Support both old and new field names
      hash: doc.hash,
      concepts: undefined,  // No longer stored in catalog (derive from chunks if needed)
      categoryIds,
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
   * Parse a JSON array field (handles both native arrays and JSON strings).
   */
  private parseJsonArray(value: any): any[] {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
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
      return matches.map((doc: any) => this.docToSearchResult(doc));
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
   * Note: In the normalized schema, concepts are stored per-chunk, not per-catalog entry.
   * This returns an empty array. Use ChunkRepository to get concepts for documents.
   */
  async getConceptsInCategory(_categoryId: number): Promise<number[]> {
    // Concepts are now derived from chunks, not stored in catalog
    // Return empty array - callers should use chunk-based concept aggregation
    return [];
  }
  
}

