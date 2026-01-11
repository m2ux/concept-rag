# ADR-0047: Architecture Review December 2025

## Status

Accepted

## Date

2025-12-09

## Context

The concept-RAG codebase had accumulated technical debt since the November 2025 architecture refactoring:

1. **Legacy Code**: The `src/lancedb/` directory contained global state patterns that predated the Clean Architecture implementation. Function-based category tools duplicated class-based implementations.

2. **Singleton Pattern Inconsistency**: Three caches (`ConceptIdCache`, `CategoryIdCache`, `CatalogSourceCache`) used singleton pattern, complicating dependency injection and testing.

3. **Console Logging in Resilience**: The `CircuitBreaker` and `GracefulDegradation` patterns logged directly to console, making tests noisy and preventing structured logging.

## Decision

### Priority 1: Remove Legacy Code

Remove all legacy code that predates the Clean Architecture implementation:

- `src/lancedb/simple_client.ts` - Replaced by `SimpleEmbeddingService`
- `src/lancedb/hybrid_search_client.ts` - Replaced by `ConceptualHybridSearchService`
- `src/simple_index.ts` - Replaced by `conceptual_index.ts`
- Function-based category tools - Replaced by class-based tools via `ApplicationContainer`

### Priority 2: Support Instance-Based Caches

Convert singleton caches to support both patterns:

```typescript
// Instance-based (recommended for DI and testing)
const cache = new ConceptIdCache();
await cache.initialize(repo);

// Singleton (legacy, deprecated)
const cache = ConceptIdCache.getInstance();
```

- Make constructors public
- Mark `getInstance()` as deprecated
- Add `resetInstance()` for test cleanup

### Priority 3: Injectable Logger

Create `ResilienceLogger` interface for resilience patterns:

```typescript
interface ResilienceLogger {
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}
```

Provide default implementations:
- `ConsoleLogger` - Default, logs to console with context
- `NoopLogger` - Silent operation for tests

## Consequences

### Positive

1. **Cleaner Codebase**: -941 net lines, removed duplicate/legacy code
2. **Better Testability**: Caches can be instantiated directly, no singleton reset needed
3. **Structured Logging**: Resilience patterns emit structured context for observability
4. **Silent Tests**: Use `NoopLogger` to eliminate console noise in tests

### Negative

1. **Breaking Change**: `simple_index.ts` removed (users must migrate to `conceptual_index.ts`)
2. **API Surface**: Logger parameter added to `CircuitBreaker` and `GracefulDegradation` constructors

### Neutral

1. Singleton pattern still available for backward compatibility (deprecated)
2. Test assertions updated to expect structured context objects

## References

- Planning documents: [planning](https://github.com/m2ux/concept-rag/tree/engineering/artifacts/planning/2025-12-08-architecture-review/)
- Previous architecture refactoring: ADR-0035 to ADR-0046
- PR #37: Architecture Review December 2025

