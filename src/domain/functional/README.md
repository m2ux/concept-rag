# Functional Programming Types

This module provides functional programming patterns for error handling and nullable value handling in TypeScript, inspired by Rust, Scala, and Haskell.

## Overview

The module implements two core types:

1. **Result<T, E>** - For operations that can succeed or fail
2. **Option<T>** - For safe nullable handling

> Note: `Either<L, R>` and the Railway Oriented Programming utilities were removed as dead code — no consumers existed outside the module barrel. Reintroduce them when a real caller needs bi-directional `Either` or pipeline composition (`pipe`/`retry`/`firstSuccess`/`validateAll`).

## Installation

The functional types are available in the `src/domain/functional` directory:

```typescript
import { Result, Ok, Err } from '../functional/result';
import { Option, Some, None } from '../functional/option';
```

## Result<T, E>

The Result type represents an operation that can succeed (`Ok`) or fail (`Err`).

### Basic Usage

```typescript
import { Result, Ok, Err, isOk } from '../functional/result';

function divide(a: number, b: number): Result<number, string> {
  if (b === 0) {
    return Err('Division by zero');
  }
  return Ok(a / b);
}

const result = divide(10, 2);
if (isOk(result)) {
  console.log('Result:', result.value); // 5
} else {
  console.log('Error:', result.error);
}
```

### Transforming Results

```typescript
import { map, flatMap } from '../functional/result';

// Transform the success value
const doubled = map(divide(10, 2), x => x * 2); // Ok(10)

// Chain operations
const chained = flatMap(
  divide(10, 2),
  x => divide(x, 2)
); // Ok(2.5)
```

### Pattern Matching

```typescript
import { fold } from '../functional/result';

const message = fold(
  divide(10, 0),
  value => `Success: ${value}`,
  error => `Error: ${error}`
); // "Error: Division by zero"
```

### Async Operations

```typescript
import { fromPromise, mapAsync } from '../functional/result';

// Wrap promises
const result = await fromPromise(fetch('/api/data'));

// Transform async values
const transformed = await mapAsync(result, data => data.json());
```

## Option<T>

The Option type represents a value that may or may not exist, providing a type-safe alternative to null/undefined.

### Basic Usage

```typescript
import { Option, Some, None, isSome, fromNullable } from '../functional/option';

function findUser(id: number): Option<User> {
  const user = database.find(id);
  return fromNullable(user);
}

const userOption = findUser(123);
if (isSome(userOption)) {
  console.log('Found:', userOption.value);
} else {
  console.log('User not found');
}
```

### Working with Options

```typescript
import { map, getOrElse, filter } from '../functional/option';

// Transform if present
const name = map(findUser(123), user => user.name);

// Provide default
const userName = getOrElse(name, 'Anonymous');

// Filter based on predicate
const activeUser = filter(findUser(123), user => user.active);
```

## When to Use Each Type

### Use Result When:
- Operation can succeed or fail
- You want to make errors explicit in the type signature
- You need to compose operations that might fail
- You want to avoid exception-based control flow

### Use Option When:
- Value might be absent (null/undefined)
- Absence is not an error, just a missing value
- You want type-safe nullable handling

## Practical Examples

### Example 1: Document Processing Pipeline

```typescript
function processDocument(path: string): Result<ProcessedDoc, DocError> {
  // Validate path
  const pathResult = validatePath(path);
  if (!pathResult.ok) return pathResult;
  
  // Extract format
  const formatResult = extractFormat(pathResult.value);
  if (!formatResult.ok) return formatResult;
  
  // Read content
  const contentResult = readFile(pathResult.value);
  if (!contentResult.ok) return contentResult;
  
  // Parse metadata
  const metadataResult = parseMetadata(
    pathResult.value,
    contentResult.value
  );
  if (!metadataResult.ok) return metadataResult;
  
  return Ok({
    path: pathResult.value,
    content: contentResult.value,
    metadata: metadataResult.value
  });
}
```

### Example 2: Safe Array Access with Option

```typescript
function safeGet<T>(arr: T[], index: number): Option<T> {
  return index >= 0 && index < arr.length
    ? Some(arr[index])
    : None();
}

// Usage
const arr = [1, 2, 3];
const first = safeGet(arr, 0); // Some(1)
const outOfBounds = safeGet(arr, 10); // None

const value = getOrElse(first, 0); // 1
const defaultValue = getOrElse(outOfBounds, 0); // 0
```

## Comparison with Exceptions

### Exception-Based (Current Pattern)

```typescript
function divide(a: number, b: number): number {
  if (b === 0) {
    throw new Error('Division by zero');
  }
  return a / b;
}

try {
  const result = divide(10, 0);
  console.log(result);
} catch (error) {
  console.error('Error:', error.message);
}
```

### Result-Based (New Pattern)

```typescript
function divide(a: number, b: number): Result<number, string> {
  if (b === 0) {
    return Err('Division by zero');
  }
  return Ok(a / b);
}

const result = divide(10, 0);
if (isOk(result)) {
  console.log(result.value);
} else {
  console.error('Error:', result.error);
}
```

### When to Use Each

**Use Exceptions when:**
- Failure is truly exceptional (rare, unexpected)
- Error should propagate to an error boundary
- Integrating with exception-based libraries
- Fail-fast behavior is desired

**Use Results when:**
- Failure is expected and part of normal flow
- Error handling should be explicit
- Composing multiple operations
- Testing without mocking

## API Reference

See individual module files for complete API documentation:
- `result.ts` - Result<T, E> type and utilities
- `option.ts` - Option<T> type and utilities

## Further Reading

- [Rust Result Documentation](https://doc.rust-lang.org/std/result/)
- [Functional Programming in TypeScript](https://gcanti.github.io/fp-ts/)

