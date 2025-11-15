import * as lancedb from "@lancedb/lancedb";
import { ConceptRepository } from '../../../domain/interfaces/repositories/concept-repository.js';
import { Concept } from '../../../domain/models/index.js';
import { parseJsonField, escapeSqlString } from '../utils/field-parsers.js';

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
      
      if (results.length === 0) return null;
      
      return this.mapRowToConcept(results[0]);
    } catch (error) {
      console.error(`Error finding concept "${conceptName}":`, error);
      return null;
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
  
  private mapRowToConcept(row: any): Concept {
    return {
      concept: row.concept || '',
      conceptType: row.concept_type || 'thematic',
      category: row.category || '',
      sources: parseJsonField(row.sources),
      relatedConcepts: parseJsonField(row.related_concepts),
      synonyms: parseJsonField(row.synonyms),
      broaderTerms: parseJsonField(row.broader_terms),
      narrowerTerms: parseJsonField(row.narrower_terms),
      embeddings: row.vector || row.embeddings || [],  // Check 'vector' first (LanceDB column name), then fall back to 'embeddings'
      weight: row.weight || 0,
      chunkCount: row.chunk_count || 0,
      enrichmentSource: row.enrichment_source || 'corpus'
    };
  }
}

