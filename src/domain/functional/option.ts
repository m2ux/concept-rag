/**
 * Option Type - Safe Nullable Handling
 * 
 * Option<T> represents a value that may or may not exist.
 * This provides a type-safe alternative to null/undefined, making the
 * possibility of absence explicit in function signatures.
 * 
 * @template T The value type when present
 */

/**
 * Option discriminated union
 */
export type Option<T> =
  | { readonly tag: 'some'; readonly value: T }
  | { readonly tag: 'none' };

/**
 * Constructor Functions
 */

/**
 * Create a Some Option
 */
export function Some<T>(value: T): Option<T> {
  return { tag: 'some', value };
}

/**
 * Create a None Option
 */
export function None<T = never>(): Option<T> {
  return { tag: 'none' };
}

/**
 * Type Guards
 */

/**
 * Check if Option is Some
 */
export function isSome<T>(option: Option<T>): option is { tag: 'some'; value: T } {
  return option.tag === 'some';
}

/**
 * Check if Option is None
 */
export function isNone<T>(option: Option<T>): option is { tag: 'none' } {
  return option.tag === 'none';
}

/**
 * Core Operations
 */

/**
 * Transform the value inside an Option if it's Some
 */
export function map<T, U>(option: Option<T>, fn: (value: T) => U): Option<U> {
  if (isSome(option)) {
    return Some(fn(option.value));
  }
  return None();
}

/**
 * Transform the value inside an Option where the transformation returns an Option
 */
export function flatMap<T, U>(option: Option<T>, fn: (value: T) => Option<U>): Option<U> {
  if (isSome(option)) {
    return fn(option.value);
  }
  return None();
}

/**
 * Filter an Option based on a predicate
 */
export function filter<T>(option: Option<T>, predicate: (value: T) => boolean): Option<T> {
  if (isSome(option) && predicate(option.value)) {
    return option;
  }
  return None();
}

/**
 * Get the value or provide a default
 */
export function getOrElse<T>(option: Option<T>, defaultValue: T): T {
  if (isSome(option)) {
    return option.value;
  }
  return defaultValue;
}

/**
 * Get the value or compute a default
 */
export function getOrElseL<T>(option: Option<T>, fn: () => T): T {
  if (isSome(option)) {
    return option.value;
  }
  return fn();
}

/**
 * Get the value or throw an error
 */
export function unwrap<T>(option: Option<T>): T {
  if (isSome(option)) {
    return option.value;
  }
  throw new Error('Called unwrap on None');
}

/**
 * Get the value or throw a custom error
 */
export function expect<T>(option: Option<T>, message: string): T {
  if (isSome(option)) {
    return option.value;
  }
  throw new Error(message);
}

/**
 * Pattern matching on Option (fold/match)
 */
export function fold<T, U>(option: Option<T>, onNone: () => U, onSome: (value: T) => U): U {
  if (isSome(option)) {
    return onSome(option.value);
  }
  return onNone();
}

/**
 * Execute a side effect if Some
 */
export function tap<T>(option: Option<T>, fn: (value: T) => void): Option<T> {
  if (isSome(option)) {
    fn(option.value);
  }
  return option;
}

/**
 * Execute a side effect if None
 */
export function tapNone<T>(option: Option<T>, fn: () => void): Option<T> {
  if (isNone(option)) {
    fn();
  }
  return option;
}

/**
 * Async Operations
 */

/**
 * Async version of map
 */
export async function mapAsync<T, U>(
  option: Option<T>,
  fn: (value: T) => Promise<U>
): Promise<Option<U>> {
  if (isSome(option)) {
    return Some(await fn(option.value));
  }
  return None();
}

/**
 * Async version of flatMap
 */
export async function flatMapAsync<T, U>(
  option: Option<T>,
  fn: (value: T) => Promise<Option<U>>
): Promise<Option<U>> {
  if (isSome(option)) {
    return await fn(option.value);
  }
  return None();
}

/**
 * Conversions
 */

/**
 * Convert nullable to Option
 */
export function fromNullable<T>(value: T | null | undefined): Option<T> {
  return value != null ? Some(value) : None();
}

/**
 * Convert Option to nullable (Some -> value, None -> null)
 */
export function toNullable<T>(option: Option<T>): T | null {
  return isSome(option) ? option.value : null;
}

/**
 * Convert Option to undefined (Some -> value, None -> undefined)
 */
export function toUndefined<T>(option: Option<T>): T | undefined {
  return isSome(option) ? option.value : undefined;
}

/**
 * Convert boolean to Option
 */
export function fromPredicate<T>(value: T, predicate: (value: T) => boolean): Option<T> {
  return predicate(value) ? Some(value) : None();
}

/**
 * Try-catch wrapper returning Option
 */
export function tryCatch<T>(fn: () => T): Option<T> {
  try {
    return Some(fn());
  } catch {
    return None();
  }
}

/**
 * Async try-catch wrapper
 */
export async function tryCatchAsync<T>(fn: () => Promise<T>): Promise<Option<T>> {
  try {
    return Some(await fn());
  } catch {
    return None();
  }
}

/**
 * Combinators
 */

/**
 * Combine two Options - both must be Some for result to be Some
 */
export function and<T, U>(optionA: Option<T>, optionB: Option<U>): Option<[T, U]> {
  if (isSome(optionA) && isSome(optionB)) {
    return Some([optionA.value, optionB.value]);
  }
  return None();
}

/**
 * Combine multiple Options - all must be Some for result to be Some
 */
export function all<T>(options: Option<T>[]): Option<T[]> {
  const values: T[] = [];
  for (const option of options) {
    if (isNone(option)) {
      return None();
    }
    // @ts-expect-error - Type narrowing limitation
    values.push(option.value);
  }
  return Some(values);
}

/**
 * Combine two Options - at least one must be Some
 * Prefers the first Some value
 */
export function or<T>(optionA: Option<T>, optionB: Option<T>): Option<T> {
  if (isSome(optionA)) {
    return optionA;
  }
  return optionB;
}

/**
 * Return the first Some value in array, or None if all are None
 */
export function firstSome<T>(options: Option<T>[]): Option<T> {
  for (const option of options) {
    if (isSome(option)) {
      return option;
    }
  }
  return None();
}

/**
 * Apply a function wrapped in Option to a value wrapped in Option
 */
export function ap<T, U>(optionFn: Option<(value: T) => U>, option: Option<T>): Option<U> {
  if (isSome(optionFn) && isSome(option)) {
    return Some(optionFn.value(option.value));
  }
  return None();
}

/**
 * Flatten nested Options
 */
export function flatten<T>(option: Option<Option<T>>): Option<T> {
  if (isSome(option)) {
    return option.value;
  }
  return None();
}

/**
 * Zip two Options into a tuple Option
 */
export function zip<T, U>(optionA: Option<T>, optionB: Option<U>): Option<[T, U]> {
  return and(optionA, optionB);
}

/**
 * Check if Option contains a specific value
 */
export function contains<T>(option: Option<T>, value: T): boolean {
  return isSome(option) && option.value === value;
}

/**
 * Check if Option satisfies a predicate
 */
export function exists<T>(option: Option<T>, predicate: (value: T) => boolean): boolean {
  return isSome(option) && predicate(option.value);
}
