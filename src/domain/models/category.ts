/**
 * Category Domain Model
 * 
 * Represents a semantic category (domain/topic) that groups related concepts
 * and documents together. Categories provide high-level organization and
 * enable domain-specific browsing and filtering.
 * 
 * Design notes:
 * - Uses hash-based integer IDs for stability across rebuilds
 * - Supports hierarchical organization via parentCategoryId
 * - Includes precomputed statistics for fast queries
 * - Embeddings enable semantic category search
 */

export interface Category {
  /**
   * Unique category identifier (hash-based, stable across rebuilds)
   */
  id: number;
  
  /**
   * Normalized category name (e.g., "software architecture")
   */
  category: string;
  
  /**
   * Human-readable description of the category
   */
  description: string;
  
  /**
   * Parent category ID for hierarchical organization (nullable for root categories)
   */
  parentCategoryId: number | null;
  
  /**
   * Alternative names for this category (e.g., ["ML", "statistical learning"])
   */
  aliases: string[];
  
  /**
   * IDs of frequently co-occurring categories
   */
  relatedCategories: number[];
  
  /**
   * Number of documents tagged with this category
   */
  documentCount: number;
  
  /**
   * Number of chunks tagged with this category
   */
  chunkCount: number;
  
  /**
   * Number of unique concepts associated with this category
   */
  conceptCount: number;
  
  /**
   * Embedding vector for semantic search (384 dimensions)
   */
  embeddings: number[];
}

/**
 * Type for category creation (without computed fields)
 */
export type CategoryCreate = Omit<Category, 'documentCount' | 'chunkCount' | 'conceptCount' | 'embeddings'>;

/**
 * Type for category updates (all fields optional except id)
 */
export type CategoryUpdate = Partial<Omit<Category, 'id'>> & { id: number };

