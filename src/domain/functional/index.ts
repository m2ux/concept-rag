/**
 * Functional Programming Types
 * 
 * This module provides functional programming patterns for error handling
 * and nullable value handling in TypeScript.
 */

// Result type - for operations that can succeed or fail
// @ts-expect-error - Type narrowing limitation
export * as Result from './result.js';
// @ts-expect-error - Type narrowing limitation
export type { Result } from './result.js';
export { Ok, Err, isOk, isErr } from './result.js';

// Either type - for bi-directional choice
// @ts-expect-error - Type narrowing limitation
export * as Either from './either.js';
// @ts-expect-error - Type narrowing limitation
export type { Either } from './either.js';
export { Left, Right, isLeft, isRight } from './either.js';

// Option type - for nullable value handling
// @ts-expect-error - Type narrowing limitation
export * as Option from './option.js';
// @ts-expect-error - Type narrowing limitation
export type { Option } from './option.js';
export { Some, None, isSome, isNone, fromNullable, toNullable, map as mapOption, fold as foldOption, getOrElse } from './option.js';

// Railway Oriented Programming utilities
export * as Railway from './railway.js';
export {
  pipe,
  pipeAsync,
  lift,
  liftTry,
  liftTryAsync,
  tee,
  teeErr,
  validateAll,
  retry,
  parallel,
  parallelAll,
  firstSuccess,
  when,
  branch,
  bimap,
  recover,
  recoverWith,
  ensure
} from './railway.js';

