import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { SeedingCheckpoint, type SeedingCheckpointOptions } from '../seeding-checkpoint.js';

describe('SeedingCheckpoint', () => {
    let tempDir: string;
    let checkpointPath: string;
    let defaultOptions: SeedingCheckpointOptions;
    
    beforeEach(async () => {
        // Create temp directory for tests
        tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'checkpoint-test-'));
        checkpointPath = path.join(tempDir, '.seeding-checkpoint.json');
        defaultOptions = {
            checkpointPath,
            databasePath: '/test/db',
            filesDir: '/test/files'
        };
    });
    
    afterEach(async () => {
        // Clean up temp directory
        try {
            await fs.promises.rm(tempDir, { recursive: true, force: true });
        } catch {}
    });
    
    describe('constructor and load', () => {
        it('should create empty checkpoint when file does not exist', async () => {
            const checkpoint = new SeedingCheckpoint(defaultOptions);
            const { loaded, warnings } = await checkpoint.load();
            
            expect(loaded).toBe(false);
            expect(warnings).toHaveLength(0);
            expect(checkpoint.getStage()).toBe('documents');
            expect(checkpoint.getStats().totalProcessed).toBe(0);
        });
        
        it('should load existing checkpoint file', async () => {
            // Create a checkpoint file first
            const existingData = {
                processedHashes: ['hash1', 'hash2'],
                stage: 'concepts',
                lastFile: '/test/file.pdf',
                lastUpdatedAt: new Date().toISOString(),
                totalProcessed: 2,
                totalFailed: 0,
                failedFiles: [],
                version: SeedingCheckpoint.CHECKPOINT_VERSION,
                databasePath: '/test/db',
                filesDir: '/test/files'
            };
            await fs.promises.writeFile(checkpointPath, JSON.stringify(existingData), 'utf-8');
            
            const checkpoint = new SeedingCheckpoint(defaultOptions);
            const { loaded, warnings } = await checkpoint.load();
            
            expect(loaded).toBe(true);
            expect(warnings).toHaveLength(0);
            expect(checkpoint.getStage()).toBe('concepts');
            expect(checkpoint.getStats().totalProcessed).toBe(2);
            expect(checkpoint.isProcessed('hash1')).toBe(true);
            expect(checkpoint.isProcessed('hash2')).toBe(true);
            expect(checkpoint.isProcessed('hash3')).toBe(false);
        });
        
        it('should warn on database path mismatch', async () => {
            const existingData = {
                processedHashes: [],
                stage: 'documents',
                lastFile: '',
                lastUpdatedAt: new Date().toISOString(),
                totalProcessed: 0,
                totalFailed: 0,
                failedFiles: [],
                version: SeedingCheckpoint.CHECKPOINT_VERSION,
                databasePath: '/different/db',
                filesDir: '/test/files'
            };
            await fs.promises.writeFile(checkpointPath, JSON.stringify(existingData), 'utf-8');
            
            const checkpoint = new SeedingCheckpoint(defaultOptions);
            const { loaded, warnings } = await checkpoint.load();
            
            expect(loaded).toBe(true);
            expect(warnings).toHaveLength(1);
            expect(warnings[0]).toContain('Database path mismatch');
        });
        
        it('should warn on files directory mismatch', async () => {
            const existingData = {
                processedHashes: [],
                stage: 'documents',
                lastFile: '',
                lastUpdatedAt: new Date().toISOString(),
                totalProcessed: 0,
                totalFailed: 0,
                failedFiles: [],
                version: SeedingCheckpoint.CHECKPOINT_VERSION,
                databasePath: '/test/db',
                filesDir: '/different/files'
            };
            await fs.promises.writeFile(checkpointPath, JSON.stringify(existingData), 'utf-8');
            
            const checkpoint = new SeedingCheckpoint(defaultOptions);
            const { loaded, warnings } = await checkpoint.load();
            
            expect(loaded).toBe(true);
            expect(warnings).toHaveLength(1);
            expect(warnings[0]).toContain('Files directory mismatch');
        });
        
        it('should handle corrupted checkpoint file gracefully', async () => {
            await fs.promises.writeFile(checkpointPath, 'not valid json', 'utf-8');
            
            const checkpoint = new SeedingCheckpoint(defaultOptions);
            const { loaded, warnings } = await checkpoint.load();
            
            expect(loaded).toBe(false);
            expect(warnings).toHaveLength(1);
            expect(warnings[0]).toContain('Error loading checkpoint');
        });
    });
    
    describe('markProcessed', () => {
        it('should mark document as processed', async () => {
            const checkpoint = new SeedingCheckpoint(defaultOptions);
            await checkpoint.load();
            
            await checkpoint.markProcessed('hash123', '/test/file.pdf');
            
            expect(checkpoint.isProcessed('hash123')).toBe(true);
            expect(checkpoint.getStats().totalProcessed).toBe(1);
            expect(checkpoint.getStats().lastFile).toBe('/test/file.pdf');
        });
        
        it('should persist checkpoint to file', async () => {
            const checkpoint = new SeedingCheckpoint(defaultOptions);
            await checkpoint.load();
            
            await checkpoint.markProcessed('hash123', '/test/file.pdf');
            
            // Verify file was written
            const content = await fs.promises.readFile(checkpointPath, 'utf-8');
            const data = JSON.parse(content);
            expect(data.processedHashes).toContain('hash123');
        });
        
        it('should not duplicate hashes', async () => {
            const checkpoint = new SeedingCheckpoint(defaultOptions);
            await checkpoint.load();
            
            await checkpoint.markProcessed('hash123', '/test/file1.pdf');
            await checkpoint.markProcessed('hash123', '/test/file2.pdf');
            
            expect(checkpoint.getStats().totalProcessed).toBe(1);
            expect(checkpoint.getStats().lastFile).toBe('/test/file2.pdf');
        });
        
        it('should support batch mode without immediate save', async () => {
            const checkpoint = new SeedingCheckpoint(defaultOptions);
            await checkpoint.load();
            
            await checkpoint.markProcessed('hash1', '/test/file1.pdf', false);
            await checkpoint.markProcessed('hash2', '/test/file2.pdf', false);
            
            // File should not exist yet
            expect(fs.existsSync(checkpointPath)).toBe(false);
            
            // Now save
            await checkpoint.save();
            
            // Verify both were saved
            const content = await fs.promises.readFile(checkpointPath, 'utf-8');
            const data = JSON.parse(content);
            expect(data.processedHashes).toContain('hash1');
            expect(data.processedHashes).toContain('hash2');
        });
    });
    
    describe('markFailed', () => {
        it('should record failed file', async () => {
            const checkpoint = new SeedingCheckpoint(defaultOptions);
            await checkpoint.load();
            
            await checkpoint.markFailed('/test/bad-file.pdf');
            
            expect(checkpoint.getStats().totalFailed).toBe(1);
            expect(checkpoint.getFailedFiles()).toContain('/test/bad-file.pdf');
        });
        
        it('should not duplicate failed files', async () => {
            const checkpoint = new SeedingCheckpoint(defaultOptions);
            await checkpoint.load();
            
            await checkpoint.markFailed('/test/bad-file.pdf');
            await checkpoint.markFailed('/test/bad-file.pdf');
            
            expect(checkpoint.getStats().totalFailed).toBe(1);
            expect(checkpoint.getFailedFiles()).toHaveLength(1);
        });
    });
    
    describe('setStage', () => {
        it('should update processing stage', async () => {
            const checkpoint = new SeedingCheckpoint(defaultOptions);
            await checkpoint.load();
            
            expect(checkpoint.getStage()).toBe('documents');
            
            await checkpoint.setStage('concepts');
            expect(checkpoint.getStage()).toBe('concepts');
            
            await checkpoint.setStage('summaries');
            expect(checkpoint.getStage()).toBe('summaries');
            
            await checkpoint.setStage('complete');
            expect(checkpoint.getStage()).toBe('complete');
        });
        
        it('should persist stage to file', async () => {
            const checkpoint = new SeedingCheckpoint(defaultOptions);
            await checkpoint.load();
            
            await checkpoint.setStage('concepts');
            
            const content = await fs.promises.readFile(checkpointPath, 'utf-8');
            const data = JSON.parse(content);
            expect(data.stage).toBe('concepts');
        });
    });
    
    describe('clear', () => {
        it('should reset all checkpoint data', async () => {
            const checkpoint = new SeedingCheckpoint(defaultOptions);
            await checkpoint.load();
            
            await checkpoint.markProcessed('hash1', '/test/file1.pdf');
            await checkpoint.markFailed('/test/bad.pdf');
            await checkpoint.setStage('concepts');
            
            await checkpoint.clear();
            
            expect(checkpoint.getStats().totalProcessed).toBe(0);
            expect(checkpoint.getStats().totalFailed).toBe(0);
            expect(checkpoint.getStage()).toBe('documents');
            expect(checkpoint.isProcessed('hash1')).toBe(false);
            expect(checkpoint.getFailedFiles()).toHaveLength(0);
        });
    });
    
    describe('delete', () => {
        it('should remove checkpoint file', async () => {
            const checkpoint = new SeedingCheckpoint(defaultOptions);
            await checkpoint.load();
            await checkpoint.markProcessed('hash1', '/test/file.pdf');
            
            expect(fs.existsSync(checkpointPath)).toBe(true);
            
            await checkpoint.delete();
            
            expect(fs.existsSync(checkpointPath)).toBe(false);
        });
        
        it('should not error when file does not exist', async () => {
            const checkpoint = new SeedingCheckpoint(defaultOptions);
            await checkpoint.load();
            
            // File doesn't exist yet
            await expect(checkpoint.delete()).resolves.not.toThrow();
        });
    });
    
    describe('getDefaultPath', () => {
        it('should return correct default path', () => {
            const dbPath = '/home/user/.concept_rag';
            const result = SeedingCheckpoint.getDefaultPath(dbPath);
            
            expect(result).toBe('/home/user/.concept_rag/.seeding-checkpoint.json');
        });
    });
    
    describe('factory create method', () => {
        it('should create and load checkpoint in one call', async () => {
            const { checkpoint, loaded, warnings } = await SeedingCheckpoint.create(defaultOptions);
            
            expect(checkpoint).toBeInstanceOf(SeedingCheckpoint);
            expect(loaded).toBe(false);
            expect(warnings).toHaveLength(0);
        });
    });
    
    describe('getData', () => {
        it('should return readonly copy of checkpoint data', async () => {
            const checkpoint = new SeedingCheckpoint(defaultOptions);
            await checkpoint.load();
            await checkpoint.markProcessed('hash1', '/test/file.pdf');
            
            const data = checkpoint.getData();
            
            expect(data.processedHashes).toContain('hash1');
            expect(data.databasePath).toBe('/test/db');
            expect(data.version).toBe(SeedingCheckpoint.CHECKPOINT_VERSION);
        });
    });
    
    describe('hasUnsavedChanges', () => {
        it('should track unsaved changes', async () => {
            const checkpoint = new SeedingCheckpoint(defaultOptions);
            await checkpoint.load();
            
            expect(checkpoint.hasUnsavedChanges()).toBe(false);
            
            await checkpoint.markProcessed('hash1', '/test/file.pdf', false);
            
            expect(checkpoint.hasUnsavedChanges()).toBe(true);
            
            await checkpoint.save();
            
            expect(checkpoint.hasUnsavedChanges()).toBe(false);
        });
    });
    
    describe('atomic writes', () => {
        it('should not leave temp files on successful write', async () => {
            const checkpoint = new SeedingCheckpoint(defaultOptions);
            await checkpoint.load();
            await checkpoint.markProcessed('hash1', '/test/file.pdf');
            
            const tempPath = `${checkpointPath}.tmp`;
            expect(fs.existsSync(tempPath)).toBe(false);
            expect(fs.existsSync(checkpointPath)).toBe(true);
        });
    });
    
    describe('resume scenarios', () => {
        it('should correctly resume from partial processing', async () => {
            // Simulate first run - process 2 documents
            const checkpoint1 = new SeedingCheckpoint(defaultOptions);
            await checkpoint1.load();
            await checkpoint1.markProcessed('hash1', '/test/file1.pdf');
            await checkpoint1.markProcessed('hash2', '/test/file2.pdf');
            
            // Simulate second run - load existing checkpoint
            const checkpoint2 = new SeedingCheckpoint(defaultOptions);
            const { loaded, warnings } = await checkpoint2.load();
            
            expect(loaded).toBe(true);
            expect(warnings).toHaveLength(0);
            expect(checkpoint2.isProcessed('hash1')).toBe(true);
            expect(checkpoint2.isProcessed('hash2')).toBe(true);
            expect(checkpoint2.isProcessed('hash3')).toBe(false);
            
            // Continue processing
            await checkpoint2.markProcessed('hash3', '/test/file3.pdf');
            expect(checkpoint2.getStats().totalProcessed).toBe(3);
        });
        
        it('should correctly track stage across restarts', async () => {
            // First run - complete documents stage
            const checkpoint1 = new SeedingCheckpoint(defaultOptions);
            await checkpoint1.load();
            await checkpoint1.markProcessed('hash1', '/test/file1.pdf');
            await checkpoint1.setStage('concepts');
            
            // Second run - should resume at concepts stage
            const checkpoint2 = new SeedingCheckpoint(defaultOptions);
            await checkpoint2.load();
            
            expect(checkpoint2.getStage()).toBe('concepts');
        });
    });
});





