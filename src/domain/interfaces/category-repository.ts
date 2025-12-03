/**
 * CategoryRepository Interface
 * 
 * Repository pattern interface for category data access operations.
 * Defines the contract for category CRUD and query operations.
 */

import type { Category } from '../models/category';
import { Option } from '../functional/option.js';

export interface CategoryRepository {
  /**
   * Get all categories
   */
  findAll(): Promise<Category[]>;
  
  /**
   * Find category by ID
   * @param id Category hash ID
   * @returns Some(category) if found, None otherwise
   */
  findById(id: number): Promise<Option<Category>>;
  
  /**
   * Find category by name (exact match)
   * @param name Category name
   * @returns Some(category) if found, None otherwise
   */
  findByName(name: string): Promise<Option<Category>>;
  
  /**
   * Find category by alias
   * @param alias Category alias
   * @returns Some(category) if found, None otherwise
   */
  findByAlias(alias: string): Promise<Option<Category>>;
  
  /**
   * Find root categories (no parent)
   */
  findRootCategories(): Promise<Category[]>;
  
  /**
   * Find child categories of a parent
   * @param parentId Parent category ID
   */
  findChildren(parentId: number): Promise<Category[]>;
  
  /**
   * Get top categories by document count
   * @param limit Maximum number of results
   */
  getTopCategories(limit: number): Promise<Category[]>;
  
  /**
   * Search categories by name substring
   * @param query Search query
   */
  searchByName(query: string): Promise<Category[]>;
  
  /**
   * Resolve a category by name, ID, or alias.
   * @param nameOrIdOrAlias - Category name, numeric ID string, or alias
   * @returns Category if found, null otherwise
   */
  resolveCategory(nameOrIdOrAlias: string): Promise<Category | null>;
  
  /**
   * Get the hierarchy path names for a category (from root to this category).
   * @param categoryId - Category ID
   * @returns Array of category names from root to this category
   */
  getHierarchyPath(categoryId: number): Promise<string[]>;
  
  /**
   * Get child category IDs for a category.
   * @param parentId - Parent category ID
   * @returns Array of child category IDs
   */
  getChildIds(parentId: number): Promise<number[]>;
}
