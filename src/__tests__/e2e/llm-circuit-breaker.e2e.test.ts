/**
 * E2E Test: LLM Circuit Breaker
 * 
 * Tests the full circuit breaker lifecycle with simulated LLM service:
 * 1. Normal operation (circuit closed)
 * 2. Service failures (circuit opens)
 * 3. Fast-fail rejections (circuit open)
 * 4. Recovery detection (circuit half-open)
 * 5. Successful recovery (circuit closed)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ResilientExecutor, ResilienceProfiles } from '../../infrastructure/resilience/resilient-executor.js';
import { CircuitBreakerOpenError } from '../../infrastructure/resilience/errors.js';
import { RetryService } from '../../infrastructure/utils/retry-service.js';
import { MockLLMService } from './mock-service-framework.js';
import { waitForCircuitState, measureDuration, sleep } from './resilience-test-helpers.js';

describe('E2E: LLM Circuit Breaker', () => {
  let executor: ResilientExecutor;
  let mockLLM: MockLLMService;
  
  beforeEach(() => {
    executor = new ResilientExecutor(new RetryService());
    mockLLM = new MockLLMService();
  });
  
  it('should protect against sustained LLM failures and recover automatically', async () => {
    const operationName = 'llm_circuit_breaker_e2e';
    
    // Configure with shorter timeouts for faster test execution
    const config = {
      ...ResilienceProfiles.LLM_API,
      name: operationName,
      circuitBreaker: {
        failureThreshold: 5,
        successThreshold: 2,
        timeout: 5000, // 5 seconds instead of 60 for faster test
        resetTimeout: 1000,
      },
      retry: undefined, // Disable retry for clearer circuit breaker behavior
    };
    
    // ===== Phase 1: Normal Operation - Circuit Closed =====
    console.log('Phase 1: Testing normal operation...');
    mockLLM.setHealthy(true);
    
    for (let i = 0; i < 3; i++) {
      const result = await executor.execute(
        () => mockLLM.extractConcepts('test text'),
        config
      );
      expect(result.primary).toHaveLength(2);
    }
    
    const cb = executor.getCircuitBreaker(operationName);
    expect(cb).toBeDefined();
    expect(cb!.isClosed()).toBe(true);
    
    const metrics1 = cb!.getMetrics();
    expect(metrics1.totalRequests).toBe(3);
    expect(metrics1.totalSuccesses).toBe(3);
    expect(metrics1.totalFailures).toBe(0);
    
    console.log('✓ Phase 1 complete: Circuit is closed, all operations successful');
    
    // ===== Phase 2: Service Degradation - Circuit Opens =====
    console.log('Phase 2: Simulating service failures...');
    mockLLM.setHealthy(false);
    mockLLM.setError(new Error('LLM API unavailable'));
    
    // Execute operations until circuit opens (5 failures)
    for (let i = 0; i < 5; i++) {
      await expect(
        executor.execute(
          () => mockLLM.extractConcepts('test text'),
          config
        )
      ).rejects.toThrow('LLM API unavailable');
    }
    
    expect(cb!.isOpen()).toBe(true);
    
    const metrics2 = cb!.getMetrics();
    expect(metrics2.totalFailures).toBe(5);
    expect(metrics2.state).toBe('open');
    
    console.log('✓ Phase 2 complete: Circuit opened after 5 failures');
    
    // ===== Phase 3: Fast-Fail While Circuit Open =====
    console.log('Phase 3: Testing fast-fail behavior...');
    
    const { duration, error } = await measureDuration(() =>
      executor.execute(
        () => mockLLM.extractConcepts('test text'),
        config
      )
    );
    
    expect(error).toBeInstanceOf(CircuitBreakerOpenError);
    expect(duration).toBeLessThan(10); // Should fail in <10ms
    
    const metrics3 = cb!.getMetrics();
    expect(metrics3.rejections).toBe(1);
    
    console.log(`✓ Phase 3 complete: Fast-fail in ${duration}ms (circuit open)`);
    
    // ===== Phase 4: Wait for Recovery Window =====
    console.log('Phase 4: Waiting for circuit timeout (5s)...');
    
    // Restore service health before recovery window
    mockLLM.setHealthy(true);
    
    // Wait for circuit timeout to allow transition to half-open
    await sleep(5100); // Slightly more than timeout
    
    // Circuit should report half-open now
    expect(cb!.getState()).toBe('half-open');
    
    console.log('✓ Phase 4 complete: Circuit transitioned to half-open');
    
    // ===== Phase 5: Recovery Testing - Circuit Closes =====
    console.log('Phase 5: Testing recovery...');
    
    // Execute successful operations to close circuit (need 2 successes)
    const result1 = await executor.execute(
      () => mockLLM.extractConcepts('test text'),
      config
    );
    expect(result1.primary).toHaveLength(2);
    
    // Circuit should still be half-open after 1 success
    expect(cb!.isHalfOpen()).toBe(true);
    
    const result2 = await executor.execute(
      () => mockLLM.extractConcepts('test text'),
      config
    );
    expect(result2.primary).toHaveLength(2);
    
    // Circuit should be closed after 2 successes
    expect(cb!.isClosed()).toBe(true);
    
    const finalMetrics = cb!.getMetrics();
    expect(finalMetrics.state).toBe('closed');
    expect(finalMetrics.totalSuccesses).toBeGreaterThan(3);
    
    console.log('✓ Phase 5 complete: Circuit recovered and closed');
    
    // ===== Phase 6: Verify Normal Operation Resumed =====
    console.log('Phase 6: Verifying normal operation resumed...');
    
    for (let i = 0; i < 3; i++) {
      const result = await executor.execute(
        () => mockLLM.extractConcepts('test text'),
        config
      );
      expect(result.primary).toHaveLength(2);
    }
    
    expect(cb!.isClosed()).toBe(true);
    
    console.log('✓ Phase 6 complete: Normal operation resumed successfully');
    
    // ===== Final Verification =====
    const stats = mockLLM.getStats();
    console.log('Final stats:', {
      circuitState: cb!.getState(),
      totalRequests: finalMetrics.totalRequests,
      totalSuccesses: finalMetrics.totalSuccesses,
      totalFailures: finalMetrics.totalFailures,
      rejections: finalMetrics.rejections,
      mockServiceCalls: stats.callCount,
    });
    
    expect(stats.successCount).toBeGreaterThan(0);
    expect(stats.failureCount).toBe(5); // Only the 5 failures that opened the circuit
  }, 30000); // 30 second timeout for full test
  
  it('should handle intermittent failures without opening circuit', async () => {
    const operationName = 'llm_intermittent_failures';
    
    const config = {
      ...ResilienceProfiles.LLM_API,
      name: operationName,
      circuitBreaker: {
        failureThreshold: 5,
        successThreshold: 2,
        timeout: 5000,
        resetTimeout: 1000,
      },
      retry: undefined,
    };
    
    mockLLM.setHealthy(true);
    
    // Alternate between success and failure (not consecutive)
    for (let i = 0; i < 10; i++) {
      mockLLM.setHealthy(i % 2 === 0); // Every other call fails
      
      if (i % 2 === 0) {
        const result = await executor.execute(
          () => mockLLM.extractConcepts('test'),
          config
        );
        expect(result).toBeDefined();
      } else {
        await expect(
          executor.execute(
            () => mockLLM.extractConcepts('test'),
            config
          )
        ).rejects.toThrow();
      }
    }
    
    const cb = executor.getCircuitBreaker(operationName);
    
    // Circuit should still be closed (successes reset failure count)
    expect(cb!.isClosed()).toBe(true);
    
    const metrics = cb!.getMetrics();
    expect(metrics.totalSuccesses).toBe(5);
    expect(metrics.totalFailures).toBe(5);
  }, 15000);
  
  it('should track metrics accurately through full cycle', async () => {
    const operationName = 'llm_metrics_tracking';
    
    const config = {
      ...ResilienceProfiles.LLM_API,
      name: operationName,
      circuitBreaker: {
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 2000,
        resetTimeout: 500,
      },
      retry: undefined,
    };
    
    mockLLM.setHealthy(true);
    
    // Initial successes
    await executor.execute(() => mockLLM.extractConcepts('test'), config);
    await executor.execute(() => mockLLM.extractConcepts('test'), config);
    
    const cb = executor.getCircuitBreaker(operationName)!;
    let metrics = cb.getMetrics();
    
    expect(metrics.totalRequests).toBe(2);
    expect(metrics.totalSuccesses).toBe(2);
    expect(metrics.totalFailures).toBe(0);
    expect(metrics.rejections).toBe(0);
    
    // Trigger failures
    mockLLM.setHealthy(false);
    for (let i = 0; i < 3; i++) {
      await expect(
        executor.execute(() => mockLLM.extractConcepts('test'), config)
      ).rejects.toThrow();
    }
    
    metrics = cb.getMetrics();
    expect(metrics.totalRequests).toBe(5);
    expect(metrics.totalSuccesses).toBe(2);
    expect(metrics.totalFailures).toBe(3);
    expect(metrics.state).toBe('open');
    
    // Rejection while open
    await expect(
      executor.execute(() => mockLLM.extractConcepts('test'), config)
    ).rejects.toThrow(CircuitBreakerOpenError);
    
    metrics = cb.getMetrics();
    expect(metrics.rejections).toBe(1);
    expect(metrics.totalRequests).toBe(6); // Rejection counts as request
    
    // Wait and recover
    mockLLM.setHealthy(true);
    await sleep(2100);
    
    await executor.execute(() => mockLLM.extractConcepts('test'), config);
    await executor.execute(() => mockLLM.extractConcepts('test'), config);
    
    metrics = cb.getMetrics();
    expect(metrics.state).toBe('closed');
    expect(metrics.totalSuccesses).toBe(4);
    expect(metrics.failures).toBe(0); // Reset on recovery
  }, 15000);
});






