/**
 * Trace ID generation and management for request correlation.
 */

import { randomBytes } from 'crypto';

/**
 * Generate a unique trace ID.
 */
export function generateTraceId(): string {
  return randomBytes(16).toString('hex');
}

/**
 * Store for current trace ID (could be improved with AsyncLocalStorage).
 */
let currentTraceId: string | undefined;

/**
 * Set the current trace ID.
 */
export function setTraceId(traceId: string): void {
  currentTraceId = traceId;
}

/**
 * Get the current trace ID.
 */
export function getTraceId(): string | undefined {
  return currentTraceId;
}

/**
 * Clear the current trace ID.
 */
export function clearTraceId(): void {
  currentTraceId = undefined;
}

/**
 * Execute a function with a trace ID.
 */
export async function withTraceId<T>(
  fn: () => Promise<T>
): Promise<T> {
  const traceId = generateTraceId();
  setTraceId(traceId);
  
  try {
    return await fn();
  } finally {
    clearTraceId();
  }
}


