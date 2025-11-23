/**
 * Tests for Either<L, R> type
 */

import { describe, it, expect } from 'vitest';
import * as Either from '../either';

describe('Either Type', () => {
  describe('Constructors', () => {
    it('should create Left', () => {
      const either = Either.Left('error');
      expect(Either.isLeft(either)).toBe(true);
      expect(Either.isRight(either)).toBe(false);
      if (Either.isLeft(either)) {
        expect(either.value).toBe('error');
      }
    });

    it('should create Right', () => {
      const either = Either.Right(42);
      expect(Either.isRight(either)).toBe(true);
      expect(Either.isLeft(either)).toBe(false);
      if (Either.isRight(either)) {
        expect(either.value).toBe(42);
      }
    });
  });

  describe('Type Guards', () => {
    it('should narrow Left type', () => {
      const either: Either.Either<string, number> = Either.Left('error');
      if (Either.isLeft(either)) {
        const value: string = either.value;
        expect(value).toBe('error');
      }
    });

    it('should narrow Right type', () => {
      const either: Either.Either<string, number> = Either.Right(42);
      if (Either.isRight(either)) {
        const value: number = either.value;
        expect(value).toBe(42);
      }
    });
  });

  describe('map', () => {
    it('should transform Right value', () => {
      const either = Either.Right(5);
      const mapped = Either.map(either, x => x * 2);
      expect(Either.getOrElse(mapped, 0)).toBe(10);
    });

    it('should not transform Left', () => {
      const either = Either.Left<string, number>('error');
      const mapped = Either.map(either, x => x * 2);
      expect(Either.isLeft(mapped)).toBe(true);
      if (Either.isLeft(mapped)) {
        expect(mapped.value).toBe('error');
      }
    });
  });

  describe('mapLeft', () => {
    it('should transform Left value', () => {
      const either = Either.Left<string, number>('error');
      const mapped = Either.mapLeft(either, e => e.toUpperCase());
      expect(Either.isLeft(mapped)).toBe(true);
      if (Either.isLeft(mapped)) {
        expect(mapped.value).toBe('ERROR');
      }
    });

    it('should not transform Right', () => {
      const either = Either.Right<string, number>(42);
      const mapped = Either.mapLeft(either, e => e.toUpperCase());
      expect(Either.getOrElse(mapped, 0)).toBe(42);
    });
  });

  describe('bimap', () => {
    it('should transform Left', () => {
      const either = Either.Left<string, number>('error');
      const mapped = Either.bimap(
        either,
        e => e.toUpperCase(),
        x => x * 2
      );
      expect(Either.isLeft(mapped)).toBe(true);
      if (Either.isLeft(mapped)) {
        expect(mapped.value).toBe('ERROR');
      }
    });

    it('should transform Right', () => {
      const either = Either.Right<string, number>(5);
      const mapped = Either.bimap(
        either,
        e => e.toUpperCase(),
        x => x * 2
      );
      expect(Either.getOrElse(mapped, 0)).toBe(10);
    });
  });

  describe('flatMap', () => {
    it('should chain Right values', () => {
      const either = Either.Right(5);
      const chained = Either.flatMap(either, x => Either.Right(x * 2));
      expect(Either.getOrElse(chained, 0)).toBe(10);
    });

    it('should short-circuit on Left', () => {
      const either = Either.Left<string, number>('error');
      const chained = Either.flatMap(either, x => Either.Right(x * 2));
      expect(Either.isLeft(chained)).toBe(true);
    });

    it('should propagate inner Left', () => {
      const either = Either.Right(5);
      const chained = Either.flatMap(either, _x => Either.Left('inner error'));
      expect(Either.isLeft(chained)).toBe(true);
      if (Either.isLeft(chained)) {
        expect(chained.value).toBe('inner error');
      }
    });
  });

  describe('fold', () => {
    it('should call onLeft for Left', () => {
      const either = Either.Left<string, number>('error');
      const value = Either.fold(
        either,
        e => e.length,
        x => x * 2
      );
      expect(value).toBe(5);
    });

    it('should call onRight for Right', () => {
      const either = Either.Right<string, number>(42);
      const value = Either.fold(
        either,
        e => e.length,
        x => x * 2
      );
      expect(value).toBe(84);
    });
  });

  describe('getOrElse', () => {
    it('should return Right value', () => {
      const either = Either.Right(42);
      expect(Either.getOrElse(either, 0)).toBe(42);
    });

    it('should return default for Left', () => {
      const either = Either.Left<string, number>('error');
      expect(Either.getOrElse(either, 0)).toBe(0);
    });
  });

  describe('getOrElseL', () => {
    it('should return Right value', () => {
      const either = Either.Right(42);
      expect(Either.getOrElseL(either, () => 0)).toBe(42);
    });

    it('should compute default for Left', () => {
      const either = Either.Left<string, number>('error');
      expect(Either.getOrElseL(either, e => e.length)).toBe(5);
    });
  });

  describe('swap', () => {
    it('should swap Left to Right', () => {
      const either = Either.Left<string, number>('error');
      const swapped = Either.swap(either);
      expect(Either.isRight(swapped)).toBe(true);
      if (Either.isRight(swapped)) {
        expect(swapped.value).toBe('error');
      }
    });

    it('should swap Right to Left', () => {
      const either = Either.Right<string, number>(42);
      const swapped = Either.swap(either);
      expect(Either.isLeft(swapped)).toBe(true);
      if (Either.isLeft(swapped)) {
        expect(swapped.value).toBe(42);
      }
    });
  });

  describe('tap', () => {
    it('should execute side effect for Right', () => {
      let sideEffect = 0;
      const either = Either.Right(42);
      const tapped = Either.tap(either, x => { sideEffect = x; });
      expect(sideEffect).toBe(42);
      expect(Either.getOrElse(tapped, 0)).toBe(42);
    });

    it('should not execute side effect for Left', () => {
      let sideEffect = 0;
      const either = Either.Left<string, number>('error');
      Either.tap(either, x => { sideEffect = x; });
      expect(sideEffect).toBe(0);
    });
  });

  describe('tapLeft', () => {
    it('should execute side effect for Left', () => {
      let sideEffect = '';
      const either = Either.Left<string, number>('error');
      const tapped = Either.tapLeft(either, e => { sideEffect = e; });
      expect(sideEffect).toBe('error');
      expect(Either.isLeft(tapped)).toBe(true);
    });

    it('should not execute side effect for Right', () => {
      let sideEffect = '';
      const either = Either.Right<string, number>(42);
      Either.tapLeft(either, e => { sideEffect = e; });
      expect(sideEffect).toBe('');
    });
  });

  describe('Async Operations', () => {
    it('should map async Right value', async () => {
      const either = Either.Right(5);
      const mapped = await Either.mapAsync(either, async x => x * 2);
      expect(Either.getOrElse(mapped, 0)).toBe(10);
    });

    it('should not transform async Left', async () => {
      const either = Either.Left<string, number>('error');
      const mapped = await Either.mapAsync(either, async x => x * 2);
      expect(Either.isLeft(mapped)).toBe(true);
    });

    it('should flatMap async Right value', async () => {
      const either = Either.Right(5);
      const chained = await Either.flatMapAsync(either, async x => Either.Right(x * 2));
      expect(Either.getOrElse(chained, 0)).toBe(10);
    });

    it('should bimap async values', async () => {
      const leftEither = Either.Left<string, number>('error');
      const mappedLeft = await Either.bimapAsync(
        leftEither,
        async e => e.toUpperCase(),
        async x => x * 2
      );
      expect(Either.isLeft(mappedLeft)).toBe(true);
      if (Either.isLeft(mappedLeft)) {
        expect(mappedLeft.value).toBe('ERROR');
      }

      const rightEither = Either.Right<string, number>(5);
      const mappedRight = await Either.bimapAsync(
        rightEither,
        async e => e.toUpperCase(),
        async x => x * 2
      );
      expect(Either.getOrElse(mappedRight, 0)).toBe(10);
    });
  });

  describe('Conversions', () => {
    describe('toNullable', () => {
      it('should convert Right to value', () => {
        const either = Either.Right(42);
        expect(Either.toNullable(either)).toBe(42);
      });

      it('should convert Left to null', () => {
        const either = Either.Left('error');
        expect(Either.toNullable(either)).toBeNull();
      });
    });

    describe('toUndefined', () => {
      it('should convert Right to value', () => {
        const either = Either.Right(42);
        expect(Either.toUndefined(either)).toBe(42);
      });

      it('should convert Left to undefined', () => {
        const either = Either.Left('error');
        expect(Either.toUndefined(either)).toBeUndefined();
      });
    });

    describe('fromNullable', () => {
      it('should convert value to Right', () => {
        const either = Either.fromNullable(42, 'error');
        expect(Either.getOrElse(either, 0)).toBe(42);
      });

      it('should convert null to Left', () => {
        const either = Either.fromNullable(null, 'error');
        expect(Either.isLeft(either)).toBe(true);
        if (Either.isLeft(either)) {
          expect(either.value).toBe('error');
        }
      });

      it('should convert undefined to Left', () => {
        const either = Either.fromNullable(undefined, 'error');
        expect(Either.isLeft(either)).toBe(true);
      });
    });

    describe('tryCatch', () => {
      it('should wrap successful function', () => {
        const either = Either.tryCatch(() => 42, e => String(e));
        expect(Either.getOrElse(either, 0)).toBe(42);
      });

      it('should catch thrown error', () => {
        const either = Either.tryCatch(
          () => { throw new Error('failed'); },
          e => (e as Error).message
        );
        expect(Either.isLeft(either)).toBe(true);
        if (Either.isLeft(either)) {
          expect(either.value).toBe('failed');
        }
      });
    });

    describe('tryCatchAsync', () => {
      it('should wrap successful async function', async () => {
        const either = await Either.tryCatchAsync(async () => 42, e => String(e));
        expect(Either.getOrElse(either, 0)).toBe(42);
      });

      it('should catch async error', async () => {
        const either = await Either.tryCatchAsync(
          async () => { throw new Error('failed'); },
          e => (e as Error).message
        );
        expect(Either.isLeft(either)).toBe(true);
        if (Either.isLeft(either)) {
          expect(either.value).toBe('failed');
        }
      });
    });
  });

  describe('Combinators', () => {
    describe('all', () => {
      it('should combine all Right values', () => {
        const eithers = [Either.Right(1), Either.Right(2), Either.Right(3)];
        const combined = Either.all(eithers);
        expect(Either.getOrElse(combined, [])).toEqual([1, 2, 3]);
      });

      it('should return first Left', () => {
        const eithers = [
          Either.Right(1),
          Either.Left<string, number>('error'),
          Either.Right(3)
        ];
        const combined = Either.all(eithers);
        expect(Either.isLeft(combined)).toBe(true);
        if (Either.isLeft(combined)) {
          expect(combined.value).toBe('error');
        }
      });

      it('should handle empty array', () => {
        const eithers: Either.Either<string, number>[] = [];
        const combined = Either.all(eithers);
        expect(Either.getOrElse(combined, [])).toEqual([]);
      });
    });

    describe('ap', () => {
      it('should apply function to value when both Right', () => {
        const eitherFn = Either.Right<string, (x: number) => number>(x => x * 2);
        const either = Either.Right<string, number>(5);
        const result = Either.ap(eitherFn, either);
        expect(Either.getOrElse(result, 0)).toBe(10);
      });

      it('should return Left when function is Left', () => {
        const eitherFn = Either.Left<string, (x: number) => number>('error');
        const either = Either.Right<string, number>(5);
        const result = Either.ap(eitherFn, either);
        expect(Either.isLeft(result)).toBe(true);
      });

      it('should return Left when value is Left', () => {
        const eitherFn = Either.Right<string, (x: number) => number>(x => x * 2);
        const either = Either.Left<string, number>('error');
        const result = Either.ap(eitherFn, either);
        expect(Either.isLeft(result)).toBe(true);
      });
    });
  });

  describe('Practical Examples', () => {
    // Parse JSON with Either
    const parseJSON = <T>(json: string): Either.Either<string, T> =>
      Either.tryCatch(
        () => JSON.parse(json) as T,
        e => `JSON parse error: ${(e as Error).message}`
      );

    it('should parse valid JSON', () => {
      const either = parseJSON<{ name: string }>('{"name":"Alice"}');
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.value.name).toBe('Alice');
      }
    });

    it('should handle invalid JSON', () => {
      const either = parseJSON('{invalid}');
      expect(Either.isLeft(either)).toBe(true);
    });

    // Validation pipeline
    const validateAge = (age: number): Either.Either<string, number> =>
      age >= 0 && age <= 120
        ? Either.Right(age)
        : Either.Left('Age must be between 0 and 120');

    const validateName = (name: string): Either.Either<string, string> =>
      name.length > 0
        ? Either.Right(name)
        : Either.Left('Name cannot be empty');

    it('should validate data pipeline', () => {
      const ageResult = validateAge(25);
      const nameResult = validateName('Alice');
      
      expect(Either.isRight(ageResult)).toBe(true);
      expect(Either.isRight(nameResult)).toBe(true);
    });

    it('should catch validation errors', () => {
      const ageResult = validateAge(150);
      const nameResult = validateName('');
      
      expect(Either.isLeft(ageResult)).toBe(true);
      expect(Either.isLeft(nameResult)).toBe(true);
    });
  });
});

