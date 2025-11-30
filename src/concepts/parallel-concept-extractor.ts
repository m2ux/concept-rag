/**
 * Parallel Concept Extractor
 * 
 * Processes multiple documents concurrently for concept extraction while
 * respecting API rate limits. Uses a shared rate limiter to coordinate
 * across all workers.
 * 
 * @example
 * ```typescript
 * const extractor = new ParallelConceptExtractor('api-key', 3000);
 * 
 * const documentSets = new Map([
 *   ['doc1.pdf', { docs: [...], hash: 'abc123' }],
 *   ['doc2.pdf', { docs: [...], hash: 'def456' }],
 * ]);
 * 
 * const results = await extractor.extractAll(documentSets, {
 *   concurrency: 5,
 *   onProgress: (done, total, current) => {
 *     console.log(`Progress: ${done}/${total}`);
 *   }
 * });
 * ```
 */

import { Document } from "@langchain/core/documents";
import { ConceptExtractor } from "./concept_extractor.js";
import { ConceptMetadata } from "./types.js";
import { SharedRateLimiter, RateLimiterMetrics } from "../infrastructure/utils/shared-rate-limiter.js";

/**
 * Result of concept extraction for a single document.
 */
export interface DocumentConceptResult {
    /** Source file path */
    source: string;
    /** Document hash */
    hash: string;
    /** Extracted concepts, or null if extraction failed */
    concepts: ConceptMetadata | null;
    /** Error message if extraction failed */
    error?: string;
    /** Time taken to process this document in milliseconds */
    processingTimeMs: number;
}

/**
 * Options for parallel concept extraction.
 */
export interface ParallelExtractionOptions {
    /** Number of documents to process concurrently */
    concurrency: number;
    /** Callback for progress updates (document completed) */
    onProgress?: (completed: number, total: number, currentSource: string, workerIndex: number) => void;
    /** Callback for error notifications */
    onError?: (source: string, error: Error, workerIndex: number) => void;
    /** Callback for chunk progress updates within a document (for inline progress display) */
    onChunkProgress?: (completed: number, total: number, currentSource: string, chunkNum: number, totalChunks: number, workerIndex: number) => void;
    /** Callback when a worker starts processing a document */
    onWorkerStart?: (workerIndex: number, source: string, totalChunks: number) => void;
    /** Callback for status messages (warnings, errors, success) from extractor */
    onMessage?: (workerIndex: number, message: string) => void;
}

/**
 * Summary statistics for a parallel extraction run.
 */
export interface ParallelExtractionStats {
    /** Total documents processed */
    totalDocuments: number;
    /** Documents that succeeded */
    successCount: number;
    /** Documents that failed */
    failureCount: number;
    /** Total processing time in milliseconds */
    totalTimeMs: number;
    /** Average time per document in milliseconds */
    avgTimePerDocMs: number;
    /** Rate limiter metrics */
    rateLimiterMetrics: RateLimiterMetrics;
}

/**
 * Document set prepared for parallel extraction.
 */
export interface DocumentSet {
    /** Array of document pages/chunks */
    docs: Document[];
    /** Document hash for tracking */
    hash: string;
}

/**
 * Parallel concept extraction using worker pool pattern.
 * Processes multiple documents concurrently while respecting rate limits.
 */
export class ParallelConceptExtractor {
    private rateLimiter: SharedRateLimiter;
    private apiKey: string;
    private startTime: number = 0;
    
    /**
     * Creates a new parallel concept extractor.
     * 
     * @param apiKey - OpenRouter API key
     * @param rateLimitIntervalMs - Minimum interval between API calls (default: 3000ms)
     */
    constructor(
        apiKey: string,
        rateLimitIntervalMs: number = 3000
    ) {
        this.apiKey = apiKey;
        this.rateLimiter = new SharedRateLimiter(rateLimitIntervalMs);
    }

    /**
     * Extract concepts from multiple document sets in parallel.
     * 
     * @param documentSets - Map of source path to document set
     * @param options - Parallel extraction options
     * @returns Array of results for each document
     */
    async extractAll(
        documentSets: Map<string, DocumentSet>,
        options: ParallelExtractionOptions
    ): Promise<DocumentConceptResult[]> {
        const { 
            concurrency, 
            onProgress, 
            onError,
            onChunkProgress,
            onWorkerStart,
            onMessage
        } = options;

        const entries = Array.from(documentSets.entries());
        const results: DocumentConceptResult[] = [];
        let completed = 0;
        
        this.startTime = Date.now();

        // Process in batches of `concurrency` size
        for (let i = 0; i < entries.length; i += concurrency) {
            const batch = entries.slice(i, i + concurrency);
            const batchResults = await this.processBatch(
                batch, 
                () => {
                    completed++;
                },
                (source, workerIndex) => {
                    onProgress?.(completed, entries.length, source, workerIndex);
                },
                (source, error, workerIndex) => {
                    onError?.(source, error, workerIndex);
                },
                (source, chunkNum, totalChunks, workerIndex) => {
                    onChunkProgress?.(completed, entries.length, source, chunkNum, totalChunks, workerIndex);
                },
                onWorkerStart,
                onMessage
            );
            results.push(...batchResults);
        }

        return results;
    }

    /**
     * Process a batch of documents concurrently.
     * Documents process in parallel; only API calls are rate-limited via shared limiter.
     */
    private async processBatch(
        batch: Array<[string, DocumentSet]>,
        onComplete: () => void,
        onProgress: (source: string, workerIndex: number) => void,
        onError?: (source: string, error: Error, workerIndex: number) => void,
        onChunkProgress?: (source: string, chunkNum: number, totalChunks: number, workerIndex: number) => void,
        onWorkerStart?: (workerIndex: number, source: string, totalChunks: number) => void,
        onMessage?: (workerIndex: number, message: string) => void
    ): Promise<DocumentConceptResult[]> {
        const batchPromises = batch.map(async ([source, { docs, hash }], workerIndex) => {
            const startTime = Date.now();
            
            // Estimate chunk count (similar to extractor logic)
            const totalContent = docs.map(d => d.pageContent).join('\n');
            const estimatedChunks = Math.ceil(totalContent.length / 80000) || 1;
            
            // Notify worker start
            onWorkerStart?.(workerIndex, source, estimatedChunks);
            
            try {
                // Create extractor with shared rate limiter and source label
                // Rate limiting happens at API call level, not document level
                // This allows documents to process in parallel (chunking, etc.)
                // while API calls are properly coordinated
                const sourceLabel = source.split('/').pop()?.slice(0, 30) || source.slice(0, 30);
                const extractor = new ConceptExtractor(this.apiKey, {
                    sharedRateLimiter: this.rateLimiter,
                    sourceLabel,
                    onChunkProgress: onChunkProgress 
                        ? (chunkNum, totalChunks) => onChunkProgress(source, chunkNum, totalChunks, workerIndex)
                        : undefined,
                    onMessage: onMessage
                        ? (message) => onMessage(workerIndex, message)
                        : undefined
                });
                const concepts = await extractor.extractConcepts(docs);
                
                onComplete();
                onProgress(source, workerIndex);
                
                return {
                    source,
                    hash,
                    concepts,
                    processingTimeMs: Date.now() - startTime
                };
            } catch (error: any) {
                onError?.(source, error, workerIndex);
                onComplete();
                onProgress(source, workerIndex);
                
                return {
                    source,
                    hash,
                    concepts: null,
                    error: error.message || 'Unknown error',
                    processingTimeMs: Date.now() - startTime
                };
            }
        });

        return Promise.all(batchPromises);
    }

    /**
     * Get statistics about the extraction run.
     * 
     * @param results - Results from extractAll()
     * @returns Summary statistics
     */
    getStats(results: DocumentConceptResult[]): ParallelExtractionStats {
        const successCount = results.filter(r => r.concepts !== null).length;
        const failureCount = results.filter(r => r.concepts === null).length;
        const totalTimeMs = results.reduce((sum, r) => sum + r.processingTimeMs, 0);
        
        return {
            totalDocuments: results.length,
            successCount,
            failureCount,
            totalTimeMs: Date.now() - this.startTime,
            avgTimePerDocMs: results.length > 0 ? Math.round(totalTimeMs / results.length) : 0,
            rateLimiterMetrics: this.rateLimiter.getMetrics()
        };
    }

    /**
     * Get rate limiter metrics.
     */
    getRateLimiterMetrics(): RateLimiterMetrics {
        return this.rateLimiter.getMetrics();
    }

    /**
     * Partition results into successful and failed extractions.
     * 
     * @param results - Results from extractAll()
     * @returns Object with successful and failed results
     */
    partitionResults(results: DocumentConceptResult[]): {
        successful: DocumentConceptResult[];
        failed: DocumentConceptResult[];
    } {
        return {
            successful: results.filter(r => r.concepts !== null),
            failed: results.filter(r => r.concepts === null)
        };
    }
}

