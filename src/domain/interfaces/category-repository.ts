/**
 * CategoryRepository Interface
 * 
 * Repository pattern interface for category data access operations.
 * Defines the contract for category CRUD and query operations.
 */

import type { Category } from '../models/category';

export interface CategoryRepository {
  /**
   * Get all categories
   */
  findAll(): Promise<Category[]>;
  
  /**
   * Find category by ID
   * @param id Category hash ID
   */
  findById(id: number): Promise<Category | null>;
  
  /**
   * Find category by name (exact match)
   * @param name Category name
   */
  findByName(name: string): Promise<Category | null>;
  
  /**
   * Find category by alias
   * @param alias Category alias
   */
  findByAlias(alias: string): Promise<Category | null>;
  
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
}

