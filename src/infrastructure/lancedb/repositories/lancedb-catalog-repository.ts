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
        const allDocs = await this.catalogTable.query().limit(100000).toArray();
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
    // Parse concept_ids (native array, Arrow Vector, or JSON string)
    let conceptIds: number[] = [];
    if (doc.concept_ids) {
      if (Array.isArray(doc.concept_ids)) {
        conceptIds = doc.concept_ids;
      } else if (typeof doc.concept_ids === 'object' && 'toArray' in doc.concept_ids) {
        // Arrow Vector - convert to JavaScript array
        conceptIds = Array.from(doc.concept_ids.toArray());
      } else if (typeof doc.concept_ids === 'string') {
        conceptIds = this.parseJsonArray(doc.concept_ids);
      }
    }
    
    // Parse category_ids (native array, Arrow Vector, or JSON string)
    let categoryIds: number[] = [];
    if (doc.category_ids) {
      if (Array.isArray(doc.category_ids)) {
        categoryIds = doc.category_ids;
      } else if (typeof doc.category_ids === 'object' && 'toArray' in doc.category_ids) {
        // Arrow Vector - convert to JavaScript array
        categoryIds = Array.from(doc.category_ids.toArray());
      } else if (typeof doc.category_ids === 'string') {
        categoryIds = this.parseJsonArray(doc.category_ids);
      }
    }
    
    // Parse concept_names (DERIVED field for display and text search)
    let conceptNames: string[] | undefined;
    if (doc.concept_names) {
      if (Array.isArray(doc.concept_names)) {
        conceptNames = doc.concept_names;
      } else if (typeof doc.concept_names === 'object' && 'toArray' in doc.concept_names) {
        conceptNames = Array.from(doc.concept_names.toArray());
      } else if (typeof doc.concept_names === 'string') {
        conceptNames = this.parseJsonArray(doc.concept_names);
      }
    }
    
    // Parse category_names (DERIVED field for display and text search)
    let categoryNames: string[] | undefined;
    if (doc.category_names) {
      if (Array.isArray(doc.category_names)) {
        categoryNames = doc.category_names;
      } else if (typeof doc.category_names === 'object' && 'toArray' in doc.category_names) {
        categoryNames = Array.from(doc.category_names.toArray());
      } else if (typeof doc.category_names === 'string') {
        categoryNames = this.parseJsonArray(doc.category_names);
      }
    }
    
    // Parse keywords array (research paper field)
    let keywords: string[] | undefined;
    if (doc.keywords) {
      if (Array.isArray(doc.keywords)) {
        keywords = doc.keywords.filter((k: string) => k && k.trim());
      } else if (typeof doc.keywords === 'object' && 'toArray' in doc.keywords) {
        keywords = (Array.from(doc.keywords.toArray()) as string[]).filter((k: string) => k && k.trim());
      } else if (typeof doc.keywords === 'string') {
        keywords = (this.parseJsonArray(doc.keywords) as string[]).filter((k: string) => k && k.trim());
      }
    }
    
    // Parse authors array (research paper field)
    let authors: string[] | undefined;
    if (doc.authors) {
      if (Array.isArray(doc.authors)) {
        authors = doc.authors.filter((a: string) => a && a.trim());
      } else if (typeof doc.authors === 'object' && 'toArray' in doc.authors) {
        authors = (Array.from(doc.authors.toArray()) as string[]).filter((a: string) => a && a.trim());
      } else if (typeof doc.authors === 'string') {
        authors = (this.parseJsonArray(doc.authors) as string[]).filter((a: string) => a && a.trim());
      }
    }
    
    return {
      id: doc.id,
      catalogId: doc.id,  // For catalog entries, catalogId = id
      text: doc.summary || doc.text || '',  // 'summary' is new field name, 'text' for backward compat
      source: doc.source || doc.filename || '',  // Support both old and new field names
      hash: doc.hash,
      documentConceptIds: conceptIds,  // Document-level concept IDs
      conceptNames,  // DERIVED: for display and text search
      categoryIds,   // Category foreign keys
      categoryNames, // DERIVED: for display and text search
      embeddings: doc.vector || [],
      distance: 0,
      hybridScore: 1.0,
      vectorScore: 0,
      bm25Score: 0,
      titleScore: 1.0,
      conceptScore: 0,
      wordnetScore: 0,
      // Research paper metadata fields
      documentType: doc.document_type || undefined,
      doi: doc.doi || undefined,
      arxivId: doc.arxiv_id || undefined,
      venue: doc.venue || undefined,
      keywords: keywords && keywords.length > 0 ? keywords : undefined,
      abstract: doc.abstract || undefined,
      authors: authors && authors.length > 0 ? authors : undefined
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
      const allDocs = await this.catalogTable.query().limit(100000).toArray();
      
      const matches = allDocs.filter((doc: any) => {
        if (!doc.category_ids) return false;
        
        try {
          // Parse category_ids if needed and check for match
          const categoryIds = Array.isArray(doc.category_ids)
            ? doc.category_ids
            : typeof doc.category_ids === 'object' && 'toArray' in doc.category_ids
              ? Array.from(doc.category_ids.toArray())
              : [];
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
   * Aggregates concept_ids from all catalog entries in the category.
   * @param categoryId - Category ID to search
   * @returns Array of unique concept IDs
   * @throws {DatabaseError} If database query fails
   */
  async getConceptsInCategory(categoryId: number): Promise<number[]> {
    try {
      // Get all documents in this category
      const docsInCategory = await this.findByCategory(categoryId);
      
      // Aggregate unique concept IDs from all documents
      const conceptIdSet = new Set<number>();
      
      for (const doc of docsInCategory) {
        // Use documentConceptIds (catalog-level concept IDs)
        if (doc.documentConceptIds && doc.documentConceptIds.length > 0) {
          for (const conceptId of doc.documentConceptIds) {
            if (conceptId && conceptId > 0) {
              conceptIdSet.add(conceptId);
            }
          }
        }
      }
      
      return Array.from(conceptIdSet);
    } catch (error) {
      throw new DatabaseError(
        `Failed to get concepts in category ${categoryId}`,
        'query',
        error as Error
      );
    }
  }
  
  /**
   * Count total documents in the catalog.
   * @returns Total document count
   * @throws {DatabaseError} If database query fails
   */
  async count(): Promise<number> {
    try {
      return await this.catalogTable.countRows();
    } catch (error) {
      throw new DatabaseError(
        'Failed to count catalog documents',
        'query',
        error as Error
      );
    }
  }
  
}

