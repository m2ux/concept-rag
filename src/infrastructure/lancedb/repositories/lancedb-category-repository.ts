/**
 * LanceDB Category Repository Implementation
 * 
 * Implements CategoryRepository interface using LanceDB as storage backend.
 * Handles conversion between LanceDB rows and Category domain models.
 */

import type { Table } from '@lancedb/lancedb';
import type { CategoryRepository } from '../../../domain/interfaces/category-repository';
import type { Category } from '../../../domain/models/category';
import { DatabaseError } from '../../../domain/exceptions/index.js';
// @ts-expect-error - Type narrowing limitation
import type { Option } from "../../../../__tests__/test-helpers/../../domain/functional/index.js";

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

  /**
   * Get all categories.
   * @returns Array of all categories
   * @throws {DatabaseError} If database query fails
   */
  async findAll(): Promise<Category[]> {
    try {
      // LanceDB query() has a default limit of 10 rows (safety feature)
      // Categories table is small (<200 typically, <1000 max realistic)
      // Using explicit high limit to ensure all categories are loaded for cache initialization
      const rows = await this.table
        .query()
        .limit(10000) // 10x safety margin over max expected categories
        .toArray();
      return rows.map((row: any) => this.mapRowToCategory(row));
    } catch (error) {
      throw new DatabaseError(
        'Failed to retrieve all categories',
        'query',
        error as Error
      );
    }
  }

  /**
   * Find category by ID.
   * @param id - Category ID
   * @returns Category if found, null otherwise
   * @throws {DatabaseError} If database query fails
   */
  async findById(id: number): Promise<Option<Category>> {
    try {
      const rows = await this.table
        .query()
        .where(`id = ${id}`)
        .limit(1)
        .toArray();
      return rows.length > 0 ? this.mapRowToCategory(rows[0]) : null;
    } catch (error) {
      throw new DatabaseError(
        `Failed to find category with id ${id}`,
        'query',
        error as Error
      );
    }
  }

  /**
   * Find category by name.
   * @param name - Category name
   * @returns Category if found, null otherwise
   * @throws {DatabaseError} If database query fails
   */
  async findByName(name: string): Promise<Option<Category>> {
    try {
      // LanceDB string filtering requires proper escaping
      const escapedName = name.replace(/'/g, "''");
      const rows = await this.table
        .query()
        .where(`category = '${escapedName}'`)
        .limit(1)
        .toArray();
      return rows.length > 0 ? this.mapRowToCategory(rows[0]) : null;
    } catch (error) {
      throw new DatabaseError(
        `Failed to find category with name "${name}"`,
        'query',
        error as Error
      );
    }
  }

  /**
   * Find category by alias.
   * @param alias - Category alias
   * @returns Category if found, null otherwise
   * @throws {DatabaseError} If database query fails
   */
  async findByAlias(alias: string): Promise<Option<Category>> {
    try {
      // Linear scan (categories table is small, acceptable performance)
      const all = await this.findAll();
      return all.find(cat => 
        cat.aliases.some(a => a.toLowerCase() === alias.toLowerCase())
      ) || null;
    } catch (error) {
      // If it's already a DatabaseError from findAll, re-throw
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        `Failed to find category with alias "${alias}"`,
        'query',
        error as Error
      );
    }
  }

  async findRootCategories(): Promise<Category[]> {
    try {
      const rows = await this.table
        .query()
        .where('parent_category_id IS NULL')
        .toArray();
      return rows.map((row: any) => this.mapRowToCategory(row));
    } catch (error) {
      throw new DatabaseError(
        'Failed to find root categories',
        'query',
        error as Error
      );
    }
  }

  async findChildren(parentId: number): Promise<Category[]> {
    try {
      const rows = await this.table
        .query()
        .where(`parent_category_id = ${parentId}`)
        .toArray();
      return rows.map((row: any) => this.mapRowToCategory(row));
    } catch (error) {
      throw new DatabaseError(
        `Failed to find children of category ${parentId}`,
        'query',
        error as Error
      );
    }
  }

  async getTopCategories(limit: number): Promise<Category[]> {
    try {
      const all = await this.findAll();
      return all
        .sort((a, b) => b.documentCount - a.documentCount)
        .slice(0, limit);
    } catch (error) {
      // If it's already a DatabaseError from findAll, re-throw
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        `Failed to get top ${limit} categories`,
        'query',
        error as Error
      );
    }
  }

  async searchByName(query: string): Promise<Category[]> {
    try {
      const lowerQuery = query.toLowerCase();
      const all = await this.findAll();
      return all.filter(cat => 
        cat.category.toLowerCase().includes(lowerQuery) ||
        cat.description.toLowerCase().includes(lowerQuery) ||
        cat.aliases.some(alias => alias.toLowerCase().includes(lowerQuery))
      );
    } catch (error) {
      // If it's already a DatabaseError from findAll, re-throw
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        `Failed to search categories with query "${query}"`,
        'query',
        error as Error
      );
    }
  }

  /**
   * Resolve a category by name, ID, or alias.
   * Returns the category if found, null otherwise.
   * 
   * @param nameOrIdOrAlias - Category name, numeric ID, or alias
   * @returns Category if found
   */
  async resolveCategory(nameOrIdOrAlias: string): Promise<Category | null> {
    // Try as alias first
    const byAlias = await this.findByAlias(nameOrIdOrAlias);
    if (byAlias) return byAlias;
    
    // Try as exact name
    const byName = await this.findByName(nameOrIdOrAlias);
    if (byName) return byName;
    
    // Try as numeric ID
    const numericId = parseInt(nameOrIdOrAlias, 10);
    if (!isNaN(numericId)) {
      const byId = await this.findById(numericId);
      if (byId) return byId;
    }
    
    // Fallback: fuzzy search by name (partial match)
    const matches = await this.searchByName(nameOrIdOrAlias);
    if (matches.length > 0) {
      // Return the best match (first result from searchByName)
      return matches[0];
    }
    
    return null;
  }

  /**
   * Get the hierarchy path names for a category (from root to this category).
   * @param categoryId - Category ID
   * @returns Array of category names from root to this category
   */
  async getHierarchyPath(categoryId: number): Promise<string[]> {
    const path: string[] = [];
    let currentId: number | null = categoryId;
    
    // Walk up the hierarchy
    while (currentId !== null) {
      const cat = await this.findById(currentId);
      if (!cat) break;
      
      path.unshift(cat.category);
      currentId = cat.parentCategoryId;
      
      // Prevent infinite loops
      if (path.length > 10) break;
    }
    
    return path;
  }

  /**
   * Get child category IDs for a category.
   * @param parentId - Parent category ID
   * @returns Array of child category IDs
   */
  async getChildIds(parentId: number): Promise<number[]> {
    const children = await this.findChildren(parentId);
    return children.map(c => c.id);
  }

  /**
   * Map LanceDB row to Category domain model
   */
  private mapRowToCategory(row: any): Category {
    return {
      id: row.id,
      category: row.category || '',
      description: row.description || '',
      summary: row.summary || '',
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

