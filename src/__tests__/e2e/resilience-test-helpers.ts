/**
 * Test helpers for resilience pattern E2E testing
 */

import type { CircuitBreaker, CircuitState } from '../../infrastructure/resilience/circuit-breaker.js';
import type { Bulkhead } from '../../infrastructure/resilience/bulkhead.js';

/**
 * Wait for circuit breaker to reach a specific state
 * 
 * @param cb Circuit breaker to monitor
 * @param targetState State to wait for
 * @param timeoutMs Maximum time to wait
 * @param checkIntervalMs How often to check (default: 100ms)
 */
export async function waitForCircuitState(
  cb: CircuitBreaker,
  targetState: CircuitState,
  timeoutMs: number,
  checkIntervalMs: number = 100
): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    if (cb.getState() === targetState) {
      return;
    }
    await sleep(checkIntervalMs);
  }
  
  throw new Error(
    `Circuit breaker did not reach state '${targetState}' within ${timeoutMs}ms. ` +
    `Current state: '${cb.getState()}'`
  );
}

/**
 * Assert bulkhead utilization
 * 
 * @param bh Bulkhead to check
 * @param expectedActive Expected active count
 * @param expectedQueued Expected queued count
 */
export function assertBulkheadUtilization(
  bh: Bulkhead,
  expectedActive: number,
  expectedQueued: number
): void {
  const metrics = bh.getMetrics();
  
  if (metrics.active !== expectedActive) {
    throw new Error(
      `Expected ${expectedActive} active operations, but got ${metrics.active}`
    );
  }
  
  if (metrics.queued !== expectedQueued) {
    throw new Error(
      `Expected ${expectedQueued} queued operations, but got ${metrics.queued}`
    );
  }
}

/**
 * Assert bulkhead utilization within range
 * 
 * @param bh Bulkhead to check
 * @param minActive Minimum active count
 * @param maxActive Maximum active count
 */
export function assertBulkheadActiveInRange(
  bh: Bulkhead,
  minActive: number,
  maxActive: number
): void {
  const metrics = bh.getMetrics();
  
  if (metrics.active < minActive || metrics.active > maxActive) {
    throw new Error(
      `Expected active operations between ${minActive}-${maxActive}, but got ${metrics.active}`
    );
  }
}

/**
 * Measure operation duration
 * 
 * @param operation Operation to measure
 * @returns Duration in milliseconds
 */
export async function measureDuration<T>(
  operation: () => Promise<T>
): Promise<{ result: T | null; duration: number; error: Error | null }> {
  const start = Date.now();
  let result: T | null = null;
  let error: Error | null = null;
  
  try {
    result = await operation();
  } catch (e) {
    error = e as Error;
  }
  
  const duration = Date.now() - start;
  
  return { result, duration, error };
}

/**
 * Assert operation duration is within range
 * 
 * @param duration Measured duration
 * @param minMs Minimum expected duration
 * @param maxMs Maximum expected duration
 */
export function assertDurationInRange(
  duration: number,
  minMs: number,
  maxMs: number
): void {
  if (duration < minMs || duration > maxMs) {
    throw new Error(
      `Expected duration between ${minMs}-${maxMs}ms, but got ${duration}ms`
    );
  }
}

/**
 * Wait for a condition to become true
 * 
 * @param condition Function that returns true when condition is met
 * @param timeoutMs Maximum time to wait
 * @param checkIntervalMs How often to check
 */
export async function waitForCondition(
  condition: () => boolean | Promise<boolean>,
  timeoutMs: number,
  checkIntervalMs: number = 100
): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    if (await condition()) {
      return;
    }
    await sleep(checkIntervalMs);
  }
  
  throw new Error(`Condition not met within ${timeoutMs}ms`);
}

/**
 * Sleep for specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a batch of concurrent operations
 * 
 * @param count Number of operations
 * @param operation Operation to execute
 * @returns Array of settled promises
 */
export async function executeConcurrentBatch<T>(
  count: number,
  operation: (index: number) => Promise<T>
): Promise<PromiseSettledResult<T>[]> {
  const promises = Array.from({ length: count }, (_, i) => operation(i));
  return Promise.allSettled(promises);
}

/**
 * Count successful and failed operations from settled results
 */
export function countResults<T>(results: PromiseSettledResult<T>[]) {
  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  
  return { successful, failed, total: results.length };
}






