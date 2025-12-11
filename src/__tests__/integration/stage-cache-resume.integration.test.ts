/**
 * Integration tests for stage cache resume scenarios.
 * 
 * These tests verify that the StageCache correctly handles resume scenarios
 * where processing was interrupted and needs to continue from cached results.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
    StageCache,
    type CachedDocumentData
} from '../../infrastructure/checkpoint/stage-cache.js';

describe('Stage Cache Resume Integration', () => {
    let tempDir: string;
    let cacheDir: string;

    beforeEach(async () => {
        tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'stage-cache-integration-'));
        cacheDir = path.join(tempDir, '.stage-cache');
    });

    afterEach(async () => {
        try {
            await fs.promises.rm(tempDir, { recursive: true, force: true });
        } catch {
            // Ignore cleanup errors
        }
    });

    const createMockDocumentData = (hash: string, source: string): CachedDocumentData => ({
        hash,
        source,
        processedAt: new Date().toISOString(),
        concepts: {
            primary_concepts: [
                { name: 'Test Concept', summary: 'A test concept' },
                'Another Concept'
            ],
            categories: ['Testing', 'Integration'],
            technical_terms: ['cache', 'resume'],
            related_concepts: ['Unit Testing', 'E2E Testing']
        },
        contentOverview: `Content overview for document ${hash.slice(0, 8)}`,
        metadata: {
            title: 'Test Document',
            author: 'Test Author',
            year: 2024
        }
    });

    describe('Resume from partial processing', () => {
        it('should load cached results and skip already-processed documents', async () => {
            // Simulate first run: process 3 documents and cache them
            const cache1 = await StageCache.create({ cacheDir });
            
            await cache1.set('hash1', createMockDocumentData('hash1', '/docs/doc1.pdf'));
            await cache1.set('hash2', createMockDocumentData('hash2', '/docs/doc2.pdf'));
            await cache1.set('hash3', createMockDocumentData('hash3', '/docs/doc3.pdf'));
            
            // Simulate second run: new cache instance should see all cached docs
            const cache2 = await StageCache.create({ cacheDir });
            
            const docs = ['hash1', 'hash2', 'hash3', 'hash4', 'hash5'];
            const cached: string[] = [];
            const needsProcessing: string[] = [];
            
            for (const hash of docs) {
                if (await cache2.has(hash)) {
                    cached.push(hash);
                } else {
                    needsProcessing.push(hash);
                }
            }
            
            expect(cached).toEqual(['hash1', 'hash2', 'hash3']);
            expect(needsProcessing).toEqual(['hash4', 'hash5']);
        });

        it('should persist data across cache instances', async () => {
            // First instance: write data
            const cache1 = await StageCache.create({ cacheDir });
            const data = createMockDocumentData('persist-test', '/docs/persist.pdf');
            await cache1.set('persist-test', data);
            
            // Second instance: read data
            const cache2 = await StageCache.create({ cacheDir });
            const retrieved = await cache2.get('persist-test');
            
            expect(retrieved).not.toBeNull();
            expect(retrieved?.hash).toBe('persist-test');
            expect(retrieved?.concepts?.primary_concepts).toHaveLength(2);
            expect(retrieved?.contentOverview).toContain('persist-');
        });
    });

    describe('Resume after downstream failure', () => {
        it('should preserve cache when simulated LanceDB write fails', async () => {
            const cache = await StageCache.create({ cacheDir });
            
            // Simulate processing documents and caching results
            await cache.set('doc1', createMockDocumentData('doc1', '/docs/1.pdf'));
            await cache.set('doc2', createMockDocumentData('doc2', '/docs/2.pdf'));
            await cache.set('doc3', createMockDocumentData('doc3', '/docs/3.pdf'));
            
            // Simulate downstream failure (LanceDB write)
            const simulatedLanceDBWrite = async () => {
                throw new Error('LanceDB schema error: column type mismatch');
            };
            
            let writeSucceeded = false;
            try {
                await simulatedLanceDBWrite();
                writeSucceeded = true;
            } catch {
                // Expected failure
            }
            
            expect(writeSucceeded).toBe(false);
            
            // Verify cache is still intact after failure
            const stats = await cache.getStats();
            expect(stats.count).toBe(3);
            
            // New cache instance should see all data
            const cache2 = await StageCache.create({ cacheDir });
            expect(await cache2.has('doc1')).toBe(true);
            expect(await cache2.has('doc2')).toBe(true);
            expect(await cache2.has('doc3')).toBe(true);
        });
    });

    describe('Cache statistics for resume decision', () => {
        it('should provide accurate stats for resume progress display', async () => {
            const cache = await StageCache.create({ cacheDir });
            
            // Add varying documents
            for (let i = 0; i < 10; i++) {
                await cache.set(`doc${i}`, createMockDocumentData(`doc${i}`, `/docs/doc${i}.pdf`));
            }
            
            const stats = await cache.getStats();
            
            expect(stats.count).toBe(10);
            expect(stats.totalSize).toBeGreaterThan(0);
            expect(stats.expiredCount).toBe(0);
            
            // Size should be reasonable (JSON files ~500-2000 bytes each)
            const avgSize = stats.totalSize / stats.count;
            expect(avgSize).toBeGreaterThan(100);
            expect(avgSize).toBeLessThan(10000);
        });

        it('should list all cached hashes for resume matching', async () => {
            const cache = await StageCache.create({ cacheDir });
            
            const expectedHashes = ['alpha', 'beta', 'gamma', 'delta'];
            for (const hash of expectedHashes) {
                await cache.set(hash, createMockDocumentData(hash, `/docs/${hash}.pdf`));
            }
            
            const hashes = await cache.listHashes();
            
            expect(hashes.sort()).toEqual(expectedHashes.sort());
        });
    });

    describe('Cache-only mode validation', () => {
        it('should correctly identify cached vs uncached documents', async () => {
            const cache = await StageCache.create({ cacheDir });
            
            // Pre-populate with some documents
            await cache.set('cached1', createMockDocumentData('cached1', '/docs/c1.pdf'));
            await cache.set('cached2', createMockDocumentData('cached2', '/docs/c2.pdf'));
            
            // Simulate cache-only mode check
            const allDocs = ['cached1', 'cached2', 'uncached1', 'uncached2'];
            const uncached: string[] = [];
            
            for (const hash of allDocs) {
                if (!(await cache.has(hash))) {
                    uncached.push(hash);
                }
            }
            
            expect(uncached).toEqual(['uncached1', 'uncached2']);
            
            // In cache-only mode, this would be an error condition
            if (uncached.length > 0) {
                const errorMessage = `Cache-only mode: ${uncached.length} document(s) not in cache`;
                expect(errorMessage).toContain('2 document(s)');
            }
        });
    });

    describe('TTL expiration and resume', () => {
        it('should not use expired cache entries on resume', async () => {
            // Create cache with very short TTL
            const cache = await StageCache.create({ cacheDir, ttlMs: 1 });
            
            await cache.set('expired', createMockDocumentData('expired', '/docs/expired.pdf'));
            
            // Wait for expiration
            await new Promise(resolve => setTimeout(resolve, 10));
            
            // Should not find expired entry
            expect(await cache.has('expired')).toBe(false);
            expect(await cache.get('expired')).toBeNull();
            
            // Stats should show as expired
            const stats = await cache.getStats();
            expect(stats.expiredCount).toBe(1);
            expect(stats.count).toBe(0);
        });

        it('should clean expired entries on resume', async () => {
            const cache = await StageCache.create({ cacheDir, ttlMs: 1 });
            
            await cache.set('exp1', createMockDocumentData('exp1', '/docs/e1.pdf'));
            await cache.set('exp2', createMockDocumentData('exp2', '/docs/e2.pdf'));
            
            await new Promise(resolve => setTimeout(resolve, 10));
            
            const cleaned = await cache.cleanExpired();
            expect(cleaned).toBe(2);
            
            // Verify files are actually deleted
            const stats = await cache.getStats();
            expect(stats.count).toBe(0);
            expect(stats.expiredCount).toBe(0);
        });
    });

    describe('Concurrent resume safety', () => {
        it('should handle concurrent read operations safely', async () => {
            const cache = await StageCache.create({ cacheDir });
            
            // Populate cache
            for (let i = 0; i < 20; i++) {
                await cache.set(`concurrent${i}`, createMockDocumentData(`concurrent${i}`, `/docs/${i}.pdf`));
            }
            
            // Simulate concurrent resume reads
            const readPromises = Array(50).fill(null).map(async (_, i) => {
                const hash = `concurrent${i % 20}`;
                const result = await cache.get(hash);
                return { hash, found: result !== null };
            });
            
            const results = await Promise.all(readPromises);
            
            // All reads should succeed
            expect(results.every(r => r.found)).toBe(true);
        });
    });
});
