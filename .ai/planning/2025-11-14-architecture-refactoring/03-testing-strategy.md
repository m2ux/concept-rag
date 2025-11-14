# Testing Strategy for Concept-RAG Architecture

**Date**: November 14, 2025  
**Purpose**: Add comprehensive test coverage for the refactored clean architecture  
**Status**: In Progress

---

## Knowledge Base Sources

This testing strategy is informed by the following sources from the knowledge base:

### Primary Sources:
1. **"Test Driven Development for Embedded C"** (James W. Grenning)
   - Test doubles, mocks, stubs, spies, fakes
   - Four-Phase Test pattern
   - Dependency injection for testability
   - Breaking dependencies with test doubles

2. **"Continuous Delivery"** (Humble & Farley)
   - Unit testing principles
   - Test isolation and dependencies
   - Test-driven development practices
   - Automated testing pipelines

3. **"Domain-Driven Design"** (Eric Evans)
   - Repository pattern testing
   - Testing domain models
   - Specification patterns for queries

4. **"Code That Fits in Your Head"** (Mark Seemann)
   - Composition Root pattern (which we implemented)
   - Constructor injection for testability
   - Repository pattern testing

5. **"Introduction to Software Design and Architecture With TypeScript"** (Khalil Stemmler)
   - Dependency injection without mocking
   - Testing with repository abstractions
   - TypeScript-specific testing patterns

---

## Testing Principles

### 1. Test Doubles Over Integration Tests (Initially)

**Source**: "Test Driven Development for Embedded C", Chapter 7

> "Managing test dependencies with test doubles... The test case must set up and cleanup the DOCs [Depended-On Components]."

**Application**: Use test doubles (mocks, fakes) for repository dependencies to test tools in isolation before integration testing.

###2. Constructor Injection Enables Testing

**Source**: "Continuous Delivery", Testing Strategies

> "Dependency injection and unit testing... DI allows us to inject test doubles instead of real dependencies."

**Application**: Our refactored architecture uses constructor injection throughout, making every component testable.

### 3. Repository Pattern Testability

**Source**: "Domain-Driven Design", Chapter 6

> "A REPOSITORY represents all objects of a certain type as a conceptual set... The REPOSITORY can be substituted with a different implementation for testing."

**Application**: Repository interfaces allow us to create in-memory test implementations.

### 4. Composition Root Isolation

**Source**: "Code That Fits in Your Head", Design Patterns

> "Composition Root: A (preferably) unique location in an application where modules are composed together."

**Application**: Our `ApplicationContainer` is the composition root - we test it separately from business logic.

---

## Test Architecture

###Test Pyramid

```
         /\
        /  \
       / E2E\       ← Few (manual MCP tool tests)
      /------\
     /  Inte  \     ← Some (tool + repo integration)
    /  gration \
   /------------\
  /  Unit Tests  \  ← Many (repositories, services, models)
 /________________\
```

### Test Layers

#### Layer 1: Unit Tests (Domain & Infrastructure)
- **Domain Models**: Chunk, Concept, SearchResult (simple data validation)
- **Repository Implementations**: LanceDB repositories
- **EmbeddingService**: SimpleEmbeddingService
- **Utilities**: Field parsers, SQL escaping

#### Layer 2: Integration Tests (Application)
- **ApplicationContainer**: Dependency wiring
- **Tool Operations**: With mock repositories
- **QueryExpander**: With mock concept table

#### Layer 3: E2E Tests (System)
- **MCP Server**: Full integration (manual testing for now)

---

## Test Framework: Vitest

**Why Vitest**:
- Native ESM support (our project uses `"type": "module"`)
- TypeScript-first design
- Fast, modern, compatible with Jest API
- Built-in code coverage
- Watch mode for TDD workflow

**Alternative Considered**: Jest (requires extra ESM configuration)

---

## Test Structure

### Directory Organization

```
src/
├── domain/
│   ├── models/__tests__/
│   │   ├── chunk.test.ts
│   │   ├── concept.test.ts
│   │   └── search-result.test.ts
│   └── interfaces/
│       └── (no tests - just interfaces)
│
├── infrastructure/
│   ├── lancedb/
│   │   ├── repositories/__tests__/
│   │   │   ├── lancedb-chunk-repository.test.ts
│   │   │   ├── lancedb-concept-repository.test.ts
│   │   │   └── lancedb-catalog-repository.test.ts
│   │   └── utils/__tests__/
│   │       └── field-parsers.test.ts
│   └── embeddings/__tests__/
│       └── simple-embedding-service.test.ts
│
├── application/__tests__/
│   └── container.test.ts
│
├── tools/operations/__tests__/
│   ├── concept-search.test.ts
│   ├── conceptual-catalog-search.test.ts
│   ├── conceptual-chunks-search.test.ts
│   ├── conceptual-broad-chunks-search.test.ts
│   └── document-concepts-extract.test.ts
│
└── __tests__/
    └── test-helpers/
        ├── mock-repositories.ts
        ├── mock-services.ts
        └── test-data.ts
```

---

## Test Doubles Pattern

**Source**: "Test Driven Development for Embedded C", Chapter 7

### Types of Test Doubles

1. **Stub**: Returns canned answers
2. **Mock**: Verifies interactions
3. **Fake**: Working implementation (simplified)
4. **Spy**: Records information about calls

### Example: Repository Test Doubles

```typescript
// src/__tests__/test-helpers/mock-repositories.ts

/**
 * Fake ChunkRepository for testing
 * 
 * Uses in-memory data structure instead of LanceDB.
 * Based on "Fake" pattern from TDD for Embedded C.
 */
export class FakeChunkRepository implements ChunkRepository {
  private chunks: Map<string, Chunk> = new Map();
  
  constructor(initialChunks: Chunk[] = []) {
    initialChunks.forEach(chunk => this.chunks.set(chunk.id, chunk));
  }
  
  async findByConceptName(concept: string, limit: number): Promise<Chunk[]> {
    const results = Array.from(this.chunks.values())
      .filter(chunk => chunk.concepts?.includes(concept.toLowerCase()))
      .slice(0, limit);
    return Promise.resolve(results);
  }
  
  async findBySource(source: string, limit: number): Promise<Chunk[]> {
    const results = Array.from(this.chunks.values())
      .filter(chunk => chunk.source === source)
      .slice(0, limit);
    return Promise.resolve(results);
  }
  
  async search(query: SearchQuery): Promise<SearchResult[]> {
    // Simplified search for testing
    const results = Array.from(this.chunks.values())
      .filter(chunk => chunk.text.toLowerCase().includes(query.text.toLowerCase()))
      .slice(0, query.limit || 10)
      .map(chunk => ({
        ...chunk,
        distance: 0,
        vectorScore: 1.0,
        bm25Score: 1.0,
        titleScore: 0,
        conceptScore: 0,
        wordnetScore: 0,
        hybridScore: 1.0
      }));
    return Promise.resolve(results);
  }
}
```

---

## Testing Patterns

### Pattern 1: Four-Phase Test

**Source**: "Test Driven Development for Embedded C"

Every test follows this structure:
1. **Setup**: Arrange test data and dependencies
2. **Exercise**: Execute the code under test
3. **Verify**: Assert expected outcomes
4. **Teardown**: Clean up (often automatic)

```typescript
describe('LanceDBChunkRepository', () => {
  describe('findByConceptName', () => {
    it('should return chunks matching concept', async () => {
      // SETUP
      const mockTable = createMockLanceTable();
      const mockConceptRepo = new FakeConceptRepository([testConcept]);
      const mockEmbeddingService = new FakeEmbeddingService();
      const repository = new LanceDBChunkRepository(
        mockTable,
        mockConceptRepo,
        mockEmbeddingService
      );
      
      // EXERCISE
      const results = await repository.findByConceptName('innovation', 10);
      
      // VERIFY
      expect(results).toHaveLength(5);
      expect(results[0].concepts).toContain('innovation');
      
      // TEARDOWN (automatic)
    });
  });
});
```

### Pattern 2: Test Data Builders

**Source**: "Domain-Driven Design", Chapter 14

Create helper functions to build test data:

```typescript
// src/__tests__/test-helpers/test-data.ts

export function createTestChunk(overrides?: Partial<Chunk>): Chunk {
  return {
    id: 'test-chunk-1',
    text: 'This is a test chunk about innovation and creativity.',
    source: '/test/document.pdf',
    hash: 'abc123',
    concepts: ['innovation', 'creativity'],
    conceptCategories: ['business', 'design'],
    conceptDensity: 0.8,
    ...overrides
  };
}

export function createTestConcept(overrides?: Partial<Concept>): Concept {
  return {
    concept: 'innovation',
    conceptType: 'thematic',
    category: 'business',
    sources: ['/test/document.pdf'],
    relatedConcepts: ['creativity', 'disruption'],
    synonyms: ['novelty', 'originality'],
    broaderTerms: ['change'],
    narrowerTerms: ['breakthrough'],
    embeddings: new Array(384).fill(0.5),
    weight: 1.0,
    chunkCount: 10,
    enrichmentSource: 'corpus',
    ...overrides
  };
}
```

### Pattern 3: Dependency Injection in Tests

**Source**: "Continuous Delivery", Unit Testing Practices

```typescript
describe('ConceptSearchTool', () => {
  it('should search using repository', async () => {
    // Inject fake repositories instead of real ones
    const fakeChunkRepo = new FakeChunkRepository([
      createTestChunk({ concepts: ['innovation'] }),
      createTestChunk({ concepts: ['creativity'] })
    ]);
    const fakeConceptRepo = new FakeConceptRepository([
      createTestConcept({ concept: 'innovation' })
    ]);
    
    const tool = new ConceptSearchTool(fakeChunkRepo, fakeConceptRepo);
    
    const result = await tool.execute({ concept: 'innovation', limit: 10 });
    
    expect(result).toBeDefined();
    expect(JSON.parse(result.content[0].text)).toHaveLength(1);
  });
});
```

---

## Test Coverage Goals

### Minimum Coverage Targets

**Source**: "Continuous Delivery", Chapter 4

> "Aim for at least 80% code coverage, but focus on testing critical paths and complex logic rather than chasing 100%."

| Component | Target Coverage | Priority |
|-----------|----------------|----------|
| Repository Implementations | 85% | High |
| EmbeddingService | 90% | High |
| Domain Models | 70% | Medium |
| Utility Functions | 95% | High |
| ApplicationContainer | 80% | High |
| Tool Operations | 75% | Medium |

### What NOT to Test

**Source**: "Code That Fits in Your Head", Chapter 6

- Don't test third-party libraries (LanceDB itself)
- Don't test trivial getters/setters
- Don't test interfaces (only implementations)
- Don't test generated code
- Don't test the Composition Root's wiring logic exhaustively (integration test is sufficient)

---

## Implementation Plan

### Phase 1: Test Infrastructure (30 minutes)
1. Install Vitest and dependencies
2. Create vitest.config.ts
3. Add test scripts to package.json
4. Create test-helpers directory with mocks

### Phase 2: Domain & Infrastructure Tests (1 hour)
1. **Utilities** (15 min):
   - `field-parsers.test.ts`
2. **EmbeddingService** (15 min):
   - `simple-embedding-service.test.ts`
3. **Repositories** (30 min):
   - `lancedb-chunk-repository.test.ts`
   - `lancedb-concept-repository.test.ts`
   - `lancedb-catalog-repository.test.ts`

### Phase 3: Application Tests (45 minutes)
1. **ApplicationContainer** (20 min):
   - Test dependency wiring
   - Test initialization
   - Test cleanup
2. **Tool Operations** (25 min):
   - One representative tool (ConceptSearchTool)
   - Test with mocks

### Phase 4: Documentation & Commit (15 minutes)
1. Update testing documentation
2. Add README for test helpers
3. Commit with proper references

**Total Estimated Time**: 2-2.5 hours (agentic)

---

## Testing Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (TDD workflow)
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test field-parsers

# Run tests in CI (no watch, with coverage)
npm run test:ci
```

---

## Success Criteria

✅ **Test infrastructure setup**: Vitest configured and working  
✅ **Test helpers created**: Fake repositories, test data builders  
✅ **Core functionality tested**: Repositories, services, utilities  
✅ **80%+ coverage**: On critical components  
✅ **Tests pass**: All tests green  
✅ **Documentation**: Clear testing guide for future developers  

---

## Future Enhancements

### Integration with CI/CD
**Source**: "Continuous Delivery", Chapter 3

- Add GitHub Actions workflow
- Run tests on every commit
- Block merges if tests fail
- Generate coverage reports

### Property-Based Testing
**Source**: "Rust for Rustaceans", Chapter 6

- Use `fast-check` library
- Generate random test data
- Find edge cases automatically
- Especially useful for parsing and validation

### Contract Testing for Repositories
**Source**: "Domain-Driven Design", Repository Pattern

- Define interface contract tests
- Run same tests against all repository implementations
- Ensures consistency across implementations

---

## References

### Knowledge Base
- "Test Driven Development for Embedded C" (Grenning) - Test doubles, TDD practices
- "Continuous Delivery" (Humble & Farley) - Testing strategies, CI/CD
- "Domain-Driven Design" (Evans) - Repository pattern testing
- "Code That Fits in Your Head" (Seemann) - Composition Root, testability
- "Introduction to Software Design and Architecture With TypeScript" (Stemmler) - DI patterns

### External Resources
- [Vitest Documentation](https://vitest.dev/)
- [TypeScript Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

**Document Status**: ✅ Complete  
**Next Step**: Implement test infrastructure (Phase 1)

