import * as lancedb from "@lancedb/lancedb";
import { PageRepository } from '../../../domain/interfaces/repositories/page-repository.js';
import { Page } from '../../../domain/models/index.js';
import { DatabaseError } from '../../../domain/exceptions/index.js';
import { detectVectorField } from '../utils/schema-validators.js';
import { ConceptIdCache } from '../../cache/concept-id-cache.js';

/**
 * LanceDB implementation of PageRepository.
 * 
 * Provides efficient page-level queries for hierarchical concept retrieval.
 */
export class LanceDBPageRepository implements PageRepository {
  constructor(
    private pagesTable: lancedb.Table,
    private conceptIdCache: ConceptIdCache
  ) {}
  
  /**
   * Find pages containing a specific concept.
   */
  async findByConceptId(conceptId: number, limit: number = 50): Promise<Page[]> {
    try {
      // LanceDB doesn't support array_contains directly in WHERE
      // Load pages and filter by concept_ids in JS
      // For production, consider adding an index or using vector search
      const allPages = await this.pagesTable
        .query()
        .limit(10000) // Reasonable limit for pages table
        .toArray();
      
      const matchingPages = allPages
        .filter((row: any) => {
          const conceptIds = this.parseArrayField<number>(row.concept_ids);
          return conceptIds.includes(conceptId);
        })
        .slice(0, limit)
        .map((row: any) => this.mapRowToPage(row));
      
      return matchingPages;
    } catch (error) {
      throw new DatabaseError(
        `Failed to find pages for concept ID ${conceptId}`,
        'query',
        error as Error
      );
    }
  }
  
  /**
   * Find pages containing any of the specified concepts (union).
   */
  async findByConceptIds(conceptIds: number[], limit: number = 50): Promise<Page[]> {
    try {
      const conceptIdSet = new Set(conceptIds);
      
      const allPages = await this.pagesTable
        .query()
        .limit(10000)
        .toArray();
      
      const matchingPages = allPages
        .filter((row: any) => {
          const pageConceptIds = this.parseArrayField<number>(row.concept_ids);
          return pageConceptIds.some(id => conceptIdSet.has(id));
        })
        .slice(0, limit)
        .map((row: any) => this.mapRowToPage(row));
      
      return matchingPages;
    } catch (error) {
      throw new DatabaseError(
        `Failed to find pages for concept IDs`,
        'query',
        error as Error
      );
    }
  }
  
  /**
   * Find all pages for a specific document.
   */
  async findByCatalogId(catalogId: number): Promise<Page[]> {
    try {
      const results = await this.pagesTable
        .query()
        .where(`catalog_id = ${catalogId}`)
        .limit(1000) // Max pages per document
        .toArray();
      
      return results
        .map((row: any) => this.mapRowToPage(row))
        .sort((a, b) => a.pageNumber - b.pageNumber);
    } catch (error) {
      throw new DatabaseError(
        `Failed to find pages for catalog ID ${catalogId}`,
        'query',
        error as Error
      );
    }
  }
  
  /**
   * Find a specific page by document and page number.
   */
  async findByPageNumber(catalogId: number, pageNumber: number): Promise<Page | undefined> {
    try {
      const results = await this.pagesTable
        .query()
        .where(`catalog_id = ${catalogId} AND page_number = ${pageNumber}`)
        .limit(1)
        .toArray();
      
      if (results.length === 0) {
        return undefined;
      }
      
      return this.mapRowToPage(results[0]);
    } catch (error) {
      throw new DatabaseError(
        `Failed to find page ${pageNumber} for catalog ${catalogId}`,
        'query',
        error as Error
      );
    }
  }
  
  /**
   * Count total pages.
   */
  async countPages(): Promise<number> {
    return await this.pagesTable.countRows();
  }
  
  // Helper methods
  
  private parseArrayField<T>(field: any): T[] {
    if (!field) return [];
    if (Array.isArray(field)) return field;
    if (typeof field === 'object' && 'toArray' in field) {
      return Array.from(field.toArray());
    }
    if (typeof field === 'string') {
      try { return JSON.parse(field); } catch { return []; }
    }
    return [];
  }
  
  private mapRowToPage(row: any): Page {
    const vectorField = detectVectorField(row);
    const embeddings = vectorField ? row[vectorField] : undefined;
    
    const conceptIds = this.parseArrayField<number>(row.concept_ids);
    
    // Resolve concept names via cache
    const concepts = this.conceptIdCache.getNames(conceptIds.map(id => String(id)));
    
    return {
      id: row.id,
      catalogId: row.catalog_id,
      pageNumber: row.page_number,
      conceptIds,
      concepts,
      textPreview: row.text_preview || '',
      embeddings
    };
  }
}

