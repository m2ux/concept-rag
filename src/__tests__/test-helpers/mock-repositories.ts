/**
 * Mock Repository Implementations (Test Doubles)
 * 
 * Provides "Fake" implementations of repository interfaces for testing.
 * These are working implementations with simplified in-memory storage.
 * 
 * Based on "Test Doubles" pattern from:
 * - "Test Driven Development for Embedded C" (Grenning), Chapter 7
 * - "Continuous Delivery" (Humble & Farley), Testing with Dependency Injection
 * 
 * A "Fake" is a working implementation that takes shortcuts to make testing easier
 * (e.g., in-memory storage instead of database).
 */

import {
  ChunkRepository,
  ConceptRepository,
  CatalogRepository
} from '../../domain/interfaces/repositories/index.js';
import {
  Chunk,
  Concept,
  SearchQuery,
  SearchResult
} from '../../domain/models/index.js';

/**
 * Fake ChunkRepository using in-memory Map
 * 
 * Implements ChunkRepository interface with simple in-memory storage.
 * Useful for testing tools without database dependencies.
 */
export class FakeChunkRepository implements ChunkRepository {
  private chunks: Map<string, Chunk> = new Map();
  
  constructor(initialChunks: Chunk[] = []) {
    initialChunks.forEach(chunk => this.chunks.set(chunk.id, chunk));
  }
  
  async findByConceptName(conceptName: string, limit: number): Promise<Chunk[]> {
    const conceptLower = conceptName.toLowerCase();
    const results = Array.from(this.chunks.values())
      .filter(chunk => chunk.concepts?.some((c: string) => c.toLowerCase() === conceptLower))
      .slice(0, limit);
    return Promise.resolve(results);
  }
  
  async findBySource(sourcePath: string, limit: number): Promise<Chunk[]> {
    const results = Array.from(this.chunks.values())
      .filter(chunk => chunk.source === sourcePath)
      .slice(0, limit);
    return Promise.resolve(results);
  }
  
  async search(query: SearchQuery): Promise<SearchResult[]> {
    const queryLower = query.text.toLowerCase();
    const results = Array.from(this.chunks.values())
      .filter(chunk => {
        // Simple text matching for test purposes
        const textMatch = chunk.text.toLowerCase().includes(queryLower);
        const sourceMatch = !query.sourceFilter || chunk.source.includes(query.sourceFilter);
        return textMatch && sourceMatch;
      })
      .slice(0, query.limit || 10)
      .map(chunk => this.chunkToSearchResult(chunk));
    
    return Promise.resolve(results);
  }
  
  private chunkToSearchResult(chunk: Chunk): SearchResult {
    return {
      ...chunk,
      distance: 0.2,
      vectorScore: 0.8,
      bm25Score: 0.7,
      titleScore: 0.5,
      conceptScore: 0.6,
      wordnetScore: 0.4,
      hybridScore: 0.67
    };
  }
  
  async countChunks(): Promise<number> {
    return Promise.resolve(this.chunks.size);
  }
  
  // Test helpers
  addChunk(chunk: Chunk): void {
    this.chunks.set(chunk.id, chunk);
  }
  
  clear(): void {
    this.chunks.clear();
  }
  
  size(): number {
    return this.chunks.size;
  }
}

/**
 * Fake ConceptRepository using in-memory Map
 * 
 * Implements ConceptRepository interface with simple in-memory storage.
 */
export class FakeConceptRepository implements ConceptRepository {
  private concepts: Map<string, Concept> = new Map();
  
  constructor(initialConcepts: Concept[] = []) {
    initialConcepts.forEach(concept => 
      this.concepts.set(concept.concept.toLowerCase(), concept)
    );
  }
  
  async findByName(name: string): Promise<Concept | null> {
    const conceptLower = name.toLowerCase();
    const concept = this.concepts.get(conceptLower);
    return Promise.resolve(concept || null);
  }
  
  async findRelated(conceptName: string, limit: number): Promise<Concept[]> {
    const concept = await this.findByName(conceptName);
    if (!concept) return [];
    
    // Return concepts listed in relatedConcepts
    const related: Concept[] = [];
    for (const relatedName of concept.relatedConcepts || []) {
      const relatedConcept = await this.findByName(relatedName);
      if (relatedConcept) {
        related.push(relatedConcept);
        if (related.length >= limit) break;
      }
    }
    
    return related;
  }
  
  async searchConcepts(queryText: string, limit: number): Promise<Concept[]> {
    const queryLower = queryText.toLowerCase();
    const results = Array.from(this.concepts.values())
      .filter(concept => 
        concept.concept.toLowerCase().includes(queryLower) ||
        concept.synonyms?.some(s => s.toLowerCase().includes(queryLower))
      )
      .slice(0, limit);
    
    return Promise.resolve(results);
  }
  
  async findAll(): Promise<Concept[]> {
    return Promise.resolve(Array.from(this.concepts.values()));
  }
  
  // Test helpers
  addConcept(concept: Concept): void {
    this.concepts.set(concept.concept.toLowerCase(), concept);
  }
  
  clear(): void {
    this.concepts.clear();
  }
  
  size(): number {
    return this.concepts.size;
  }
}

/**
 * Fake CatalogRepository using in-memory Map
 * 
 * Implements CatalogRepository interface with simple in-memory storage.
 */
export class FakeCatalogRepository implements CatalogRepository {
  private documents: Map<string, SearchResult> = new Map();
  
  constructor(initialDocuments: SearchResult[] = []) {
    initialDocuments.forEach(doc => this.documents.set(doc.id, doc));
  }
  
  async search(query: SearchQuery): Promise<SearchResult[]> {
    const queryLower = query.text.toLowerCase();
    const results = Array.from(this.documents.values())
      .filter(doc => {
        const textMatch = doc.text.toLowerCase().includes(queryLower);
        const sourceMatch = !query.sourceFilter || doc.source.includes(query.sourceFilter);
        return textMatch && sourceMatch;
      })
      .slice(0, query.limit || 5);
    
    return Promise.resolve(results);
  }
  
  async findBySource(sourcePath: string): Promise<SearchResult | null> {
    const results = Array.from(this.documents.values())
      .filter(doc => doc.source === sourcePath);
    
    return Promise.resolve(results[0] || null);
  }
  
  async findByCategory(_categoryId: number): Promise<SearchResult[]> {
    // Simple mock: return all documents for testing
    // In real tests, you'd filter by category_ids
    return Promise.resolve(Array.from(this.documents.values()));
  }
  
  async getConceptsInCategory(_categoryId: number): Promise<number[]> {
    // Simple mock: return empty array for testing
    // In real tests, you'd aggregate concepts from documents
    return Promise.resolve([]);
  }
  
  // Test helpers
  addDocument(doc: SearchResult): void {
    this.documents.set(doc.id, doc);
  }
  
  clear(): void {
    this.documents.clear();
  }
  
  size(): number {
    return this.documents.size;
  }
}

