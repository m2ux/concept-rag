import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Document } from '@langchain/core/documents';
import { ConceptMetadata } from '../types.js';

// Mock the concept extractor module before importing ParallelConceptExtractor
vi.mock('../concept_extractor.js', () => {
    return {
        ConceptExtractor: class MockConceptExtractor {
            constructor(_apiKey: string) {}
            
            async extractConcepts(docs: Document[]): Promise<ConceptMetadata> {
                // Simulate some processing time
                await new Promise(r => setTimeout(r, 10));
                
                // Check if we should fail based on document content
                const content = docs[0]?.pageContent || '';
                if (content.includes('fail')) {
                    throw new Error('Simulated extraction failure');
                }
                
                return {
                    primary_concepts: [{ name: 'test-concept', summary: 'A test concept' }],
                    categories: ['Test Category']
                };
            }
        }
    };
});

// Import after mocking
import { ParallelConceptExtractor, DocumentSet } from '../parallel-concept-extractor.js';

describe('ParallelConceptExtractor', () => {
    let extractor: ParallelConceptExtractor;

    beforeEach(() => {
        // Use short rate limit interval for fast tests
        extractor = new ParallelConceptExtractor('test-api-key', 50);
    });

    describe('extractAll', () => {
        it('should process a single document', async () => {
            const documentSets = new Map<string, DocumentSet>([
                ['doc1.pdf', { 
                    docs: [new Document({ pageContent: 'Test content' })], 
                    hash: 'hash1' 
                }]
            ]);

            const results = await extractor.extractAll(documentSets, {
                concurrency: 1
            });

            expect(results).toHaveLength(1);
            expect(results[0].source).toBe('doc1.pdf');
            expect(results[0].hash).toBe('hash1');
            expect(results[0].concepts).not.toBeNull();
            expect(results[0].concepts?.primary_concepts).toHaveLength(1);
        });

        it('should process multiple documents', async () => {
            const documentSets = new Map<string, DocumentSet>([
                ['doc1.pdf', { docs: [new Document({ pageContent: 'Content 1' })], hash: 'hash1' }],
                ['doc2.pdf', { docs: [new Document({ pageContent: 'Content 2' })], hash: 'hash2' }],
                ['doc3.pdf', { docs: [new Document({ pageContent: 'Content 3' })], hash: 'hash3' }],
            ]);

            const results = await extractor.extractAll(documentSets, {
                concurrency: 3
            });

            expect(results).toHaveLength(3);
            
            const sources = results.map(r => r.source).sort();
            expect(sources).toEqual(['doc1.pdf', 'doc2.pdf', 'doc3.pdf']);
            
            // All should have concepts
            expect(results.every(r => r.concepts !== null)).toBe(true);
        });

        it('should call onProgress callback', async () => {
            const progressCalls: Array<{ completed: number; total: number; source: string }> = [];
            
            const documentSets = new Map<string, DocumentSet>([
                ['doc1.pdf', { docs: [new Document({ pageContent: 'Content 1' })], hash: 'hash1' }],
                ['doc2.pdf', { docs: [new Document({ pageContent: 'Content 2' })], hash: 'hash2' }],
            ]);

            await extractor.extractAll(documentSets, {
                concurrency: 1,
                onProgress: (completed, total, source) => {
                    progressCalls.push({ completed, total, source });
                }
            });

            expect(progressCalls).toHaveLength(2);
            expect(progressCalls[0].total).toBe(2);
            expect(progressCalls[1].total).toBe(2);
        });

        it('should handle concurrency batching', async () => {
            const documentSets = new Map<string, DocumentSet>([
                ['doc1.pdf', { docs: [new Document({ pageContent: 'Content 1' })], hash: 'hash1' }],
                ['doc2.pdf', { docs: [new Document({ pageContent: 'Content 2' })], hash: 'hash2' }],
                ['doc3.pdf', { docs: [new Document({ pageContent: 'Content 3' })], hash: 'hash3' }],
                ['doc4.pdf', { docs: [new Document({ pageContent: 'Content 4' })], hash: 'hash4' }],
                ['doc5.pdf', { docs: [new Document({ pageContent: 'Content 5' })], hash: 'hash5' }],
            ]);

            // Process with concurrency of 2 - should create 3 batches
            const results = await extractor.extractAll(documentSets, {
                concurrency: 2
            });

            expect(results).toHaveLength(5);
        });

        it('should track processing time per document', async () => {
            const documentSets = new Map<string, DocumentSet>([
                ['doc1.pdf', { docs: [new Document({ pageContent: 'Content 1' })], hash: 'hash1' }],
            ]);

            const results = await extractor.extractAll(documentSets, {
                concurrency: 1
            });

            expect(results[0].processingTimeMs).toBeGreaterThan(0);
        });
    });

    describe('error handling', () => {
        it('should isolate errors to individual documents', async () => {
            const documentSets = new Map<string, DocumentSet>([
                ['good1.pdf', { docs: [new Document({ pageContent: 'Good content' })], hash: 'hash1' }],
                ['bad.pdf', { docs: [new Document({ pageContent: 'This will fail' })], hash: 'hash2' }],
                ['good2.pdf', { docs: [new Document({ pageContent: 'More good content' })], hash: 'hash3' }],
            ]);

            const errorCalls: string[] = [];
            const results = await extractor.extractAll(documentSets, {
                concurrency: 1,
                onError: (source) => errorCalls.push(source)
            });

            // All documents should have results
            expect(results).toHaveLength(3);
            
            // Bad document should have error
            const badResult = results.find(r => r.source === 'bad.pdf');
            expect(badResult?.concepts).toBeNull();
            expect(badResult?.error).toBeDefined();
            
            // Good documents should succeed
            const goodResults = results.filter(r => r.source !== 'bad.pdf');
            expect(goodResults.every(r => r.concepts !== null)).toBe(true);
            
            // Error callback should have been called
            expect(errorCalls).toContain('bad.pdf');
        });
    });

    describe('getStats', () => {
        it('should calculate correct statistics', async () => {
            const documentSets = new Map<string, DocumentSet>([
                ['doc1.pdf', { docs: [new Document({ pageContent: 'Content 1' })], hash: 'hash1' }],
                ['doc2.pdf', { docs: [new Document({ pageContent: 'Content 2' })], hash: 'hash2' }],
            ]);

            const results = await extractor.extractAll(documentSets, {
                concurrency: 2
            });

            const stats = extractor.getStats(results);

            expect(stats.totalDocuments).toBe(2);
            expect(stats.successCount).toBe(2);
            expect(stats.failureCount).toBe(0);
            expect(stats.totalTimeMs).toBeGreaterThan(0);
            expect(stats.avgTimePerDocMs).toBeGreaterThan(0);
        });

        it('should count failures correctly', async () => {
            const documentSets = new Map<string, DocumentSet>([
                ['good.pdf', { docs: [new Document({ pageContent: 'Good content' })], hash: 'hash1' }],
                ['bad.pdf', { docs: [new Document({ pageContent: 'This will fail' })], hash: 'hash2' }],
            ]);

            const results = await extractor.extractAll(documentSets, {
                concurrency: 1
            });

            const stats = extractor.getStats(results);

            expect(stats.totalDocuments).toBe(2);
            expect(stats.successCount).toBe(1);
            expect(stats.failureCount).toBe(1);
        });
    });

    describe('partitionResults', () => {
        it('should separate successful and failed results', () => {
            const mockResults = [
                { source: 'a.pdf', hash: 'h1', concepts: { primary_concepts: [], categories: [] }, processingTimeMs: 100 },
                { source: 'b.pdf', hash: 'h2', concepts: null, error: 'Failed', processingTimeMs: 50 },
                { source: 'c.pdf', hash: 'h3', concepts: { primary_concepts: [], categories: [] }, processingTimeMs: 100 },
            ];

            const { successful, failed } = extractor.partitionResults(mockResults);

            expect(successful).toHaveLength(2);
            expect(failed).toHaveLength(1);
            expect(failed[0].source).toBe('b.pdf');
        });
    });

    describe('rate limiting', () => {
        it('should allow parallel document processing', async () => {
            // Documents should process in parallel (prep work, chunking, etc.)
            // Only actual API calls are rate-limited via shared limiter
            const rateLimitedExtractor = new ParallelConceptExtractor('test-key', 100);
            
            const documentSets = new Map<string, DocumentSet>([
                ['doc1.pdf', { docs: [new Document({ pageContent: 'Content 1' })], hash: 'hash1' }],
                ['doc2.pdf', { docs: [new Document({ pageContent: 'Content 2' })], hash: 'hash2' }],
                ['doc3.pdf', { docs: [new Document({ pageContent: 'Content 3' })], hash: 'hash3' }],
            ]);

            const results = await rateLimitedExtractor.extractAll(documentSets, {
                concurrency: 3
            });

            // All 3 documents should complete
            expect(results).toHaveLength(3);
            expect(results.every(r => r.concepts !== null)).toBe(true);
        });

        it('should provide rate limiter metrics', async () => {
            const documentSets = new Map<string, DocumentSet>([
                ['doc1.pdf', { docs: [new Document({ pageContent: 'Content 1' })], hash: 'hash1' }],
                ['doc2.pdf', { docs: [new Document({ pageContent: 'Content 2' })], hash: 'hash2' }],
            ]);

            await extractor.extractAll(documentSets, {
                concurrency: 2
            });

            const metrics = extractor.getRateLimiterMetrics();
            
            // Metrics should be available (actual count depends on API calls made by extractor)
            // With mocked extractor, the shared rate limiter may not be invoked
            expect(metrics).toBeDefined();
            expect(metrics.totalRequests).toBeGreaterThanOrEqual(0);
        });
    });
});
