/**
 * Functional Programming Types
 *
 * This module provides functional programming patterns for error handling
 * and nullable value handling in TypeScript.
 */

// ponytail: Result + Option only — the Either and Railway modules were removed as dead code (no consumers outside this barrel). add when a real caller needs bi-directional Either or Railway-style pipeline composition (pipe/retry/firstSuccess/validateAll)

// Result type - for operations that can succeed or fail
// @ts-expect-error - Type narrowing limitation
export * as Result from './result.js';
// @ts-expect-error - Type narrowing limitation
export type { Result } from './result.js';
export { Ok, Err, isOk, isErr } from './result.js';

// Option type - for nullable value handling
// @ts-expect-error - Type narrowing limitation
export * as Option from './option.js';
// @ts-expect-error - Type narrowing limitation
export type { Option } from './option.js';
export { Some, None, isSome, isNone, fromNullable, toNullable, map as mapOption, fold as foldOption, getOrElse } from './option.js';

