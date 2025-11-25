import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Bulkhead, DEFAULT_BULKHEAD_CONFIG } from '../bulkhead.js';
import { BulkheadRejectionError } from '../errors.js';

describe('Bulkhead', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });
  
  describe('Configuration', () => {
    it('should use default configuration when no config provided', () => {
      const bulkhead = new Bulkhead('test-service');
      
      const config = bulkhead.getConfig();
      expect(config).toEqual(DEFAULT_BULKHEAD_CONFIG);
    });
    
    it('should merge provided config with defaults', () => {
      const bulkhead = new Bulkhead('test-service', {
        maxConcurrent: 3,
      });
      
      const config = bulkhead.getConfig();
      expect(config.maxConcurrent).toBe(3);
      expect(config.maxQueue).toBe(DEFAULT_BULKHEAD_CONFIG.maxQueue);
    });
    
    it('should return name', () => {
      const bulkhead = new Bulkhead('my-service');
      expect(bulkhead.getName()).toBe('my-service');
    });
    
    it('should return frozen config', () => {
      const bulkhead = new Bulkhead('test');
      const config = bulkhead.getConfig();
      
      expect(() => {
        (config as any).maxConcurrent = 999;
      }).toThrow();
    });
    
    it('should throw error for invalid maxConcurrent', () => {
      expect(() => {
        new Bulkhead('test', { maxConcurrent: 0 });
      }).toThrow('maxConcurrent must be greater than 0');
      
      expect(() => {
        new Bulkhead('test', { maxConcurrent: -1 });
      }).toThrow('maxConcurrent must be greater than 0');
    });
    
    it('should throw error for invalid maxQueue', () => {
      expect(() => {
        new Bulkhead('test', { maxQueue: -1 });
      }).toThrow('maxQueue must be greater than or equal to 0');
    });
    
    it('should allow zero maxQueue', () => {
      const bulkhead = new Bulkhead('test', { maxQueue: 0 });
      expect(bulkhead.getConfig().maxQueue).toBe(0);
    });
  });
  
  describe('Initial State', () => {
    it('should have zero counters initially', () => {
      const bulkhead = new Bulkhead('test-service');
      
      const metrics = bulkhead.getMetrics();
      expect(metrics.active).toBe(0);
      expect(metrics.queued).toBe(0);
      expect(metrics.rejections).toBe(0);
      expect(metrics.totalExecuted).toBe(0);
      expect(metrics.totalSuccesses).toBe(0);
      expect(metrics.totalFailures).toBe(0);
    });
    
    it('should not be full initially', () => {
      const bulkhead = new Bulkhead('test-service');
      
      expect(bulkhead.isFull()).toBe(false);
      expect(bulkhead.isAtCapacity()).toBe(false);
    });
    
    it('should have zero utilization initially', () => {
      const bulkhead = new Bulkhead('test-service');
      
      expect(bulkhead.getUtilization()).toBe(0);
      expect(bulkhead.getQueueUtilization()).toBe(0);
    });
  });
  
  describe('Normal Operation', () => {
    it('should execute operations when under limit', async () => {
      const bulkhead = new Bulkhead('test-service', {
        maxConcurrent: 5,
      });
      const operation = vi.fn().mockResolvedValue('success');
      
      const result = await bulkhead.execute(operation);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });
    
    it('should track successful operations', async () => {
      const bulkhead = new Bulkhead('test-service');
      
      await bulkhead.execute(() => Promise.resolve('ok'));
      await bulkhead.execute(() => Promise.resolve('ok'));
      await bulkhead.execute(() => Promise.resolve('ok'));
      
      const metrics = bulkhead.getMetrics();
      expect(metrics.totalExecuted).toBe(3);
      expect(metrics.totalSuccesses).toBe(3);
      expect(metrics.totalFailures).toBe(0);
    });
    
    it('should track failed operations', async () => {
      const bulkhead = new Bulkhead('test-service');
      
      await bulkhead.execute(() => Promise.resolve('ok'));
      
      await expect(
        bulkhead.execute(() => Promise.reject(new Error('fail')))
      ).rejects.toThrow('fail');
      
      const metrics = bulkhead.getMetrics();
      expect(metrics.totalExecuted).toBe(2);
      expect(metrics.totalSuccesses).toBe(1);
      expect(metrics.totalFailures).toBe(1);
    });
    
    it('should release slot after operation completes', async () => {
      const bulkhead = new Bulkhead('test-service', {
        maxConcurrent: 1,
      });
      
      await bulkhead.execute(() => Promise.resolve('done'));
      
      const metrics = bulkhead.getMetrics();
      expect(metrics.active).toBe(0);
    });
    
    it('should release slot even if operation fails', async () => {
      const bulkhead = new Bulkhead('test-service', {
        maxConcurrent: 1,
      });
      
      await expect(
        bulkhead.execute(() => Promise.reject(new Error('fail')))
      ).rejects.toThrow();
      
      const metrics = bulkhead.getMetrics();
      expect(metrics.active).toBe(0);
    });
  });
  
  describe('Concurrency Limiting', () => {
    it('should limit concurrent operations', async () => {
      const bulkhead = new Bulkhead('test-service', {
        maxConcurrent: 2,
        maxQueue: 10,
      });
      
      let activeCount = 0;
      let maxActive = 0;
      
      const operation = async () => {
        activeCount++;
        maxActive = Math.max(maxActive, activeCount);
        await new Promise((resolve) => setTimeout(resolve, 10));
        activeCount--;
        return 'done';
      };
      
      // Start 5 operations
      const promises = Array.from({ length: 5 }, () =>
        bulkhead.execute(operation)
      );
      
      // Advance time to let operations complete
      await vi.advanceTimersByTimeAsync(50);
      await Promise.all(promises);
      
      // Should never have exceeded max concurrent
      expect(maxActive).toBeLessThanOrEqual(2);
    });
    
    it('should track active count correctly', async () => {
      const bulkhead = new Bulkhead('test-service', {
        maxConcurrent: 3,
      });
      
      const operation = () =>
        new Promise<string>((resolve) => {
          setTimeout(() => resolve('done'), 100);
        });
      
      // Start 3 operations
      const promises = [
        bulkhead.execute(operation),
        bulkhead.execute(operation),
        bulkhead.execute(operation),
      ];
      
      // Check active count
      await vi.advanceTimersByTimeAsync(1); // Let operations start
      expect(bulkhead.getMetrics().active).toBe(3);
      
      // Complete operations
      await vi.advanceTimersByTimeAsync(100);
      await Promise.all(promises);
      
      expect(bulkhead.getMetrics().active).toBe(0);
    });
    
    it('should report at capacity when maxConcurrent reached', async () => {
      const bulkhead = new Bulkhead('test-service', {
        maxConcurrent: 2,
      });
      
      const operation = () =>
        new Promise<string>((resolve) => {
          setTimeout(() => resolve('done'), 100);
        });
      
      bulkhead.execute(operation);
      bulkhead.execute(operation);
      
      await vi.advanceTimersByTimeAsync(1);
      
      expect(bulkhead.isAtCapacity()).toBe(true);
    });
    
    it('should calculate utilization correctly', async () => {
      const bulkhead = new Bulkhead('test-service', {
        maxConcurrent: 10,
      });
      
      const operation = () =>
        new Promise<string>((resolve) => {
          setTimeout(() => resolve('done'), 100);
        });
      
      // Start 5 operations (50% utilization)
      for (let i = 0; i < 5; i++) {
        bulkhead.execute(operation);
      }
      
      await vi.advanceTimersByTimeAsync(1);
      
      expect(bulkhead.getUtilization()).toBe(50);
    });
  });
  
  describe('Queue Management', () => {
    it('should queue operations when at max concurrent', async () => {
      const bulkhead = new Bulkhead('test-service', {
        maxConcurrent: 2,
        maxQueue: 3,
      });
      
      const operation = () =>
        new Promise<string>((resolve) => {
          setTimeout(() => resolve('done'), 10);
        });
      
      // Start 5 operations (2 active, 3 queued)
      bulkhead.execute(operation);
      bulkhead.execute(operation);
      bulkhead.execute(operation);
      bulkhead.execute(operation);
      bulkhead.execute(operation);
      
      await vi.advanceTimersByTimeAsync(1);
      
      const metrics = bulkhead.getMetrics();
      expect(metrics.active).toBe(2);
      expect(metrics.queued).toBe(3);
    });
    
    it('should process queued operations as slots free', async () => {
      const bulkhead = new Bulkhead('test-service', {
        maxConcurrent: 1,
        maxQueue: 2,
      });
      
      const results: number[] = [];
      
      const operation = (id: number) =>
        new Promise<number>((resolve) => {
          setTimeout(() => {
            results.push(id);
            resolve(id);
          }, 10);
        });
      
      // Start 3 operations
      const promises = [
        bulkhead.execute(() => operation(1)),
        bulkhead.execute(() => operation(2)),
        bulkhead.execute(() => operation(3)),
      ];
      
      // All operations should eventually complete
      await vi.advanceTimersByTimeAsync(50);
      await Promise.all(promises);
      
      expect(results).toEqual([1, 2, 3]);
    });
    
    it('should calculate queue utilization correctly', async () => {
      const bulkhead = new Bulkhead('test-service', {
        maxConcurrent: 1,
        maxQueue: 10,
      });
      
      const operation = () =>
        new Promise<string>((resolve) => {
          setTimeout(() => resolve('done'), 100);
        });
      
      // Fill active slot
      bulkhead.execute(operation);
      
      // Add 5 to queue (50% queue utilization)
      for (let i = 0; i < 5; i++) {
        bulkhead.execute(operation);
      }
      
      await vi.advanceTimersByTimeAsync(1);
      
      expect(bulkhead.getQueueUtilization()).toBe(50);
    });
    
    it('should handle zero maxQueue', async () => {
      const bulkhead = new Bulkhead('test-service', {
        maxConcurrent: 1,
        maxQueue: 0,
      });
      
      const operation = () =>
        new Promise<string>((resolve) => {
          setTimeout(() => resolve('done'), 10);
        });
      
      // First operation should succeed
      bulkhead.execute(operation);
      
      await vi.advanceTimersByTimeAsync(1);
      
      // Second operation should be rejected immediately
      await expect(bulkhead.execute(operation)).rejects.toThrow(
        BulkheadRejectionError
      );
    });
  });
  
  describe('Rejection', () => {
    it('should reject when bulkhead is full', async () => {
      const bulkhead = new Bulkhead('test-service', {
        maxConcurrent: 2,
        maxQueue: 2,
      });
      
      const operation = () =>
        new Promise<string>((resolve) => {
          setTimeout(() => resolve('done'), 100);
        });
      
      // Fill bulkhead (2 active + 2 queued)
      bulkhead.execute(operation);
      bulkhead.execute(operation);
      bulkhead.execute(operation);
      bulkhead.execute(operation);
      
      await vi.advanceTimersByTimeAsync(1);
      
      // Next operation should be rejected
      await expect(bulkhead.execute(operation)).rejects.toThrow(
        BulkheadRejectionError
      );
    });
    
    it('should include bulkhead name in rejection error', async () => {
      const bulkhead = new Bulkhead('my-api-service', {
        maxConcurrent: 1,
        maxQueue: 0,
      });
      
      const operation = () =>
        new Promise<string>((resolve) => {
          setTimeout(() => resolve('done'), 100);
        });
      
      // Fill bulkhead
      bulkhead.execute(operation);
      await vi.advanceTimersByTimeAsync(1);
      
      try {
        await bulkhead.execute(operation);
        expect.fail('Should have thrown BulkheadRejectionError');
      } catch (error) {
        expect(error).toBeInstanceOf(BulkheadRejectionError);
        const bhError = error as BulkheadRejectionError;
        expect(bhError.bulkheadName).toBe('my-api-service');
        expect(bhError.message).toContain('my-api-service');
      }
    });
    
    it('should track rejection count', async () => {
      const bulkhead = new Bulkhead('test-service', {
        maxConcurrent: 1,
        maxQueue: 1,
      });
      
      const operation = () =>
        new Promise<string>((resolve) => {
          setTimeout(() => resolve('done'), 100);
        });
      
      // Fill bulkhead
      bulkhead.execute(operation);
      bulkhead.execute(operation);
      
      await vi.advanceTimersByTimeAsync(1);
      
      // Try to execute 3 more (all rejected)
      for (let i = 0; i < 3; i++) {
        await expect(bulkhead.execute(operation)).rejects.toThrow(
          BulkheadRejectionError
        );
      }
      
      const metrics = bulkhead.getMetrics();
      expect(metrics.rejections).toBe(3);
    });
    
    it('should report full when rejecting', async () => {
      const bulkhead = new Bulkhead('test-service', {
        maxConcurrent: 1,
        maxQueue: 1,
      });
      
      const operation = () =>
        new Promise<string>((resolve) => {
          setTimeout(() => resolve('done'), 100);
        });
      
      bulkhead.execute(operation);
      bulkhead.execute(operation);
      
      await vi.advanceTimersByTimeAsync(1);
      
      expect(bulkhead.isFull()).toBe(true);
    });
  });
  
  describe('Metrics', () => {
    it('should track all metrics accurately', async () => {
      const bulkhead = new Bulkhead('test-service', {
        maxConcurrent: 2,
        maxQueue: 2,
      });
      
      const operation = (shouldFail: boolean) =>
        new Promise<string>((resolve, reject) => {
          setTimeout(() => {
            if (shouldFail) {
              reject(new Error('failed'));
            } else {
              resolve('success');
            }
          }, 10);
        });
      
      // 2 successes
      const promise1 = bulkhead.execute(() => operation(false));
      await vi.advanceTimersByTimeAsync(11);
      await promise1;
      
      const promise2 = bulkhead.execute(() => operation(false));
      await vi.advanceTimersByTimeAsync(11);
      await promise2;
      
      // 1 failure
      const promise3 = bulkhead.execute(() => operation(true));
      await vi.advanceTimersByTimeAsync(11);
      await expect(promise3).rejects.toThrow();
      
      const metrics = bulkhead.getMetrics();
      expect(metrics.totalExecuted).toBe(3);
      expect(metrics.totalSuccesses).toBe(2);
      expect(metrics.totalFailures).toBe(1);
    });
    
    it('should include configuration in metrics', () => {
      const bulkhead = new Bulkhead('test-service', {
        maxConcurrent: 5,
        maxQueue: 15,
      });
      
      const metrics = bulkhead.getMetrics();
      expect(metrics.maxConcurrent).toBe(5);
      expect(metrics.maxQueue).toBe(15);
    });
  });
  
  describe('Concurrent Requests', () => {
    it('should handle many concurrent requests correctly', async () => {
      const bulkhead = new Bulkhead('test-service', {
        maxConcurrent: 3,
        maxQueue: 5,
      });
      
      const operation = (id: number) =>
        new Promise<number>((resolve) => {
          setTimeout(() => resolve(id), 10);
        });
      
      // Start 8 operations (3 active, 5 queued)
      const promises = Array.from({ length: 8 }, (_, i) =>
        bulkhead.execute(() => operation(i))
      );
      
      // Let them complete
      await vi.advanceTimersByTimeAsync(100);
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(8);
      expect(results).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    });
    
    it('should handle mix of fast and slow operations', async () => {
      const bulkhead = new Bulkhead('test-service', {
        maxConcurrent: 2,
        maxQueue: 10,
      });
      
      const fastOp = () =>
        new Promise<string>((resolve) => {
          setTimeout(() => resolve('fast'), 5);
        });
      
      const slowOp = () =>
        new Promise<string>((resolve) => {
          setTimeout(() => resolve('slow'), 20);
        });
      
      const promises = [
        bulkhead.execute(slowOp),
        bulkhead.execute(fastOp),
        bulkhead.execute(fastOp),
        bulkhead.execute(slowOp),
      ];
      
      await vi.advanceTimersByTimeAsync(50);
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(4);
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle operation that throws synchronously', async () => {
      const bulkhead = new Bulkhead('test-service');
      
      await expect(
        bulkhead.execute(() => {
          throw new Error('sync error');
        })
      ).rejects.toThrow('sync error');
      
      expect(bulkhead.getMetrics().totalFailures).toBe(1);
      expect(bulkhead.getMetrics().active).toBe(0); // Slot released
    });
    
    it('should handle operation that returns undefined', async () => {
      const bulkhead = new Bulkhead('test-service');
      
      const result = await bulkhead.execute(() => Promise.resolve(undefined));
      
      expect(result).toBeUndefined();
      expect(bulkhead.getMetrics().totalSuccesses).toBe(1);
    });
    
    it('should handle very low limits', async () => {
      const bulkhead = new Bulkhead('test-service', {
        maxConcurrent: 1,
        maxQueue: 0,
      });
      
      const operation = () =>
        new Promise<string>((resolve) => {
          setTimeout(() => resolve('done'), 10);
        });
      
      bulkhead.execute(operation);
      
      await vi.advanceTimersByTimeAsync(1);
      
      await expect(bulkhead.execute(operation)).rejects.toThrow(
        BulkheadRejectionError
      );
    });
    
    it('should handle very high limits', async () => {
      const bulkhead = new Bulkhead('test-service', {
        maxConcurrent: 1000,
        maxQueue: 1000,
      });
      
      const operations = Array.from({ length: 50 }, () =>
        bulkhead.execute(() => Promise.resolve('ok'))
      );
      
      const results = await Promise.all(operations);
      
      expect(results).toHaveLength(50);
      expect(bulkhead.getMetrics().rejections).toBe(0);
    });
    
    it('should handle rapid successive single operations', async () => {
      const bulkhead = new Bulkhead('test-service', {
        maxConcurrent: 10,
      });
      
      for (let i = 0; i < 20; i++) {
        await bulkhead.execute(() => Promise.resolve(i));
      }
      
      const metrics = bulkhead.getMetrics();
      expect(metrics.totalExecuted).toBe(20);
      expect(metrics.totalSuccesses).toBe(20);
      expect(metrics.active).toBe(0);
    });
  });
});

