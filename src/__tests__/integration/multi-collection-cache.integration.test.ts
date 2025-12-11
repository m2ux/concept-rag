/**
 * Integration tests for multi-collection cache resume scenarios.
 *
 * These tests verify that the StageCache correctly handles multiple
 * cached collections from different source paths, including:
 * - Collection hash computation
 * - Listing cached collections
 * - Deriving source directories from cache
 * - Processing collections in chronological order
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
    StageCache,
    type CachedDocumentData
} from '../../infrastructure/checkpoint/stage-cache.js';

describe('Multi-Collection Cache Integration', () => {
    let tempDir: string;
    let baseCacheDir: string;

    beforeEach(async () => {
        tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'multi-collection-test-'));
        baseCacheDir = path.join(tempDir, '.stage-cache');
        await fs.promises.mkdir(baseCacheDir, { recursive: true });
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
                { name: 'Test Concept', summary: 'A test concept' }
            ],
            categories: ['Testing'],
            technical_terms: ['cache'],
            related_concepts: ['Testing']
        },
        contentOverview: `Content overview for ${path.basename(source)}`,
        metadata: {
            title: path.basename(source),
            author: 'Test Author',
            year: 2024
        }
    });

    describe('Collection hash computation', () => {
        it('should produce deterministic hash regardless of input order', () => {
            const hashes1 = ['abc123', 'def456', 'ghi789'];
            const hashes2 = ['ghi789', 'abc123', 'def456'];
            const hashes3 = ['def456', 'ghi789', 'abc123'];

            const result1 = StageCache.computeCollectionHash(hashes1);
            const result2 = StageCache.computeCollectionHash(hashes2);
            const result3 = StageCache.computeCollectionHash(hashes3);

            expect(result1).toBe(result2);
            expect(result2).toBe(result3);
        });

        it('should produce 16-character hash', () => {
            const hashes = ['a', 'b', 'c'];
            const result = StageCache.computeCollectionHash(hashes);

            expect(result.length).toBe(16);
            expect(/^[a-f0-9]+$/.test(result)).toBe(true);
        });

        it('should produce different hashes for different collections', () => {
            const collection1 = ['file1hash', 'file2hash'];
            const collection2 = ['file1hash', 'file3hash'];
            const collection3 = ['differenthash'];

            const hash1 = StageCache.computeCollectionHash(collection1);
            const hash2 = StageCache.computeCollectionHash(collection2);
            const hash3 = StageCache.computeCollectionHash(collection3);

            expect(hash1).not.toBe(hash2);
            expect(hash2).not.toBe(hash3);
            expect(hash1).not.toBe(hash3);
        });

        it('should handle empty array', () => {
            const result = StageCache.computeCollectionHash([]);
            expect(result.length).toBe(16);
        });

        it('should handle single item', () => {
            const result = StageCache.computeCollectionHash(['singlehash']);
            expect(result.length).toBe(16);
        });
    });

    describe('Collection-based cache organization', () => {
        it('should create separate directories for different collections', async () => {
            const collection1Hash = 'collection1abcde';
            const collection2Hash = 'collection2fghij';

            const cache1 = new StageCache({
                cacheDir: baseCacheDir,
                collectionHash: collection1Hash
            });
            const cache2 = new StageCache({
                cacheDir: baseCacheDir,
                collectionHash: collection2Hash
            });

            await cache1.initialize();
            await cache2.initialize();

            await cache1.set('doc1', createMockDocumentData('doc1', '/path1/doc1.pdf'));
            await cache2.set('doc2', createMockDocumentData('doc2', '/path2/doc2.pdf'));

            // Verify separate directories
            const entries = await fs.promises.readdir(baseCacheDir);
            expect(entries.sort()).toEqual([collection1Hash, collection2Hash].sort());

            // Verify files in correct directories
            const files1 = await fs.promises.readdir(path.join(baseCacheDir, collection1Hash));
            const files2 = await fs.promises.readdir(path.join(baseCacheDir, collection2Hash));

            expect(files1).toEqual(['doc1.json']);
            expect(files2).toEqual(['doc2.json']);
        });

        it('should isolate collections from each other', async () => {
            const cache1 = new StageCache({
                cacheDir: baseCacheDir,
                collectionHash: 'isolatedcoll1abc'
            });
            const cache2 = new StageCache({
                cacheDir: baseCacheDir,
                collectionHash: 'isolatedcoll2def'
            });

            await cache1.initialize();
            await cache2.initialize();

            await cache1.set('shared-hash', createMockDocumentData('shared-hash', '/path1/doc.pdf'));

            // cache2 should not see cache1's data
            const result = await cache2.get('shared-hash');
            expect(result).toBeNull();

            // cache1 should see its own data
            const result1 = await cache1.get('shared-hash');
            expect(result1).not.toBeNull();
            expect(result1?.source).toBe('/path1/doc.pdf');
        });
    });

    describe('Collection cache cleanup', () => {
        it('should remove entire collection directory on cleanup', async () => {
            const collectionHash = 'cleanuptestabcd';
            const collectionDir = path.join(baseCacheDir, collectionHash);

            const cache = new StageCache({
                cacheDir: baseCacheDir,
                collectionHash
            });
            await cache.initialize();

            // Add multiple files
            await cache.set('doc1', createMockDocumentData('doc1', '/path/doc1.pdf'));
            await cache.set('doc2', createMockDocumentData('doc2', '/path/doc2.pdf'));
            await cache.set('doc3', createMockDocumentData('doc3', '/path/doc3.pdf'));

            // Verify directory exists
            let exists = await fs.promises.stat(collectionDir).then(() => true).catch(() => false);
            expect(exists).toBe(true);

            // Remove collection
            const removed = await cache.removeCollectionCache();
            expect(removed).toBe(true);

            // Verify directory is gone
            exists = await fs.promises.stat(collectionDir).then(() => true).catch(() => false);
            expect(exists).toBe(false);
        });

        it('should not remove base cache when no collection hash', async () => {
            const cache = new StageCache({ cacheDir: baseCacheDir });
            await cache.initialize();

            await cache.set('doc1', createMockDocumentData('doc1', '/path/doc1.pdf'));

            const removed = await cache.removeCollectionCache();
            expect(removed).toBe(false);

            // Data should still exist
            const result = await cache.get('doc1');
            expect(result).not.toBeNull();
        });

        it('should handle cleanup of non-existent collection', async () => {
            const cache = new StageCache({
                cacheDir: baseCacheDir,
                collectionHash: 'nonexistentcoll'
            });
            // Don't initialize - directory doesn't exist

            const removed = await cache.removeCollectionCache();
            expect(removed).toBe(false);
        });
    });

    describe('Listing cached collections', () => {
        it('should list all collection directories with file counts', async () => {
            // Create multiple collections with different file counts
            // Use computeCollectionHash to get valid 16-char hashes
            const collections = [
                { hash: StageCache.computeCollectionHash(['file1', 'file2']), files: 3 },
                { hash: StageCache.computeCollectionHash(['file3', 'file4']), files: 5 },
                { hash: StageCache.computeCollectionHash(['file5']), files: 1 }
            ];

            for (const coll of collections) {
                const cache = new StageCache({
                    cacheDir: baseCacheDir,
                    collectionHash: coll.hash
                });
                await cache.initialize();

                for (let i = 0; i < coll.files; i++) {
                    await cache.set(`doc${i}`, createMockDocumentData(`doc${i}`, `/path${coll.hash}/doc${i}.pdf`));
                }
            }

            // List collections
            const entries = await fs.promises.readdir(baseCacheDir, { withFileTypes: true });
            const collectionDirs = entries.filter(e => e.isDirectory() && e.name.length === 16);

            expect(collectionDirs.length).toBe(3);

            // Verify file counts
            for (const coll of collections) {
                const files = await fs.promises.readdir(path.join(baseCacheDir, coll.hash));
                expect(files.length).toBe(coll.files);
            }
        });

        it('should ignore non-collection directories', async () => {
            // Create a collection
            const cache = new StageCache({
                cacheDir: baseCacheDir,
                collectionHash: 'validcollection1'
            });
            await cache.initialize();
            await cache.set('doc1', createMockDocumentData('doc1', '/path/doc1.pdf'));

            // Create non-collection directories
            await fs.promises.mkdir(path.join(baseCacheDir, 'short'), { recursive: true });
            await fs.promises.mkdir(path.join(baseCacheDir, 'this-is-way-too-long-to-be-a-hash'), { recursive: true });

            // List should only find valid collections
            const entries = await fs.promises.readdir(baseCacheDir, { withFileTypes: true });
            const collectionDirs = entries.filter(e => e.isDirectory() && e.name.length === 16);

            expect(collectionDirs.length).toBe(1);
            expect(collectionDirs[0].name).toBe('validcollection1');
        });
    });

    describe('Source directory derivation from cache', () => {
        it('should derive common parent directory from cached sources', async () => {
            const collectionHash = 'sourcederivetest';
            const cache = new StageCache({
                cacheDir: baseCacheDir,
                collectionHash
            });
            await cache.initialize();

            // Add documents from same parent directory
            await cache.set('doc1', createMockDocumentData('doc1', '/home/user/docs/papers/paper1.pdf'));
            await cache.set('doc2', createMockDocumentData('doc2', '/home/user/docs/papers/paper2.pdf'));
            await cache.set('doc3', createMockDocumentData('doc3', '/home/user/docs/papers/subdir/paper3.pdf'));

            // Read first cache file to verify source is stored
            const collectionDir = path.join(baseCacheDir, collectionHash);
            const files = await fs.promises.readdir(collectionDir);
            const firstFile = path.join(collectionDir, files[0]);
            const content = JSON.parse(await fs.promises.readFile(firstFile, 'utf-8'));

            expect(content.source).toMatch(/\/home\/user\/docs\/papers/);
        });

        it('should handle single file in collection', async () => {
            const collectionHash = 'singlefiletest12';
            const cache = new StageCache({
                cacheDir: baseCacheDir,
                collectionHash
            });
            await cache.initialize();

            await cache.set('doc1', createMockDocumentData('doc1', '/path/to/single/doc.pdf'));

            const collectionDir = path.join(baseCacheDir, collectionHash);
            const files = await fs.promises.readdir(collectionDir);
            expect(files.length).toBe(1);

            const content = JSON.parse(await fs.promises.readFile(path.join(collectionDir, files[0]), 'utf-8'));
            expect(content.source).toBe('/path/to/single/doc.pdf');
        });
    });

    describe('Chronological ordering', () => {
        it('should allow sorting collections by creation time', async () => {
            // Use computeCollectionHash to get valid 16-char hashes
            const oldestHash = StageCache.computeCollectionHash(['oldest1']);
            const middleHash = StageCache.computeCollectionHash(['middle2']);
            const newestHash = StageCache.computeCollectionHash(['newest3']);
            const collections = [
                { hash: oldestHash, order: 0 },
                { hash: middleHash, order: 1 },
                { hash: newestHash, order: 2 }
            ];

            for (const coll of collections) {
                const cache = new StageCache({
                    cacheDir: baseCacheDir,
                    collectionHash: coll.hash
                });
                await cache.initialize();
                await cache.set('doc', createMockDocumentData('doc', `/path/${coll.hash}/doc.pdf`));

                // Small delay to ensure different timestamps
                await new Promise(resolve => setTimeout(resolve, 20));
            }

            // Get directories with timestamps
            const entries = await fs.promises.readdir(baseCacheDir, { withFileTypes: true });
            const collectionStats = await Promise.all(
                entries
                    .filter(e => e.isDirectory() && e.name.length === 16)
                    .map(async e => {
                        const stat = await fs.promises.stat(path.join(baseCacheDir, e.name));
                        return { name: e.name, time: stat.birthtime.getTime() };
                    })
            );

            expect(collectionStats.length).toBe(3);

            // Sort by oldest first
            collectionStats.sort((a, b) => a.time - b.time);

            // Verify ordering matches creation order
            expect(collectionStats[0].name).toBe(oldestHash);
            expect(collectionStats[1].name).toBe(middleHash);
            expect(collectionStats[2].name).toBe(newestHash);
        });
    });

    describe('TTL behavior with collections', () => {
        it('should respect TTL within collection', async () => {
            const cache = new StageCache({
                cacheDir: baseCacheDir,
                collectionHash: 'ttltestcollect1',
                ttlMs: 1 // Very short TTL
            });
            await cache.initialize();

            await cache.set('doc1', createMockDocumentData('doc1', '/path/doc1.pdf'));

            // Wait for expiration
            await new Promise(resolve => setTimeout(resolve, 10));

            // Should not find expired entry
            const result = await cache.get('doc1');
            expect(result).toBeNull();
        });

        it('should not affect other collections TTL', async () => {
            // Collection 1 with short TTL
            const cache1 = new StageCache({
                cacheDir: baseCacheDir,
                collectionHash: 'shortttlcollec1',
                ttlMs: 1
            });

            // Collection 2 with long TTL
            const cache2 = new StageCache({
                cacheDir: baseCacheDir,
                collectionHash: 'longttlcollect2',
                ttlMs: 60000
            });

            await cache1.initialize();
            await cache2.initialize();

            await cache1.set('doc1', createMockDocumentData('doc1', '/path1/doc1.pdf'));
            await cache2.set('doc2', createMockDocumentData('doc2', '/path2/doc2.pdf'));

            // Wait for cache1's TTL to expire
            await new Promise(resolve => setTimeout(resolve, 10));

            // cache1's entry should be expired
            expect(await cache1.get('doc1')).toBeNull();

            // cache2's entry should still be valid
            expect(await cache2.get('doc2')).not.toBeNull();
        });
    });
});
