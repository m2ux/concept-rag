/**
 * Unit Tests for PDFDocumentLoader
 * 
 * Tests the PDF document loader using test doubles (mocks).
 * Follows Four-Phase Test pattern from TDD for Embedded C (Grenning).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PDFDocumentLoader } from '../pdf-loader.js';
import { Document } from '@langchain/core/documents';

// Mock the PDFLoader from LangChain
const mockLoad = vi.fn().mockResolvedValue([
  new Document({
    pageContent: 'Page 1 content',
    metadata: { loc: { pageNumber: 1 } }
  }),
  new Document({
    pageContent: 'Page 2 content',
    metadata: { loc: { pageNumber: 2 } }
  })
]);

vi.mock('@langchain/community/document_loaders/fs/pdf', () => {
  class MockPDFLoader {
    constructor(public filePath: string) {}
    load = mockLoad;
  }
  
  return {
    PDFLoader: MockPDFLoader
  };
});

describe('PDFDocumentLoader', () => {
  let loader: PDFDocumentLoader;
  
  beforeEach(() => {
    // SETUP - Fresh loader instance for each test
    loader = new PDFDocumentLoader();
    vi.clearAllMocks();
  });
  
  describe('canHandle', () => {
    it('should return true for .pdf extension', () => {
      // EXERCISE
      const result = loader.canHandle('/path/to/document.pdf');
      
      // VERIFY
      expect(result).toBe(true);
    });
    
    it('should be case-insensitive', () => {
      // EXERCISE
      const result1 = loader.canHandle('/path/to/DOCUMENT.PDF');
      const result2 = loader.canHandle('/path/to/document.Pdf');
      const result3 = loader.canHandle('/path/to/Document.PDF');
      
      // VERIFY
      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(result3).toBe(true);
    });
    
    it('should return false for non-PDF files', () => {
      // EXERCISE
      const result1 = loader.canHandle('/path/to/document.epub');
      const result2 = loader.canHandle('/path/to/document.txt');
      const result3 = loader.canHandle('/path/to/document');
      
      // VERIFY
      expect(result1).toBe(false);
      expect(result2).toBe(false);
      expect(result3).toBe(false);
    });
    
    it('should return false for files with .pdf in name but different extension', () => {
      // EXERCISE
      const result = loader.canHandle('/path/to/document.pdf.backup');
      
      // VERIFY
      expect(result).toBe(false);
    });
  });
  
  describe('load', () => {
    it('should load PDF file and return documents', async () => {
      // SETUP
      const filePath = '/path/to/test.pdf';
      
      // EXERCISE
      const result = await loader.load(filePath);
      
      // VERIFY
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('pageContent');
      expect(result[0]).toHaveProperty('metadata');
    });
    
    it('should return documents with page content', async () => {
      // SETUP
      const filePath = '/path/to/test.pdf';
      
      // EXERCISE
      const result = await loader.load(filePath);
      
      // VERIFY
      expect(result[0].pageContent).toBeDefined();
      expect(typeof result[0].pageContent).toBe('string');
    });
    
    it('should return documents with metadata', async () => {
      // SETUP
      const filePath = '/path/to/test.pdf';
      
      // EXERCISE
      const result = await loader.load(filePath);
      
      // VERIFY
      expect(result[0].metadata).toBeDefined();
      expect(result[0].metadata.loc).toBeDefined();
      expect(result[0].metadata.loc.pageNumber).toBe(1);
    });
    
    it('should handle multi-page documents', async () => {
      // SETUP
      const filePath = '/path/to/test.pdf';
      
      // EXERCISE
      const result = await loader.load(filePath);
      
      // VERIFY
      expect(result.length).toBe(2);
      expect(result[0].metadata.loc.pageNumber).toBe(1);
      expect(result[1].metadata.loc.pageNumber).toBe(2);
    });
    
    it('should create PDFLoader instance and call load', async () => {
      // SETUP
      const filePath = '/path/to/test.pdf';
      
      // EXERCISE
      const result = await loader.load(filePath);
      
      // VERIFY
      expect(result).toBeDefined();
      expect(mockLoad).toHaveBeenCalled();
    });
  });
  
  describe('getSupportedExtensions', () => {
    it('should return array with .pdf extension', () => {
      // EXERCISE
      const extensions = loader.getSupportedExtensions();
      
      // VERIFY
      expect(extensions).toEqual(['.pdf']);
      expect(extensions.length).toBe(1);
    });
    
    it('should return lowercase extension', () => {
      // EXERCISE
      const extensions = loader.getSupportedExtensions();
      
      // VERIFY
      expect(extensions[0]).toBe('.pdf');
      expect(extensions[0]).not.toBe('.PDF');
    });
  });
});

