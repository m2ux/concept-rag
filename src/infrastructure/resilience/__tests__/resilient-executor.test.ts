import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ResilientExecutor, ResilienceProfiles } from '../resilient-executor.js';
import { RetryService } from '../../utils/retry-service.js';
import { CircuitBreakerOpenError, BulkheadRejectionError } from '../errors.js';

describe('ResilientExecutor', () => {
  let retryService: RetryService;
  let executor: ResilientExecutor;
  
  beforeEach(() => {
    vi.useFakeTimers();
    retryService = new RetryService();
    executor = new ResilientExecutor(retryService);
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });
  
  describe('Basic Execution', () => {
    it('should execute operation without any resilience patterns', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      
      const result = await executor.execute(operation, {
        name: 'simple_op',
      });
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });
    
    it('should propagate operation errors when no retry configured', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('operation failed'));
      
      await expect(
        executor.execute(operation, {
          name: 'failing_op',
        })
      ).rejects.toThrow('operation failed');
    });
  });
  
  describe('Timeout Pattern', () => {
    it('should create operations with timeout configured', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      
      const result = await executor.execute(operation, {
        name: 'timeout_op',
        timeout: 1000,
      });
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalled();
    });
  });
  
  describe('Circuit Breaker Pattern', () => {
    it('should create circuit breaker for operation', async () => {
      await executor.execute(
        () => Promise.resolve('ok'),
        {
          name: 'test_op',
          circuitBreaker: {
            failureThreshold: 3,
          },
        }
      );
      
      const cb = executor.getCircuitBreaker('test_op');
      expect(cb).toBeDefined();
      expect(cb!.getName()).toBe('test_op');
    });
    
    it('should reuse circuit breaker for same operation name', async () => {
      await executor.execute(
        () => Promise.resolve('ok'),
        {
          name: 'test_op',
          circuitBreaker: {},
        }
      );
      
      const cb1 = executor.getCircuitBreaker('test_op');
      
      await executor.execute(
        () => Promise.resolve('ok'),
        {
          name: 'test_op',
          circuitBreaker: {},
        }
      );
      
      const cb2 = executor.getCircuitBreaker('test_op');
      
      expect(cb1).toBe(cb2); // Same instance
    });
    
    it('should open circuit after failure threshold', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('fail'));
      
      // Fail 3 times to open circuit
      for (let i = 0; i < 3; i++) {
        await expect(
          executor.execute(operation, {
            name: 'failing_op',
            circuitBreaker: {
              failureThreshold: 3,
            },
          })
        ).rejects.toThrow('fail');
      }
      
      const cb = executor.getCircuitBreaker('failing_op');
      expect(cb!.isOpen()).toBe(true);
    });
    
    it('should reject operations when circuit is open', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('fail'));
      
      // Open circuit
      for (let i = 0; i < 2; i++) {
        await expect(
          executor.execute(operation, {
            name: 'failing_op',
            circuitBreaker: {
              failureThreshold: 2,
            },
          })
        ).rejects.toThrow();
      }
      
      // Next call should be rejected by circuit breaker
      await expect(
        executor.execute(operation, {
          name: 'failing_op',
          circuitBreaker: {},
        })
      ).rejects.toThrow(CircuitBreakerOpenError);
    });
  });
  
  describe('Bulkhead Pattern', () => {
    it('should create bulkhead for operation', async () => {
      await executor.execute(
        () => Promise.resolve('ok'),
        {
          name: 'test_op',
          bulkhead: {
            maxConcurrent: 5,
          },
        }
      );
      
      const bh = executor.getBulkhead('test_op');
      expect(bh).toBeDefined();
      expect(bh!.getName()).toBe('test_op');
    });
    
    it('should limit concurrent operations', async () => {
      const operation = () =>
        new Promise<string>((resolve) => {
          setTimeout(() => resolve('done'), 100);
        });
      
      // Start 3 operations (max concurrent = 2)
      const promises = [
        executor.execute(operation, {
          name: 'limited_op',
          bulkhead: { maxConcurrent: 2, maxQueue: 5 },
        }),
        executor.execute(operation, {
          name: 'limited_op',
          bulkhead: { maxConcurrent: 2, maxQueue: 5 },
        }),
        executor.execute(operation, {
          name: 'limited_op',
          bulkhead: { maxConcurrent: 2, maxQueue: 5 },
        }),
      ];
      
      await vi.advanceTimersByTimeAsync(1);
      
      const bh = executor.getBulkhead('limited_op');
      expect(bh!.getMetrics().active).toBe(2);
      expect(bh!.getMetrics().queued).toBe(1);
      
      await vi.advanceTimersByTimeAsync(200);
      await Promise.all(promises);
    });
    
    it('should reject when bulkhead is full', async () => {
      const operation = () =>
        new Promise<string>((resolve) => {
          setTimeout(() => resolve('done'), 100);
        });
      
      // Fill bulkhead
      executor.execute(operation, {
        name: 'full_op',
        bulkhead: { maxConcurrent: 1, maxQueue: 1 },
      });
      
      executor.execute(operation, {
        name: 'full_op',
        bulkhead: { maxConcurrent: 1, maxQueue: 1 },
      });
      
      await vi.advanceTimersByTimeAsync(1);
      
      // This should be rejected
      await expect(
        executor.execute(operation, {
          name: 'full_op',
          bulkhead: { maxConcurrent: 1, maxQueue: 1 },
        })
      ).rejects.toThrow(BulkheadRejectionError);
    });
  });
  
  describe('Retry Pattern', () => {
    it('should retry failed operations', async () => {
      vi.useRealTimers(); // Retry needs real timers
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('fail1'))
        .mockRejectedValueOnce(new Error('fail2'))
        .mockResolvedValue('success');
      
      const result = await executor.execute(operation, {
        name: 'retry_op',
        retry: {
          maxRetries: 3,
          initialDelayMs: 10,
        },
      });
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
      vi.useFakeTimers(); // Restore fake timers
    });
    
    it('should throw after exhausting retries', async () => {
      vi.useRealTimers(); // Retry needs real timers
      const operation = vi.fn().mockRejectedValue(new Error('always fails'));
      
      await expect(
        executor.execute(operation, {
          name: 'failing_op',
          retry: {
            maxRetries: 2,
            initialDelayMs: 10,
          },
        })
      ).rejects.toThrow('always fails');
      
      expect(operation).toHaveBeenCalledTimes(2);
      vi.useFakeTimers(); // Restore fake timers
    });
  });
  
  describe('Combined Patterns', () => {
    it('should apply circuit breaker + bulkhead together', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      
      const result = await executor.execute(operation, {
        name: 'combined_op',
        circuitBreaker: {
          failureThreshold: 3,
        },
        bulkhead: {
          maxConcurrent: 5,
        },
      });
      
      expect(result).toBe('success');
      expect(executor.getCircuitBreaker('combined_op')).toBeDefined();
      expect(executor.getBulkhead('combined_op')).toBeDefined();
    });
    
    it('should apply all patterns together', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      
      const result = await executor.execute(operation, {
        name: 'full_protection',
        circuitBreaker: {
          failureThreshold: 5,
        },
        bulkhead: {
          maxConcurrent: 10,
          maxQueue: 20,
        },
      });
      
      expect(result).toBe('success');
      expect(executor.getCircuitBreaker('full_protection')).toBeDefined();
      expect(executor.getBulkhead('full_protection')).toBeDefined();
    });
  });
  
  describe('Metrics', () => {
    it('should collect metrics from all patterns', async () => {
      await executor.execute(() => Promise.resolve('ok'), {
        name: 'op1',
        circuitBreaker: {},
      });
      
      await executor.execute(() => Promise.resolve('ok'), {
        name: 'op2',
        bulkhead: {},
      });
      
      const metrics = executor.getMetrics();
      
      expect(metrics.circuitBreakers['op1']).toBeDefined();
      expect(metrics.bulkheads['op2']).toBeDefined();
    });
    
    it('should return empty metrics when no operations executed', () => {
      const metrics = executor.getMetrics();
      
      expect(Object.keys(metrics.circuitBreakers)).toHaveLength(0);
      expect(Object.keys(metrics.bulkheads)).toHaveLength(0);
    });
  });
  
  describe('Operation Management', () => {
    it('should list all operation names', async () => {
      await executor.execute(() => Promise.resolve('ok'), {
        name: 'op1',
        circuitBreaker: {},
      });
      
      await executor.execute(() => Promise.resolve('ok'), {
        name: 'op2',
        bulkhead: {},
      });
      
      await executor.execute(() => Promise.resolve('ok'), {
        name: 'op3',
        circuitBreaker: {},
        bulkhead: {},
      });
      
      const names = executor.getOperationNames();
      
      expect(names).toContain('op1');
      expect(names).toContain('op2');
      expect(names).toContain('op3');
      expect(names).toHaveLength(3);
    });
    
    it('should reset specific circuit breaker', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('fail'));
      
      // Open circuit
      for (let i = 0; i < 2; i++) {
        await expect(
          executor.execute(operation, {
            name: 'test_op',
            circuitBreaker: { failureThreshold: 2 },
          })
        ).rejects.toThrow();
      }
      
      const cb = executor.getCircuitBreaker('test_op');
      expect(cb!.isOpen()).toBe(true);
      
      // Reset
      const reset = executor.resetCircuitBreaker('test_op');
      expect(reset).toBe(true);
      expect(cb!.isClosed()).toBe(true);
    });
    
    it('should return false when resetting non-existent circuit breaker', () => {
      const reset = executor.resetCircuitBreaker('non_existent');
      expect(reset).toBe(false);
    });
    
    it('should detect open circuits', async () => {
      expect(executor.hasOpenCircuits()).toBe(false);
      
      // Open a circuit
      for (let i = 0; i < 2; i++) {
        await expect(
          executor.execute(() => Promise.reject(new Error('fail')), {
            name: 'failing_op',
            circuitBreaker: { failureThreshold: 2 },
          })
        ).rejects.toThrow();
      }
      
      expect(executor.hasOpenCircuits()).toBe(true);
    });
  });
  
  describe('Health Summary', () => {
    it('should report healthy when no issues', async () => {
      await executor.execute(() => Promise.resolve('ok'), {
        name: 'healthy_op',
        circuitBreaker: {},
        bulkhead: {},
      });
      
      const health = executor.getHealthSummary();
      
      expect(health.healthy).toBe(true);
      expect(health.openCircuits).toHaveLength(0);
      expect(health.fullBulkheads).toHaveLength(0);
    });
    
    it('should report unhealthy when circuit is open', async () => {
      // Open circuit
      for (let i = 0; i < 2; i++) {
        await expect(
          executor.execute(() => Promise.reject(new Error('fail')), {
            name: 'failing_op',
            circuitBreaker: { failureThreshold: 2 },
          })
        ).rejects.toThrow();
      }
      
      const health = executor.getHealthSummary();
      
      expect(health.healthy).toBe(false);
      expect(health.openCircuits).toContain('failing_op');
    });
    
    it('should report warnings for rejections', async () => {
      const operation = () =>
        new Promise<string>((resolve) => {
          setTimeout(() => resolve('done'), 100);
        });
      
      // Fill bulkhead
      executor.execute(operation, {
        name: 'busy_op',
        bulkhead: { maxConcurrent: 1, maxQueue: 0 },
      });
      
      await vi.advanceTimersByTimeAsync(1);
      
      // This will be rejected
      await expect(
        executor.execute(operation, {
          name: 'busy_op',
          bulkhead: { maxConcurrent: 1, maxQueue: 0 },
        })
      ).rejects.toThrow();
      
      const health = executor.getHealthSummary();
      
      expect(health.warnings.length).toBeGreaterThan(0);
      expect(health.warnings.some((w) => w.includes('busy_op'))).toBe(true);
    });
  });
  
  describe('Resilience Profiles', () => {
    it('should provide LLM_API profile', () => {
      const profile = ResilienceProfiles.LLM_API;
      
      expect(profile.timeout).toBe(30000);
      expect(profile.retry).toBeDefined();
      expect(profile.circuitBreaker).toBeDefined();
      expect(profile.bulkhead).toBeDefined();
    });
    
    it('should provide EMBEDDING profile', () => {
      const profile = ResilienceProfiles.EMBEDDING;
      
      expect(profile.timeout).toBe(10000);
      expect(profile.circuitBreaker).toBeDefined();
    });
    
    it('should provide DATABASE profile', () => {
      const profile = ResilienceProfiles.DATABASE;
      
      expect(profile.timeout).toBe(3000);
      expect(profile.circuitBreaker).toBeUndefined(); // No CB for internal service
    });
    
    it('should provide SEARCH profile', () => {
      const profile = ResilienceProfiles.SEARCH;
      
      expect(profile.timeout).toBe(5000);
      expect(profile.bulkhead).toBeDefined();
    });
    
    it('should provide FAST_RELIABLE profile', () => {
      const profile = ResilienceProfiles.FAST_RELIABLE;
      
      expect(profile.timeout).toBe(1000);
      expect(profile.retry).toBeUndefined();
      expect(profile.circuitBreaker).toBeUndefined();
    });
    
    it('should work with profile spread (without retry to avoid timer issues)', async () => {
      const profile = { ...ResilienceProfiles.LLM_API };
      delete profile.retry; // Remove retry to avoid timer issues in tests
      
      const result = await executor.execute(
        () => Promise.resolve('ok'),
        {
          ...profile,
          name: 'llm_call',
        }
      );
      
      expect(result).toBe('ok');
      expect(executor.getCircuitBreaker('llm_call')).toBeDefined();
      expect(executor.getBulkhead('llm_call')).toBeDefined();
    });
  });
});

