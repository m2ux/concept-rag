import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GracefulDegradation, CommonFallbacks } from '../graceful-degradation.js';
import { CircuitBreaker } from '../circuit-breaker.js';

describe('GracefulDegradation', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  
  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  describe('Configuration', () => {
    it('should use default configuration when no config provided', () => {
      const degradation = new GracefulDegradation();
      const metrics = degradation.getMetrics();
      
      expect(metrics).toBeDefined();
    });
    
    it('should accept custom configuration', () => {
      const onDegradation = vi.fn();
      const onFallback = vi.fn();
      
      const degradation = new GracefulDegradation({
        fallbackOnFailure: true,
        onDegradation,
        onFallback,
      });
      
      expect(degradation).toBeDefined();
    });
  });
  
  describe('Basic Execution', () => {
    it('should execute primary operation when it succeeds', async () => {
      const degradation = new GracefulDegradation();
      const primary = vi.fn().mockResolvedValue('primary result');
      const fallback = vi.fn().mockResolvedValue('fallback result');
      
      const result = await degradation.execute({
        primary,
        fallback,
      });
      
      expect(result).toBe('primary result');
      expect(primary).toHaveBeenCalledTimes(1);
      expect(fallback).not.toHaveBeenCalled();
    });
    
    it('should use fallback when primary fails', async () => {
      const degradation = new GracefulDegradation();
      const primary = vi.fn().mockRejectedValue(new Error('primary failed'));
      const fallback = vi.fn().mockResolvedValue('fallback result');
      
      const result = await degradation.execute({
        primary,
        fallback,
      });
      
      expect(result).toBe('fallback result');
      expect(primary).toHaveBeenCalledTimes(1);
      expect(fallback).toHaveBeenCalledTimes(1);
    });
    
    it('should log when using fallback', async () => {
      const degradation = new GracefulDegradation();
      
      await degradation.execute({
        primary: () => Promise.reject(new Error('fail')),
        fallback: () => Promise.resolve('ok'),
      });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Primary operation failed, using fallback'),
        expect.any(Error)
      );
    });
    
    it('should throw error when fallbackOnFailure is false', async () => {
      const degradation = new GracefulDegradation({
        fallbackOnFailure: false,
      });
      
      await expect(
        degradation.execute({
          primary: () => Promise.reject(new Error('primary failed')),
          fallback: () => Promise.resolve('fallback'),
        })
      ).rejects.toThrow('primary failed');
    });
  });
  
  describe('Proactive Degradation', () => {
    it('should use fallback when shouldDegrade returns true', async () => {
      const degradation = new GracefulDegradation();
      const primary = vi.fn().mockResolvedValue('primary');
      const fallback = vi.fn().mockResolvedValue('fallback');
      const shouldDegrade = vi.fn().mockReturnValue(true);
      
      const result = await degradation.execute({
        primary,
        fallback,
        shouldDegrade,
      });
      
      expect(result).toBe('fallback');
      expect(shouldDegrade).toHaveBeenCalled();
      expect(primary).not.toHaveBeenCalled(); // Primary skipped
      expect(fallback).toHaveBeenCalledTimes(1);
    });
    
    it('should execute primary when shouldDegrade returns false', async () => {
      const degradation = new GracefulDegradation();
      const primary = vi.fn().mockResolvedValue('primary');
      const fallback = vi.fn().mockResolvedValue('fallback');
      const shouldDegrade = vi.fn().mockReturnValue(false);
      
      const result = await degradation.execute({
        primary,
        fallback,
        shouldDegrade,
      });
      
      expect(result).toBe('primary');
      expect(shouldDegrade).toHaveBeenCalled();
      expect(primary).toHaveBeenCalledTimes(1);
      expect(fallback).not.toHaveBeenCalled();
    });
    
    it('should log when proactively degrading', async () => {
      const degradation = new GracefulDegradation();
      
      await degradation.execute({
        primary: () => Promise.resolve('primary'),
        fallback: () => Promise.resolve('fallback'),
        shouldDegrade: () => true,
      });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Proactive degradation')
      );
    });
    
    it('should call onDegradation callback when degrading', async () => {
      const onDegradation = vi.fn();
      const degradation = new GracefulDegradation({ onDegradation });
      
      await degradation.execute({
        primary: () => Promise.resolve('primary'),
        fallback: () => Promise.resolve('fallback'),
        shouldDegrade: () => true,
      });
      
      expect(onDegradation).toHaveBeenCalledWith(
        expect.stringContaining('Proactive degradation')
      );
    });
  });
  
  describe('Callbacks', () => {
    it('should call onFallback when primary fails', async () => {
      const onFallback = vi.fn();
      const degradation = new GracefulDegradation({ onFallback });
      const error = new Error('primary failed');
      
      await degradation.execute({
        primary: () => Promise.reject(error),
        fallback: () => Promise.resolve('fallback'),
      });
      
      expect(onFallback).toHaveBeenCalledWith(error);
    });
    
    it('should not call onFallback when primary succeeds', async () => {
      const onFallback = vi.fn();
      const degradation = new GracefulDegradation({ onFallback });
      
      await degradation.execute({
        primary: () => Promise.resolve('primary'),
        fallback: () => Promise.resolve('fallback'),
      });
      
      expect(onFallback).not.toHaveBeenCalled();
    });
  });
  
  describe('Metrics', () => {
    it('should track total operations', async () => {
      const degradation = new GracefulDegradation();
      
      await degradation.execute({
        primary: () => Promise.resolve('ok'),
        fallback: () => Promise.resolve('fallback'),
      });
      
      await degradation.execute({
        primary: () => Promise.resolve('ok'),
        fallback: () => Promise.resolve('fallback'),
      });
      
      const metrics = degradation.getMetrics();
      expect(metrics.totalOperations).toBe(2);
    });
    
    it('should track primary successes', async () => {
      const degradation = new GracefulDegradation();
      
      await degradation.execute({
        primary: () => Promise.resolve('ok'),
        fallback: () => Promise.resolve('fallback'),
      });
      
      const metrics = degradation.getMetrics();
      expect(metrics.primarySuccesses).toBe(1);
      expect(metrics.primaryFailures).toBe(0);
    });
    
    it('should track primary failures', async () => {
      const degradation = new GracefulDegradation();
      
      await degradation.execute({
        primary: () => Promise.reject(new Error('fail')),
        fallback: () => Promise.resolve('fallback'),
      });
      
      const metrics = degradation.getMetrics();
      expect(metrics.primarySuccesses).toBe(0);
      expect(metrics.primaryFailures).toBe(1);
    });
    
    it('should track fallback usage', async () => {
      const degradation = new GracefulDegradation();
      
      await degradation.execute({
        primary: () => Promise.reject(new Error('fail')),
        fallback: () => Promise.resolve('fallback'),
      });
      
      await degradation.execute({
        primary: () => Promise.resolve('ok'),
        fallback: () => Promise.resolve('fallback'),
      });
      
      const metrics = degradation.getMetrics();
      expect(metrics.fallbackUsed).toBe(1);
    });
    
    it('should track degraded mode activations', async () => {
      const degradation = new GracefulDegradation();
      
      await degradation.execute({
        primary: () => Promise.resolve('ok'),
        fallback: () => Promise.resolve('fallback'),
        shouldDegrade: () => true,
      });
      
      await degradation.execute({
        primary: () => Promise.resolve('ok'),
        fallback: () => Promise.resolve('fallback'),
        shouldDegrade: () => true,
      });
      
      const metrics = degradation.getMetrics();
      expect(metrics.degradedModeActivations).toBe(2);
    });
    
    it('should calculate degradation rate', async () => {
      const degradation = new GracefulDegradation();
      
      // 1 success
      await degradation.execute({
        primary: () => Promise.resolve('ok'),
        fallback: () => Promise.resolve('fallback'),
      });
      
      // 1 failure (fallback used)
      await degradation.execute({
        primary: () => Promise.reject(new Error('fail')),
        fallback: () => Promise.resolve('fallback'),
      });
      
      const metrics = degradation.getMetrics();
      expect(metrics.degradationRate).toBe(50); // 1/2 = 50%
    });
    
    it('should handle zero operations for degradation rate', () => {
      const degradation = new GracefulDegradation();
      
      const metrics = degradation.getMetrics();
      expect(metrics.degradationRate).toBe(0);
    });
  });
  
  describe('isDegraded()', () => {
    it('should return true when degradation rate exceeds threshold', async () => {
      const degradation = new GracefulDegradation();
      
      // All operations fail (100% degradation)
      for (let i = 0; i < 3; i++) {
        await degradation.execute({
          primary: () => Promise.reject(new Error('fail')),
          fallback: () => Promise.resolve('fallback'),
        });
      }
      
      expect(degradation.isDegraded(50)).toBe(true);
    });
    
    it('should return false when degradation rate below threshold', async () => {
      const degradation = new GracefulDegradation();
      
      // All operations succeed (0% degradation)
      for (let i = 0; i < 3; i++) {
        await degradation.execute({
          primary: () => Promise.resolve('ok'),
          fallback: () => Promise.resolve('fallback'),
        });
      }
      
      expect(degradation.isDegraded(50)).toBe(false);
    });
    
    it('should use default threshold of 50%', async () => {
      const degradation = new GracefulDegradation();
      
      // 1 success, 1 failure = 50%
      await degradation.execute({
        primary: () => Promise.resolve('ok'),
        fallback: () => Promise.resolve('fallback'),
      });
      
      await degradation.execute({
        primary: () => Promise.reject(new Error('fail')),
        fallback: () => Promise.resolve('fallback'),
      });
      
      expect(degradation.isDegraded()).toBe(true);
    });
  });
  
  describe('resetMetrics()', () => {
    it('should reset all metrics to zero', async () => {
      const degradation = new GracefulDegradation();
      
      await degradation.execute({
        primary: () => Promise.resolve('ok'),
        fallback: () => Promise.resolve('fallback'),
      });
      
      degradation.resetMetrics();
      
      const metrics = degradation.getMetrics();
      expect(metrics.totalOperations).toBe(0);
      expect(metrics.primarySuccesses).toBe(0);
      expect(metrics.primaryFailures).toBe(0);
      expect(metrics.fallbackUsed).toBe(0);
      expect(metrics.degradedModeActivations).toBe(0);
      expect(metrics.degradationRate).toBe(0);
    });
  });
  
  describe('Static Factory Methods', () => {
    describe('withCircuitBreaker()', () => {
      it('should create strategy that checks circuit breaker', async () => {
        const circuitBreaker = new CircuitBreaker('test', {
          failureThreshold: 1,
        });
        const degradation = new GracefulDegradation();
        
        // Open the circuit breaker
        await expect(
          circuitBreaker.execute(() => Promise.reject(new Error('fail')))
        ).rejects.toThrow();
        
        const strategy = GracefulDegradation.withCircuitBreaker(
          circuitBreaker,
          () => Promise.resolve('primary'),
          () => Promise.resolve('fallback')
        );
        
        const result = await degradation.execute(strategy);
        
        expect(result).toBe('fallback'); // Used fallback because circuit is open
      });
      
      it('should use primary when circuit breaker is closed', async () => {
        const circuitBreaker = new CircuitBreaker('test');
        const degradation = new GracefulDegradation();
        
        const strategy = GracefulDegradation.withCircuitBreaker(
          circuitBreaker,
          () => Promise.resolve('primary'),
          () => Promise.resolve('fallback')
        );
        
        const result = await degradation.execute(strategy);
        
        expect(result).toBe('primary');
      });
    });
    
    describe('withFallback()', () => {
      it('should create strategy without shouldDegrade', async () => {
        const degradation = new GracefulDegradation();
        
        const strategy = GracefulDegradation.withFallback(
          () => Promise.resolve('primary'),
          () => Promise.resolve('fallback')
        );
        
        const result = await degradation.execute(strategy);
        
        expect(result).toBe('primary');
        expect(strategy.shouldDegrade).toBeUndefined();
      });
    });
    
    describe('withCondition()', () => {
      it('should create strategy with custom condition', async () => {
        const degradation = new GracefulDegradation();
        let shouldDegrade = false;
        
        const strategy = GracefulDegradation.withCondition(
          () => shouldDegrade,
          () => Promise.resolve('primary'),
          () => Promise.resolve('fallback')
        );
        
        // First call: condition false
        let result = await degradation.execute(strategy);
        expect(result).toBe('primary');
        
        // Second call: condition true
        shouldDegrade = true;
        result = await degradation.execute(strategy);
        expect(result).toBe('fallback');
      });
    });
  });
  
  describe('CommonFallbacks', () => {
    describe('emptyConcepts()', () => {
      it('should return empty concept structure', async () => {
        const result = await CommonFallbacks.emptyConcepts();
        
        expect(result).toEqual({
          primary: [],
          technical: [],
          related: [],
          categories: [],
        });
      });
    });
    
    describe('emptySearchResults()', () => {
      it('should return empty array', async () => {
        const result = await CommonFallbacks.emptySearchResults();
        
        expect(result).toEqual([]);
      });
    });
    
    describe('cachedOrDefault()', () => {
      it('should return cached value if exists', async () => {
        const cache = new Map<string, string>();
        cache.set('key1', 'cached value');
        
        const result = await CommonFallbacks.cachedOrDefault(
          cache,
          'key1',
          'default'
        );
        
        expect(result).toBe('cached value');
      });
      
      it('should return default value if not cached', async () => {
        const cache = new Map<string, string>();
        
        const result = await CommonFallbacks.cachedOrDefault(
          cache,
          'missing',
          'default'
        );
        
        expect(result).toBe('default');
      });
    });
    
    describe('staleData()', () => {
      it('should return stale data', async () => {
        const staleData = { value: 'old' };
        
        const result = await CommonFallbacks.staleData(staleData);
        
        expect(result).toBe(staleData);
      });
      
      it('should log warning when provided', async () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        
        await CommonFallbacks.staleData('data', 'This is stale');
        
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('This is stale')
        );
        
        warnSpy.mockRestore();
      });
    });
  });
  
  describe('Integration Scenarios', () => {
    it('should handle multiple operations with mixed results', async () => {
      const degradation = new GracefulDegradation();
      
      // 3 successes
      for (let i = 0; i < 3; i++) {
        await degradation.execute({
          primary: () => Promise.resolve('ok'),
          fallback: () => Promise.resolve('fallback'),
        });
      }
      
      // 2 failures
      for (let i = 0; i < 2; i++) {
        await degradation.execute({
          primary: () => Promise.reject(new Error('fail')),
          fallback: () => Promise.resolve('fallback'),
        });
      }
      
      const metrics = degradation.getMetrics();
      expect(metrics.totalOperations).toBe(5);
      expect(metrics.primarySuccesses).toBe(3);
      expect(metrics.primaryFailures).toBe(2);
      expect(metrics.fallbackUsed).toBe(2);
      expect(metrics.degradationRate).toBe(40); // 2/5 = 40%
    });
    
    it('should work with real circuit breaker integration', async () => {
      const circuitBreaker = new CircuitBreaker('llm-api', {
        failureThreshold: 2,
      });
      const degradation = new GracefulDegradation();
      
      // Fail twice to open circuit
      for (let i = 0; i < 2; i++) {
        await expect(
          circuitBreaker.execute(() => Promise.reject(new Error('fail')))
        ).rejects.toThrow();
      }
      
      // Now use degradation with open circuit
      const result = await degradation.execute({
        primary: () => Promise.resolve('primary'),
        fallback: () => Promise.resolve('fallback'),
        shouldDegrade: () => circuitBreaker.isOpen(),
      });
      
      expect(result).toBe('fallback');
      expect(degradation.getMetrics().degradedModeActivations).toBe(1);
    });
  });
});







