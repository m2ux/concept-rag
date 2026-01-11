# 19. Vitest as Testing Framework

**Date:** 2025-11-14  
**Status:** Accepted  
**Deciders:** Engineering Team  
**Technical Story:** Architecture Refactoring - Testing Infrastructure (November 14, 2025)

**Sources:**
- Planning: .ai/planning/2025-11-14-architecture-refactoring/

## Context and Problem Statement

The architecture refactoring [ADR-0016, ADR-0017, ADR-0018] enabled testability, but a testing framework was needed to write and run tests. The codebase is TypeScript with ESM modules, requiring a modern test framework with good TypeScript support and fast execution.

**The Core Problem:** Which testing framework to use for TypeScript/ESM codebase with focus on speed and developer experience? [Planning: `.ai/planning/2025-11-14-architecture-refactoring/03-testing-strategy.md`]

**Decision Drivers:**
* TypeScript ESM support required [Requirement: module system]
* Fast test execution (<1 second for unit tests) [Goal: rapid feedback]
* Good TypeScript developer experience [Requirement: DX]
* Mock/fake support for repositories [Requirement: test doubles]
* Integration test capability [Requirement: real database tests]
* Modern tooling (watch mode, coverage, UI) [Preference: modern DX]

## Alternative Options

* **Option 1: Vitest** - Vite-powered test framework
* **Option 2: Jest** - Industry standard testing framework
* **Option 3: Mocha + Chai** - Traditional test framework
* **Option 4: Node.js Native Test Runner** - Built-in test runner (Node 18+)
* **Option 5: AVA** - Minimalist test runner

## Decision Outcome

**Chosen option:** "Vitest (Option 1)", because it provides native ESM support, blazing-fast execution, excellent TypeScript integration, and modern developer experience that aligns with the project's technology stack.

### Configuration

**File:** `vitest.config.ts` [Source: project root]
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json']
    }
  }
});
```

**Package Dependency:** [Source: `package.json`]
```json
{
  "devDependencies": {
    "vitest": "^4.0.9",
    "@vitest/ui": "^4.0.9"
  },
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage"
  }
}
```

### Test Structure

**Test Types Implemented:** [Source: `05-testing-infrastructure-complete.md`]

**Unit Tests (32 tests):** [Source: `PR-DESCRIPTION.md`, line 66]
- `field-parsers.test.ts` - 14 tests (SQL injection prevention)
- `simple-embedding-service.test.ts` - 9 tests (embedding generation)
- `concept-search.test.ts` - 9 tests (tool with fake repositories)

**Integration Tests (5 tests):** [Source: `PR-DESCRIPTION.md`, line 67]
- `src/__tests__/integration/live-integration.test.ts` - All 5 MCP tools with real database

**Test Helpers:** [Source: `src/__tests__/test-helpers/`]
- Mock repositories (fakes implementing interfaces)
- Test data builders
- Integration test setup

### Consequences

**Positive:**
* **Fast execution:** <200ms for 32 unit tests [Source: `05-testing-infrastructure-complete.md`, test results]
* **Native ESM:** No configuration hacks for ES modules [Benefit: seamless]
* **TypeScript:** First-class TypeScript support [Benefit: type safety]
* **Watch mode:** Instant re-run on file changes [DX: rapid feedback]
* **UI mode:** Visual test runner available [DX: debugging]
* **Coverage:** Built-in coverage reporting (v8) [Feature: coverage]
* **Compatible:** Works with Vite ecosystem [Benefit: if frontend added]
* **Modern DX:** Excellent developer experience [Benefit: productivity]

**Negative:**
* **Newer framework:** Smaller ecosystem than Jest [Risk: less mature]
* **Less familiar:** Team may know Jest better [Learning: if Jest background]
* **Fewer plugins:** Smaller plugin ecosystem [Limitation: extensions]
* **Breaking changes:** Version 4.x had breaking changes from 3.x [Risk: upgrades]

**Neutral:**
* **Vite-based:** Uses Vite under the hood (fast but opinionated) [Architecture: Vite dependency]
* **API similar to Jest:** Easy transition if coming from Jest [Familiarity: Jest-like]

### Confirmation

**Test Results:** [Source: `05-testing-infrastructure-complete.md`, lines 108-126]
- **37/37 tests passing** (100%) [Result: all green]
- **Execution time:** <200ms for unit tests, ~2s for integration tests
- **Coverage:** Significant coverage of utilities, services, tools
- **CI-ready:** Tests run in continuous integration

**Test Organization:** [Source: Test file structure]
```
src/__tests__/
├── integration/
│   ├── catalog-repository.integration.test.ts
│   ├── chunk-repository.integration.test.ts
│   ├── concept-repository.integration.test.ts
│   └── concept-search-regression.integration.test.ts
└── test-helpers/
    ├── mock-repositories.ts
    ├── mock-services.ts
    ├── test-data.ts
    └── integration-test-data.ts

test/
└── integration/
    └── live-integration.test.ts
```

## Pros and Cons of the Options

### Option 1: Vitest - Chosen

**Pros:**
* Native ESM support (no hacks)
* Blazing fast (<200ms for 32 tests) [Validated]
* Excellent TypeScript integration
* Modern DX (watch, UI, coverage)
* Vite ecosystem compatible
* Jest-like API (familiar)
* 37 tests working perfectly [Result]

**Cons:**
* Newer (smaller ecosystem)
* Less familiar than Jest
* Fewer plugins available
* Version 4.x breaking changes

### Option 2: Jest

Industry standard testing framework.

**Pros:**
* Industry standard
* Huge ecosystem
* Excellent documentation
* Large community
* Many plugins

**Cons:**
* **ESM support problematic:** Requires configuration hacks [Dealbreaker: complexity]
* **Slower:** Heavier than Vitest [Performance: slower]
* **Transform overhead:** Babel/ts-jest transformation [Complexity: config]
* **Not chosen:** ESM issues too annoying

### Option 3: Mocha + Chai

Traditional testing framework.

**Pros:**
* Very mature
* Flexible
* Well-understood
* Lightweight

**Cons:**
* **Requires separate assertion library:** Mocha + Chai + Sinon [Complexity: multiple tools]
* **More configuration:** Must wire pieces together
* **Less TypeScript-focused:** Not designed for TypeScript-first
* **Older paradigm:** Less modern DX
* **Not chosen:** More setup required

### Option 4: Node.js Native Test Runner

Built-in test runner (Node 18+).

**Pros:**
* No external dependency
* Built into Node.js
* Simple
* Fast

**Cons:**
* **Basic features:** No coverage, no UI, minimal reporters [Limitation: bare-bones]
* **New:** Still experimental/evolving [Risk: immature]
* **Limited assertions:** Must use assert or add library
* **No mocking:** Must add separate mocking library
* **Too basic:** Vitest provides much better DX [Comparison: insufficient]

### Option 5: AVA

Minimalist concurrent test runner.

**Pros:**
* Concurrent tests (faster)
* Minimal
* Good TypeScript support

**Cons:**
* **Smaller community:** Less popular than Jest/Vitest [Risk: support]
* **Less tooling:** Fewer integrations
* **Concurrent complexity:** Harder to debug [Trade-off: speed vs. debugging]
* **Not chosen:** Vitest provides better overall package

## Implementation Notes

### Test Pattern: Four-Phase Test

**Pattern Applied:** [Source: `03-testing-strategy.md`, Four-Phase Test pattern]
```typescript
describe('ConceptRepository', () => {
  it('should find concept by name', async () => {
    // Setup - Arrange
    const repository = new FakeConceptRepository();
    repository.addTestConcept({ concept: 'test', category: 'testing' });
    
    // Exercise - Act
    const result = await repository.findByName('test');
    
    // Verify - Assert
    expect(result).toBeDefined();
    expect(result?.concept).toBe('test');
    
    // Teardown - (implicit, no resources to clean)
  });
});
```

### Test Doubles Pattern

**Fakes (not Mocks):** [Source: `03-testing-strategy.md`, Test Doubles pattern]
- Fake repositories with real logic (in-memory storage)
- More realistic than mocks
- Test behavior, not implementation

**Example:**
```typescript
export class FakeChunkRepository implements IChunkRepository {
  private chunks: Chunk[] = [];
  
  async searchByVector(embedding: number[], limit: number): Promise<Chunk[]> {
    // Real search logic using in-memory array
    return this.chunks
      .map(chunk => ({ chunk, similarity: cosineSimilarity(embedding, chunk.vector) }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(r => r.chunk);
  }
}
```

### Scripts

**Test Commands:** [Source: `package.json`, lines 21-25]
```bash
npm test                # Run all tests once
npm run test:watch      # Watch mode (re-run on changes)
npm run test:ui         # Visual UI test runner
npm run test:coverage   # Generate coverage report
```

## Related Decisions

- [ADR-0016: Layered Architecture](adr0016-layered-architecture-refactoring.md) - Architecture enables testing
- [ADR-0017: Repository Pattern](adr0017-repository-pattern.md) - Repositories tested with fakes
- [ADR-0018: DI Container](adr0018-dependency-injection-container.md) - DI enables test injection

## References

### Related Decisions
- [ADR-0016: Layered Architecture](adr0016-layered-architecture-refactoring.md)
- [ADR-0017: Repository Pattern](adr0017-repository-pattern.md)

---

**Confidence Level:** HIGH
**Attribution:**
- Planning docs: November 14, 2024
- Testing strategy: 03-testing-strategy.md
- Test results: 05-testing-infrastructure-complete.md lines 108-126

**Traceability:** .ai/planning/2025-11-14-architecture-refactoring/



