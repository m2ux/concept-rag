import { Concept } from '../../models/index.js';

/**
 * Repository interface for accessing concept data from the vector database.
 * 
 * Concepts are semantic entities extracted from documents, enriched with:
 * - WordNet relationships (synonyms, broader/narrower terms)
 * - Cross-document connections (sources, related concepts)
 * - Vector embeddings for similarity search
 * 
 * **Use Cases**:
 * - Concept lookup and navigation
 * - Finding related concepts
 * - Exploring semantic relationships
 * - Building knowledge graphs
 * 
 * @example
 * ```typescript
 * // Find specific concept
 * const concept = await conceptRepo.findByName('dependency injection');
 * console.log(`Category: ${concept.category}`);
 * console.log(`Synonyms: ${concept.synonyms.join(', ')}`);
 * 
 * // Find related concepts
 * const related = await conceptRepo.findRelated('microservices', 5);
 * related.forEach(c => console.log(`- ${c.concept}`));
 * ```
 * 
 * @see {@link Concept} for the data model
 */
export interface ConceptRepository {
  /**
   * Find a concept by exact name match (case-insensitive).
   * 
   * Looks up a concept in the concept table using an exact name match.
   * The search is case-insensitive and trims whitespace.
   * 
   * **Performance**: O(1) - indexed lookup
   * 
   * @param conceptName - The concept name to find (e.g., 'REST API', 'microservices')
   * @returns Promise resolving to the concept if found, null if not found
   * @throws {Error} If database query fails
   * 
   * @example
   * ```typescript
   * const concept = await conceptRepo.findByName('dependency injection');
   * if (concept) {
   *   console.log(`Found: ${concept.concept}`);
   *   console.log(`Type: ${concept.conceptType}`);
   *   console.log(`Sources: ${concept.sources.length} documents`);
   *   console.log(`Related: ${concept.relatedConcepts.join(', ')}`);
   * }
   * ```
   */
  findByName(conceptName: string): Promise<Concept | null>;
  
  /**
   * Find concepts related to a given concept using vector similarity.
   * 
   * Uses the concept's embedding to find semantically similar concepts
   * in the vector space. Results are sorted by similarity (closest first).
   * 
   * **Algorithm**:
   * 1. Look up the concept's embedding
   * 2. Perform vector similarity search in concept table
   * 3. Exclude the original concept
   * 4. Sort by distance (most similar first)
   * 
   * **Performance**: O(log n) vector search
   * 
   * @param conceptName - Name of the concept to find relations for
   * @param limit - Maximum number of related concepts to return (typically 5-20)
   * @returns Promise resolving to array of related concepts sorted by similarity
   * @throws {Error} If database query fails
   * @throws {Error} If concept not found
   * 
   * @example
   * ```typescript
   * const related = await conceptRepo.findRelated('microservices', 10);
   * related.forEach(concept => {
   *   console.log(`${concept.concept} (weight: ${concept.weight.toFixed(2)})`);
   * });
   * // Output might include:
   * // - service-oriented architecture (weight: 0.87)
   * // - API gateway (weight: 0.82)
   * // - distributed systems (weight: 0.78)
   * ```
   */
  findRelated(conceptName: string, limit: number): Promise<Concept[]>;
  
  /**
   * Search concepts by text query using vector search.
   * 
   * Finds concepts that match the query text using semantic search.
   * This is useful for exploratory queries where you don't know the
   * exact concept name.
   * 
   * **Use Cases**:
   * - "What concepts relate to X?"
   * - Fuzzy concept lookup
   * - Concept discovery
   * 
   * **Performance**: O(log n) vector search
   * 
   * @param queryText - Text query to search for (natural language or keywords)
   * @param limit - Maximum concepts to return
   * @returns Promise resolving to matching concepts sorted by relevance
   * @throws {Error} If database query fails
   * 
   * @example
   * ```typescript
   * const concepts = await conceptRepo.searchConcepts('software design', 5);
   * concepts.forEach(c => {
   *   console.log(`${c.concept} - ${c.category}`);
   * });
   * // Output might include:
   * // - design patterns - software engineering
   * // - SOLID principles - software design
   * // - clean architecture - software architecture
   * ```
   */
  searchConcepts(queryText: string, limit: number): Promise<Concept[]>;
}

