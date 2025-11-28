/**
 * Seeding Checkpoint Manager
 * 
 * Provides resumable seeding capability by tracking progress through a JSON checkpoint file.
 * Enables the seeding script to recover from interruptions without reprocessing documents.
 * 
 * @example
 * Basic usage:
 * ```typescript
 * const checkpoint = new SeedingCheckpoint('/path/to/db/.seeding-checkpoint.json');
 * await checkpoint.load();
 * 
 * // Check if document was already processed
 * if (checkpoint.isProcessed(fileHash)) {
 *   console.log('Skipping already processed document');
 * }
 * 
 * // After successfully processing a document
 * await checkpoint.markProcessed(fileHash, filePath);
 * 
 * // After all documents processed
 * await checkpoint.setStage('concepts');
 * ```
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Stages of the seeding process.
 * - documents: Processing individual documents (catalog + chunks)
 * - concepts: Building concept index from processed documents
 * - summaries: Generating category summaries
 * - complete: All processing finished
 */
export type SeedingStage = 'documents' | 'concepts' | 'summaries' | 'complete';

/**
 * Checkpoint data structure persisted to JSON.
 */
export interface SeedingCheckpointData {
    /** SHA-256 hashes of fully processed files (catalog + chunks written) */
    processedHashes: string[];
    
    /** Current stage of the seeding process */
    stage: SeedingStage;
    
    /** Path to the last successfully processed file */
    lastFile: string;
    
    /** ISO timestamp of last checkpoint update */
    lastUpdatedAt: string;
    
    /** Total number of documents successfully processed */
    totalProcessed: number;
    
    /** Total number of documents that failed processing */
    totalFailed: number;
    
    /** Paths of files that failed processing (for retry or manual review) */
    failedFiles: string[];
    
    /** Version of checkpoint format (for future migrations) */
    version: number;
    
    /** Database path this checkpoint is associated with */
    databasePath: string;
    
    /** Files directory this checkpoint is associated with */
    filesDir: string;
}

/**
 * Options for SeedingCheckpoint initialization.
 */
export interface SeedingCheckpointOptions {
    /** Path to checkpoint file */
    checkpointPath: string;
    
    /** Database path (for validation on resume) */
    databasePath: string;
    
    /** Files directory being processed */
    filesDir: string;
}

/**
 * Manages seeding checkpoint state for resumable document processing.
 * 
 * Design decisions:
 * - Uses atomic writes (write to temp file, then rename) to prevent corruption
 * - Validates database/filesDir match on resume to prevent mismatched checkpoints
 * - Maintains in-memory Set for O(1) hash lookups during processing
 */
export class SeedingCheckpoint {
    private checkpointPath: string;
    private databasePath: string;
    private filesDir: string;
    private data: SeedingCheckpointData;
    private processedHashSet: Set<string>;
    private isDirty: boolean = false;
    
    /** Current checkpoint format version */
    static readonly CHECKPOINT_VERSION = 1;
    
    /** Default checkpoint filename */
    static readonly DEFAULT_FILENAME = '.seeding-checkpoint.json';
    
    constructor(options: SeedingCheckpointOptions) {
        this.checkpointPath = options.checkpointPath;
        this.databasePath = options.databasePath;
        this.filesDir = options.filesDir;
        this.processedHashSet = new Set();
        this.data = this.createEmptyCheckpoint();
    }
    
    /**
     * Creates a fresh empty checkpoint.
     */
    private createEmptyCheckpoint(): SeedingCheckpointData {
        return {
            processedHashes: [],
            stage: 'documents',
            lastFile: '',
            lastUpdatedAt: new Date().toISOString(),
            totalProcessed: 0,
            totalFailed: 0,
            failedFiles: [],
            version: SeedingCheckpoint.CHECKPOINT_VERSION,
            databasePath: this.databasePath,
            filesDir: this.filesDir
        };
    }
    
    /**
     * Loads checkpoint from file, or creates new checkpoint if file doesn't exist.
     * 
     * @returns Object with loaded status and any validation warnings
     */
    async load(): Promise<{ loaded: boolean; warnings: string[] }> {
        const warnings: string[] = [];
        
        try {
            if (!fs.existsSync(this.checkpointPath)) {
                this.data = this.createEmptyCheckpoint();
                this.processedHashSet = new Set();
                return { loaded: false, warnings: [] };
            }
            
            const content = await fs.promises.readFile(this.checkpointPath, 'utf-8');
            const parsed = JSON.parse(content) as SeedingCheckpointData;
            
            // Validate checkpoint version
            if (parsed.version !== SeedingCheckpoint.CHECKPOINT_VERSION) {
                warnings.push(`Checkpoint version mismatch (found: ${parsed.version}, expected: ${SeedingCheckpoint.CHECKPOINT_VERSION})`);
            }
            
            // Validate database path matches
            if (parsed.databasePath && parsed.databasePath !== this.databasePath) {
                warnings.push(`Database path mismatch (checkpoint: ${parsed.databasePath}, current: ${this.databasePath})`);
            }
            
            // Validate files directory matches
            if (parsed.filesDir && parsed.filesDir !== this.filesDir) {
                warnings.push(`Files directory mismatch (checkpoint: ${parsed.filesDir}, current: ${this.filesDir})`);
            }
            
            this.data = {
                ...this.createEmptyCheckpoint(),
                ...parsed,
                databasePath: this.databasePath,
                filesDir: this.filesDir
            };
            
            // Build hash set for O(1) lookups
            this.processedHashSet = new Set(this.data.processedHashes);
            
            return { loaded: true, warnings };
        } catch (error: any) {
            warnings.push(`Error loading checkpoint: ${error.message}`);
            this.data = this.createEmptyCheckpoint();
            this.processedHashSet = new Set();
            return { loaded: false, warnings };
        }
    }
    
    /**
     * Saves checkpoint to file using atomic write (temp file + rename).
     */
    async save(): Promise<void> {
        this.data.lastUpdatedAt = new Date().toISOString();
        this.data.processedHashes = Array.from(this.processedHashSet);
        
        const content = JSON.stringify(this.data, null, 2);
        const tempPath = `${this.checkpointPath}.tmp`;
        
        try {
            // Ensure directory exists
            const dir = path.dirname(this.checkpointPath);
            if (!fs.existsSync(dir)) {
                await fs.promises.mkdir(dir, { recursive: true });
            }
            
            // Atomic write: write to temp file, then rename
            await fs.promises.writeFile(tempPath, content, 'utf-8');
            await fs.promises.rename(tempPath, this.checkpointPath);
            this.isDirty = false;
        } catch (error: any) {
            // Clean up temp file if it exists
            try {
                if (fs.existsSync(tempPath)) {
                    await fs.promises.unlink(tempPath);
                }
            } catch {}
            throw new Error(`Failed to save checkpoint: ${error.message}`);
        }
    }
    
    /**
     * Checks if a document hash has been processed.
     */
    isProcessed(hash: string): boolean {
        return this.processedHashSet.has(hash);
    }
    
    /**
     * Marks a document as successfully processed.
     * 
     * @param hash SHA-256 hash of the document file
     * @param filePath Path to the processed file (for logging)
     * @param saveImmediately If true, saves checkpoint immediately (default: true)
     */
    async markProcessed(hash: string, filePath: string, saveImmediately: boolean = true): Promise<void> {
        if (!this.processedHashSet.has(hash)) {
            this.processedHashSet.add(hash);
            this.data.totalProcessed++;
            this.isDirty = true;
        }
        this.data.lastFile = filePath;
        
        if (saveImmediately) {
            await this.save();
        }
    }
    
    /**
     * Records a failed document processing attempt.
     * 
     * @param filePath Path to the failed file
     * @param saveImmediately If true, saves checkpoint immediately (default: true)
     */
    async markFailed(filePath: string, saveImmediately: boolean = true): Promise<void> {
        if (!this.data.failedFiles.includes(filePath)) {
            this.data.failedFiles.push(filePath);
            this.data.totalFailed++;
            this.isDirty = true;
        }
        
        if (saveImmediately) {
            await this.save();
        }
    }
    
    /**
     * Updates the current processing stage.
     */
    async setStage(stage: SeedingStage): Promise<void> {
        this.data.stage = stage;
        this.isDirty = true;
        await this.save();
    }
    
    /**
     * Gets the current processing stage.
     */
    getStage(): SeedingStage {
        return this.data.stage;
    }
    
    /**
     * Gets checkpoint statistics.
     */
    getStats(): {
        totalProcessed: number;
        totalFailed: number;
        stage: SeedingStage;
        lastFile: string;
        lastUpdatedAt: string;
        processedHashCount: number;
    } {
        return {
            totalProcessed: this.data.totalProcessed,
            totalFailed: this.data.totalFailed,
            stage: this.data.stage,
            lastFile: this.data.lastFile,
            lastUpdatedAt: this.data.lastUpdatedAt,
            processedHashCount: this.processedHashSet.size
        };
    }
    
    /**
     * Gets the list of failed files.
     */
    getFailedFiles(): string[] {
        return [...this.data.failedFiles];
    }
    
    /**
     * Clears all checkpoint data (for fresh start).
     */
    async clear(): Promise<void> {
        this.data = this.createEmptyCheckpoint();
        this.processedHashSet = new Set();
        this.isDirty = true;
        await this.save();
    }
    
    /**
     * Removes the checkpoint file.
     */
    async delete(): Promise<void> {
        try {
            if (fs.existsSync(this.checkpointPath)) {
                await fs.promises.unlink(this.checkpointPath);
            }
        } catch (error: any) {
            throw new Error(`Failed to delete checkpoint: ${error.message}`);
        }
    }
    
    /**
     * Checks if there are unsaved changes.
     */
    hasUnsavedChanges(): boolean {
        return this.isDirty;
    }
    
    /**
     * Gets the full checkpoint data (for debugging/inspection).
     */
    getData(): Readonly<SeedingCheckpointData> {
        return { ...this.data, processedHashes: Array.from(this.processedHashSet) };
    }
    
    /**
     * Helper to get default checkpoint path for a database directory.
     */
    static getDefaultPath(databaseDir: string): string {
        return path.join(databaseDir, SeedingCheckpoint.DEFAULT_FILENAME);
    }
    
    /**
     * Factory method to create and load a checkpoint.
     */
    static async create(options: SeedingCheckpointOptions): Promise<{
        checkpoint: SeedingCheckpoint;
        loaded: boolean;
        warnings: string[];
    }> {
        const checkpoint = new SeedingCheckpoint(options);
        const { loaded, warnings } = await checkpoint.load();
        return { checkpoint, loaded, warnings };
    }
}

