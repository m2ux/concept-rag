import * as lancedb from "@lancedb/lancedb";
import { CatalogRepository } from '../../../domain/interfaces/repositories/catalog-repository.js';
import { SearchQuery, SearchResult } from '../../../domain/models/index.js';
import { EmbeddingService } from '../../../domain/interfaces/services/embedding-service.js';
import { parseJsonField } from '../utils/field-parsers.js';

/**
 * LanceDB implementation of CatalogRepository
 */
export class LanceDBCatalogRepository implements CatalogRepository {
  constructor(
    private catalogTable: lancedb.Table,
    private embeddingService: EmbeddingService
  ) {}
  
  async search(query: SearchQuery): Promise<SearchResult[]> {
    // Basic vector search - full hybrid search will be in ConceptualSearchClient refactor
    const queryEmbedding = this.embeddingService.generateEmbedding(query.text);
    const limit = query.limit || 5;
    
    const results = await this.catalogTable
      .vectorSearch(queryEmbedding)
      .limit(limit)
      .toArray();
    
    return results.map((row: any) => this.mapRowToSearchResult(row));
  }
  
  async findBySource(source: string): Promise<SearchResult | null> {
    // Use source path as embedding query
    const sourceEmbedding = this.embeddingService.generateEmbedding(source);
    
    const results = await this.catalogTable
      .vectorSearch(sourceEmbedding)
      .limit(10)
      .toArray();
    
    // Find best match by source path
    for (const row of results) {
      if (row.source && row.source.toLowerCase() === source.toLowerCase()) {
        return this.mapRowToSearchResult(row);
      }
    }
    
    return null;
  }
  
  private mapRowToSearchResult(row: any): SearchResult {
    const vectorScore = 1 - (row._distance || 0);
    
    return {
      id: row.id || '',
      text: row.text || '',
      source: row.source || '',
      hash: row.hash || '',
      concepts: parseJsonField(row.concepts),
      distance: row._distance || 0,
      vectorScore: vectorScore,
      bm25Score: 0,
      titleScore: 0,
      conceptScore: 0,
      wordnetScore: 0,
      hybridScore: vectorScore
    };
  }
}

