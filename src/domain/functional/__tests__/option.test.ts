/**
 * Tests for Option<T> type
 */

import { describe, it, expect } from 'vitest';
import * as Option from '../option';

describe('Option Type', () => {
  describe('Constructors', () => {
    it('should create Some', () => {
      const option = Option.Some(42);
      expect(Option.isSome(option)).toBe(true);
      expect(Option.isNone(option)).toBe(false);
      if (Option.isSome(option)) {
        expect(option.value).toBe(42);
      }
    });

    it('should create None', () => {
      const option = Option.None();
      expect(Option.isNone(option)).toBe(true);
      expect(Option.isSome(option)).toBe(false);
    });
  });

  describe('Type Guards', () => {
    it('should narrow Some type', () => {
      const option: Option.Option<number> = Option.Some(42);
      if (Option.isSome(option)) {
        const value: number = option.value;
        expect(value).toBe(42);
      }
    });

    it('should narrow None type', () => {
      const option: Option.Option<number> = Option.None();
      if (Option.isNone(option)) {
        // Type narrowing confirms this is None
        expect(option.tag).toBe('none');
      }
    });
  });

  describe('map', () => {
    it('should transform Some value', () => {
      const option = Option.Some(5);
      const mapped = Option.map(option, x => x * 2);
      expect(Option.unwrap(mapped)).toBe(10);
    });

    it('should not transform None', () => {
      const option = Option.None<number>();
      const mapped = Option.map(option, x => x * 2);
      expect(Option.isNone(mapped)).toBe(true);
    });
  });

  describe('flatMap', () => {
    it('should chain Some values', () => {
      const option = Option.Some(5);
      const chained = Option.flatMap(option, x => Option.Some(x * 2));
      expect(Option.unwrap(chained)).toBe(10);
    });

    it('should short-circuit on None', () => {
      const option = Option.None<number>();
      const chained = Option.flatMap(option, x => Option.Some(x * 2));
      expect(Option.isNone(chained)).toBe(true);
    });

    it('should propagate inner None', () => {
      const option = Option.Some(5);
      const chained = Option.flatMap(option, _x => Option.None());
      expect(Option.isNone(chained)).toBe(true);
    });
  });

  describe('filter', () => {
    it('should keep Some if predicate passes', () => {
      const option = Option.Some(5);
      const filtered = Option.filter(option, x => x > 0);
      expect(Option.unwrap(filtered)).toBe(5);
    });

    it('should convert to None if predicate fails', () => {
      const option = Option.Some(5);
      const filtered = Option.filter(option, x => x > 10);
      expect(Option.isNone(filtered)).toBe(true);
    });

    it('should keep None as None', () => {
      const option = Option.None<number>();
      const filtered = Option.filter(option, x => x > 0);
      expect(Option.isNone(filtered)).toBe(true);
    });
  });

  describe('getOrElse', () => {
    it('should return Some value', () => {
      const option = Option.Some(42);
      expect(Option.getOrElse(option, 0)).toBe(42);
    });

    it('should return default for None', () => {
      const option = Option.None<number>();
      expect(Option.getOrElse(option, 0)).toBe(0);
    });
  });

  describe('getOrElseL', () => {
    it('should return Some value', () => {
      const option = Option.Some(42);
      expect(Option.getOrElseL(option, () => 0)).toBe(42);
    });

    it('should compute default for None', () => {
      const option = Option.None<number>();
      let computed = false;
      const value = Option.getOrElseL(option, () => {
        computed = true;
        return 0;
      });
      expect(value).toBe(0);
      expect(computed).toBe(true);
    });
  });

  describe('unwrap', () => {
    it('should return Some value', () => {
      const option = Option.Some(42);
      expect(Option.unwrap(option)).toBe(42);
    });

    it('should throw on None', () => {
      const option = Option.None();
      expect(() => Option.unwrap(option)).toThrow('Called unwrap on None');
    });
  });

  describe('expect', () => {
    it('should return Some value', () => {
      const option = Option.Some(42);
      expect(Option.expect(option, 'Should have value')).toBe(42);
    });

    it('should throw custom message on None', () => {
      const option = Option.None();
      expect(() => Option.expect(option, 'Custom error')).toThrow('Custom error');
    });
  });

  describe('fold', () => {
    it('should call onSome for Some', () => {
      const option = Option.Some(42);
      const value = Option.fold(
        option,
        () => 0,
        x => x * 2
      );
      expect(value).toBe(84);
    });

    it('should call onNone for None', () => {
      const option = Option.None<number>();
      const value = Option.fold(
        option,
        () => 0,
        x => x * 2
      );
      expect(value).toBe(0);
    });
  });

  describe('tap', () => {
    it('should execute side effect for Some', () => {
      let sideEffect = 0;
      const option = Option.Some(42);
      const tapped = Option.tap(option, x => { sideEffect = x; });
      expect(sideEffect).toBe(42);
      expect(Option.unwrap(tapped)).toBe(42);
    });

    it('should not execute side effect for None', () => {
      let sideEffect = 0;
      const option = Option.None<number>();
      Option.tap(option, x => { sideEffect = x; });
      expect(sideEffect).toBe(0);
    });
  });

  describe('tapNone', () => {
    it('should execute side effect for None', () => {
      let sideEffect = false;
      const option = Option.None();
      const tapped = Option.tapNone(option, () => { sideEffect = true; });
      expect(sideEffect).toBe(true);
      expect(Option.isNone(tapped)).toBe(true);
    });

    it('should not execute side effect for Some', () => {
      let sideEffect = false;
      const option = Option.Some(42);
      Option.tapNone(option, () => { sideEffect = true; });
      expect(sideEffect).toBe(false);
    });
  });

  describe('Async Operations', () => {
    it('should map async Some value', async () => {
      const option = Option.Some(5);
      const mapped = await Option.mapAsync(option, async x => x * 2);
      expect(Option.unwrap(mapped)).toBe(10);
    });

    it('should not transform async None', async () => {
      const option = Option.None<number>();
      const mapped = await Option.mapAsync(option, async x => x * 2);
      expect(Option.isNone(mapped)).toBe(true);
    });

    it('should flatMap async Some value', async () => {
      const option = Option.Some(5);
      const chained = await Option.flatMapAsync(option, async x => Option.Some(x * 2));
      expect(Option.unwrap(chained)).toBe(10);
    });
  });

  describe('Conversions', () => {
    describe('fromNullable', () => {
      it('should convert value to Some', () => {
        const option = Option.fromNullable(42);
        expect(Option.unwrap(option)).toBe(42);
      });

      it('should convert null to None', () => {
        const option = Option.fromNullable(null);
        expect(Option.isNone(option)).toBe(true);
      });

      it('should convert undefined to None', () => {
        const option = Option.fromNullable(undefined);
        expect(Option.isNone(option)).toBe(true);
      });

      it('should handle zero as Some', () => {
        const option = Option.fromNullable(0);
        expect(Option.unwrap(option)).toBe(0);
      });

      it('should handle empty string as Some', () => {
        const option = Option.fromNullable('');
        expect(Option.unwrap(option)).toBe('');
      });
    });

    describe('toNullable', () => {
      it('should convert Some to value', () => {
        const option = Option.Some(42);
        expect(Option.toNullable(option)).toBe(42);
      });

      it('should convert None to null', () => {
        const option = Option.None();
        expect(Option.toNullable(option)).toBeNull();
      });
    });

    describe('toUndefined', () => {
      it('should convert Some to value', () => {
        const option = Option.Some(42);
        expect(Option.toUndefined(option)).toBe(42);
      });

      it('should convert None to undefined', () => {
        const option = Option.None();
        expect(Option.toUndefined(option)).toBeUndefined();
      });
    });

    describe('fromPredicate', () => {
      it('should create Some if predicate passes', () => {
        const option = Option.fromPredicate(5, x => x > 0);
        expect(Option.unwrap(option)).toBe(5);
      });

      it('should create None if predicate fails', () => {
        const option = Option.fromPredicate(5, x => x > 10);
        expect(Option.isNone(option)).toBe(true);
      });
    });

    describe('tryCatch', () => {
      it('should wrap successful function', () => {
        const option = Option.tryCatch(() => 42);
        expect(Option.unwrap(option)).toBe(42);
      });

      it('should catch thrown error', () => {
        const option = Option.tryCatch(() => {
          throw new Error('failed');
        });
        expect(Option.isNone(option)).toBe(true);
      });
    });

    describe('tryCatchAsync', () => {
      it('should wrap successful async function', async () => {
        const option = await Option.tryCatchAsync(async () => 42);
        expect(Option.unwrap(option)).toBe(42);
      });

      it('should catch async error', async () => {
        const option = await Option.tryCatchAsync(async () => {
          throw new Error('failed');
        });
        expect(Option.isNone(option)).toBe(true);
      });
    });
  });

  describe('Combinators', () => {
    describe('and', () => {
      it('should combine two Some values', () => {
        const result = Option.and(Option.Some(1), Option.Some(2));
        expect(Option.unwrap(result)).toEqual([1, 2]);
      });

      it('should return None if first is None', () => {
        const result = Option.and(Option.None<number>(), Option.Some(2));
        expect(Option.isNone(result)).toBe(true);
      });

      it('should return None if second is None', () => {
        const result = Option.and(Option.Some(1), Option.None<number>());
        expect(Option.isNone(result)).toBe(true);
      });
    });

    describe('all', () => {
      it('should combine all Some values', () => {
        const options = [Option.Some(1), Option.Some(2), Option.Some(3)];
        const combined = Option.all(options);
        expect(Option.unwrap(combined)).toEqual([1, 2, 3]);
      });

      it('should return None if any is None', () => {
        const options = [Option.Some(1), Option.None<number>(), Option.Some(3)];
        const combined = Option.all(options);
        expect(Option.isNone(combined)).toBe(true);
      });

      it('should handle empty array', () => {
        const options: Option.Option<number>[] = [];
        const combined = Option.all(options);
        expect(Option.unwrap(combined)).toEqual([]);
      });
    });

    describe('or', () => {
      it('should return first Some', () => {
        const result = Option.or(Option.Some(1), Option.Some(2));
        expect(Option.unwrap(result)).toBe(1);
      });

      it('should return second if first is None', () => {
        const result = Option.or(Option.None<number>(), Option.Some(2));
        expect(Option.unwrap(result)).toBe(2);
      });

      it('should return None if both are None', () => {
        const result = Option.or(Option.None<number>(), Option.None<number>());
        expect(Option.isNone(result)).toBe(true);
      });
    });

    describe('firstSome', () => {
      it('should return first Some value', () => {
        const options = [Option.None<number>(), Option.Some(2), Option.Some(3)];
        const result = Option.firstSome(options);
        expect(Option.unwrap(result)).toBe(2);
      });

      it('should return None if all are None', () => {
        const options = [Option.None<number>(), Option.None<number>()];
        const result = Option.firstSome(options);
        expect(Option.isNone(result)).toBe(true);
      });

      it('should handle empty array', () => {
        const options: Option.Option<number>[] = [];
        const result = Option.firstSome(options);
        expect(Option.isNone(result)).toBe(true);
      });
    });

    describe('ap', () => {
      it('should apply function to value when both Some', () => {
        const optionFn = Option.Some((x: number) => x * 2);
        const option = Option.Some(5);
        const result = Option.ap(optionFn, option);
        expect(Option.unwrap(result)).toBe(10);
      });

      it('should return None when function is None', () => {
        const optionFn = Option.None<(x: number) => number>();
        const option = Option.Some(5);
        const result = Option.ap(optionFn, option);
        expect(Option.isNone(result)).toBe(true);
      });

      it('should return None when value is None', () => {
        const optionFn = Option.Some((x: number) => x * 2);
        const option = Option.None<number>();
        const result = Option.ap(optionFn, option);
        expect(Option.isNone(result)).toBe(true);
      });
    });

    describe('flatten', () => {
      it('should flatten Some(Some(value))', () => {
        const nested = Option.Some(Option.Some(42));
        const flattened = Option.flatten(nested);
        expect(Option.unwrap(flattened)).toBe(42);
      });

      it('should flatten Some(None)', () => {
        const nested = Option.Some(Option.None<number>());
        const flattened = Option.flatten(nested);
        expect(Option.isNone(flattened)).toBe(true);
      });

      it('should flatten None', () => {
        const nested = Option.None<Option.Option<number>>();
        const flattened = Option.flatten(nested);
        expect(Option.isNone(flattened)).toBe(true);
      });
    });

    describe('zip', () => {
      it('should zip two Some values', () => {
        const result = Option.zip(Option.Some(1), Option.Some('a'));
        expect(Option.unwrap(result)).toEqual([1, 'a']);
      });

      it('should return None if either is None', () => {
        const result = Option.zip(Option.None<number>(), Option.Some('a'));
        expect(Option.isNone(result)).toBe(true);
      });
    });

    describe('contains', () => {
      it('should return true if Some contains value', () => {
        const option = Option.Some(42);
        expect(Option.contains(option, 42)).toBe(true);
      });

      it('should return false if Some contains different value', () => {
        const option = Option.Some(42);
        expect(Option.contains(option, 43)).toBe(false);
      });

      it('should return false for None', () => {
        const option = Option.None<number>();
        expect(Option.contains(option, 42)).toBe(false);
      });
    });

    describe('exists', () => {
      it('should return true if Some satisfies predicate', () => {
        const option = Option.Some(42);
        expect(Option.exists(option, x => x > 40)).toBe(true);
      });

      it('should return false if Some does not satisfy predicate', () => {
        const option = Option.Some(42);
        expect(Option.exists(option, x => x > 50)).toBe(false);
      });

      it('should return false for None', () => {
        const option = Option.None<number>();
        expect(Option.exists(option, x => x > 40)).toBe(false);
      });
    });
  });

  describe('Practical Examples', () => {
    // Safe array access
    const safeGet = <T>(arr: T[], index: number): Option.Option<T> =>
      index >= 0 && index < arr.length ? Option.Some(arr[index]) : Option.None();

    it('should safely access array elements', () => {
      const arr = [1, 2, 3];
      expect(Option.unwrap(safeGet(arr, 0))).toBe(1);
      expect(Option.isNone(safeGet(arr, 10))).toBe(true);
      expect(Option.isNone(safeGet(arr, -1))).toBe(true);
    });

    // Safe property access
    interface User {
      name: string;
      email?: string;
    }

    const getEmail = (user: User): Option.Option<string> =>
      Option.fromNullable(user.email);

    it('should safely access optional properties', () => {
      const userWithEmail: User = { name: 'Alice', email: 'alice@example.com' };
      const userWithoutEmail: User = { name: 'Bob' };

      expect(Option.unwrap(getEmail(userWithEmail))).toBe('alice@example.com');
      expect(Option.isNone(getEmail(userWithoutEmail))).toBe(true);
    });

    // Chaining operations
    const parsePositiveInt = (s: string): Option.Option<number> => {
      const parsed = parseInt(s, 10);
      return isNaN(parsed) || parsed <= 0 ? Option.None() : Option.Some(parsed);
    };

    it('should chain operations safely', () => {
      const validResult = Option.flatMap(
        parsePositiveInt('42'),
        x => Option.Some(x * 2)
      );
      expect(Option.unwrap(validResult)).toBe(84);

      const invalidResult = Option.flatMap(
        parsePositiveInt('not a number'),
        x => Option.Some(x * 2)
      );
      expect(Option.isNone(invalidResult)).toBe(true);
    });
  });
});

