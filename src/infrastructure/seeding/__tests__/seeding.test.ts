/**
 * Unit Tests for Document Seeding Infrastructure
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  truncateFilePath,
  formatHashDisplay,
  formatFileSize,
  findDocumentFilesRecursively,
  DEFAULT_DOCUMENT_EXTENSIONS
} from '../index.js';

describe('truncateFilePath', () => {
  it('should return original path if under max length', () => {
    const shortPath = '/home/user/docs/file.pdf';
    expect(truncateFilePath(shortPath)).toBe(shortPath);
  });
  
  it('should truncate long paths with ellipsis', () => {
    const longPath = '/'.repeat(200);
    const result = truncateFilePath(longPath, 50);
    
    expect(result.length).toBe(50);
    expect(result.endsWith('...')).toBe(true);
  });
  
  it('should respect custom max length', () => {
    const path100 = 'a'.repeat(100);
    const result = truncateFilePath(path100, 30);
    
    expect(result.length).toBe(30);
    expect(result.endsWith('...')).toBe(true);
  });
});

describe('formatHashDisplay', () => {
  it('should format a full hash', () => {
    const hash = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    expect(formatHashDisplay(hash)).toBe('[1234..cdef]');
  });
  
  it('should handle empty hash', () => {
    expect(formatHashDisplay('')).toBe('[????..????]');
  });
  
  it('should handle unknown hash', () => {
    expect(formatHashDisplay('unknown')).toBe('[????..????]');
  });
});

describe('formatFileSize', () => {
  it('should format bytes', () => {
    expect(formatFileSize(500)).toBe('500 B');
    expect(formatFileSize(1023)).toBe('1023 B');
  });
  
  it('should format kilobytes', () => {
    expect(formatFileSize(1024)).toBe('1.00 KB');
    expect(formatFileSize(2048)).toBe('2.00 KB');
    expect(formatFileSize(1536)).toBe('1.50 KB');
  });
  
  it('should format megabytes', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1.00 MB');
    expect(formatFileSize(1.5 * 1024 * 1024)).toBe('1.50 MB');
  });
  
  it('should format gigabytes', () => {
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.00 GB');
    expect(formatFileSize(2.5 * 1024 * 1024 * 1024)).toBe('2.50 GB');
  });
});

describe('findDocumentFilesRecursively', () => {
  let tempDir: string;
  
  beforeEach(async () => {
    // Create a temporary directory structure
    tempDir = path.join(os.tmpdir(), `test-${Date.now()}`);
    await fs.promises.mkdir(tempDir, { recursive: true });
    await fs.promises.mkdir(path.join(tempDir, 'subdir'), { recursive: true });
    
    // Create test files
    await fs.promises.writeFile(path.join(tempDir, 'doc1.pdf'), 'test');
    await fs.promises.writeFile(path.join(tempDir, 'doc2.epub'), 'test');
    await fs.promises.writeFile(path.join(tempDir, 'readme.txt'), 'test');
    await fs.promises.writeFile(path.join(tempDir, 'subdir', 'doc3.pdf'), 'test');
    await fs.promises.writeFile(path.join(tempDir, 'subdir', 'doc4.mobi'), 'test');
  });
  
  afterEach(async () => {
    // Clean up
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  });
  
  it('should find all document files recursively', async () => {
    const files = await findDocumentFilesRecursively(tempDir);
    
    expect(files.length).toBe(4);
    expect(files.some(f => f.endsWith('doc1.pdf'))).toBe(true);
    expect(files.some(f => f.endsWith('doc2.epub'))).toBe(true);
    expect(files.some(f => f.endsWith('doc3.pdf'))).toBe(true);
    expect(files.some(f => f.endsWith('doc4.mobi'))).toBe(true);
  });
  
  it('should not include non-document files', async () => {
    const files = await findDocumentFilesRecursively(tempDir);
    
    expect(files.some(f => f.endsWith('.txt'))).toBe(false);
  });
  
  it('should filter by custom extensions', async () => {
    const files = await findDocumentFilesRecursively(tempDir, ['.pdf']);
    
    expect(files.length).toBe(2);
    expect(files.every(f => f.endsWith('.pdf'))).toBe(true);
  });
  
  it('should handle non-existent directory', async () => {
    const files = await findDocumentFilesRecursively('/nonexistent/path');
    
    expect(files).toEqual([]);
  });
});

describe('DEFAULT_DOCUMENT_EXTENSIONS', () => {
  it('should include pdf, epub, and mobi', () => {
    expect(DEFAULT_DOCUMENT_EXTENSIONS).toContain('.pdf');
    expect(DEFAULT_DOCUMENT_EXTENSIONS).toContain('.epub');
    expect(DEFAULT_DOCUMENT_EXTENSIONS).toContain('.mobi');
  });
});


