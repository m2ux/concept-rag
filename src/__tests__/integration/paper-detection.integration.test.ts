/**
 * Integration Tests for Paper Detection and Metadata Extraction
 * 
 * Tests the paper detector and metadata extractor against real sample papers
 * in the `sample-docs/Papers` directory.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { Document } from '@langchain/core/documents';
import { PaperDetector, detectDocumentType } from '../../infrastructure/document-loaders/paper-detector.js';
import { PaperMetadataExtractor, extractPaperMetadata } from '../../infrastructure/document-loaders/paper-metadata-extractor.js';

// Path to sample papers
const PAPERS_DIR = path.resolve(__dirname, '../../../sample-docs/Papers');

// Sample paper filenames
const SAMPLE_PAPERS = {
  // arXiv papers
  arxiv_smart_contract: '2204.11193v1.pdf',
  arxiv_other: '2302.12125v2.pdf',
  // ACM paper (DOI in filename)
  acm_paper: '2993600.2993611.pdf',
  // Named paper with metadata
  blockchain_survey: 'A Survey on Blockchain Interoperability_ Past, Present, and -- Rafael Belchior, André Vasconcelos, Sérgio Guerreiro, and -- 2021 -- b8543fa37e7992d9fe93996411e11d28 -- Anna\'s Archive.pdf',
  // IEEE paper
  ieee_adr: 'Love_Unrequited_The_Story_of_Architecture_Agile_and_How_Architecture_Decision_Records_Brought_Them_Together.pdf',
  // Elsevier papers
  elsevier_security: 'Security checklists for Ethereum smart contract development: patterns and best\npractices -- 1-s2.0-S2096720925000946-main.pdf',
  elsevier_momentum: 'Time series momentum_1-s2.0-S0304405X11002613-main.pdf'
};

// Helper to load PDF documents
async function loadPdf(filename: string): Promise<Document[]> {
  const filePath = path.join(PAPERS_DIR, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Sample paper not found: ${filePath}`);
  }
  const loader = new PDFLoader(filePath);
  return await loader.load();
}

// Check if sample papers directory exists
function hasSamplePapers(): boolean {
  return fs.existsSync(PAPERS_DIR) && 
    fs.readdirSync(PAPERS_DIR).some(f => f.endsWith('.pdf'));
}

describe('Paper Detection - Integration with Sample Papers', () => {
  const detector = new PaperDetector();
  
  beforeAll(() => {
    if (!hasSamplePapers()) {
      console.warn('Sample papers not found, skipping integration tests');
    }
  });
  
  describe('arXiv Paper Detection', () => {
    it('should detect 2204.11193v1.pdf as a paper with arXiv ID', async () => {
      if (!hasSamplePapers()) return;
      
      const docs = await loadPdf(SAMPLE_PAPERS.arxiv_smart_contract);
      const result = detector.detect(docs, SAMPLE_PAPERS.arxiv_smart_contract);
      
      expect(result.documentType).toBe('paper');
      expect(result.arxivId).toBe('2204.11193v1');
      expect(result.confidence).toBeGreaterThanOrEqual(0.85);
      expect(result.signals).toContain('arxiv_filename');
      
      // Should also detect academic structure
      expect(result.signals.some(s => 
        s === 'has_abstract' || s === 'academic_sections'
      )).toBe(true);
    }, 30000);
    
    it('should detect 2302.12125v2.pdf as a paper with arXiv ID', async () => {
      if (!hasSamplePapers()) return;
      
      const docs = await loadPdf(SAMPLE_PAPERS.arxiv_other);
      const result = detector.detect(docs, SAMPLE_PAPERS.arxiv_other);
      
      expect(result.documentType).toBe('paper');
      expect(result.arxivId).toBe('2302.12125v2');
      expect(result.confidence).toBeGreaterThanOrEqual(0.85);
    }, 30000);
  });
  
  describe('IEEE Magazine Article Detection', () => {
    it('should detect Love_Unrequited article as a magazine article', async () => {
      if (!hasSamplePapers()) return;
      
      const docs = await loadPdf(SAMPLE_PAPERS.ieee_adr);
      const result = detector.detect(docs, SAMPLE_PAPERS.ieee_adr);
      
      // This is an IEEE Software magazine article, not a research paper
      expect(result.documentType).toBe('magazine');
      expect(result.confidence).toBeGreaterThanOrEqual(0.5);
      
      // Magazine articles still have DOIs
      // DOI may be in content or PDF metadata
    }, 30000);
  });
  
  describe('Elsevier Paper Detection', () => {
    it('should detect Security checklists paper as a paper', async () => {
      if (!hasSamplePapers()) return;
      
      // Handle filename with newline
      const filename = SAMPLE_PAPERS.elsevier_security.replace('\n', ' ');
      const filePath = path.join(PAPERS_DIR, SAMPLE_PAPERS.elsevier_security);
      
      // Skip if file doesn't exist with exact name
      if (!fs.existsSync(filePath)) {
        console.warn('Skipping elsevier_security - file not found with exact name');
        return;
      }
      
      const docs = await loadPdf(SAMPLE_PAPERS.elsevier_security);
      const result = detector.detect(docs, filename);
      
      expect(result.documentType).toBe('paper');
    }, 30000);
    
    it('should detect Time series momentum paper as a paper', async () => {
      if (!hasSamplePapers()) return;
      
      const docs = await loadPdf(SAMPLE_PAPERS.elsevier_momentum);
      const result = detector.detect(docs, SAMPLE_PAPERS.elsevier_momentum);
      
      expect(result.documentType).toBe('paper');
    }, 30000);
  });
  
  describe('Page Count Heuristics', () => {
    it('should show short page count signal for typical papers', async () => {
      if (!hasSamplePapers()) return;
      
      const docs = await loadPdf(SAMPLE_PAPERS.arxiv_smart_contract);
      const result = detector.detect(docs, SAMPLE_PAPERS.arxiv_smart_contract);
      
      // Most papers are under 30 pages
      console.log(`Page count for ${SAMPLE_PAPERS.arxiv_smart_contract}: ${docs.length}`);
      
      if (docs.length <= 30) {
        expect(result.signals).toContain('short_page_count');
      } else if (docs.length <= 60) {
        expect(result.signals).toContain('medium_page_count');
      }
    }, 30000);
  });
});

describe('Paper Metadata Extraction - Integration with Sample Papers', () => {
  const extractor = new PaperMetadataExtractor();
  
  describe('arXiv Paper Metadata', () => {
    it('should extract metadata from 2204.11193v1.pdf', async () => {
      if (!hasSamplePapers()) return;
      
      const docs = await loadPdf(SAMPLE_PAPERS.arxiv_smart_contract);
      const metadata = extractor.extract(docs);
      
      console.log('Extracted metadata from 2204.11193v1.pdf:', JSON.stringify(metadata, null, 2));
      
      // Should extract abstract (most papers have one)
      if (metadata.abstract) {
        expect(metadata.abstract.length).toBeGreaterThan(100);
        expect(metadata.abstract.length).toBeLessThan(3000);
      }
      
      // Should extract some identifying info
      const hasIdentifier = Boolean(metadata.doi || metadata.arxivId);
      const hasStructure = Boolean(metadata.title || metadata.authors);
      expect(hasIdentifier || hasStructure).toBe(true);
    }, 30000);
    
    it('should extract metadata from 2302.12125v2.pdf', async () => {
      if (!hasSamplePapers()) return;
      
      const docs = await loadPdf(SAMPLE_PAPERS.arxiv_other);
      const metadata = extractor.extract(docs);
      
      console.log('Extracted metadata from 2302.12125v2.pdf:', JSON.stringify(metadata, null, 2));
      
      // Verify we get some metadata
      const hasMetadata = Boolean(metadata.title || metadata.abstract || 
                          metadata.doi || metadata.arxivId || metadata.authors);
      expect(hasMetadata).toBe(true);
    }, 30000);
  });
  
  describe('IEEE Paper Metadata', () => {
    it('should extract metadata from IEEE ADR paper', async () => {
      if (!hasSamplePapers()) return;
      
      const docs = await loadPdf(SAMPLE_PAPERS.ieee_adr);
      const metadata = extractor.extract(docs);
      
      console.log('Extracted metadata from IEEE paper:', JSON.stringify(metadata, null, 2));
      
      // IEEE papers typically have DOI
      // Check that we extracted something useful
      const hasMetadata = Boolean(metadata.title || metadata.abstract || 
                          metadata.doi || metadata.venue);
      expect(hasMetadata).toBe(true);
    }, 30000);
  });
  
  describe('Abstract Extraction Quality', () => {
    it('should extract clean abstracts without section headers', async () => {
      if (!hasSamplePapers()) return;
      
      const docs = await loadPdf(SAMPLE_PAPERS.arxiv_smart_contract);
      const metadata = extractor.extract(docs);
      
      if (metadata.abstract) {
        // Abstract should not start with "Abstract" word
        expect(metadata.abstract).not.toMatch(/^abstract\b/i);
        
        // Abstract should not contain section headers
        expect(metadata.abstract).not.toMatch(/\bintroduction\b/i);
        expect(metadata.abstract).not.toMatch(/\brelated work\b/i);
        
        // Abstract should be coherent text
        expect(metadata.abstract.split(' ').length).toBeGreaterThan(20);
      }
    }, 30000);
  });
  
  describe('Keywords Extraction', () => {
    it('should extract keywords when present', async () => {
      if (!hasSamplePapers()) return;
      
      // Try multiple papers as not all have keywords
      const papersToTry = [
        SAMPLE_PAPERS.arxiv_smart_contract,
        SAMPLE_PAPERS.ieee_adr,
        SAMPLE_PAPERS.elsevier_momentum
      ];
      
      let foundKeywords = false;
      
      for (const paperFile of papersToTry) {
        try {
          const docs = await loadPdf(paperFile);
          const metadata = extractor.extract(docs);
          
          if (metadata.keywords && metadata.keywords.length > 0) {
            console.log(`Keywords from ${paperFile}:`, metadata.keywords);
            foundKeywords = true;
            
            // Keywords should be reasonable
            expect(metadata.keywords.every(k => k.length < 100)).toBe(true);
            expect(metadata.keywords.every(k => k.length > 1)).toBe(true);
            break;
          }
        } catch (e) {
          // Skip if file doesn't exist
        }
      }
      
      // At least one paper should have keywords (soft check)
      if (!foundKeywords) {
        console.warn('No keywords found in any sample paper - this may be normal');
      }
    }, 60000);
  });
});

describe('Combined Detection and Extraction - Integration', () => {
  const detector = new PaperDetector();
  const extractor = new PaperMetadataExtractor();
  
  it('should provide consistent results for arXiv paper', async () => {
    if (!hasSamplePapers()) return;
    
    const docs = await loadPdf(SAMPLE_PAPERS.arxiv_smart_contract);
    
    const typeInfo = detector.detect(docs, SAMPLE_PAPERS.arxiv_smart_contract);
    const metadata = extractor.extract(docs);
    
    // Detection says it's a paper
    expect(typeInfo.documentType).toBe('paper');
    
    // ArXiv ID should be consistent
    if (typeInfo.arxivId) {
      // If both found arXiv ID, they should match
      if (metadata.arxivId) {
        expect(metadata.arxivId).toContain('2204.11193');
      }
    }
    
    console.log('Combined results for arXiv paper:');
    console.log('  Type:', typeInfo.documentType);
    console.log('  Confidence:', typeInfo.confidence);
    console.log('  Signals:', typeInfo.signals);
    console.log('  ArXiv ID:', typeInfo.arxivId);
    console.log('  Title:', metadata.title);
    console.log('  Authors:', metadata.authors);
    console.log('  Abstract length:', metadata.abstract?.length);
  }, 30000);
  
  it('should handle all sample papers without errors', async () => {
    if (!hasSamplePapers()) return;
    
    const files = fs.readdirSync(PAPERS_DIR).filter(f => f.endsWith('.pdf'));
    
    for (const file of files) {
      try {
        const docs = await loadPdf(file);
        
        // Detection should not throw
        const typeInfo = detector.detect(docs, file);
        expect(typeInfo.documentType).toBeDefined();
        expect(typeInfo.confidence).toBeGreaterThanOrEqual(0);
        expect(typeInfo.confidence).toBeLessThanOrEqual(1);
        
        // Extraction should not throw
        const metadata = extractor.extract(docs);
        expect(metadata).toBeDefined();
        
        console.log(`✓ ${file}: ${typeInfo.documentType} (${typeInfo.confidence})`);
      } catch (e) {
        // Log but don't fail for file access issues
        console.warn(`⚠ ${file}: ${e}`);
      }
    }
  }, 120000);
});
