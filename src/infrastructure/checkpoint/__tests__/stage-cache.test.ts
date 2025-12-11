import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
    StageCache,
    type StageCacheOptions,
    type CachedDocumentData
} from '../stage-cache.js';

describe('StageCache', () => {
    let tempDir: string;
    let cacheDir: string;
    let defaultOptions: StageCacheOptions;

    beforeEach(async () => {
        // Create temp directory for tests
        tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'stage-cache-test-'));
        cacheDir = path.join(tempDir, '.stage-cache');
        defaultOptions = {
            cacheDir,
            ttlMs: 7 * 24 * 60 * 60 * 1000 // 7 days
        };
    });

    afterEach(async () => {
        // Clean up temp directory
        try {
            await fs.promises.rm(tempDir, { recursive: true, force: true });
        } catch {
            // Ignore cleanup errors
        }
    });

    const createSampleData = (hash: string = 'abc123'): CachedDocumentData => ({
        hash,
        source: '/test/documents/sample.pdf',
        processedAt: new Date().toISOString(),
        concepts: {
            primary_concepts: [
                { name: 'Machine Learning', summary: 'A field of AI' },
                'Neural Networks'
            ],
            categories: ['Technology', 'AI'],
            technical_terms: ['backpropagation', 'gradient descent'],
            related_concepts: ['Deep Learning', 'Data Science']
        },
        contentOverview: 'This document covers machine learning concepts.',
        metadata: {
            title: 'Introduction to ML',
            author: 'John Doe',
            year: 2023
        }
    });

    describe('constructor and initialize', () => {
        it('should create cache with default TTL', () => {
            const cache = new StageCache({ cacheDir });

            expect(cache.getCacheDir()).toBe(cacheDir);
            expect(cache.getTtlMs()).toBe(StageCache.DEFAULT_TTL_MS);
        });

        it('should create cache with custom TTL', () => {
            const customTtl = 24 * 60 * 60 * 1000; // 1 day
            const cache = new StageCache({ cacheDir, ttlMs: customTtl });

            expect(cache.getTtlMs()).toBe(customTtl);
        });

        it('should create cache directory on initialize', async () => {
            const cache = new StageCache(defaultOptions);
            await cache.initialize();

            expect(fs.existsSync(cacheDir)).toBe(true);
        });

        it('should not error if directory already exists', async () => {
            await fs.promises.mkdir(cacheDir, { recursive: true });
            const cache = new StageCache(defaultOptions);

            await expect(cache.initialize()).resolves.not.toThrow();
        });

        it('should only initialize once (idempotent)', async () => {
            const cache = new StageCache(defaultOptions);

            await cache.initialize();
            await cache.initialize();
            await cache.initialize();

            expect(fs.existsSync(cacheDir)).toBe(true);
        });
    });

    describe('get and set', () => {
        it('should store and retrieve document data', async () => {
            const cache = new StageCache(defaultOptions);
            const data = createSampleData();

            await cache.set(data.hash, data);
            const retrieved = await cache.get(data.hash);

            expect(retrieved).toEqual(data);
        });

        it('should return null for non-existent hash', async () => {
            const cache = new StageCache(defaultOptions);
            await cache.initialize();

            const result = await cache.get('nonexistent');

            expect(result).toBeNull();
        });

        it('should persist data to JSON file', async () => {
            const cache = new StageCache(defaultOptions);
            const data = createSampleData();

            await cache.set(data.hash, data);

            const filePath = path.join(cacheDir, `${data.hash}.json`);
            expect(fs.existsSync(filePath)).toBe(true);

            const content = await fs.promises.readFile(filePath, 'utf-8');
            const parsed = JSON.parse(content);
            expect(parsed.hash).toBe(data.hash);
            expect(parsed.concepts.primary_concepts).toHaveLength(2);
        });

        it('should overwrite existing cache entry', async () => {
            const cache = new StageCache(defaultOptions);
            const data1 = createSampleData();
            const data2 = { ...createSampleData(), contentOverview: 'Updated overview' };

            await cache.set(data1.hash, data1);
            await cache.set(data2.hash, data2);

            const retrieved = await cache.get(data1.hash);
            expect(retrieved?.contentOverview).toBe('Updated overview');
        });

        it('should handle data without optional fields', async () => {
            const cache = new StageCache(defaultOptions);
            const minimalData: CachedDocumentData = {
                hash: 'minimal123',
                source: '/test/minimal.pdf',
                processedAt: new Date().toISOString()
            };

            await cache.set(minimalData.hash, minimalData);
            const retrieved = await cache.get(minimalData.hash);

            expect(retrieved).toEqual(minimalData);
            expect(retrieved?.concepts).toBeUndefined();
            expect(retrieved?.contentOverview).toBeUndefined();
        });

        it('should handle large data (multi-MB)', async () => {
            const cache = new StageCache(defaultOptions);
            const largeData = createSampleData('large123');

            // Create a large concepts array
            largeData.concepts = {
                primary_concepts: Array(1000).fill(null).map((_, i) => ({
                    name: `Concept ${i}`,
                    summary: `This is a detailed summary for concept number ${i} with lots of text to make it larger.`
                })),
                categories: Array(100).fill(null).map((_, i) => `Category ${i}`),
                technical_terms: Array(500).fill(null).map((_, i) => `term_${i}`),
                related_concepts: Array(200).fill(null).map((_, i) => `Related ${i}`)
            };

            await cache.set(largeData.hash, largeData);
            const retrieved = await cache.get(largeData.hash);

            expect(retrieved?.concepts?.primary_concepts).toHaveLength(1000);
            expect(retrieved?.concepts?.categories).toHaveLength(100);
        });
    });

    describe('has', () => {
        it('should return true for existing entry', async () => {
            const cache = new StageCache(defaultOptions);
            const data = createSampleData();

            await cache.set(data.hash, data);

            expect(await cache.has(data.hash)).toBe(true);
        });

        it('should return false for non-existent entry', async () => {
            const cache = new StageCache(defaultOptions);
            await cache.initialize();

            expect(await cache.has('nonexistent')).toBe(false);
        });
    });

    describe('delete', () => {
        it('should remove cached entry', async () => {
            const cache = new StageCache(defaultOptions);
            const data = createSampleData();

            await cache.set(data.hash, data);
            expect(await cache.has(data.hash)).toBe(true);

            await cache.delete(data.hash);
            expect(await cache.has(data.hash)).toBe(false);
        });

        it('should not error when deleting non-existent entry', async () => {
            const cache = new StageCache(defaultOptions);
            await cache.initialize();

            await expect(cache.delete('nonexistent')).resolves.not.toThrow();
        });
    });

    describe('clear', () => {
        it('should remove all cached entries', async () => {
            const cache = new StageCache(defaultOptions);

            await cache.set('hash1', createSampleData('hash1'));
            await cache.set('hash2', createSampleData('hash2'));
            await cache.set('hash3', createSampleData('hash3'));

            const deleted = await cache.clear();

            expect(deleted).toBe(3);
            expect(await cache.has('hash1')).toBe(false);
            expect(await cache.has('hash2')).toBe(false);
            expect(await cache.has('hash3')).toBe(false);
        });

        it('should return 0 when cache is empty', async () => {
            const cache = new StageCache(defaultOptions);
            await cache.initialize();

            const deleted = await cache.clear();

            expect(deleted).toBe(0);
        });

        it('should not error when cache directory does not exist', async () => {
            const cache = new StageCache(defaultOptions);

            const deleted = await cache.clear();

            expect(deleted).toBe(0);
        });
    });

    describe('getStats', () => {
        it('should return correct statistics', async () => {
            const cache = new StageCache(defaultOptions);

            await cache.set('hash1', createSampleData('hash1'));
            await cache.set('hash2', createSampleData('hash2'));

            const stats = await cache.getStats();

            expect(stats.count).toBe(2);
            expect(stats.totalSize).toBeGreaterThan(0);
            expect(stats.expiredCount).toBe(0);
        });

        it('should return zeros for empty cache', async () => {
            const cache = new StageCache(defaultOptions);
            await cache.initialize();

            const stats = await cache.getStats();

            expect(stats.count).toBe(0);
            expect(stats.totalSize).toBe(0);
            expect(stats.expiredCount).toBe(0);
        });

        it('should return zeros when directory does not exist', async () => {
            const cache = new StageCache(defaultOptions);

            const stats = await cache.getStats();

            expect(stats.count).toBe(0);
            expect(stats.totalSize).toBe(0);
        });
    });

    describe('TTL expiration', () => {
        it('should return null for expired entries', async () => {
            // Use very short TTL
            const cache = new StageCache({ cacheDir, ttlMs: 1 });
            const data = createSampleData();

            await cache.set(data.hash, data);

            // Wait for expiration
            await new Promise(resolve => setTimeout(resolve, 10));

            const result = await cache.get(data.hash);
            expect(result).toBeNull();
        });

        it('should report expired count in stats', async () => {
            const cache = new StageCache({ cacheDir, ttlMs: 1 });

            await cache.set('hash1', createSampleData('hash1'));
            await new Promise(resolve => setTimeout(resolve, 10));

            const stats = await cache.getStats();

            expect(stats.expiredCount).toBe(1);
            expect(stats.count).toBe(0);
        });

        it('should return false for has() on expired entries', async () => {
            const cache = new StageCache({ cacheDir, ttlMs: 1 });

            await cache.set('hash1', createSampleData('hash1'));
            await new Promise(resolve => setTimeout(resolve, 10));

            expect(await cache.has('hash1')).toBe(false);
        });
    });

    describe('cleanExpired', () => {
        it('should remove expired entries', async () => {
            const cache = new StageCache({ cacheDir, ttlMs: 1 });

            await cache.set('hash1', createSampleData('hash1'));
            await new Promise(resolve => setTimeout(resolve, 10));

            const deleted = await cache.cleanExpired();

            expect(deleted).toBe(1);

            // Verify file is actually deleted
            const filePath = path.join(cacheDir, 'hash1.json');
            expect(fs.existsSync(filePath)).toBe(false);
        });

        it('should not remove non-expired entries', async () => {
            const cache = new StageCache(defaultOptions); // 7 day TTL

            await cache.set('hash1', createSampleData('hash1'));

            const deleted = await cache.cleanExpired();

            expect(deleted).toBe(0);
            expect(await cache.has('hash1')).toBe(true);
        });

        it('should return 0 when no expired entries', async () => {
            const cache = new StageCache(defaultOptions);
            await cache.initialize();

            const deleted = await cache.cleanExpired();

            expect(deleted).toBe(0);
        });
    });

    describe('listHashes', () => {
        it('should return all non-expired hashes', async () => {
            const cache = new StageCache(defaultOptions);

            await cache.set('hash1', createSampleData('hash1'));
            await cache.set('hash2', createSampleData('hash2'));
            await cache.set('hash3', createSampleData('hash3'));

            const hashes = await cache.listHashes();

            expect(hashes).toHaveLength(3);
            expect(hashes).toContain('hash1');
            expect(hashes).toContain('hash2');
            expect(hashes).toContain('hash3');
        });

        it('should exclude expired hashes', async () => {
            const cache = new StageCache({ cacheDir, ttlMs: 1 });

            await cache.set('hash1', createSampleData('hash1'));
            await new Promise(resolve => setTimeout(resolve, 10));

            const hashes = await cache.listHashes();

            expect(hashes).toHaveLength(0);
        });

        it('should return empty array for non-existent directory', async () => {
            const cache = new StageCache(defaultOptions);

            const hashes = await cache.listHashes();

            expect(hashes).toEqual([]);
        });
    });

    describe('atomic writes', () => {
        it('should not leave temp files on successful write', async () => {
            const cache = new StageCache(defaultOptions);
            const data = createSampleData();

            await cache.set(data.hash, data);

            const tempPath = path.join(cacheDir, `${data.hash}.json.tmp`);
            expect(fs.existsSync(tempPath)).toBe(false);

            const filePath = path.join(cacheDir, `${data.hash}.json`);
            expect(fs.existsSync(filePath)).toBe(true);
        });
    });

    describe('static methods', () => {
        it('getDefaultPath should return correct path', () => {
            const dbPath = '/home/user/.concept_rag/db';
            const result = StageCache.getDefaultPath(dbPath);

            expect(result).toBe('/home/user/.concept_rag/db/.stage-cache');
        });

        it('create factory should return initialized cache', async () => {
            const cache = await StageCache.create(defaultOptions);

            expect(cache).toBeInstanceOf(StageCache);
            expect(fs.existsSync(cacheDir)).toBe(true);

            // Should be able to use immediately
            await cache.set('test', createSampleData('test'));
            expect(await cache.has('test')).toBe(true);
        });
    });

    describe('error handling', () => {
        it('should handle corrupted JSON gracefully', async () => {
            const cache = new StageCache(defaultOptions);
            await cache.initialize();

            // Write corrupted JSON directly
            const filePath = path.join(cacheDir, 'corrupted.json');
            await fs.promises.writeFile(filePath, 'not valid json', 'utf-8');

            // Should return null, not throw
            const result = await cache.get('corrupted');
            expect(result).toBeNull();
        });
    });

    describe('concurrent access', () => {
        it('should handle concurrent writes to different keys', async () => {
            const cache = new StageCache(defaultOptions);
            await cache.initialize();

            const writes = Array(10).fill(null).map((_, i) =>
                cache.set(`hash${i}`, createSampleData(`hash${i}`))
            );

            await Promise.all(writes);

            const stats = await cache.getStats();
            expect(stats.count).toBe(10);
        });

        it('should handle concurrent reads', async () => {
            const cache = new StageCache(defaultOptions);
            const data = createSampleData();
            await cache.set(data.hash, data);

            const reads = Array(10).fill(null).map(() =>
                cache.get(data.hash)
            );

            const results = await Promise.all(reads);

            expect(results.every(r => r?.hash === data.hash)).toBe(true);
        });
    });
});
