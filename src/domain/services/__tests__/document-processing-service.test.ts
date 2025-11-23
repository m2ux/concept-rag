/**
 * Tests for Document Processing Service with Result types
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DocumentProcessingService } from '../document-processing-service';
import * as Result from '../../functional/result';
import * as Option from '../../functional/option';

describe('DocumentProcessingService', () => {
  let service: DocumentProcessingService;
  
  beforeEach(() => {
    service = new DocumentProcessingService();
  });
  
  describe('validatePath', () => {
    it('should accept valid paths', () => {
      const result = service.validatePath('docs/file.pdf');
      expect(Result.isOk(result)).toBe(true);
    });
    
    it('should reject empty paths', () => {
      const result = service.validatePath('');
      expect(Result.isErr(result)).toBe(true);
      if (Result.isErr(result)) {
        expect(result.error.type).toBe('invalid_path');
      }
    });
    
    it('should reject paths with invalid characters', () => {
      const result = service.validatePath('docs/<script>.pdf');
      expect(Result.isErr(result)).toBe(true);
    });
  });
  
  describe('extractFormat', () => {
    it('should extract supported formats', () => {
      const formats = ['pdf', 'epub', 'md', 'txt'];
      
      for (const format of formats) {
        const result = service.extractFormat(`file.${format}`);
        expect(Result.isOk(result)).toBe(true);
        if (Result.isOk(result)) {
          expect(result.value).toBe(format);
        }
      }
    });
    
    it('should reject unsupported formats', () => {
      const result = service.extractFormat('file.docx');
      expect(Result.isErr(result)).toBe(true);
      if (Result.isErr(result)) {
        expect(result.error.type).toBe('unsupported_format');
      }
    });
  });
  
  describe('readFile', () => {
    it('should read text files', () => {
      const result = service.readFile('test.txt');
      expect(Result.isOk(result)).toBe(true);
      if (Result.isOk(result)) {
        expect(result.value).toContain('test.txt');
      }
    });
    
    it('should read PDF files', () => {
      const result = service.readFile('test.pdf');
      expect(Result.isOk(result)).toBe(true);
      if (Result.isOk(result)) {
        expect(result.value).toContain('PDF content');
      }
    });
  });
  
  describe('parseMetadata', () => {
    it('should extract metadata from content', () => {
      const content = 'Sample content with multiple words here';
      const result = service.parseMetadata('docs/sample.pdf', content);
      
      expect(Result.isOk(result)).toBe(true);
      if (Result.isOk(result)) {
        expect(result.value.title).toBe('sample');
        expect(result.value.format).toBe('pdf');
        expect(result.value.pageCount).toBeGreaterThan(0);
      }
    });
  });
  
  describe('validateSize', () => {
    it('should accept normal-sized content', () => {
      const content = 'Small content';
      const result = service.validateSize(content);
      expect(Result.isOk(result)).toBe(true);
    });
    
    it('should reject oversized content', () => {
      // Create a string larger than 10MB
      const largeContent = 'x'.repeat(11 * 1024 * 1024);
      const result = service.validateSize(largeContent);
      expect(Result.isErr(result)).toBe(true);
      if (Result.isErr(result)) {
        expect(result.error.type).toBe('too_large');
      }
    });
  });
  
  describe('countWords', () => {
    it('should count words correctly', () => {
      const content = 'This is a test content';
      expect(service.countWords(content)).toBe(5);
    });
    
    it('should handle empty content', () => {
      expect(service.countWords('')).toBe(0);
    });
    
    it('should handle multiple spaces', () => {
      const content = 'word1   word2    word3';
      expect(service.countWords(content)).toBe(3);
    });
  });
  
  describe('processDocument', () => {
    it('should process valid document', () => {
      const result = service.processDocument('docs/test.pdf');
      
      expect(Result.isOk(result)).toBe(true);
      if (Result.isOk(result)) {
        expect(result.value.path).toBe('docs/test.pdf');
        expect(result.value.metadata.title).toBe('test');
        expect(result.value.metadata.format).toBe('pdf');
        expect(result.value.wordCount).toBeGreaterThan(0);
      }
    });
    
    it('should reject invalid path', () => {
      const result = service.processDocument('');
      expect(Result.isErr(result)).toBe(true);
    });
    
    it('should reject unsupported format', () => {
      const result = service.processDocument('test.docx');
      expect(Result.isErr(result)).toBe(true);
      if (Result.isErr(result)) {
        expect(result.error.type).toBe('unsupported_format');
      }
    });
  });
  
  describe('findAuthor', () => {
    it('should return Some when author present', () => {
      const metadata = {
        title: 'Test',
        author: 'John Doe',
        format: 'pdf' as const
      };
      
      const result = service.findAuthor(metadata);
      expect(Option.isSome(result)).toBe(true);
      if (Option.isSome(result)) {
        expect(result.value).toBe('John Doe');
      }
    });
    
    it('should return None when author absent', () => {
      const metadata = {
        title: 'Test',
        format: 'pdf' as const
      };
      
      const result = service.findAuthor(metadata);
      expect(Option.isNone(result)).toBe(true);
    });
  });
  
  describe('getPageCount', () => {
    it('should return page count when present', () => {
      const metadata = {
        title: 'Test',
        format: 'pdf' as const,
        pageCount: 42
      };
      
      expect(service.getPageCount(metadata)).toBe(42);
    });
    
    it('should return default when absent', () => {
      const metadata = {
        title: 'Test',
        format: 'pdf' as const
      };
      
      expect(service.getPageCount(metadata, 10)).toBe(10);
    });
  });
  
  describe('processDocuments', () => {
    it('should process multiple valid documents', async () => {
      const paths = ['test1.pdf', 'test2.md', 'test3.txt'];
      const result = await service.processDocuments(paths);
      
      expect(Result.isOk(result)).toBe(true);
      if (Result.isOk(result)) {
        expect(result.value).toHaveLength(3);
      }
    });
    
    it('should collect errors from invalid documents', async () => {
      const paths = ['test1.pdf', 'test2.docx', 'test3.txt'];
      const result = await service.processDocuments(paths);
      
      expect(Result.isErr(result)).toBe(true);
      if (Result.isErr(result)) {
        expect(result.error.length).toBeGreaterThan(0);
        expect(result.error[0].type).toBe('unsupported_format');
      }
    });
  });
  
  describe('processDocumentWithRetry', () => {
    it('should succeed on first attempt for valid document', async () => {
      const result = await service.processDocumentWithRetry('test.pdf');
      expect(Result.isOk(result)).toBe(true);
    });
    
    it('should not retry validation errors', async () => {
      const result = await service.processDocumentWithRetry('', 3);
      expect(Result.isErr(result)).toBe(true);
    });
  });
  
  describe('processWithFallback', () => {
    it('should use primary when it succeeds', async () => {
      const result = await service.processWithFallback('primary.pdf', 'fallback.pdf');
      expect(Result.isOk(result)).toBe(true);
      if (Result.isOk(result)) {
        expect(result.value.path).toBe('primary.pdf');
      }
    });
    
    it('should use fallback when primary fails', async () => {
      const result = await service.processWithFallback('invalid.docx', 'fallback.pdf');
      expect(Result.isOk(result)).toBe(true);
      if (Result.isOk(result)) {
        expect(result.value.path).toBe('fallback.pdf');
      }
    });
    
    it('should fail if both fail', async () => {
      const result = await service.processWithFallback('invalid1.docx', 'invalid2.docx');
      expect(Result.isErr(result)).toBe(true);
    });
  });
  
  describe('Railway Pattern Integration', () => {
    it('should chain operations successfully', () => {
      // This test demonstrates the railway pattern in action
      const result = service.processDocument('docs/sample.pdf');
      
      // Map over the result
      const titleResult = Result.map(result, doc => doc.metadata.title);
      expect(Result.isOk(titleResult)).toBe(true);
      
      // FlatMap to another operation
      const formatResult = Result.flatMap(titleResult, title => {
        return title === 'sample' 
          ? Result.Ok('Valid title') 
          : Result.Err({ type: 'parse_error' as const, message: 'Invalid title' });
      });
      expect(Result.isOk(formatResult)).toBe(true);
    });
    
    it('should short-circuit on error', () => {
      const result = service.processDocument('invalid.docx');
      
      // Try to map - should not execute
      let executed = false;
      const mapped = Result.map(result, doc => {
        executed = true;
        return doc.metadata.title;
      });
      
      expect(executed).toBe(false);
      expect(Result.isErr(mapped)).toBe(true);
    });
  });
});

