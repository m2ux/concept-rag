/**
 * Result Type - Functional Error Handling
 * 
 * Result<T, E> represents the outcome of an operation that can succeed or fail.
 * This provides an alternative to exceptions for expected failures, making error
 * handling explicit in function signatures.
 * 
 * @template T The success value type
 * @template E The error type
 */

/**
 * Result discriminated union
 */
export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

/**
 * Constructor Functions
 */

/**
 * Create a successful Result
 */
export function Ok<T, E = never>(value: T): Result<T, E> {
  return { ok: true, value };
}

/**
 * Create a failed Result
 */
export function Err<T = never, E = unknown>(error: E): Result<T, E> {
  return { ok: false, error };
}

/**
 * Type Guards
 */

/**
 * Check if Result is Ok
 */
export function isOk<T, E>(result: Result<T, E>): result is { ok: true; value: T } {
  return result.ok === true;
}

/**
 * Check if Result is Err
 */
export function isErr<T, E>(result: Result<T, E>): result is { ok: false; error: E } {
  return result.ok === false;
}

/**
 * Core Operations
 */

/**
 * Transform the value inside a Result if it's Ok
 */
export function map<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E> {
  if (isOk(result)) {
    return Ok(fn(result.value));
  }
  // @ts-expect-error - Type narrowing limitation
  return result;
}

/**
 * Transform the value inside a Result if it's Ok, where the transformation
 * function returns a Result (allows chaining operations that can fail)
 */
export function flatMap<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> {
  if (isOk(result)) {
    return fn(result.value);
  }
  // @ts-expect-error - Type narrowing limitation
  return result;
}

/**
 * Transform the error inside a Result if it's Err
 */
export function mapErr<T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F
): Result<T, F> {
  if (isErr(result)) {
    return Err(fn(result.error));
  }
  // @ts-expect-error - Type narrowing limitation
  return result;
}

/**
 * Extract the value from a Result, providing a default if it's Err
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  if (isOk(result)) {
    // @ts-expect-error - Type narrowing limitation
    return (result as Ok<T>).value;
  }
  return defaultValue;
}

/**
 * Extract the value from a Result, computing a default from the error if it's Err
 */
export function unwrapOrElse<T, E>(
  result: Result<T, E>,
  fn: (error: E) => T
): T {
  if (isOk(result)) {
    // @ts-expect-error - Type narrowing limitation
    return (result as Ok<T>).value;
  }
  // @ts-expect-error - Type narrowing limitation
  return fn((result as Err<E>).error);
}

/**
 * Extract the value from a Result, throwing if it's Err
 * Use sparingly - defeats the purpose of Result types
 */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (isOk(result)) {
    // @ts-expect-error - Type narrowing limitation
    return (result as Ok<T>).value;
  }
  // @ts-expect-error - Type narrowing limitation
  throw new Error(`Called unwrap on an Err value: ${JSON.stringify(result.error)}`);
}

/**
 * Pattern matching on Result (fold/match)
 * Execute one of two functions based on whether Result is Ok or Err
 */
export function fold<T, E, U>(
  result: Result<T, E>,
  onOk: (value: T) => U,
  onErr: (error: E) => U
): U {
  if (isOk(result)) {
    return onOk(result.value);
  }
  // @ts-expect-error - Type narrowing limitation
  return onErr(result.error);
}

/**
 * Execute a side effect if the Result is Ok
 */
export function tap<T, E>(result: Result<T, E>, fn: (value: T) => void): Result<T, E> {
  if (isOk(result)) {
    fn(result.value);
  }
  return result;
}

/**
 * Execute a side effect if the Result is Err
 */
export function tapErr<T, E>(result: Result<T, E>, fn: (error: E) => void): Result<T, E> {
  if (isErr(result)) {
    fn(result.error);
  }
  return result;
}

/**
 * Async Operations
 */

/**
 * Async version of map
 */
export async function mapAsync<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Promise<U>
): Promise<Result<U, E>> {
  if (isOk(result)) {
    return Ok(await fn(result.value));
  }
  // @ts-expect-error - Type narrowing limitation
  return result;
}

/**
 * Async version of flatMap
 */
export async function flatMapAsync<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Promise<Result<U, E>>
): Promise<Result<U, E>> {
  if (isOk(result)) {
    return await fn(result.value);
  }
  // @ts-expect-error - Type narrowing limitation
  return result;
}

/**
 * Convert a Promise that might throw into a Result
 */
export async function fromPromise<T, E = Error>(
  promise: Promise<T>
): Promise<Result<T, E>> {
  try {
    const value = await promise;
    return Ok(value);
  } catch (error) {
    return Err(error as E);
  }
}

/**
 * Wrap a function that might throw in a try-catch and return a Result
 */
export function tryCatch<T, E = Error>(fn: () => T): Result<T, E> {
  try {
    return Ok(fn());
  } catch (error) {
    return Err(error as E);
  }
}

/**
 * Async version of tryCatch
 */
export async function tryCatchAsync<T, E = Error>(
  fn: () => Promise<T>
): Promise<Result<T, E>> {
  try {
    return Ok(await fn());
  } catch (error) {
    return Err(error as E);
  }
}

/**
 * Combinators
 */

/**
 * Combine two Results - both must be Ok for result to be Ok
 */
export function and<T, U, E>(
  resultA: Result<T, E>,
  resultB: Result<U, E>
): Result<[T, U], E> {
  if (isOk(resultA) && isOk(resultB)) {
    return Ok([resultA.value, resultB.value]);
  }
  if (isErr(resultA)) {
    return resultA;
  }
  // @ts-expect-error - Type narrowing limitation
  return resultB;
}

/**
 * Combine multiple Results - all must be Ok for result to be Ok
 * Returns first error encountered
 */
export function all<T, E>(results: Result<T, E>[]): Result<T[], E> {
  const values: T[] = [];
  for (const result of results) {
    if (isErr(result)) {
      return result;
    }
    // @ts-expect-error - Type narrowing limitation
    values.push(result.value);
  }
  return Ok(values);
}

/**
 * Combine two Results - at least one must be Ok
 * Prefers the first Ok value
 */
export function or<T, E>(resultA: Result<T, E>, resultB: Result<T, E>): Result<T, E> {
  if (isOk(resultA)) {
    return resultA;
  }
  return resultB;
}

/**
 * Convert Result to nullable value (Ok -> value, Err -> null)
 */
export function toNullable<T, E>(result: Result<T, E>): T | null {
  return isOk(result) ? result.value : null;
}

/**
 * Convert Result to undefined value (Ok -> value, Err -> undefined)
 */
export function toUndefined<T, E>(result: Result<T, E>): T | undefined {
  return isOk(result) ? result.value : undefined;
}

/**
 * Convert nullable to Result
 */
export function fromNullable<T, E>(
  value: T | null | undefined,
  error: E
): Result<T, E> {
  return value != null ? Ok(value) : Err(error);
}
