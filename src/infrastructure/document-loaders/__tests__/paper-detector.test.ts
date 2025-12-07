/**
 * Unit Tests for Paper Detector
 * 
 * Tests the document type detection heuristics.
 */

import { describe, it, expect } from 'vitest';
import { Document } from '@langchain/core/documents';
import { PaperDetector, detectDocumentType } from '../paper-detector.js';

// Helper to create mock documents
function createMockDocs(pages: string[]): Document[] {
  return pages.map((content, i) => new Document({
    pageContent: content,
    metadata: { source: 'test.pdf', loc: { pageNumber: i + 1 } }
  }));
}

describe('PaperDetector', () => {
  const detector = new PaperDetector();
  
  describe('arxiv filename detection', () => {
    it('should detect arXiv ID from filename', () => {
      const docs = createMockDocs(['Some content']);
      const result = detector.detect(docs, '2204.11193v1.pdf');
      
      expect(result.documentType).toBe('paper');
      expect(result.arxivId).toBe('2204.11193v1');
      expect(result.signals).toContain('arxiv_filename');
      expect(result.confidence).toBeGreaterThanOrEqual(0.85);
    });
    
    it('should detect arXiv ID without version', () => {
      const docs = createMockDocs(['Some content']);
      const result = detector.detect(docs, '2302.12125.pdf');
      
      expect(result.documentType).toBe('paper');
      expect(result.arxivId).toBe('2302.12125');
    });
    
    it('should not detect invalid arXiv patterns', () => {
      const docs = createMockDocs(['Some content']);
      const result = detector.detect(docs, '12345.pdf');
      
      expect(result.arxivId).toBeUndefined();
    });
  });
  
  describe('isArxivFilename', () => {
    it('should return true for valid arXiv filenames', () => {
      expect(detector.isArxivFilename('2204.11193v1.pdf')).toBe(true);
      expect(detector.isArxivFilename('2302.12125.pdf')).toBe(true);
      expect(detector.isArxivFilename('1901.00001v2.pdf')).toBe(true);
    });
    
    it('should return false for non-arXiv filenames', () => {
      expect(detector.isArxivFilename('document.pdf')).toBe(false);
      expect(detector.isArxivFilename('12345.pdf')).toBe(false);
      expect(detector.isArxivFilename('Clean Architecture.pdf')).toBe(false);
    });
  });
  
  describe('extractArxivId', () => {
    it('should extract arXiv ID from filename', () => {
      expect(detector.extractArxivId('2204.11193v1.pdf')).toBe('2204.11193v1');
      expect(detector.extractArxivId('2302.12125.pdf')).toBe('2302.12125');
    });
    
    it('should return undefined for non-arXiv filenames', () => {
      expect(detector.extractArxivId('document.pdf')).toBeUndefined();
    });
  });
  
  describe('page count heuristics', () => {
    it('should favor paper classification for short documents', () => {
      const docs = createMockDocs(Array(15).fill('Page content with some text.'));
      const result = detector.detect(docs, 'document.pdf');
      
      expect(result.signals).toContain('short_page_count');
    });
    
    it('should favor book classification for long documents', () => {
      const docs = createMockDocs(Array(150).fill('Page content with some text.'));
      const result = detector.detect(docs, 'document.pdf');
      
      expect(result.signals).toContain('!long_page_count');
    });
  });
  
  describe('abstract detection', () => {
    it('should detect abstract section', () => {
      const docs = createMockDocs([
        'Title of Paper\n\nAbstract\n\nThis paper presents...',
        'Introduction content...'
      ]);
      const result = detector.detect(docs, 'document.pdf');
      
      expect(result.signals).toContain('has_abstract');
    });
    
    it('should detect abstract in various formats', () => {
      const docs = createMockDocs([
        'ABSTRACT: This study examines...',
        'Methods...'
      ]);
      const result = detector.detect(docs, 'document.pdf');
      
      expect(result.signals).toContain('has_abstract');
    });
  });
  
  describe('citation pattern detection', () => {
    it('should detect bracket-style citations', () => {
      const docs = createMockDocs([
        'As shown in previous work [1], the results [2, 3] indicate that... further [4] and [5]',
        'Further analysis [6] supports this [7, 8, 9]. Also see [10] and [11].',
        'Reference [12] demonstrates [13, 14] this pattern. More in [15].'
      ]);
      const result = detector.detect(docs, 'document.pdf');
      
      expect(result.signals).toContain('many_citations');
    });
    
    it('should detect author-year citations', () => {
      const docs = createMockDocs([
        'As noted by (Smith, 2020), this finding (Jones et al., 2019) supports (Brown, 2021)...',
        'Previous work (Brown and White, 2018) established (Lee, 2021) and (Kim, 2020)...',
        'Studies (Garcia et al., 2020) confirm (Chen, 2019) results (Wang, 2022) and (Li, 2023).'
      ]);
      const result = detector.detect(docs, 'document.pdf');
      
      expect(result.signals).toContain('many_citations');
    });
  });
  
  describe('academic section detection', () => {
    it('should detect academic paper structure', () => {
      const docs = createMockDocs([
        'Abstract: This paper...',
        '1. Introduction\nWe present...',
        '2. Related Work\nPrevious studies...',
        '3. Methodology\nOur approach...',
        '4. Results\nWe found...',
        '5. Discussion\nThese findings...',
        '6. Conclusion\nIn summary...',
        'References\n[1] Smith...'
      ]);
      const result = detector.detect(docs, 'document.pdf');
      
      expect(result.signals).toContain('academic_sections');
      expect(result.documentType).toBe('paper');
    });
  });
  
  describe('book pattern detection', () => {
    it('should detect book structure', () => {
      const docs = createMockDocs([
        'Table of Contents',
        'Preface\nThis book...',
        'Chapter 1: Getting Started',
        'Chapter 2: Advanced Topics',
        'Epilogue',
        'Index'
      ].concat(Array(150).fill('Content...')));
      const result = detector.detect(docs, 'document.pdf');
      
      expect(result.signals).toContain('!book_patterns');
      expect(result.documentType).toBe('book');
    });
  });
  
  describe('DOI detection', () => {
    it('should detect DOI in content', () => {
      const docs = createMockDocs([
        'Title\n\nDOI: 10.1109/MS.2022.3166266\n\nAbstract...'
      ]);
      const result = detector.detect(docs, 'document.pdf');
      
      expect(result.doi).toBe('10.1109/MS.2022.3166266');
      expect(result.signals).toContain('doi_in_content');
    });
    
    it('should detect DOI in PDF metadata', () => {
      const docs = createMockDocs(['Content']);
      const pdfMetadata = {
        info: {
          Subject: 'IEEE Software;2022;39;4;10.1109/MS.2022.3166266'
        }
      };
      const result = detector.detect(docs, 'document.pdf', pdfMetadata);
      
      expect(result.doi).toBe('10.1109/MS.2022.3166266');
      expect(result.signals).toContain('doi_in_pdf_metadata');
    });
  });
  
  describe('LaTeX detection', () => {
    it('should detect LaTeX-generated PDFs', () => {
      const docs = createMockDocs(['Content']);
      const pdfMetadata = {
        info: {
          Creator: 'LaTeX with hyperref',
          Producer: 'pdfTeX-1.40.21'
        }
      };
      const result = detector.detect(docs, 'document.pdf', pdfMetadata);
      
      expect(result.signals).toContain('latex_generated');
    });
  });
  
  describe('author affiliation detection', () => {
    it('should detect academic affiliations', () => {
      const docs = createMockDocs([
        'Title\n\nJohn Smith\nDepartment of Computer Science\nUniversity of Example\njsmith@example.edu'
      ]);
      const result = detector.detect(docs, 'document.pdf');
      
      expect(result.signals).toContain('author_affiliations');
    });
  });
  
  describe('combined signals', () => {
    it('should classify typical arXiv paper correctly', () => {
      const docs = createMockDocs([
        'Title of Paper\n\nAuthors\nUniversity of Example\n\nAbstract\n\nThis paper presents...',
        '1. Introduction\n\nRecent work [1, 2] has shown...',
        '2. Related Work\n\nPrior studies [3, 4, 5]...',
        '3. Methodology\n\nOur approach...',
        '4. Results\n\nWe found [6]...',
        '5. Conclusion\n\nIn this work...',
        'References\n[1] Author...'
      ]);
      const pdfMetadata = {
        info: {
          Creator: 'LaTeX with hyperref',
          Producer: 'pdfTeX-1.40.21'
        }
      };
      const result = detector.detect(docs, '2204.11193v1.pdf', pdfMetadata);
      
      expect(result.documentType).toBe('paper');
      expect(result.arxivId).toBe('2204.11193v1');
      expect(result.confidence).toBeGreaterThanOrEqual(0.85);
    });
    
    it('should classify typical book correctly', () => {
      // Create 200+ page book
      const pages = [
        'Clean Architecture\n\nRobert C. Martin',
        'Table of Contents\n\n1. Introduction\n2. Starting...',
        'Preface\n\nThis book is about...',
        'Chapter 1: Introduction\n\nSoftware architecture...',
        ...Array(196).fill('Content of the book continues with explanations and examples.')
      ];
      const docs = createMockDocs(pages);
      const result = detector.detect(docs, 'Clean Architecture.pdf');
      
      expect(result.documentType).toBe('book');
      expect(result.confidence).toBeGreaterThanOrEqual(0.6);
    });
    
    it('should classify IEEE journal paper correctly', () => {
      const docs = createMockDocs([
        'IEEE SOFTWARE\n\nLove Unrequited: Architecture Decision Records\n\nMichael Keeling, George Fairbanks\n\nDOI: 10.1109/MS.2022.3166266',
        'Abstract: Software architecture has long sought...',
        'I. INTRODUCTION\n\nArchitecture decisions [1]...',
        'II. RELATED WORK\n\nPrevious studies [2, 3]...',
        'REFERENCES\n[1] Author...'
      ]);
      const pdfMetadata = {
        info: {
          Subject: 'IEEE Software;2022;39;4;10.1109/MS.2022.3166266'
        }
      };
      const result = detector.detect(docs, 'ieee-paper.pdf', pdfMetadata);
      
      expect(result.documentType).toBe('paper');
      expect(result.doi).toBe('10.1109/MS.2022.3166266');
    });
  });
  
  describe('convenience function', () => {
    it('should work with detectDocumentType', () => {
      const docs = createMockDocs(['Abstract\n\nThis paper...']);
      const result = detectDocumentType(docs, '2204.11193v1.pdf');
      
      expect(result.documentType).toBe('paper');
      expect(result.arxivId).toBe('2204.11193v1');
    });
  });
});

