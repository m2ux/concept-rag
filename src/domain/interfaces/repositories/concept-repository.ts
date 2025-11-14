import { Concept } from '../../models/index.js';

/**
 * Repository interface for concept data access
 */
export interface ConceptRepository {
  /**
   * Find concept by exact name match
   * 
   * @param conceptName - Name of concept to find
   * @returns Concept if found, null otherwise
   */
  findByName(conceptName: string): Promise<Concept | null>;
  
  /**
   * Find related concepts using vector similarity
   * 
   * @param conceptName - Name of concept to find relations for
   * @param limit - Maximum related concepts to return
   * @returns Related concepts sorted by similarity
   */
  findRelated(conceptName: string, limit: number): Promise<Concept[]>;
  
  /**
   * Search concepts by text query using vector search
   * 
   * @param queryText - Text to search for
   * @param limit - Maximum concepts to return
   * @returns Matching concepts sorted by relevance
   */
  searchConcepts(queryText: string, limit: number): Promise<Concept[]>;
}

