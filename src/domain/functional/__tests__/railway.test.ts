/**
 * Tests for Railway Oriented Programming utilities
 */

import { describe, it, expect, vi } from 'vitest';
import * as Result from '../result';
import * as Railway from '../railway';

describe('Railway Oriented Programming', () => {
  describe('pipe', () => {
    const double = (x: number): Result.Result<number, string> => Result.Ok(x * 2);
    const addTen = (x: number): Result.Result<number, string> => Result.Ok(x + 10);
    const failIfNegative = (x: number): Result.Result<number, string> =>
      x < 0 ? Result.Err('Value is negative') : Result.Ok(x);

    it('should compose two functions', () => {
      const pipeline = Railway.pipe(double, addTen);
      const result = pipeline(5);
      expect(Result.unwrap(result)).toBe(20);
    });

    it('should compose three functions', () => {
      const pipeline = Railway.pipe(double, addTen, double);
      const result = pipeline(5);
      expect(Result.unwrap(result)).toBe(40);
    });

    it('should short-circuit on first error', () => {
      const pipeline = Railway.pipe(failIfNegative, double, addTen);
      const result = pipeline(-5);
      expect(Result.isErr(result)).toBe(true);
      if (Result.isErr(result)) {
        expect(result.error).toBe('Value is negative');
      }
    });

    it('should stop executing after error', () => {
      let executedAfterError = false;
      const trackExecution = (x: number): Result.Result<number, string> => {
        executedAfterError = true;
        return Result.Ok(x);
      };

      const pipeline = Railway.pipe(failIfNegative, trackExecution);
      pipeline(-5);
      
      expect(executedAfterError).toBe(false);
    });
  });

  describe('pipeAsync', () => {
    const doubleAsync = async (x: number): Promise<Result.Result<number, string>> =>
      Result.Ok(x * 2);
    const addTenAsync = async (x: number): Promise<Result.Result<number, string>> =>
      Result.Ok(x + 10);
    const failIfNegativeAsync = async (x: number): Promise<Result.Result<number, string>> =>
      x < 0 ? Result.Err('Value is negative') : Result.Ok(x);

    it('should compose async functions', async () => {
      const pipeline = Railway.pipeAsync(doubleAsync, addTenAsync);
      const result = await pipeline(5);
      expect(Result.unwrap(result)).toBe(20);
    });

    it('should short-circuit on first async error', async () => {
      const pipeline = Railway.pipeAsync(failIfNegativeAsync, doubleAsync);
      const result = await pipeline(-5);
      expect(Result.isErr(result)).toBe(true);
    });
  });

  describe('lift', () => {
    it('should lift regular function to Result', () => {
      const double = (x: number) => x * 2;
      const liftedDouble = Railway.lift(double);
      
      const result = liftedDouble(5);
      expect(Result.unwrap(result)).toBe(10);
    });

    it('should work in pipe', () => {
      const double = (x: number) => x * 2;
      const liftedDouble = Railway.lift<number, number, string>(double);
      const addTen = (x: number): Result.Result<number, string> => Result.Ok(x + 10);
      
      const pipeline = Railway.pipe(liftedDouble, addTen);
      const result = pipeline(5);
      expect(Result.unwrap(result)).toBe(20);
    });
  });

  describe('liftTry', () => {
    it('should lift function that might throw', () => {
      const parseJSON = (s: string) => JSON.parse(s);
      const safeParse = Railway.liftTry(parseJSON);
      
      const goodResult = safeParse('{"key":"value"}');
      expect(Result.isOk(goodResult)).toBe(true);
      
      const badResult = safeParse('{invalid}');
      expect(Result.isErr(badResult)).toBe(true);
    });

    it('should use custom error handler', () => {
      const throwError = (_x: number) => {
        throw new Error('custom error');
      };
      const safe = Railway.liftTry(throwError, e => `Caught: ${(e as Error).message}`);
      
      const result = safe(5);
      expect(Result.isErr(result)).toBe(true);
      if (Result.isErr(result)) {
        expect(result.error).toBe('Caught: custom error');
      }
    });
  });

  describe('liftTryAsync', () => {
    it('should lift async function that might throw', async () => {
      const parseJSONAsync = async (s: string) => JSON.parse(s);
      const safeParse = Railway.liftTryAsync(parseJSONAsync);
      
      const goodResult = await safeParse('{"key":"value"}');
      expect(Result.isOk(goodResult)).toBe(true);
      
      const badResult = await safeParse('{invalid}');
      expect(Result.isErr(badResult)).toBe(true);
    });
  });

  describe('tee', () => {
    it('should execute side effect without changing result', () => {
      let sideEffect = 0;
      const pipeline = Railway.pipe(
        (x: number): Result.Result<number, string> => Result.Ok(x * 2),
        Railway.tee((x: number) => { sideEffect = x; }),
        (x: number): Result.Result<number, string> => Result.Ok(x + 10)
      );
      
      const result = pipeline(5);
      expect(sideEffect).toBe(10);
      expect(Result.unwrap(result)).toBe(20);
    });

    it('should not execute on error', () => {
      let sideEffect = 0;
      const pipeline = Railway.pipe(
        (x: number): Result.Result<number, string> => Result.Err('error'),
        Railway.tee((x: number) => { sideEffect = x; })
      );
      
      pipeline(5);
      expect(sideEffect).toBe(0);
    });
  });

  describe('teeErr', () => {
    it('should execute side effect on error', () => {
      let errorMessage = '';
      const step1 = (x: number): Result.Result<number, string> => Result.Err('failed');
      const result = step1(5);
      const tapped = Railway.tapError<number, string>((e: string) => { errorMessage = e; })(result);
      
      expect(errorMessage).toBe('failed');
      expect(Result.isErr(tapped)).toBe(true);
    });

    it('should not execute on success', () => {
      let errorMessage = '';
      const step1 = (x: number): Result.Result<number, string> => Result.Ok(x * 2);
      const result = step1(5);
      Railway.tapError<number, string>((e: string) => { errorMessage = e; })(result);
      
      expect(errorMessage).toBe('');
    });
  });

  describe('validateAll', () => {
    const isPositive = (x: number): Result.Result<number, string> =>
      x > 0 ? Result.Ok(x) : Result.Err('Must be positive');
    
    const isLessThan100 = (x: number): Result.Result<number, string> =>
      x < 100 ? Result.Ok(x) : Result.Err('Must be less than 100');
    
    const isEven = (x: number): Result.Result<number, string> =>
      x % 2 === 0 ? Result.Ok(x) : Result.Err('Must be even');

    it('should pass all validations', () => {
      const result = Railway.validateAll(10, [isPositive, isLessThan100, isEven]);
      expect(Result.isOk(result)).toBe(true);
    });

    it('should collect all errors', () => {
      const result = Railway.validateAll(-15, [isPositive, isLessThan100, isEven]);
      expect(Result.isErr(result)).toBe(true);
      if (Result.isErr(result)) {
        expect(result.error).toHaveLength(2);
        expect(result.error).toContain('Must be positive');
        expect(result.error).toContain('Must be even');
      }
    });

    it('should collect single error', () => {
      const result = Railway.validateAll(9, [isPositive, isLessThan100, isEven]);
      expect(Result.isErr(result)).toBe(true);
      if (Result.isErr(result)) {
        expect(result.error).toHaveLength(1);
        expect(result.error).toContain('Must be even');
      }
    });
  });

  describe('retry', () => {
    it('should succeed on first attempt', async () => {
      let attempts = 0;
      const fn = async (): Promise<Result.Result<number, string>> => {
        attempts++;
        return Result.Ok(42);
      };
      
      const result = await Railway.retry(fn, { maxAttempts: 3 });
      expect(Result.unwrap(result)).toBe(42);
      expect(attempts).toBe(1);
    });

    it('should retry on failure', async () => {
      let attempts = 0;
      const fn = async (): Promise<Result.Result<number, string>> => {
        attempts++;
        return attempts < 3 ? Result.Err('failed') : Result.Ok(42);
      };
      
      const result = await Railway.retry(fn, { maxAttempts: 3 });
      expect(Result.unwrap(result)).toBe(42);
      expect(attempts).toBe(3);
    });

    it('should give up after max attempts', async () => {
      let attempts = 0;
      const fn = async (): Promise<Result.Result<number, string>> => {
        attempts++;
        return Result.Err('failed');
      };
      
      const result = await Railway.retry(fn, { maxAttempts: 3 });
      expect(Result.isErr(result)).toBe(true);
      expect(attempts).toBe(3);
    });

    it('should respect shouldRetry predicate', async () => {
      let attempts = 0;
      const fn = async (): Promise<Result.Result<number, string>> => {
        attempts++;
        return Result.Err('failed');
      };
      
      const result = await Railway.retry(fn, {
        maxAttempts: 5,
        shouldRetry: (_error, attempt) => attempt < 2
      });
      
      expect(Result.isErr(result)).toBe(true);
      expect(attempts).toBe(2);
    });
  });

  describe('parallel', () => {
    it('should execute all functions in parallel', async () => {
      const fns = [
        async () => Result.Ok(1),
        async () => Result.Ok(2),
        async () => Result.Ok(3)
      ];
      
      const result = await Railway.parallel(fns);
      expect(Result.unwrap(result)).toEqual([1, 2, 3]);
    });

    it('should fail if any function fails', async () => {
      const fns = [
        async () => Result.Ok(1),
        async () => Result.Err('failed'),
        async () => Result.Ok(3)
      ];
      
      const result = await Railway.parallel(fns);
      expect(Result.isErr(result)).toBe(true);
    });
  });

  describe('parallelAll', () => {
    it('should collect all errors', async () => {
      const fns = [
        async () => Result.Err('error1'),
        async () => Result.Ok(2),
        async () => Result.Err('error2')
      ];
      
      const result = await Railway.parallelAll(fns);
      expect(Result.isErr(result)).toBe(true);
      if (Result.isErr(result)) {
        expect(result.error).toHaveLength(2);
        expect(result.error).toContain('error1');
        expect(result.error).toContain('error2');
      }
    });
  });

  describe('firstSuccess', () => {
    it('should return first successful result', async () => {
      const fns = [
        async () => Result.Err('error1'),
        async () => Result.Ok(42),
        async () => Result.Ok(100)
      ];
      
      const result = await Railway.firstSuccess(fns);
      expect(Result.unwrap(result)).toBe(42);
    });

    it('should collect all errors if all fail', async () => {
      const fns = [
        async () => Result.Err('error1'),
        async () => Result.Err('error2'),
        async () => Result.Err('error3')
      ];
      
      const result = await Railway.firstSuccess(fns);
      expect(Result.isErr(result)).toBe(true);
      if (Result.isErr(result)) {
        expect(result.error).toHaveLength(3);
      }
    });
  });

  describe('when', () => {
    const double = (x: number): Result.Result<number, string> => Result.Ok(x * 2);
    
    it('should execute if predicate passes', () => {
      const pipeline = Railway.when((x: number) => x > 0, double, 'Must be positive');
      const result = pipeline(5);
      expect(Result.unwrap(result)).toBe(10);
    });

    it('should fail if predicate fails', () => {
      const pipeline = Railway.when((x: number) => x > 0, double, 'Must be positive');
      const result = pipeline(-5);
      expect(Result.isErr(result)).toBe(true);
      if (Result.isErr(result)) {
        expect(result.error).toBe('Must be positive');
      }
    });
  });

  describe('branch', () => {
    const double = (x: number): Result.Result<number, string> => Result.Ok(x * 2);
    const negate = (x: number): Result.Result<number, string> => Result.Ok(-x);
    
    it('should execute then branch', () => {
      const pipeline = Railway.branch((x: number) => x > 0, double, negate);
      const result = pipeline(5);
      expect(Result.unwrap(result)).toBe(10);
    });

    it('should execute else branch', () => {
      const pipeline = Railway.branch((x: number) => x > 0, double, negate);
      const result = pipeline(-5);
      expect(Result.unwrap(result)).toBe(5);
    });
  });

  describe('bimap', () => {
    it('should map success value', () => {
      const mapper = Railway.bimap((x: number) => x * 2, (e: string) => e.toUpperCase());
      const result = mapper(Result.Ok(5));
      expect(Result.unwrap(result)).toBe(10);
    });

    it('should map error value', () => {
      const mapper = Railway.bimap((x: number) => x * 2, (e: string) => e.toUpperCase());
      const result = mapper(Result.Err('error'));
      expect(Result.isErr(result)).toBe(true);
      if (Result.isErr(result)) {
        expect(result.error).toBe('ERROR');
      }
    });
  });

  describe('recover', () => {
    it('should keep Ok value', () => {
      const recoverer = Railway.recover(0);
      const result = recoverer(Result.Ok(42));
      expect(Result.unwrap(result)).toBe(42);
    });

    it('should provide default for Err', () => {
      const recoverer = Railway.recover(0);
      const result = recoverer(Result.Err('error'));
      expect(Result.unwrap(result)).toBe(0);
    });
  });

  describe('recoverWith', () => {
    it('should keep Ok value', () => {
      const recoverer = Railway.recoverWith((e: string) => e.length);
      const result = recoverer(Result.Ok(42));
      expect(Result.unwrap(result)).toBe(42);
    });

    it('should compute recovery value', () => {
      const recoverer = Railway.recoverWith((e: string) => e.length);
      const result = recoverer(Result.Err('error'));
      expect(Result.unwrap(result)).toBe(5);
    });
  });

  describe('ensure', () => {
    it('should run cleanup on success', () => {
      let cleaned = false;
      const cleaner = Railway.ensure(() => { cleaned = true; });
      
      const result = cleaner(Result.Ok(42));
      expect(cleaned).toBe(true);
      expect(Result.unwrap(result)).toBe(42);
    });

    it('should run cleanup on failure', () => {
      let cleaned = false;
      const cleaner = Railway.ensure(() => { cleaned = true; });
      
      const result = cleaner(Result.Err('error'));
      expect(cleaned).toBe(true);
      expect(Result.isErr(result)).toBe(true);
    });
  });

  describe('Real-world Example: User Registration Pipeline', () => {
    interface RawUserInput {
      email: string;
      password: string;
      age: string;
    }

    interface ValidatedUser {
      email: string;
      password: string;
      age: number;
    }

    interface User {
      id: string;
      email: string;
      passwordHash: string;
      age: number;
    }

    const validateEmail = (input: RawUserInput): Result.Result<RawUserInput, string> =>
      input.email.includes('@')
        ? Result.Ok(input)
        : Result.Err('Invalid email format');

    const validatePassword = (input: RawUserInput): Result.Result<RawUserInput, string> =>
      input.password.length >= 8
        ? Result.Ok(input)
        : Result.Err('Password must be at least 8 characters');

    const parseAge = (input: RawUserInput): Result.Result<ValidatedUser, string> => {
      const age = parseInt(input.age, 10);
      if (isNaN(age) || age < 18) {
        return Result.Err('Age must be 18 or older');
      }
      return Result.Ok({ ...input, age });
    };

    const hashPassword = (user: ValidatedUser): Result.Result<User, string> =>
      Result.Ok({
        id: 'user-123',
        email: user.email,
        passwordHash: `hashed_${user.password}`,
        age: user.age
      });

    it('should successfully register valid user', () => {
      const registerUser = Railway.pipe(
        validateEmail,
        validatePassword,
        parseAge,
        hashPassword
      );

      const input: RawUserInput = {
        email: 'user@example.com',
        password: 'securepass123',
        age: '25'
      };

      const result = registerUser(input);
      expect(Result.isOk(result)).toBe(true);
      if (Result.isOk(result)) {
        expect(result.value.email).toBe('user@example.com');
        expect(result.value.passwordHash).toBe('hashed_securepass123');
        expect(result.value.age).toBe(25);
      }
    });

    it('should fail on invalid email', () => {
      const registerUser = Railway.pipe(
        validateEmail,
        validatePassword,
        parseAge,
        hashPassword
      );

      const input: RawUserInput = {
        email: 'invalid-email',
        password: 'securepass123',
        age: '25'
      };

      const result = registerUser(input);
      expect(Result.isErr(result)).toBe(true);
      if (Result.isErr(result)) {
        expect(result.error).toBe('Invalid email format');
      }
    });

    it('should fail on short password', () => {
      const registerUser = Railway.pipe(
        validateEmail,
        validatePassword,
        parseAge,
        hashPassword
      );

      const input: RawUserInput = {
        email: 'user@example.com',
        password: 'short',
        age: '25'
      };

      const result = registerUser(input);
      expect(Result.isErr(result)).toBe(true);
      if (Result.isErr(result)) {
        expect(result.error).toBe('Password must be at least 8 characters');
      }
    });

    it('should fail on invalid age', () => {
      const registerUser = Railway.pipe(
        validateEmail,
        validatePassword,
        parseAge,
        hashPassword
      );

      const input: RawUserInput = {
        email: 'user@example.com',
        password: 'securepass123',
        age: '15'
      };

      const result = registerUser(input);
      expect(Result.isErr(result)).toBe(true);
      if (Result.isErr(result)) {
        expect(result.error).toBe('Age must be 18 or older');
      }
    });
  });
});

