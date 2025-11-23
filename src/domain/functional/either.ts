/**
 * Either Type - Bi-directional Choice
 * 
 * Either<L, R> represents a value that can be one of two types: Left or Right.
 * By convention, Left represents failure/error and Right represents success.
 * This is similar to Result but more generic - both sides have equal status.
 * 
 * @template L The left type (by convention, error)
 * @template R The right type (by convention, success)
 */

/**
 * Either discriminated union
 */
export type Either<L, R> =
  | { readonly tag: 'left'; readonly value: L }
  | { readonly tag: 'right'; readonly value: R };

/**
 * Constructor Functions
 */

/**
 * Create a Left Either
 */
export function Left<L, R = never>(value: L): Either<L, R> {
  return { tag: 'left', value };
}

/**
 * Create a Right Either
 */
export function Right<L = never, R = unknown>(value: R): Either<L, R> {
  return { tag: 'right', value };
}

/**
 * Type Guards
 */

/**
 * Check if Either is Left
 */
export function isLeft<L, R>(either: Either<L, R>): either is { tag: 'left'; value: L } {
  return either.tag === 'left';
}

/**
 * Check if Either is Right
 */
export function isRight<L, R>(either: Either<L, R>): either is { tag: 'right'; value: R } {
  return either.tag === 'right';
}

/**
 * Core Operations
 */

/**
 * Transform the Right value if present
 */
export function map<L, R, U>(
  either: Either<L, R>,
  fn: (value: R) => U
): Either<L, U> {
  if (isRight(either)) {
    return Right(fn(either.value));
  }
  return either;
}

/**
 * Transform the Left value if present
 */
export function mapLeft<L, R, M>(
  either: Either<L, R>,
  fn: (value: L) => M
): Either<M, R> {
  if (isLeft(either)) {
    return Left(fn(either.value));
  }
  return either;
}

/**
 * Transform both Left and Right values
 */
export function bimap<L, R, M, U>(
  either: Either<L, R>,
  leftFn: (value: L) => M,
  rightFn: (value: R) => U
): Either<M, U> {
  if (isLeft(either)) {
    return Left(leftFn(either.value));
  }
  return Right(rightFn(either.value));
}

/**
 * Transform the Right value where the transformation returns an Either
 */
export function flatMap<L, R, U>(
  either: Either<L, R>,
  fn: (value: R) => Either<L, U>
): Either<L, U> {
  if (isRight(either)) {
    return fn(either.value);
  }
  return either;
}

/**
 * Pattern matching on Either (fold/match)
 */
export function fold<L, R, U>(
  either: Either<L, R>,
  onLeft: (value: L) => U,
  onRight: (value: R) => U
): U {
  if (isLeft(either)) {
    return onLeft(either.value);
  }
  return onRight(either.value);
}

/**
 * Get the Right value or provide a default
 */
export function getOrElse<L, R>(either: Either<L, R>, defaultValue: R): R {
  if (isRight(either)) {
    return either.value;
  }
  return defaultValue;
}

/**
 * Get the Right value or compute it from Left
 */
export function getOrElseL<L, R>(either: Either<L, R>, fn: (left: L) => R): R {
  if (isRight(either)) {
    return either.value;
  }
  return fn(either.value);
}

/**
 * Swap Left and Right
 */
export function swap<L, R>(either: Either<L, R>): Either<R, L> {
  if (isLeft(either)) {
    return Right(either.value);
  }
  return Left(either.value);
}

/**
 * Execute a side effect if Right
 */
export function tap<L, R>(either: Either<L, R>, fn: (value: R) => void): Either<L, R> {
  if (isRight(either)) {
    fn(either.value);
  }
  return either;
}

/**
 * Execute a side effect if Left
 */
export function tapLeft<L, R>(either: Either<L, R>, fn: (value: L) => void): Either<L, R> {
  if (isLeft(either)) {
    fn(either.value);
  }
  return either;
}

/**
 * Async Operations
 */

/**
 * Async version of map
 */
export async function mapAsync<L, R, U>(
  either: Either<L, R>,
  fn: (value: R) => Promise<U>
): Promise<Either<L, U>> {
  if (isRight(either)) {
    return Right(await fn(either.value));
  }
  return either;
}

/**
 * Async version of flatMap
 */
export async function flatMapAsync<L, R, U>(
  either: Either<L, R>,
  fn: (value: R) => Promise<Either<L, U>>
): Promise<Either<L, U>> {
  if (isRight(either)) {
    return await fn(either.value);
  }
  return either;
}

/**
 * Async version of bimap
 */
export async function bimapAsync<L, R, M, U>(
  either: Either<L, R>,
  leftFn: (value: L) => Promise<M>,
  rightFn: (value: R) => Promise<U>
): Promise<Either<M, U>> {
  if (isLeft(either)) {
    return Left(await leftFn(either.value));
  }
  return Right(await rightFn(either.value));
}

/**
 * Conversions
 */

/**
 * Convert to nullable (Right -> value, Left -> null)
 */
export function toNullable<L, R>(either: Either<L, R>): R | null {
  return isRight(either) ? either.value : null;
}

/**
 * Convert to undefined (Right -> value, Left -> undefined)
 */
export function toUndefined<L, R>(either: Either<L, R>): R | undefined {
  return isRight(either) ? either.value : undefined;
}

/**
 * Convert from nullable
 */
export function fromNullable<L, R>(value: R | null | undefined, leftValue: L): Either<L, R> {
  return value != null ? Right(value) : Left(leftValue);
}

/**
 * Try-catch wrapper returning Either
 */
export function tryCatch<L, R>(fn: () => R, onError: (error: unknown) => L): Either<L, R> {
  try {
    return Right(fn());
  } catch (error) {
    return Left(onError(error));
  }
}

/**
 * Async try-catch wrapper
 */
export async function tryCatchAsync<L, R>(
  fn: () => Promise<R>,
  onError: (error: unknown) => L
): Promise<Either<L, R>> {
  try {
    return Right(await fn());
  } catch (error) {
    return Left(onError(error));
  }
}

/**
 * Combinators
 */

/**
 * Combine multiple Eithers - all must be Right for result to be Right
 * Returns first Left encountered
 */
export function all<L, R>(eithers: Either<L, R>[]): Either<L, R[]> {
  const values: R[] = [];
  for (const either of eithers) {
    if (isLeft(either)) {
      return either;
    }
    values.push(either.value);
  }
  return Right(values);
}

/**
 * Apply a function wrapped in Either to a value wrapped in Either
 */
export function ap<L, R, U>(
  eitherFn: Either<L, (value: R) => U>,
  either: Either<L, R>
): Either<L, U> {
  if (isRight(eitherFn) && isRight(either)) {
    return Right(eitherFn.value(either.value));
  }
  if (isLeft(eitherFn)) {
    return eitherFn;
  }
  return either;
}

