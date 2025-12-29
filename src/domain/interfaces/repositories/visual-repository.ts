import type { Visual } from '../../models/visual.js';
import type { Option } from '../../functional/option.js';

/**
 * Repository interface for accessing visual data from the vector database.
 * 
 * Visuals are diagrams, charts, tables, and figures extracted from documents,
 * enriched with:
 * - LLM-generated semantic descriptions
 * - Vector embeddings for semantic search
 * - Extracted concepts for conceptual navigation
 * - Links to nearby text chunks for context
 * 
 * **Design Pattern**: Repository Pattern
 * - Abstracts data access behind domain interface
 * - Enables testability via test doubles
 * - Follows Dependency Inversion Principle
 * 
 * @example
 * ```typescript
 * // Find visuals from a specific document
 * const visuals = await visualRepo.findByCatalogId(catalogId, 20);
 * console.log(`Found ${visuals.length} diagrams`);
 * 
 * // Get specific visuals by ID
 * const selected = await visualRepo.findByIds([123, 456, 789]);
 * ```
 * 
 * @see {@link Visual} for the data model
 */
export interface VisualRepository {
  /**
   * Find a visual by its unique ID.
   * 
   * @param id - The visual ID (hash-based integer)
   * @returns Promise resolving to Option containing the visual if found
   * 
   * @example
   * ```typescript
   * const visualOpt = await visualRepo.findById(3847293847);
   * if (isSome(visualOpt)) {
   *   console.log(`Description: ${visualOpt.value.description}`);
   * }
   * ```
   */
  findById(id: number): Promise<Option<Visual>>;
  
  /**
   * Find multiple visuals by their IDs.
   * 
   * Efficient batch lookup for retrieving multiple visuals at once.
   * Returns visuals in the same order as the input IDs.
   * Missing IDs are skipped (no error thrown).
   * 
   * @param ids - Array of visual IDs to retrieve
   * @returns Promise resolving to array of found visuals
   * 
   * @example
   * ```typescript
   * const visuals = await visualRepo.findByIds([123, 456, 789]);
   * visuals.forEach(v => console.log(v.description));
   * ```
   */
  findByIds(ids: number[]): Promise<Visual[]>;
  
  /**
   * Find visuals from a specific catalog entry (document).
   * 
   * @param catalogId - The catalog entry ID (hash-based integer)
   * @param limit - Maximum number of visuals to return
   * @returns Promise resolving to visuals from the specified document
   * 
   * @example
   * ```typescript
   * const visuals = await visualRepo.findByCatalogId(12345678, 50);
   * console.log(`Document has ${visuals.length} diagrams`);
   * ```
   */
  findByCatalogId(catalogId: number, limit: number): Promise<Visual[]>;
  
  /**
   * Find visuals by type across all documents.
   * 
   * @param visualType - The type of visual to find
   * @param limit - Maximum number of visuals to return
   * @returns Promise resolving to visuals of the specified type
   * 
   * @example
   * ```typescript
   * const charts = await visualRepo.findByType('chart', 20);
   * console.log(`Found ${charts.length} charts`);
   * ```
   */
  findByType(visualType: string, limit: number): Promise<Visual[]>;
  
  /**
   * Find visuals on a specific page of a document.
   * 
   * @param catalogId - The catalog entry ID
   * @param pageNumber - The page number (1-indexed)
   * @returns Promise resolving to visuals on the specified page
   * 
   * @example
   * ```typescript
   * const pageVisuals = await visualRepo.findByPage(12345678, 42);
   * console.log(`Page 42 has ${pageVisuals.length} diagrams`);
   * ```
   */
  findByPage(catalogId: number, pageNumber: number): Promise<Visual[]>;
  
  /**
   * Find visuals associated with a specific concept.
   * 
   * Retrieves visuals that have the specified concept in their concept_ids.
   * Useful for visual exploration of concepts.
   * 
   * @param conceptId - The concept ID to search for
   * @param limit - Maximum number of visuals to return
   * @returns Promise resolving to visuals containing the concept
   * 
   * @example
   * ```typescript
   * const visuals = await visualRepo.findByConceptId(conceptId, 10);
   * console.log(`Concept appears in ${visuals.length} diagrams`);
   * ```
   */
  findByConceptId(conceptId: number, limit: number): Promise<Visual[]>;
  
  /**
   * Find visuals near specific text chunks.
   * 
   * Retrieves visuals that have any of the specified chunk IDs in their chunk_ids.
   * Useful for enriching search results with relevant diagrams.
   * 
   * @param chunkIds - Array of chunk IDs to find associated visuals
   * @param limit - Maximum number of visuals to return
   * @returns Promise resolving to visuals associated with the chunks
   * 
   * @example
   * ```typescript
   * // Enrich chunk search results with relevant visuals
   * const visualIds = await visualRepo.findByChunkIds(
   *   chunks.map(c => c.id),
   *   10
   * );
   * ```
   */
  findByChunkIds(chunkIds: number[], limit: number): Promise<Visual[]>;
  
  /**
   * Search visuals by semantic similarity to a query.
   * 
   * Uses vector search on the description embeddings to find
   * visuals semantically similar to the query.
   * 
   * @param queryVector - The query embedding vector (384-dim)
   * @param limit - Maximum number of visuals to return
   * @returns Promise resolving to visuals ranked by similarity
   * 
   * @example
   * ```typescript
   * const queryVector = embeddingService.embed('architecture diagram');
   * const visuals = await visualRepo.searchByVector(queryVector, 10);
   * ```
   */
  searchByVector(queryVector: number[], limit: number): Promise<Visual[]>;
  
  /**
   * Count the total number of visuals in the repository.
   * 
   * @returns Promise resolving to total visual count
   * 
   * @example
   * ```typescript
   * const total = await visualRepo.count();
   * console.log(`Database contains ${total} diagrams`);
   * ```
   */
  count(): Promise<number>;
  
  /**
   * Add a new visual to the repository.
   * 
   * @param visual - The visual to add
   * @returns Promise resolving when the visual is added
   * 
   * @example
   * ```typescript
   * await visualRepo.add({
   *   id: hashToId(...),
   *   catalogId: 12345678,
   *   catalogTitle: 'Clean Architecture',
   *   imagePath: 'images/12345678/p42_v1.png',
   *   description: 'Architecture diagram...',
   *   visualType: 'diagram',
   *   pageNumber: 42
   * });
   * ```
   */
  add(visual: Visual): Promise<void>;
  
  /**
   * Add multiple visuals to the repository in batch.
   * 
   * More efficient than calling add() multiple times.
   * 
   * @param visuals - Array of visuals to add
   * @returns Promise resolving when all visuals are added
   */
  addBatch(visuals: Visual[]): Promise<void>;
  
  /**
   * Update an existing visual in the repository.
   * 
   * Typically used to add description, vector, and concepts
   * after initial extraction.
   * 
   * @param visual - The visual with updated fields
   * @returns Promise resolving when the visual is updated
   */
  update(visual: Visual): Promise<void>;
  
  /**
   * Delete a visual by ID.
   * 
   * Note: This does NOT delete the image file - that must be done separately.
   * 
   * @param id - The visual ID to delete
   * @returns Promise resolving when the visual is deleted
   */
  delete(id: number): Promise<void>;
  
  /**
   * Delete all visuals for a specific catalog entry.
   * 
   * Useful when re-extracting visuals for a document.
   * Note: This does NOT delete image files - that must be done separately.
   * 
   * @param catalogId - The catalog entry ID
   * @returns Promise resolving to the number of visuals deleted
   */
  deleteByCatalogId(catalogId: number): Promise<number>;
}

