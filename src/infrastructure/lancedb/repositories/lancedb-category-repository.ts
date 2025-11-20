/**
 * LanceDB Category Repository Implementation
 * 
 * Implements CategoryRepository interface using LanceDB as storage backend.
 * Handles conversion between LanceDB rows and Category domain models.
 */

import type { Table } from '@lancedb/lancedb';
import type { CategoryRepository } from '../../../domain/interfaces/category-repository';
import type { Category } from '../../../domain/models/category';

/**
 * Parse JSON field safely
 */
function parseJsonField<T>(field: string | undefined | null, defaultValue: T): T {
  if (!field || field === '' || field === 'null') {
    return defaultValue;
  }
  try {
    return JSON.parse(field) as T;
  } catch {
    return defaultValue;
  }
}

export class LanceDBCategoryRepository implements CategoryRepository {
  constructor(private table: Table) {}

  async findAll(): Promise<Category[]> {
    // LanceDB query() has a default limit of 10 rows (safety feature)
    // Categories table is small (<200 typically, <1000 max realistic)
    // Using explicit high limit to ensure all categories are loaded for cache initialization
    const rows = await this.table
      .query()
      .limit(10000) // 10x safety margin over max expected categories
      .toArray();
    return rows.map((row: any) => this.mapRowToCategory(row));
  }

  async findById(id: number): Promise<Category | null> {
    const rows = await this.table
      .query()
      .where(`id = ${id}`)
      .limit(1)
      .toArray();
    return rows.length > 0 ? this.mapRowToCategory(rows[0]) : null;
  }

  async findByName(name: string): Promise<Category | null> {
    // LanceDB string filtering requires proper escaping
    const escapedName = name.replace(/'/g, "''");
    const rows = await this.table
      .query()
      .where(`category = '${escapedName}'`)
      .limit(1)
      .toArray();
    return rows.length > 0 ? this.mapRowToCategory(rows[0]) : null;
  }

  async findByAlias(alias: string): Promise<Category | null> {
    // Linear scan (categories table is small, acceptable performance)
    const all = await this.findAll();
    return all.find(cat => 
      cat.aliases.some(a => a.toLowerCase() === alias.toLowerCase())
    ) || null;
  }

  async findRootCategories(): Promise<Category[]> {
    const rows = await this.table
      .query()
      .where('parent_category_id IS NULL')
      .toArray();
    return rows.map((row: any) => this.mapRowToCategory(row));
  }

  async findChildren(parentId: number): Promise<Category[]> {
    const rows = await this.table
      .query()
      .where(`parent_category_id = ${parentId}`)
      .toArray();
    return rows.map((row: any) => this.mapRowToCategory(row));
  }

  async getTopCategories(limit: number): Promise<Category[]> {
    const all = await this.findAll();
    return all
      .sort((a, b) => b.documentCount - a.documentCount)
      .slice(0, limit);
  }

  async searchByName(query: string): Promise<Category[]> {
    const lowerQuery = query.toLowerCase();
    const all = await this.findAll();
    return all.filter(cat => 
      cat.category.toLowerCase().includes(lowerQuery) ||
      cat.description.toLowerCase().includes(lowerQuery) ||
      cat.aliases.some(alias => alias.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Map LanceDB row to Category domain model
   */
  private mapRowToCategory(row: any): Category {
    return {
      id: row.id,
      category: row.category || '',
      description: row.description || '',
      parentCategoryId: row.parent_category_id ?? null,
      aliases: parseJsonField(row.aliases, []),
      relatedCategories: parseJsonField(row.related_categories, []),
      documentCount: row.document_count || 0,
      chunkCount: row.chunk_count || 0,
      conceptCount: row.concept_count || 0,
      embeddings: row.vector || []
    };
  }
}

