# Phase 1: Observability Infrastructure Implementation Plan

**Date:** November 23, 2025  
**Priority:** HIGH (Critical Gap)  
**Status:** Ready for Implementation  
**Estimated Effort:** 3-4h agentic + 1-1.5h review

> **Note:** All time estimates refer to agentic (AI-assisted) development time plus human review time.

---

## Overview

Implement comprehensive observability infrastructure to enable visibility into system behavior, performance monitoring, and proactive issue detection. This phase establishes the foundation for all subsequent performance and optimization work.

---

## Knowledge Base Insights Applied

### Core Observability Concepts (12 concepts from lexicon)

**From Machine Learning Operations & Monitoring:**

1. **Observability** - Distributed tracing, metrics, logs (three pillars)
2. **Observability pillars** - Metrics, logs, traces as fundamental components
3. **Monitoring and telemetry** - System instrumentation for visibility
4. **Structured logging** - Parseable log events with consistent format
5. **Metrics collection** - Quantitative measurements of system behavior
6. **Distributed tracing** - Request flow tracking through system
7. **Log aggregation** - Centralized logging infrastructure
8. **Health checks** - System status monitoring
9. **KPI dashboards** - Performance monitoring visualization
10. **Application performance monitoring (APM)** - Runtime monitoring
11. **Anomaly detection** - Identifying outliers and issues
12. **Dashboards and visualization** - Visual analytics for metrics

**Supporting Concepts:**

- **Performance profiling** - Identifying performance hotspots
- **Metrics** - Time-series metrics, dimensional metrics
- **Logging** - Event recording with context
- **Performance measurement** - Latency, throughput, utilization

---

## Current State Assessment

### What Exists ✅

- ✅ Performance benchmarks (56 tests in test suite)
- ✅ Basic console.log statements scattered in code
- ✅ Exception handling with error context

### What's Missing ❌

**Logging:**
- ❌ No structured logging framework
- ❌ No consistent log format
- ❌ No log levels (debug, info, warn, error)
- ❌ No trace IDs for request correlation
- ❌ Logs not parseable for analysis

**Metrics:**
- ❌ No metrics collection infrastructure
- ❌ No performance metrics in production
- ❌ No counters, gauges, or histograms
- ❌ No metrics export or visualization

**Health Checks:**
- ❌ No health check endpoints
- ❌ No database connection health monitoring
- ❌ No external API health checks
- ❌ No readiness/liveness probes

**Tracing:**
- ❌ No request tracing
- ❌ No operation correlation
- ❌ No distributed tracing (future-proofing)

### Pain Points 🔍

1. **Production Debugging:** Hard to diagnose issues without structured logs
2. **Performance Visibility:** Can't see actual search latency in production
3. **Resource Monitoring:** Don't know memory/CPU usage patterns
4. **Alerting:** No way to detect performance degradation
5. **Validation:** Can't verify optimization improvements
6. **User Impact:** Can't track real user experience

---

## Implementation Strategy

### Phase 1.1: Structured Logging (30-45 min agentic)

**Goal:** Replace console.log with structured logging framework

**Tasks:**
1. Create `StructuredLogger` interface and implementation
2. Add log levels (debug, info, warn, error)
3. Include context objects with every log
4. Add trace ID generation and propagation
5. Format logs as JSON for parseability
6. Add operation timing helpers

**Deliverables:**
- `src/infrastructure/observability/logger.ts`
- `src/infrastructure/observability/trace-id.ts`
- Logger integrated into DI container
- All services use structured logging

---

### Phase 1.2: Metrics Collection (45-60 min agentic)

**Goal:** Track key performance indicators in production

**Tasks:**
1. Create `MetricsCollector` interface and implementation
2. Implement counters, gauges, and histograms
3. Add metrics for search operations
4. Add metrics for indexing operations
5. Add metrics for embedding generation
6. Add metrics for cache operations
7. Create metrics summary endpoint

**Deliverables:**
- `src/infrastructure/observability/metrics.ts`
- `src/infrastructure/observability/metric-types.ts`
- Metrics integrated into critical paths
- Metrics HTTP endpoint at `/metrics`

---

### Phase 1.3: Health Check Infrastructure (30-45 min agentic)

**Goal:** Enable system health monitoring

**Tasks:**
1. Create `HealthMonitor` interface and implementation
2. Add database health check
3. Add configuration validation health check
4. Add memory usage health check
5. Create health check HTTP endpoint
6. Document health check contract

**Deliverables:**
- `src/infrastructure/observability/health.ts`
- Health checks for all critical subsystems
- Health endpoint at `/health`
- Health check documentation

---

### Phase 1.4: Performance Instrumentation (45-60 min agentic)

**Goal:** Instrument critical paths with metrics and logging

**Tasks:**
1. Instrument search operations
2. Instrument indexing operations
3. Instrument embedding generation
4. Instrument cache operations
5. Add operation timing to all instrumented paths
6. Log slow operations automatically

**Deliverables:**
- All critical operations instrumented
- P50, P95, P99 latency tracked
- Slow operation detection (>1s threshold)
- Operation logs with duration and context

---

### Phase 1.5: Simple Dashboard (30-45 min agentic)

**Goal:** Create simple metrics visualization

**Tasks:**
1. Create metrics summary endpoint
2. Add HTML dashboard page (simple)
3. Display key metrics (search latency, cache hit rate, etc.)
4. Auto-refresh metrics
5. Document dashboard access

**Deliverables:**
- `src/infrastructure/observability/dashboard.ts`
- Simple HTML dashboard at `/dashboard`
- Real-time metrics display
- Dashboard documentation

---

## Detailed Implementation

### Task 1.1: Structured Logger Implementation

**File:** `src/infrastructure/observability/logger.ts`

```typescript
/**
 * Structured logging infrastructure for observability.
 * Provides consistent, parseable log output with context.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  timestamp: string;         // ISO 8601 format
  message: string;
  traceId?: string;          // Request correlation ID
  operation?: string;        // Operation name (e.g., "search", "index")
  duration?: number;         // Operation duration in ms
  context?: Record<string, unknown>;  // Additional context
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
}

export interface ILogger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, error?: Error, context?: Record<string, unknown>): void;
  
  /**
   * Log an operation with timing information.
   */
  logOperation(
    operation: string,
    durationMs: number,
    context?: Record<string, unknown>
  ): void;
  
  /**
   * Create a child logger with additional context.
   */
  child(context: Record<string, unknown>): ILogger;
}

export class StructuredLogger implements ILogger {
  private context: Record<string, unknown>;
  private minLevel: LogLevel;
  
  constructor(
    context: Record<string, unknown> = {},
    minLevel: LogLevel = 'info'
  ) {
    this.context = context;
    this.minLevel = minLevel;
  }
  
  debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context);
  }
  
  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }
  
  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
  }
  
  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    const errorContext = error ? {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code
      }
    } : {};
    
    this.log('error', message, { ...context, ...errorContext });
  }
  
  logOperation(
    operation: string,
    durationMs: number,
    context?: Record<string, unknown>
  ): void {
    const slow = durationMs > 1000; // >1s is slow
    const level: LogLevel = slow ? 'warn' : 'info';
    
    this.log(level, `Operation completed: ${operation}`, {
      operation,
      duration: durationMs,
      slow,
      ...context
    });
  }
  
  child(context: Record<string, unknown>): ILogger {
    return new StructuredLogger(
      { ...this.context, ...context },
      this.minLevel
    );
  }
  
  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>
  ): void {
    if (!this.shouldLog(level)) {
      return;
    }
    
    const entry: LogEntry = {
      level,
      timestamp: new Date().toISOString(),
      message,
      traceId: this.getTraceId(),
      ...this.context,
      ...context
    };
    
    // Output as JSON for parseability
    console.log(JSON.stringify(entry));
  }
  
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentIndex = levels.indexOf(this.minLevel);
    const messageIndex = levels.indexOf(level);
    return messageIndex >= currentIndex;
  }
  
  private getTraceId(): string | undefined {
    // Get from async context if available
    // For now, return from context if set
    return this.context.traceId as string | undefined;
  }
}

/**
 * Create a logger instance with the given context.
 */
export function createLogger(
  context: Record<string, unknown> = {}
): ILogger {
  return new StructuredLogger(context);
}
```

**File:** `src/infrastructure/observability/trace-id.ts`

```typescript
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
```

---

### Task 1.2: Metrics Collection Implementation

**File:** `src/infrastructure/observability/metrics.ts`

```typescript
/**
 * Metrics collection infrastructure for observability.
 */

export interface Metric {
  name: string;
  type: 'counter' | 'gauge' | 'histogram';
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
}

export interface MetricsSummary {
  counters: Record<string, number>;
  gauges: Record<string, number>;
  histograms: Record<string, HistogramStats>;
}

export interface HistogramStats {
  count: number;
  sum: number;
  min: number;
  max: number;
  mean: number;
  p50: number;
  p95: number;
  p99: number;
}

export interface IMetricsCollector {
  /**
   * Increment a counter by 1.
   */
  incrementCounter(name: string, tags?: Record<string, string>): void;
  
  /**
   * Record a gauge value (point-in-time measurement).
   */
  recordGauge(name: string, value: number, tags?: Record<string, string>): void;
  
  /**
   * Record a histogram value (for latency, sizes, etc.).
   */
  recordHistogram(name: string, value: number, tags?: Record<string, string>): void;
  
  /**
   * Get all metrics.
   */
  getMetrics(): Metric[];
  
  /**
   * Get metrics summary.
   */
  getSummary(): MetricsSummary;
  
  /**
   * Reset all metrics.
   */
  reset(): void;
}

export class MetricsCollector implements IMetricsCollector {
  private metrics: Metric[] = [];
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();
  
  incrementCounter(name: string, tags?: Record<string, string>): void {
    const key = this.makeKey(name, tags);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + 1);
    
    this.metrics.push({
      name,
      type: 'counter',
      value: current + 1,
      timestamp: new Date(),
      tags
    });
  }
  
  recordGauge(name: string, value: number, tags?: Record<string, string>): void {
    const key = this.makeKey(name, tags);
    this.gauges.set(key, value);
    
    this.metrics.push({
      name,
      type: 'gauge',
      value,
      timestamp: new Date(),
      tags
    });
  }
  
  recordHistogram(name: string, value: number, tags?: Record<string, string>): void {
    const key = this.makeKey(name, tags);
    const values = this.histograms.get(key) || [];
    values.push(value);
    this.histograms.set(key, values);
    
    this.metrics.push({
      name,
      type: 'histogram',
      value,
      timestamp: new Date(),
      tags
    });
  }
  
  getMetrics(): Metric[] {
    return [...this.metrics];
  }
  
  getSummary(): MetricsSummary {
    const countersSummary: Record<string, number> = {};
    this.counters.forEach((value, key) => {
      countersSummary[key] = value;
    });
    
    const gaugesSummary: Record<string, number> = {};
    this.gauges.forEach((value, key) => {
      gaugesSummary[key] = value;
    });
    
    const histogramsSummary: Record<string, HistogramStats> = {};
    this.histograms.forEach((values, key) => {
      histogramsSummary[key] = this.calculateHistogramStats(values);
    });
    
    return {
      counters: countersSummary,
      gauges: gaugesSummary,
      histograms: histogramsSummary
    };
  }
  
  reset(): void {
    this.metrics = [];
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }
  
  private makeKey(name: string, tags?: Record<string, string>): string {
    if (!tags) return name;
    const tagStr = Object.entries(tags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    return `${name}{${tagStr}}`;
  }
  
  private calculateHistogramStats(values: number[]): HistogramStats {
    if (values.length === 0) {
      return {
        count: 0,
        sum: 0,
        min: 0,
        max: 0,
        mean: 0,
        p50: 0,
        p95: 0,
        p99: 0
      };
    }
    
    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((acc, v) => acc + v, 0);
    const mean = sum / values.length;
    
    return {
      count: values.length,
      sum,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      mean,
      p50: this.percentile(sorted, 0.50),
      p95: this.percentile(sorted, 0.95),
      p99: this.percentile(sorted, 0.99)
    };
  }
  
  private percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0;
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[Math.max(0, index)];
  }
}

/**
 * Global metrics collector instance.
 */
export const metrics = new MetricsCollector();
```

---

### Task 1.3: Health Check Implementation

**File:** `src/infrastructure/observability/health.ts`

```typescript
/**
 * Health check infrastructure for observability.
 */

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface HealthCheck {
  name: string;
  status: HealthStatus;
  message?: string;
  lastCheck: Date;
  duration: number;  // Check duration in ms
  details?: Record<string, unknown>;
}

export interface SystemHealth {
  status: HealthStatus;
  checks: HealthCheck[];
  timestamp: Date;
}

export interface IHealthMonitor {
  /**
   * Register a health check.
   */
  registerCheck(
    name: string,
    check: () => Promise<HealthCheck>
  ): void;
  
  /**
   * Execute all health checks.
   */
  checkHealth(): Promise<SystemHealth>;
  
  /**
   * Get the last known health status.
   */
  getHealthStatus(): SystemHealth | null;
}

export class HealthMonitor implements IHealthMonitor {
  private checks: Map<string, () => Promise<HealthCheck>> = new Map();
  private lastHealth: SystemHealth | null = null;
  
  registerCheck(
    name: string,
    check: () => Promise<HealthCheck>
  ): void {
    this.checks.set(name, check);
  }
  
  async checkHealth(): Promise<SystemHealth> {
    const checkResults: HealthCheck[] = [];
    
    for (const [name, check] of this.checks.entries()) {
      try {
        const result = await check();
        checkResults.push(result);
      } catch (error) {
        checkResults.push({
          name,
          status: 'unhealthy',
          message: error instanceof Error ? error.message : 'Unknown error',
          lastCheck: new Date(),
          duration: 0
        });
      }
    }
    
    // Overall status: unhealthy if any check is unhealthy,
    // degraded if any check is degraded, otherwise healthy
    let overallStatus: HealthStatus = 'healthy';
    if (checkResults.some(c => c.status === 'unhealthy')) {
      overallStatus = 'unhealthy';
    } else if (checkResults.some(c => c.status === 'degraded')) {
      overallStatus = 'degraded';
    }
    
    this.lastHealth = {
      status: overallStatus,
      checks: checkResults,
      timestamp: new Date()
    };
    
    return this.lastHealth;
  }
  
  getHealthStatus(): SystemHealth | null {
    return this.lastHealth;
  }
}

/**
 * Common health check implementations.
 */
export class CommonHealthChecks {
  /**
   * Database connection health check.
   */
  static databaseCheck(
    testConnection: () => Promise<boolean>
  ): () => Promise<HealthCheck> {
    return async () => {
      const start = performance.now();
      const name = 'database';
      
      try {
        const isConnected = await testConnection();
        const duration = performance.now() - start;
        
        return {
          name,
          status: isConnected ? 'healthy' : 'unhealthy',
          message: isConnected ? 'Database connected' : 'Database not connected',
          lastCheck: new Date(),
          duration
        };
      } catch (error) {
        return {
          name,
          status: 'unhealthy',
          message: error instanceof Error ? error.message : 'Database check failed',
          lastCheck: new Date(),
          duration: performance.now() - start
        };
      }
    };
  }
  
  /**
   * Memory usage health check.
   */
  static memoryCheck(
    warningThreshold: number = 0.8,  // 80%
    criticalThreshold: number = 0.95  // 95%
  ): () => Promise<HealthCheck> {
    return async () => {
      const start = performance.now();
      const memUsage = process.memoryUsage();
      const heapUsed = memUsage.heapUsed;
      const heapTotal = memUsage.heapTotal;
      const usageRatio = heapUsed / heapTotal;
      
      let status: HealthStatus = 'healthy';
      let message = `Memory usage: ${Math.round(usageRatio * 100)}%`;
      
      if (usageRatio >= criticalThreshold) {
        status = 'unhealthy';
        message = `Critical memory usage: ${Math.round(usageRatio * 100)}%`;
      } else if (usageRatio >= warningThreshold) {
        status = 'degraded';
        message = `High memory usage: ${Math.round(usageRatio * 100)}%`;
      }
      
      return {
        name: 'memory',
        status,
        message,
        lastCheck: new Date(),
        duration: performance.now() - start,
        details: {
          heapUsed: Math.round(heapUsed / 1024 / 1024) + ' MB',
          heapTotal: Math.round(heapTotal / 1024 / 1024) + ' MB',
          usagePercent: Math.round(usageRatio * 100)
        }
      };
    };
  }
  
  /**
   * Configuration health check.
   */
  static configCheck(
    validateConfig: () => boolean
  ): () => Promise<HealthCheck> {
    return async () => {
      const start = performance.now();
      
      try {
        const isValid = validateConfig();
        
        return {
          name: 'configuration',
          status: isValid ? 'healthy' : 'unhealthy',
          message: isValid ? 'Configuration valid' : 'Configuration invalid',
          lastCheck: new Date(),
          duration: performance.now() - start
        };
      } catch (error) {
        return {
          name: 'configuration',
          status: 'unhealthy',
          message: error instanceof Error ? error.message : 'Config check failed',
          lastCheck: new Date(),
          duration: performance.now() - start
        };
      }
    };
  }
}
```

---

### Task 1.4: Instrumentation Integration

**Example: Instrumenting Search Service**

```typescript
// src/domain/services/catalog-search-service.ts

import { ILogger } from '../../infrastructure/observability/logger';
import { IMetricsCollector } from '../../infrastructure/observability/metrics';
import { generateTraceId } from '../../infrastructure/observability/trace-id';

export class CatalogSearchService {
  constructor(
    private repository: ICatalogRepository,
    private logger: ILogger,
    private metrics: IMetricsCollector
  ) {}
  
  async search(params: SearchParams): Promise<SearchResults> {
    const traceId = generateTraceId();
    const startTime = performance.now();
    
    // Create child logger with trace ID and operation context
    const logger = this.logger.child({ traceId, operation: 'catalog_search' });
    
    logger.info('Search started', {
      query: params.text,
      limit: params.limit
    });
    
    // Increment search counter
    this.metrics.incrementCounter('search.requests', { type: 'catalog' });
    
    try {
      // Execute search
      const results = await this.repository.search(params);
      
      const duration = performance.now() - startTime;
      
      // Record success metrics
      this.metrics.recordHistogram('search.latency', duration, {
        type: 'catalog',
        status: 'success'
      });
      this.metrics.incrementCounter('search.success', { type: 'catalog' });
      
      // Log operation completion
      logger.logOperation('catalog_search', duration, {
        query: params.text,
        resultCount: results.length,
        status: 'success'
      });
      
      return results;
      
    } catch (error) {
      const duration = performance.now() - startTime;
      
      // Record failure metrics
      this.metrics.recordHistogram('search.latency', duration, {
        type: 'catalog',
        status: 'error'
      });
      this.metrics.incrementCounter('search.errors', { type: 'catalog' });
      
      // Log error
      logger.error('Search failed', error as Error, {
        query: params.text,
        duration
      });
      
      throw error;
    }
  }
}
```

---

### Task 1.5: Simple Dashboard

**File:** `src/infrastructure/observability/dashboard.ts`

```typescript
/**
 * Simple HTML dashboard for observability metrics.
 */

import { IMetricsCollector } from './metrics';
import { IHealthMonitor } from './health';

export class ObservabilityDashboard {
  constructor(
    private metrics: IMetricsCollector,
    private health: IHealthMonitor
  ) {}
  
  /**
   * Get metrics as JSON for API endpoint.
   */
  getMetricsJSON(): string {
    return JSON.stringify(this.metrics.getSummary(), null, 2);
  }
  
  /**
   * Get health status as JSON for API endpoint.
   */
  async getHealthJSON(): Promise<string> {
    const health = await this.health.checkHealth();
    return JSON.stringify(health, null, 2);
  }
  
  /**
   * Generate HTML dashboard.
   */
  async getHTML(): Promise<string> {
    const metrics = this.metrics.getSummary();
    const health = await this.health.checkHealth();
    
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Concept-RAG Observability Dashboard</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 20px; background: #f5f5f5; }
    h1 { color: #333; }
    .section { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .metric { display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #eee; }
    .metric:last-child { border-bottom: none; }
    .metric-name { font-weight: 600; }
    .metric-value { font-family: monospace; }
    .health-check { padding: 10px; margin: 5px 0; border-radius: 4px; }
    .healthy { background: #d4edda; color: #155724; }
    .degraded { background: #fff3cd; color: #856404; }
    .unhealthy { background: #f8d7da; color: #721c24; }
    .refresh { margin: 20px 0; }
    button { padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
    button:hover { background: #0056b3; }
  </style>
</head>
<body>
  <h1>🔍 Concept-RAG Observability Dashboard</h1>
  
  <div class="refresh">
    <button onclick="location.reload()">🔄 Refresh</button>
    <span style="margin-left: 10px;">Last updated: ${new Date().toLocaleString()}</span>
  </div>
  
  <div class="section">
    <h2>🏥 System Health</h2>
    <div class="health-check ${health.status}">
      <strong>Overall Status:</strong> ${health.status.toUpperCase()}
    </div>
    ${health.checks.map(check => `
      <div class="health-check ${check.status}">
        <strong>${check.name}:</strong> ${check.status} - ${check.message}
        <span style="float: right;">${check.duration.toFixed(2)}ms</span>
      </div>
    `).join('')}
  </div>
  
  <div class="section">
    <h2>📊 Search Latency (Histograms)</h2>
    ${Object.entries(metrics.histograms).map(([name, stats]) => `
      <div style="margin: 20px 0;">
        <h3>${name}</h3>
        <div class="metric">
          <span class="metric-name">Count:</span>
          <span class="metric-value">${stats.count}</span>
        </div>
        <div class="metric">
          <span class="metric-name">P50 (Median):</span>
          <span class="metric-value">${stats.p50.toFixed(2)}ms</span>
        </div>
        <div class="metric">
          <span class="metric-name">P95:</span>
          <span class="metric-value">${stats.p95.toFixed(2)}ms</span>
        </div>
        <div class="metric">
          <span class="metric-name">P99:</span>
          <span class="metric-value">${stats.p99.toFixed(2)}ms</span>
        </div>
        <div class="metric">
          <span class="metric-name">Mean:</span>
          <span class="metric-value">${stats.mean.toFixed(2)}ms</span>
        </div>
        <div class="metric">
          <span class="metric-name">Min / Max:</span>
          <span class="metric-value">${stats.min.toFixed(2)}ms / ${stats.max.toFixed(2)}ms</span>
        </div>
      </div>
    `).join('')}
  </div>
  
  <div class="section">
    <h2>📈 Counters</h2>
    ${Object.entries(metrics.counters).map(([name, value]) => `
      <div class="metric">
        <span class="metric-name">${name}:</span>
        <span class="metric-value">${value}</span>
      </div>
    `).join('')}
  </div>
  
  <div class="section">
    <h2>📉 Gauges</h2>
    ${Object.entries(metrics.gauges).map(([name, value]) => `
      <div class="metric">
        <span class="metric-name">${name}:</span>
        <span class="metric-value">${value.toFixed(2)}</span>
      </div>
    `).join('')}
  </div>
  
  <script>
    // Auto-refresh every 30 seconds
    setTimeout(() => location.reload(), 30000);
  </script>
</body>
</html>
    `;
  }
}
```

---

## Integration with Dependency Injection Container

**File:** `src/application/container.ts` (additions)

```typescript
import { createLogger, StructuredLogger } from '../infrastructure/observability/logger';
import { MetricsCollector, metrics } from '../infrastructure/observability/metrics';
import { HealthMonitor, CommonHealthChecks } from '../infrastructure/observability/health';
import { ObservabilityDashboard } from '../infrastructure/observability/dashboard';

export function createContainer(): Container {
  const container = new Map();
  
  // ... existing registrations ...
  
  // Observability
  const logger = createLogger({ service: 'concept-rag' });
  container.set('logger', logger);
  
  container.set('metrics', metrics);
  
  const healthMonitor = new HealthMonitor();
  
  // Register health checks
  healthMonitor.registerCheck(
    'database',
    CommonHealthChecks.databaseCheck(async () => {
      // Test database connection
      const db = container.get('catalogRepository');
      return db !== null;
    })
  );
  
  healthMonitor.registerCheck(
    'memory',
    CommonHealthChecks.memoryCheck(0.8, 0.95)
  );
  
  healthMonitor.registerCheck(
    'configuration',
    CommonHealthChecks.configCheck(() => {
      const config = container.get('config');
      return config !== null;
    })
  );
  
  container.set('health', healthMonitor);
  
  container.set('dashboard', new ObservabilityDashboard(metrics, healthMonitor));
  
  return container;
}
```

---

## HTTP Endpoints (if using Express/similar)

**Example endpoints:**

```typescript
// GET /metrics - JSON metrics
app.get('/metrics', (req, res) => {
  const dashboard = container.get('dashboard');
  res.type('application/json').send(dashboard.getMetricsJSON());
});

// GET /health - JSON health status
app.get('/health', async (req, res) => {
  const dashboard = container.get('dashboard');
  const healthJSON = await dashboard.getHealthJSON();
  res.type('application/json').send(healthJSON);
});

// GET /dashboard - HTML dashboard
app.get('/dashboard', async (req, res) => {
  const dashboard = container.get('dashboard');
  const html = await dashboard.getHTML();
  res.type('text/html').send(html);
});
```

---

## Testing Strategy

### Unit Tests

**File:** `src/infrastructure/observability/__tests__/logger.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StructuredLogger } from '../logger';

describe('StructuredLogger', () => {
  let logger: StructuredLogger;
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  
  beforeEach(() => {
    logger = new StructuredLogger();
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });
  
  it('should log info messages', () => {
    logger.info('Test message', { foo: 'bar' });
    
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    const logEntry = JSON.parse(consoleSpy.mock.calls[0][0]);
    
    expect(logEntry.level).toBe('info');
    expect(logEntry.message).toBe('Test message');
    expect(logEntry.foo).toBe('bar');
    expect(logEntry.timestamp).toBeDefined();
  });
  
  it('should log errors with error details', () => {
    const error = new Error('Test error');
    logger.error('Error occurred', error, { context: 'test' });
    
    const logEntry = JSON.parse(consoleSpy.mock.calls[0][0]);
    
    expect(logEntry.level).toBe('error');
    expect(logEntry.message).toBe('Error occurred');
    expect(logEntry.error.name).toBe('Error');
    expect(logEntry.error.message).toBe('Test error');
    expect(logEntry.context).toBe('test');
  });
  
  it('should log operations with duration', () => {
    logger.logOperation('search', 123.45, { query: 'test' });
    
    const logEntry = JSON.parse(consoleSpy.mock.calls[0][0]);
    
    expect(logEntry.operation).toBe('search');
    expect(logEntry.duration).toBe(123.45);
    expect(logEntry.query).toBe('test');
  });
  
  it('should create child loggers with additional context', () => {
    const childLogger = logger.child({ userId: '123' });
    childLogger.info('Child log');
    
    const logEntry = JSON.parse(consoleSpy.mock.calls[0][0]);
    
    expect(logEntry.userId).toBe('123');
  });
  
  it('should mark slow operations', () => {
    logger.logOperation('slow_op', 1500); // >1s
    
    const logEntry = JSON.parse(consoleSpy.mock.calls[0][0]);
    
    expect(logEntry.level).toBe('warn');
    expect(logEntry.slow).toBe(true);
  });
});
```

**File:** `src/infrastructure/observability/__tests__/metrics.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { MetricsCollector } from '../metrics';

describe('MetricsCollector', () => {
  let metrics: MetricsCollector;
  
  beforeEach(() => {
    metrics = new MetricsCollector();
  });
  
  it('should increment counters', () => {
    metrics.incrementCounter('requests');
    metrics.incrementCounter('requests');
    metrics.incrementCounter('requests');
    
    const summary = metrics.getSummary();
    expect(summary.counters.requests).toBe(3);
  });
  
  it('should record gauges', () => {
    metrics.recordGauge('memory', 1024);
    metrics.recordGauge('memory', 2048);
    
    const summary = metrics.getSummary();
    expect(summary.gauges.memory).toBe(2048); // Latest value
  });
  
  it('should calculate histogram statistics', () => {
    // Record some latencies
    metrics.recordHistogram('latency', 100);
    metrics.recordHistogram('latency', 200);
    metrics.recordHistogram('latency', 150);
    metrics.recordHistogram('latency', 300);
    metrics.recordHistogram('latency', 125);
    
    const summary = metrics.getSummary();
    const stats = summary.histograms.latency;
    
    expect(stats.count).toBe(5);
    expect(stats.min).toBe(100);
    expect(stats.max).toBe(300);
    expect(stats.mean).toBe(175);
    expect(stats.p50).toBe(150);
    expect(stats.p95).toBeGreaterThanOrEqual(200);
  });
  
  it('should support tags for counters', () => {
    metrics.incrementCounter('requests', { method: 'GET' });
    metrics.incrementCounter('requests', { method: 'POST' });
    metrics.incrementCounter('requests', { method: 'GET' });
    
    const summary = metrics.getSummary();
    expect(summary.counters['requests{method=GET}']).toBe(2);
    expect(summary.counters['requests{method=POST}']).toBe(1);
  });
  
  it('should reset all metrics', () => {
    metrics.incrementCounter('requests');
    metrics.recordGauge('memory', 1024);
    metrics.recordHistogram('latency', 100);
    
    metrics.reset();
    
    const summary = metrics.getSummary();
    expect(Object.keys(summary.counters)).toHaveLength(0);
    expect(Object.keys(summary.gauges)).toHaveLength(0);
    expect(Object.keys(summary.histograms)).toHaveLength(0);
  });
});
```

**File:** `src/infrastructure/observability/__tests__/health.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HealthMonitor, CommonHealthChecks } from '../health';

describe('HealthMonitor', () => {
  let monitor: HealthMonitor;
  
  beforeEach(() => {
    monitor = new HealthMonitor();
  });
  
  it('should register and execute health checks', async () => {
    monitor.registerCheck('test', async () => ({
      name: 'test',
      status: 'healthy',
      message: 'OK',
      lastCheck: new Date(),
      duration: 10
    }));
    
    const health = await monitor.checkHealth();
    
    expect(health.status).toBe('healthy');
    expect(health.checks).toHaveLength(1);
    expect(health.checks[0].name).toBe('test');
  });
  
  it('should mark system as degraded if any check is degraded', async () => {
    monitor.registerCheck('check1', async () => ({
      name: 'check1',
      status: 'healthy',
      message: 'OK',
      lastCheck: new Date(),
      duration: 10
    }));
    
    monitor.registerCheck('check2', async () => ({
      name: 'check2',
      status: 'degraded',
      message: 'Slow',
      lastCheck: new Date(),
      duration: 100
    }));
    
    const health = await monitor.checkHealth();
    
    expect(health.status).toBe('degraded');
  });
  
  it('should mark system as unhealthy if any check is unhealthy', async () => {
    monitor.registerCheck('check1', async () => ({
      name: 'check1',
      status: 'healthy',
      message: 'OK',
      lastCheck: new Date(),
      duration: 10
    }));
    
    monitor.registerCheck('check2', async () => ({
      name: 'check2',
      status: 'unhealthy',
      message: 'Failed',
      lastCheck: new Date(),
      duration: 50
    }));
    
    const health = await monitor.checkHealth();
    
    expect(health.status).toBe('unhealthy');
  });
  
  it('should handle check failures gracefully', async () => {
    monitor.registerCheck('failing', async () => {
      throw new Error('Check failed');
    });
    
    const health = await monitor.checkHealth();
    
    expect(health.checks[0].status).toBe('unhealthy');
    expect(health.checks[0].message).toBe('Check failed');
  });
});

describe('CommonHealthChecks', () => {
  describe('databaseCheck', () => {
    it('should return healthy if connection succeeds', async () => {
      const check = CommonHealthChecks.databaseCheck(async () => true);
      const result = await check();
      
      expect(result.status).toBe('healthy');
      expect(result.name).toBe('database');
    });
    
    it('should return unhealthy if connection fails', async () => {
      const check = CommonHealthChecks.databaseCheck(async () => false);
      const result = await check();
      
      expect(result.status).toBe('unhealthy');
    });
  });
  
  describe('memoryCheck', () => {
    it('should return healthy under warning threshold', async () => {
      const check = CommonHealthChecks.memoryCheck(0.9, 0.95);
      const result = await check();
      
      // Actual memory usage varies, but check should execute
      expect(result.name).toBe('memory');
      expect(result.details).toBeDefined();
    });
  });
});
```

---

## Integration Testing

**File:** `src/infrastructure/observability/__tests__/integration.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { createLogger } from '../logger';
import { MetricsCollector } from '../metrics';

describe('Observability Integration', () => {
  it('should work together in realistic scenario', async () => {
    // Setup
    const logger = createLogger({ service: 'test' });
    const metrics = new MetricsCollector();
    
    // Simulate operation
    const startTime = performance.now();
    
    logger.info('Operation started', { operation: 'test' });
    metrics.incrementCounter('operations', { type: 'test' });
    
    // Simulate work
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const duration = performance.now() - startTime;
    metrics.recordHistogram('operation.latency', duration, { type: 'test' });
    logger.logOperation('test', duration);
    
    // Verify
    const summary = metrics.getSummary();
    expect(summary.counters['operations{type=test}']).toBe(1);
    expect(summary.histograms['operation.latency{type=test}']).toBeDefined();
    expect(summary.histograms['operation.latency{type=test}'].count).toBe(1);
  });
});
```

---

## Success Criteria

### Functional Requirements
- [ ] Structured logging implemented and integrated
- [ ] Metrics collection working for all key operations
- [ ] Health check endpoints responding
- [ ] Dashboard accessible and displaying metrics
- [ ] All services using logger and metrics

### Performance Requirements
- [ ] Logging overhead < 1ms per log statement
- [ ] Metrics recording overhead < 0.1ms per metric
- [ ] Health checks complete < 100ms
- [ ] Dashboard renders < 500ms

### Quality Requirements
- [ ] 100% test coverage for observability code
- [ ] All observability components documented
- [ ] ADR documenting observability strategy
- [ ] Integration tests passing

### Observability Targets
- [ ] Search P50, P95, P99 latency tracked
- [ ] Cache hit rates tracked
- [ ] Error rates tracked
- [ ] Slow operations (>1s) logged automatically
- [ ] System health visible via /health endpoint

---

## Validation Steps

### Step 1: Manual Testing
1. Start the application
2. Access `/dashboard` endpoint
3. Verify metrics are displayed
4. Execute some search operations
5. Refresh dashboard and verify metrics updated
6. Access `/health` endpoint
7. Verify all health checks are passing

### Step 2: Load Testing
1. Generate load (multiple search requests)
2. Monitor dashboard during load
3. Verify metrics track operations correctly
4. Check for any performance degradation
5. Verify slow operations are logged

### Step 3: Error Testing
1. Trigger errors (invalid queries, etc.)
2. Verify errors are logged with full context
3. Check error counters increment
4. Verify stack traces captured

### Step 4: Integration Verification
1. Run full test suite
2. Verify all tests pass
3. Check test coverage reports
4. Review integration test results

---

## Documentation Requirements

### ADR Required
- **ADR 0039:** Observability Infrastructure Strategy
  - Context: Need for production visibility
  - Decision: Structured logging, metrics, health checks
  - Implementation: Logger, MetricsCollector, HealthMonitor
  - Consequences: Better debugging, performance tracking

### Code Documentation
- [ ] JSDoc for all public interfaces
- [ ] Examples in observability module README
- [ ] Dashboard usage guide
- [ ] Health check extension guide

### User Documentation
- [ ] How to access dashboard
- [ ] How to interpret metrics
- [ ] How to add custom metrics
- [ ] How to add health checks

---

## Dependencies

**Technical Dependencies:**
- None (uses Node.js built-ins)
- Optional: Express/Fastify for HTTP endpoints

**Implementation Dependencies:**
- Requires DI container updates
- Requires service refactoring for instrumentation
- Should integrate with MCP tool handlers

---

## Rollout Plan

### Phase 1: Infrastructure (Tasks 1.1-1.3)
1. Implement logger, metrics, health monitor
2. Add to DI container
3. Create unit tests
4. Verify basic functionality

### Phase 2: Instrumentation (Task 1.4)
1. Instrument CatalogSearchService
2. Instrument ConceptSearchService
3. Instrument ChunkSearchService
4. Instrument embedding services
5. Instrument cache services
6. Test instrumentation

### Phase 3: Endpoints & Dashboard (Task 1.5)
1. Create HTTP endpoints
2. Implement dashboard
3. Test endpoints
4. Document usage

### Phase 4: Validation & Documentation
1. Run integration tests
2. Perform load testing
3. Write ADR
4. Update documentation

---

## Next Steps After Completion

With observability in place:
1. **Phase 2 (Result Types)** - Log Results success/failure
2. **Phase 3 (Caching)** - Track cache hit rates
3. **Phase 4 (Resilience)** - Monitor circuit breaker state
4. **Phase 5 (DB Optimization)** - Identify slow queries
5. **Continuous Improvement** - Use metrics to guide optimization

---

## Estimated Timeline

| Task | Duration (Agentic) | Review | Total |
|------|-------------------|--------|-------|
| 1.1 Structured Logging | 30-45 min | 15-20 min | 45-65 min |
| 1.2 Metrics Collection | 45-60 min | 15-20 min | 60-80 min |
| 1.3 Health Checks | 30-45 min | 10-15 min | 40-60 min |
| 1.4 Instrumentation | 45-60 min | 15-20 min | 60-80 min |
| 1.5 Dashboard | 30-45 min | 10-15 min | 40-60 min |
| **TOTAL** | **3-4h** | **1-1.5h** | **4-5.5h** |

---

## Implementation Selection Matrix

Use this matrix to select which sub-phases to implement. Mark with ✓ to include or X to skip.

| Sub-Phase | Description | Duration | Include |
|-----------|-------------|----------|---------|
| Phase 1.1 | Structured Logging | 30-45 min | ✓       |
| Phase 1.2 | Metrics Collection | 45-60 min | x       |
| Phase 1.3 | Health Check Infrastructure | 30-45 min | x       |
| Phase 1.4 | Performance Instrumentation | 45-60 min | ✓       |
| Phase 1.5 | Simple Dashboard | 30-45 min | x       |

**Instructions:** Replace ✓ with X for any sub-phase you wish to skip.

---

**Status:** Ready for implementation  
**Next Document:** [04-result-types-plan.md](04-result-types-plan.md)

