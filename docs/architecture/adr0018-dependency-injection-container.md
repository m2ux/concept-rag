# 18. Dependency Injection Container (ApplicationContainer)

**Date:** 2025-11-14  
**Status:** Accepted  
**Deciders:** Engineering Team  
**Technical Story:** Architecture Refactoring - Phase 2 (November 14, 2025)

**Sources:**
- Planning: [2025-11-14-architecture-refactoring](https://github.com/m2ux/concept-rag/tree/engineering/artifacts/planning/2025-11-14-architecture-refactoring/)

With repository interfaces defined [ADR-0017], tools needed a way to receive dependencies without creating them directly or importing globals [Problem: tight coupling]. The system needed dependency wiring that was simple, type-safe, and didn't require heavy DI frameworks.

**The Core Problem:** How to wire dependencies together (repositories, services, tools) in a maintainable, testable way? [Planning: [02-implementation-plan.md](https://github.com/m2ux/concept-rag/blob/engineering/artifacts/planning/2025-11-14-architecture-refactoring/02-implementation-plan.md), Phase 2]

**Decision Drivers:**
* Constructor injection pattern chosen [Pattern: explicit dependencies]
* No heavy DI framework wanted (keep it simple) [Source: `02-implementation-plan.md`, decision note]
* Composition root needed (single place to wire everything) [Pattern: Composition Root from "Code That Fits in Your Head"]
* Type safety required (TypeScript) [Requirement: type-safe]
* Testing support (swap implementations) [Requirement: test doubles]

## Alternative Options

* **Option 1: Lightweight Custom Container** - Simple DI container in `application/container.ts`
* **Option 2: InversifyJS** - Full-featured DI framework for TypeScript
* **Option 3: TSyringe** - Microsoft's DI container
* **Option 4: Manual Wiring** - Direct instantiation in main
* **Option 5: Service Locator** - Global registry pattern

## Decision Outcome

**Chosen option:** "Lightweight Custom Container (Option 1)", because it provides sufficient DI capability without external framework dependency, keeps the codebase simple, and gives full control over wiring logic.

### Implementation

**File:** `src/application/container.ts` [Source: `PR-DESCRIPTION.md`, line 83]

**Container Design:**
```typescript
export class ApplicationContainer {
  private instances = new Map<string, any>();
  private factories = new Map<string, () => any>();
  
  register(name: string, factory: () => any) {
    this.factories.set(name, factory);
  }
  
  resolve<T>(name: string): T {
    // Singleton pattern - create once, reuse
    if (!this.instances.has(name)) {
      const factory = this.factories.get(name);
      if (!factory) throw new Error(`No factory for ${name}`);
      this.instances.set(name, factory());
    }
    return this.instances.get(name);
  }
}
```
[Source: Implementation pattern from `container.ts`]

**Wiring Example:**
```typescript
const container = new ApplicationContainer();

// Register connection
container.register('LanceDBConnection', () => 
  new LanceDBConnection(databaseUrl)
);

// Register repositories
container.register('ChunkRepository', () => 
  new LanceDBChunksRepository(container.resolve('LanceDBConnection'))
);

// Register services
container.register('EmbeddingService', () =>
  new SimpleEmbeddingService()
);

// Register tools
container.register('ConceptSearchTool', () =>
  new ConceptSearchTool(
    container.resolve('ChunkRepository'),
    container.resolve('ConceptRepository')
  )
);
```

### Consequences

**Positive:**
* **No framework dependency:** Zero external DI libraries [Benefit: simplicity]
* **Full control:** Complete control over resolution logic [Benefit: flexibility]
* **Type-safe:** TypeScript generics for type safety [Benefit: `resolve<IChunkRepository>`]
* **Singleton pattern:** Resources reused efficiently [Benefit: performance]
* **Composition root:** Single place for all wiring [Pattern: explicit composition]
* **Testable:** Can create test container with mocks [Benefit: test support]
* **Simple:** ~100 lines of code [Benefit: maintainable]
* **37 tests enabled:** All tests use DI [Result: `PR-DESCRIPTION.md`, line 64]

**Negative:**
* **Manual registration:** Must manually register all dependencies [Effort: wiring code]
* **No auto-wiring:** No reflection-based automatic wiring [Limitation: manual]
* **No lifecycle hooks:** No OnInit, OnDestroy patterns [Limitation: simple]
* **String-based keys:** Registration by string name (not type-safe) [Trade-off: simplicity vs. safety]

**Neutral:**
* **Custom solution:** Not using standard DI framework [Choice: custom vs. library]
* **~100 lines:** Small custom implementation [Size: minimal]

### Confirmation

**Validation:** [Source: `PR-DESCRIPTION.md`, production deployment]
- **Production deployment:** Container wires all 8 tools successfully
- **37 tests:** All use DI, all passing
- **Zero runtime errors:** No initialization order issues
- **Test container:** Separate container for tests with mocks

## Pros and Cons of the Options

### Option 1: Lightweight Custom Container - Chosen

**Pros:**
* No external dependencies
* Full control over logic
* Simple (~100 lines)
* Type-safe with generics
* Singleton support
* Test-friendly
* 37 tests working [Validated]

**Cons:**
* Manual registration
* No auto-wiring
* String-based keys
* No advanced features

### Option 2: InversifyJS

Full-featured DI framework with decorators.

**Pros:**
* Feature-rich (lifecycle, scopes, etc.)
* Decorator-based registration
* Auto-wiring via reflection
* Well-documented
* Active community

**Cons:**
* **External dependency:** Large framework (adds weight) [Cost: dependency]
* **Over-engineering:** Most features unused [Problem: complexity]
* **Decorator overhead:** Requires experimental decorators [Config: tsconfig changes]
* **Learning curve:** Team must learn Inversify [Effort: training]
* **Rejected:** Too heavy for needs [Decision: custom sufficient]

### Option 3: TSyringe

Microsoft's lightweight DI container.

**Pros:**
* Microsoft-backed
* Lighter than Inversify
* Decorator-based
* Good TypeScript support

**Cons:**
* **Still external dependency:** Another library to maintain
* **Decorators required:** Experimental TypeScript feature
* **Simpler to build custom:** ~100 lines sufficient
* **Rejected:** Custom container adequate [Decision: no framework needed]

### Option 4: Manual Wiring

Direct instantiation in main/index file.

**Pros:**
* No container code needed
* Completely explicit
* Zero magic

**Cons:**
* **Repeated wiring:** Must wire in main AND tests [Problem: duplication]
* **Change ripple:** Add dependency = update many places [Maintenance: brittle]
* **No centralization:** Wiring logic scattered [Organization: unclear]
* **Hard to test:** Must manually wire mocks everywhere [Testing: repetitive]

### Option 5: Service Locator

Global registry for resolving dependencies.

**Pros:**
* Simple to use (`ServiceLocator.get('ChunkRepository')`)
* Central registry
* Easy to call anywhere

**Cons:**
* **Anti-pattern:** Considered anti-pattern in modern design [Problem: hidden dependencies]
* **Hidden dependencies:** Classes don't declare what they need [Issue: unclear contracts]
* **Global state:** Still has global state (different problem, same issue) [Problem: what we're avoiding]
* **Hard to test:** Must reset global state between tests [Testing: cleanup complexity]

## Implementation Notes

### Registration Pattern

**Lazy Factory:** [Design: delayed instantiation]
```typescript
container.register('RepositoryName', () => {
  // Factory function called on first resolve()
  // Can access other dependencies via container.resolve()
  return new ConcreteRepository(/* dependencies */);
});
```

**Benefits:**
- Dependencies created only when needed
- Can resolve dependencies within factory
- Initialization order managed automatically

### Singleton Behavior

**By Design:** [Implementation: caching]
```typescript
// First call: Creates instance
const repo1 = container.resolve('ChunkRepository');

// Second call: Returns cached instance
const repo2 = container.resolve('ChunkRepository');

console.log(repo1 === repo2);  // true (same instance)
```

**Why Singleton:**
- Database connections should be shared
- Repositories are stateless (safe to reuse)
- Performance (avoid repeated instantiation)

### Test Container

**Test Setup:** [Source: test infrastructure]
```typescript
// Test file
const testContainer = new ApplicationContainer();

testContainer.register('ChunkRepository', () => 
  new FakeChunkRepository()  // Fake, not real
);

const tool = new ConceptSearchTool(
  testContainer.resolve('ChunkRepository'),
  testContainer.resolve('ConceptRepository')
);
```

### Evolution

**November 14, 2025:**
- Initial ApplicationContainer created
- Wired repositories and tools

**Later:**
- Could add lifecycle management
- Could add scope support (transient, scoped, singleton)
- Could add validation/verification
- Current implementation sufficient

## Related Decisions

- [ADR-0016: Layered Architecture](adr0016-layered-architecture-refactoring.md) - Application layer context
- [ADR-0017: Repository Pattern](adr0017-repository-pattern.md) - What gets injected
- [ADR-0019: Vitest Testing](adr0019-vitest-testing-framework.md) - Testing with DI

## References

### Related Decisions
- [ADR-0016: Layered Architecture](adr0016-layered-architecture-refactoring.md)
- [ADR-0017: Repository Pattern](adr0017-repository-pattern.md)

---

**Confidence Level:** HIGH
**Attribution:**
- Planning docs: November 14, 2024
- Phase 2 documented in: 02-implementation-plan.md

**Traceability:** [2025-11-14-architecture-refactoring](https://github.com/m2ux/concept-rag/tree/engineering/artifacts/planning/2025-11-14-architecture-refactoring/)



