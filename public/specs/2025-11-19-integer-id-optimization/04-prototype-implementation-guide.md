# Prototype Implementation Guide

**Date**: 2025-11-19  
**Purpose**: Step-by-step implementation instructions with code examples  
**Estimated Time**: 2-3 days

## Overview

This guide provides detailed, copy-paste-ready implementation steps for the integer ID optimization. Follow phases sequentially to minimize errors.

## Prerequisites

```bash
# 1. Ensure on correct branch
git status  # Should show: On branch feature/category-search-tool

# 2. Ensure all tests pass before starting
npm test

# 3. Backup current database
cp -r ~/.concept_rag ~/.concept_rag.backup.$(date +%Y%m%d_%H%M%S)

# 4. Document current state
npx tsx -e "
  const lancedb = require('@lancedb/lancedb');
  const db = await lancedb.connect(process.env.HOME + '/.concept_rag');
  const tables = await db.tableNames();
  for (const name of tables) {
    const table = await db.openTable(name);
    console.log(\`\${name}: \${await table.countRows()} rows\`);
  }
" > .ai/planning/2025-11-19-integer-id-optimization/pre-migration-counts.txt

# 5. Check disk space
df -h ~/.concept_rag
```

---

## Phase 1: Schema & Infrastructure

### Step 1.1: Update Domain Models

**File**: `src/domain/models/catalog-entry.ts`

```typescript
/**
 * Catalog entry representing a document in the collection
 */
export interface CatalogEntry {
  id: string;
  text: string;
  source: string;
  hash: string;
  loc: string;
  vector: number[];
  
  /**
   * @deprecated Use concept_ids instead. Will be removed in v2.0.0
   * Legacy concept storage using concept names
   */
  concepts: string;  // JSON array of concept names
  
  /**
   * Concept references using integer IDs for efficient storage
   * JSON array of concept IDs
   * @example '["42", "73", "156"]'
   */
  concept_ids?: string;  // Optional during migration
  
  concept_categories: string;
}
```

**File**: `src/domain/models/chunk.ts`

```typescript
/**
 * Text chunk with concept annotations
 */
export interface Chunk {
  id: string;
  text: string;
  source: string;
  hash: string;
  loc: string;
  vector: number[];
  
  /**
   * @deprecated Use concept_ids instead. Will be removed in v2.0.0
   */
  concepts: string;  // JSON array of concept names
  
  /**
   * Concept references using integer IDs
   * @example '["42", "73"]'
   */
  concept_ids?: string;  // Optional during migration
  
  concept_categories: string;
  concept_density: number;
}
```

**File**: `src/domain/models/concept.ts`

```typescript
/**
 * Concept with document references
 */
export interface Concept {
  id: string;
  concept: string;
  concept_type: string;
  category: string;
  
  /**
   * @deprecated Use catalog_ids instead. Will be removed in v2.0.0
   * Legacy document references using file paths
   */
  sources: string;  // JSON array of source paths
  
  /**
   * Document references using catalog entry IDs
   * JSON array of catalog IDs
   * @example '["5", "12", "23"]'
   */
  catalog_ids?: string;  // Optional during migration
  
  related_concepts: string;
  synonyms: string;
  broader_terms: string;
  narrower_terms: string;
  weight: number;
  chunk_count: number;
  enrichment_source: string;
  vector: number[];
}
```

**Test**: Compile TypeScript
```bash
npm run build
# Should compile without errors
```

---

### Step 1.2: Update Schema Validators

**File**: `src/infrastructure/lancedb/utils/schema-validators.ts`

Find `validateCatalogEntry` and update:

```typescript
export function validateCatalogEntry(entry: any): entry is CatalogEntry {
  const isValid = (
    typeof entry.id === 'string' &&
    typeof entry.text === 'string' &&
    typeof entry.source === 'string' &&
    typeof entry.hash === 'string' &&
    typeof entry.concepts === 'string' &&
    // NEW: concept_ids is optional during migration
    (entry.concept_ids === undefined || typeof entry.concept_ids === 'string') &&
    Array.isArray(entry.vector) &&
    typeof entry.concept_categories === 'string'
  );

  if (!isValid) {
    console.error('[Validator] Invalid catalog entry:', {
      hasId: typeof entry.id === 'string',
      hasText: typeof entry.text === 'string',
      hasSource: typeof entry.source === 'string',
      hasConcepts: typeof entry.concepts === 'string',
      hasConceptIds: entry.concept_ids === undefined || typeof entry.concept_ids === 'string',
      hasVector: Array.isArray(entry.vector)
    });
  }

  return isValid;
}
```

Find `validateChunk` and update:

```typescript
export function validateChunk(chunk: any): chunk is Chunk {
  const isValid = (
    typeof chunk.id === 'string' &&
    typeof chunk.text === 'string' &&
    typeof chunk.source === 'string' &&
    typeof chunk.concepts === 'string' &&
    // NEW: concept_ids is optional
    (chunk.concept_ids === undefined || typeof chunk.concept_ids === 'string') &&
    typeof chunk.concept_density === 'number' &&
    Array.isArray(chunk.vector) &&
    typeof chunk.concept_categories === 'string'
  );

  if (!isValid) {
    console.error('[Validator] Invalid chunk:', {
      hasId: typeof chunk.id === 'string',
      hasText: typeof chunk.text === 'string',
      hasConcepts: typeof chunk.concepts === 'string',
      hasConceptIds: chunk.concept_ids === undefined || typeof chunk.concept_ids === 'string',
      hasDensity: typeof chunk.concept_density === 'number',
      hasVector: Array.isArray(chunk.vector)
    });
  }

  return isValid;
}

export function validateConcept(concept: any): concept is Concept {
  const isValid = (
    typeof concept.id === 'string' &&
    typeof concept.concept === 'string' &&
    typeof concept.sources === 'string' &&
    // NEW: catalog_ids is optional
    (concept.catalog_ids === undefined || typeof concept.catalog_ids === 'string') &&
    Array.isArray(concept.vector)
  );

  if (!isValid) {
    console.error('[Validator] Invalid concept:', {
      hasId: typeof concept.id === 'string',
      hasConcept: typeof concept.concept === 'string',
      hasSources: typeof concept.sources === 'string',
      hasCatalogIds: concept.catalog_ids === undefined || typeof concept.catalog_ids === 'string',
      hasVector: Array.isArray(concept.vector)
    });
  }

  return isValid;
}
```

**Test**: Compile
```bash
npm run build
```

---

### Step 1.3: Create ConceptIdCache

**File**: `src/infrastructure/cache/concept-id-cache.ts` (new file)

Create the full implementation from `02-concept-id-cache-design.md`. Key sections:

```typescript
import type { ConceptRepository } from '../../domain/interfaces/concept-repository';
import type { Concept } from '../../domain/models/concept';

/**
 * In-memory cache for bidirectional concept ID ↔ name mapping.
 * Singleton pattern ensures single source of truth.
 */
export class ConceptIdCache {
  private static instance: ConceptIdCache;
  
  private idToName = new Map<string, string>();
  private nameToId = new Map<string, string>();
  private initialized = false;
  private conceptCount = 0;
  private lastUpdated?: Date;

  private constructor() {}

  public static getInstance(): ConceptIdCache {
    if (!ConceptIdCache.instance) {
      ConceptIdCache.instance = new ConceptIdCache();
    }
    return ConceptIdCache.instance;
  }

  public async initialize(conceptRepo: ConceptRepository): Promise<void> {
    if (this.initialized) {
      throw new Error('ConceptIdCache already initialized. Call clear() first to reinitialize.');
    }

    console.log('[ConceptIdCache] Loading concepts...');
    const startTime = Date.now();

    const concepts = await conceptRepo.findAll();
    
    for (const concept of concepts) {
      this.idToName.set(concept.id, concept.concept);
      this.nameToId.set(concept.concept, concept.id);
    }

    this.conceptCount = concepts.length;
    this.lastUpdated = new Date();
    this.initialized = true;

    const elapsed = Date.now() - startTime;
    console.log(`[ConceptIdCache] Loaded ${this.conceptCount} concepts in ${elapsed}ms`);
  }

  public getId(conceptName: string): string | undefined {
    this.ensureInitialized();
    return this.nameToId.get(conceptName);
  }

  public getIds(conceptNames: string[]): string[] {
    this.ensureInitialized();
    return conceptNames
      .map(name => this.nameToId.get(name))
      .filter((id): id is string => id !== undefined);
  }

  public getName(conceptId: string): string | undefined {
    this.ensureInitialized();
    return this.idToName.get(conceptId);
  }

  public getNames(conceptIds: string[]): string[] {
    this.ensureInitialized();
    return conceptIds
      .map(id => this.idToName.get(id))
      .filter((name): name is string => name !== undefined);
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public getStats() {
    return {
      initialized: this.initialized,
      conceptCount: this.conceptCount,
      lastUpdated: this.lastUpdated,
      memorySizeEstimate: this.conceptCount * 280  // ~280 bytes per concept
    };
  }

  public clear(): void {
    this.idToName.clear();
    this.nameToId.clear();
    this.initialized = false;
    this.conceptCount = 0;
    this.lastUpdated = undefined;
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('ConceptIdCache not initialized. Call initialize() first.');
    }
  }
}
```

**Test**: Compile
```bash
npm run build
```

---

### Step 1.4: Update Repository Interfaces

**File**: `src/domain/interfaces/catalog-repository.ts`

Add after existing methods:

```typescript
export interface CatalogRepository {
  // ... existing methods ...
  
  /**
   * Get concept names from catalog entry
   * Prefers concept_ids format, falls back to concepts
   */
  getConceptNames(entry: CatalogEntry): Promise<string[]>;
  
  /**
   * Get concept IDs from catalog entry (if available)
   */
  getConceptIds(entry: CatalogEntry): string[] | undefined;
}
```

**File**: `src/domain/interfaces/chunk-repository.ts`

Add after existing methods:

```typescript
export interface ChunkRepository {
  // ... existing methods ...
  
  /**
   * Get concept names from chunk
   * Prefers concept_ids format, falls back to concepts
   */
  getConceptNames(chunk: Chunk): Promise<string[]>;
  
  /**
   * Get concept IDs from chunk (if available)
   */
  getConceptIds(chunk: Chunk): string[] | undefined;
}
```

**File**: `src/domain/interfaces/concept-repository.ts`

Ensure findAll() exists:

```typescript
export interface ConceptRepository {
  // ... existing methods ...
  
  /**
   * Find all concepts (for cache initialization)
   */
  findAll(): Promise<Concept[]>;
}
```

**Test**: Compile
```bash
npm run build
# Will show errors - implementations not updated yet
```

---

### Step 1.5: Update Container for Dependency Injection

**File**: `src/application/container.ts`

Add import at top:

```typescript
import { ConceptIdCache } from '../infrastructure/cache/concept-id-cache';
```

Add property to class:

```typescript
export class Container {
  private db?: Database;
  private catalogRepo?: CatalogRepository;
  private chunkRepo?: ChunkRepository;
  private conceptRepo?: ConceptRepository;
  private conceptIdCache?: ConceptIdCache;  // NEW
  
  // ... rest of class ...
}
```

Add getter method:

```typescript
async getConceptIdCache(): Promise<ConceptIdCache> {
  if (!this.conceptIdCache) {
    this.conceptIdCache = ConceptIdCache.getInstance();
    const conceptRepo = await this.getConceptRepository();
    await this.conceptIdCache.initialize(conceptRepo);
    
    const stats = this.conceptIdCache.getStats();
    console.log(`[Container] ConceptIdCache initialized: ${stats.conceptCount} concepts, ~${Math.round(stats.memorySizeEstimate / 1024)}KB`);
  }
  return this.conceptIdCache;
}
```

Update `getCatalogRepository()`:

```typescript
async getCatalogRepository(): Promise<CatalogRepository> {
  if (!this.catalogRepo) {
    const db = await this.getDatabase();
    const table = await db.openTable(this.config.catalogTableName);
    const cache = await this.getConceptIdCache();  // NEW
    this.catalogRepo = new LanceDBCatalogRepository(table, cache);  // Add cache param
  }
  return this.catalogRepo;
}
```

Update `getChunkRepository()`:

```typescript
async getChunkRepository(): Promise<ChunkRepository> {
  if (!this.chunkRepo) {
    const db = await this.getDatabase();
    const table = await db.openTable(this.config.chunksTableName);
    const cache = await this.getConceptIdCache();  // NEW
    this.chunkRepo = new LanceDBChunkRepository(table, cache);  // Add cache param
  }
  return this.chunkRepo;
}
```

**Test**: Compile (will error on repository constructors)
```bash
npm run build
```

---

## Phase 2: Repository Implementations

### Step 2.1: Update LanceDBCatalogRepository

**File**: `src/infrastructure/lancedb/catalog-repository.ts`

Update constructor:

```typescript
export class LanceDBCatalogRepository implements CatalogRepository {
  constructor(
    private table: Table,
    private conceptIdCache: ConceptIdCache  // NEW parameter
  ) {}
  
  // ... rest of class ...
}
```

Add helper methods after existing methods:

```typescript
async getConceptNames(entry: CatalogEntry): Promise<string[]> {
  // Prefer new format (concept_ids)
  if (entry.concept_ids) {
    try {
      const ids = JSON.parse(entry.concept_ids) as string[];
      const names = this.conceptIdCache.getNames(ids);
      return names;
    } catch (error) {
      console.error('[CatalogRepository] Error parsing concept_ids:', error);
      // Fall through to old format
    }
  }
  
  // Fallback to old format (concepts)
  if (entry.concepts) {
    try {
      return JSON.parse(entry.concepts) as string[];
    } catch (error) {
      console.error('[CatalogRepository] Error parsing concepts:', error);
      return [];
    }
  }
  
  return [];
}

getConceptIds(entry: CatalogEntry): string[] | undefined {
  if (entry.concept_ids) {
    try {
      return JSON.parse(entry.concept_ids) as string[];
    } catch (error) {
      console.error('[CatalogRepository] Error parsing concept_ids:', error);
      return undefined;
    }
  }
  return undefined;
}
```

**Test**: Compile
```bash
npm run build
```

---

### Step 2.2: Update LanceDBChunkRepository

**File**: `src/infrastructure/lancedb/chunk-repository.ts`

Update constructor:

```typescript
export class LanceDBChunkRepository implements ChunkRepository {
  constructor(
    private table: Table,
    private conceptIdCache: ConceptIdCache  // NEW parameter
  ) {}
  
  // ... rest of class ...
}
```

Add helper methods (same as catalog repository):

```typescript
async getConceptNames(chunk: Chunk): Promise<string[]> {
  if (chunk.concept_ids) {
    try {
      const ids = JSON.parse(chunk.concept_ids) as string[];
      return this.conceptIdCache.getNames(ids);
    } catch (error) {
      console.error('[ChunkRepository] Error parsing concept_ids:', error);
    }
  }
  
  if (chunk.concepts) {
    try {
      return JSON.parse(chunk.concepts) as string[];
    } catch (error) {
      console.error('[ChunkRepository] Error parsing concepts:', error);
      return [];
    }
  }
  
  return [];
}

getConceptIds(chunk: Chunk): string[] | undefined {
  if (chunk.concept_ids) {
    try {
      return JSON.parse(chunk.concept_ids) as string[];
    } catch (error) {
      console.error('[ChunkRepository] Error parsing concept_ids:', error);
      return undefined;
    }
  }
  return undefined;
}
```

**Test**: Compile
```bash
npm run build
# Should succeed now
```

---

### Step 2.3: Verify ConceptRepository has findAll()

**File**: `src/infrastructure/lancedb/concept-repository.ts`

Check if `findAll()` exists. If not, add:

```typescript
async findAll(): Promise<Concept[]> {
  try {
    const results = await this.table.toArray();
    return results.map(row => this.mapRowToConcept(row));
  } catch (error) {
    console.error('[ConceptRepository] Error in findAll:', error);
    throw new Error(`Failed to retrieve all concepts: ${error}`);
  }
}
```

**Test**: Compile
```bash
npm run build
npm test  # Should pass (no behavior changes yet)
```

---

## Phase 3: Ingestion Pipeline

### Step 3.1: Update Main Seeding Script

**File**: `hybrid_fast_seed.ts`

**Location 1**: Add import at top (~line 15):

```typescript
import { ConceptIdCache } from './src/infrastructure/cache/concept-id-cache';
```

**Location 2**: After concepts table is created and populated (~line 400-500, look for after `createConceptTable`):

```typescript
// Initialize concept ID cache for efficient lookups
console.log('\n=== Initializing Concept ID Cache ===');
const conceptIdCache = ConceptIdCache.getInstance();

// Need a temporary concept repository to load cache
const conceptsTable = await db.openTable('concepts');
const tempConceptRepo = new LanceDBConceptRepository(conceptsTable);
await conceptIdCache.initialize(tempConceptRepo);

const cacheStats = conceptIdCache.getStats();
console.log(`✓ Cache initialized: ${cacheStats.conceptCount} concepts, ~${Math.round(cacheStats.memorySizeEstimate / 1024)}KB`);
```

**Location 3**: In catalog entry creation logic (~line 600-700, where catalog documents are being created):

Find where concepts are assigned to catalog entries and update:

```typescript
// Example location - adjust based on your actual code structure
const catalogEntry = {
  id: docId,
  text: enrichedText,  // Summary + concepts
  source: documentPath,
  hash: documentHash,
  loc: JSON.stringify({ /* ... */ }),
  vector: embedding,
  
  // OLD FORMAT: Keep for backward compatibility
  concepts: JSON.stringify(extractedConcepts),
  
  // NEW FORMAT: Add concept IDs
  concept_ids: JSON.stringify(conceptIdCache.getIds(extractedConcepts)),
  
  concept_categories: JSON.stringify(categories)
};
```

**Location 4**: In chunk creation logic (~line 800-900, where chunks are enriched):

```typescript
// Where chunks are created/enriched
const chunk = {
  id: chunkId,
  text: chunkText,
  source: documentPath,
  hash: chunkHash,
  loc: JSON.stringify({ /* ... */ }),
  vector: chunkEmbedding,
  
  // OLD FORMAT: Keep for backward compatibility
  concepts: JSON.stringify(chunkConcepts),
  
  // NEW FORMAT: Add concept IDs  
  concept_ids: JSON.stringify(conceptIdCache.getIds(chunkConcepts)),
  
  concept_categories: JSON.stringify(chunkCategories),
  concept_density: calculateDensity(chunkConcepts, chunkText)
};
```

**Location 5**: In concepts table creation (~line 400-500, where concepts are built):

First, after catalog table is created, build source-to-ID mapping:

```typescript
// After catalog table is populated
console.log('Building source-to-catalog-ID mapping...');
const catalogEntries = await catalogTable.toArray();
const sourceToIdMap = new Map<string, string>();
for (const entry of catalogEntries) {
  sourceToIdMap.set(entry.source, entry.id);
}
console.log(`Mapped ${sourceToIdMap.size} sources to catalog IDs`);
```

Then, when creating concept entries:

```typescript
// When building concepts table
const conceptEntry = {
  id: conceptId,
  concept: conceptName,
  concept_type: type,
  category: category,
  
  // OLD FORMAT: Keep for backward compatibility
  sources: JSON.stringify(sourcePaths),  // Array of file paths
  
  // NEW FORMAT: Add catalog IDs
  catalog_ids: JSON.stringify(
    sourcePaths
      .map(path => sourceToIdMap.get(path))
      .filter(id => id !== undefined)
  ),
  
  // ... other fields
  vector: conceptEmbedding
};
```

**Test**: Run seeding on small dataset
```bash
# Use a single small document for testing
npx tsx hybrid_fast_seed.ts

# Verify concepts table has catalog_ids
npx tsx -e "
  const lancedb = require('@lancedb/lancedb');
  const db = await lancedb.connect(process.env.HOME + '/.concept_rag');
  const concepts = await db.openTable('concepts');
  const sample = await concepts.limit(3).toArray();
  console.log('Sample concepts:', JSON.stringify(sample, null, 2));
"
```

---

## Phase 4: MCP Tools Update

### Step 4.1: Update Tool Registry

**File**: `src/tools/conceptual_registry.ts`

In `initialize()` method, add after existing initialization:

```typescript
async initialize() {
  // ... existing initialization ...
  
  // Initialize concept ID cache
  try {
    const cache = await this.container.getConceptIdCache();
    const stats = cache.getStats();
    console.log(`[MCP Tools] Concept cache ready: ${stats.conceptCount} concepts`);
  } catch (error) {
    console.error('[MCP Tools] Failed to initialize concept cache:', error);
    throw error;
  }
}
```

---

### Step 4.2: Update Individual Tools

**Pattern**: For each tool that displays concepts, use the `getConceptNames()` helper.

**File**: `src/tools/operations/catalog-search.ts`

Find result formatting section and update:

```typescript
// Format results for display
const formatted = await Promise.all(
  results.map(async (entry) => {
    const conceptNames = await catalogRepo.getConceptNames(entry);
    
    return {
      source: entry.source,
      concepts: conceptNames.join(', '),
      categories: JSON.parse(entry.concept_categories || '[]'),
      preview: entry.text.substring(0, 200) + '...',
      // ... other fields ...
    };
  })
);
```

**File**: `src/tools/operations/chunks-search.ts`

Similar update:

```typescript
const formatted = await Promise.all(
  chunks.map(async (chunk) => {
    const conceptNames = await chunkRepo.getConceptNames(chunk);
    
    return {
      source: chunk.source,
      text: chunk.text.substring(0, 500),
      concepts: conceptNames,
      density: chunk.concept_density,
      // ... other fields ...
    };
  })
);
```

**File**: `src/tools/operations/broad-chunks-search.ts`

Same pattern as chunks-search.ts.

**File**: `src/tools/operations/extract-concepts.ts`

Update to show both IDs and names:

```typescript
const formatted = {
  document: source,
  primary_concepts: concepts.map(c => ({
    id: c.id,
    name: c.concept,
    category: c.category,
    weight: c.weight
  })),
  // ... rest of formatting ...
};
```

**Test**: Run individual tools
```bash
# After seeding, test tools
npx tsx -e "
  import { Container } from './src/application/container';
  const container = new Container();
  const catalog = await container.getCatalogRepository();
  const results = await catalog.search({ text: 'test', limit: 3 });
  console.log(results);
"
```

---

## Phase 5: Testing

### Step 5.1: Update Test Fixtures

**File**: `src/__tests__/test-helpers/integration-test-data.ts`

Update mock data:

```typescript
export const mockCatalogEntry: CatalogEntry = {
  id: '1',
  text: 'Test document about microservices',
  source: '/test/microservices.pdf',
  hash: 'abc123',
  loc: '{"pages": "1-10"}',
  vector: new Array(384).fill(0.1),
  concepts: '["microservices", "API gateway"]',
  concept_ids: '["42", "73"]',  // NEW
  concept_categories: '["software architecture"]'
};

export const mockChunk: Chunk = {
  id: '1',
  text: 'Test chunk about API gateways',
  source: '/test/microservices.pdf',
  hash: 'def456',
  loc: '{"lines": "10-20"}',
  vector: new Array(384).fill(0.1),
  concepts: '["API gateway"]',
  concept_ids: '["73"]',  // NEW
  concept_categories: '["software architecture"]',
  concept_density: 0.05
};
```

---

### Step 5.2: Create Cache Unit Tests

**File**: `src/__tests__/infrastructure/cache/concept-id-cache.test.ts` (new file)

See full test suite in `02-concept-id-cache-design.md` section "Testing Strategy".

Basic structure:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ConceptIdCache } from '../../../infrastructure/cache/concept-id-cache';

describe('ConceptIdCache', () => {
  let cache: ConceptIdCache;
  
  beforeEach(() => {
    cache = ConceptIdCache.getInstance();
  });
  
  afterEach(() => {
    cache.clear();
  });
  
  it('should map concept names to IDs', async () => {
    // Test basic functionality
  });
  
  // ... more tests ...
});
```

---

### Step 5.3: Run All Tests

```bash
# Run test suite
npm test

# Check for any failures
# Fix any broken tests

# Run linter
npm run lint
```

---

## Phase 6: Validation

### Step 6.1: Create Validation Script

**File**: `scripts/validate_migration.ts` (new file)

```typescript
import { connect } from '@lancedb/lancedb';
import { ConceptIdCache } from '../src/infrastructure/cache/concept-id-cache';
import { LanceDBConceptRepository } from '../src/infrastructure/lancedb/concept-repository';

async function validateMigration() {
  console.log('=== Migration Validation ===\n');
  
  const db = await connect(process.env.HOME + '/.concept_rag');
  
  // Initialize cache
  const conceptsTable = await db.openTable('concepts');
  const conceptRepo = new LanceDBConceptRepository(conceptsTable);
  const cache = ConceptIdCache.getInstance();
  await cache.initialize(conceptRepo);
  
  // Validate catalog
  console.log('Validating catalog table...');
  const catalogTable = await db.openTable('catalog');
  const catalogRows = await catalogTable.toArray();
  
  let catalogValid = 0;
  let catalogMissing = 0;
  let catalogMismatch = 0;
  
  for (const row of catalogRows) {
    if (row.concept_ids) {
      const oldConcepts = JSON.parse(row.concepts) as string[];
      const newIds = JSON.parse(row.concept_ids) as string[];
      const resolvedConcepts = cache.getNames(newIds);
      
      if (arraysEqual(oldConcepts.sort(), resolvedConcepts.sort())) {
        catalogValid++;
      } else {
        console.error(`Mismatch in catalog ${row.id}:`, {
          old: oldConcepts,
          new: resolvedConcepts
        });
        catalogMismatch++;
      }
    } else {
      catalogMissing++;
    }
  }
  
  console.log(`  Total: ${catalogRows.length}`);
  console.log(`  With concept_ids: ${catalogValid}`);
  console.log(`  Missing concept_ids: ${catalogMissing}`);
  console.log(`  Mismatches: ${catalogMismatch}`);
  
  // Validate chunks (similar logic)
  console.log('\nValidating chunks table...');
  // ... similar validation ...
  
  const success = catalogMismatch === 0;
  console.log(`\n${success ? '✓ VALIDATION PASSED' : '✗ VALIDATION FAILED'}`);
  return success;
}

function arraysEqual(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((val, idx) => val === b[idx]);
}

const success = await validateMigration();
process.exit(success ? 0 : 1);
```

**Run validation**:
```bash
npx tsx scripts/validate_migration.ts
```

---

### Step 6.2: Compare Storage

```bash
# Before migration (from backup)
du -sh ~/.concept_rag.backup.*

# After migration
du -sh ~/.concept_rag

# Calculate savings
echo "Expected savings: 15-25%"
```

---

### Step 6.3: Functional Testing

```bash
# Test each MCP tool
npx tsx -e "
  import { catalogSearch } from './src/tools/operations/catalog-search';
  const result = await catalogSearch({ text: 'test', debug: false });
  console.log(result);
"

# Test concept resolution
npx tsx -e "
  import { ConceptIdCache } from './src/infrastructure/cache/concept-id-cache';
  const cache = ConceptIdCache.getInstance();
  console.log(cache.getStats());
"
```

---

## Phase 7: Performance Benchmarking

### Step 7.1: Create Benchmark Script

**File**: `scripts/benchmark_migration.ts` (new file)

```typescript
import Benchmark from 'benchmark';
import { connect } from '@lancedb/lancedb';

async function runBenchmarks() {
  const db = await connect(process.env.HOME + '/.concept_rag');
  const chunksTable = await db.openTable('chunks');
  const sample = await chunksTable.limit(100).toArray();
  
  const suite = new Benchmark.Suite();
  
  // Benchmark: String-based concept filtering
  suite.add('String-based filter', () => {
    const concepts = JSON.parse(sample[0].concepts) as string[];
    const hasApiGateway = concepts.includes('API gateway');
  });
  
  // Benchmark: ID-based concept filtering
  suite.add('ID-based filter', () => {
    const conceptIds = JSON.parse(sample[0].concept_ids) as string[];
    const hasApiGateway = conceptIds.includes('73');
  });
  
  suite
    .on('cycle', (event: any) => {
      console.log(String(event.target));
    })
    .on('complete', function(this: any) {
      console.log('\nFastest is: ' + this.filter('fastest').map('name'));
      const fastest = this.filter('fastest')[0];
      const slowest = this.filter('slowest')[0];
      const improvement = ((fastest.hz / slowest.hz - 1) * 100).toFixed(1);
      console.log(`Performance improvement: ${improvement}%`);
    })
    .run();
}

await runBenchmarks();
```

**Install benchmark library**:
```bash
npm install --save-dev benchmark @types/benchmark
```

**Run benchmarks**:
```bash
npx tsx scripts/benchmark_migration.ts
```

---

## Troubleshooting

### Issue: "ConceptIdCache not initialized"

**Cause**: Cache accessed before initialization

**Fix**: Ensure container.getConceptIdCache() called before repositories

```typescript
// Wrong order
const catalog = await container.getCatalogRepository();
const cache = await container.getConceptIdCache();

// Correct order (cache auto-initializes in container)
const cache = await container.getConceptIdCache();
const catalog = await container.getCatalogRepository();
```

---

### Issue: concept_ids missing from database

**Cause**: Seeding script not updated or cache not initialized

**Fix**: 
1. Verify cache initialization in hybrid_fast_seed.ts
2. Check logs for "Initializing Concept ID Cache"
3. Verify concept_ids populated: `SELECT * FROM catalog LIMIT 1`

---

### Issue: Concept names not resolving correctly

**Cause**: Cache ID mapping stale or incorrect

**Fix**:
```bash
# Clear and rebuild
rm -rf ~/.concept_rag
npx tsx hybrid_fast_seed.ts
```

---

### Issue: Tests failing after migration

**Cause**: Test mocks not updated with concept_ids field

**Fix**: Update all mock data to include concept_ids field

---

## Rollback Procedure

If something goes wrong:

```bash
# 1. Stop all services
# 2. Restore backup
rm -rf ~/.concept_rag
cp -r ~/.concept_rag.backup.YYYYMMDD_HHMMSS ~/.concept_rag

# 3. Revert code
git reset --hard HEAD~N  # or specific commit

# 4. Rebuild
npm run build

# 5. Test
npm test
```

---

## Success Checklist

Before considering migration complete:

- [ ] All tests pass (`npm test`)
- [ ] Database size reduced by ≥15%
- [ ] Validation script passes 100%
- [ ] All MCP tools functional
- [ ] Cache initializes successfully
- [ ] Concept names resolve correctly
- [ ] No console errors in typical usage
- [ ] Performance benchmarks show improvement
- [ ] Documentation updated

---

## Next Steps After Success

1. **Update Documentation**
   - README.md (mention integer ID optimization)
   - SETUP.md (migration guide for existing users)
   - database-schema-reference.md (update schema)

2. **Monitor Performance**
   - Track query latency over time
   - Monitor cache hit rates
   - Watch memory usage

3. **Consider Phase 2**
   - Optimize source references (if needed)
   - Profile for other bottlenecks

4. **Plan Deprecation**
   - Schedule removal of `concepts` field (v2.0.0)
   - Create migration guide for users

---

**Status**: Ready for implementation  
**Estimated Time**: 2-3 days for full implementation and testing  
**Risk**: Medium (requires database rebuild, but fully reversible)

