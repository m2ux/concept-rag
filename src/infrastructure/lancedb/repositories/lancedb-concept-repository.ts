import * as lancedb from "@lancedb/lancedb";
import { ConceptRepository } from '../../../domain/interfaces/repositories/concept-repository.js';
import { Concept } from '../../../domain/models/index.js';
import { ConceptNotFoundError, InvalidEmbeddingsError } from '../../../domain/exceptions.js';
import { DatabaseError } from '../../../domain/exceptions/index.js';
import { parseJsonField, escapeSqlString } from '../utils/field-parsers.js';
import { validateConceptRow, detectVectorField } from '../utils/schema-validators.js';
// @ts-expect-error - Type narrowing limitation
import type { Option } from "../../../../__tests__/test-helpers/../../domain/functional/index.js";
import { Some, None } from '../../../domain/functional/option.js';

/**
 * LanceDB implementation of ConceptRepository
 */
export class LanceDBConceptRepository implements ConceptRepository {
  constructor(private conceptsTable: lancedb.Table) {}
  
  /**
   * Find concept by ID.
   * @param id - Concept ID
   * @returns Some(concept) if found, None otherwise
   * @throws {DatabaseError} If database query fails
   * @throws {InvalidEmbeddingsError} If concept has invalid embeddings
   */
  async findById(id: number): Promise<Option<Concept>> {
    try {
      const results = await this.conceptsTable
        .query()
        .where(`id = ${id}`)
        .limit(1)
        .toArray();
      
      if (results.length === 0) {
        return None();
      }
      
      const row = results[0];
      
      try {
        validateConceptRow(row);
      } catch (validationError) {
        console.error(`⚠️  Schema validation failed for concept ID ${id}:`, validationError);
        throw validationError;
      }
      
      return Some(this.mapRowToConcept(row));
    } catch (error) {
      if (error instanceof ConceptNotFoundError || error instanceof InvalidEmbeddingsError) {
        throw error;
      }
      throw new DatabaseError(
        `Failed to find concept by ID ${id}`,
        'query',
        error as Error
      );
    }
  }
  
  /**
   * Find concept by name (case-insensitive).
   * @param conceptName - Name of the concept
   * @returns Some(concept) if found, None otherwise
   * @throws {DatabaseError} If database query fails
   * @throws {InvalidEmbeddingsError} If concept has invalid embeddings
   */
  async findByName(conceptName: string): Promise<Option<Concept>> {
    const conceptLower = conceptName.toLowerCase().trim();
    
    try {
      // Escape single quotes to prevent SQL injection
      const escaped = escapeSqlString(conceptLower);
      
      // Use SQL-like query for exact match with escaped input
      const results = await this.conceptsTable
        .query()
        .where(`concept = '${escaped}'`)
        .limit(1)
        .toArray();
      
      if (results.length === 0) {
        return None();  // Concept not found (not an error, just return None)
      }
      
      const row = results[0];
      
      // Validate schema before mapping
      try {
        validateConceptRow(row);
      } catch (validationError) {
        // Schema validation failed - this indicates database integrity issue
        console.error(`⚠️  Schema validation failed for concept "${conceptName}":`, validationError);
        throw validationError;  // Re-throw to caller
      }
      
      return Some(this.mapRowToConcept(row));
    } catch (error) {
      // Wrap database errors in domain exception
      if (error instanceof ConceptNotFoundError || error instanceof InvalidEmbeddingsError) {
        throw error;  // Already a domain exception
      }
      throw new DatabaseError(
        `Failed to find concept "${conceptName}"`,
        'query',
        error as Error
      );
    }
  }
  
  
  async findRelated(conceptName: string, limit: number): Promise<Concept[]> {
    // Get the concept first to use its embedding
    const concept = await this.findByName(conceptName);
    if (!concept) return [];
    
    // Vector search using concept's embedding to find similar concepts
    const results = await this.conceptsTable
      .vectorSearch(concept.embeddings)
      .limit(limit + 1)  // +1 because first result will be the concept itself
      .toArray();
    
    // Filter out the original concept and map to domain models
    return results
      .filter((row: any) => row.concept.toLowerCase() !== conceptName.toLowerCase())
      .slice(0, limit)
      .map((row: any) => this.mapRowToConcept(row));
  }
  
  async searchConcepts(_queryText: string, limit: number): Promise<Concept[]> {
    // This requires embedding service - will be enhanced when QueryExpander is refactored
    // For now, simple query
    const results = await this.conceptsTable
      .query()
      .limit(limit)
      .toArray();
    
    return results.map((row: any) => this.mapRowToConcept(row));
  }
  
  /**
   * Load all concepts from the database.
   * Used for initializing ConceptIdCache and analytics.
   * 
   * **Note**: This includes database IDs in the returned concepts (as extended property).
   * The Concept domain model doesn't have an id field, but we attach it for cache initialization.
   */
  async findAll(): Promise<Concept[]> {
    try {
      // Load all concepts from database
      // LanceDB query() has a default limit of 10 rows (safety feature)
      // Concepts table can have 10k-100k+ concepts, so we need an explicit high limit
      const results = await this.conceptsTable
        .query()
        .limit(100000) // High limit to ensure all concepts are loaded (10x safety margin over typical max)
        .toArray();
      
      // Map to Concept domain models and attach IDs
      return results.map((row: any) => {
        const concept = this.mapRowToConcept(row);
        // Attach ID as extended property for cache initialization
        (concept as any).id = row.id;
        return concept;
      });
    } catch (error) {
      console.error('[ConceptRepository] Error in findAll:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(
        `Failed to load all concepts from database: ${errorMessage}`,
        'query',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
  
  private mapRowToConcept(row: any): Concept {
    // Detect which field contains the vector (handles 'vector' vs 'embeddings' naming)
    const vectorField = detectVectorField(row);
    const embeddings = vectorField ? row[vectorField] : [];
    
    // Helper to parse array fields (handles native arrays, Arrow Vectors, and JSON strings)
    const parseArrayField = <T>(value: any): T[] => {
      if (!value) return [];
      if (Array.isArray(value)) return value;
      if (typeof value === 'object' && 'toArray' in value) {
        // Arrow Vector - convert to JavaScript array
        return Array.from(value.toArray());
      }
      if (typeof value === 'string') {
        return parseJsonField(value);
      }
      return [];
    };
    
    // Parse catalog_ids (native array, Arrow Vector, or JSON string)
    const catalogIds = parseArrayField<number>(row.catalog_ids);
    
    // Parse related_concept_ids (native array, Arrow Vector, or JSON string)
    const relatedConceptIds = parseArrayField<number>(row.related_concept_ids);
    
    return {
      concept: row.concept || '',
      catalogIds,
      relatedConceptIds,
      relatedConcepts: parseArrayField(row.related_concepts),
      synonyms: parseArrayField(row.synonyms),
      broaderTerms: parseArrayField(row.broader_terms),
      narrowerTerms: parseArrayField(row.narrower_terms),
      embeddings,
      weight: row.weight || 0
    };
  }
}

