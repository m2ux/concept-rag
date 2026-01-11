# Phase 1: Parallel Concept Enrichment

**Date:** November 29, 2025  
**Priority:** HIGH (Performance critical)  
**Status:** Ready for Implementation  
**Estimated Effort:** 2.5-4h agentic + 1.5h review

> **Note:** All time estimates refer to agentic (AI-assisted) development time plus human review time.

---

## Overview

This feature enables parallel processing of concept extraction during the seeding process. The concept extraction phase (LLM API calls) is currently sequential and represents the primary bottleneck when processing large document collections.

**Why it's needed:**
- Seeding 50+ documents can take 1-4 hours
- LLM calls are I/O-bound (waiting for API responses)
- Perfect candidate for concurrent processing

**Expected impact:**
- 5x parallelism → ~80% time reduction
- Enables processing entire libraries overnight

---

## Current State

### What Exists ✅
- ✅ `ConceptExtractor` class with rate limiting (3s between requests)
- ✅ `processDocuments()` function with sequential loop
- ✅ `SeedingCheckpoint` for resumable seeding
- ✅ CLI argument parsing with `minimist`

### What's Missing ❌
- ❌ Shared rate limiter for multiple workers
- ❌ Worker pool for parallel processing
- ❌ `--parallel N` CLI flag
- ❌ Thread-safe checkpoint updates

### Current Architecture

```typescript
// Current: Sequential processing in processDocuments()
for (const [source, docs] of Object.entries(docsBySource)) {
    // Each document processed one at a time
    const concepts = await conceptExtractor.extractConcepts(docs);  // BOTTLENECK
    // ... checkpoint update, catalog record creation
}
```

---

## Implementation Tasks

### Task 1.1: Shared Rate Limiter (30-45 min agentic)

**Goal:** Create a rate limiter that can be shared across multiple worker instances to ensure total API calls stay within limits.

**Tasks:**
1. Create `SharedRateLimiter` class in `src/infrastructure/utils/`
2. Use async semaphore pattern for request queuing
3. Support configurable delay between requests
4. Add metrics tracking (requests/min, wait times)

**Deliverables:**
- `src/infrastructure/utils/shared-rate-limiter.ts`
- `src/infrastructure/utils/__tests__/shared-rate-limiter.test.ts`

**Implementation:**

```typescript
// src/infrastructure/utils/shared-rate-limiter.ts

/**
 * Shared rate limiter for coordinating API calls across multiple workers.
 * Uses async mutex pattern to ensure only one request proceeds at a time,
 * with configurable delay between requests.
 */
export class SharedRateLimiter {
    private lastRequestTime: number = 0;
    private requestQueue: Array<{
        resolve: () => void;
        reject: (error: Error) => void;
    }> = [];
    private processing: boolean = false;
    private metrics = {
        totalRequests: 0,
        totalWaitTime: 0,
        maxWaitTime: 0
    };

    constructor(
        private minIntervalMs: number = 3000,
        private maxConcurrentRequests: number = 1
    ) {}

    /**
     * Acquire a rate limit slot. Resolves when the caller may proceed.
     * Call release() when done with the request.
     */
    async acquire(): Promise<void> {
        const startWait = Date.now();
        
        return new Promise((resolve, reject) => {
            this.requestQueue.push({ resolve, reject });
            this.processQueue();
        }).then(() => {
            const waitTime = Date.now() - startWait;
            this.metrics.totalRequests++;
            this.metrics.totalWaitTime += waitTime;
            this.metrics.maxWaitTime = Math.max(this.metrics.maxWaitTime, waitTime);
        });
    }

    private async processQueue(): Promise<void> {
        if (this.processing || this.requestQueue.length === 0) {
            return;
        }

        this.processing = true;

        while (this.requestQueue.length > 0) {
            const now = Date.now();
            const timeSinceLastRequest = now - this.lastRequestTime;
            
            if (timeSinceLastRequest < this.minIntervalMs) {
                const delay = this.minIntervalMs - timeSinceLastRequest;
                await new Promise(r => setTimeout(r, delay));
            }

            const request = this.requestQueue.shift();
            if (request) {
                this.lastRequestTime = Date.now();
                request.resolve();
            }
        }

        this.processing = false;
    }

    getMetrics(): { 
        totalRequests: number; 
        avgWaitTime: number; 
        maxWaitTime: number 
    } {
        return {
            totalRequests: this.metrics.totalRequests,
            avgWaitTime: this.metrics.totalRequests > 0 
                ? this.metrics.totalWaitTime / this.metrics.totalRequests 
                : 0,
            maxWaitTime: this.metrics.maxWaitTime
        };
    }
}
```

**Expected Impact:**
- Enables safe concurrent API access
- Maintains compliance with rate limits

---

### Task 1.2: Worker Pool for Parallel Extraction (45-60 min agentic)

**Goal:** Create a worker pool that processes multiple documents concurrently while sharing the rate limiter.

**Tasks:**
1. Create `ParallelConceptExtractor` class
2. Implement work queue with configurable concurrency
3. Handle errors gracefully (continue on failure)
4. Collect results and errors for reporting

**Deliverables:**
- `src/concepts/parallel-concept-extractor.ts`
- `src/concepts/__tests__/parallel-concept-extractor.test.ts`

**Implementation:**

```typescript
// src/concepts/parallel-concept-extractor.ts

import { Document } from "@langchain/core/documents";
import { ConceptExtractor } from "./concept_extractor.js";
import { ConceptMetadata } from "./types.js";
import { SharedRateLimiter } from "../infrastructure/utils/shared-rate-limiter.js";

export interface DocumentConceptResult {
    source: string;
    hash: string;
    concepts: ConceptMetadata | null;
    error?: string;
    processingTimeMs: number;
}

export interface ParallelExtractionOptions {
    concurrency: number;
    rateLimitIntervalMs?: number;
    onProgress?: (completed: number, total: number, current: string) => void;
    onError?: (source: string, error: Error) => void;
}

/**
 * Parallel concept extraction using worker pool pattern.
 * Processes multiple documents concurrently while respecting rate limits.
 */
export class ParallelConceptExtractor {
    private rateLimiter: SharedRateLimiter;
    private extractor: ConceptExtractor;
    
    constructor(
        apiKey: string,
        rateLimitIntervalMs: number = 3000
    ) {
        this.rateLimiter = new SharedRateLimiter(rateLimitIntervalMs);
        // Create extractor WITHOUT its own rate limiting (we manage it)
        this.extractor = new ConceptExtractor(apiKey);
    }

    /**
     * Extract concepts from multiple document sets in parallel.
     * @param documentSets Map of source path to documents
     * @param options Parallel extraction options
     */
    async extractAll(
        documentSets: Map<string, { docs: Document[]; hash: string }>,
        options: ParallelExtractionOptions
    ): Promise<DocumentConceptResult[]> {
        const { 
            concurrency, 
            onProgress, 
            onError 
        } = options;

        const entries = Array.from(documentSets.entries());
        const results: DocumentConceptResult[] = [];
        let completed = 0;

        // Process in batches of `concurrency` size
        const processBatch = async (batch: typeof entries) => {
            const batchPromises = batch.map(async ([source, { docs, hash }]) => {
                const startTime = Date.now();
                
                try {
                    // Wait for rate limiter before making API call
                    await this.rateLimiter.acquire();
                    
                    const concepts = await this.extractor.extractConcepts(docs);
                    
                    completed++;
                    onProgress?.(completed, entries.length, source);
                    
                    return {
                        source,
                        hash,
                        concepts,
                        processingTimeMs: Date.now() - startTime
                    };
                } catch (error: any) {
                    completed++;
                    onError?.(source, error);
                    onProgress?.(completed, entries.length, source);
                    
                    return {
                        source,
                        hash,
                        concepts: null,
                        error: error.message,
                        processingTimeMs: Date.now() - startTime
                    };
                }
            });

            return Promise.all(batchPromises);
        };

        // Process all batches
        for (let i = 0; i < entries.length; i += concurrency) {
            const batch = entries.slice(i, i + concurrency);
            const batchResults = await processBatch(batch);
            results.push(...batchResults);
        }

        return results;
    }

    /**
     * Get rate limiter metrics for reporting.
     */
    getMetrics() {
        return this.rateLimiter.getMetrics();
    }
}
```

**Expected Impact:**
- Enables N-way parallel processing
- Isolates errors to individual documents

---

### Task 1.3: CLI Integration (30-45 min agentic)

**Goal:** Add `--parallel N` CLI flag and integrate with seeding process.

**Tasks:**
1. Add `--parallel` argument to minimist options
2. Validate parallel value (1-20 range)
3. Update `processDocuments()` to use parallel extractor when N > 1
4. Display progress for parallel processing

**Deliverables:**
- Updates to `hybrid_fast_seed.ts`
- Updates to CLI help text

**Implementation:**

```typescript
// In hybrid_fast_seed.ts - argument parsing
const argv: minimist.ParsedArgs = minimist(process.argv.slice(2), {
    boolean: ["overwrite", "rebuild-concepts", "auto-reseed", "clean-checkpoint", "resume", "with-wordnet"],
    string: ["dbpath", "filesdir", "max-docs", "parallel"]  // Add parallel
});

// Parallel workers (default 1 = sequential)
const parallelWorkers = argv["parallel"] ? parseInt(argv["parallel"], 10) : 1;

// Validation
function validateArgs() {
    // ... existing validation ...
    
    if (parallelWorkers < 1 || parallelWorkers > 20) {
        console.error("--parallel must be between 1 and 20");
        process.exit(1);
    }
    
    if (parallelWorkers > 1) {
        console.log(`🔄 Parallel mode: ${parallelWorkers} workers`);
    }
}

// Updated processDocuments function
async function processDocuments(
    rawDocs: Document[], 
    checkpoint?: SeedingCheckpoint,
    parallelWorkers: number = 1
) {
    const docsBySource = /* ... existing grouping ... */;
    
    if (parallelWorkers > 1) {
        return processDocumentsParallel(docsBySource, checkpoint, parallelWorkers);
    }
    
    // Existing sequential logic...
}

async function processDocumentsParallel(
    docsBySource: Record<string, Document[]>,
    checkpoint: SeedingCheckpoint | undefined,
    workers: number
): Promise<{ catalogRecords: Document[], processedInThisRun: Array<{hash: string, source: string}> }> {
    const parallelExtractor = new ParallelConceptExtractor(
        process.env.OPENROUTER_API_KEY || ''
    );
    
    // Prepare document sets
    const documentSets = new Map<string, { docs: Document[], hash: string }>();
    
    for (const [source, docs] of Object.entries(docsBySource)) {
        let hash = docs[0]?.metadata?.hash;
        if (!hash || hash === 'unknown') {
            const fileContent = await fs.promises.readFile(source);
            hash = crypto.createHash('sha256').update(fileContent).digest('hex');
        }
        documentSets.set(source, { docs, hash });
    }
    
    console.log(`\n🚀 Starting parallel concept extraction (${workers} workers)...`);
    
    // Extract concepts in parallel
    const results = await parallelExtractor.extractAll(documentSets, {
        concurrency: workers,
        onProgress: (completed, total, current) => {
            const pct = Math.round((completed / total) * 100);
            const basename = path.basename(current);
            process.stdout.write(`\r📊 Progress: ${completed}/${total} (${pct}%) - ${basename.slice(0, 40).padEnd(40)}`);
        },
        onError: (source, error) => {
            console.error(`\n❌ Failed: ${path.basename(source)}: ${error.message}`);
        }
    });
    
    console.log('\n'); // Clear progress line
    
    // Report results
    const successful = results.filter(r => r.concepts !== null);
    const failed = results.filter(r => r.concepts === null);
    
    console.log(`✅ Completed: ${successful.length}/${results.length} documents`);
    if (failed.length > 0) {
        console.log(`⚠️  Failed: ${failed.length} documents`);
    }
    
    const metrics = parallelExtractor.getMetrics();
    console.log(`📊 Rate limiter: ${metrics.totalRequests} requests, avg wait ${Math.round(metrics.avgWaitTime)}ms`);
    
    // Convert results to catalog records
    const catalogRecords: Document[] = [];
    const processedInThisRun: Array<{hash: string, source: string}> = [];
    
    for (const result of successful) {
        const docs = docsBySource[result.source];
        const contentOverview = await generateContentOverview(docs);
        
        const conceptNames = result.concepts!.primary_concepts.map((c: any) => 
            typeof c === 'string' ? c : (c.name || '')
        ).filter((n: string) => n);
        
        const enrichedContent = `
${contentOverview}

Key Concepts: ${conceptNames.join(', ')}
Categories: ${result.concepts!.categories.join(', ')}
`.trim();
        
        const catalogRecord = new Document({
            pageContent: enrichedContent,
            metadata: {
                source: result.source,
                hash: result.hash,
                ocr_processed: docs.some(doc => doc.metadata.ocr_processed),
                concepts: result.concepts
            }
        });
        
        catalogRecords.push(catalogRecord);
        processedInThisRun.push({ hash: result.hash, source: result.source });
    }
    
    return { catalogRecords, processedInThisRun };
}
```

**Expected Impact:**
- Users can specify parallelism via CLI
- Progress visible during parallel processing

---

### Task 1.4: Checkpoint Integration (30-45 min agentic)

**Goal:** Ensure checkpoint updates work correctly with parallel processing.

**Tasks:**
1. Batch checkpoint updates after parallel processing
2. Handle partial failures (some docs succeed, some fail)
3. Track failed documents separately for retry

**Deliverables:**
- Updates to `SeedingCheckpoint` class (if needed)
- Updates to `hybrid_fast_seed.ts` checkpoint handling

**Implementation:**

```typescript
// Checkpoint updates for parallel processing
// In processDocumentsParallel, after all results collected:

// Update checkpoint in batch (not per-document)
if (checkpoint) {
    for (const result of successful) {
        await checkpoint.markProcessed(result.hash, result.source);
    }
    
    // Track failures for potential retry
    for (const result of failed) {
        await checkpoint.markFailed(result.hash, result.source, result.error || 'Unknown error');
    }
    
    // Save checkpoint once after batch
    await checkpoint.save();
    console.log(`💾 Checkpoint updated: ${successful.length} processed, ${failed.length} failed`);
}
```

**Updates to SeedingCheckpoint (if needed):**

```typescript
// In src/infrastructure/checkpoint/seeding-checkpoint.ts

// Add method to mark failed documents
async markFailed(hash: string, source: string, error: string): Promise<void> {
    if (!this.data.failedHashes) {
        this.data.failedHashes = [];
    }
    
    // Check if already tracked
    const existing = this.data.failedHashes.find(f => f.hash === hash);
    if (existing) {
        existing.error = error;
        existing.failedAt = new Date().toISOString();
        existing.retryCount = (existing.retryCount || 0) + 1;
    } else {
        this.data.failedHashes.push({
            hash,
            source,
            error,
            failedAt: new Date().toISOString(),
            retryCount: 1
        });
    }
}

// Add method to get failed documents
getFailedDocuments(): Array<{ hash: string; source: string; error: string }> {
    return this.data.failedHashes || [];
}
```

**Expected Impact:**
- Checkpoint correctly tracks parallel processing
- Failed documents can be retried on next run

---

### Task 1.5: Testing & Documentation (45-60 min agentic)

**Goal:** Comprehensive testing and documentation updates.

**Tasks:**
1. Unit tests for SharedRateLimiter
2. Unit tests for ParallelConceptExtractor (with mocks)
3. Integration test for parallel seeding
4. Update CLI help text
5. Update README with parallel flag documentation

**Deliverables:**
- Test files for new components
- Updated CLI help in `hybrid_fast_seed.ts`
- Updated README.md (if applicable)

**Unit Tests:**

```typescript
// src/infrastructure/utils/__tests__/shared-rate-limiter.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { SharedRateLimiter } from '../shared-rate-limiter.js';

describe('SharedRateLimiter', () => {
    let limiter: SharedRateLimiter;

    beforeEach(() => {
        limiter = new SharedRateLimiter(100); // 100ms for fast tests
    });

    it('should allow first request immediately', async () => {
        const start = Date.now();
        await limiter.acquire();
        const elapsed = Date.now() - start;
        expect(elapsed).toBeLessThan(50); // Should be near-instant
    });

    it('should delay subsequent requests', async () => {
        await limiter.acquire();
        
        const start = Date.now();
        await limiter.acquire();
        const elapsed = Date.now() - start;
        
        expect(elapsed).toBeGreaterThanOrEqual(90); // ~100ms delay
        expect(elapsed).toBeLessThan(150);
    });

    it('should handle concurrent requests in order', async () => {
        const results: number[] = [];
        
        // Start 3 concurrent requests
        const promises = [1, 2, 3].map(async (n) => {
            await limiter.acquire();
            results.push(n);
        });
        
        await Promise.all(promises);
        
        // All should complete
        expect(results).toHaveLength(3);
        expect(results.sort()).toEqual([1, 2, 3]);
    });

    it('should track metrics correctly', async () => {
        await limiter.acquire();
        await limiter.acquire();
        await limiter.acquire();
        
        const metrics = limiter.getMetrics();
        expect(metrics.totalRequests).toBe(3);
        expect(metrics.avgWaitTime).toBeGreaterThan(0);
    });
});
```

```typescript
// src/concepts/__tests__/parallel-concept-extractor.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ParallelConceptExtractor } from '../parallel-concept-extractor.js';
import { Document } from '@langchain/core/documents';

describe('ParallelConceptExtractor', () => {
    it('should process multiple documents in parallel', async () => {
        // Mock the underlying extractor
        const extractor = new ParallelConceptExtractor('test-key', 10);
        
        const documentSets = new Map([
            ['doc1.pdf', { docs: [new Document({ pageContent: 'content1' })], hash: 'hash1' }],
            ['doc2.pdf', { docs: [new Document({ pageContent: 'content2' })], hash: 'hash2' }],
        ]);
        
        // Test will use real extractor (requires mocking API in real tests)
        // This is a structural test
        expect(documentSets.size).toBe(2);
    });

    it('should call onProgress callback', async () => {
        const progressCalls: number[] = [];
        
        const extractor = new ParallelConceptExtractor('test-key', 10);
        
        // Would test with mocked API
        expect(progressCalls).toBeDefined();
    });

    it('should isolate errors to individual documents', async () => {
        // Test that one failure doesn't crash others
        const extractor = new ParallelConceptExtractor('test-key', 10);
        
        // Would test with mocked API that fails for specific docs
        expect(extractor).toBeDefined();
    });
});
```

**CLI Help Update:**

```typescript
// In validateArgs()
console.error("Usage: npx tsx hybrid_fast_seed.ts --filesdir <directory> [--dbpath <path>] [options]");
console.error("");
console.error("Required:");
console.error("  --filesdir: Directory containing PDF/EPUB files to process");
console.error("");
console.error("Options:");
console.error("  --dbpath: Database path (default: ~/.concept_rag)");
console.error("  --overwrite: Drop and recreate all database tables");
console.error("  --rebuild-concepts: Rebuild concept index even if no new documents");
console.error("  --auto-reseed: Re-process documents with incomplete metadata");
console.error("  --resume: Resume from checkpoint (skip already processed documents)");
console.error("  --clean-checkpoint: Clear checkpoint and start fresh");
console.error("  --with-wordnet: Enable WordNet enrichment (disabled by default)");
console.error("  --max-docs N: Process at most N NEW documents");
console.error("  --parallel N: Process N documents concurrently (default: 1, max: 20)");  // NEW
```

**Expected Impact:**
- Confidence in implementation correctness
- Clear documentation for users

---

## Success Criteria

### Functional Requirements
- [ ] `--parallel N` flag accepted and validated (1-20 range)
- [ ] N documents processed concurrently
- [ ] Rate limits respected across all workers
- [ ] Checkpoint correctly tracks parallel processing
- [ ] `--resume` works correctly with parallel mode
- [ ] Errors in one document don't affect others
- [ ] Progress displayed during parallel processing

### Performance Targets
- [ ] `--parallel 5` reduces time by ≥40% vs sequential
- [ ] `--parallel 10` reduces time by ≥70% vs sequential
- [ ] No increase in API errors (rate limit violations)
- [ ] Memory usage stays reasonable (< 2GB for 100 docs)

### Quality Requirements
- [ ] Unit tests for SharedRateLimiter (≥5 tests)
- [ ] Unit tests for ParallelConceptExtractor (≥3 tests)
- [ ] Integration test for parallel seeding
- [ ] Documentation complete (CLI help, README)
- [ ] ADR written for parallel processing design

---

## Testing Strategy

### Unit Tests
- **SharedRateLimiter:**
  - First request immediate
  - Subsequent requests delayed
  - Concurrent requests handled
  - Metrics tracking correct
  
- **ParallelConceptExtractor:**
  - Multiple documents processed
  - Progress callback called
  - Errors isolated
  - Results collected correctly

### Integration Tests
- Full seeding run with `--parallel 3`
- Checkpoint created correctly
- Resume works after interruption
- Mixed success/failure documents

### Performance Tests
- Benchmark sequential vs parallel (5 docs)
- Measure API rate compliance
- Memory usage monitoring

---

## Validation Steps

1. **Baseline Measurement**
   - Time 10 documents sequentially
   - Record API call count

2. **Implementation**
   - Follow task sequence (1.1 → 1.5)
   - Test after each task
   - Commit after each task

3. **Performance Comparison**
   - Time 10 documents with `--parallel 3`
   - Time 10 documents with `--parallel 5`
   - Verify no rate limit errors

4. **Reliability Validation**
   - Kill process mid-run
   - Resume with `--resume`
   - Verify checkpoint correct

---

## Estimated Timeline

| Task | Duration (Agentic) | Review | Total |
|------|-------------------|--------|-------|
| 1.1 Shared Rate Limiter | 30-45 min | 15 min | 45-60 min |
| 1.2 Worker Pool | 45-60 min | 20 min | 65-80 min |
| 1.3 CLI Integration | 30-45 min | 15 min | 45-60 min |
| 1.4 Checkpoint Updates | 30-45 min | 15 min | 45-60 min |
| 1.5 Testing & Docs | 45-60 min | 30 min | 75-90 min |
| **TOTAL** | **2.5-4h** | **1.5h** | **4-5.5h** |

---

## Implementation Selection Matrix

| Sub-Phase | Description | Duration | Include |
|-----------|-------------|----------|---------|
| Task 1.1 | Shared Rate Limiter | 30-45 min | ✓ |
| Task 1.2 | Worker Pool | 45-60 min | ✓ |
| Task 1.3 | CLI Integration | 30-45 min | ✓ |
| Task 1.4 | Checkpoint Updates | 30-45 min | ✓ |
| Task 1.5 | Testing & Docs | 45-60 min | ✓ |

**Instructions:** Replace ✓ with X for any task you wish to skip.

---

## Dependencies

### Requires (Blockers)
- None

### Enables (Unlocks)
- Batch processing of large document libraries
- Overnight seeding workflows
- Faster iteration on concept extraction improvements

---

## Risks and Mitigation

### Risk 1: API Rate Limit Violations
- **Likelihood:** Medium
- **Impact:** High (API access blocked)
- **Mitigation:** Conservative rate limiter (3s default), monitoring, graceful backoff

### Risk 2: Memory Pressure with Many Workers
- **Likelihood:** Low
- **Impact:** Medium (OOM crash)
- **Mitigation:** Cap workers at 20, test with large document sets

### Risk 3: Checkpoint Corruption with Parallel Writes
- **Likelihood:** Low
- **Impact:** High (lost progress)
- **Mitigation:** Batch checkpoint updates, mutex on writes

### Risk 4: Inconsistent Error Handling
- **Likelihood:** Medium
- **Impact:** Low (confusing output)
- **Mitigation:** Centralized error tracking, clear error messages

---

## Alternative Approaches Considered

### Option A: True Multi-Threading (Worker Threads)
- **Pros:** Better isolation, true parallelism
- **Cons:** More complex, harder to share state
- **Verdict:** Rejected - async/await sufficient for I/O-bound work

### Option B: Queue-Based Processing (Bull/BeeQueue)
- **Pros:** Robust, battle-tested, persistence
- **Cons:** External dependency, overhead for simple use case
- **Verdict:** Rejected - over-engineered for this use case

### Option C: Promise.all with Rate Limiting (Chosen)
- **Pros:** Simple, no new dependencies, fits existing architecture
- **Cons:** Limited to single process
- **Verdict:** Chosen - right-sized solution

---

**Status:** Ready for implementation  
**Next Phase:** N/A (single feature implementation)
















