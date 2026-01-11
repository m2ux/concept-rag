# 16. Layered Architecture Refactoring

**Date:** 2025-11-14  
**Status:** Accepted  
**Deciders:** Engineering Team  
**Technical Story:** Architecture Refactoring (November 14, 2025)

**Sources:**
- Planning: [2025-11-14-architecture-refactoring](https://github.com/m2ux/concept-rag/tree/engineering/artifacts/specs/2025-11-14-architecture-refactoring/)

## Context and Problem Statement

The codebase had functional architecture but relied on global mutable state via module-level `export let` declarations for database connections [Problem: [01-architecture-review-analysis.md](https://github.com/m2ux/concept-rag/blob/engineering/artifacts/specs/2025-11-14-architecture-refactoring/01-architecture-review-analysis.md), lines 28-48]. Tools directly imported database tables creating hidden dependencies, race conditions, and making testing impossible without real databases [Issues: lines 42-48]. The architecture review identified 6 critical issues requiring refactoring.

**The Core Problems:** [Source: `01-architecture-review-analysis.md`, lines 11-21]
1. ❌ Global mutable state via module-level exports
2. ❌ No dependency injection - direct imports
3. ❌ Tight coupling between all layers
4. ❌ O(n) performance issues (loading all chunks)
5. ❌ SQL injection vulnerability
6. ❌ Code duplication

**Decision Drivers:**
* Need testability (unit tests impossible) [Source: `PR-DESCRIPTION.md`, line 67]
* Performance issues (8-12s searches) [Source: `PR-DESCRIPTION.md`, line 21]
* Security vulnerability (SQL injection) [Source: `PR-DESCRIPTION.md`, lines 47-49]
* Industry best practices (Clean Architecture) [Source: Knowledge Base: "Clean Architecture" book]
* Prepare for future features [Planning: extensibility]

## Alternative Options

* **Option 1: Clean Architecture with Four Layers** - Domain/Infrastructure/Application/Tools
* **Option 2: Keep Current Structure** - No refactoring
* **Option 3: Hexagonal Architecture** - Ports and adapters
* **Option 4: Microservices** - Service decomposition
* **Option 5: Three-Layer Only** - Presentation/Business/Data

## Decision Outcome

**Chosen option:** "Clean Architecture with Four Layers (Option 1)", because it provides testability, eliminates global state, and follows industry best practices while being appropriate for project scale.

### Architecture Layers

**Transformation:** [Source: `PR-DESCRIPTION.md`, lines 51-90; `README.md`, lines 274-300]

```
Before: Tightly-coupled with global state

After:
┌─────────────────────────────────────────────────┐
│              Application Layer                  │
│          (ApplicationContainer)                 │
│      Composition Root - DI Wiring               │
└─────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│               Domain Layer                      │
│   Interfaces (Repositories, Services)           │
│   Models (Chunk, Concept, SearchResult)         │
│   Zero external dependencies                    │
└─────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│           Infrastructure Layer                  │
│   LanceDB Repositories                          │
│   EmbeddingService                              │
│   Implements domain interfaces                  │
└─────────────────────────────────────────────────┘
```

### Layer Responsibilities

**Domain Layer (`src/domain/`):** [Source: `PR-DESCRIPTION.md`, lines 73-76]
- Models and interfaces (no external dependencies)
- Repository contracts
- Service interfaces
- Zero coupling to LanceDB

**Infrastructure Layer (`src/infrastructure/`):** [Source: `PR-DESCRIPTION.md`, lines 78-81]
- LanceDB: Connection, repositories, utilities
- Services: Embeddings, hybrid search, scoring
- Implements domain interfaces

**Application Layer (`src/application/`):** [Source: `PR-DESCRIPTION.md`, lines 83-84]
- ApplicationContainer: DI and composition root
- Wires dependencies together

**Tools Layer (`src/tools/`):** [Existing layer, refactored]
- MCP tool implementations
- Uses injected dependencies (no more globals)

### Consequences

**Positive:**
* **80x-240x faster:** Concept search 8-12s → 50-100ms [Source: `PR-DESCRIPTION.md`, line 21]
* **1000x less memory:** ~5GB → ~5MB [Source: `PR-DESCRIPTION.md`, line 23]
* **Testable:** 37 tests added (32 unit + 5 integration, 100% passing) [Source: `PR-DESCRIPTION.md`, lines 63-69]
* **Security fixed:** SQL injection vulnerability eliminated [Source: `PR-DESCRIPTION.md`, lines 47-49]
* **Zero breaking changes:** Full backward compatibility [Source: `PR-DESCRIPTION.md`, line 15]
* **Eliminates global state:** Managed lifecycle [Source: `PR-DESCRIPTION.md`, line 27]
* **Code quality:** -69 lines duplication eliminated [Source: `PR-DESCRIPTION.md`, line 39]

**Negative:**
* **File count increased:** 23 new files created [Source: `06-complete-summary.md`]
* **Learning curve:** Team needs to understand layered architecture [Trade-off: complexity]
* **Refactoring effort:** ~7 hours invested [Source: `README.md`, line 251]
* **More indirection:** More interfaces to navigate [Trade-off: abstraction]

**Neutral:**
* **24 commits:** Incremental refactoring approach [Source: `06-complete-summary.md`, line 102]
* **Constructor injection:** Explicit dependency passing [Pattern: DI style]

### Confirmation

**Validation Results:** [Source: `PR-DESCRIPTION.md`, lines 19-25, 63-69]

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Concept Search** | 8-12s | 50-100ms | **80x-240x faster** ⚡ |
| **Memory** | ~5GB | ~5MB | **1000x less** |
| **Algorithm** | O(n) scan | O(log n) search | Scalable |
| **Tests** | 0 | 37 (100% pass) | Testable |
| **Breaking Changes** | N/A | 0 | Compatible |

## Pros and Cons of the Options

### Option 1: Clean Architecture Four Layers - Chosen

**Pros:**
* 80x-240x performance improvement [Validated: PR line 21]
* 1000x memory reduction [Validated: PR line 23]
* 37 tests now possible [Result: PR lines 63-69]
* Security vulnerability fixed [Result: PR lines 47-49]
* Zero breaking changes [Result: PR line 15]
* Industry best practices applied
* Eliminates global state issues

**Cons:**
* 23 new files created
* ~7 hours refactoring effort
* Learning curve for patterns
* More navigation complexity

### Option 2: Keep Current Structure

Keep global state and tight coupling.

**Pros:**
* Zero refactoring effort
* No learning curve
* Familiar to team
* Works currently

**Cons:**
* **O(n) performance continues:** 8-12s searches unacceptable [Problem: slow]
* **Testing impossible:** No unit tests possible [Blocker: quality]
* **Security vulnerability remains:** SQL injection unfixed [Critical: security]
* **Technical debt grows:** Becomes harder to refactor later
* **Rejected:** Issues too severe to ignore [Decision: refactoring necessary]

### Option 3: Hexagonal Architecture

Ports and adapters pattern.

**Pros:**
* Strong decoupling
* Well-defined boundaries
* Industry proven

**Cons:**
* **More ceremony:** More complex than needed [Over-engineering]
* **Similar benefits:** Four-layer achieves same goals [Comparison: equivalent]
* **Unfamiliar:** Team less familiar with hexagonal
* **Clean Architecture chosen:** Better known pattern

### Option 4: Microservices

Service-based decomposition.

**Pros:**
* Ultimate scalability
* Independent deployment

**Cons:**
* **Massive over-engineering:** For single-process MCP server [Dealbreaker]
* **Operational complexity:** Networking, deployment
* **Against requirements:** MCP server is single process
* **Not considered seriously:** Obviously inappropriate

### Option 5: Three-Layer Only

Simpler three-layer (Presentation/Business/Data).

**Pros:**
* Simpler than four layers
* Well-understood
* Less files

**Cons:**
* **Less explicit:** Domain logic location unclear
* **Weak interface layer:** Not as testable
* **Four layers chosen:** Better separation [Decision: more explicit better]

## Implementation Notes

### Files Created

**23 New Files:** [Source: `06-complete-summary.md`, commit history]

**Domain Layer (8 files):**
- Models: `chunk.ts`, `concept.ts`, `search-result.ts`
- Interfaces: Repository interfaces for chunk, concept, catalog

**Infrastructure Layer (7 files):**
- Repositories: LanceDB implementations
- Services: Embedding, hybrid search
- Connection: LanceDB connection management

**Application Layer (1 file):**
- `container.ts` - DI container

**Test Infrastructure (7 files):**
- Mock repositories, test helpers, test data

### Refactoring Approach

**Incremental Migration:** [Source: `02-implementation-plan.md`]
1. Create domain models and interfaces
2. Implement LanceDB repositories
3. Create ApplicationContainer
4. Migrate pilot tool (ConceptSearchTool)
5. Migrate remaining tools
6. Eliminate global state
7. Fix performance (O(n) → O(log n))
8. Fix security (SQL injection)

**24 Commits:** [Source: `06-complete-summary.md`, line 102]
- Commit-per-task approach
- Incremental validation
- Safe rollback points

### Key Design Decisions

**1. Repository Pattern:** [Source: `02-implementation-plan.md`, lines 21]
- Fine-grained repositories (Chunk, Concept, Catalog)
- Method-per-query API (explicit, type-safe)
- Interface-based (domain defines, infrastructure implements)

**2. No DI Framework:** [Source: planning discussion]
- Lightweight custom ApplicationContainer
- No external DI framework dependency
- Constructor injection pattern

**3. Pilot Migration:** [Source: `02-implementation-plan.md`, line 24]
- ConceptSearchTool migrated first
- Validated approach before migrating all tools
- Risk mitigation strategy

## Related Decisions

- [ADR-0017: Repository Pattern](adr0017-repository-pattern.md) - Data access abstraction
- [ADR-0018: Dependency Injection](adr0018-dependency-injection-container.md) - DI container implementation
- [ADR-0019: Vitest Testing](adr0019-vitest-testing-framework.md) - Testing enabled by architecture
- [ADR-0021: Performance Optimization](adr0021-performance-optimization-vector-search.md) - O(n) → O(log n) fix
- [ADR-0023: SQL Injection Prevention](adr0023-sql-injection-prevention.md) - Security fix

## References

### Related Decisions
- [ADR-0017: Repository Pattern](adr0017-repository-pattern.md)
- [ADR-0018: Dependency Injection](adr0018-dependency-injection-container.md)
- [ADR-0019: Vitest Testing](adr0019-vitest-testing-framework.md)

---

**Confidence Level:** HIGH
**Attribution:**
- Planning docs: November 14, 2024
- Metrics from: PR-DESCRIPTION.md lines 19-25, 63-69

**Traceability:** [2025-11-14-architecture-refactoring](https://github.com/m2ux/concept-rag/tree/engineering/artifacts/specs/2025-11-14-architecture-refactoring/)



