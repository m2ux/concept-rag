# Phase 3: Advanced Caching Strategy Implementation Plan

**Date:** November 23, 2025  
**Priority:** HIGH (Performance Impact)  
**Status:** Ready for Implementation  
**Estimated Effort:** 3-4h agentic + 1h review

> **Note:** All time estimates refer to agentic (AI-assisted) development time plus human review time.

---

## Overview

Implement comprehensive multi-level caching strategy with LRU eviction to significantly improve search performance and reduce API costs for embeddings.

---

## Knowledge Base Insights Applied

### Core Caching Concepts (10 concepts from lexicon)

1. **Multi-level caching** - Multiple cache layers (L1: in-memory, L2: persistent)
2. **Cache-aside pattern** - Lazy-loading cache strategy
3. **LRU eviction** - Least Recently Used eviction policy
4. **Cache coherency** - Cache invalidation strategies
5. **Memoization** - Result caching for pure functions
6. **Cache metrics** - Hit rate, miss rate, evictions tracking
7. **Write-through cache** - Synchronous cache updates
8. **Write-back cache** - Asynchronous cache updates
9. **In-memory caching** - RAM-based storage for speed
10. **Data locality** - Optimizing data placement

---

## Current State

### What Exists ✅
- ✅ ConceptIdCache - In-memory concept ID mapping
- ✅ CategoryIdCache - In-memory category ID mapping
- ✅ Basic cache warming on startup

### What's Missing ❌
- ❌ Search result caching
- ❌ Embedding caching (embeddings regenerated every time)
- ❌ LRU eviction (caches grow unbounded)
- ❌ Cache metrics (hit rate, miss rate)
- ❌ Cache invalidation strategy
- ❌ Multi-level architecture

### Performance Impact
- 🔍 Repeated searches: No result caching
- 🔍 Embeddings regenerated: Expensive API calls
- 🔍 Memory growth: No eviction policy

---

## Implementation Tasks

### Task 3.1: LRU Cache Implementation (45-60 min agentic)

**Goal:** Create generic LRU cache with metrics

**Tasks:**
1. Implement LRUCache<K, V> class
2. Add size limits and eviction
3. Add TTL (time-to-live) support
4. Implement cache metrics tracking
5. Create comprehensive unit tests

**Deliverables:**
- `src/infrastructure/cache/lru-cache.ts`
- `src/infrastructure/cache/cache-metrics.ts`
- Unit tests with 100% coverage

---

### Task 3.2: Search Result Cache (45-60 min agentic)

**Goal:** Cache search results to reduce query latency

**Tasks:**
1. Create SearchResultCache class
2. Implement cache key generation (query + options hash)
3. Add TTL (5 minutes default)
4. Integrate with search services
5. Add cache warming for common queries
6. Track cache hit rate metrics

**Deliverables:**
- `src/infrastructure/cache/search-result-cache.ts`
- Integration with CatalogSearchService, ConceptSearchService
- Cache metrics exposed via observability

**Expected Impact:**
- 40-60% reduction in search latency for repeated queries
- Cache hit rate target: >60%

---

### Task 3.3: Embedding Cache (45-60 min agentic)

**Goal:** Cache embeddings to reduce API costs

**Tasks:**
1. Create EmbeddingCache class
2. Implement text hashing for cache keys
3. Cache per model and provider
4. No TTL (embeddings don't expire)
5. Integrate with embedding services
6. Add cache warming for common texts

**Deliverables:**
- `src/infrastructure/cache/embedding-cache.ts`
- Integration with SimpleEmbeddingService
- Persistent cache (optional enhancement)

**Expected Impact:**
- 40-80% reduction in embedding API calls
- Significant cost savings
- Cache hit rate target: >70%

---

### Task 3.4: Cache Monitoring & Management (30-45 min agentic)

**Goal:** Monitor cache effectiveness and manage cache lifecycle

**Tasks:**
1. Expose cache metrics via observability dashboard
2. Add cache warming strategies
3. Implement cache invalidation APIs
4. Add cache size monitoring
5. Document cache management procedures

**Deliverables:**
- Cache metrics in `/dashboard` endpoint
- Cache management utilities
- Documentation

---

## Detailed Implementation

### LRU Cache Implementation

**File:** `src/infrastructure/cache/lru-cache.ts`

```typescript
/**
 * LRU (Least Recently Used) cache with size limits and metrics.
 */

export interface CacheMetrics {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  hitRate: number;
  maxSize: number;
}

interface CacheEntry<V> {
  value: V;
  timestamp: number;
  expiresAt?: number;
}

export class LRUCache<K, V> {
  private cache: Map<K, CacheEntry<V>>;
  private maxSize: number;
  private metrics: CacheMetrics;
  
  constructor(maxSize: number = 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      size: 0,
      hitRate: 0,
      maxSize
    };
  }
  
  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    
    if (!entry || this.isExpired(entry)) {
      this.metrics.misses++;
      this.updateHitRate();
      if (entry) {
        this.cache.delete(key);
      }
      return undefined;
    }
    
    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    
    this.metrics.hits++;
    this.updateHitRate();
    
    return entry.value;
  }
  
  set(key: K, value: V, ttlMs?: number): void {
    // Evict if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
      this.metrics.evictions++;
    }
    
    const entry: CacheEntry<V> = {
      value,
      timestamp: Date.now(),
      expiresAt: ttlMs ? Date.now() + ttlMs : undefined
    };
    
    this.cache.set(key, entry);
    this.metrics.size = this.cache.size;
  }
  
  delete(key: K): boolean {
    const deleted = this.cache.delete(key);
    this.metrics.size = this.cache.size;
    return deleted;
  }
  
  clear(): void {
    this.cache.clear();
    this.metrics.size = 0;
  }
  
  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }
  
  private isExpired(entry: CacheEntry<V>): boolean {
    return entry.expiresAt !== undefined && Date.now() > entry.expiresAt;
  }
  
  private updateHitRate(): void {
    const total = this.metrics.hits + this.metrics.misses;
    this.metrics.hitRate = total > 0 ? this.metrics.hits / total : 0;
  }
}
```

---

### Search Result Cache

**File:** `src/infrastructure/cache/search-result-cache.ts`

```typescript
import { LRUCache } from './lru-cache';
import { createHash } from 'crypto';

export interface SearchOptions {
  limit?: number;
  [key: string]: any;
}

export class SearchResultCache<T> {
  private cache: LRUCache<string, T>;
  private defaultTTL: number;
  
  constructor(maxSize: number = 1000, ttlMs: number = 5 * 60 * 1000) {
    this.cache = new LRUCache(maxSize);
    this.defaultTTL = ttlMs;
  }
  
  private getCacheKey(query: string, options: SearchOptions): string {
    // Create deterministic cache key
    const optionsStr = JSON.stringify(options, Object.keys(options).sort());
    const content = `${query}:${optionsStr}`;
    return createHash('sha256').update(content).digest('hex');
  }
  
  get(query: string, options: SearchOptions): T | undefined {
    const key = this.getCacheKey(query, options);
    return this.cache.get(key);
  }
  
  set(query: string, options: SearchOptions, results: T): void {
    const key = this.getCacheKey(query, options);
    this.cache.set(key, results, this.defaultTTL);
  }
  
  invalidate(query?: string): void {
    if (query) {
      // Invalidate specific query (would need key tracking)
      // For now, clear all
      this.cache.clear();
    } else {
      this.cache.clear();
    }
  }
  
  getMetrics() {
    return this.cache.getMetrics();
  }
}
```

---

### Embedding Cache

**File:** `src/infrastructure/cache/embedding-cache.ts`

```typescript
import { LRUCache } from './lru-cache';
import { createHash } from 'crypto';

export class EmbeddingCache {
  private cache: LRUCache<string, number[]>;
  
  constructor(maxSize: number = 10000) {
    this.cache = new LRUCache(maxSize);
  }
  
  private getCacheKey(text: string, model: string): string {
    // Hash long texts for efficiency
    const textHash = createHash('sha256')
      .update(text)
      .digest('hex');
    return `${model}:${textHash}`;
  }
  
  get(text: string, model: string): number[] | undefined {
    const key = this.getCacheKey(text, model);
    return this.cache.get(key);
  }
  
  set(text: string, model: string, embedding: number[]): void {
    const key = this.getCacheKey(text, model);
    // No TTL - embeddings don't expire
    this.cache.set(key, embedding);
  }
  
  getMetrics() {
    return this.cache.getMetrics();
  }
}
```

---

### Integration with Services

**Example: CatalogSearchService with Caching**

```typescript
export class CatalogSearchService {
  constructor(
    private repository: ICatalogRepository,
    private cache: SearchResultCache<SearchResults>,
    private logger: ILogger,
    private metrics: IMetricsCollector
  ) {}
  
  async search(params: SearchParams): Promise<SearchResults> {
    // Check cache first
    const cached = this.cache.get(params.text, params);
    if (cached) {
      this.logger.debug('Cache hit', { query: params.text });
      this.metrics.incrementCounter('search.cache', { status: 'hit' });
      return cached;
    }
    
    this.metrics.incrementCounter('search.cache', { status: 'miss' });
    
    // Execute search
    const results = await this.repository.search(params);
    
    // Cache results
    this.cache.set(params.text, params, results);
    
    return results;
  }
}
```

---

## Success Criteria

### Functional Requirements
- [ ] LRU cache implemented with metrics
- [ ] Search result cache working
- [ ] Embedding cache working
- [ ] Cache metrics tracked
- [ ] Cache warming implemented

### Performance Targets
- [ ] Search result cache hit rate >60%
- [ ] Embedding cache hit rate >70%
- [ ] Search latency reduced by 40-60% for cached queries
- [ ] Embedding API calls reduced by 40-80%
- [ ] Cache memory usage <100MB

### Quality Requirements
- [ ] 100% test coverage for cache implementations
- [ ] Cache metrics visible in dashboard
- [ ] Cache invalidation working correctly
- [ ] No memory leaks (bounded cache sizes)
- [ ] ADR documenting caching strategy

---

## Testing Strategy

### Unit Tests
- LRU eviction behavior
- TTL expiration
- Cache metrics accuracy
- Key generation consistency
- Edge cases (empty cache, full cache)

### Integration Tests
- Search with cache integration
- Embedding with cache integration
- Cache warming
- Metrics collection

### Performance Tests
- Cache hit rate measurement
- Latency improvement validation
- Memory usage monitoring
- Load testing with cache

---

## Validation Steps

1. **Baseline Measurement** - Measure current performance
2. **Implementation** - Implement caching
3. **Performance Comparison** - Measure improvement
4. **Cache Effectiveness** - Monitor hit rates
5. **Load Testing** - Verify under load

---

## Documentation Requirements

### ADR Required
- **ADR 0041:** Multi-Level Caching Strategy
  - Context: Performance optimization needs
  - Decision: LRU cache for search and embeddings
  - Implementation: Multi-level cache architecture
  - Consequences: Improved performance, memory considerations

### User Documentation
- Cache configuration guide
- Cache warming strategies
- Cache invalidation procedures
- Monitoring cache effectiveness

---

## Estimated Timeline

| Task | Duration (Agentic) | Review | Total |
|------|-------------------|--------|-------|
| 3.1 LRU Cache | 45-60 min | 15 min | 60-75 min |
| 3.2 Search Cache | 45-60 min | 15 min | 60-75 min |
| 3.3 Embedding Cache | 45-60 min | 15 min | 60-75 min |
| 3.4 Monitoring | 30-45 min | 15 min | 45-60 min |
| **TOTAL** | **3-4h** | **1h** | **4-5h** |

---

## Implementation Selection Matrix

Use this matrix to select which sub-phases to implement. Mark with ✓ to include or X to skip.

| Sub-Phase | Description | Duration | Include |
|-----------|-------------|----------|---------|
| Task 3.1 | LRU Cache Implementation | 45-60 min | ✓ |
| Task 3.2 | Search Result Cache | 45-60 min | ✓ |
| Task 3.3 | Embedding Cache | 45-60 min | ✓ |
| Task 3.4 | Cache Monitoring & Management | 30-45 min | ✓ |

**Instructions:** Replace ✓ with X for any sub-phase you wish to skip.

---

**Status:** Ready for implementation  
**Next Document:** [06-resilience-patterns-plan.md](06-resilience-patterns-plan.md)

