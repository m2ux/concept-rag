import * as lancedb from "@lancedb/lancedb";
import { CatalogRepository } from '../../../domain/interfaces/repositories/catalog-repository.js';
import { SearchQuery, SearchResult } from '../../../domain/models/index.js';
import { HybridSearchService } from '../../../domain/interfaces/services/hybrid-search-service.js';
import { SearchableCollectionAdapter } from '../searchable-collection-adapter.js';
import { ConceptIdCache } from '../../cache/concept-id-cache.js';

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
    private hybridSearchService: HybridSearchService,
    // @ts-expect-error - Reserved for future use: concept resolution in catalog entries
    private conceptIdCache: ConceptIdCache
  ) {}
  
  async search(query: SearchQuery): Promise<SearchResult[]> {
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
  }
  
  async findBySource(source: string): Promise<SearchResult | null> {
    // Use hybrid search with source as query (benefits from title matching)
    const collection = new SearchableCollectionAdapter(this.catalogTable, 'catalog');
    
    const results = await this.hybridSearchService.search(
      collection,
      source,
      10,
      false
    );
    
    // Find exact source match
    for (const result of results) {
      if (result.source.toLowerCase() === source.toLowerCase()) {
        return result;
      }
    }
    
    // If no exact match, return best match if it's close
    return results.length > 0 ? results[0] : null;
  }
  
  async findByCategory(categoryId: number): Promise<SearchResult[]> {
    // Query all catalog entries and filter by category_ids
    const allDocs = await this.catalogTable.query().toArray();
    
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
  }
  
  async getConceptsInCategory(categoryId: number): Promise<number[]> {
    // Step 1: Find all documents in this category
    const docs = await this.findByCategory(categoryId);
    
    // Step 2: Aggregate unique concepts from these documents
    const uniqueConcepts = new Set<number>();
    
    for (const doc of docs) {
      // Parse concept_ids field (new format with hash-based IDs)
      const docData = await this.catalogTable.query()
        .where(`id = '${doc.id}'`)
        .limit(1)
        .toArray();
      
      if (docData.length > 0 && docData[0].concept_ids) {
        try {
          const conceptIds: number[] = JSON.parse(docData[0].concept_ids);
          conceptIds.forEach(id => uniqueConcepts.add(id));
        } catch {
          // Skip malformed data
        }
      }
    }
    
    return Array.from(uniqueConcepts);
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

