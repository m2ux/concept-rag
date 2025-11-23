/**
 * Observability infrastructure exports.
 * 
 * This module provides structured logging and performance instrumentation
 * for visibility into system behavior.
 */

export { ILogger, LogLevel, LogEntry, StructuredLogger, createLogger } from './logger';
export { generateTraceId, setTraceId, getTraceId, clearTraceId, withTraceId } from './trace-id';
export { PerformanceInstrumentation, PerformanceInstrumentor, createInstrumentor } from './instrumentation';


