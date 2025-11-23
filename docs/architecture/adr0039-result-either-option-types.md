# ADR 0039: Result/Either/Option Type System

**Status**: Accepted  
**Date**: 2025-11-23  
**Deciders**: Development Team  
**Related ADRs**: [adr0034](adr0034-comprehensive-error-handling.md), [adr0037](adr0037-functional-validation-layer.md)

## Context

The concept-rag project has two approaches to error handling:
1. **Exception-based** error handling (ADR 0034) - 26 exception types for fail-fast behavior
2. **Functional validation** (ADR 0037) - ValidationResult type for composable validation

While both work well for their use cases, there was a gap: we lacked general-purpose functional types for error handling beyond validation. Several needs emerged:

1. **Explicit Error Handling**: Make success/failure explicit in function signatures
2. **Railway-Oriented Programming**: Compose operations that can fail without nested try-catch
3. **Nullable Handling**: Type-safe alternative to null/undefined
4. **Async Composition**: Chain async operations that might fail
5. **Error Accumulation**: Collect multiple errors instead of failing fast
6. **Testability**: Test error paths without throwing exceptions

ADR 0037's ValidationResult was a step in this direction but was limited to validation. We needed:
- Generic Result<T, E> for any operation that can succeed or fail
- Either<L, R> for bi-directional choice
- Option<T> for safe nullable handling
- Railway utilities for composing these types

## Decision

Implement a comprehensive functional programming type system with three core types and railway-oriented programming utilities:

### 1. Result<T, E> - Success/Failure Modeling

```typescript
export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

// Constructors
function Ok<T, E>(value: T): Result<T, E>
function Err<T, E>(error: E): Result<T, E>

// Operations
function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E>
function flatMap<T, U, E>(result: Result<T, E>, fn: (value: T) => Result<U, E>): Result<U, E>
function fold<T, E, U>(result: Result<T, E>, onOk: (T) => U, onErr: (E) => U): U
```

**Features**:
- Discriminated union for type safety
- Readonly properties prevent mutation
- Async variants (mapAsync, flatMapAsync)
- Combinators (and, or, all)
- Conversions (toNullable, fromNullable, fromPromise)
- Try-catch wrappers (tryCatch, tryCatchAsync)

### 2. Either<L, R> - Bi-directional Choice

```typescript
export type Either<L, R> =
  | { readonly tag: 'left'; readonly value: L }
  | { readonly tag: 'right'; readonly value: R };

// Constructors
function Left<L, R>(value: L): Either<L, R>
function Right<L, R>(value: R): Either<L, R>

// Operations
function map<L, R, U>(either: Either<L, R>, fn: (value: R) => U): Either<L, U>
function bimap<L, R, M, U>(
  either: Either<L, R>,
  leftFn: (L) => M,
  rightFn: (R) => U
): Either<M, U>
```

**Features**:
- Generic bi-directional choice
- By convention: Left = error, Right = success
- Transform both sides independently
- Swap operation
- Async support

### 3. Option<T> - Safe Nullable Handling

```typescript
export type Option<T> =
  | { readonly tag: 'some'; readonly value: T }
  | { readonly tag: 'none' };

// Constructors
function Some<T>(value: T): Option<T>
function None<T>(): Option<T>
function fromNullable<T>(value: T | null | undefined): Option<T>

// Operations
function map<T, U>(option: Option<T>, fn: (value: T) => U): Option<U>
function filter<T>(option: Option<T>, predicate: (T) => boolean): Option<T>
function getOrElse<T>(option: Option<T>, defaultValue: T): T
```

**Features**:
- Type-safe null/undefined handling
- Filter operations
- Combinators (and, or, all)
- Flatten nested options
- Contains and exists checks

### 4. Railway Oriented Programming Utilities

```typescript
// Compose Result-returning functions
function pipe<T, U, V, E>(
  fn1: (value: T) => Result<U, E>,
  fn2: (value: U) => Result<V, E>
): (value: T) => Result<V, E>

// Lift regular functions to Result-returning
function lift<T, U, E>(fn: (value: T) => U): (value: T) => Result<U, E>

// Wrap throwing functions
function liftTry<T, U>(fn: (value: T) => U): (value: T) => Result<U, string>

// Retry on failure
async function retry<T, E>(
  fn: () => Promise<Result<T, E>>,
  options: { maxAttempts: number; delayMs?: number }
): Promise<Result<T, E>>

// Accumulate all validation errors
function validateAll<T>(
  value: T,
  validators: Array<(value: T) => Result<T, string>>
): Result<T, string[]>

// Try multiple strategies
async function firstSuccess<T, E>(
  fns: Array<() => Promise<Result<T, E>>>
): Promise<Result<T, E[]>>
```

**Features**:
- Function composition (pipe, pipeAsync)
- Lifting ordinary functions
- Side effects (tee, teeErr)
- Retry logic
- Parallel execution
- Error accumulation
- Fallback strategies

## Implementation

### File Structure

```
src/domain/functional/
├── result.ts              # Result<T, E> type (~300 lines)
├── either.ts              # Either<L, R> type (~280 lines)
├── option.ts              # Option<T> type (~320 lines)
├── railway.ts             # Railway utilities (~400 lines)
├── index.ts               # Public exports
├── README.md              # Comprehensive documentation
└── __tests__/
    ├── result.test.ts     # 51 tests
    ├── either.test.ts     # 50 tests
    ├── option.test.ts     # 73 tests
    └── railway.test.ts    # 43 tests
```

### Services Demonstrating Result Types

Created three services to demonstrate practical usage:

1. **Result-based validation** (`result-validator.ts`)
   - Functional validators returning Results
   - Error accumulation
   - Composable validation rules

2. **Document processing service** (`document-processing-service.ts`)
   - Railway-oriented pipeline
   - Option for nullable metadata
   - Retry and fallback strategies
   - 29 tests demonstrating patterns

3. **Result catalog search** (`result-catalog-search-service.ts`)
   - Alternative to exception-based service
   - Demonstrates when to use Results vs Exceptions
   - Retry and fallback support

## Examples

### Example 1: Document Processing Pipeline

```typescript
function processDocument(path: string): Result<ProcessedDocument, DocumentError> {
  // Validate path
  const pathResult = validatePath(path);
  if (!pathResult.ok) return pathResult;
  
  // Extract format
  const formatResult = extractFormat(pathResult.value);
  if (!formatResult.ok) return formatResult;
  
  // Read and parse
  const contentResult = readFile(pathResult.value);
  if (!contentResult.ok) return contentResult;
  
  return Ok({
    path: pathResult.value,
    content: contentResult.value,
    metadata: parseMetadata(contentResult.value)
  });
}
```

### Example 2: Validation with Error Accumulation

```typescript
const validateUser = validateAll(user, [
  validateEmail,
  validatePassword,
  validateAge
]);

if (!validateUser.ok) {
  // validateUser.error is string[] with ALL errors
  return Err(validateUser.error);
}
```

### Example 3: Retry with Fallback

```typescript
const result = await retry(
  () => apiCall(),
  { maxAttempts: 3, delayMs: 1000 }
);

if (!result.ok) {
  // Try fallback
  return await fallbackService();
}
```

## Consequences

### Positive

1. **Explicit Error Handling**
   - Function signatures declare possible failures
   - Compiler enforces handling
   - No silent failures

2. **Composability**
   - Chain operations with map/flatMap
   - Build pipelines with railway utilities
   - Reusable error handling logic

3. **Type Safety**
   - Discriminated unions prevent accessing wrong variant
   - TypeScript narrows types after guards
   - No runtime type errors

4. **Testability**
   - Test error paths without throwing
   - Pure functions easy to test
   - No exception handling in tests

5. **Async Support**
   - Async variants for all operations
   - Promise wrappers (fromPromise)
   - Retry and parallel utilities

6. **Error Accumulation**
   - Collect all validation errors
   - Better UX (fix all issues at once)
   - Railway utilities support both fail-fast and accumulation

7. **Flexible Error Handling**
   - Choose Results or Exceptions based on use case
   - Coexist harmoniously
   - Gradual adoption possible

8. **Comprehensive Testing**
   - 217 tests covering all types
   - Railway pattern examples
   - Real-world scenarios

### Negative

1. **Learning Curve**
   - Developers need to learn functional patterns
   - When to use Results vs Exceptions not obvious initially
   - Railway-oriented programming is new concept
   - **Mitigation**: Comprehensive documentation, examples, clear guidelines

2. **Verbosity**
   - More code than exception-based
   - Pattern matching can be verbose
   - **Mitigation**: Railway utilities reduce boilerplate

3. **Two Error Handling Styles**
   - Team must understand when to use each
   - Inconsistency if guidelines not followed
   - **Mitigation**: Clear decision criteria documented

4. **Type Complexity**
   - Discriminated unions and generics can be complex
   - Error types propagate through call stack
   - **Mitigation**: Good IDE support, type inference helps

### Neutral

1. **Performance**: Negligible overhead from object creation
2. **Dependencies**: No external dependencies required
3. **Breaking Changes**: None - additive only

## Guidelines: When to Use Each Approach

### Use Result<T, E> When:
- ✅ Failure is expected and part of normal flow
- ✅ Caller should handle explicitly
- ✅ Composing operations (chaining with flatMap)
- ✅ Testing without mocking
- ✅ Error accumulation needed

**Examples**: Validation, parsing, API calls with expected failures

### Use Exceptions When:
- ✅ Failure is exceptional and unexpected
- ✅ Error should propagate to error boundary
- ✅ Immediate failure required (fail-fast)
- ✅ Integrating with exception-based code
- ✅ Simple control flow

**Examples**: Null pointer errors, out of memory, assertion failures

### Use Option<T> When:
- ✅ Value might be absent (not an error)
- ✅ Null/undefined handling needed
- ✅ Optional properties
- ✅ Safe array/map access

**Examples**: Optional configuration, database lookups, array access

### Use Either<L, R> When:
- ✅ Bi-directional choice between two types
- ✅ Both sides semantically equal
- ✅ More generic than Result needed

**Examples**: Parsing with detailed errors, conditional processing

## Alternatives Considered

### 1. Exception-Only Approach

Continue using only exceptions for all error handling.

**Pros**:
- Simpler, one approach
- Familiar to all developers
- Less code

**Cons**:
- Errors not explicit in signatures
- Composing error-prone operations difficult
- Testing requires exception handling
- No error accumulation

**Decision**: Rejected - functional types provide benefits exceptions can't

### 2. Use fp-ts Library

Use the fp-ts library which provides these types.

**Pros**:
- Battle-tested
- More features
- Active community

**Cons**:
- Large dependency
- Steep learning curve
- Over-engineered for our needs
- Complex type signatures

**Decision**: Rejected - prefer lightweight, custom implementation

### 3. Result Type Only

Implement only Result<T, E>, skip Either and Option.

**Pros**:
- Simpler
- Covers most use cases
- Smaller learning curve

**Cons**:
- Missing safe nullable handling
- No bi-directional choice type
- Incomplete functional toolkit

**Decision**: Rejected - Option crucial for nullable handling

## Related Patterns

### Railway Oriented Programming

The railway metaphor: two tracks (success and failure). Operations stay on success track until error occurs, then switch to failure track permanently.

```
   validatePath    extractFormat    readFile
     ─────→───────────→─────────────→────     Success Track
       ↓                                      
     ─────────────────────────────────────    Failure Track
           (short-circuit)
```

### Result vs ValidationResult

The existing ValidationResult (ADR 0037) is specialized for validation:

```typescript
// ValidationResult - validation-specific
class ValidationResult {
  success: boolean;
  errorMessages: string[];
}

// Result<T, E> - general purpose
type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };
```

**Keep both**: ValidationResult for form/input validation, Result for general error handling.

## Migration Strategy

### Phase 1: New Code (Completed)
- ✅ Implement core types
- ✅ Add railway utilities
- ✅ Create demonstration services
- ✅ Write comprehensive tests
- ✅ Document patterns

### Phase 2: Gradual Adoption (Future)
- Create more services using Results
- Refactor hot paths to use Results
- Training and documentation
- Establish team conventions

### Phase 3: Coexistence (Ongoing)
- Results and Exceptions coexist
- Use guidelines to choose approach
- No forced migration of existing code
- New features use appropriate approach

## Metrics

### Code Statistics
- **Result.ts**: ~300 lines
- **Either.ts**: ~280 lines
- **Option.ts**: ~320 lines
- **Railway.ts**: ~400 lines
- **Tests**: 217 tests across 4 files
- **Test Coverage**: 100%
- **Documentation**: Comprehensive README + ADR

### Time Investment
- Implementation: ~3 hours (agentic development)
- Testing: ~1.5 hours
- Documentation: ~1 hour
- **Total**: ~5.5 hours

### Adoption
- 3 new services demonstrating patterns
- Result-based validation module
- Railway pattern examples
- Real-world use cases documented

## Knowledge Base Concepts Applied

This implementation applies 8+ concepts from the concept lexicon:

1. **Functional error handling** - Result/Either types
2. **Railway-oriented programming** - Composition pattern
3. **Monadic composition** - flatMap, map operations
4. **Option/Maybe types** - Safe nullable handling
5. **Error as value** - Explicit success/failure
6. **Type-safe protocols** - Discriminated unions
7. **Algebraic data types** - Sum types
8. **Pure functions** - No side effects in operations

## Future Enhancements

1. **Pattern Matching**: TypeScript 5.0+ exhaustive pattern matching
2. **Do Notation**: Syntactic sugar for flatMap chains
3. **Async Streams**: Handle streams of Results
4. **Validation DSL**: Builder pattern for complex validations
5. **Integration**: Result-based middleware/interceptors
6. **Performance**: Benchmark against exceptions

## Conclusion

The Result/Either/Option type system provides a powerful alternative to exception-based error handling. It makes errors explicit, enables composition, and improves testability—all while coexisting harmoniously with our existing exception-based approach.

The railway-oriented programming utilities make functional error handling practical and ergonomic. The comprehensive tests (217 passing) and documentation ensure the system is production-ready.

This implementation demonstrates that functional programming patterns can improve TypeScript codebases without requiring full adoption of a functional paradigm.

---

**References**:
- Implementation: `src/domain/functional/`
- Services: `src/domain/services/document-processing-service.ts`
- Tests: `src/domain/functional/__tests__/`
- Documentation: `src/domain/functional/README.md`
- Time Investment: ~5.5 hours total
- Test Coverage: 100% (217 tests)
- Breaking Changes: None (additive)

**Status**: ✅ Implemented and Tested  
**Next Steps**: Gradual adoption in new features

