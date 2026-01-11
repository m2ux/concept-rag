# ADR 0040: Result/Option Types for Functional Error Handling

**Status**: Accepted  
**Date**: 2025-11-23  
**Deciders**: Development Team  
**Related ADRs**: [adr0016](adr0016-layered-architecture-refactoring.md), [adr0017](adr0017-repository-pattern.md), [adr0034](adr0034-comprehensive-error-handling.md)

## Context

The concept-rag codebase relied heavily on exception-based error handling and nullable return types, leading to several challenges:

### Problems with Exception-Based Error Handling

1. **Invisible Error Paths**: Exceptions not visible in function signatures
   ```typescript
   // What errors can this throw? TypeScript doesn't tell us
   async function findUser(id: string): Promise<User> {
     // Could throw DatabaseError, NotFoundError, ValidationError...
   }
   ```

2. **Inconsistent Error Handling**: Some functions throw, others return null
   ```typescript
   // Inconsistent patterns across codebase
   findByName(): Promise<T | null>        // Returns null
   search(): Promise<T[]>                  // Throws on error
   process(): Promise<T>                   // Returns null or throws?
   ```

3. **Null Pointer Risks**: Manual null checking error-prone
   ```typescript
   const concept = await conceptRepo.findByName('ddd');
   // Easy to forget null check
   const related = concept.relatedConcepts.slice(0, 10); // Potential crash!
   ```

4. **Difficult Composition**: Exception handling breaks functional pipelines
   ```typescript
   // Try-catch blocks make composition awkward
   try {
     const user = await getUser(id);
     const profile = await getProfile(user.profileId);
     const settings = await getSettings(profile.settingsId);
     return formatResult(settings);
   } catch (error) {
     // Lost context about which step failed
   }
   ```

5. **Testing Complexity**: Mocking exceptions verbose and fragile
   ```typescript
   it('handles errors', async () => {
     // Verbose setup
     vi.mocked(service.search).mockRejectedValue(new Error('failed'));
     // Implicit behavior, hard to verify all paths
   });
   ```

### Problems with Nullable Types

1. **Implicit Failures**: `null` doesn't explain why operation failed
2. **Forgotten Checks**: Easy to forget null checks, leading to runtime errors
3. **No Contextual Information**: Lost error context when returning null
4. **Inconsistent Patterns**: Some methods return null, others throw

### Existing Error Handling

The codebase had basic error handling:
- ✅ Custom error types (SearchError, DatabaseError, ValidationError)
- ✅ Error context objects with metadata
- ✅ Try-catch blocks in critical paths
- ❌ No compile-time guarantee of error handling
- ❌ Exceptions not visible in type signatures
- ❌ No functional composition patterns

## Decision

Implement a comprehensive functional type system with Result/Either/Option types to enable type-safe, composable error handling:

### 1. Core Functional Types

**Result<T, E>**: Represents success (Ok) or failure (Err) with typed errors

```typescript
type Result<T, E> = 
  | { ok: true; value: T }
  | { ok: false; error: E };

// Factory functions
function ok<T, E>(value: T): Result<T, E>
function err<T, E>(error: E): Result<T, E>

// Type guards
function isOk<T, E>(result: Result<T, E>): result is { ok: true; value: T }
function isErr<T, E>(result: Result<T, E>): result is { ok: false; error: E }
```

**Either<L, R>**: Left (error) or Right (success) discriminated union

```typescript
type Either<L, R> = 
  | { type: 'left'; value: L }
  | { type: 'right'; value: R };

// Factory functions
function left<L, R>(value: L): Either<L, R>
function right<L, R>(value: R): Either<L, R>
```

**Option<T>**: Some(value) or None for nullable values

```typescript
type Option<T> = 
  | { type: 'some'; value: T }
  | { type: 'none' };

// Factory functions
function some<T>(value: T): Option<T>
function none<T>(): Option<T>
function fromNullable<T>(value: T | null | undefined): Option<T>
```

### 2. Monadic Operations

**Functor (map)**: Transform success values
```typescript
function map<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E>

function mapOption<T, U>(
  option: Option<T>,
  fn: (value: T) => U
): Option<U>
```

**Monad (flatMap)**: Chain operations that return Results/Options
```typescript
function flatMap<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E>

function flatMapOption<T, U>(
  option: Option<T>,
  fn: (value: T) => Option<U>
): Option<U>
```

**Fold**: Extract values with fallback
```typescript
function fold<T, U, E>(
  result: Result<T, E>,
  onSuccess: (value: T) => U,
  onError: (error: E) => U
): U

function foldOption<T, U>(
  option: Option<T>,
  onNone: () => U,
  onSome: (value: T) => U
): U
```

### 3. Railway-Oriented Programming

**Pipeline Composition**: 17 utilities for functional composition

```typescript
// Chain operations with short-circuit on error
function pipe<T, E>(
  ...operations: Array<(input: T) => Promise<Result<T, E>>>
): () => Promise<Result<T, E>>

// Automatic retry with exponential backoff
function retry<T, E>(
  operation: () => Promise<Result<T, E>>,
  options: { maxAttempts: number; delayMs: number }
): Promise<Result<T, E>>

// Collect all validation errors (no short-circuit)
function validateAll<T, E>(
  validators: Array<(input: T) => Result<T, E>>,
  input: T
): Result<T, E[]>

// Try alternatives until one succeeds
function firstSuccess<T, E>(
  operations: Array<() => Promise<Result<T, E>>>
): Promise<Result<T, E>>

// Execute operations concurrently
function parallel<T, E>(
  operations: Array<() => Promise<Result<T, E>>>
): Promise<Array<Result<T, E>>>

// Side effects for debugging
function tee<T, E>(
  result: Result<T, E>,
  fn: (value: T) => void
): Result<T, E>

function teeErr<T, E>(
  result: Result<T, E>,
  fn: (error: E) => void
): Result<T, E>
```

### 4. Repository Layer - Option Methods

Add `*Opt` methods to repositories for type-safe nullable handling:

```typescript
interface ConceptRepository {
  // Existing nullable methods (unchanged)
  findByName(name: string): Promise<Concept | null>
  findById(id: number): Promise<Concept | null>
  
  // New Option-based methods
  findByNameOpt(name: string): Promise<Option<Concept>>
  findByIdOpt(id: number): Promise<Option<Concept>>
}

interface CatalogRepository {
  findBySource(source: string): Promise<CatalogEntry | null>
  findBySourceOpt(source: string): Promise<Option<CatalogEntry>>
}

interface CategoryRepository {
  findById(id: number): Promise<Category | null>
  findByName(name: string): Promise<Category | null>
  findByAlias(alias: string): Promise<Category | null>
  
  findByIdOpt(id: number): Promise<Option<Category>>
  findByNameOpt(name: string): Promise<Option<Category>>
  findByAliasOpt(alias: string): Promise<Option<Category>>
}
```

**Implementation**: Thin wrappers over existing methods
```typescript
async findByNameOpt(name: string): Promise<Option<Concept>> {
  const result = await this.findByName(name);
  return fromNullable(result);
}
```

### 5. Service Layer - Result-Based Services

Create Result-based versions of search services:

**SearchError Type**:
```typescript
type SearchError =
  | { type: 'validation'; field: string; message: string }
  | { type: 'database'; message: string }
  | { type: 'not_found'; resource: string }
  | { type: 'unknown'; message: string };
```

**ResultCatalogSearchService**:
```typescript
class ResultCatalogSearchService {
  async searchCatalog(
    params: Partial<CatalogSearchParams>
  ): Promise<Result<SearchResult[], SearchError>> {
    // Validation
    if (!params.text || params.text.trim().length === 0) {
      return err({
        type: 'validation',
        field: 'text',
        message: 'Search text is required'
      });
    }
    
    // Database operation with error handling
    try {
      const results = await this.service.search(params);
      return ok(results);
    } catch (error) {
      return err({
        type: 'database',
        message: error.message
      });
    }
  }
}
```

**ResultChunkSearchService**:
```typescript
class ResultChunkSearchService {
  async searchBroad(
    params: Partial<BroadChunkSearchParams>
  ): Promise<Result<SearchResult[], SearchError>>
  
  async searchInSource(
    params: Partial<TargetedChunkSearchParams>
  ): Promise<Result<Chunk[], SearchError>>
}
```

**ResultConceptSearchService**:
```typescript
class ResultConceptSearchService {
  async searchConcept(
    params: Partial<ConceptSearchParams>
  ): Promise<Result<ConceptSearchResult, SearchError>>
}
```

### 6. Gradual Adoption Strategy

**Coexistence**: New functional types coexist with existing patterns

```typescript
// Existing nullable method (unchanged)
async findByName(name: string): Promise<Concept | null>

// New Option-based method (added)
async findByNameOpt(name: string): Promise<Option<Concept>>

// Both available, choose based on context
```

**Benefits**:
- ✅ Zero breaking changes
- ✅ Incremental migration at developer discretion
- ✅ New code can use functional types immediately
- ✅ Old code continues working unchanged

## Consequences

### Positive

1. **Type-Safe Error Handling**: Errors visible in function signatures
   ```typescript
   // Errors are now explicit in the type
   async function findUser(id: string): Promise<Result<User, DatabaseError>>
   ```

2. **Composability**: Functional chains without try-catch noise
   ```typescript
   const result = await pipe(
     () => getUser(id),
     async (user) => getProfile(user.profileId),
     async (profile) => getSettings(profile.settingsId)
   )();
   
   fold(result,
     settings => ok(formatResult(settings)),
     error => err({ type: 'pipeline_failed', step: error.step })
   );
   ```

3. **Explicit Nullable Handling**: Option eliminates null pointer errors
   ```typescript
   const conceptOpt = await conceptRepo.findByNameOpt('ddd');
   const related = foldOption(conceptOpt,
     () => [],  // None case
     (c) => c.relatedConcepts?.slice(0, 10) || []  // Some case
   );
   ```

4. **Railway Pattern**: Advanced composition patterns
   ```typescript
   // Automatic retry
   const result = await retry(
     () => service.search(query),
     { maxAttempts: 3, delayMs: 100 }
   );
   
   // Fallback strategy
   const result = await firstSuccess([
     () => primaryService.search(query),
     () => secondaryService.search(query),
     () => cacheService.getCached(query)
   ]);
   ```

5. **Testability**: Easier to test without mocking exceptions
   ```typescript
   it('handles validation errors', async () => {
     const result = await service.search({ text: '' });
     expect(isErr(result)).toBe(true);
     if (isErr(result)) {
       expect(result.error.type).toBe('validation');
     }
   });
   ```

6. **Zero Breaking Changes**: Complete backward compatibility
   - All 944 existing tests pass
   - Existing exception-based code unchanged
   - New methods added alongside old ones

7. **No Dependencies**: Custom implementation keeps bundle small
   - ~2KB after minification
   - No external dependencies
   - Zero runtime overhead (types compile away)

### Negative

1. **Learning Curve**: Team needs to learn functional patterns
   - Mitigation: Comprehensive documentation with examples
   - Gradual adoption allows learning over time
   - Code reviews to share best practices

2. **Verbosity**: Functional code can be more verbose than exceptions
   ```typescript
   // Before (concise but hidden errors)
   const user = await getUser(id);
   
   // After (explicit but verbose)
   const userResult = await getUser(id);
   if (isErr(userResult)) {
     return err(userResult.error);
   }
   const user = userResult.value;
   ```
   - Mitigation: Use helper functions and railway utilities
   - Verbosity trades off against type safety

3. **Mixed Paradigms**: Functional and exception code coexist
   - Mitigation: Clear guidelines on when to use each
   - Document migration strategy
   - Keep exceptions for programming errors (bugs)

4. **Type Complexity**: Result/Option types add cognitive overhead
   - Mitigation: Strong typing helps IDE/compiler catch errors
   - Type inference reduces explicit type annotations

### Trade-offs

| Trade-off | Choice | Rationale |
|-----------|--------|-----------|
| **Library vs Custom** | Custom implementation | Zero dependencies, lightweight |
| **Full vs Gradual** | Gradual adoption | Low risk, no breaking changes |
| **Result vs Either** | Both provided | Result for errors, Either for generic cases |
| **Verbosity vs Safety** | Accept verbosity | Type safety worth the cost |
| **Coexistence vs Migration** | Coexistence | Practical for large codebase |

## Implementation

**Date**: 2025-11-23  
**Duration**: Multiple sessions totaling ~4 hours  
**Branch**: `feat/adopt-result-option-types`  
**PR**: #17

### Phase 1: Core Functional Types ✅

**Files Created**:
```
src/domain/functional/
├── result.ts (228 lines)
├── either.ts (142 lines)
├── option.ts (185 lines)
├── railway.ts (515 lines)
├── index.ts (exports)
└── README.md
```

**Note**: Unit tests for functional types were removed in December 2025 as over-testing of simple utility types. The implementations are stable and well-documented.

### Phase 2: Repository Option Methods ✅

**Repositories Updated**: 3 interfaces, 3 implementations
- ConceptRepository: `findByNameOpt`, `findByIdOpt`
- CatalogRepository: `findBySourceOpt`
- CategoryRepository: `findByIdOpt`, `findByNameOpt`, `findByAliasOpt`

**Services Updated**: 1
- ConceptSearchService: Uses Option composition for related concepts

**New Tests**: 32 tests for Option-based repositories

### Phase 3: Result-Based Services ✅

**Services Created**: 3
- ResultCatalogSearchService (117 lines)
- ResultChunkSearchService (218 lines)
- ResultConceptSearchService (238 lines)

**Error Type**: SearchError with 4 variants
- validation, database, not_found, unknown

### Deferred to Future

**Phase 4: Tool/API Layer** - Not needed
- MCP tools handle errors via protocol, functional types not beneficial

**Phase 5: File I/O & External APIs** - Future opportunity
- Document loaders (PDF, EPUB)
- LanceDB operations
- Future HTTP calls

### Metrics

| Metric | Count |
|--------|-------|
| Core functional types | 3 (Result, Either, Option) |
| Railway utilities | 17 |
| Option repository methods | 6 |
| Result-based services | 3 |
| Total new tests | 218 (186 + 32) |
| All tests passing | 944/944 ✅ |
| Breaking changes | 0 |
| Lines added | ~2,400 |

## Alternatives Considered

### Alternative 1: fp-ts Library

**Pros**:
- Comprehensive functional library
- Battle-tested, widely used
- Rich ecosystem of utilities

**Cons**:
- Heavy dependency (~100KB)
- Steep learning curve
- Over-engineered for our needs
- Adds complexity to codebase

**Decision**: Custom implementation is lightweight and sufficient

### Alternative 2: neverthrow Library

**Pros**:
- Purpose-built for Result types
- Simpler than fp-ts
- Good documentation

**Cons**:
- External dependency
- Limited to Result type (no Option)
- Less flexibility for customization

**Decision**: Custom implementation provides all needed features

### Alternative 3: purify-ts Library

**Pros**:
- Includes Result, Either, Maybe (Option)
- TypeScript-native
- Good balance of features

**Cons**:
- External dependency
- Some features we don't need
- Bundle size considerations

**Decision**: Custom implementation matches our exact needs

### Alternative 4: Keep Exceptions Only

**Pros**:
- No learning curve
- Familiar patterns
- Less verbose

**Cons**:
- No type safety for errors
- Difficult composition
- Null pointer risks remain
- No functional patterns

**Decision**: Functional types provide significant benefits

## Testing Strategy

### Unit Tests (218 tests)

**Functional Types** (186 tests):
- Result: map, flatMap, fold, isOk, isErr, getOrElse (51 tests)
- Either: map, flatMap, fold, isLeft, isRight, swap (50 tests)
- Option: map, flatMap, fold, isSome, isNone, fromNullable (51 tests)
- Railway: pipe, retry, validateAll, firstSuccess, parallel, tee (34 tests)

**Repository Option Methods** (32 tests):
- Option-based repository methods
- Integration with existing nullable methods
- Mock repository implementations

### Integration Tests

**Service Tests**:
- Result-based service operations
- Error handling scenarios
- Validation error cases
- Database error cases

**Backward Compatibility**:
- All existing tests pass (944/944)
- No regressions introduced
- Coexistence verified

## Usage Examples

### Repository Layer with Option

```typescript
// Using Option for nullable values
const conceptOpt = await conceptRepo.findByNameOpt('domain-driven-design');

const relatedConcepts = foldOption(conceptOpt,
  () => {
    // None case: concept not found
    console.log('Concept not found');
    return [];
  },
  (concept) => {
    // Some case: concept found
    return concept.relatedConcepts?.slice(0, 10) || [];
  }
);
```

### Service Layer with Result

```typescript
// Using Result for error handling
const result = await catalogService.searchCatalog({
  text: 'microservices',
  limit: 5
});

fold(result,
  (results) => {
    // Success case
    console.log(`Found ${results.length} results`);
    return results;
  },
  (error) => {
    // Error case
    if (error.type === 'validation') {
      console.error(`Validation error: ${error.message}`);
    } else if (error.type === 'database') {
      console.error(`Database error: ${error.message}`);
    }
    return [];
  }
);
```

### Railway Pattern with Retry

```typescript
// Automatic retry with exponential backoff
const result = await retry(
  () => catalogService.searchCatalog({ text: query, limit: 5 }),
  { maxAttempts: 3, delayMs: 100 }
);

if (isOk(result)) {
  console.log('Search succeeded:', result.value);
} else {
  console.error('Search failed after retries:', result.error);
}
```

### Fallback Strategy

```typescript
// Try primary service, fall back to secondary
const result = await firstSuccess([
  () => primaryService.search(query),
  () => secondaryService.search(query),
  () => ok([]) // Default empty results
]);
```

### Functional Composition

```typescript
// Chain operations with pipe
const result = await pipe(
  () => catalogService.searchCatalog({ text: query, limit: 10 }),
  async (results) => ok(filterByCategory(results, 'software')),
  async (filtered) => ok(enrichWithMetadata(filtered))
)();
```

## Migration Guide

### For New Code

**Use Option for nullable values**:
```typescript
// Instead of:
const user = await userRepo.findById(userId);
if (user === null) { /* handle */ }

// Use:
const userOpt = await userRepo.findByIdOpt(userId);
foldOption(userOpt, 
  () => { /* handle None */ },
  (user) => { /* handle Some */ }
);
```

**Use Result for operations that can fail**:
```typescript
// Instead of:
try {
  const results = await service.search(query);
  return results;
} catch (error) {
  console.error(error);
  return [];
}

// Use:
const result = await service.search(query);
return fold(result,
  results => results,
  error => { console.error(error); return []; }
);
```

### For Existing Code

**No changes required!** All new methods are additive:
- Old: `findByName()` returns `T | null` (still works)
- New: `findByNameOpt()` returns `Option<T>` (available when ready)

**Gradual adoption**:
1. Use Option/Result in new features first
2. Migrate hot paths when beneficial
3. Keep exceptions for programming errors (bugs, invariant violations)

## Future Enhancements

### When to Expand Usage

1. **Document Processing**: Result wrappers for PDF/EPUB parsing
2. **LanceDB Operations**: Result-based connection/query methods
3. **HTTP Calls**: Result-based wrappers when external APIs added
4. **Validation Layer**: Comprehensive validation with validateAll
5. **Pipeline Operations**: Complex ETL pipelines with railway pattern

### Potential Additions

1. **AsyncResult**: Result type with async operations built-in
2. **ResultT Monad Transformer**: Combine Result with other effects
3. **Validation Monad**: Specialized for validation with error accumulation
4. **Task Type**: Lazy async computations with Result
5. **Metrics**: Track Result usage and error rates

## References

### Documentation
- Planning: [04-result-types-plan.md](https://github.com/m2ux/concept-rag/blob/engineering/artifacts/specs/2025-11-23-result-option-types/04-result-types-plan.md)
- Completion: [RESULT-TYPES-COMPLETION.md](https://github.com/m2ux/concept-rag/blob/engineering/artifacts/specs/2025-11-23-result-option-types/RESULT-TYPES-COMPLETION.md)
- Adoption: [RESULT-ADOPTION-OPPORTUNITIES.md](https://github.com/m2ux/concept-rag/blob/engineering/artifacts/specs/2025-11-23-result-option-types/RESULT-ADOPTION-OPPORTUNITIES.md)
- Library comparison: [LIBRARY-COMPARISON-ANALYSIS.md](https://github.com/m2ux/concept-rag/blob/engineering/artifacts/specs/2025-11-23-result-option-types/LIBRARY-COMPARISON-ANALYSIS.md)

### Related Code
- `src/domain/functional/result.ts`
- `src/domain/functional/either.ts`
- `src/domain/functional/option.ts`
- `src/domain/functional/railway.ts`
- `src/domain/services/result-*-search-service.ts`

### Related ADRs
- [ADR0016](adr0016-layered-architecture-refactoring.md): Layered architecture foundation
- [ADR0017](adr0017-repository-pattern.md): Repository interfaces
- [ADR0034](adr0034-comprehensive-error-handling.md): Error handling strategy

### Concepts Applied
From knowledge base (Functional Programming & Error Handling):
1. Monads - Composable computation contexts
2. Railway-oriented programming - Error handling pipelines
3. Option type - Type-safe null handling
4. Result/Either type - Explicit error handling
5. Functional composition - Chainable operations

## Conclusion

The Result/Option type system provides a solid foundation for type-safe, composable error handling in the concept-rag codebase. The gradual adoption strategy ensures low risk while delivering immediate value.

**Key Achievements**:
- ✅ Complete functional type system (Result, Either, Option)
- ✅ 17 railway utilities for composition
- ✅ 6 Option methods in production repositories
- ✅ 3 Result-based search services
- ✅ 218 new tests, all passing
- ✅ Zero breaking changes
- ✅ Comprehensive documentation

**Impact**:
- Type-safe error handling with explicit error types
- Elimination of null pointer errors via Option
- Functional composition patterns available
- Improved code clarity and safety
- Gradual migration path for existing code

**Status**: Production-ready, deployed to `feat/adopt-result-option-types` branch, PR #17

The functional type system is now available for adoption across the codebase, providing a modern alternative to exception-based error handling and nullable types.

