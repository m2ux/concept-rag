/**
 * Unit Tests for References Detector
 * 
 * Tests the references/bibliography section detection.
 */

import { describe, it, expect } from 'vitest';
import { Document } from '@langchain/core/documents';
import { 
  ReferencesDetector, 
  detectReferencesStart,
  filterReferenceChunks 
} from '../references-detector.js';

// Helper to create mock documents (one per page)
function createMockPages(pages: string[]): Document[] {
  return pages.map((content, i) => new Document({
    pageContent: content,
    metadata: { source: 'test.pdf', page_number: i + 1 }
  }));
}

// Helper to create mock chunks
function createMockChunks(chunks: Array<{ text: string; page: number }>): Document[] {
  return chunks.map((c, i) => new Document({
    pageContent: c.text,
    metadata: { source: 'test.pdf', page_number: c.page, chunkIndex: i }
  }));
}

describe('ReferencesDetector', () => {
  const detector = new ReferencesDetector();
  
  describe('detectReferencesStart', () => {
    it('should detect "References" header', () => {
      const pages = createMockPages([
        'Introduction content...',
        'Methods content...',
        'Results content...',
        'Conclusion content...',
        'References\n\n[1] Smith, J. (2020). Some paper title. Journal of Testing.',
        '[2] Jones, A. et al. (2019). Another paper. Conference Proceedings.'
      ]);
      
      const result = detector.detectReferencesStart(pages);
      
      expect(result.found).toBe(true);
      expect(result.startsAtPage).toBe(5);
      expect(result.headerFound).toMatch(/references/i);
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    });
    
    it('should detect numbered "7. References" header', () => {
      const pages = createMockPages([
        'Content page 1',
        'Content page 2',
        'Content page 3',
        '7. References\n\n[1] Author, A. (2021). Title. Journal.',
        '[2] Author, B. (2020). Title 2. Conference.'
      ]);
      
      const result = detector.detectReferencesStart(pages);
      
      expect(result.found).toBe(true);
      expect(result.startsAtPage).toBe(4);
    });
    
    it('should detect "Bibliography" header', () => {
      const pages = createMockPages([
        'Chapter 1 content...',
        'Chapter 2 content...',
        'Bibliography\n\nSmith, John. The Great Book. Publisher, 2020.',
        'Jones, Alice. Another Book. Publisher, 2019.'
      ]);
      
      const result = detector.detectReferencesStart(pages);
      
      expect(result.found).toBe(true);
      expect(result.startsAtPage).toBe(3);
      expect(result.headerFound).toMatch(/bibliography/i);
    });
    
    it('should detect "Works Cited" header', () => {
      const pages = createMockPages([
        'Essay content...',
        'More content...',
        'Works Cited\n\nAuthor, First. "Title." Journal, 2020.',
      ]);
      
      const result = detector.detectReferencesStart(pages);
      
      expect(result.found).toBe(true);
      expect(result.headerFound).toMatch(/works cited/i);
    });
    
    it('should return not found for documents without references', () => {
      const pages = createMockPages([
        'Introduction...',
        'Main content...',
        'Conclusion without references section.'
      ]);
      
      const result = detector.detectReferencesStart(pages);
      
      expect(result.found).toBe(false);
      expect(result.confidence).toBe(0);
    });
    
    it('should handle empty document', () => {
      const result = detector.detectReferencesStart([]);
      
      expect(result.found).toBe(false);
      expect(result.confidence).toBe(0);
    });
    
    it('should detect references in last 40% of document', () => {
      // 10 page document - references in last 40% (page 7+)
      const pages = createMockPages([
        'Page 1 content',
        'Page 2 content',
        'Page 3 content',
        'Page 4 content',
        'Page 5 content',
        'Page 6 content',
        'Page 7 content',
        'References\n\n[1] Citation 1',
        '[2] Citation 2',
        '[3] Citation 3'
      ]);
      
      const result = detector.detectReferencesStart(pages);
      
      expect(result.found).toBe(true);
      expect(result.startsAtPage).toBe(8);
    });
    
    it('should detect by citation density when no header', () => {
      // Pages with high citation density but no explicit header
      const pages = createMockPages([
        'Regular content without many citations.',
        'More regular academic content here.',
        'Still main body content.',
        // Sudden shift to citation-heavy content
        '[1] Smith, A. (2020). Paper title. Journal.\n[2] Jones, B. (2019). Another paper. Conference.\n[3] Brown, C. et al. (2021). Third paper.',
        '[4] Davis, D. (2018). Fourth paper.\n[5] Evans, E. (2017). Fifth paper.\n[6] Frank, F. (2016). Sixth paper.'
      ]);
      
      const result = detector.detectReferencesStart(pages);
      
      expect(result.found).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(0.5);
    });
  });
  
  describe('isReferenceChunk', () => {
    it('should mark chunks after references start as references', () => {
      const referencesStart = {
        found: true,
        startsAtPage: 5,
        confidence: 0.95
      };
      
      const chunk = new Document({
        pageContent: '[1] Some citation...',
        metadata: { page_number: 6 }
      });
      
      const result = detector.isReferenceChunk(chunk, referencesStart);
      
      expect(result.isReference).toBe(true);
      expect(result.pageNumber).toBe(6);
    });
    
    it('should not mark chunks before references as references', () => {
      const referencesStart = {
        found: true,
        startsAtPage: 5,
        confidence: 0.95
      };
      
      const chunk = new Document({
        pageContent: 'Regular content...',
        metadata: { page_number: 3 }
      });
      
      const result = detector.isReferenceChunk(chunk, referencesStart);
      
      expect(result.isReference).toBe(false);
    });
    
    it('should handle chunks on the references start page', () => {
      const referencesStart = {
        found: true,
        startsAtPage: 5,
        confidence: 0.95
      };
      
      const chunk = new Document({
        pageContent: 'References section content...',
        metadata: { page_number: 5 }
      });
      
      const result = detector.isReferenceChunk(chunk, referencesStart);
      
      expect(result.isReference).toBe(true);
    });
    
    it('should detect citation entries in content chunks', () => {
      const referencesStart = { found: false, confidence: 0 };
      
      const chunk = new Document({
        pageContent: 'As shown by Smith et al. [1, 2], the results indicate...',
        metadata: { page_number: 3 }
      });
      
      const result = detector.isReferenceChunk(chunk, referencesStart);
      
      expect(result.isReference).toBe(false);
      // This tests inline citations, not reference entries
    });
  });
  
  describe('filterReferenceChunks', () => {
    it('should filter out reference chunks', () => {
      const chunks = createMockChunks([
        { text: 'Introduction content', page: 1 },
        { text: 'Methods content', page: 2 },
        { text: 'Results content', page: 3 },
        { text: 'Conclusion content', page: 4 },
        { text: '[1] Citation 1', page: 5 },
        { text: '[2] Citation 2', page: 5 },
        { text: '[3] Citation 3', page: 6 }
      ]);
      
      const referencesStart = {
        found: true,
        startsAtPage: 5,
        confidence: 0.95
      };
      
      const filtered = detector.filterReferenceChunks(chunks, referencesStart);
      
      expect(filtered.length).toBe(4);
      expect(filtered.every(c => c.metadata.page_number < 5)).toBe(true);
    });
    
    it('should return all chunks when no references found', () => {
      const chunks = createMockChunks([
        { text: 'Content 1', page: 1 },
        { text: 'Content 2', page: 2 },
        { text: 'Content 3', page: 3 }
      ]);
      
      const referencesStart = { found: false, confidence: 0 };
      
      const filtered = detector.filterReferenceChunks(chunks, referencesStart);
      
      expect(filtered.length).toBe(3);
    });
  });
  
  describe('markReferenceChunks', () => {
    it('should add is_reference metadata to chunks', () => {
      const chunks = createMockChunks([
        { text: 'Main content', page: 1 },
        { text: 'More content', page: 2 },
        { text: '[1] Citation', page: 3 }
      ]);
      
      const referencesStart = {
        found: true,
        startsAtPage: 3,
        confidence: 0.95
      };
      
      const marked = detector.markReferenceChunks(chunks, referencesStart);
      
      expect(marked[0].metadata.is_reference).toBe(false);
      expect(marked[1].metadata.is_reference).toBe(false);
      expect(marked[2].metadata.is_reference).toBe(true);
    });
    
    it('should preserve original metadata', () => {
      const chunks = [new Document({
        pageContent: 'Content',
        metadata: { 
          source: 'test.pdf', 
          page_number: 1,
          custom_field: 'value'
        }
      })];
      
      const referencesStart = { found: false, confidence: 0 };
      
      const marked = detector.markReferenceChunks(chunks, referencesStart);
      
      expect(marked[0].metadata.source).toBe('test.pdf');
      expect(marked[0].metadata.custom_field).toBe('value');
      expect(marked[0].metadata.is_reference).toBe(false);
    });
  });
  
  describe('getStats', () => {
    it('should calculate reference statistics', () => {
      const pages = createMockPages([
        'Page 1', 'Page 2', 'Page 3', 'Page 4',
        'Page 5', 'Page 6', 'Page 7', 'Page 8'
      ]);
      
      const referencesStart = {
        found: true,
        startsAtPage: 7,
        confidence: 0.95
      };
      
      const stats = detector.getStats(pages, referencesStart);
      
      expect(stats.totalPages).toBe(8);
      expect(stats.referenceStartPage).toBe(7);
      expect(stats.referencePages).toBe(2);  // Pages 7 and 8
      expect(stats.contentPages).toBe(6);    // Pages 1-6
    });
    
    it('should handle no references found', () => {
      const pages = createMockPages(['Page 1', 'Page 2', 'Page 3']);
      
      const referencesStart = { found: false, confidence: 0 };
      
      const stats = detector.getStats(pages, referencesStart);
      
      expect(stats.totalPages).toBe(3);
      expect(stats.referenceStartPage).toBeNull();
      expect(stats.referencePages).toBe(0);
      expect(stats.contentPages).toBe(3);
    });
  });
  
  describe('convenience functions', () => {
    it('detectReferencesStart should work', () => {
      const pages = createMockPages([
        'Content...',
        'References\n\n[1] Citation'
      ]);
      
      const result = detectReferencesStart(pages);
      
      expect(result.found).toBe(true);
    });
    
    it('filterReferenceChunks should work', () => {
      const chunks = createMockChunks([
        { text: 'Content', page: 1 },
        { text: 'Reference', page: 2 }
      ]);
      
      const referencesStart = { found: true, startsAtPage: 2, confidence: 0.95 };
      
      const filtered = filterReferenceChunks(chunks, referencesStart);
      
      expect(filtered.length).toBe(1);
    });
  });
});
