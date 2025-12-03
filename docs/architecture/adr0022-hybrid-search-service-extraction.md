# 22. HybridSearchService Extraction

**Date:** 2025-11-14  
**Status:** Accepted  
**Deciders:** Engineering Team  
**Technical Story:** Architecture Refactoring - Enhancement #2 (November 14, 2025)

**Sources:**
- Planning: .ai/planning/2025-11-14-architecture-refactoring/

## Context and Problem Statement

After the main architecture refactoring [ADR-0016], hybrid search scoring logic was duplicated across three repositories (chunks, catalog, concepts) [Problem: duplication]. Each repository independently calculated vector scores, BM25 scores, title scores, concept scores, and WordNet scores using copied code [Source: `.ai/planning/2025-11-14-architecture-refactoring/08-hybrid-search-service-plan.md`, Current State Analysis].

**The Core Problem:** How to eliminate duplication of hybrid search scoring logic across repositories while maintaining type safety and testability? [Planning: `08-hybrid-search-service-plan.md`]

**Decision Drivers:**
* DRY principle (Don't Repeat Yourself) [Principle: eliminate duplication]
* Consistent scoring across all search types [Quality: consistency]
* Reusable scoring strategies [Architecture: reusability]
* Testable scoring logic in isolation [Testing: unit testable]
* Single place to adjust scoring weights [Maintenance: centralized tuning]

## Alternative Options

* **Option 1: Extract HybridSearchService** - Dedicated service for scoring
* **Option 2: Keep Duplicated** - Leave code in repositories
* **Option 3: Utility Functions** - Static helper functions
* **Option 4: Strategy Pattern** - Pluggable scoring strategies
* **Option 5: Base Repository Class** - Inheritance-based sharing

## Decision Outcome

**Chosen option:** "Extract HybridSearchService (Option 1)", because it creates a cohesive, testable service that encapsulates all scoring logic in one place, following SRP and enabling consistent evolution of the ranking algorithm.

### Service Interface

**File:** `src/domain/services/hybrid-search-service.ts` [Source: `09-hybrid-search-service-complete.md`, files created]

```typescript
export interface IHybridSearchService {
  searchChunks(
    query: string,
    embedding: number[],
    allChunks: Chunk[],
    limit: number
  ): SearchResult[];
  
  searchCatalog(
    query: string,
    embedding: number[],
    catalogEntries: CatalogEntry[],
    limit: number
  ): SearchResult[];
}
```

### Scoring Components

**Five Signals:** [Source: Hybrid search design, documented in service]
1. **Vector Score (25%)** - Cosine similarity from embeddings
2. **BM25 Score (25%)** - Keyword frequency (TF-IDF variant)
3. **Title Score (20%)** - Filename matching bonus
4. **Concept Score (20%)** - Concept tag matching
5. **WordNet Score (10%)** - Expanded term matching

**Implementation:**
```typescript
class HybridSearchService implements IHybridSearchService {
  searchChunks(query, embedding, chunks, limit) {
    return chunks
      .map(chunk => ({
        ...chunk,
        vectorScore: this.computeVectorScore(chunk, embedding),
        bm25Score: this.computeBM25Score(chunk, query),
        titleScore: this.computeTitleScore(chunk, query),
        conceptScore: this.computeConceptScore(chunk, query),
        wordnetScore: this.computeWordNetScore(chunk, query),
        hybridScore: this.computeHybridScore(/* all scores */)
      }))
      .sort((a, b) => b.hybridScore - a.hybridScore)
      .slice(0, limit);
  }
  
  private computeHybridScore(...): number {
    return (vectorScore * 0.25) + (bm25Score * 0.25) + 
           (titleScore * 0.20) + (conceptScore * 0.20) + 
           (wordnetScore * 0.10);
  }
}
```

### Consequences

**Positive:**
* **Eliminated duplication:** Single source of truth for scoring [Benefit: DRY]
* **Consistent scoring:** All repositories use same logic [Quality: consistency]
* **Testable in isolation:** Can unit test scoring without repositories [Testing: focused]
* **Easy to tune:** Adjust weights in one place [Maintenance: centralized]
* **Reusable:** New repositories can use service [Architecture: reusability]
* **Type-safe:** Interface defines contracts [Safety: TypeScript]
* **Single responsibility:** Service has one job (scoring) [Pattern: SRP]

**Negative:**
* **Additional abstraction:** One more layer [Trade-off: indirection]
* **Service dependency:** Repositories depend on service [Coupling: service coupling]
* **Performance consideration:** Service call overhead (minimal) [Cost: function call]

**Neutral:**
* **Service layer pattern:** Standard domain service pattern [Pattern: DDD]
* **Four new files:** Service interface, implementation, tests [Files: manageable]

### Confirmation

**Validation:** [Source: `09-hybrid-search-service-complete.md`, lines 58-71]
- ✅ **All 37 tests passing:** No regressions
- ✅ **Performance maintained:** No degradation from extraction
- ✅ **Build successful:** Zero TypeScript errors
- ✅ **Code deduplication:** Removed duplicate scoring code from repositories
- ✅ **Reusability:** Service used by 3 repositories

**Files Created:** [Source: `09-hybrid-search-service-complete.md`, lines 11-19]
1. `src/domain/interfaces/services/hybrid-search-service.ts` - Interface
2. `src/infrastructure/search/hybrid-search-service.ts` - Implementation
3. `src/infrastructure/search/scoring-strategies.ts` - Scoring algorithms
4. `src/__tests__/hybrid-search-service.test.ts` - Unit tests

## Pros and Cons of the Options

### Option 1: Extract HybridSearchService - Chosen

**Pros:**
* DRY principle applied
* Consistent scoring
* Testable in isolation
* Central weight tuning
* Reusable across repositories
* 37 tests still passing [Validated]

**Cons:**
* Additional service layer
* Repository dependency on service
* Minimal function call overhead

### Option 2: Keep Duplicated

Leave scoring logic in each repository.

**Pros:**
* No additional files
* Self-contained repositories
* No service dependency

**Cons:**
* **Code duplication:** Same logic 3 times [Problem: DRY violation]
* **Inconsistency risk:** Changes must be made 3 times [Risk: divergence]
* **Hard to tune:** Adjust weights in 3 places [Maintenance: error-prone]
* **Not DRY:** Violates principle [Code smell: duplication]
* **This was the problem:** Enhancement #2 was to fix this

### Option 3: Utility Functions

Static helper functions for scoring.

**Pros:**
* Simple (just functions)
* No service object
* Easy to call

**Cons:**
* **No cohesion:** Functions scattered [Organization: poor]
* **No interface:** Can't swap implementations [Limitation: not testable as unit]
* **No state:** Can't configure/parameterize [Limitation: static]
* **Service better:** OOP encapsulation preferable

### Option 4: Strategy Pattern

Pluggable scoring strategies.

**Pros:**
* Maximum flexibility
* Can swap strategies at runtime
* Very extensible

**Cons:**
* **Over-engineering:** Don't need multiple strategies [Complexity: unnecessary]
* **More complex:** Strategy interfaces, multiple implementations
* **One strategy:** Only have one hybrid approach currently
* **YAGNI:** "You Aren't Gonna Need It" [Principle: don't over-engineer]

### Option 5: Base Repository Class

Inheritance-based code sharing.

**Pros:**
* Share code via inheritance
* OOP pattern

**Cons:**
* **Composition over inheritance:** Prefer composition [Principle: GoF patterns]
* **Tight coupling:** Subclasses coupled to base class [Problem: inheritance issues]
* **Less flexible:** Hard to change base class without affecting all
* **Service extraction better:** Composition more flexible

## Implementation Notes

### Service Registration

**In ApplicationContainer:** [Source: Container wiring]
```typescript
container.register('HybridSearchService', () => 
  new HybridSearchService(
    container.resolve('WordNetService')
  )
);

container.register('ChunkRepository', () => 
  new LanceDBChunksRepository(
    container.resolve('LanceDBConnection'),
    container.resolve('HybridSearchService')  // Inject service
  )
);
```

### Repository Usage

**Example:**
```typescript
export class LanceDBChunksRepository implements IChunkRepository {
  constructor(
    private connection: LanceDBConnection,
    private hybridSearch: IHybridSearchService
  ) {}
  
  async search(query: string, limit: number): Promise<SearchResult[]> {
    const embedding = await this.generateEmbedding(query);
    const chunks = await this.loadCandidates(embedding, limit * 3);
    
    // Delegate to service for scoring
    return this.hybridSearch.searchChunks(query, embedding, chunks, limit);
  }
}
```

### Testing

**Unit Tests for Service:**
```typescript
describe('HybridSearchService', () => {
  it('should combine scores with correct weights', () => {
    const service = new HybridSearchService();
    const result = service.computeHybridScore({
      vectorScore: 0.8,
      bm25Score: 1.2,
      titleScore: 10.0,
      conceptScore: 2.0,
      wordnetScore: 0.5
    });
    
    // Verify: (0.8*0.25) + (1.2*0.25) + (10.0*0.20) + (2.0*0.20) + (0.5*0.10)
    expect(result).toBeCloseTo(2.95);
  });
});
```

## Related Decisions

- [ADR-0006: Hybrid Search Strategy](adr0006-hybrid-search-strategy.md) - Original hybrid approach
- [ADR-0016: Layered Architecture](adr0016-layered-architecture-refactoring.md) - Service layer pattern
- [ADR-0017: Repository Pattern](adr0017-repository-pattern.md) - Repositories use service

## References

### Related Decisions
- [ADR-0006: Hybrid Search](adr0006-hybrid-search-strategy.md)
- [ADR-0016: Layered Architecture](adr0016-layered-architecture-refactoring.md)

---

**Confidence Level:** HIGH
**Attribution:**
- Planning docs: November 14, 2024
- Documented in: 08-hybrid-search-service-plan.md, 09-hybrid-search-service-complete.md

**Traceability:** .ai/planning/2025-11-14-architecture-refactoring/
