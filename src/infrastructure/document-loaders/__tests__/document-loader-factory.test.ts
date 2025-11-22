/**
 * Unit Tests for DocumentLoaderFactory
 * 
 * Tests the document loader factory pattern implementation.
 * Follows Four-Phase Test pattern from TDD for Embedded C (Grenning).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DocumentLoaderFactory } from '../document-loader-factory.js';
import { IDocumentLoader } from '../document-loader.js';
import { Document } from '@langchain/core/documents';

/**
 * Mock document loader for testing
 */
class MockDocumentLoader implements IDocumentLoader {
  private supportedExtensions: string[];
  private canHandleResult: boolean;
  
  constructor(extensions: string[], canHandle: boolean = true) {
    this.supportedExtensions = extensions;
    this.canHandleResult = canHandle;
  }
  
  canHandle(filePath: string): boolean {
    return this.canHandleResult && this.supportedExtensions.some(ext => 
      filePath.toLowerCase().endsWith(ext.toLowerCase())
    );
  }
  
  async load(filePath: string): Promise<Document[]> {
    return [new Document({ pageContent: 'Mock content', metadata: {} })];
  }
  
  getSupportedExtensions(): string[] {
    return this.supportedExtensions;
  }
  
  // Test helper to change canHandle behavior
  setCanHandle(result: boolean): void {
    this.canHandleResult = result;
  }
}

describe('DocumentLoaderFactory', () => {
  let factory: DocumentLoaderFactory;
  
  beforeEach(() => {
    // SETUP - Fresh factory instance for each test
    factory = new DocumentLoaderFactory();
  });
  
  describe('registerLoader', () => {
    it('should register a loader', () => {
      // SETUP
      const loader = new MockDocumentLoader(['.pdf']);
      
      // EXERCISE
      factory.registerLoader(loader);
      
      // VERIFY
      expect(factory.getLoaderCount()).toBe(1);
    });
    
    it('should register multiple loaders', () => {
      // SETUP
      const loader1 = new MockDocumentLoader(['.pdf']);
      const loader2 = new MockDocumentLoader(['.epub']);
      
      // EXERCISE
      factory.registerLoader(loader1);
      factory.registerLoader(loader2);
      
      // VERIFY
      expect(factory.getLoaderCount()).toBe(2);
    });
    
    it('should allow registering same loader multiple times', () => {
      // SETUP
      const loader = new MockDocumentLoader(['.pdf']);
      
      // EXERCISE
      factory.registerLoader(loader);
      factory.registerLoader(loader);
      
      // VERIFY
      expect(factory.getLoaderCount()).toBe(2);
    });
  });
  
  describe('getLoader', () => {
    it('should return loader that can handle the file', () => {
      // SETUP
      const pdfLoader = new MockDocumentLoader(['.pdf']);
      const epubLoader = new MockDocumentLoader(['.epub']);
      factory.registerLoader(pdfLoader);
      factory.registerLoader(epubLoader);
      
      // EXERCISE
      const result = factory.getLoader('/path/to/document.pdf');
      
      // VERIFY
      expect(result).toBe(pdfLoader);
    });
    
    it('should return first matching loader when multiple can handle', () => {
      // SETUP
      const loader1 = new MockDocumentLoader(['.pdf', '.txt']);
      const loader2 = new MockDocumentLoader(['.pdf']);
      factory.registerLoader(loader1);
      factory.registerLoader(loader2);
      
      // EXERCISE
      const result = factory.getLoader('/path/to/document.pdf');
      
      // VERIFY
      expect(result).toBe(loader1); // First registered loader
    });
    
    it('should return null when no loader can handle the file', () => {
      // SETUP
      const pdfLoader = new MockDocumentLoader(['.pdf']);
      factory.registerLoader(pdfLoader);
      
      // EXERCISE
      const result = factory.getLoader('/path/to/document.epub');
      
      // VERIFY
      expect(result).toBeNull();
    });
    
    it('should return null when no loaders are registered', () => {
      // EXERCISE
      const result = factory.getLoader('/path/to/document.pdf');
      
      // VERIFY
      expect(result).toBeNull();
    });
    
    it('should check loaders in registration order', () => {
      // SETUP
      const loader1 = new MockDocumentLoader(['.pdf']);
      const loader2 = new MockDocumentLoader(['.pdf']);
      factory.registerLoader(loader1);
      factory.registerLoader(loader2);
      
      // EXERCISE
      const result = factory.getLoader('/path/to/document.pdf');
      
      // VERIFY
      expect(result).toBe(loader1); // First registered, not second
    });
    
    it('should handle case-insensitive file extensions', () => {
      // SETUP
      const loader = new MockDocumentLoader(['.pdf']);
      factory.registerLoader(loader);
      
      // EXERCISE
      const result1 = factory.getLoader('/path/to/DOCUMENT.PDF');
      const result2 = factory.getLoader('/path/to/document.Pdf');
      
      // VERIFY
      expect(result1).toBe(loader);
      expect(result2).toBe(loader);
    });
  });
  
  describe('getSupportedExtensions', () => {
    it('should return empty array when no loaders registered', () => {
      // EXERCISE
      const extensions = factory.getSupportedExtensions();
      
      // VERIFY
      expect(extensions).toEqual([]);
    });
    
    it('should return extensions from single loader', () => {
      // SETUP
      const loader = new MockDocumentLoader(['.pdf']);
      factory.registerLoader(loader);
      
      // EXERCISE
      const extensions = factory.getSupportedExtensions();
      
      // VERIFY
      expect(extensions).toEqual(['.pdf']);
    });
    
    it('should combine extensions from multiple loaders', () => {
      // SETUP
      const pdfLoader = new MockDocumentLoader(['.pdf']);
      const epubLoader = new MockDocumentLoader(['.epub']);
      factory.registerLoader(pdfLoader);
      factory.registerLoader(epubLoader);
      
      // EXERCISE
      const extensions = factory.getSupportedExtensions();
      
      // VERIFY
      expect(extensions).toContain('.pdf');
      expect(extensions).toContain('.epub');
      expect(extensions.length).toBe(2);
    });
    
    it('should remove duplicate extensions', () => {
      // SETUP
      const loader1 = new MockDocumentLoader(['.pdf', '.txt']);
      const loader2 = new MockDocumentLoader(['.pdf', '.epub']);
      factory.registerLoader(loader1);
      factory.registerLoader(loader2);
      
      // EXERCISE
      const extensions = factory.getSupportedExtensions();
      
      // VERIFY
      expect(extensions).toContain('.pdf');
      expect(extensions).toContain('.txt');
      expect(extensions).toContain('.epub');
      expect(extensions.length).toBe(3);
      // Verify .pdf appears only once
      expect(extensions.filter(ext => ext === '.pdf').length).toBe(1);
    });
    
    it('should handle loaders with multiple extensions', () => {
      // SETUP
      const loader = new MockDocumentLoader(['.pdf', '.epub', '.mobi']);
      factory.registerLoader(loader);
      
      // EXERCISE
      const extensions = factory.getSupportedExtensions();
      
      // VERIFY
      expect(extensions).toContain('.pdf');
      expect(extensions).toContain('.epub');
      expect(extensions).toContain('.mobi');
      expect(extensions.length).toBe(3);
    });
  });
  
  describe('getLoaderCount', () => {
    it('should return 0 when no loaders registered', () => {
      // EXERCISE
      const count = factory.getLoaderCount();
      
      // VERIFY
      expect(count).toBe(0);
    });
    
    it('should return correct count after registering loaders', () => {
      // SETUP
      const loader1 = new MockDocumentLoader(['.pdf']);
      const loader2 = new MockDocumentLoader(['.epub']);
      
      // EXERCISE & VERIFY
      expect(factory.getLoaderCount()).toBe(0);
      
      factory.registerLoader(loader1);
      expect(factory.getLoaderCount()).toBe(1);
      
      factory.registerLoader(loader2);
      expect(factory.getLoaderCount()).toBe(2);
    });
  });
  
  describe('integration scenarios', () => {
    it('should work with PDF and EPUB loaders together', () => {
      // SETUP
      const pdfLoader = new MockDocumentLoader(['.pdf']);
      const epubLoader = new MockDocumentLoader(['.epub']);
      factory.registerLoader(pdfLoader);
      factory.registerLoader(epubLoader);
      
      // EXERCISE
      const pdfResult = factory.getLoader('/path/to/document.pdf');
      const epubResult = factory.getLoader('/path/to/book.epub');
      const unsupportedResult = factory.getLoader('/path/to/file.txt');
      const extensions = factory.getSupportedExtensions();
      
      // VERIFY
      expect(pdfResult).toBe(pdfLoader);
      expect(epubResult).toBe(epubLoader);
      expect(unsupportedResult).toBeNull();
      expect(extensions).toContain('.pdf');
      expect(extensions).toContain('.epub');
    });
    
    it('should handle loader that cannot handle file even with matching extension', () => {
      // SETUP
      const loader = new MockDocumentLoader(['.pdf'], false); // canHandle returns false
      factory.registerLoader(loader);
      
      // EXERCISE
      const result = factory.getLoader('/path/to/document.pdf');
      
      // VERIFY
      expect(result).toBeNull();
    });
  });
});

