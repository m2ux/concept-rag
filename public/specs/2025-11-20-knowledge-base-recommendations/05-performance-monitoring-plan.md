# Performance Monitoring and Benchmarking Plan

**Date:** 2025-11-20  
**Priority:** MEDIUM (Phase 2, Week 4)  
**Status:** Planning

## Overview

Add performance profiling and benchmarking infrastructure to the concept-RAG project. Establish baselines, identify bottlenecks, and enable performance regression detection. This will ensure the system maintains acceptable performance as it evolves.

## Knowledge Base Insights Applied

### Core Performance Concepts

**From Software Engineering and optimization sources:**

1. **Profiling**
   - Identifying performance hotspots
   - Understanding resource consumption
   - Data-driven optimization decisions

2. **Benchmarking**
   - Consistent performance measurement
   - Baseline establishment
   - Regression detection

3. **Performance Optimization**
   - Systematic improvement process
   - Measure before optimizing
   - Focus on bottlenecks

4. **Metrics Collection**
   - Key performance indicators (KPIs)
   - Latency tracking
   - Throughput measurement
   - Resource utilization

## Current State Assessment

### Known Performance Characteristics
❓ Search latency (vector + BM25 + concept scoring): **Unknown**  
❓ Document indexing throughput: **Unknown**  
❓ Embedding generation time: **Unknown**  
❓ Database query performance: **Unknown**  
❓ Memory consumption patterns: **Unknown**

### Existing Infrastructure
❌ No profiling tools configured  
❌ No benchmarking suite  
❌ No performance baselines  
❌ No monitoring hooks  
❌ No performance tests in CI

## Performance Monitoring Strategy

### Key Performance Indicators (KPIs)

#### 1. Search Performance
**Primary Metrics:**
- **P50 Latency**: Median search response time
- **P95 Latency**: 95th percentile response time  
- **P99 Latency**: 99th percentile response time
- **Throughput**: Queries per second

**Target Values (to be established):**
- P50: < 100ms
- P95: < 500ms
- P99: < 1000ms
- Throughput: > 10 QPS

#### 2. Indexing Performance
**Primary Metrics:**
- **Documents per second**: Indexing throughput
- **Time per document**: Average indexing time
- **Embedding batch latency**: Time to generate embeddings
- **Database write latency**: Time to persist data

**Target Values (to be established):**
- Documents/sec: > 1
- Avg time/doc: < 5s
- Embedding batch (100 chunks): < 2s

#### 3. Resource Utilization
**Primary Metrics:**
- **Memory consumption**: Heap usage during operations
- **CPU utilization**: Processing load
- **Database connections**: Connection pool usage
- **Cache hit rate**: Effectiveness of caching

**Target Values (to be established):**
- Memory: < 512MB for typical workload
- CPU: < 80% average
- Cache hit rate: > 70%

## Performance Monitoring Infrastructure

### 1. Performance Instrumentation

```typescript
// src/infrastructure/monitoring/performance-monitor.ts

export interface PerformanceMetrics {
  operation: string;
  durationMs: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private enabled: boolean;
  
  constructor(enabled: boolean = true) {
    this.enabled = enabled;
  }
  
  /**
   * Measure the execution time of an operation.
   */
  async measure<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    if (!this.enabled) {
      return fn();
    }
    
    const start = performance.now();
    try {
      return await fn();
    } finally {
      const durationMs = performance.now() - start;
      this.recordMetric({
        operation,
        durationMs,
        timestamp: new Date(),
        metadata
      });
    }
  }
  
  /**
   * Measure synchronous operation.
   */
  measureSync<T>(
    operation: string,
    fn: () => T,
    metadata?: Record<string, unknown>
  ): T {
    if (!this.enabled) {
      return fn();
    }
    
    const start = performance.now();
    try {
      return fn();
    } finally {
      const durationMs = performance.now() - start;
      this.recordMetric({
        operation,
        durationMs,
        timestamp: new Date(),
        metadata
      });
    }
  }
  
  /**
   * Start a timer for manual tracking.
   */
  startTimer(operation: string): () => void {
    const start = performance.now();
    return () => {
      const durationMs = performance.now() - start;
      this.recordMetric({
        operation,
        durationMs,
        timestamp: new Date()
      });
    };
  }
  
  private recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);
    
    // Optional: Log slow operations
    if (metric.durationMs > 1000) {
      console.warn(`Slow operation: ${metric.operation} took ${metric.durationMs}ms`);
    }
  }
  
  /**
   * Get statistics for an operation.
   */
  getStats(operation: string): PerformanceStats {
    const operationMetrics = this.metrics
      .filter(m => m.operation === operation)
      .map(m => m.durationMs)
      .sort((a, b) => a - b);
    
    if (operationMetrics.length === 0) {
      return {
        operation,
        count: 0,
        mean: 0,
        median: 0,
        p95: 0,
        p99: 0,
        min: 0,
        max: 0
      };
    }
    
    return {
      operation,
      count: operationMetrics.length,
      mean: this.mean(operationMetrics),
      median: this.percentile(operationMetrics, 50),
      p95: this.percentile(operationMetrics, 95),
      p99: this.percentile(operationMetrics, 99),
      min: operationMetrics[0],
      max: operationMetrics[operationMetrics.length - 1]
    };
  }
  
  /**
   * Get all collected metrics.
   */
  getAllMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }
  
  /**
   * Clear collected metrics.
   */
  clear(): void {
    this.metrics = [];
  }
  
  /**
   * Export metrics to JSON.
   */
  export(): string {
    const stats = this.getOperationNames()
      .map(op => this.getStats(op));
    
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      statistics: stats,
      rawMetrics: this.metrics
    }, null, 2);
  }
  
  private getOperationNames(): string[] {
    return [...new Set(this.metrics.map(m => m.operation))];
  }
  
  private mean(values: number[]): number {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }
  
  private percentile(values: number[], p: number): number {
    const index = Math.ceil((p / 100) * values.length) - 1;
    return values[Math.max(0, index)];
  }
}

export interface PerformanceStats {
  operation: string;
  count: number;
  mean: number;
  median: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor(
  process.env.ENABLE_PERFORMANCE_MONITORING !== 'false'
);
```

### 2. Integration with Services

```typescript
// Example: Instrument search service
export class HybridSearchService {
  constructor(
    private vectorStore: IVectorStore,
    private monitor: PerformanceMonitor
  ) {}
  
  async search(query: string, limit: number = 10): Promise<SearchResult[]> {
    return this.monitor.measure('hybrid_search', async () => {
      // Vector search
      const vectorResults = await this.monitor.measure(
        'vector_search',
        () => this.vectorStore.similaritySearch(query, limit),
        { query_length: query.length, limit }
      );
      
      // BM25 search
      const bm25Results = await this.monitor.measure(
        'bm25_search',
        () => this.bm25Search(query, limit)
      );
      
      // Score combination
      const combined = this.monitor.measureSync(
        'score_combination',
        () => this.combineScores(vectorResults, bm25Results)
      );
      
      return combined;
    }, { query_length: query.length, limit });
  }
}
```

### 3. Memory Profiling

```typescript
// src/infrastructure/monitoring/memory-profiler.ts

export class MemoryProfiler {
  /**
   * Get current memory usage.
   */
  getCurrentUsage(): MemoryUsage {
    const usage = process.memoryUsage();
    return {
      heapUsed: usage.heapUsed / 1024 / 1024, // MB
      heapTotal: usage.heapTotal / 1024 / 1024, // MB
      external: usage.external / 1024 / 1024, // MB
      rss: usage.rss / 1024 / 1024 // MB
    };
  }
  
  /**
   * Track memory usage during operation.
   */
  async profile<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<{ result: T; memory: MemoryProfile }> {
    const before = this.getCurrentUsage();
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    const result = await fn();
    
    const after = this.getCurrentUsage();
    
    return {
      result,
      memory: {
        operation,
        before,
        after,
        delta: {
          heapUsed: after.heapUsed - before.heapUsed,
          heapTotal: after.heapTotal - before.heapTotal,
          external: after.external - before.external,
          rss: after.rss - before.rss
        }
      }
    };
  }
}

export interface MemoryUsage {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
}

export interface MemoryProfile {
  operation: string;
  before: MemoryUsage;
  after: MemoryUsage;
  delta: MemoryUsage;
}
```

## Benchmarking Infrastructure

### Benchmark Suite

```typescript
// src/__tests__/benchmarks/search-benchmarks.test.ts

import { describe, it, beforeAll, afterAll } from 'vitest';
import { performanceMonitor } from '../../infrastructure/monitoring/performance-monitor';

describe('Search Performance Benchmarks', () => {
  let searchService: HybridSearchService;
  let testData: TestDocument[];
  
  beforeAll(async () => {
    // Set up test database with realistic data
    testData = await loadTestDocuments(100);
    await indexDocuments(testData);
    performanceMonitor.clear();
  });
  
  afterAll(() => {
    // Export results
    const results = performanceMonitor.export();
    console.log('\n=== Search Performance Results ===\n');
    console.log(results);
  });
  
  it('benchmark: vector search', async () => {
    const queries = generateTestQueries(100);
    
    for (const query of queries) {
      await performanceMonitor.measure(
        'benchmark_vector_search',
        () => searchService.vectorSearch(query)
      );
    }
    
    const stats = performanceMonitor.getStats('benchmark_vector_search');
    
    // Assert performance targets
    expect(stats.p50).toBeLessThan(100);
    expect(stats.p95).toBeLessThan(500);
    expect(stats.p99).toBeLessThan(1000);
  });
  
  it('benchmark: hybrid search', async () => {
    const queries = generateTestQueries(100);
    
    for (const query of queries) {
      await performanceMonitor.measure(
        'benchmark_hybrid_search',
        () => searchService.hybridSearch(query)
      );
    }
    
    const stats = performanceMonitor.getStats('benchmark_hybrid_search');
    
    console.log(`\nHybrid Search Performance:`);
    console.log(`  P50: ${stats.p50.toFixed(2)}ms`);
    console.log(`  P95: ${stats.p95.toFixed(2)}ms`);
    console.log(`  P99: ${stats.p99.toFixed(2)}ms`);
    
    // Targets (will be adjusted based on baseline)
    expect(stats.p50).toBeLessThan(150);
    expect(stats.p95).toBeLessThan(750);
  });
  
  it('benchmark: concept search', async () => {
    const concepts = ['software architecture', 'testing', 'performance'];
    
    for (const concept of concepts) {
      for (let i = 0; i < 50; i++) {
        await performanceMonitor.measure(
          'benchmark_concept_search',
          () => searchService.conceptSearch(concept)
        );
      }
    }
    
    const stats = performanceMonitor.getStats('benchmark_concept_search');
    expect(stats.p95).toBeLessThan(500);
  });
});
```

### Indexing Benchmarks

```typescript
// src/__tests__/benchmarks/indexing-benchmarks.test.ts

describe('Indexing Performance Benchmarks', () => {
  it('benchmark: document indexing throughput', async () => {
    const documents = generateTestDocuments(50);
    const startTime = Date.now();
    
    for (const doc of documents) {
      await performanceMonitor.measure(
        'benchmark_index_document',
        () => indexingService.indexDocument(doc)
      );
    }
    
    const totalTime = Date.now() - startTime;
    const throughput = documents.length / (totalTime / 1000);
    
    console.log(`\nIndexing throughput: ${throughput.toFixed(2)} docs/sec`);
    
    const stats = performanceMonitor.getStats('benchmark_index_document');
    console.log(`Average time per document: ${stats.mean.toFixed(2)}ms`);
    
    // Target: > 1 doc/sec
    expect(throughput).toBeGreaterThan(1);
  });
  
  it('benchmark: embedding generation', async () => {
    const texts = generateTestTexts(100);
    
    await performanceMonitor.measure(
      'benchmark_batch_embeddings',
      () => embeddingService.embedBatch(texts)
    );
    
    const stats = performanceMonitor.getStats('benchmark_batch_embeddings');
    console.log(`\nBatch embedding (100 texts): ${stats.mean.toFixed(2)}ms`);
  });
});
```

### Memory Benchmarks

```typescript
// src/__tests__/benchmarks/memory-benchmarks.test.ts

describe('Memory Usage Benchmarks', () => {
  it('benchmark: search memory usage', async () => {
    const profiler = new MemoryProfiler();
    
    const { memory } = await profiler.profile(
      'hybrid_search_memory',
      async () => {
        const queries = generateTestQueries(100);
        for (const query of queries) {
          await searchService.hybridSearch(query);
        }
      }
    );
    
    console.log(`\nMemory usage for 100 searches:`);
    console.log(`  Heap delta: ${memory.delta.heapUsed.toFixed(2)} MB`);
    console.log(`  Peak RSS: ${memory.after.rss.toFixed(2)} MB`);
    
    // Target: < 100MB heap delta for 100 searches
    expect(memory.delta.heapUsed).toBeLessThan(100);
  });
  
  it('benchmark: indexing memory usage', async () => {
    const profiler = new MemoryProfiler();
    
    const { memory } = await profiler.profile(
      'index_documents_memory',
      async () => {
        const documents = generateTestDocuments(10);
        for (const doc of documents) {
          await indexingService.indexDocument(doc);
        }
      }
    );
    
    console.log(`\nMemory usage for indexing 10 documents:`);
    console.log(`  Heap delta: ${memory.delta.heapUsed.toFixed(2)} MB`);
    
    // Target: < 50MB per document
    expect(memory.delta.heapUsed / 10).toBeLessThan(50);
  });
});
```

## Performance Regression Detection

### CI Integration

```yaml
# .github/workflows/performance.yml
name: Performance Benchmarks

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  benchmark:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run benchmarks
        run: npm run benchmark
      
      - name: Store benchmark results
        uses: benchmark-action/github-action-benchmark@v1
        with:
          tool: 'customSmallerIsBetter'
          output-file-path: benchmark-results.json
          github-token: ${{ secrets.GITHUB_TOKEN }}
          auto-push: true
          alert-threshold: '150%'
          comment-on-alert: true
          fail-on-alert: false
```

### Benchmark Script

```json
// package.json
{
  "scripts": {
    "benchmark": "vitest run --config vitest.benchmark.config.ts",
    "benchmark:watch": "vitest watch --config vitest.benchmark.config.ts",
    "benchmark:compare": "node scripts/compare-benchmarks.js"
  }
}
```

## Implementation Tasks

### Task 5.1: Create Monitoring Infrastructure (4 hours)

**Subtasks:**
1. Create PerformanceMonitor class (2h)
2. Create MemoryProfiler class (1h)
3. Add DI container integration (1h)

**Files:**
- `src/infrastructure/monitoring/performance-monitor.ts`
- `src/infrastructure/monitoring/memory-profiler.ts`
- `src/infrastructure/monitoring/index.ts`
- Update `src/application/container.ts`

### Task 5.2: Instrument Critical Paths (3 hours)

**Subtasks:**
1. Instrument search services (1h)
2. Instrument indexing pipeline (1h)
3. Instrument database operations (1h)

**Files to Update:**
- `src/domain/services/HybridSearchService.ts`
- `src/domain/services/IndexingService.ts`
- `src/infrastructure/database/*.ts`

### Task 5.3: Create Benchmark Suite (4 hours)

**Subtasks:**
1. Search benchmarks (2h)
2. Indexing benchmarks (1h)
3. Memory benchmarks (1h)

**Files:**
- `src/__tests__/benchmarks/search-benchmarks.test.ts`
- `src/__tests__/benchmarks/indexing-benchmarks.test.ts`
- `src/__tests__/benchmarks/memory-benchmarks.test.ts`
- `vitest.benchmark.config.ts`

### Task 5.4: Establish Baselines (1 hour)

**Subtasks:**
1. Run benchmark suite (30m)
2. Document baselines (30m)

**Deliverables:**
- Performance baseline document
- Benchmark results JSON

## Success Criteria

- [ ] Performance monitoring infrastructure created
- [ ] Critical paths instrumented
- [ ] Benchmark suite implemented
- [ ] Performance baselines established
- [ ] CI integration configured
- [ ] Performance regression detection active
- [ ] Documentation for monitoring usage

## Performance Targets

### Search Operations
- P50 latency: < 100ms
- P95 latency: < 500ms
- Throughput: > 10 QPS

### Indexing Operations
- Throughput: > 1 doc/sec
- Avg time per doc: < 5s

### Resource Usage
- Memory: < 512MB for typical workload
- Cache hit rate: > 70%

## Next Steps

1. **Week 4, Day 1**: Create monitoring infrastructure (Task 5.1)
2. **Week 4, Day 2**: Instrument services (Task 5.2)
3. **Week 4, Day 3-4**: Create benchmarks (Task 5.3)
4. **Week 4, Day 5**: Establish baselines and document (Task 5.4)

---

**Related Documents:**
- [01-analysis-and-priorities.md](01-analysis-and-priorities.md)
- [02-testing-coverage-plan.md](02-testing-coverage-plan.md) (testing infrastructure reused)

**Knowledge Base Sources:**
- Software Engineering - Performance optimization concepts
- Performance profiling and benchmarking best practices


