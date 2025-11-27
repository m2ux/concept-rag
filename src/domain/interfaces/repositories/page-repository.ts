import { Page } from '../../models/index.js';

/**
 * Repository interface for accessing page-level data from the vector database.
 * 
 * Pages are an intermediate level in the hierarchical retrieval model:
 * Document (catalog) → Pages → Chunks
 * 
 * **Key Use Cases**:
 * - Find which pages discuss a specific concept
 * - Navigate from concept to page to chunks
 * - Get page-level context for concept search
 * 
 * **Performance Requirements**:
 * - Efficient concept-to-page lookups via concept_ids field
 * - Support for document filtering via catalog_id
 * 
 * @example
 * ```typescript
 * // Find pages discussing a concept
 * const conceptId = hashToId('factory pattern');
 * const pages = await pageRepo.findByConceptId(conceptId, 10);
 * 
 * // Get pages from a specific document
 * const docPages = await pageRepo.findByCatalogId(catalogId);
 * ```
 * 
 * @see {@link Page} for the data model
 */
export interface PageRepository {
  /**
   * Find pages that contain a specific concept.
   * 
   * Searches pages where the concept_ids array contains the given concept ID.
   * This is the primary method for hierarchical concept retrieval.
   * 
   * **Performance**: Filters on concept_ids array field
   * 
   * @param conceptId - Hash-based concept ID to search for
   * @param limit - Maximum pages to return (default: 50)
   * @returns Promise resolving to pages containing this concept, sorted by relevance
   * @throws {Error} If database query fails
   * 
   * @example
   * ```typescript
   * const pages = await pageRepo.findByConceptId(12345678, 20);
   * pages.forEach(page => {
   *   console.log(`Doc ${page.catalogId}, Page ${page.pageNumber}`);
   *   console.log(`Preview: ${page.textPreview.substring(0, 100)}...`);
   * });
   * ```
   */
  findByConceptId(conceptId: number, limit?: number): Promise<Page[]>;
  
  /**
   * Find pages for multiple concepts (union).
   * 
   * Returns pages that contain ANY of the specified concepts.
   * Useful for broad concept searches across multiple related concepts.
   * 
   * @param conceptIds - Array of concept IDs to search for
   * @param limit - Maximum pages to return
   * @returns Promise resolving to pages containing any of the concepts
   */
  findByConceptIds(conceptIds: number[], limit?: number): Promise<Page[]>;
  
  /**
   * Find all pages belonging to a specific document.
   * 
   * Retrieves pages from a single document, sorted by page number.
   * Used for document-specific analysis or navigation.
   * 
   * @param catalogId - Parent document's catalog ID
   * @returns Promise resolving to all pages for this document, sorted by page number
   * @throws {Error} If database query fails
   * 
   * @example
   * ```typescript
   * const pages = await pageRepo.findByCatalogId(87654321);
   * console.log(`Document has ${pages.length} pages`);
   * ```
   */
  findByCatalogId(catalogId: number): Promise<Page[]>;
  
  /**
   * Find a specific page by document and page number.
   * 
   * @param catalogId - Parent document's catalog ID
   * @param pageNumber - Page number within document (1-indexed)
   * @returns Promise resolving to the page or undefined if not found
   */
  findByPageNumber(catalogId: number, pageNumber: number): Promise<Page | undefined>;
  
  /**
   * Count total pages in the repository.
   * 
   * @returns Promise resolving to total page count
   */
  countPages(): Promise<number>;
}

