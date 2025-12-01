# Test Helpers

This directory contains test doubles and utilities for testing the concept-rag architecture.

## Overview

Following the "Test Doubles" pattern from **"Test Driven Development for Embedded C"** (Grenning, Chapter 7), we provide fake implementations of repositories and services for fast, isolated testing.

## Files

### `test-data.ts` - Test Data Builders

Helper functions to create test data following the "Test Data Builder" pattern from **Domain-Driven Design** (Evans).

**Functions**:
- `createTestChunk()` - Creates a Chunk with sensible defaults
- `createTestConcept()` - Creates a Concept with sensible defaults
- `createTestSearchResult()` - Creates a SearchResult with sensible defaults
- `createTestEmbedding()` - Creates an embedding vector for testing
- `createTestChunks()` - Creates multiple chunks
- `createTestConcepts()` - Creates multiple concepts

### `mock-repositories.ts` - Fake Repository Implementations

Fake implementations of repository interfaces using in-memory storage.

**Classes**:
- `FakeChunkRepository` - In-memory chunk storage
- `FakeConceptRepository` - In-memory concept storage
- `FakeCatalogRepository` - In-memory catalog storage

These fakes implement the same interfaces as the real repositories but use simple Map-based storage instead of LanceDB.

### `mock-services.ts` - Fake Service Implementations

Fake implementations of service interfaces.

**Classes**:
- `FakeEmbeddingService` - Deterministic embedding generation for tests

## Usage Example

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { ConceptChunksTool } from '../concept_search.js';
import {
  FakeChunkRepository,
  FakeConceptRepository,
  createTestChunk,
  createTestConcept
} from '../../__tests__/test-helpers/index.js';

describe('ConceptChunksTool', () => {
  let chunkRepo: FakeChunkRepository;
  let conceptRepo: FakeConceptRepository;
  let tool: ConceptChunksTool;
  
  beforeEach(() => {
    // Fresh repos for each test
    chunkRepo = new FakeChunkRepository();
    conceptRepo = new FakeConceptRepository();
    tool = new ConceptChunksTool(chunkRepo, conceptRepo);
  });
  
  it('should find chunks by concept', async () => {
    // SETUP
    const concept = createTestConcept({ concept: 'innovation' });
    const chunk = createTestChunk({ concepts: ['innovation'] });
    
    conceptRepo.addConcept(concept);
    chunkRepo.addChunk(chunk);
    
    // EXERCISE
    const result = await tool.execute({ concept: 'innovation', limit: 10 });
    
    // VERIFY
    expect(result).toBeDefined();
    // ... assertions
  });
});
```

## Design Patterns

### Test Doubles (TDD for Embedded C)

We use "Fakes" - working implementations with shortcuts:
- Real repositories use LanceDB
- Fake repositories use in-memory Maps
- Both implement the same interface

### Dependency Injection (Continuous Delivery)

Constructor injection enables swapping real implementations for fakes:

```typescript
// Production
const repo = new LanceDBChunkRepository(table, conceptRepo, embeddingService);

// Testing
const repo = new FakeChunkRepository([testChunks]);
```

### Four-Phase Test (TDD for Embedded C)

Every test follows:
1. **Setup** - Arrange test data
2. **Exercise** - Call the code under test
3. **Verify** - Assert expected outcomes
4. **Teardown** - Clean up (often automatic)

## References

- **"Test Driven Development for Embedded C"** (Grenning) - Test doubles, fakes, mocks
- **"Continuous Delivery"** (Humble & Farley) - Testing with dependency injection
- **"Domain-Driven Design"** (Evans) - Test data builders
- **"Code That Fits in Your Head"** (Seemann) - Repository pattern testing

