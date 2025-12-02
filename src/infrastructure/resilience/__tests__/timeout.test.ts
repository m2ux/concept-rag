import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { withTimeout, withTimeoutConfig, wrapWithTimeout, TIMEOUTS } from '../timeout.js';
import { TimeoutError } from '../errors.js';

describe('Timeout Utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });
  
  describe('TIMEOUTS constants', () => {
    it('should define standard timeout values', () => {
      expect(TIMEOUTS.LLM_CALL).toBe(30000);
      expect(TIMEOUTS.EMBEDDING).toBe(10000);
      expect(TIMEOUTS.SEARCH).toBe(30000);
      expect(TIMEOUTS.DATABASE).toBe(3000);
      expect(TIMEOUTS.HEALTH_CHECK).toBe(1000);
    });
  });
  
  describe('withTimeout', () => {
    it('should return operation result if it completes before timeout', async () => {
      const operation = async () => {
        return 'success';
      };
      
      const promise = withTimeout(operation, 1000, 'test_op');
      await vi.advanceTimersByTimeAsync(500);
      
      const result = await promise;
      expect(result).toBe('success');
    });
    
    it.skip('should throw TimeoutError if operation exceeds timeout', async () => {
      const operation = async () => {
        return new Promise<string>((resolve) => {
          setTimeout(() => resolve('too slow'), 2000);
        });
      };
      
      const promise = withTimeout(operation, 1000, 'slow_op');
      
      // Advance past timeout
      await vi.advanceTimersByTimeAsync(1001);
      
      await expect(promise).rejects.toThrow(TimeoutError);
      await expect(promise).rejects.toThrow(
        "Operation 'slow_op' timed out after 1000ms"
      );
    });
    
    it.skip('should include operation name and timeout in error', async () => {
      const operation = async () => {
        return new Promise<void>((resolve) => {
          setTimeout(() => resolve(), 5000);
        });
      };
      
      const promise = withTimeout(operation, 2000, 'my_operation');
      await vi.advanceTimersByTimeAsync(2001);
      
      try {
        await promise;
        expect.fail('Should have thrown TimeoutError');
      } catch (error) {
        expect(error).toBeInstanceOf(TimeoutError);
        const timeoutError = error as TimeoutError;
        expect(timeoutError.operationName).toBe('my_operation');
        expect(timeoutError.timeoutMs).toBe(2000);
        expect(timeoutError.code).toBe('RESILIENCE_TIMEOUT');
      }
    });
    
    it('should work with operations that resolve immediately', async () => {
      const operation = async () => 42;
      
      const result = await withTimeout(operation, 1000, 'instant');
      expect(result).toBe(42);
    });
    
    it('should work with operations that reject', async () => {
      const operation = async () => {
        throw new Error('operation failed');
      };
      
      await expect(
        withTimeout(operation, 1000, 'failing_op')
      ).rejects.toThrow('operation failed');
    });
    
    it.skip('should timeout even if operation never resolves', async () => {
      const operation = async () => {
        // Never resolves
        return new Promise<void>(() => {});
      };
      
      const promise = withTimeout(operation, 500, 'hung_op');
      await vi.advanceTimersByTimeAsync(501);
      
      await expect(promise).rejects.toThrow(TimeoutError);
    });
    
    it.skip('should handle zero timeout', async () => {
      const operation = async () => {
        return new Promise<string>((resolve) => {
          setTimeout(() => resolve('done'), 100);
        });
      };
      
      const promise = withTimeout(operation, 0, 'zero_timeout');
      await vi.advanceTimersByTimeAsync(1);
      
      await expect(promise).rejects.toThrow(TimeoutError);
    });
    
    it('should handle very large timeout values', async () => {
      const operation = async () => 'quick';
      
      const result = await withTimeout(
        operation,
        Number.MAX_SAFE_INTEGER,
        'large_timeout'
      );
      expect(result).toBe('quick');
    });
    
    it('should work with async operations that use real promises', async () => {
      const operation = async () => {
        return Promise.resolve('immediate');
      };
      
      const result = await withTimeout(operation, 1000, 'promise_op');
      expect(result).toBe('immediate');
    });
  });
  
  describe('wrapWithTimeout', () => {
    it('should create a wrapped function with timeout', async () => {
      const originalFn = async (x: number, y: number) => {
        return x + y;
      };
      
      const wrappedFn = wrapWithTimeout(originalFn, 1000, 'add_operation');
      
      const result = await wrappedFn(2, 3);
      expect(result).toBe(5);
    });
    
    it.skip('should timeout wrapped function if it takes too long', async () => {
      const slowFn = async (delay: number) => {
        return new Promise<string>((resolve) => {
          setTimeout(() => resolve('done'), delay);
        });
      };
      
      const wrappedFn = wrapWithTimeout(slowFn, 1000, 'slow_function');
      
      const promise = wrappedFn(2000);
      await vi.advanceTimersByTimeAsync(1001);
      
      await expect(promise).rejects.toThrow(TimeoutError);
    });
    
    it('should preserve function signature', async () => {
      const typedFn = async (name: string, age: number): Promise<string> => {
        return `${name} is ${age}`;
      };
      
      const wrapped = wrapWithTimeout(typedFn, 1000, 'format_person');
      
      const result = await wrapped('Alice', 30);
      expect(result).toBe('Alice is 30');
    });
    
    it('should work with no-argument functions', async () => {
      const noArgFn = async () => 'hello';
      
      const wrapped = wrapWithTimeout(noArgFn, 1000, 'greet');
      
      const result = await wrapped();
      expect(result).toBe('hello');
    });
    
    it('should work with multiple arguments', async () => {
      const multiArgFn = async (a: number, b: number, c: number, d: number) => {
        return a + b + c + d;
      };
      
      const wrapped = wrapWithTimeout(multiArgFn, 1000, 'sum_four');
      
      const result = await wrapped(1, 2, 3, 4);
      expect(result).toBe(10);
    });
  });
  
  describe('withTimeoutConfig', () => {
    it('should execute operation with config', async () => {
      const operation = async () => 'result';
      
      const result = await withTimeoutConfig(operation, {
        timeoutMs: 1000,
        operationName: 'config_op'
      });
      
      expect(result).toBe('result');
    });
    
    it.skip('should call onTimeout callback when timeout occurs', async () => {
      const onTimeout = vi.fn();
      
      const operation = async () => {
        return new Promise<void>((resolve) => {
          setTimeout(() => resolve(), 2000);
        });
      };
      
      const promise = withTimeoutConfig(operation, {
        timeoutMs: 1000,
        operationName: 'callback_op',
        onTimeout
      });
      
      await vi.advanceTimersByTimeAsync(1001);
      
      await expect(promise).rejects.toThrow(TimeoutError);
      expect(onTimeout).toHaveBeenCalledWith('callback_op', 1000);
      expect(onTimeout).toHaveBeenCalledTimes(1);
    });
    
    it('should not call onTimeout if operation succeeds', async () => {
      const onTimeout = vi.fn();
      
      const operation = async () => 'success';
      
      await withTimeoutConfig(operation, {
        timeoutMs: 1000,
        operationName: 'success_op',
        onTimeout
      });
      
      expect(onTimeout).not.toHaveBeenCalled();
    });
    
    it('should not call onTimeout if operation fails with non-timeout error', async () => {
      const onTimeout = vi.fn();
      
      const operation = async () => {
        throw new Error('operation error');
      };
      
      await expect(
        withTimeoutConfig(operation, {
          timeoutMs: 1000,
          operationName: 'error_op',
          onTimeout
        })
      ).rejects.toThrow('operation error');
      
      expect(onTimeout).not.toHaveBeenCalled();
    });
    
    it.skip('should work without onTimeout callback', async () => {
      const operation = async () => {
        return new Promise<void>((resolve) => {
          setTimeout(() => resolve(), 2000);
        });
      };
      
      const promise = withTimeoutConfig(operation, {
        timeoutMs: 1000,
        operationName: 'no_callback_op'
      });
      
      await vi.advanceTimersByTimeAsync(1001);
      
      await expect(promise).rejects.toThrow(TimeoutError);
    });
  });
  
  describe('Integration scenarios', () => {
    it('should work with predefined TIMEOUTS constants', async () => {
      const llmOperation = async () => 'concepts extracted';
      
      const result = await withTimeout(
        llmOperation,
        TIMEOUTS.LLM_CALL,
        'llm_extract'
      );
      
      expect(result).toBe('concepts extracted');
    });
    
    it('should handle rapid successive operations', async () => {
      const operation = async (value: number) => value * 2;
      
      const results = await Promise.all([
        withTimeout(() => operation(1), 1000, 'op1'),
        withTimeout(() => operation(2), 1000, 'op2'),
        withTimeout(() => operation(3), 1000, 'op3')
      ]);
      
      expect(results).toEqual([2, 4, 6]);
    });
    
    it.skip('should timeout mixed fast/slow operations correctly', async () => {
      const fastOp = async () => 'fast';
      const slowOp = async () => {
        return new Promise<string>((resolve) => {
          setTimeout(() => resolve('slow'), 2000);
        });
      };
      
      // Test fast operation
      const fastResult = await withTimeout(fastOp, 1000, 'fast');
      expect(fastResult).toBe('fast');
      
      // Test slow operation that should timeout
      const slowPromise = withTimeout(slowOp, 1000, 'slow');
      await vi.advanceTimersByTimeAsync(1001);
      
      await expect(slowPromise).rejects.toThrow(TimeoutError);
    });
  });
  
  describe('Edge cases', () => {
    it('should handle operation that throws synchronously', async () => {
      const operation = async () => {
        throw new Error('sync error');
      };
      
      await expect(
        withTimeout(operation, 1000, 'sync_error_op')
      ).rejects.toThrow('sync error');
    });
    
    it('should handle operation that returns undefined', async () => {
      const operation = async () => undefined;
      
      const result = await withTimeout(operation, 1000, 'undefined_op');
      expect(result).toBeUndefined();
    });
    
    it('should handle operation that returns null', async () => {
      const operation = async () => null;
      
      const result = await withTimeout(operation, 1000, 'null_op');
      expect(result).toBeNull();
    });
    
    it('should handle operation that returns complex objects', async () => {
      const operation = async () => ({
        data: [1, 2, 3],
        meta: { count: 3, success: true }
      });
      
      const result = await withTimeout(operation, 1000, 'complex_op');
      expect(result).toEqual({
        data: [1, 2, 3],
        meta: { count: 3, success: true }
      });
    });
  });
});

