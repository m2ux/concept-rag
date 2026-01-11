# Phase 5: Database Query Optimization Implementation Plan

**Date:** November 23, 2025  
**Priority:** MEDIUM (Performance)  
**Status:** Ready for Implementation  
**Estimated Effort:** 2.5-3.5h agentic + 1h review

> **Note:** All time estimates refer to agentic (AI-assisted) development time plus human review time.

---

## Overview

Optimize database query performance through query instrumentation, slow query identification, connection pooling, and batching strategies.

---

## Knowledge Base Insights Applied

### Core Database Optimization Concepts (12 concepts from lexicon)

1. **Query optimization** - Efficient query execution
2. **Index tuning** - Optimizing indexes for queries
3. **Connection pooling** - Reusing database connections
4. **Query instrumentation** - Monitoring query performance
5. **Slow-query logging** - Identifying performance issues
6. **Query execution plans** - Understanding query behavior
7. **Optimizer statistics** - Query planner metadata
8. **Query profiling** - Performance analysis
9. **Batching** - Reducing operation overhead
10. **Streaming** - Processing large datasets incrementally
11. **Resource-constrained design** - Efficient resource utilization
12. **Database asserts** - Integrity checks

---

## Current State

### What Exists ✅
- ✅ LanceDB for vector storage
- ✅ Basic query operations
- ⚠️ Performance benchmarks (test suite only)

### What's Missing ❌
- ❌ Query performance monitoring
- ❌ Slow query identification
- ❌ Connection pooling
- ❌ Query instrumentation in production
- ❌ Batching strategies
- ❌ Index optimization analysis

### Performance Unknowns
- 🔍 Query P50, P95, P99 latency not measured
- 🔍 Slow queries not identified
- 🔍 Connection overhead not measured
- 🔍 Index effectiveness unknown

---

## Implementation Tasks

### Task 5.1: Query Instrumentation (45-60 min agentic)

**Goal:** Monitor query performance in production

**Tasks:**
1. Create QueryMonitor class
2. Wrap all database queries with instrumentation
3. Track query duration, result count, errors
4. Identify slow queries (>1s threshold)
5. Log slow queries with context
6. Expose metrics via observability

**Deliverables:**
- `src/infrastructure/database/query-monitor.ts`
- Integration with all repositories
- Slow query logging
- Query metrics in dashboard

---

### Task 5.2: Connection Pooling (45-60 min agentic)

**Goal:** Reduce connection overhead and improve resource utilization

**Tasks:**
1. Implement ConnectionPool class
2. Add pool size limits (min, max)
3. Implement connection acquisition/release
4. Add pool monitoring (active, idle connections)
5. Handle connection failures gracefully
6. Create unit tests

**Deliverables:**
- `src/infrastructure/database/connection-pool.ts`
- LanceDB connection pooling
- Pool metrics tracking
- Connection lifecycle management

---

### Task 5.3: Query Batching (30-45 min agentic)

**Goal:** Reduce query overhead for bulk operations

**Tasks:**
1. Implement BatchProcessor class
2. Add configurable batch sizes
3. Batch document insertions
4. Batch document updates
5. Add batch metrics
6. Create tests

**Deliverables:**
- `src/infrastructure/database/batch-processor.ts`
- Batch insertion for indexing
- Batch query utilities
- Performance improvements documented

---

### Task 5.4: Query Optimization Analysis (30-45 min agentic)

**Goal:** Identify and fix slow queries

**Tasks:**
1. Analyze query patterns
2. Identify slow queries from metrics
3. Optimize identified queries
4. Add indexes where beneficial
5. Document optimization results
6. Establish performance baselines

**Deliverables:**
- Query optimization report
- Performance baselines
- Index recommendations
- Optimized query implementations

---

## Detailed Implementation

### Query Monitor Implementation

**File:** `src/infrastructure/database/query-monitor.ts`

```typescript
/**
 * Query performance monitoring and slow query detection.
 */

export interface QueryMetrics {
  query: string;
  duration: number;
  resultCount: number;
  timestamp: Date;
  slow: boolean;
  error?: string;
}

export interface QueryStats {
  query: string;
  count: number;
  totalDuration: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  p95Duration: number;
  slowCount: number;
  errorCount: number;
}

export class QueryMonitor {
  private metrics: QueryMetrics[] = [];
  private slowQueryThreshold: number;
  
  constructor(
    private logger: ILogger,
    private metricsCollector: IMetricsCollector,
    slowQueryThreshold: number = 1000  // 1 second
  ) {
    this.slowQueryThreshold = slowQueryThreshold;
  }
  
  async measureQuery<T>(
    queryName: string,
    query: () => Promise<T>,
    context?: Record<string, unknown>
  ): Promise<T> {
    const start = performance.now();
    const traceId = generateTraceId();
    
    this.logger.debug(`Query started: ${queryName}`, { traceId, ...context });
    
    try {
      const result = await query();
      const duration = performance.now() - start;
      const resultCount = Array.isArray(result) ? result.length : 1;
      
      // Record metrics
      const slow = duration > this.slowQueryThreshold;
      
      this.metrics.push({
        query: queryName,
        duration,
        resultCount,
        timestamp: new Date(),
        slow
      });
      
      // Log if slow
      if (slow) {
        this.logger.warn(`Slow query detected: ${queryName}`, {
          duration,
          threshold: this.slowQueryThreshold,
          resultCount,
          traceId,
          ...context
        });
      }
      
      // Record histogram metric
      this.metricsCollector.recordHistogram('database.query.latency', duration, {
        query: queryName,
        slow: slow.toString()
      });
      
      this.logger.debug(`Query completed: ${queryName}`, {
        duration,
        resultCount,
        traceId
      });
      
      return result;
      
    } catch (error) {
      const duration = performance.now() - start;
      
      this.metrics.push({
        query: queryName,
        duration,
        resultCount: 0,
        timestamp: new Date(),
        slow: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      this.metricsCollector.incrementCounter('database.query.errors', {
        query: queryName
      });
      
      this.logger.error(`Query failed: ${queryName}`, error as Error, {
        duration,
        traceId,
        ...context
      });
      
      throw error;
    }
  }
  
  getSlowQueries(): QueryMetrics[] {
    return this.metrics.filter(m => m.slow);
  }
  
  getQueryStats(queryName?: string): QueryStats[] {
    const grouped = this.groupByQuery(queryName);
    return Object.entries(grouped).map(([query, metrics]) => 
      this.calculateStats(query, metrics)
    );
  }
  
  private groupByQuery(queryName?: string): Record<string, QueryMetrics[]> {
    const filtered = queryName
      ? this.metrics.filter(m => m.query === queryName)
      : this.metrics;
    
    const grouped: Record<string, QueryMetrics[]> = {};
    for (const metric of filtered) {
      if (!grouped[metric.query]) {
        grouped[metric.query] = [];
      }
      grouped[metric.query].push(metric);
    }
    return grouped;
  }
  
  private calculateStats(query: string, metrics: QueryMetrics[]): QueryStats {
    const durations = metrics.map(m => m.duration).sort((a, b) => a - b);
    const totalDuration = durations.reduce((sum, d) => sum + d, 0);
    
    return {
      query,
      count: metrics.length,
      totalDuration,
      avgDuration: totalDuration / metrics.length,
      minDuration: durations[0] || 0,
      maxDuration: durations[durations.length - 1] || 0,
      p95Duration: this.percentile(durations, 0.95),
      slowCount: metrics.filter(m => m.slow).length,
      errorCount: metrics.filter(m => m.error).length
    };
  }
  
  private percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0;
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[Math.max(0, index)];
  }
  
  reset(): void {
    this.metrics = [];
  }
}
```

---

### Connection Pool Implementation

**File:** `src/infrastructure/database/connection-pool.ts`

```typescript
/**
 * Database connection pooling for improved resource utilization.
 */

export interface PoolConfig {
  minSize: number;
  maxSize: number;
  acquireTimeout: number;
  idleTimeout: number;
}

export interface PoolMetrics {
  size: number;
  available: number;
  active: number;
  waiting: number;
}

export class ConnectionPool<T> {
  private connections: T[] = [];
  private available: T[] = [];
  private inUse: Set<T> = new Set();
  private waitQueue: Array<(conn: T) => void> = [];
  
  constructor(
    private config: PoolConfig,
    private createConnection: () => Promise<T>,
    private validateConnection: (conn: T) => Promise<boolean>,
    private destroyConnection: (conn: T) => Promise<void>
  ) {}
  
  async initialize(): Promise<void> {
    for (let i = 0; i < this.config.minSize; i++) {
      const conn = await this.createConnection();
      this.connections.push(conn);
      this.available.push(conn);
    }
  }
  
  async acquire(): Promise<T> {
    // Try to get available connection
    while (this.available.length > 0) {
      const conn = this.available.pop()!;
      
      // Validate connection
      const isValid = await this.validateConnection(conn);
      if (isValid) {
        this.inUse.add(conn);
        return conn;
      }
      
      // Connection invalid, remove and create new one
      await this.destroyConnection(conn);
      this.connections = this.connections.filter(c => c !== conn);
    }
    
    // Create new connection if under max size
    if (this.connections.length < this.config.maxSize) {
      const conn = await this.createConnection();
      this.connections.push(conn);
      this.inUse.add(conn);
      return conn;
    }
    
    // Wait for connection to become available
    return this.waitForConnection();
  }
  
  release(connection: T): void {
    if (!this.inUse.has(connection)) {
      throw new Error('Connection not in use');
    }
    
    this.inUse.delete(connection);
    
    // If someone is waiting, give it to them
    const waiter = this.waitQueue.shift();
    if (waiter) {
      this.inUse.add(connection);
      waiter(connection);
      return;
    }
    
    // Otherwise, return to available pool
    this.available.push(connection);
  }
  
  async withConnection<R>(fn: (conn: T) => Promise<R>): Promise<R> {
    const conn = await this.acquire();
    try {
      return await fn(conn);
    } finally {
      this.release(conn);
    }
  }
  
  private waitForConnection(): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.waitQueue.indexOf(resolve);
        if (index !== -1) {
          this.waitQueue.splice(index, 1);
        }
        reject(new Error('Connection acquire timeout'));
      }, this.config.acquireTimeout);
      
      this.waitQueue.push((conn: T) => {
        clearTimeout(timeout);
        resolve(conn);
      });
    });
  }
  
  getMetrics(): PoolMetrics {
    return {
      size: this.connections.length,
      available: this.available.length,
      active: this.inUse.size,
      waiting: this.waitQueue.length
    };
  }
  
  async shutdown(): Promise<void> {
    for (const conn of this.connections) {
      await this.destroyConnection(conn);
    }
    this.connections = [];
    this.available = [];
    this.inUse.clear();
  }
}
```

---

### Batch Processor Implementation

**File:** `src/infrastructure/database/batch-processor.ts`

```typescript
/**
 * Batch processing for database operations.
 */

export class BatchProcessor {
  constructor(
    private batchSize: number = 100,
    private logger: ILogger
  ) {}
  
  async processBatch<T, R>(
    items: T[],
    processor: (batch: T[]) => Promise<R[]>
  ): Promise<R[]> {
    const results: R[] = [];
    const batchCount = Math.ceil(items.length / this.batchSize);
    
    this.logger.info(`Processing ${items.length} items in ${batchCount} batches`);
    
    for (let i = 0; i < items.length; i += this.batchSize) {
      const batch = items.slice(i, i + this.batchSize);
      const batchNumber = Math.floor(i / this.batchSize) + 1;
      
      this.logger.debug(`Processing batch ${batchNumber}/${batchCount}`, {
        batchSize: batch.length
      });
      
      const batchResults = await processor(batch);
      results.push(...batchResults);
    }
    
    this.logger.info(`Completed processing ${items.length} items`);
    
    return results;
  }
  
  async processBatchWithRetry<T, R>(
    items: T[],
    processor: (batch: T[]) => Promise<R[]>,
    maxRetries: number = 3
  ): Promise<R[]> {
    const results: R[] = [];
    const batchCount = Math.ceil(items.length / this.batchSize);
    
    for (let i = 0; i < items.length; i += this.batchSize) {
      const batch = items.slice(i, i + this.batchSize);
      const batchNumber = Math.floor(i / this.batchSize) + 1;
      
      let retries = 0;
      while (retries <= maxRetries) {
        try {
          const batchResults = await processor(batch);
          results.push(...batchResults);
          break;
        } catch (error) {
          retries++;
          if (retries > maxRetries) {
            this.logger.error(
              `Batch ${batchNumber}/${batchCount} failed after ${maxRetries} retries`,
              error as Error
            );
            throw error;
          }
          
          this.logger.warn(
            `Batch ${batchNumber}/${batchCount} failed, retrying (${retries}/${maxRetries})`,
            { error: (error as Error).message }
          );
          
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        }
      }
    }
    
    return results;
  }
}
```

---

## Integration Example

**Repository with Query Monitoring and Connection Pooling:**

```typescript
export class CatalogRepository {
  constructor(
    private connectionPool: ConnectionPool<LanceDBConnection>,
    private queryMonitor: QueryMonitor,
    private logger: ILogger
  ) {}
  
  async search(params: SearchParams): Promise<SearchResults> {
    return this.connectionPool.withConnection(async (conn) => {
      return this.queryMonitor.measureQuery(
        'catalog_search',
        async () => {
          const table = await conn.openTable('catalog');
          return await table.search(params.text)
            .limit(params.limit || 10)
            .execute();
        },
        { query: params.text, limit: params.limit }
      );
    });
  }
}
```

---

## Success Criteria

### Functional Requirements
- [ ] Query instrumentation working
- [ ] Slow queries identified and logged
- [ ] Connection pooling active
- [ ] Batch processing implemented
- [ ] Query metrics in dashboard

### Performance Targets
- [ ] Query P95 latency improved by >20%
- [ ] Connection overhead reduced
- [ ] Batch operations >3x faster than individual
- [ ] No slow queries >2s in normal operations
- [ ] Pool utilization >70%

### Quality Requirements
- [ ] 100% test coverage for optimization code
- [ ] Performance baselines established
- [ ] Query optimization documented
- [ ] ADR documenting approach

---

## Testing Strategy

### Unit Tests
- QueryMonitor metrics accuracy
- ConnectionPool lifecycle
- BatchProcessor batching logic
- Edge cases

### Integration Tests
- Query monitoring with real database
- Connection pool under load
- Batch processing with real data
- Performance validation

### Performance Tests
- Query latency benchmarks
- Connection pool efficiency
- Batch vs individual comparison
- Load testing

---

## Validation Steps

1. **Baseline Measurement** - Current query performance
2. **Instrumentation** - Add monitoring
3. **Identify Bottlenecks** - Find slow queries
4. **Optimize** - Fix slow queries
5. **Measure Improvement** - Validate gains

---

## Documentation Requirements

### ADR Required
- **ADR 0043:** Database Query Optimization Strategy
  - Context: Query performance needs
  - Decision: Instrumentation, pooling, batching
  - Implementation: QueryMonitor, ConnectionPool
  - Results: Performance improvements achieved

### User Documentation
- Query optimization guide
- Connection pool configuration
- Batch processing guide
- Performance tuning tips

---

## Estimated Timeline

| Task | Duration (Agentic) | Review | Total |
|------|-------------------|--------|-------|
| 5.1 Query Instrumentation | 45-60 min | 15 min | 60-75 min |
| 5.2 Connection Pooling | 45-60 min | 15 min | 60-75 min |
| 5.3 Query Batching | 30-45 min | 15 min | 45-60 min |
| 5.4 Optimization Analysis | 30-45 min | 15 min | 45-60 min |
| **TOTAL** | **2.5-3.5h** | **1h** | **3.5-4.5h** |

---

## Implementation Selection Matrix

Use this matrix to select which sub-phases to implement. Mark with ✓ to include or X to skip.

| Sub-Phase | Description | Duration | Include |
|-----------|-------------|----------|---------|
| Task 5.1 | Query Instrumentation & Monitoring | 45-60 min | ✓ |
| Task 5.2 | Connection Pooling | 45-60 min | ✓ |
| Task 5.3 | Query Batching | 30-45 min | ✓ |
| Task 5.4 | Query Optimization Analysis | 30-45 min | ✓ |

**Instructions:** Replace ✓ with X for any sub-phase you wish to skip.

---

**Status:** Ready for implementation  
**Next Document:** [08-api-design-patterns-plan.md](08-api-design-patterns-plan.md)

