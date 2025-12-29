import * as lancedb from "@lancedb/lancedb";
import type { VisualRepository } from '../../../domain/interfaces/repositories/visual-repository.js';
import type { Visual, VisualType } from '../../../domain/models/visual.js';
import type { Option } from '../../../domain/functional/option.js';
import { Some, None } from '../../../domain/functional/option.js';
import { DatabaseError } from '../../../domain/exceptions/index.js';

/**
 * LanceDB implementation of VisualRepository
 * 
 * Stores and retrieves visual content (diagrams, charts, tables, figures)
 * extracted from documents. Uses vector search for semantic queries.
 * 
 * **Schema:**
 * - id: number (hash-based)
 * - catalog_id: number (FK to catalog)
 * - catalog_title: string (derived)
 * - image_path: string (relative path to grayscale PNG)
 * - description: string (LLM-generated)
 * - vector: Float32Array (384-dim embedding)
 * - visual_type: string (diagram|flowchart|chart|table|figure)
 * - page_number: number
 * - bounding_box: string (JSON)
 * - concept_ids: number[]
 * - concept_names: string[] (derived)
 * - chunk_ids: number[]
 */
export class LanceDBVisualRepository implements VisualRepository {
  constructor(private visualsTable: lancedb.Table) {}
  
  async findById(id: number): Promise<Option<Visual>> {
    try {
      const results = await this.visualsTable
        .query()
        .where(`id = ${id}`)
        .limit(1)
        .toArray();
      
      if (results.length === 0) {
        return None();
      }
      
      return Some(this.mapRowToVisual(results[0]));
    } catch (error) {
      throw new DatabaseError(
        `Failed to find visual by ID ${id}`,
        'query',
        error as Error
      );
    }
  }
  
  async findByIds(ids: number[]): Promise<Visual[]> {
    if (ids.length === 0) {
      return [];
    }
    
    try {
      // Build OR condition for multiple IDs
      const idConditions = ids.map(id => `id = ${id}`).join(' OR ');
      
      const results = await this.visualsTable
        .query()
        .where(idConditions)
        .limit(ids.length)
        .toArray();
      
      return results.map(row => this.mapRowToVisual(row));
    } catch (error) {
      throw new DatabaseError(
        `Failed to find visuals by IDs`,
        'query',
        error as Error
      );
    }
  }
  
  async findByCatalogId(catalogId: number, limit: number): Promise<Visual[]> {
    try {
      const results = await this.visualsTable
        .query()
        .where(`catalog_id = ${catalogId}`)
        .limit(limit)
        .toArray();
      
      return results.map(row => this.mapRowToVisual(row));
    } catch (error) {
      throw new DatabaseError(
        `Failed to find visuals for catalog ID ${catalogId}`,
        'query',
        error as Error
      );
    }
  }
  
  async findByType(visualType: string, limit: number): Promise<Visual[]> {
    try {
      const results = await this.visualsTable
        .query()
        .where(`visual_type = '${visualType}'`)
        .limit(limit)
        .toArray();
      
      return results.map(row => this.mapRowToVisual(row));
    } catch (error) {
      throw new DatabaseError(
        `Failed to find visuals of type ${visualType}`,
        'query',
        error as Error
      );
    }
  }
  
  async findByPage(catalogId: number, pageNumber: number): Promise<Visual[]> {
    try {
      const results = await this.visualsTable
        .query()
        .where(`catalog_id = ${catalogId} AND page_number = ${pageNumber}`)
        .toArray();
      
      return results.map(row => this.mapRowToVisual(row));
    } catch (error) {
      throw new DatabaseError(
        `Failed to find visuals on page ${pageNumber} of catalog ${catalogId}`,
        'query',
        error as Error
      );
    }
  }
  
  async findByConceptId(conceptId: number, limit: number): Promise<Visual[]> {
    try {
      // Query all visuals and filter in memory (LanceDB array_contains support varies)
      const results = await this.visualsTable
        .query()
        .limit(10000)
        .toArray();
      
      const matches = results
        .filter(row => {
          const conceptIds = this.parseArrayField(row.concept_ids);
          return conceptIds.includes(conceptId);
        })
        .slice(0, limit);
      
      return matches.map(row => this.mapRowToVisual(row));
    } catch (error) {
      throw new DatabaseError(
        `Failed to find visuals for concept ID ${conceptId}`,
        'query',
        error as Error
      );
    }
  }
  
  async findByChunkIds(chunkIds: number[], limit: number): Promise<Visual[]> {
    if (chunkIds.length === 0) {
      return [];
    }
    
    try {
      // Query all visuals and filter in memory
      const results = await this.visualsTable
        .query()
        .limit(10000)
        .toArray();
      
      const chunkIdSet = new Set(chunkIds);
      
      const matches = results
        .filter(row => {
          const visualChunkIds = this.parseArrayField<number>(row.chunk_ids);
          return visualChunkIds.some(id => chunkIdSet.has(id));
        })
        .slice(0, limit);
      
      return matches.map(row => this.mapRowToVisual(row));
    } catch (error) {
      throw new DatabaseError(
        `Failed to find visuals for chunk IDs`,
        'query',
        error as Error
      );
    }
  }
  
  async searchByVector(queryVector: number[], limit: number): Promise<Visual[]> {
    try {
      const results = await this.visualsTable
        .vectorSearch(queryVector)
        .limit(limit)
        .toArray();
      
      return results.map(row => this.mapRowToVisual(row));
    } catch (error) {
      throw new DatabaseError(
        `Failed to search visuals by vector`,
        'vector_search',
        error as Error
      );
    }
  }
  
  async count(): Promise<number> {
    try {
      return await this.visualsTable.countRows();
    } catch (error) {
      throw new DatabaseError(
        `Failed to count visuals`,
        'query',
        error as Error
      );
    }
  }
  
  async add(visual: Visual): Promise<void> {
    try {
      const row = this.mapVisualToRow(visual);
      await this.visualsTable.add([row]);
    } catch (error) {
      throw new DatabaseError(
        `Failed to add visual ${visual.id}`,
        'insert',
        error as Error
      );
    }
  }
  
  async addBatch(visuals: Visual[]): Promise<void> {
    if (visuals.length === 0) {
      return;
    }
    
    try {
      const rows = visuals.map(v => this.mapVisualToRow(v));
      await this.visualsTable.add(rows);
    } catch (error) {
      throw new DatabaseError(
        `Failed to add ${visuals.length} visuals`,
        'insert',
        error as Error
      );
    }
  }
  
  async update(visual: Visual): Promise<void> {
    try {
      // LanceDB doesn't have native update - delete and re-add
      await this.delete(visual.id);
      await this.add(visual);
    } catch (error) {
      throw new DatabaseError(
        `Failed to update visual ${visual.id}`,
        'update',
        error as Error
      );
    }
  }
  
  async delete(id: number): Promise<void> {
    try {
      await this.visualsTable.delete(`id = ${id}`);
    } catch (error) {
      throw new DatabaseError(
        `Failed to delete visual ${id}`,
        'delete',
        error as Error
      );
    }
  }
  
  async deleteByCatalogId(catalogId: number): Promise<number> {
    try {
      // Count before delete
      const count = await this.visualsTable
        .query()
        .where(`catalog_id = ${catalogId}`)
        .toArray();
      
      const deleteCount = count.length;
      
      if (deleteCount > 0) {
        await this.visualsTable.delete(`catalog_id = ${catalogId}`);
      }
      
      return deleteCount;
    } catch (error) {
      throw new DatabaseError(
        `Failed to delete visuals for catalog ${catalogId}`,
        'delete',
        error as Error
      );
    }
  }
  
  // Helper methods
  
  /**
   * Parse array field from various formats (Arrow Vector, native array, JSON string)
   */
  private parseArrayField<T>(field: unknown): T[] {
    if (!field) return [];
    if (Array.isArray(field)) return field;
    if (typeof field === 'object' && field !== null && 'toArray' in field) {
      // Arrow Vector
      return Array.from((field as { toArray(): T[] }).toArray());
    }
    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch {
        return [];
      }
    }
    return [];
  }
  
  /**
   * Map a database row to a Visual domain model.
   */
  private mapRowToVisual(row: any): Visual {
    return {
      id: typeof row.id === 'number' ? row.id : parseInt(row.id) || 0,
      catalogId: row.catalog_id || 0,
      catalogTitle: row.catalog_title || '',
      imagePath: row.image_path || '',
      description: row.description || '',
      vector: row.vector ? Array.from(row.vector) : undefined,
      visualType: (row.visual_type || 'diagram') as VisualType,
      pageNumber: row.page_number || 0,
      boundingBox: row.bounding_box,
      conceptIds: this.parseArrayField<number>(row.concept_ids),
      conceptNames: this.parseArrayField<string>(row.concept_names),
      chunkIds: this.parseArrayField<number>(row.chunk_ids)
    };
  }
  
  /**
   * Map a Visual domain model to a database row.
   */
  private mapVisualToRow(visual: Visual): Record<string, unknown> {
    return {
      id: visual.id,
      catalog_id: visual.catalogId,
      catalog_title: visual.catalogTitle,
      image_path: visual.imagePath,
      description: visual.description,
      vector: visual.vector ? new Float32Array(visual.vector) : new Float32Array(384),
      visual_type: visual.visualType,
      page_number: visual.pageNumber,
      bounding_box: visual.boundingBox || '',
      concept_ids: visual.conceptIds || [],
      concept_names: visual.conceptNames || [],
      chunk_ids: visual.chunkIds || []
    };
  }
}

