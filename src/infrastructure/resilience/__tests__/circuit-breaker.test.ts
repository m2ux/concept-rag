import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CircuitBreaker, DEFAULT_CIRCUIT_BREAKER_CONFIG } from '../circuit-breaker.js';
import { CircuitBreakerOpenError } from '../errors.js';

describe('CircuitBreaker', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  
  beforeEach(() => {
    vi.useFakeTimers();
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });
  
  describe('Configuration', () => {
    it('should use default configuration when no config provided', () => {
      const breaker = new CircuitBreaker('test-service');
      
      const config = breaker.getConfig();
      expect(config).toEqual(DEFAULT_CIRCUIT_BREAKER_CONFIG);
    });
    
    it('should merge provided config with defaults', () => {
      const breaker = new CircuitBreaker('test-service', {
        failureThreshold: 3,
      });
      
      const config = breaker.getConfig();
      expect(config.failureThreshold).toBe(3);
      expect(config.successThreshold).toBe(DEFAULT_CIRCUIT_BREAKER_CONFIG.successThreshold);
      expect(config.timeout).toBe(DEFAULT_CIRCUIT_BREAKER_CONFIG.timeout);
    });
    
    it('should return name', () => {
      const breaker = new CircuitBreaker('my-service');
      expect(breaker.getName()).toBe('my-service');
    });
    
    it('should return frozen config', () => {
      const breaker = new CircuitBreaker('test');
      const config = breaker.getConfig();
      
      expect(() => {
        (config as any).failureThreshold = 999;
      }).toThrow();
    });
  });
  
  describe('Initial State', () => {
    it('should start in closed state', () => {
      const breaker = new CircuitBreaker('test-service');
      
      expect(breaker.getState()).toBe('closed');
      expect(breaker.isClosed()).toBe(true);
      expect(breaker.isOpen()).toBe(false);
      expect(breaker.isHalfOpen()).toBe(false);
    });
    
    it('should have zero counters initially', () => {
      const breaker = new CircuitBreaker('test-service');
      
      const metrics = breaker.getMetrics();
      expect(metrics.failures).toBe(0);
      expect(metrics.successes).toBe(0);
      expect(metrics.rejections).toBe(0);
      expect(metrics.totalRequests).toBe(0);
      expect(metrics.totalSuccesses).toBe(0);
      expect(metrics.totalFailures).toBe(0);
    });
  });
  
  describe('Closed State', () => {
    it('should execute operations successfully in closed state', async () => {
      const breaker = new CircuitBreaker('test-service');
      const operation = vi.fn().mockResolvedValue('success');
      
      const result = await breaker.execute(operation);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
      expect(breaker.getState()).toBe('closed');
    });
    
    it('should track successful operations', async () => {
      const breaker = new CircuitBreaker('test-service');
      const operation = vi.fn().mockResolvedValue('success');
      
      await breaker.execute(operation);
      await breaker.execute(operation);
      await breaker.execute(operation);
      
      const metrics = breaker.getMetrics();
      expect(metrics.totalRequests).toBe(3);
      expect(metrics.totalSuccesses).toBe(3);
      expect(metrics.totalFailures).toBe(0);
    });
    
    it('should handle failed operations without opening immediately', async () => {
      const breaker = new CircuitBreaker('test-service', {
        failureThreshold: 5,
      });
      const operation = vi.fn().mockRejectedValue(new Error('operation failed'));
      
      // First 4 failures should not open circuit
      for (let i = 0; i < 4; i++) {
        await expect(breaker.execute(operation)).rejects.toThrow('operation failed');
      }
      
      expect(breaker.getState()).toBe('closed');
      const metrics = breaker.getMetrics();
      expect(metrics.failures).toBe(4);
      expect(metrics.totalFailures).toBe(4);
    });
    
    it('should open after reaching failure threshold', async () => {
      const breaker = new CircuitBreaker('test-service', {
        failureThreshold: 3,
      });
      const operation = vi.fn().mockRejectedValue(new Error('failed'));
      
      // Execute until threshold
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(operation)).rejects.toThrow('failed');
      }
      
      expect(breaker.getState()).toBe('open');
      expect(breaker.isOpen()).toBe(true);
    });
    
    it('should reset failure count after successful operation', async () => {
      const breaker = new CircuitBreaker('test-service', {
        failureThreshold: 3,
      });
      
      // 2 failures
      await expect(
        breaker.execute(() => Promise.reject(new Error('fail')))
      ).rejects.toThrow();
      await expect(
        breaker.execute(() => Promise.reject(new Error('fail')))
      ).rejects.toThrow();
      
      // Success resets counter
      await breaker.execute(() => Promise.resolve('success'));
      
      const metrics = breaker.getMetrics();
      expect(metrics.failures).toBe(0);
      expect(metrics.state).toBe('closed');
    });
    
    it('should reset failure count after reset timeout', async () => {
      const breaker = new CircuitBreaker('test-service', {
        failureThreshold: 5,
        resetTimeout: 10000,
      });
      
      // 3 failures
      for (let i = 0; i < 3; i++) {
        await expect(
          breaker.execute(() => Promise.reject(new Error('fail')))
        ).rejects.toThrow();
      }
      
      expect(breaker.getMetrics().failures).toBe(3);
      
      // Wait past reset timeout
      await vi.advanceTimersByTimeAsync(10001);
      
      // Next operation should have reset failure count
      await expect(
        breaker.execute(() => Promise.reject(new Error('fail')))
      ).rejects.toThrow();
      
      const metrics = breaker.getMetrics();
      expect(metrics.failures).toBe(1); // Reset, then 1 new failure
    });
  });
  
  describe('Open State', () => {
    async function openCircuit(breaker: CircuitBreaker): Promise<void> {
      const config = breaker.getConfig();
      for (let i = 0; i < config.failureThreshold; i++) {
        await expect(
          breaker.execute(() => Promise.reject(new Error('fail')))
        ).rejects.toThrow();
      }
    }
    
    it('should reject operations immediately when open', async () => {
      const breaker = new CircuitBreaker('test-service', {
        failureThreshold: 2,
      });
      
      await openCircuit(breaker);
      expect(breaker.isOpen()).toBe(true);
      
      const operation = vi.fn().mockResolvedValue('success');
      
      await expect(breaker.execute(operation)).rejects.toThrow(CircuitBreakerOpenError);
      expect(operation).not.toHaveBeenCalled(); // Operation should not execute
    });
    
    it('should include circuit name in error', async () => {
      const breaker = new CircuitBreaker('my-api-service', {
        failureThreshold: 1,
      });
      
      await openCircuit(breaker);
      
      try {
        await breaker.execute(() => Promise.resolve('test'));
        expect.fail('Should have thrown CircuitBreakerOpenError');
      } catch (error) {
        expect(error).toBeInstanceOf(CircuitBreakerOpenError);
        const cbError = error as CircuitBreakerOpenError;
        expect(cbError.circuitName).toBe('my-api-service');
        expect(cbError.message).toContain('my-api-service');
      }
    });
    
    it('should track rejections in open state', async () => {
      const breaker = new CircuitBreaker('test-service', {
        failureThreshold: 2,
      });
      
      await openCircuit(breaker);
      
      // Try to execute 5 more times (all rejected)
      for (let i = 0; i < 5; i++) {
        await expect(
          breaker.execute(() => Promise.resolve('test'))
        ).rejects.toThrow(CircuitBreakerOpenError);
      }
      
      const metrics = breaker.getMetrics();
      expect(metrics.rejections).toBe(5);
    });
    
    it('should transition to half-open after timeout', async () => {
      const breaker = new CircuitBreaker('test-service', {
        failureThreshold: 2,
        timeout: 60000, // 60 seconds
      });
      
      await openCircuit(breaker);
      expect(breaker.getState()).toBe('open');
      
      // Wait past timeout
      await vi.advanceTimersByTimeAsync(60001);
      
      // State should report half-open
      expect(breaker.getState()).toBe('half-open');
      
      // Next execute should actually transition
      const operation = vi.fn().mockResolvedValue('success');
      await breaker.execute(operation);
      
      expect(operation).toHaveBeenCalled(); // Operation executed in half-open
    });
    
    it('should not transition to half-open before timeout', async () => {
      const breaker = new CircuitBreaker('test-service', {
        failureThreshold: 1,
        timeout: 60000,
      });
      
      await openCircuit(breaker);
      
      // Wait, but not enough
      await vi.advanceTimersByTimeAsync(30000);
      
      await expect(
        breaker.execute(() => Promise.resolve('test'))
      ).rejects.toThrow(CircuitBreakerOpenError);
    });
  });
  
  describe('Half-Open State', () => {
    async function openCircuit(breaker: CircuitBreaker): Promise<void> {
      const config = breaker.getConfig();
      for (let i = 0; i < config.failureThreshold; i++) {
        await expect(
          breaker.execute(() => Promise.reject(new Error('fail')))
        ).rejects.toThrow();
      }
    }
    
    async function transitionToHalfOpen(breaker: CircuitBreaker): Promise<void> {
      await openCircuit(breaker);
      const config = breaker.getConfig();
      await vi.advanceTimersByTimeAsync(config.timeout + 1);
    }
    
    it('should execute operations in half-open state', async () => {
      const breaker = new CircuitBreaker('test-service', {
        failureThreshold: 2,
        timeout: 60000,
      });
      
      await transitionToHalfOpen(breaker);
      
      const operation = vi.fn().mockResolvedValue('success');
      const result = await breaker.execute(operation);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalled();
    });
    
    it('should close after success threshold met', async () => {
      const breaker = new CircuitBreaker('test-service', {
        failureThreshold: 2,
        successThreshold: 3,
        timeout: 60000,
      });
      
      await transitionToHalfOpen(breaker);
      expect(breaker.isHalfOpen()).toBe(true);
      
      // Execute successful operations
      for (let i = 0; i < 3; i++) {
        await breaker.execute(() => Promise.resolve('success'));
      }
      
      expect(breaker.getState()).toBe('closed');
      expect(breaker.isClosed()).toBe(true);
    });
    
    it('should reopen on any failure in half-open state', async () => {
      const breaker = new CircuitBreaker('test-service', {
        failureThreshold: 2,
        successThreshold: 3,
        timeout: 60000,
      });
      
      await transitionToHalfOpen(breaker);
      
      // One success
      await breaker.execute(() => Promise.resolve('success'));
      
      // One failure should immediately reopen
      await expect(
        breaker.execute(() => Promise.reject(new Error('fail')))
      ).rejects.toThrow('fail');
      
      expect(breaker.getState()).toBe('open');
    });
    
    it('should track success count in half-open state', async () => {
      const breaker = new CircuitBreaker('test-service', {
        failureThreshold: 2,
        successThreshold: 3,
        timeout: 60000,
      });
      
      await transitionToHalfOpen(breaker);
      
      await breaker.execute(() => Promise.resolve('success'));
      expect(breaker.getMetrics().successes).toBe(1);
      
      await breaker.execute(() => Promise.resolve('success'));
      expect(breaker.getMetrics().successes).toBe(2);
    });
    
    it('should reset success count when transitioning to closed', async () => {
      const breaker = new CircuitBreaker('test-service', {
        failureThreshold: 2,
        successThreshold: 2,
        timeout: 60000,
      });
      
      await transitionToHalfOpen(breaker);
      
      // Meet success threshold
      await breaker.execute(() => Promise.resolve('success'));
      await breaker.execute(() => Promise.resolve('success'));
      
      expect(breaker.isClosed()).toBe(true);
      expect(breaker.getMetrics().successes).toBe(0);
      expect(breaker.getMetrics().failures).toBe(0);
    });
  });
  
  describe('State Transitions', () => {
    it('should log state transitions', async () => {
      const breaker = new CircuitBreaker('test-service', {
        failureThreshold: 2,
        successThreshold: 2,
        timeout: 1000,
      });
      
      // CLOSED → OPEN
      for (let i = 0; i < 2; i++) {
        await expect(
          breaker.execute(() => Promise.reject(new Error('fail')))
        ).rejects.toThrow();
      }
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("test-service': closed → open")
      );
      
      // OPEN → HALF-OPEN
      await vi.advanceTimersByTimeAsync(1001);
      await breaker.execute(() => Promise.resolve('success'));
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("test-service': open → half-open")
      );
      
      // HALF-OPEN → CLOSED
      await breaker.execute(() => Promise.resolve('success'));
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("test-service': half-open → closed")
      );
    });
    
    it('should handle HALF-OPEN → OPEN → HALF-OPEN cycle', async () => {
      const breaker = new CircuitBreaker('test-service', {
        failureThreshold: 1,
        successThreshold: 1,
        timeout: 1000,
      });
      
      // Open circuit
      await expect(
        breaker.execute(() => Promise.reject(new Error('fail')))
      ).rejects.toThrow();
      
      // Wait for half-open
      await vi.advanceTimersByTimeAsync(1001);
      await breaker.execute(() => Promise.resolve('test')); // Transition to half-open
      
      // Fail in half-open (back to open)
      await expect(
        breaker.execute(() => Promise.reject(new Error('fail')))
      ).rejects.toThrow();
      expect(breaker.isOpen()).toBe(true);
      
      // Wait again for half-open
      await vi.advanceTimersByTimeAsync(1001);
      expect(breaker.getState()).toBe('half-open');
    });
  });
  
  describe('Metrics', () => {
    it('should track all metrics accurately', async () => {
      const breaker = new CircuitBreaker('test-service', {
        failureThreshold: 3,
      });
      
      // 2 successes
      await breaker.execute(() => Promise.resolve('ok'));
      await breaker.execute(() => Promise.resolve('ok'));
      
      // 2 failures
      await expect(
        breaker.execute(() => Promise.reject(new Error('fail')))
      ).rejects.toThrow();
      await expect(
        breaker.execute(() => Promise.reject(new Error('fail')))
      ).rejects.toThrow();
      
      // 1 more success
      await breaker.execute(() => Promise.resolve('ok'));
      
      const metrics = breaker.getMetrics();
      expect(metrics.totalRequests).toBe(5);
      expect(metrics.totalSuccesses).toBe(3);
      expect(metrics.totalFailures).toBe(2);
      expect(metrics.failures).toBe(0); // Reset by last success
      expect(metrics.state).toBe('closed');
    });
    
    it('should include timestamps in metrics', async () => {
      const breaker = new CircuitBreaker('test-service');
      
      const beforeTime = new Date();
      
      await expect(
        breaker.execute(() => Promise.reject(new Error('fail')))
      ).rejects.toThrow();
      
      const afterTime = new Date();
      
      const metrics = breaker.getMetrics();
      expect(metrics.lastFailure).toBeDefined();
      expect(metrics.lastFailure!.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(metrics.lastFailure!.getTime()).toBeLessThanOrEqual(afterTime.getTime());
      expect(metrics.lastStateChange).toBeInstanceOf(Date);
    });
  });
  
  describe('reset()', () => {
    it('should manually reset circuit to closed', async () => {
      const breaker = new CircuitBreaker('test-service', {
        failureThreshold: 2,
      });
      
      // Open circuit
      for (let i = 0; i < 2; i++) {
        await expect(
          breaker.execute(() => Promise.reject(new Error('fail')))
        ).rejects.toThrow();
      }
      expect(breaker.isOpen()).toBe(true);
      
      // Reset
      breaker.reset();
      
      expect(breaker.isClosed()).toBe(true);
      expect(breaker.getMetrics().failures).toBe(0);
      expect(breaker.getMetrics().successes).toBe(0);
    });
    
    it('should log reset', () => {
      const breaker = new CircuitBreaker('test-service');
      
      breaker.reset();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("'test-service' manually reset to CLOSED")
      );
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle operation that throws synchronously', async () => {
      const breaker = new CircuitBreaker('test-service');
      
      await expect(
        breaker.execute(() => {
          throw new Error('sync error');
        })
      ).rejects.toThrow('sync error');
      
      expect(breaker.getMetrics().totalFailures).toBe(1);
    });
    
    it('should handle operation that returns undefined', async () => {
      const breaker = new CircuitBreaker('test-service');
      
      const result = await breaker.execute(() => Promise.resolve(undefined));
      
      expect(result).toBeUndefined();
      expect(breaker.getMetrics().totalSuccesses).toBe(1);
    });
    
    it('should handle rapid successive operations', async () => {
      const breaker = new CircuitBreaker('test-service');
      
      const operations = Array.from({ length: 10 }, (_, i) =>
        breaker.execute(() => Promise.resolve(i))
      );
      
      const results = await Promise.all(operations);
      
      expect(results).toHaveLength(10);
      expect(breaker.getMetrics().totalRequests).toBe(10);
      expect(breaker.getMetrics().totalSuccesses).toBe(10);
    });
    
    it('should handle concurrent operations with failures', async () => {
      const breaker = new CircuitBreaker('test-service', {
        failureThreshold: 10, // High threshold to avoid opening
      });
      
      const operations = Array.from({ length: 5 }, (_, i) =>
        i % 2 === 0
          ? breaker.execute(() => Promise.resolve('success'))
          : breaker.execute(() => Promise.reject(new Error('fail')))
      );
      
      const results = await Promise.allSettled(operations);
      
      const successes = results.filter((r) => r.status === 'fulfilled').length;
      const failures = results.filter((r) => r.status === 'rejected').length;
      
      expect(successes).toBe(3); // Indices 0, 2, 4
      expect(failures).toBe(2); // Indices 1, 3
    });
    
    it('should handle very low thresholds', async () => {
      const breaker = new CircuitBreaker('test-service', {
        failureThreshold: 1,
        successThreshold: 1,
      });
      
      // Single failure opens
      await expect(
        breaker.execute(() => Promise.reject(new Error('fail')))
      ).rejects.toThrow();
      expect(breaker.isOpen()).toBe(true);
      
      // Wait for half-open
      await vi.advanceTimersByTimeAsync(60001);
      
      // Single success closes
      await breaker.execute(() => Promise.resolve('ok'));
      expect(breaker.isClosed()).toBe(true);
    });
  });
});


