# Testing Coverage Enhancement Plan

**Date:** 2025-11-20  
**Priority:** HIGH (Phase 1, Week 1-2)  
**Status:** Planning

## Overview

Enhance test coverage for the concept-RAG project by applying unit and integration testing concepts from the knowledge base. Establish comprehensive testing infrastructure that enables safe refactoring and validates system behavior.

## Knowledge Base Insights Applied

### Core Testing Concepts

**From "Code That Fits in Your Head" and Software Engineering sources:**

1. **Repository Pattern Testing**
   - Use fake implementations for integration tests
   - Test against interfaces, not implementations
   - Boundary tests with fake databases

2. **Vertical Slice Testing**
   - Test complete workflows from API to database
   - Validate end-to-end functionality
   - Include realistic data flows

3. **Testing Pyramid Strategy**
   - Many unit tests (fast, isolated)
   - Fewer integration tests (medium speed, component interaction)
   - Few end-to-end tests (slow, full system)

4. **Test-Driven Development Principles**
   - Write failing test first
   - Implement minimum code to pass
   - Refactor with test safety net
   - Use Transformation Priority Premise for guidance

5. **Parametrized Testing**
   - Reduce test duplication
   - Increase coverage with multiple scenarios
   - Test boundary conditions systematically

## Current State Assessment

### Existing Test Infrastructure

```
src/__tests__/
├── integration/
│   ├── catalog-integration.test.ts
│   └── vectorstore-integration.test.ts
├── test-helpers/
│   ├── in-memory-repository.ts
│   └── test-environment.ts
└── (unit tests)

test/
├── integration/
│   └── search-workflow.test.ts
└── scripts/
    └── run-integration-tests.sh
```

### Current Coverage Status
- **Estimated Coverage:** 40-60% (unverified)
- **Unit Tests:** Present for some services
- **Integration Tests:** Basic catalog and search tests
- **E2E Tests:** None
- **Performance Tests:** None
- **Contract Tests:** None (MCP tool interfaces)

### Testing Framework
- **Primary:** Vitest
- **Configuration:** `vitest.config.ts`
- **Test Helpers:** In-memory repositories available

## Testing Strategy

### Layer-by-Layer Coverage

#### 1. Domain Layer Testing (Unit Tests)
**Target: 90% coverage**

**Services to Test:**
- `ConceptExtractionService`
- `HybridSearchService`
- `EmbeddingService`
- `CategoryService`

**Testing Approach:**
```typescript
// Example: HybridSearchService unit test
describe('HybridSearchService', () => {
  it('should combine vector and BM25 scores correctly', () => {
    // Arrange
    const mockVectorResults = [...];
    const mockBM25Results = [...];
    
    // Act
    const combined = service.combineScores(mockVectorResults, mockBM25Results);
    
    // Assert
    expect(combined).toHaveLength(expected);
    expect(combined[0].score).toBeCloseTo(expectedScore);
  });
  
  // Parametrized test for score normalization
  it.each([
    { input: [1, 2, 3], expected: [0.33, 0.67, 1.0] },
    { input: [10, 20], expected: [0.5, 1.0] },
    { input: [0, 0, 0], expected: [0, 0, 0] }
  ])('should normalize scores: $input', ({ input, expected }) => {
    const normalized = service.normalizeScores(input);
    expect(normalized).toEqual(expected);
  });
});
```

**Mock Strategy:**
- Use Vitest's built-in mocking for external dependencies
- Create fake implementations for repositories
- Use test doubles for embedding providers

#### 2. Infrastructure Layer Testing (Integration Tests)
**Target: 80% coverage**

**Components to Test:**
- `LanceDBVectorStore`
- `ConceptRepository`
- `DocumentRepository`
- `CategoryRepository`
- Document loaders (PDF, EPUB, Markdown, TXT)

**Testing Approach:**
```typescript
// Example: Repository integration test with fake database
describe('ConceptRepository Integration', () => {
  let repository: ConceptRepository;
  let testDb: TestDatabase;
  
  beforeEach(async () => {
    testDb = await createTestDatabase();
    repository = new ConceptRepository(testDb.connection);
  });
  
  afterEach(async () => {
    await testDb.cleanup();
  });
  
  it('should persist and retrieve concepts', async () => {
    // Arrange
    const concept = createTestConcept();
    
    // Act
    await repository.save(concept);
    const retrieved = await repository.findByName(concept.name);
    
    // Assert
    expect(retrieved).toEqual(concept);
  });
  
  // Boundary test
  it('should handle duplicate concepts gracefully', async () => {
    const concept = createTestConcept();
    await repository.save(concept);
    
    // Should throw or return existing
    await expect(repository.save(concept)).resolves.not.toThrow();
  });
});
```

**Test Database Strategy:**
- Use in-memory SQLite for fast tests
- Seed with minimal realistic data
- Clean up after each test

#### 3. Application Layer Testing (Integration Tests)
**Target: 85% coverage**

**Components to Test:**
- Dependency injection container
- Application bootstrap
- Configuration loading

**Testing Approach:**
```typescript
describe('Application Container', () => {
  it('should resolve all dependencies', () => {
    const container = createContainer();
    
    // Verify all critical services can be resolved
    expect(container.resolve('HybridSearchService')).toBeDefined();
    expect(container.resolve('ConceptRepository')).toBeDefined();
    expect(container.resolve('EmbeddingService')).toBeDefined();
  });
  
  it('should use singleton pattern for repositories', () => {
    const container = createContainer();
    const repo1 = container.resolve('ConceptRepository');
    const repo2 = container.resolve('ConceptRepository');
    
    expect(repo1).toBe(repo2); // Same instance
  });
});
```

#### 4. Tools Layer Testing (Contract Tests)
**Target: 90% coverage**

**MCP Tools to Test:**
- `catalog_search`
- `chunks_search`
- `broad_chunks_search`
- `concept_search`
- `extract_concepts`
- `category_search`
- `list_categories`
- `list_concepts_in_category`

**Testing Approach:**
```typescript
// Contract test for MCP tool interface
describe('catalog_search tool', () => {
  it('should match MCP tool contract', async () => {
    const result = await catalogSearch({
      text: 'software architecture',
      debug: false
    });
    
    // Verify contract
    expect(result).toHaveProperty('documents');
    expect(result.documents).toBeArray();
    expect(result.documents[0]).toHaveProperty('source');
    expect(result.documents[0]).toHaveProperty('text');
    expect(result.documents[0]).toHaveProperty('score');
  });
  
  // Test parameter validation
  it('should validate required parameters', async () => {
    await expect(catalogSearch({})).rejects.toThrow('text is required');
  });
  
  // Test optional parameters
  it('should handle optional debug parameter', async () => {
    const result = await catalogSearch({
      text: 'test',
      debug: true
    });
    
    expect(result).toHaveProperty('debug_info');
  });
});
```

#### 5. End-to-End Testing (E2E Tests)
**Target: Key workflows only**

**Critical Workflows:**
1. Document ingestion → embedding → storage → search
2. Concept extraction → enrichment → search
3. Category assignment → filtering → retrieval

**Testing Approach:**
```typescript
describe('E2E: Document Search Workflow', () => {
  it('should ingest, index, and search documents', async () => {
    // Arrange: Create test document
    const testDoc = await createTestDocument('test.pdf');
    
    // Act: Ingest
    const indexResult = await indexDocument(testDoc);
    expect(indexResult.success).toBe(true);
    
    // Act: Search
    const searchResults = await broadChunksSearch({
      text: 'key concept from document'
    });
    
    // Assert: Document is found
    expect(searchResults.results).toContainEqual(
      expect.objectContaining({ source: testDoc.path })
    );
  });
});
```

## Implementation Tasks

### Week 1: Infrastructure and Unit Tests

#### Task 1.1: Enable Coverage Reporting
**Time:** 2 hours

```json
// Update vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.ts',
        'src/**/__tests__/**'
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80
      }
    }
  }
});
```

**Deliverables:**
- [ ] Coverage reporting enabled
- [ ] Baseline coverage report generated
- [ ] Coverage thresholds configured

#### Task 1.2: Create Test Utilities
**Time:** 4 hours

**Files to Create:**
- `src/__tests__/test-helpers/test-database.ts` - SQLite test DB setup
- `src/__tests__/test-helpers/test-fixtures.ts` - Sample data generators
- `src/__tests__/test-helpers/mock-embeddings.ts` - Mock embedding provider

**Example Test Utility:**
```typescript
// test-database.ts
export class TestDatabase {
  private db: Database;
  
  async initialize() {
    this.db = await createInMemoryDatabase();
    await this.runMigrations();
  }
  
  async cleanup() {
    await this.db.close();
  }
  
  get connection() {
    return this.db;
  }
  
  async seed(data: TestData) {
    // Insert test data
  }
}

// test-fixtures.ts
export const createTestConcept = (overrides?: Partial<Concept>): Concept => ({
  name: 'test concept',
  category: 'software engineering',
  weight: 1.0,
  ...overrides
});
```

**Deliverables:**
- [ ] Test database utility created
- [ ] Test fixture generators implemented
- [ ] Mock services available

#### Task 1.3: Unit Tests for Domain Services
**Time:** 8 hours

**Priority Services:**
1. `HybridSearchService` - Score combination logic
2. `ConceptExtractionService` - Concept identification
3. `EmbeddingService` - Embedding management
4. `CategoryService` - Category operations

**Test Structure:**
```typescript
describe('HybridSearchService', () => {
  describe('score combination', () => {
    it('should combine vector and BM25 scores');
    it('should normalize scores to 0-1 range');
    it('should handle empty results');
    it('should weight different score types');
  });
  
  describe('result ranking', () => {
    it('should rank by combined score');
    it('should handle tied scores');
    it('should respect limit parameter');
  });
  
  describe('error handling', () => {
    it('should handle missing scores gracefully');
    it('should validate input parameters');
  });
});
```

**Deliverables:**
- [ ] Unit tests for 4 core services
- [ ] Minimum 85% coverage for tested services
- [ ] Parametrized tests for boundary conditions

### Week 2: Integration and Contract Tests

#### Task 2.1: Repository Integration Tests
**Time:** 6 hours

**Repositories to Test:**
- `ConceptRepository`
- `DocumentRepository`
- `CategoryRepository`
- `ChunkRepository`

**Test Pattern:**
```typescript
describe('Repository Integration Tests', () => {
  let testDb: TestDatabase;
  let repository: Repository;
  
  beforeEach(async () => {
    testDb = await TestDatabase.create();
    repository = new Repository(testDb.connection);
  });
  
  afterEach(async () => {
    await testDb.cleanup();
  });
  
  describe('CRUD operations', () => {
    it('should create records');
    it('should read records');
    it('should update records');
    it('should delete records');
  });
  
  describe('queries', () => {
    it('should filter by criteria');
    it('should paginate results');
    it('should join related data');
  });
});
```

**Deliverables:**
- [ ] Integration tests for all repositories
- [ ] Test database with migrations
- [ ] Minimum 80% coverage

#### Task 2.2: MCP Tool Contract Tests
**Time:** 6 hours

**Tools to Test:**
- All 8 MCP tools (catalog_search, chunks_search, etc.)

**Contract Validation:**
```typescript
describe('MCP Tool Contracts', () => {
  describe.each([
    { tool: 'catalog_search', params: { text: 'test' } },
    { tool: 'chunks_search', params: { text: 'test', source: 'doc.pdf' } },
    { tool: 'concept_search', params: { concept: 'test' } }
  ])('$tool', ({ tool, params }) => {
    it('should accept valid parameters', async () => {
      const result = await invokeTool(tool, params);
      expect(result).toBeDefined();
    });
    
    it('should reject invalid parameters', async () => {
      await expect(invokeTool(tool, {})).rejects.toThrow();
    });
    
    it('should return expected schema', async () => {
      const result = await invokeTool(tool, params);
      expect(result).toMatchSchema(toolSchemas[tool]);
    });
  });
});
```

**Deliverables:**
- [ ] Contract tests for all 8 tools
- [ ] JSON schema validation
- [ ] Parameter validation tests

#### Task 2.3: E2E Workflow Tests
**Time:** 4 hours

**Critical Workflows:**
1. Document ingestion and search
2. Concept extraction and enrichment
3. Category-based filtering

**Deliverables:**
- [ ] 3 E2E test suites
- [ ] Realistic test data
- [ ] Cleanup automation

## Testing Best Practices

### From Knowledge Base

1. **Vertical Slice Approach**
   - Test complete features, not just layers
   - Include realistic data flows
   - Validate actual user scenarios

2. **Test Independence**
   - Each test should be isolated
   - No shared state between tests
   - Cleanup after every test

3. **Boundary Testing**
   - Test edge cases (empty, null, max values)
   - Test error conditions
   - Test concurrent operations

4. **Descriptive Test Names**
   - Use "should" statements
   - Include context and expected behavior
   - Make failures self-explanatory

5. **Arrange-Act-Assert Pattern**
   - Clear separation of test phases
   - One logical assertion per test
   - Descriptive variable names

## Success Criteria

### Coverage Targets
- [ ] Overall coverage > 80%
- [ ] Domain layer > 90%
- [ ] Infrastructure layer > 80%
- [ ] Tools layer > 90%
- [ ] Critical paths 100% covered

### Quality Metrics
- [ ] All tests pass consistently
- [ ] Test suite runs in < 30 seconds
- [ ] Zero flaky tests
- [ ] No skipped tests in CI
- [ ] Coverage trends upward

### Documentation
- [ ] Testing guidelines documented
- [ ] Test helper usage examples
- [ ] CI/CD integration configured
- [ ] Coverage reports accessible

## Integration with CI/CD

### GitHub Actions Workflow
```yaml
name: Tests and Coverage

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

## Risks and Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Tests uncover existing bugs | Medium | Good! Fix bugs as discovered |
| Test suite too slow | High | Use test database, mock external calls |
| Flaky integration tests | High | Ensure proper cleanup, use fixed test data |
| Coverage drops during development | Medium | Set up pre-commit hooks, CI gates |

## Next Steps

1. **Immediate**: Review and approve plan
2. **Day 1**: Enable coverage reporting (Task 1.1)
3. **Day 2**: Create test utilities (Task 1.2)
4. **Week 1**: Implement unit tests (Task 1.3)
5. **Week 2**: Implement integration/contract tests (Tasks 2.1-2.3)

---

**Related Documents:**
- [01-analysis-and-priorities.md](01-analysis-and-priorities.md)
- [04-error-handling-plan.md](04-error-handling-plan.md) (tests validate error handling)

**Knowledge Base Sources:**
- "Code That Fits in Your Head" - Testing patterns, vertical slices
- Software Testing & Verification category - Coverage strategies
- Clean Architecture - Testing through interfaces


