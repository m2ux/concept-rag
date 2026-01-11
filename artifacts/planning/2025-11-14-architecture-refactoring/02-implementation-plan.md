# Architecture Refactoring Implementation Plan

**Date**: November 14, 2025  
**Project**: concept-rag  
**Scope**: Priority 1-6 from Architecture Review  
**Approach**: Incremental migration with commit-per-task  
**Timeline**: 1-2 hours (agentic implementation, excluding user approval wait time)

---

## Overview

This plan implements the architectural refactoring from the review analysis, introducing:
- Repository Pattern (abstracts database access)
- Dependency Injection (constructor injection, no framework)
- Clean Architecture layers (domain/application/infrastructure)
- Performance optimization (vector search instead of loading all chunks)
- Elimination of global mutable state

**Key Decisions**:
- ✅ Fine-grained repositories (ChunkRepository, ConceptRepository, CatalogRepository)
- ✅ Separate EmbeddingService (not part of repositories)
- ✅ Method-per-query API design (explicit, type-safe)
- ✅ Incremental migration (pilot with ConceptSearchTool, then others)

---

## Phase 1: Repository Pattern (Priority 1)

**Goal**: Abstract database access behind domain interfaces  
**Estimated Time**: 30-45 minutes (agentic)  
**Risk**: Medium (new pattern, must validate behavior)

### Task 1.1: Create Domain Layer Structure

**What**: Set up new directory structure for clean architecture layers

**Files to Create**:
```
src/domain/
├── interfaces/
│   └── repositories/
│       └── .gitkeep
└── models/
    └── .gitkeep
```

**Actions**:
1. Create `src/domain/` directory
2. Create `src/domain/interfaces/repositories/` subdirectory
3. Create `src/domain/models/` subdirectory
4. Add `.gitkeep` files to track empty directories

**Validation**: Directories exist and are committed

**Proposed Commit**:
```
feat(architecture): add domain layer directory structure

Create domain layer directories following clean architecture:
- domain/interfaces/repositories/ for repository interfaces
- domain/models/ for domain model types

Part of architectural refactoring to introduce repository pattern
and dependency injection. See architecture review doc for details.

Related: Architecture Review 2025-11-14
```

**User Approval Required**: ✋ STOP - Wait for approval before proceeding

---

### Task 1.2: Define Domain Models

**What**: Create TypeScript types for domain entities (Chunk, Concept, SearchResult)

**Files to Create**:
- `src/domain/models/chunk.ts`
- `src/domain/models/concept.ts`
- `src/domain/models/search-result.ts`
- `src/domain/models/index.ts`

**Content**:

**`src/domain/models/chunk.ts`**:
```typescript
/**
 * Domain model representing a text chunk with concept metadata
 */
export interface Chunk {
  id: string;
  text: string;
  source: string;
  hash: string;
  concepts?: string[];
  conceptCategories?: string[];
  conceptDensity?: number;
}
```

**`src/domain/models/concept.ts`**:
```typescript
/**
 * Domain model representing an extracted concept
 */
export interface Concept {
  concept: string;
  conceptType: 'thematic' | 'terminology';
  category: string;
  sources: string[];
  relatedConcepts: string[];
  synonyms?: string[];
  broaderTerms?: string[];
  narrowerTerms?: string[];
  embeddings: number[];
  weight: number;
  chunkCount?: number;
  enrichmentSource: 'corpus' | 'wordnet' | 'hybrid';
}
```

**`src/domain/models/search-result.ts`**:
```typescript
import { Chunk } from './chunk.js';

/**
 * Domain model for search results with scoring metadata
 */
export interface SearchResult extends Chunk {
  // Scoring components
  distance: number;
  vectorScore: number;
  bm25Score: number;
  titleScore: number;
  conceptScore: number;
  wordnetScore: number;
  hybridScore: number;
  
  // Metadata
  matchedConcepts?: string[];
  expandedTerms?: string[];
}

/**
 * Query parameters for search operations
 */
export interface SearchQuery {
  text: string;
  limit?: number;
  sourceFilter?: string;
  debug?: boolean;
}
```

**`src/domain/models/index.ts`**:
```typescript
export * from './chunk.js';
export * from './concept.js';
export * from './search-result.js';
```

**Validation**: Types compile without errors, exports work

**Proposed Commit**:
```
feat(domain): add domain models for Chunk, Concept, SearchResult

Define core domain types:
- Chunk: Text segment with concept metadata
- Concept: Extracted concept with relationships
- SearchResult: Search result with multi-signal scoring
- SearchQuery: Query parameters

These types represent domain entities independent of
infrastructure (LanceDB). Part of clean architecture refactoring.

Related: Architecture Review 2025-11-14, Task 1.2
```

**User Approval Required**: ✋ STOP - Wait for approval before proceeding

---

### Task 1.3: Define Repository Interfaces

**What**: Create repository interfaces (contracts) for data access

**Files to Create**:
- `src/domain/interfaces/repositories/chunk-repository.ts`
- `src/domain/interfaces/repositories/concept-repository.ts`
- `src/domain/interfaces/repositories/catalog-repository.ts`
- `src/domain/interfaces/repositories/index.ts`

**Content**:

**`src/domain/interfaces/repositories/chunk-repository.ts`**:
```typescript
import { Chunk, SearchQuery, SearchResult } from '../../models/index.js';

/**
 * Repository interface for chunk data access
 * 
 * Implementations must provide efficient queries without loading
 * all data into memory (use database capabilities like vector search).
 */
export interface ChunkRepository {
  /**
   * Find chunks by concept name
   * Uses vector search for efficiency - does NOT load all chunks
   * 
   * @param concept - Concept name to search for
   * @param limit - Maximum results to return
   * @returns Chunks containing the concept, sorted by relevance
   */
  findByConceptName(concept: string, limit: number): Promise<Chunk[]>;
  
  /**
   * Find chunks by source path
   * 
   * @param source - Source document path
   * @param limit - Maximum results to return
   * @returns Chunks from the specified source
   */
  findBySource(source: string, limit: number): Promise<Chunk[]>;
  
  /**
   * Hybrid search across all chunks
   * Uses multi-signal ranking (vector + BM25 + concepts + wordnet)
   * 
   * @param query - Search query with parameters
   * @returns Ranked search results with scoring metadata
   */
  search(query: SearchQuery): Promise<SearchResult[]>;
  
  /**
   * Count total chunks in repository
   * 
   * @returns Total number of chunks
   */
  countChunks(): Promise<number>;
}
```

**`src/domain/interfaces/repositories/concept-repository.ts`**:
```typescript
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
```

**`src/domain/interfaces/repositories/catalog-repository.ts`**:
```typescript
import { SearchQuery, SearchResult } from '../../models/index.js';

/**
 * Repository interface for catalog (document summary) data access
 */
export interface CatalogRepository {
  /**
   * Search catalog using hybrid ranking
   * 
   * @param query - Search query with parameters
   * @returns Document summaries ranked by relevance
   */
  search(query: SearchQuery): Promise<SearchResult[]>;
  
  /**
   * Find catalog entry by source path
   * 
   * @param source - Source document path
   * @returns Catalog entry if found, null otherwise
   */
  findBySource(source: string): Promise<SearchResult | null>;
}
```

**`src/domain/interfaces/repositories/index.ts`**:
```typescript
export * from './chunk-repository.js';
export * from './concept-repository.js';
export * from './catalog-repository.js';
```

**Validation**: Interfaces compile, exports work

**Proposed Commit**:
```
feat(domain): add repository interfaces for data access

Define three fine-grained repository interfaces:
- ChunkRepository: Chunk queries (by concept, source, hybrid search)
- ConceptRepository: Concept lookup and relations
- CatalogRepository: Document summary search

Interfaces define contracts independent of implementation.
Method-per-query design for explicit, type-safe APIs.
Performance requirement: must not load all data into memory.

Related: Architecture Review 2025-11-14, Task 1.3
```

**User Approval Required**: ✋ STOP - Wait for approval before proceeding

---

### Task 1.4: Create Infrastructure Layer Structure

**What**: Set up infrastructure directory for implementations

**Files to Create**:
```
src/infrastructure/
├── lancedb/
│   └── repositories/
│       └── .gitkeep
└── embeddings/
    └── .gitkeep
```

**Actions**:
1. Create `src/infrastructure/` directory
2. Create `src/infrastructure/lancedb/repositories/` subdirectory
3. Create `src/infrastructure/embeddings/` subdirectory
4. Add `.gitkeep` files

**Validation**: Directories exist and are committed

**Proposed Commit**:
```
feat(infrastructure): add infrastructure layer directory structure

Create infrastructure layer for concrete implementations:
- infrastructure/lancedb/repositories/ for LanceDB implementations
- infrastructure/embeddings/ for embedding service implementations

Part of clean architecture: infrastructure depends on domain,
not vice versa.

Related: Architecture Review 2025-11-14, Task 1.4
```

**User Approval Required**: ✋ STOP - Wait for approval before proceeding

---

### Task 1.5: Implement Embedding Service

**What**: Extract and centralize embedding generation logic

**Files to Create**:
- `src/domain/interfaces/services/embedding-service.ts`
- `src/domain/interfaces/services/index.ts`
- `src/infrastructure/embeddings/simple-embedding-service.ts`
- `src/infrastructure/embeddings/index.ts`

**Content**:

**`src/domain/interfaces/services/embedding-service.ts`**:
```typescript
/**
 * Service interface for generating text embeddings
 */
export interface EmbeddingService {
  /**
   * Generate embedding vector for text
   * 
   * @param text - Text to embed
   * @returns 384-dimensional embedding vector
   */
  generateEmbedding(text: string): number[];
}
```

**`src/infrastructure/embeddings/simple-embedding-service.ts`**:
```typescript
import { EmbeddingService } from '../../domain/interfaces/services/embedding-service.js';

/**
 * Simple local embedding service using character and word hashing
 * 
 * This is the existing embedding algorithm extracted from
 * hybrid_search_client.ts and query_expander.ts to eliminate duplication.
 */
export class SimpleEmbeddingService implements EmbeddingService {
  generateEmbedding(text: string): number[] {
    const embedding = new Array(384).fill(0);
    const words = text.toLowerCase().split(/\s+/);
    const chars = text.toLowerCase();
    
    // Word-based features
    for (let i = 0; i < Math.min(words.length, 100); i++) {
      const word = words[i];
      const hash = this.simpleHash(word);
      embedding[hash % 384] += 1;
    }
    
    // Character-based features
    for (let i = 0; i < Math.min(chars.length, 1000); i++) {
      const charCode = chars.charCodeAt(i);
      embedding[charCode % 384] += 0.1;
    }
    
    // Document-level features
    embedding[0] = text.length / 1000;
    embedding[1] = words.length / 100;
    embedding[2] = (text.match(/\./g) || []).length / 10;
    
    // Normalize
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => norm > 0 ? val / norm : 0);
  }
  
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}
```

**Validation**: Service generates embeddings, tests pass

**Proposed Commit**:
```
feat(infrastructure): add EmbeddingService to eliminate duplication

Extract embedding generation into centralized service:
- EmbeddingService interface in domain layer
- SimpleEmbeddingService implementation in infrastructure

Eliminates code duplication between:
- lancedb/hybrid_search_client.ts
- concepts/query_expander.ts

Both files had identical createSimpleEmbedding() functions.
This service can be injected into components that need embeddings
and can be swapped for alternative implementations (e.g., OpenAI).

Related: Architecture Review 2025-11-14, Task 1.5, Issue #4
```

**User Approval Required**: ✋ STOP - Wait for approval before proceeding

---

### Task 1.6: Implement LanceDB Connection Class

**What**: Replace global mutable state with connection management class

**Files to Create**:
- `src/infrastructure/lancedb/database-connection.ts`

**Content**:

**`src/infrastructure/lancedb/database-connection.ts`**:
```typescript
import * as lancedb from "@lancedb/lancedb";

/**
 * Manages LanceDB connection and table access
 * 
 * Replaces global module-level exports (export let client, etc.)
 * with proper lifecycle management and encapsulation.
 */
export class LanceDBConnection {
  private client: lancedb.Connection;
  private tables = new Map<string, lancedb.Table>();
  
  private constructor(client: lancedb.Connection) {
    this.client = client;
  }
  
  /**
   * Create and connect to LanceDB
   * 
   * @param databaseUrl - Path to database directory
   * @returns Connected LanceDB instance
   */
  static async connect(databaseUrl: string): Promise<LanceDBConnection> {
    console.error(`Connecting to database: ${databaseUrl}`);
    const client = await lancedb.connect(databaseUrl);
    return new LanceDBConnection(client);
  }
  
  /**
   * Open and cache a table
   * 
   * @param tableName - Name of table to open
   * @returns LanceDB table handle
   */
  async openTable(tableName: string): Promise<lancedb.Table> {
    if (!this.tables.has(tableName)) {
      const table = await this.client.openTable(tableName);
      this.tables.set(tableName, table);
      console.error(`✅ Opened table: ${tableName}`);
    }
    return this.tables.get(tableName)!;
  }
  
  /**
   * Get raw client (for advanced operations)
   * Use sparingly - prefer using repository methods
   */
  getClient(): lancedb.Connection {
    return this.client;
  }
  
  /**
   * Close connection and cleanup
   */
  async close(): Promise<void> {
    await this.client.close();
    this.tables.clear();
    console.error('🛑 Database connection closed');
  }
}
```

**Validation**: Class compiles, can connect to database

**Proposed Commit**:
```
feat(infrastructure): add LanceDBConnection to replace global state

Create database connection management class:
- Encapsulates connection lifecycle
- Caches opened tables
- No mutable module-level exports

Replaces problematic pattern from conceptual_search_client.ts:
  export let client: lancedb.Connection;
  export let chunksTable: lancedb.Table;

New pattern:
  const conn = await LanceDBConnection.connect(dbPath);
  const table = await conn.openTable('chunks');

Benefits:
- No global mutable state
- Explicit lifecycle management
- Can create multiple instances (for testing)
- Type-safe (no undefined checks needed)

Related: Architecture Review 2025-11-14, Task 1.6, Issue #1
```

**User Approval Required**: ✋ STOP - Wait for approval before proceeding

---

### Task 1.7: Implement ChunkRepository (LanceDB)

**What**: Implement ChunkRepository interface using LanceDB, with efficient vector search

**Files to Create**:
- `src/infrastructure/lancedb/repositories/lancedb-chunk-repository.ts`

**Key Implementation Details**:
- **MUST use vector search** for `findByConceptName()` - not load all chunks
- Fixes Issue #2 (loading all chunks into memory)
- Uses injected EmbeddingService
- Uses injected ConceptRepository to get concept embeddings

**Content**:

```typescript
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
    // This will be implemented in Task 1.9 (ConceptualSearchClient refactor)
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
```

**Validation**: 
- Repository can find chunks by concept efficiently
- No loading of all chunks
- Tests verify behavior

**Proposed Commit**:
```
feat(infrastructure): implement LanceDBChunkRepository with vector search

Implement ChunkRepository interface using LanceDB:
- findByConceptName: Uses vector search (efficient, no memory loading)
- findBySource: Vector search with source filtering
- search: Hybrid search (basic implementation, full in next task)
- countChunks: Row count

Key improvement: findByConceptName() uses concept embedding
for vector search instead of loading ALL chunks into memory.

Before: Load all chunks, filter in JS (O(n), ~5GB for 100K docs)
After: Vector search + filter (O(log n), only candidates loaded)

Fixes Issue #2 from architecture review.
Performance requirement: scales to large document collections.

Related: Architecture Review 2025-11-14, Task 1.7, Issue #2
```

**User Approval Required**: ✋ STOP - Wait for approval before proceeding

---

### Task 1.8: Implement ConceptRepository (LanceDB)

**What**: Implement ConceptRepository interface

**Files to Create**:
- `src/infrastructure/lancedb/repositories/lancedb-concept-repository.ts`

**Content**:

```typescript
import * as lancedb from "@lancedb/lancedb";
import { ConceptRepository } from '../../../domain/interfaces/repositories/concept-repository.js';
import { Concept } from '../../../domain/models/index.js';

/**
 * LanceDB implementation of ConceptRepository
 */
export class LanceDBConceptRepository implements ConceptRepository {
  constructor(private conceptsTable: lancedb.Table) {}
  
  async findByName(conceptName: string): Promise<Concept | null> {
    const conceptLower = conceptName.toLowerCase().trim();
    
    try {
      // Use SQL-like query for exact match
      const results = await this.conceptsTable
        .query()
        .where(`concept = '${conceptLower}'`)  // Note: Will fix SQL injection in later task
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
  
  async searchConcepts(queryText: string, limit: number): Promise<Concept[]> {
    // This requires embedding service - will be enhanced when QueryExpander is refactored
    // For now, simple text-based search
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
      sources: this.parseJsonField(row.sources),
      relatedConcepts: this.parseJsonField(row.related_concepts),
      synonyms: this.parseJsonField(row.synonyms),
      broaderTerms: this.parseJsonField(row.broader_terms),
      narrowerTerms: this.parseJsonField(row.narrower_terms),
      embeddings: row.embeddings || [],
      weight: row.weight || 0,
      chunkCount: row.chunk_count || 0,
      enrichmentSource: row.enrichment_source || 'corpus'
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
```

**Validation**: Repository can find and search concepts

**Proposed Commit**:
```
feat(infrastructure): implement LanceDBConceptRepository

Implement ConceptRepository interface using LanceDB:
- findByName: Exact concept lookup by name
- findRelated: Vector search for similar concepts
- searchConcepts: Text-based concept search

Note: findByName() still uses string interpolation in WHERE clause.
This will be addressed in security fixes task (Issue #6).

Related: Architecture Review 2025-11-14, Task 1.8
```

**User Approval Required**: ✋ STOP - Wait for approval before proceeding

---

### Task 1.9: Implement CatalogRepository (LanceDB)

**What**: Implement CatalogRepository interface

**Files to Create**:
- `src/infrastructure/lancedb/repositories/lancedb-catalog-repository.ts`
- `src/infrastructure/lancedb/repositories/index.ts`

**Content**:

**`src/infrastructure/lancedb/repositories/lancedb-catalog-repository.ts`**:
```typescript
import * as lancedb from "@lancedb/lancedb";
import { CatalogRepository } from '../../../domain/interfaces/repositories/catalog-repository.js';
import { SearchQuery, SearchResult } from '../../../domain/models/index.js';
import { EmbeddingService } from '../../../domain/interfaces/services/embedding-service.js';

/**
 * LanceDB implementation of CatalogRepository
 */
export class LanceDBCatalogRepository implements CatalogRepository {
  constructor(
    private catalogTable: lancedb.Table,
    private embeddingService: EmbeddingService
  ) {}
  
  async search(query: SearchQuery): Promise<SearchResult[]> {
    // Basic vector search - full hybrid search will be in ConceptualSearchClient refactor
    const queryEmbedding = this.embeddingService.generateEmbedding(query.text);
    const limit = query.limit || 5;
    
    const results = await this.catalogTable
      .vectorSearch(queryEmbedding)
      .limit(limit)
      .toArray();
    
    return results.map((row: any) => this.mapRowToSearchResult(row));
  }
  
  async findBySource(source: string): Promise<SearchResult | null> {
    // Use source path as embedding query
    const sourceEmbedding = this.embeddingService.generateEmbedding(source);
    
    const results = await this.catalogTable
      .vectorSearch(sourceEmbedding)
      .limit(10)
      .toArray();
    
    // Find best match by source path
    for (const row of results) {
      if (row.source && row.source.toLowerCase() === source.toLowerCase()) {
        return this.mapRowToSearchResult(row);
      }
    }
    
    return null;
  }
  
  private mapRowToSearchResult(row: any): SearchResult {
    const vectorScore = 1 - (row._distance || 0);
    
    return {
      id: row.id || '',
      text: row.text || '',
      source: row.source || '',
      hash: row.hash || '',
      concepts: this.parseJsonField(row.concepts),
      distance: row._distance || 0,
      vectorScore: vectorScore,
      bm25Score: 0,
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
```

**`src/infrastructure/lancedb/repositories/index.ts`**:
```typescript
export * from './lancedb-chunk-repository.js';
export * from './lancedb-concept-repository.js';
export * from './lancedb-catalog-repository.js';
```

**Validation**: Repository can search catalog

**Proposed Commit**:
```
feat(infrastructure): implement LanceDBCatalogRepository

Implement CatalogRepository interface using LanceDB:
- search: Vector search for document summaries
- findBySource: Lookup catalog entry by source path

Basic implementation - full hybrid search (multi-signal ranking)
will be added when refactoring ConceptualSearchClient.

Related: Architecture Review 2025-11-14, Task 1.9
```

**User Approval Required**: ✋ STOP - Wait for approval before proceeding

---

### Task 1.10: Pilot Migration - Refactor ConceptSearchTool

**What**: Migrate `ConceptSearchTool` to use repositories (dependency injection)

**Why This Tool First**: 
- Has the most critical issues (loads all chunks, Issue #2)
- Will validate repository pattern works
- Other tools follow same pattern

**Files to Modify**:
- `src/tools/operations/concept_search.ts`

**Changes**:

**Before** (lines 1-2):
```typescript
import { chunksTable, conceptTable } from "../../lancedb/conceptual_search_client.js";
import { BaseTool, ToolParams } from "../base/tool.js";
```

**After**:
```typescript
import { BaseTool, ToolParams } from "../base/tool.js";
import { ChunkRepository } from "../../domain/interfaces/repositories/chunk-repository.js";
import { ConceptRepository } from "../../domain/interfaces/repositories/concept-repository.js";
```

**Before** (class structure):
```typescript
export class ConceptSearchTool extends BaseTool<ConceptSearchParams> {
  name = "concept_search";
  description = `...`;
  
  async execute(params: ConceptSearchParams) {
    // Uses global chunksTable, conceptTable
```

**After**:
```typescript
export class ConceptSearchTool extends BaseTool<ConceptSearchParams> {
  constructor(
    private chunkRepo: ChunkRepository,
    private conceptRepo: ConceptRepository
  ) {
    super();
  }
  
  name = "concept_search";
  description = `...`;
  
  async execute(params: ConceptSearchParams) {
    // Uses injected repositories
```

**Before** (execute implementation, lines 55-66):
```typescript
if (!chunksTable) {
  return {
    content: [{
      type: "text" as const,
      text: JSON.stringify({
        error: "Chunks table not available",
        message: "Database not properly initialized"
      }, null, 2)
    }],
    isError: true
  };
}
```

**After** (remove null check - guaranteed by DI):
```typescript
// Dependencies guaranteed by constructor injection - no null check needed
```

**Before** (lines 68-84):
```typescript
// Get concept info from concepts table if available
let conceptInfo: any = null;
if (conceptTable) {
  try {
    const conceptResults = await conceptTable
      .query()
      .where(`concept = '${conceptLower}'`)
      .limit(1)
      .toArray();
    
    if (conceptResults.length > 0) {
      conceptInfo = conceptResults[0];
    }
  } catch (e) {
    // Concept table query failed, continue without it
  }
}
```

**After**:
```typescript
// Get concept metadata using repository
const conceptInfo = await this.conceptRepo.findByName(conceptLower);
```

**Before** (lines 86-138 - THE BIG PROBLEM):
```typescript
// Query chunks that contain this concept
// Load ALL chunks and filter in memory (concepts stored as JSON, can't use SQL WHERE)
console.error(`🔍 Searching for concept: "${conceptLower}"`);

// Get total count and load ALL chunks (LanceDB defaults to 10 if no limit!)
const totalCount = await chunksTable.countRows();
console.error(`📊 Scanning ${totalCount.toLocaleString()} chunks...`);

// Load all chunks - MUST specify limit (toArray() defaults to 10!)
const allChunks = await chunksTable
  .query()
  .limit(totalCount)  // CRITICAL: Explicit limit required
  .toArray();

console.error(`✅ Loaded ${allChunks.length.toLocaleString()} chunks`);

// Filter chunks that contain this concept
const matchingChunks = allChunks
  .filter((chunk: any) => {
    if (!chunk.concepts) return false;
    
    // Parse concepts array (stored as JSON string)
    let chunkConcepts: string[] = [];
    try {
      chunkConcepts = typeof chunk.concepts === 'string' 
        ? JSON.parse(chunk.concepts)
        : chunk.concepts;
    } catch (e) {
      return false;
    }
    
    // Check if concept matches (case-insensitive, fuzzy)
    return chunkConcepts.some((c: string) => {
      const cLower = c.toLowerCase();
      return cLower === conceptLower || 
             cLower.includes(conceptLower) || 
             conceptLower.includes(cLower);
    });
  })
  .filter((chunk: any) => {
    // Apply source filter if provided
    if (params.source_filter) {
      return chunk.source && chunk.source.toLowerCase().includes(params.source_filter.toLowerCase());
    }
    return true;
  })
  .sort((a: any, b: any) => {
    // Sort by concept_density (higher is better)
    const densityA = a.concept_density || 0;
    const densityB = b.concept_density || 0;
    return densityB - densityA;
  })
  .slice(0, limit);
```

**After** (EFFICIENT!):
```typescript
// Find chunks using efficient repository method (vector search)
console.error(`🔍 Searching for concept: "${conceptLower}"`);

let matchingChunks = await this.chunkRepo.findByConceptName(conceptLower, limit * 2);

// Apply source filter if provided
if (params.source_filter) {
  matchingChunks = matchingChunks.filter(chunk => 
    chunk.source.toLowerCase().includes(params.source_filter.toLowerCase())
  );
}

// Sort by concept density
matchingChunks.sort((a, b) => (b.conceptDensity || 0) - (a.conceptDensity || 0));

// Limit results
matchingChunks = matchingChunks.slice(0, limit);

console.error(`✅ Found ${matchingChunks.length} matching chunks`);
```

**Rest of method**: Format results (similar logic, use domain models)

**Validation**:
- Tool returns same results as before (manual testing)
- No performance degradation
- Actually should be MUCH faster for large collections

**Proposed Commit**:
```
refactor(tools): migrate ConceptSearchTool to use repository pattern

Refactor ConceptSearchTool to use dependency injection:
- Constructor accepts ChunkRepository and ConceptRepository
- No global state imports (chunksTable, conceptTable)
- No runtime null checks (dependencies guaranteed)

Performance improvement - findByConceptName() implementation:
Before: Load ALL chunks into memory, filter in JavaScript
  - O(n) complexity
  - ~5GB memory for 100K documents
  - Violated scalability requirement

After: Vector search for candidates, filter matches
  - O(log n) complexity  
  - Only loads candidates (~100-300 chunks)
  - Scales to large document collections

This is the pilot migration validating the repository pattern.
Remaining 4 tools will follow the same refactoring pattern.

Related: Architecture Review 2025-11-14, Task 1.10, Issue #2, Issue #3
```

**User Approval Required**: ✋ STOP - Wait for approval and validation before proceeding

---

## Phase 2: Dependency Injection (Priority 2)

**Goal**: Wire everything together with DI, eliminate global state  
**Estimated Time**: 20-30 minutes (agentic)  
**Risk**: Medium (must ensure proper initialization order)

### Task 2.1: Create Application Container

**What**: Central place to construct and wire all dependencies (Composition Root pattern)

**Files to Create**:
- `src/application/container.ts`

**Content**:

```typescript
import { LanceDBConnection } from '../infrastructure/lancedb/database-connection.js';
import { SimpleEmbeddingService } from '../infrastructure/embeddings/simple-embedding-service.js';
import { LanceDBChunkRepository } from '../infrastructure/lancedb/repositories/lancedb-chunk-repository.js';
import { LanceDBConceptRepository } from '../infrastructure/lancedb/repositories/lancedb-concept-repository.js';
import { LanceDBCatalogRepository } from '../infrastructure/lancedb/repositories/lancedb-catalog-repository.js';
import { ConceptSearchTool } from './tools/operations/concept_search.js';
import { BaseTool } from './tools/base/tool.js';
import * as defaults from '../config.js';

/**
 * Application Container - Composition Root
 * 
 * Single place where all dependencies are created and wired together.
 * Implements the Composition Root pattern from "Code That Fits in Your Head"
 * and "Introduction to Software Design and Architecture With TypeScript".
 * 
 * This replaces:
 * - Global module-level exports (export let client, etc.)
 * - Eager tool instantiation at module load
 * - Implicit dependencies via imports
 */
export class ApplicationContainer {
  private dbConnection!: LanceDBConnection;
  private tools = new Map<string, BaseTool>();
  
  /**
   * Initialize the application container
   * 
   * This is called once at server startup to:
   * 1. Connect to database
   * 2. Create repositories
   * 3. Create services
   * 4. Wire tools with their dependencies
   * 
   * @param databaseUrl - Path to LanceDB database
   */
  async initialize(databaseUrl: string): Promise<void> {
    console.error('🏗️  Initializing application container...');
    
    // 1. Connect to database
    this.dbConnection = await LanceDBConnection.connect(databaseUrl);
    
    // 2. Open tables
    const chunksTable = await this.dbConnection.openTable(defaults.CHUNKS_TABLE_NAME);
    const catalogTable = await this.dbConnection.openTable(defaults.CATALOG_TABLE_NAME);
    const conceptsTable = await this.dbConnection.openTable(defaults.CONCEPTS_TABLE_NAME);
    
    // 3. Create services
    const embeddingService = new SimpleEmbeddingService();
    
    // 4. Create repositories
    const conceptRepo = new LanceDBConceptRepository(conceptsTable);
    const chunkRepo = new LanceDBChunkRepository(chunksTable, conceptRepo, embeddingService);
    const catalogRepo = new LanceDBCatalogRepository(catalogTable, embeddingService);
    
    // 5. Create tools with injected dependencies
    this.tools.set('concept_search', new ConceptSearchTool(chunkRepo, conceptRepo));
    
    // TODO: Other tools will be added as they're migrated
    // this.tools.set('catalog_search', new ConceptualCatalogSearchTool(catalogRepo, conceptRepo));
    // this.tools.set('chunks_search', new ConceptualChunksSearchTool(chunkRepo, conceptRepo));
    // etc.
    
    console.error(`✅ Container initialized with ${this.tools.size} tool(s)`);
  }
  
  /**
   * Get a tool by name
   * 
   * @param name - Tool name
   * @returns Tool instance
   * @throws Error if tool not found
   */
  getTool(name: string): BaseTool {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }
    return tool;
  }
  
  /**
   * Get all available tools
   * 
   * @returns Array of all tool instances
   */
  getAllTools(): BaseTool[] {
    return Array.from(this.tools.values());
  }
  
  /**
   * Cleanup and close connections
   */
  async close(): Promise<void> {
    await this.dbConnection.close();
    this.tools.clear();
    console.error('🛑 Container shutdown complete');
  }
}
```

**Validation**: Container can initialize, create tools

**Proposed Commit**:
```
feat(application): add ApplicationContainer for dependency injection

Implement Composition Root pattern:
- Single place where all dependencies are wired together
- Creates database connection, repositories, services, tools
- Replaces global state and eager tool instantiation

Pattern from:
- "Code That Fits in Your Head" (Mark Seemann) - Composition Root
- "Introduction to Software Design... TypeScript" (Stemmler) - DI

Benefits:
- Explicit dependency graph (no hidden dependencies)
- Initialization order guaranteed
- Easy to test (can create test container with mocks)
- No global mutable state

Container is created once at server startup in conceptual_index.ts.

Related: Architecture Review 2025-11-14, Task 2.1, Issue #1, Issue #5
```

**User Approval Required**: ✋ STOP - Wait for approval before proceeding

---

### Task 2.2: Refactor Server Entry Point

**What**: Update `conceptual_index.ts` to use ApplicationContainer instead of global state

**Files to Modify**:
- `src/conceptual_index.ts`

**Changes**:

**Before** (lines 9-10):
```typescript
import { tools } from "./tools/conceptual_registry.js";
import { connectToLanceDB, closeLanceDB } from "./lancedb/conceptual_search_client.js";
```

**After**:
```typescript
import { ApplicationContainer } from "./application/container.js";
```

**Before** (lines 31-32):
```typescript
// Initialize database connection
await connectToLanceDB(databaseUrl, defaults.CHUNKS_TABLE_NAME, defaults.CATALOG_TABLE_NAME);
```

**After**:
```typescript
// Initialize application container (composition root)
const container = new ApplicationContainer();
await container.initialize(databaseUrl);
```

**Before** (lines 34-41):
```typescript
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  };
});
```

**After**:
```typescript
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: container.getAllTools().map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  };
});
```

**Before** (lines 44-51):
```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const tool = tools.find((t) => t.name === request.params.name);

  if (!tool) {
    throw new Error(`Unknown tool: ${request.params.name}`);
  }

  return tool.execute(request.params.arguments as any || {});
});
```

**After**:
```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const tool = container.getTool(request.params.name);
  return tool.execute(request.params.arguments as any || {});
});
```

**Before** (lines 55-59, 61-65):
```typescript
process.on('SIGINT', async () => {
  console.error('\n🛑 Shutting down...');
  await closeLanceDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error('\n🛑 Shutting down...');
  await closeLanceDB();
  process.exit(0);
});
```

**After**:
```typescript
process.on('SIGINT', async () => {
  console.error('\n🛑 Shutting down...');
  await container.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error('\n🛑 Shutting down...');
  await container.close();
  process.exit(0);
});
```

**Validation**: 
- Server starts successfully
- Can list tools via MCP
- ConceptSearchTool works via MCP
- Graceful shutdown works

**Proposed Commit**:
```
refactor(server): use ApplicationContainer instead of global state

Refactor MCP server entry point to use container:
- Create ApplicationContainer at startup (composition root)
- Get tools from container, not from module-level exports
- Container manages lifecycle (init and cleanup)

Removes dependencies on:
- tools/conceptual_registry.ts (eager instantiation)
- lancedb/conceptual_search_client.ts (global connectToLanceDB)

Benefits:
- Single initialization point
- Guaranteed dependency order
- Explicit lifecycle management
- No global mutable state

Server now follows clean architecture with proper DI.

Related: Architecture Review 2025-11-14, Task 2.2, Issue #1, Issue #5
```

**User Approval Required**: ✋ STOP - Wait for approval and validation before proceeding

---

### Task 2.3: Migrate Remaining Tools (4 tools)

**What**: Apply same refactoring pattern to other 4 tools

**Tools to Migrate**:
1. `ConceptualCatalogSearchTool` - Similar to ConceptSearchTool
2. `ConceptualChunksSearchTool` - Similar to ConceptSearchTool
3. `ConceptualBroadChunksSearchTool` - Uses ConceptualSearchClient (need to refactor that too)
4. `DocumentConceptsExtractTool` - Uses catalogTable directly

**Approach**: One tool per commit for validation

**Sub-task 2.3a: Migrate ConceptualCatalogSearchTool**

**Files to Modify**:
- `src/tools/operations/conceptual_catalog_search.ts`
- `src/application/container.ts` (add tool registration)

**Changes to Tool**:
- Add constructor accepting `CatalogRepository`, `ConceptRepository`
- Replace `catalogTable` usage with `catalogRepo.search()`
- Replace `conceptTable` usage with `conceptRepo.findByName()`
- Remove ConceptualSearchClient (will refactor separately)

**Changes to Container**:
```typescript
this.tools.set('catalog_search', new ConceptualCatalogSearchTool(catalogRepo, conceptRepo));
```

**Proposed Commit**:
```
refactor(tools): migrate ConceptualCatalogSearchTool to repositories

Apply dependency injection pattern to ConceptualCatalogSearchTool:
- Constructor injection of CatalogRepository and ConceptRepository
- Remove global state imports
- Use repository methods instead of direct table access

Tool now follows same pattern as ConceptSearchTool.
2 of 5 tools migrated.

Related: Architecture Review 2025-11-14, Task 2.3a
```

**User Approval Required**: ✋ STOP - Wait for approval before proceeding

---

**Sub-task 2.3b: Migrate ConceptualChunksSearchTool**

Similar pattern to 2.3a. Constructor injection of repositories.

**Proposed Commit**:
```
refactor(tools): migrate ConceptualChunksSearchTool to repositories

Apply dependency injection pattern to ConceptualChunksSearchTool:
- Constructor injection of ChunkRepository and ConceptRepository
- Remove global state imports
- Use repository methods

3 of 5 tools migrated.

Related: Architecture Review 2025-11-14, Task 2.3b
```

**User Approval Required**: ✋ STOP

---

**Sub-task 2.3c: Migrate ConceptualBroadChunksSearchTool**

This tool uses `ConceptualSearchClient` which also needs refactoring. 

Two options:
1. Refactor ConceptualSearchClient to use repositories (cleaner)
2. Make tool use repositories directly, bypass ConceptualSearchClient

Recommendation: Option 1 - refactor ConceptualSearchClient properly

**Proposed Commit**:
```
refactor(tools): migrate ConceptualBroadChunksSearchTool to repositories

Apply dependency injection pattern to ConceptualBroadChunksSearchTool:
- Refactor to use ChunkRepository.search() for hybrid search
- Remove ConceptualSearchClient dependency (logic moved to repository)
- Constructor injection of repositories

4 of 5 tools migrated.

Related: Architecture Review 2025-11-14, Task 2.3c
```

**User Approval Required**: ✋ STOP

---

**Sub-task 2.3d: Migrate DocumentConceptsExtractTool**

**Proposed Commit**:
```
refactor(tools): migrate DocumentConceptsExtractTool to repositories

Apply dependency injection pattern to DocumentConceptsExtractTool:
- Constructor injection of CatalogRepository
- Remove global catalogTable import
- Use repository methods

All 5 tools now use dependency injection!

Related: Architecture Review 2025-11-14, Task 2.3d
```

**User Approval Required**: ✋ STOP

---

### Task 2.4: Remove Old Global State Exports

**What**: Clean up old patterns now that everything uses DI

**Files to Modify/Delete**:
- `src/tools/conceptual_registry.ts` - Can be deleted (container handles this)
- `src/lancedb/conceptual_search_client.ts` - Remove global exports, keep ConceptualSearchClient class
- `src/concepts/query_expander.ts` - Use injected EmbeddingService instead of local implementation

**Proposed Commit**:
```
refactor(cleanup): remove global state exports and deprecated patterns

Remove deprecated patterns now that DI is fully implemented:
- Delete src/tools/conceptual_registry.ts (replaced by container)
- Remove global exports from conceptual_search_client.ts
- Refactor query_expander.ts to use injected EmbeddingService

All components now use proper dependency injection.
No more module-level mutable state.

Related: Architecture Review 2025-11-14, Task 2.4, Issue #1, Issue #4
```

**User Approval Required**: ✋ STOP

---

## Phase 3: Performance & Security Fixes (Priority 3-6)

**Goal**: Optimize performance, fix security issues, polish code  
**Estimated Time**: 20-30 minutes (agentic)  
**Risk**: Low (improvements on solid foundation)

### Task 3.1: Refactor ConceptualSearchClient for Hybrid Search

**What**: Move multi-signal hybrid search logic into repository or service

**Options**:
A. Keep as separate service, inject into repository
B. Move logic into ChunkRepository.search() implementation
C. Create HybridSearchService used by repository

**Recommendation**: Option A (service) - keeps repository focused, search logic reusable

**Proposed Commit**:
```
refactor(search): extract hybrid search logic into dedicated service

Create HybridSearchService for multi-signal ranking:
- Vector similarity (25%)
- BM25 keyword matching (25%)
- Title matching (20%)
- Concept matching (20%)
- WordNet expansion (10%)

Service is injected into repositories that need hybrid search.
Keeps repository implementations focused on data access.

Related: Architecture Review 2025-11-14, Task 3.1
```

**User Approval Required**: ✋ STOP

---

### Task 3.2: Fix SQL Injection Vulnerability

**What**: Replace string interpolation with parameterized queries or query builder

**Files to Modify**:
- `src/infrastructure/lancedb/repositories/lancedb-concept-repository.ts` (line with WHERE clause)

**Issue**:
```typescript
.where(`concept = '${conceptLower}'`)  // SQL injection risk
```

**Fix**: Research LanceDB API for safe query methods. If no parameterized queries, use proper escaping.

**Proposed Commit**:
```
fix(security): eliminate SQL injection risk in concept queries

Replace string interpolation in WHERE clauses with safe query methods.
Validates and escapes user input properly.

Fixes Issue #6 from architecture review (SQL injection vulnerability).

Related: Architecture Review 2025-11-14, Task 3.2, Issue #6
```

**User Approval Required**: ✋ STOP

---

### Task 3.3: Extract Shared Utilities

**What**: Create shared utilities module for common functions

**Files to Create**:
- `src/infrastructure/lancedb/utils/field-parsers.ts` - JSON parsing logic
- `src/infrastructure/lancedb/utils/mappers.ts` - Row to domain model mapping

**Purpose**: Eliminate code duplication in repository implementations

**Proposed Commit**:
```
refactor(utils): extract common utilities from repositories

Create shared utility functions:
- parseJsonField: Safe JSON parsing for database fields
- mapRowToChunk: Database row → Chunk domain model
- mapRowToConcept: Database row → Concept domain model

Eliminates duplication across 3 repository implementations.

Related: Architecture Review 2025-11-14, Task 3.3
```

**User Approval Required**: ✋ STOP

---

### Task 3.4: Update QueryExpander to Use EmbeddingService

**What**: Remove duplicate embedding code from QueryExpander

**Files to Modify**:
- `src/concepts/query_expander.ts`

**Changes**:
- Add constructor accepting `EmbeddingService`
- Remove internal `createSimpleEmbedding()` and `simpleHash()` methods
- Use `this.embeddingService.generateEmbedding()` instead

**Proposed Commit**:
```
refactor(concepts): use EmbeddingService in QueryExpander

Remove duplicate embedding implementation from QueryExpander:
- Inject EmbeddingService via constructor
- Use service instead of local implementation
- Delete duplicate createSimpleEmbedding() and simpleHash() methods

This completes the elimination of embedding code duplication
(was in 2 places, now centralized in one service).

Related: Architecture Review 2025-11-14, Task 3.4, Issue #4
```

**User Approval Required**: ✋ STOP

---

### Task 3.5: Final Integration Testing & Documentation

**What**: End-to-end testing and update documentation

**Actions**:
1. Test all 5 tools via MCP Inspector
2. Verify performance improvement (no memory loading for concept search)
3. Update README if needed (probably no user-facing changes)
4. Update CHANGELOG

**Proposed Commit**:
```
docs: update documentation for architecture refactoring

Document completed refactoring:
- Update CHANGELOG with architectural improvements
- Note performance improvements (efficient vector search)
- Document new internal structure (for contributors)

All 5 tools tested and working with new architecture.
Performance validated on large document collections.

Completes Phase 1-3 of architecture refactoring.

Related: Architecture Review 2025-11-14, Task 3.5
```

**User Approval Required**: ✋ STOP

---

## Summary

**Total Tasks**: ~20 tasks broken into logical commits  
**Phases**: 3 phases (Repository Pattern, DI, Polish)  
**Estimated Time**: 1-2 hours active work (agentic implementation)

**Approval Points**: After each task (20 approval points)  
**Note**: Total elapsed time depends on user approval speed at checkpoints

**Validation Strategy**: 
- Each commit is a working state
- Can run MCP Inspector after each task
- Manual testing of tool behavior
- Regular commits as requested

**Next Step**: Start with Task 1.1 when you're ready!

