/**
 * Unit Tests for EPUBDocumentLoader
 * 
 * Tests the EPUB document loader using test doubles (mocks).
 * Follows Four-Phase Test pattern from TDD for Embedded C (Grenning).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EPUBDocumentLoader } from '../epub-loader.js';
import { Document } from '@langchain/core/documents';

// Mock the epub library
vi.mock('epub', () => {
  class MockEPub {
    metadata: any;
    flow: any[];
    getChapter: any;
    parse: any;
    on: any;
    
    constructor(filePath: string) {
      this.metadata = {
        title: 'Test Book',
        creator: 'Test Author',
        language: 'en',
        publisher: 'Test Publisher',
        date: '2024-01-01',
        description: 'Test description',
        subject: 'Test subject'
      };
      this.flow = [
        { id: 'chapter1' },
        { id: 'chapter2' }
      ];
      this.getChapter = vi.fn((chapterId: string, callback: (err: Error | null, text: string) => void) => {
        if (chapterId === 'chapter1') {
          callback(null, '<p>Chapter 1 content</p>');
        } else if (chapterId === 'chapter2') {
          callback(null, '<p>Chapter 2 content</p>');
        } else {
          callback(new Error('Chapter not found'), '');
        }
      });
      this.parse = vi.fn();
      this.on = vi.fn((event: string, handler: Function) => {
        if (event === 'end') {
          setTimeout(() => handler(), 0);
        }
      });
    }
  }
  
  return {
    default: MockEPub
  };
});

describe('EPUBDocumentLoader', () => {
  let loader: EPUBDocumentLoader;
  
  beforeEach(() => {
    // SETUP - Fresh loader instance for each test
    loader = new EPUBDocumentLoader();
    vi.clearAllMocks();
  });
  
  describe('canHandle', () => {
    it('should return true for .epub extension', () => {
      // EXERCISE
      const result = loader.canHandle('/path/to/book.epub');
      
      // VERIFY
      expect(result).toBe(true);
    });
    
    it('should be case-insensitive', () => {
      // EXERCISE
      const result1 = loader.canHandle('/path/to/BOOK.EPUB');
      const result2 = loader.canHandle('/path/to/book.Epub');
      const result3 = loader.canHandle('/path/to/Book.EPUB');
      
      // VERIFY
      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(result3).toBe(true);
    });
    
    it('should return false for non-EPUB files', () => {
      // EXERCISE
      const result1 = loader.canHandle('/path/to/book.pdf');
      const result2 = loader.canHandle('/path/to/book.txt');
      const result3 = loader.canHandle('/path/to/book');
      
      // VERIFY
      expect(result1).toBe(false);
      expect(result2).toBe(false);
      expect(result3).toBe(false);
    });
    
    it('should return false for files with .epub in name but different extension', () => {
      // EXERCISE
      const result = loader.canHandle('/path/to/book.epub.backup');
      
      // VERIFY
      expect(result).toBe(false);
    });
  });
  
  describe('load', () => {
    it('should load EPUB file and return documents', async () => {
      // SETUP
      const filePath = '/path/to/test.epub';
      
      // EXERCISE
      const result = await loader.load(filePath);
      
      // VERIFY
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1); // EPUB returns single document
    });
    
    it('should return document with page content', async () => {
      // SETUP
      const filePath = '/path/to/test.epub';
      
      // EXERCISE
      const result = await loader.load(filePath);
      
      // VERIFY
      expect(result[0].pageContent).toBeDefined();
      expect(typeof result[0].pageContent).toBe('string');
      expect(result[0].pageContent.length).toBeGreaterThan(0);
    });
    
    it('should extract and include metadata', async () => {
      // SETUP
      const filePath = '/path/to/test.epub';
      
      // EXERCISE
      const result = await loader.load(filePath);
      
      // VERIFY
      expect(result[0].metadata).toBeDefined();
      expect(result[0].metadata.source).toBe(filePath);
      expect(result[0].metadata.title).toBe('Test Book');
      expect(result[0].metadata.author).toBe('Test Author');
      expect(result[0].metadata.language).toBe('en');
    });
    
    it('should include optional metadata fields when available', async () => {
      // SETUP
      const filePath = '/path/to/test.epub';
      
      // EXERCISE
      const result = await loader.load(filePath);
      
      // VERIFY
      expect(result[0].metadata.publisher).toBe('Test Publisher');
      expect(result[0].metadata.date).toBe('2024-01-01');
      expect(result[0].metadata.description).toBe('Test description');
    });
    
    it('should concatenate all chapters into single document', async () => {
      // SETUP
      const filePath = '/path/to/test.epub';
      
      // EXERCISE
      const result = await loader.load(filePath);
      
      // VERIFY
      const content = result[0].pageContent;
      expect(content).toContain('Chapter 1');
      expect(content).toContain('Chapter 2');
    });
    
    it('should strip HTML tags from chapter content', async () => {
      // SETUP
      const filePath = '/path/to/test.epub';
      
      // EXERCISE
      const result = await loader.load(filePath);
      
      // VERIFY
      const content = result[0].pageContent;
      expect(content).not.toContain('<p>');
      expect(content).not.toContain('</p>');
      expect(content).toContain('content'); // Text should remain
    });
    
    // Note: Error handling tests (corrupted files, empty files) are better suited
    // for integration tests with real EPUB files, as they require complex mocking
    // of the event-driven epub library. Core functionality is covered above.
  });
  
  describe('getSupportedExtensions', () => {
    it('should return array with .epub extension', () => {
      // EXERCISE
      const extensions = loader.getSupportedExtensions();
      
      // VERIFY
      expect(extensions).toEqual(['.epub']);
      expect(extensions.length).toBe(1);
    });
    
    it('should return lowercase extension', () => {
      // EXERCISE
      const extensions = loader.getSupportedExtensions();
      
      // VERIFY
      expect(extensions[0]).toBe('.epub');
      expect(extensions[0]).not.toBe('.EPUB');
    });
  });
});

