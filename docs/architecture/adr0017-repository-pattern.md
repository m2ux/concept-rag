# 17. Repository Pattern for Data Access

**Date:** 2025-11-14  
**Status:** Accepted  
**Deciders:** Engineering Team  
**Technical Story:** Architecture Refactoring - Phase 1 (November 14, 2025)

**Sources:**
- Planning: [2025-11-14-architecture-refactoring](https://github.com/m2ux/concept-rag/tree/engineering/artifacts/planning/2025-11-14-architecture-refactoring/)

## Context and Problem Statement

Tools directly accessed LanceDB tables via global imports [Problem: ADR-0016], creating tight coupling and making unit testing impossible [Source: [01-architecture-review-analysis.md](https://github.com/m2ux/concept-rag/blob/engineering/artifacts/planning/2025-11-14-architecture-refactoring/01-architecture-review-analysis.md), lines 59-79]. Business logic was mixed with database queries, and there was no abstraction layer for data access [Issues: lines 196-200].

**The Core Problem:** How to abstract database access to enable testing, reduce coupling, and follow the Dependency Inversion Principle? [Planning: [02-implementation-plan.md](https://github.com/m2ux/concept-rag/blob/engineering/artifacts/planning/2025-11-14-architecture-refactoring/02-implementation-plan.md), line 28]

**Decision Drivers:**
* Enable unit testing with mock/fake implementations [Source: [03-testing-strategy.md](https://github.com/m2ux/concept-rag/blob/engineering/artifacts/planning/2025-11-14-architecture-refactoring/03-testing-strategy.md)]
* Eliminate tight coupling to LanceDB [Goal: framework independence]
* Separate business logic from infrastructure [Principle: separation of concerns]
* Industry pattern (Repository Pattern from DDD) [Source: Knowledge Base: "Domain-Driven Design"]
* Prepare for potential database migration [Future: flexibility]

## Alternative Options

* **Option 1: Fine-Grained Repositories** - ChunkRepository, ConceptRepository, CatalogRepository
* **Option 2: Single Unified Repository** - One repository for all data access
* **Option 3: DAO Pattern** - Data Access Objects (Java-style)
* **Option 4: Active Record** - Models with database methods
* **Option 5: Direct Database Access** - No abstraction (current state)

## Decision Outcome

**Chosen option:** "Fine-Grained Repositories (Option 1)", because it provides clear responsibility boundaries, enables focused testing, and follows single responsibility principle.

### Repository Interfaces

**Defined in Domain Layer:** [Source: [02-implementation-plan.md](https://github.com/m2ux/concept-rag/blob/engineering/artifacts/planning/2025-11-14-architecture-refactoring/02-implementation-plan.md), lines 183-424]

**IChunkRepository:**
```typescript
interface IChunkRepository {
  searchByVector(embedding: number[], limit: number): Promise<Chunk[]>;
  searchByConcept(concept: string, limit: number): Promise<SearchResult[]>;
  findBySource(source: string): Promise<Chunk[]>;
  findByConcepts(concepts: string[]): Promise<Chunk[]>;
}
```
[Source: `src/domain/interfaces/repositories/chunk-repository.ts`]

**IConceptRepository:**
```typescript
interface IConceptRepository {
  findByName(name: string): Promise<Concept | null>;
  findByCategory(category: string): Promise<Concept[]>;
  searchSimilar(embedding: number[], limit: number): Promise<Concept[]>;
  getAll(): Promise<Concept[]>;
}
```
[Source: `src/domain/interfaces/repositories/concept-repository.ts`]

**ICatalogRepository:**
```typescript
interface ICatalogRepository {
  searchByVector(embedding: number[], limit: number): Promise<SearchResult[]>;
  findBySource(source: string): Promise<CatalogEntry | null>;
  getAll(): Promise<CatalogEntry[]>;
}
```
[Source: `src/domain/interfaces/repositories/catalog-repository.ts`]

### Design Decisions

**1. Method-Per-Query API:** [Source: [02-implementation-plan.md](https://github.com/m2ux/concept-rag/blob/engineering/artifacts/planning/2025-11-14-architecture-refactoring/02-implementation-plan.md), line 23]
- Explicit methods like `searchByVector()`, `findByName()`
- Type-safe parameters and return types
- Self-documenting interface

**2. Domain Models:** [Source: [02-implementation-plan.md](https://github.com/m2ux/concept-rag/blob/engineering/artifacts/planning/2025-11-14-architecture-refactoring/02-implementation-plan.md), lines 86-155]
- `Chunk`, `Concept`, `SearchResult` types in domain layer
- Framework-independent types
- No LanceDB types in interfaces

**3. Return Types:** [Source: planning decision]
- Repositories return domain models, not LanceDB records
- Infrastructure layer converts LanceDB → domain models
- Clean boundary between layers

### Consequences

**Positive:**
* **Testability:** Can inject fake repositories [Benefit: [03-testing-strategy.md](https://github.com/m2ux/concept-rag/blob/engineering/artifacts/planning/2025-11-14-architecture-refactoring/03-testing-strategy.md)]
* **32 unit tests added:** Using mock repositories [Result: `PR-DESCRIPTION.md`, line 66]
* **Decoupling:** Tools don't depend on LanceDB [Benefit: independence]
* **Swappable:** Can change database without touching domain [Flexibility: future-proof]
* **Clear contracts:** Interfaces document what's available [Documentation: self-documenting]
* **Single responsibility:** Each repository has focused purpose [Pattern: SRP]
* **Type safety:** TypeScript interfaces enforce contracts [Safety: compile-time]

**Negative:**
* **Indirection:** Extra layer between tools and database [Trade-off: abstraction cost]
* **More files:** 3 interface files + 3 implementation files [Complexity: file count]
* **Conversion overhead:** Must convert LanceDB records to domain models [Performance: minimal cost]
* **Interface maintenance:** Changes require updating interface + implementation [Maintenance: coordination]

**Neutral:**
* **Standard pattern:** Well-known Repository Pattern from DDD [Familiarity: established]
* **Constructor injection:** Repositories injected via ApplicationContainer [Pattern: DI]

### Confirmation

**Test Coverage:** [Source: `PR-DESCRIPTION.md`, lines 63-69]
- **32 unit tests:** All use repository interfaces
- **5 integration tests:** Test real repository implementations  
- **100% passing:** All tests pass with repository pattern
- **Mock repositories:** Implemented in `src/__tests__/test-helpers/mock-repositories.ts`

**Implementation Verified:** [Source: [06-complete-summary.md](https://github.com/m2ux/concept-rag/blob/engineering/artifacts/planning/2025-11-14-architecture-refactoring/06-complete-summary.md), infrastructure layer]
- `src/infrastructure/lancedb/chunks-repository.ts` - Implements IChunkRepository
- `src/infrastructure/lancedb/concepts-repository.ts` - Implements IConceptRepository
- `src/infrastructure/lancedb/catalog-repository.ts` - Implements ICatalogRepository

## Pros and Cons of the Options

### Option 1: Fine-Grained Repositories - Chosen

**Pros:**
* Single responsibility (focused interfaces)
* Easy to test (mock individual repositories)
* Clear boundaries
* 32 unit tests enabled [Validated]
* Type-safe method signatures
* Explicit contracts

**Cons:**
* More files (6 total: 3 interfaces + 3 implementations)
* Some duplication across repositories
* Interface maintenance overhead

### Option 2: Single Unified Repository

One repository with all methods.

**Pros:**
* Fewer files (1 interface, 1 implementation)
* Central point for all data access
* Simple to locate

**Cons:**
* **Violates SRP:** Single class with too many responsibilities [Problem: god object]
* **Hard to test:** Mocking everything at once [Testing: complex mocks]
* **Unclear interface:** 20+ methods in one interface [Usability: overwhelming]
* **Fine-grained chosen:** Better separation [Decision: more focused]

### Option 3: DAO Pattern

Data Access Objects (Java-style).

**Pros:**
* Well-known in Java world
* Clear pattern

**Cons:**
* **Same as Repository:** Essentially equivalent [Comparison: naming]
* **Repository name preferred:** More familiar in TypeScript/Node world
* **No significant difference:** Would achieve same goals

### Option 4: Active Record

Models have database methods (e.g., `chunk.save()`, `Concept.find()`).

**Pros:**
* Concise (model and persistence together)
* Popular (Rails, Laravel)
* Less files

**Cons:**
* **Domain models polluted:** Models depend on database [Violation: layering]
* **Hard to test:** Models coupled to database
* **Against Clean Architecture:** Domain should be pure [Philosophy: separation]
* **Not chosen:** Violates architectural goals

### Option 5: Direct Database Access (Status Quo)

Tools directly access LanceDB tables (no abstraction).

**Pros:**
* Zero abstraction overhead
* Fewer files
* Direct and simple

**Cons:**
* **This was the problem:** Tight coupling, untestable [History: what we're fixing]
* **0 unit tests possible:** Need real database [Blocker: testing]
* **SQL injection:** Direct queries vulnerable [Security: unfixed]
* **Rejected:** Refactoring goal is to fix this

## Implementation Notes

### Repository Implementation Example

**Interface (Domain):**
```typescript
// src/domain/interfaces/repositories/concept-repository.ts
export interface IConceptRepository {
  findByName(name: string): Promise<Concept | null>;
  findByCategory(category: string): Promise<Concept[]>;
}
```

**Implementation (Infrastructure):**
```typescript
// src/infrastructure/lancedb/concepts-repository.ts
export class LanceDBConceptsRepository implements IConceptRepository {
  constructor(private connection: LanceDBConnection) {}
  
  async findByName(name: string): Promise<Concept | null> {
    const table = await this.connection.getConceptsTable();
    const results = await table
      .query()
      .where(`concept = '${escapeSql(name)}'`)  // Proper escaping
      .limit(1)
      .toArray();
    
    if (results.length === 0) return null;
    return this.toDomainModel(results[0]);  // Convert to domain model
  }
  
  private toDomainModel(record: any): Concept {
    // Convert LanceDB record to domain Concept
    return {
      concept: record.concept,
      category: record.category,
      // ... full conversion
    };
  }
}
```

### Dependency Injection

**Registration:** [Source: `src/application/container.ts`]
```typescript
// In ApplicationContainer
container.register('ChunkRepository', {
  useFactory: (container) => {
    const connection = container.resolve('LanceDBConnection');
    return new LanceDBChunksRepository(connection);
  }
});
```

**Injection:**
```typescript
// In tool
class ConceptSearchTool {
  constructor(
    private chunkRepo: IChunkRepository,  // Interface, not implementation
    private conceptRepo: IConceptRepository
  ) {}
}
```

### Testing with Fakes

**Mock Repository:** [Source: `src/__tests__/test-helpers/mock-repositories.ts`]
```typescript
export class FakeChunkRepository implements IChunkRepository {
  private chunks: Chunk[] = [];
  
  async searchByVector(embedding: number[], limit: number): Promise<Chunk[]> {
    // Return test data
    return this.chunks.slice(0, limit);
  }
  
  // ... other methods
  
  // Test helpers
  addTestChunk(chunk: Chunk) {
    this.chunks.push(chunk);
  }
}
```

## Related Decisions

- [ADR-0016: Layered Architecture](adr0016-layered-architecture-refactoring.md) - Architecture context
- [ADR-0018: Dependency Injection](adr0018-dependency-injection-container.md) - Repository wiring
- [ADR-0019: Vitest Testing](adr0019-vitest-testing-framework.md) - Testing with repositories
- [ADR-0021: Performance Optimization](adr0021-performance-optimization-vector-search.md) - Repository methods optimized

## References

### Related Decisions
- [ADR-0016: Layered Architecture](adr0016-layered-architecture-refactoring.md)
- [ADR-0018: Dependency Injection](adr0018-dependency-injection-container.md)

---

**Confidence Level:** HIGH
**Attribution:**
- Planning docs: November 14, 2024
- Design documented in: [02-implementation-plan.md](https://github.com/m2ux/concept-rag/blob/engineering/artifacts/planning/2025-11-14-architecture-refactoring/02-implementation-plan.md) lines 28-424

**Traceability:** [2025-11-14-architecture-refactoring](https://github.com/m2ux/concept-rag/tree/engineering/artifacts/planning/2025-11-14-architecture-refactoring/)



