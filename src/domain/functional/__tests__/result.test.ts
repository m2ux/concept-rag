/**
 * Tests for Result<T, E> type
 */

import { describe, it, expect } from 'vitest';
import * as Result from '../result';

describe('Result Type', () => {
  describe('Constructors', () => {
    it('should create Ok result', () => {
      const result = Result.Ok(42);
      expect(Result.isOk(result)).toBe(true);
      expect(Result.isErr(result)).toBe(false);
      if (Result.isOk(result)) {
        expect(result.value).toBe(42);
      }
    });

    it('should create Err result', () => {
      const result = Result.Err('error');
      expect(Result.isErr(result)).toBe(true);
      expect(Result.isOk(result)).toBe(false);
      if (Result.isErr(result)) {
        expect(result.error).toBe('error');
      }
    });
  });

  describe('Type Guards', () => {
    it('should narrow Ok type', () => {
      const result: Result.Result<number, string> = Result.Ok(42);
      if (Result.isOk(result)) {
        // TypeScript should know result.value is number
        const value: number = result.value;
        expect(value).toBe(42);
      }
    });

    it('should narrow Err type', () => {
      const result: Result.Result<number, string> = Result.Err('error');
      if (Result.isErr(result)) {
        // TypeScript should know result.error is string
        const error: string = result.error;
        expect(error).toBe('error');
      }
    });
  });

  describe('map', () => {
    it('should transform Ok value', () => {
      const result = Result.Ok(5);
      const mapped = Result.map(result, x => x * 2);
      expect(Result.unwrap(mapped)).toBe(10);
    });

    it('should not transform Err', () => {
      const result = Result.Err<number, string>('error');
      const mapped = Result.map(result, x => x * 2);
      expect(Result.isErr(mapped)).toBe(true);
      if (Result.isErr(mapped)) {
        expect(mapped.error).toBe('error');
      }
    });
  });

  describe('flatMap', () => {
    it('should chain Ok results', () => {
      const result = Result.Ok(5);
      const chained = Result.flatMap(result, x => Result.Ok(x * 2));
      expect(Result.unwrap(chained)).toBe(10);
    });

    it('should short-circuit on Err', () => {
      const result = Result.Err<number, string>('error');
      const chained = Result.flatMap(result, x => Result.Ok(x * 2));
      expect(Result.isErr(chained)).toBe(true);
    });

    it('should propagate inner Err', () => {
      const result = Result.Ok(5);
      const chained = Result.flatMap(result, _x => Result.Err('inner error'));
      expect(Result.isErr(chained)).toBe(true);
      if (Result.isErr(chained)) {
        expect(chained.error).toBe('inner error');
      }
    });
  });

  describe('mapErr', () => {
    it('should transform Err value', () => {
      const result = Result.Err<number, string>('error');
      const mapped = Result.mapErr(result, e => e.toUpperCase());
      expect(Result.isErr(mapped)).toBe(true);
      if (Result.isErr(mapped)) {
        expect(mapped.error).toBe('ERROR');
      }
    });

    it('should not transform Ok', () => {
      const result = Result.Ok<number, string>(42);
      const mapped = Result.mapErr(result, e => e.toUpperCase());
      expect(Result.unwrap(mapped)).toBe(42);
    });
  });

  describe('unwrapOr', () => {
    it('should return Ok value', () => {
      const result = Result.Ok(42);
      expect(Result.unwrapOr(result, 0)).toBe(42);
    });

    it('should return default for Err', () => {
      const result = Result.Err<number, string>('error');
      expect(Result.unwrapOr(result, 0)).toBe(0);
    });
  });

  describe('unwrapOrElse', () => {
    it('should return Ok value', () => {
      const result = Result.Ok(42);
      expect(Result.unwrapOrElse(result, () => 0)).toBe(42);
    });

    it('should compute default for Err', () => {
      const result = Result.Err<number, string>('error');
      expect(Result.unwrapOrElse(result, e => e.length)).toBe(5);
    });
  });

  describe('unwrap', () => {
    it('should return Ok value', () => {
      const result = Result.Ok(42);
      expect(Result.unwrap(result)).toBe(42);
    });

    it('should throw on Err', () => {
      const result = Result.Err('error');
      expect(() => Result.unwrap(result)).toThrow();
    });
  });

  describe('fold', () => {
    it('should call onOk for Ok result', () => {
      const result = Result.Ok(42);
      const value = Result.fold(
        result,
        x => x * 2,
        _e => 0
      );
      expect(value).toBe(84);
    });

    it('should call onErr for Err result', () => {
      const result = Result.Err<number, string>('error');
      const value = Result.fold(
        result,
        x => x * 2,
        e => e.length
      );
      expect(value).toBe(5);
    });
  });

  describe('tap', () => {
    it('should execute side effect for Ok', () => {
      let sideEffect = 0;
      const result = Result.Ok(42);
      const tapped = Result.tap(result, x => { sideEffect = x; });
      expect(sideEffect).toBe(42);
      expect(Result.unwrap(tapped)).toBe(42);
    });

    it('should not execute side effect for Err', () => {
      let sideEffect = 0;
      const result = Result.Err<number, string>('error');
      Result.tap(result, x => { sideEffect = x; });
      expect(sideEffect).toBe(0);
    });
  });

  describe('tapErr', () => {
    it('should execute side effect for Err', () => {
      let sideEffect = '';
      const result = Result.Err<number, string>('error');
      const tapped = Result.tapErr(result, e => { sideEffect = e; });
      expect(sideEffect).toBe('error');
      expect(Result.isErr(tapped)).toBe(true);
    });

    it('should not execute side effect for Ok', () => {
      let sideEffect = '';
      const result = Result.Ok<number, string>(42);
      Result.tapErr(result, e => { sideEffect = e; });
      expect(sideEffect).toBe('');
    });
  });

  describe('Async Operations', () => {
    it('should map async Ok value', async () => {
      const result = Result.Ok(5);
      const mapped = await Result.mapAsync(result, async x => x * 2);
      expect(Result.unwrap(mapped)).toBe(10);
    });

    it('should not transform async Err', async () => {
      const result = Result.Err<number, string>('error');
      const mapped = await Result.mapAsync(result, async x => x * 2);
      expect(Result.isErr(mapped)).toBe(true);
    });

    it('should flatMap async Ok value', async () => {
      const result = Result.Ok(5);
      const chained = await Result.flatMapAsync(result, async x => Result.Ok(x * 2));
      expect(Result.unwrap(chained)).toBe(10);
    });

    it('should handle Promise resolution', async () => {
      const promise = Promise.resolve(42);
      const result = await Result.fromPromise(promise);
      expect(Result.unwrap(result)).toBe(42);
    });

    it('should handle Promise rejection', async () => {
      const promise = Promise.reject(new Error('failed'));
      const result = await Result.fromPromise<number, Error>(promise);
      expect(Result.isErr(result)).toBe(true);
    });
  });

  describe('tryCatch', () => {
    it('should wrap successful function', () => {
      const result = Result.tryCatch(() => 42);
      expect(Result.unwrap(result)).toBe(42);
    });

    it('should catch thrown error', () => {
      const result = Result.tryCatch(() => {
        throw new Error('failed');
      });
      expect(Result.isErr(result)).toBe(true);
    });
  });

  describe('tryCatchAsync', () => {
    it('should wrap successful async function', async () => {
      const result = await Result.tryCatchAsync(async () => 42);
      expect(Result.unwrap(result)).toBe(42);
    });

    it('should catch async error', async () => {
      const result = await Result.tryCatchAsync(async () => {
        throw new Error('failed');
      });
      expect(Result.isErr(result)).toBe(true);
    });
  });

  describe('Combinators', () => {
    describe('and', () => {
      it('should combine two Ok results', () => {
        const result = Result.and(Result.Ok(1), Result.Ok(2));
        expect(Result.unwrap(result)).toEqual([1, 2]);
      });

      it('should return first Err', () => {
        const result = Result.and(
          Result.Err<number, string>('error1'),
          Result.Ok(2)
        );
        expect(Result.isErr(result)).toBe(true);
        if (Result.isErr(result)) {
          expect(result.error).toBe('error1');
        }
      });

      it('should return second Err if first is Ok', () => {
        const result = Result.and(
          Result.Ok(1),
          Result.Err<number, string>('error2')
        );
        expect(Result.isErr(result)).toBe(true);
        if (Result.isErr(result)) {
          expect(result.error).toBe('error2');
        }
      });
    });

    describe('all', () => {
      it('should combine all Ok results', () => {
        const results = [Result.Ok(1), Result.Ok(2), Result.Ok(3)];
        const combined = Result.all(results);
        expect(Result.unwrap(combined)).toEqual([1, 2, 3]);
      });

      it('should return first Err', () => {
        const results = [
          Result.Ok(1),
          Result.Err<number, string>('error'),
          Result.Ok(3)
        ];
        const combined = Result.all(results);
        expect(Result.isErr(combined)).toBe(true);
        if (Result.isErr(combined)) {
          expect(combined.error).toBe('error');
        }
      });

      it('should handle empty array', () => {
        const results: Result.Result<number, string>[] = [];
        const combined = Result.all(results);
        expect(Result.unwrap(combined)).toEqual([]);
      });
    });

    describe('or', () => {
      it('should return first Ok', () => {
        const result = Result.or(Result.Ok(1), Result.Ok(2));
        expect(Result.unwrap(result)).toBe(1);
      });

      it('should return second if first is Err', () => {
        const result = Result.or(
          Result.Err<number, string>('error'),
          Result.Ok(2)
        );
        expect(Result.unwrap(result)).toBe(2);
      });

      it('should return second Err if both are Err', () => {
        const result = Result.or(
          Result.Err<number, string>('error1'),
          Result.Err<number, string>('error2')
        );
        expect(Result.isErr(result)).toBe(true);
        if (Result.isErr(result)) {
          expect(result.error).toBe('error2');
        }
      });
    });
  });

  describe('Conversions', () => {
    describe('toNullable', () => {
      it('should convert Ok to value', () => {
        const result = Result.Ok(42);
        expect(Result.toNullable(result)).toBe(42);
      });

      it('should convert Err to null', () => {
        const result = Result.Err('error');
        expect(Result.toNullable(result)).toBeNull();
      });
    });

    describe('toUndefined', () => {
      it('should convert Ok to value', () => {
        const result = Result.Ok(42);
        expect(Result.toUndefined(result)).toBe(42);
      });

      it('should convert Err to undefined', () => {
        const result = Result.Err('error');
        expect(Result.toUndefined(result)).toBeUndefined();
      });
    });

    describe('fromNullable', () => {
      it('should convert value to Ok', () => {
        const result = Result.fromNullable(42, 'error');
        expect(Result.unwrap(result)).toBe(42);
      });

      it('should convert null to Err', () => {
        const result = Result.fromNullable(null, 'error');
        expect(Result.isErr(result)).toBe(true);
        if (Result.isErr(result)) {
          expect(result.error).toBe('error');
        }
      });

      it('should convert undefined to Err', () => {
        const result = Result.fromNullable(undefined, 'error');
        expect(Result.isErr(result)).toBe(true);
      });
    });
  });

  describe('Railway Oriented Programming', () => {
    // Simulate a multi-step process using railway pattern
    const divide = (a: number, b: number): Result.Result<number, string> =>
      b === 0 ? Result.Err('Division by zero') : Result.Ok(a / b);

    const doubleValue = (x: number): Result.Result<number, string> =>
      Result.Ok(x * 2);

    const ensurePositive = (x: number): Result.Result<number, string> =>
      x > 0 ? Result.Ok(x) : Result.Err('Value must be positive');

    it('should chain successful operations', () => {
      const result = Result.flatMap(
        Result.flatMap(divide(10, 2), doubleValue),
        ensurePositive
      );
      expect(Result.unwrap(result)).toBe(10);
    });

    it('should short-circuit on first error', () => {
      const result = Result.flatMap(
        Result.flatMap(divide(10, 0), doubleValue),
        ensurePositive
      );
      expect(Result.isErr(result)).toBe(true);
      if (Result.isErr(result)) {
        expect(result.error).toBe('Division by zero');
      }
    });

    it('should catch error in middle of chain', () => {
      const result = Result.flatMap(
        Result.flatMap(divide(10, -2), doubleValue),
        ensurePositive
      );
      expect(Result.isErr(result)).toBe(true);
      if (Result.isErr(result)) {
        expect(result.error).toBe('Value must be positive');
      }
    });
  });
});

