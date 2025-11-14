import * as lancedb from "@lancedb/lancedb";
import { ChunkRepository } from '../../../domain/interfaces/repositories/chunk-repository.js';
import { ConceptRepository } from '../../../domain/interfaces/repositories/concept-repository.js';
import { EmbeddingService } from '../../../domain/interfaces/services/embedding-service.js';
import { Chunk, SearchQuery, SearchResult } from '../../../domain/models/index.js';

/**
 * LanceDB implementation of ChunkRepository
 * 
 * Uses vector search for efficient querying - does NOT load all data.
 * Performance: O(log n) vector search vs O(n) full scan.
 */
export class LanceDBChunkRepository implements ChunkRepository {
  constructor(
    private chunksTable: lancedb.Table,
    private conceptRepo: ConceptRepository,
    private embeddingService: EmbeddingService
  ) {}
  
  /**
   * Find chunks by concept name using efficient vector search
   * 
   * Strategy:
   * 1. Get concept's embedding vector from concept table
   * 2. Use vector search to find similar chunks
   * 3. Filter to chunks that actually contain the concept
   * 
   * This is MUCH faster than loading all chunks into memory.
   */
  async findByConceptName(concept: string, limit: number): Promise<Chunk[]> {
    const conceptLower = concept.toLowerCase().trim();
    
    // Get concept record to use its embedding for vector search
    const conceptRecord = await this.conceptRepo.findByName(conceptLower);
    
    if (!conceptRecord) {
      console.error(`⚠️  Concept "${concept}" not found in concept table`);
      return [];
    }
    
    // Use concept's embedding for vector search (efficient!)
    const candidates = await this.chunksTable
      .vectorSearch(conceptRecord.embeddings)
      .limit(limit * 3)  // Get extra candidates for filtering
      .toArray();
    
    // Filter to chunks that actually contain the concept
    const matches: Chunk[] = [];
    for (const row of candidates) {
      const chunk = this.mapRowToChunk(row);
      
      // Check if concept is in chunk's concept list
      if (this.chunkContainsConcept(chunk, conceptLower)) {
        matches.push(chunk);
        if (matches.length >= limit) break;
      }
    }
    
    return matches;
  }
  
  async findBySource(source: string, limit: number): Promise<Chunk[]> {
    // LanceDB doesn't support SQL WHERE on non-indexed columns efficiently
    // Best approach: vector search + filter, or use source as query
    const sourceEmbedding = this.embeddingService.generateEmbedding(source);
    
    const results = await this.chunksTable
      .vectorSearch(sourceEmbedding)
      .limit(limit * 2)  // Get extra for filtering
      .toArray();
    
    return results
      .filter((row: any) => row.source && row.source.toLowerCase().includes(source.toLowerCase()))
      .slice(0, limit)
      .map((row: any) => this.mapRowToChunk(row));
  }
  
  async search(query: SearchQuery): Promise<SearchResult[]> {
    // This will be enhanced when ConceptualSearchClient is refactored
    // For now, basic vector search
    const queryEmbedding = this.embeddingService.generateEmbedding(query.text);
    const limit = query.limit || 10;
    
    const results = await this.chunksTable
      .vectorSearch(queryEmbedding)
      .limit(limit)
      .toArray();
    
    return results.map((row: any) => this.mapRowToSearchResult(row));
  }
  
  async countChunks(): Promise<number> {
    return await this.chunksTable.countRows();
  }
  
  // Helper methods
  
  private chunkContainsConcept(chunk: Chunk, concept: string): boolean {
    if (!chunk.concepts || chunk.concepts.length === 0) {
      return false;
    }
    
    return chunk.concepts.some((c: string) => {
      const cLower = c.toLowerCase();
      return cLower === concept || 
             cLower.includes(concept) || 
             concept.includes(cLower);
    });
  }
  
  private mapRowToChunk(row: any): Chunk {
    return {
      id: row.id || '',
      text: row.text || '',
      source: row.source || '',
      hash: row.hash || '',
      concepts: this.parseJsonField(row.concepts),
      conceptCategories: this.parseJsonField(row.concept_categories),
      conceptDensity: row.concept_density || 0
    };
  }
  
  private mapRowToSearchResult(row: any): SearchResult {
    const chunk = this.mapRowToChunk(row);
    const vectorScore = 1 - (row._distance || 0);
    
    return {
      ...chunk,
      distance: row._distance || 0,
      vectorScore: vectorScore,
      bm25Score: 0,  // Will be computed in full search implementation
      titleScore: 0,
      conceptScore: 0,
      wordnetScore: 0,
      hybridScore: vectorScore
    };
  }
  
  private parseJsonField(field: any): string[] {
    if (!field) return [];
    if (Array.isArray(field)) return field;
    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch {
        return [];
      }
    }
    return [];
  }
}

