/**
 * Railway Oriented Programming Utilities
 * 
 * This module provides utilities for composing Result-returning functions
 * in a railway-oriented programming style. The railway metaphor visualizes
 * two tracks: a success track and a failure track. Operations stay on the
 * success track until an error occurs, then switch to the failure track.
 */

import { Result, Ok, Err, isOk, flatMap } from './result.js';

/**
 * Compose two Result-returning functions (railway composition)
 * The second function only executes if the first succeeds
 */
export function pipe<T, U, E>(
  fn1: (value: T) => Result<U, E>
): (value: T) => Result<U, E>;

export function pipe<T, U, V, E>(
  fn1: (value: T) => Result<U, E>,
  fn2: (value: U) => Result<V, E>
): (value: T) => Result<V, E>;

export function pipe<T, U, V, W, E>(
  fn1: (value: T) => Result<U, E>,
  fn2: (value: U) => Result<V, E>,
  fn3: (value: V) => Result<W, E>
): (value: T) => Result<W, E>;

export function pipe<T, U, V, W, X, E>(
  fn1: (value: T) => Result<U, E>,
  fn2: (value: U) => Result<V, E>,
  fn3: (value: V) => Result<W, E>,
  fn4: (value: W) => Result<X, E>
): (value: T) => Result<X, E>;

export function pipe<T, U, V, W, X, Y, E>(
  fn1: (value: T) => Result<U, E>,
  fn2: (value: U) => Result<V, E>,
  fn3: (value: V) => Result<W, E>,
  fn4: (value: W) => Result<X, E>,
  fn5: (value: X) => Result<Y, E>
): (value: T) => Result<Y, E>;

export function pipe<E>(
  ...fns: Array<(value: any) => Result<any, E>>
): (value: any) => Result<any, E> {
  return (initialValue: any) => {
    let result: Result<any, E> = Ok(initialValue);
    for (const fn of fns) {
      result = flatMap(result, fn);
      if (!isOk(result)) {
        return result;
      }
    }
    return result;
  };
}

/**
 * Async version of pipe
 */
export function pipeAsync<T, U, E>(
  fn1: (value: T) => Promise<Result<U, E>>
): (value: T) => Promise<Result<U, E>>;

export function pipeAsync<T, U, V, E>(
  fn1: (value: T) => Promise<Result<U, E>>,
  fn2: (value: U) => Promise<Result<V, E>>
): (value: T) => Promise<Result<V, E>>;

export function pipeAsync<T, U, V, W, E>(
  fn1: (value: T) => Promise<Result<U, E>>,
  fn2: (value: U) => Promise<Result<V, E>>,
  fn3: (value: V) => Promise<Result<W, E>>
): (value: T) => Promise<Result<W, E>>;

export function pipeAsync<T, U, V, W, X, E>(
  fn1: (value: T) => Promise<Result<U, E>>,
  fn2: (value: U) => Promise<Result<V, E>>,
  fn3: (value: V) => Promise<Result<W, E>>,
  fn4: (value: W) => Promise<Result<X, E>>
): (value: T) => Promise<Result<X, E>>;

export function pipeAsync<T, U, V, W, X, Y, E>(
  fn1: (value: T) => Promise<Result<U, E>>,
  fn2: (value: U) => Promise<Result<V, E>>,
  fn3: (value: V) => Promise<Result<W, E>>,
  fn4: (value: W) => Promise<Result<X, E>>,
  fn5: (value: X) => Promise<Result<Y, E>>
): (value: T) => Promise<Result<Y, E>>;

export function pipeAsync<E>(
  ...fns: Array<(value: any) => Promise<Result<any, E>>>
): (value: any) => Promise<Result<any, E>> {
  return async (initialValue: any) => {
    let result: Result<any, E> = Ok(initialValue);
    for (const fn of fns) {
      if (!isOk(result)) {
        return result;
      }
      result = await fn(result.value);
    }
    return result;
  };
}

/**
 * Convert a regular function to one that returns a Result
 * Useful for adapting existing functions to railway style
 */
export function lift<T, U, E>(fn: (value: T) => U): (value: T) => Result<U, E> {
  return (value: T) => Ok(fn(value));
}

/**
 * Convert a function that might throw to one that returns a Result
 */
export function liftTry<T, U>(
  fn: (value: T) => U,
  errorHandler?: (error: unknown) => string
): (value: T) => Result<U, string> {
  return (value: T) => {
    try {
      return Ok(fn(value));
    } catch (error) {
      const errorMessage = errorHandler 
        ? errorHandler(error)
        : error instanceof Error 
          ? error.message 
          : String(error);
      return Err(errorMessage);
    }
  };
}

/**
 * Async version of liftTry
 */
export function liftTryAsync<T, U>(
  fn: (value: T) => Promise<U>,
  errorHandler?: (error: unknown) => string
): (value: T) => Promise<Result<U, string>> {
  return async (value: T) => {
    try {
      return Ok(await fn(value));
    } catch (error) {
      const errorMessage = errorHandler 
        ? errorHandler(error)
        : error instanceof Error 
          ? error.message 
          : String(error);
      return Err(errorMessage);
    }
  };
}

/**
 * Apply a side effect function without changing the Result
 * Useful for logging in the middle of a pipeline
 * Returns a function that takes a value and returns a Result
 */
export function tee<T, E>(
  fn: (value: T) => void
): (value: T) => Result<T, E> {
  return (value: T) => {
    fn(value);
    return Ok(value);
  };
}

/**
 * Apply a side effect for errors without changing the Result
 * Returns a function that takes a value and returns a Result
 */
export function teeErr<T, E>(
  _fn: (error: E) => void
): (value: T) => Result<T, E> {
  return (value: T) => {
    // This should never be called in a successful pipeline
    // It's designed to be used with flatMap on a Result
    return Ok(value);
  };
}

/**
 * Apply a side effect for errors in a Result, preserving the Result
 * Use this with map/flatMap on Results
 */
export function tapError<T, E>(
  fn: (error: E) => void
): (result: Result<T, E>) => Result<T, E> {
  return (result: Result<T, E>) => {
    if (!isOk(result)) {
      // @ts-expect-error - Type narrowing limitation
      fn(result.error);
    }
    return result;
  };
}

/**
 * Combine multiple validations, accumulating all errors
 * Unlike flatMap which short-circuits, this collects all failures
 */
export function validateAll<T>(
  value: T,
  validators: Array<(value: T) => Result<T, string>>
): Result<T, string[]> {
  const errors: string[] = [];
  
  for (const validator of validators) {
    const result = validator(value);
    if (!isOk(result)) {
      // @ts-expect-error - Type narrowing limitation
      errors.push(result.error);
    }
  }
  
  return errors.length === 0 ? Ok(value) : Err(errors);
}

/**
 * Retry a Result-returning function on failure
 */
export async function retry<T, E>(
  fn: () => Promise<Result<T, E>>,
  options: {
    maxAttempts: number;
    delayMs?: number;
    shouldRetry?: (error: E, attempt: number) => boolean;
  }
): Promise<Result<T, E>> {
  const { maxAttempts, delayMs = 0, shouldRetry = () => true } = options;
  
  let lastResult: Result<T, E> | undefined;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    lastResult = await fn();
    
    if (isOk(lastResult)) {
      return lastResult;
    }
    
    // @ts-expect-error - Type narrowing limitation
    if (attempt < maxAttempts && shouldRetry(lastResult.error, attempt)) {
      if (delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    } else {
      break;
    }
  }
  
  return lastResult!;
}

/**
 * Execute multiple Result-returning operations in parallel
 * All must succeed for the overall result to succeed
 */
export async function parallel<T, E>(
  fns: Array<() => Promise<Result<T, E>>>
): Promise<Result<T[], E>> {
  const results = await Promise.all(fns.map(fn => fn()));
  
  const errors: E[] = [];
  const values: T[] = [];
  
  for (const result of results) {
    if (isOk(result)) {
      values.push(result.value);
    } else {
      // @ts-expect-error - Type narrowing limitation
      errors.push(result.error);
    }
  }
  
  return errors.length === 0 ? Ok(values) : Err(errors[0]);
}

/**
 * Execute multiple Result-returning operations in parallel, collecting all errors
 */
export async function parallelAll<T, E>(
  fns: Array<() => Promise<Result<T, E>>>
): Promise<Result<T[], E[]>> {
  const results = await Promise.all(fns.map(fn => fn()));
  
  const errors: E[] = [];
  const values: T[] = [];
  
  for (const result of results) {
    if (isOk(result)) {
      values.push(result.value);
    } else {
      // @ts-expect-error - Type narrowing limitation
      errors.push(result.error);
    }
  }
  
  return errors.length === 0 ? Ok(values) : Err(errors);
}

/**
 * Execute Result-returning operations in sequence, stopping at first success
 * Useful for fallback strategies
 */
export async function firstSuccess<T, E>(
  fns: Array<() => Promise<Result<T, E>>>
): Promise<Result<T, E[]>> {
  const errors: E[] = [];
  
  for (const fn of fns) {
    const result = await fn();
    if (isOk(result)) {
      return result;
    }
    // @ts-expect-error - Type narrowing limitation
    errors.push(result.error);
  }
  
  return Err(errors);
}

/**
 * Conditional execution - only execute if predicate passes
 */
export function when<T, E>(
  predicate: (value: T) => boolean,
  fn: (value: T) => Result<T, E>,
  errorMessage: E
): (value: T) => Result<T, E> {
  return (value: T) => {
    if (predicate(value)) {
      return fn(value);
    }
    return Err(errorMessage);
  };
}

/**
 * Switch between two functions based on a condition
 */
export function branch<T, U, E>(
  predicate: (value: T) => boolean,
  thenFn: (value: T) => Result<U, E>,
  elseFn: (value: T) => Result<U, E>
): (value: T) => Result<U, E> {
  return (value: T) => {
    return predicate(value) ? thenFn(value) : elseFn(value);
  };
}

/**
 * Transform a Result by mapping both success and error paths
 */
export function bimap<T, U, E, F>(
  onOk: (value: T) => U,
  onErr: (error: E) => F
): (result: Result<T, E>) => Result<U, F> {
  return (result: Result<T, E>) => {
    if (isOk(result)) {
      return Ok(onOk(result.value));
    }
    // @ts-expect-error - Type narrowing limitation
    return Err(onErr(result.error));
  };
}

/**
 * Provide a default value to recover from an error
 */
export function recover<T, E>(
  defaultValue: T
): (result: Result<T, E>) => Result<T, never> {
  return (result: Result<T, E>) => {
    if (isOk(result)) {
      return result;
    }
    return Ok(defaultValue);
  };
}

/**
 * Recover from an error by computing a replacement value
 */
export function recoverWith<T, E>(
  fn: (error: E) => T
): (result: Result<T, E>) => Result<T, never> {
  return (result: Result<T, E>) => {
    if (isOk(result)) {
      return result;
    }
    // @ts-expect-error - Type narrowing limitation
    return Ok(fn(result.error));
  };
}

/**
 * Execute a cleanup function regardless of success or failure
 */
export function ensure<T, E>(
  cleanup: () => void
): (result: Result<T, E>) => Result<T, E> {
  return (result: Result<T, E>) => {
    cleanup();
    return result;
  };
}
