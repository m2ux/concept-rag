import * as lancedb from "@lancedb/lancedb";
import { ConceptRepository } from '../../../domain/interfaces/repositories/concept-repository.js';
import { Concept } from '../../../domain/models/index.js';
import { ConceptNotFoundError, InvalidEmbeddingsError, DatabaseOperationError } from '../../../domain/exceptions.js';
import { parseJsonField, escapeSqlString } from '../utils/field-parsers.js';
import { validateConceptRow, detectVectorField } from '../utils/schema-validators.js';

/**
 * LanceDB implementation of ConceptRepository
 */
export class LanceDBConceptRepository implements ConceptRepository {
  constructor(private conceptsTable: lancedb.Table) {}
  
  async findByName(conceptName: string): Promise<Concept | null> {
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
        return null;  // Concept not found (not an error, just return null)
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
      
      return this.mapRowToConcept(row);
    } catch (error) {
      // Wrap database errors in domain exception
      if (error instanceof ConceptNotFoundError || error instanceof InvalidEmbeddingsError) {
        throw error;  // Already a domain exception
      }
      throw new DatabaseOperationError(
        `Failed to find concept "${conceptName}"`,
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
      const results = await this.conceptsTable
        .query()
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
      throw new DatabaseOperationError(
        `Failed to load all concepts from database: ${errorMessage}`,
        error instanceof Error ? error : new Error(String(error)),
        { operation: 'find_all_concepts' }
      );
    }
  }
  
  private mapRowToConcept(row: any): Concept {
    // Detect which field contains the vector (handles 'vector' vs 'embeddings' naming)
    const vectorField = detectVectorField(row);
    const embeddings = vectorField ? row[vectorField] : [];
    
    return {
      concept: row.concept || '',
      conceptType: row.concept_type || 'thematic',
      category: row.category || '',
      sources: parseJsonField(row.sources),
      relatedConcepts: parseJsonField(row.related_concepts),
      synonyms: parseJsonField(row.synonyms),
      broaderTerms: parseJsonField(row.broader_terms),
      narrowerTerms: parseJsonField(row.narrower_terms),
      embeddings,  // Now uses detected vector field
      weight: row.weight || 0,
      chunkCount: row.chunk_count || 0,
      enrichmentSource: row.enrichment_source || 'corpus'
    };
  }
}

