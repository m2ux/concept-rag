/**
 * Stage Cache for LLM Results
 *
 * Provides disk-based caching for expensive LLM operations (concept extraction,
 * summary generation) during database seeding. Persists results immediately after
 * LLM success to prevent data loss on downstream failures.
 *
 * Uses file-per-document pattern: {cacheDir}/{hash}.json
 *
 * @example
 * ```typescript
 * const cache = new StageCache({ cacheDir: '/path/to/db/.stage-cache' });
 * await cache.initialize();
 *
 * // Check cache before LLM call
 * const cached = await cache.get(documentHash);
 * if (cached?.concepts && cached?.contentOverview) {
 *   // Use cached data
 * } else {
 *   // Make LLM calls, then cache immediately
 *   await cache.set(documentHash, { concepts, contentOverview, ... });
 * }
 * ```
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Extracted concept from LLM.
 */
export interface ExtractedConceptData {
    name: string;
    summary: string;
}

/**
 * Concept extraction results from LLM.
 */
export interface CachedConceptData {
    primary_concepts: (ExtractedConceptData | string)[];
    categories: string[];
    technical_terms?: string[];
    related_concepts?: string[];
}

/**
 * Bibliographic metadata parsed from filename or extracted.
 */
export interface CachedMetadata {
    title?: string;
    author?: string;
    year?: number;
    publisher?: string;
    isbn?: string;
}

/**
 * Full cached document data structure.
 */
export interface CachedDocumentData {
    /** SHA-256 hash of the document file */
    hash: string;

    /** Full path to the source document */
    source: string;

    /** ISO timestamp when this cache entry was created */
    processedAt: string;

    /** Concept extraction results from LLM */
    concepts?: CachedConceptData;

    /** Content overview/summary from LLM */
    contentOverview?: string;

    /** Bibliographic metadata */
    metadata?: CachedMetadata;
}

/**
 * Options for StageCache initialization.
 */
export interface StageCacheOptions {
    /** Directory to store cache files */
    cacheDir: string;

    /** Optional TTL in milliseconds for cache entries (default: 7 days) */
    ttlMs?: number;
}

/**
 * Statistics about the cache.
 */
export interface StageCacheStats {
    /** Number of cached entries */
    count: number;

    /** Total size of all cache files in bytes */
    totalSize: number;

    /** Number of expired entries (if TTL enabled) */
    expiredCount: number;
}

/**
 * Manages stage cache for LLM results during document processing.
 *
 * Design decisions:
 * - File-per-document pattern for simple lookup and partial failure resilience
 * - Atomic writes (write to temp file, then rename) to prevent corruption
 * - TTL support for automatic cleanup of stale entries
 * - Lazy initialization (creates directory on first write)
 */
export class StageCache {
    private cacheDir: string;
    private ttlMs: number;
    private initialized: boolean = false;

    /** Default TTL: 7 days */
    static readonly DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

    /** Default cache directory name */
    static readonly DEFAULT_DIRNAME = '.stage-cache';

    constructor(options: StageCacheOptions) {
        this.cacheDir = options.cacheDir;
        this.ttlMs = options.ttlMs ?? StageCache.DEFAULT_TTL_MS;
    }

    /**
     * Ensures the cache directory exists.
     */
    async initialize(): Promise<void> {
        if (this.initialized) {
            return;
        }

        try {
            await fs.promises.mkdir(this.cacheDir, { recursive: true });
            this.initialized = true;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to initialize stage cache directory: ${message}`);
        }
    }

    /**
     * Gets the file path for a given hash.
     */
    private getFilePath(hash: string): string {
        return path.join(this.cacheDir, `${hash}.json`);
    }

    /**
     * Retrieves cached data for a document hash.
     *
     * @param hash SHA-256 hash of the document
     * @returns Cached data or null if not found/expired
     */
    async get(hash: string): Promise<CachedDocumentData | null> {
        const filePath = this.getFilePath(hash);

        try {
            const stat = await fs.promises.stat(filePath);

            // Check TTL expiration
            const age = Date.now() - stat.mtimeMs;
            if (age > this.ttlMs) {
                return null;
            }

            const content = await fs.promises.readFile(filePath, 'utf-8');
            return JSON.parse(content) as CachedDocumentData;
        } catch (error: unknown) {
            // File doesn't exist or can't be read
            if (error instanceof Error && 'code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
                return null;
            }
            // Log other errors but return null to allow fallback to LLM
            console.error(`Warning: Error reading cache file ${filePath}:`, error);
            return null;
        }
    }

    /**
     * Stores data for a document hash using atomic write.
     *
     * @param hash SHA-256 hash of the document
     * @param data Document data to cache
     */
    async set(hash: string, data: CachedDocumentData): Promise<void> {
        await this.initialize();

        const filePath = this.getFilePath(hash);
        const tempPath = `${filePath}.tmp`;

        try {
            const content = JSON.stringify(data, null, 2);

            // Atomic write: write to temp file, then rename
            await fs.promises.writeFile(tempPath, content, 'utf-8');
            await fs.promises.rename(tempPath, filePath);
        } catch (error: unknown) {
            // Clean up temp file if it exists
            try {
                await fs.promises.unlink(tempPath);
            } catch {
                // Ignore cleanup errors
            }

            const message = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to write cache file for ${hash}: ${message}`);
        }
    }

    /**
     * Checks if a document hash exists in cache (and is not expired).
     *
     * @param hash SHA-256 hash of the document
     * @returns true if cached and not expired
     */
    async has(hash: string): Promise<boolean> {
        const filePath = this.getFilePath(hash);

        try {
            const stat = await fs.promises.stat(filePath);
            const age = Date.now() - stat.mtimeMs;
            return age <= this.ttlMs;
        } catch {
            return false;
        }
    }

    /**
     * Deletes a cached entry.
     *
     * @param hash SHA-256 hash of the document
     */
    async delete(hash: string): Promise<void> {
        const filePath = this.getFilePath(hash);

        try {
            await fs.promises.unlink(filePath);
        } catch (error: unknown) {
            // Ignore if file doesn't exist
            if (error instanceof Error && 'code' in error && (error as NodeJS.ErrnoException).code !== 'ENOENT') {
                throw error;
            }
        }
    }

    /**
     * Clears all cache entries.
     *
     * @returns Number of entries deleted
     */
    async clear(): Promise<number> {
        let deleted = 0;

        try {
            const files = await fs.promises.readdir(this.cacheDir);
            const jsonFiles = files.filter(f => f.endsWith('.json'));

            for (const file of jsonFiles) {
                try {
                    await fs.promises.unlink(path.join(this.cacheDir, file));
                    deleted++;
                } catch {
                    // Ignore individual file errors
                }
            }
        } catch (error: unknown) {
            // Directory doesn't exist or can't be read
            if (error instanceof Error && 'code' in error && (error as NodeJS.ErrnoException).code !== 'ENOENT') {
                throw error;
            }
        }

        return deleted;
    }

    /**
     * Gets cache statistics.
     */
    async getStats(): Promise<StageCacheStats> {
        let count = 0;
        let totalSize = 0;
        let expiredCount = 0;

        try {
            const files = await fs.promises.readdir(this.cacheDir);
            const jsonFiles = files.filter(f => f.endsWith('.json'));

            for (const file of jsonFiles) {
                try {
                    const filePath = path.join(this.cacheDir, file);
                    const stat = await fs.promises.stat(filePath);
                    const age = Date.now() - stat.mtimeMs;

                    if (age > this.ttlMs) {
                        expiredCount++;
                    } else {
                        count++;
                        totalSize += stat.size;
                    }
                } catch {
                    // Ignore individual file errors
                }
            }
        } catch (error: unknown) {
            // Directory doesn't exist
            if (error instanceof Error && 'code' in error && (error as NodeJS.ErrnoException).code !== 'ENOENT') {
                throw error;
            }
        }

        return { count, totalSize, expiredCount };
    }

    /**
     * Removes expired cache entries.
     *
     * @returns Number of expired entries deleted
     */
    async cleanExpired(): Promise<number> {
        let deleted = 0;

        try {
            const files = await fs.promises.readdir(this.cacheDir);
            const jsonFiles = files.filter(f => f.endsWith('.json'));

            for (const file of jsonFiles) {
                try {
                    const filePath = path.join(this.cacheDir, file);
                    const stat = await fs.promises.stat(filePath);
                    const age = Date.now() - stat.mtimeMs;

                    if (age > this.ttlMs) {
                        await fs.promises.unlink(filePath);
                        deleted++;
                    }
                } catch {
                    // Ignore individual file errors
                }
            }
        } catch (error: unknown) {
            // Directory doesn't exist
            if (error instanceof Error && 'code' in error && (error as NodeJS.ErrnoException).code !== 'ENOENT') {
                throw error;
            }
        }

        return deleted;
    }

    /**
     * Lists all cached document hashes (non-expired only).
     *
     * @returns Array of document hashes
     */
    async listHashes(): Promise<string[]> {
        const hashes: string[] = [];

        try {
            const files = await fs.promises.readdir(this.cacheDir);
            const jsonFiles = files.filter(f => f.endsWith('.json'));

            for (const file of jsonFiles) {
                try {
                    const filePath = path.join(this.cacheDir, file);
                    const stat = await fs.promises.stat(filePath);
                    const age = Date.now() - stat.mtimeMs;

                    if (age <= this.ttlMs) {
                        // Remove .json extension to get hash
                        hashes.push(file.slice(0, -5));
                    }
                } catch {
                    // Ignore individual file errors
                }
            }
        } catch (error: unknown) {
            // Directory doesn't exist
            if (error instanceof Error && 'code' in error && (error as NodeJS.ErrnoException).code !== 'ENOENT') {
                throw error;
            }
        }

        return hashes;
    }

    /**
     * Gets the cache directory path.
     */
    getCacheDir(): string {
        return this.cacheDir;
    }

    /**
     * Gets the TTL in milliseconds.
     */
    getTtlMs(): number {
        return this.ttlMs;
    }

    /**
     * Helper to get default cache path for a database directory.
     */
    static getDefaultPath(databaseDir: string): string {
        return path.join(databaseDir, StageCache.DEFAULT_DIRNAME);
    }

    /**
     * Factory method to create and initialize a cache.
     */
    static async create(options: StageCacheOptions): Promise<StageCache> {
        const cache = new StageCache(options);
        await cache.initialize();
        return cache;
    }
}
