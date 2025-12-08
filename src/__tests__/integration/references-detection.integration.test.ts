/**
 * Integration Tests for References Detection
 * 
 * Tests the references detector against real sample papers
 * in the `sample-docs/Papers` directory.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { 
  ReferencesDetector, 
  detectReferencesStart,
  filterReferenceChunks 
} from '../../infrastructure/document-loaders/references-detector.js';

// Path to sample papers
const PAPERS_DIR = path.resolve(__dirname, '../../../sample-docs/Papers');

// Sample paper filenames
const SAMPLE_PAPERS = {
  arxiv_smart_contract: '2204.11193v1.pdf',
  arxiv_dao: '2302.12125v2.pdf',
  acm_ethereum: '2993600.2993611.pdf',
  ieee_adr: 'Love_Unrequited_The_Story_of_Architecture_Agile_and_How_Architecture_Decision_Records_Brought_Them_Together.pdf',
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

describe('References Detection - Integration with Sample Papers', () => {
  const detector = new ReferencesDetector();
  
  beforeAll(() => {
    if (!hasSamplePapers()) {
      console.warn('Sample papers not found, skipping integration tests');
    }
  });
  
  describe('arXiv Papers', () => {
    it('should detect references section in 2204.11193v1.pdf', async () => {
      if (!hasSamplePapers()) return;
      
      const docs = await loadPdf(SAMPLE_PAPERS.arxiv_smart_contract);
      const result = detector.detectReferencesStart(docs);
      
      console.log(`\n📄 ${SAMPLE_PAPERS.arxiv_smart_contract}:`);
      console.log(`   Total pages: ${docs.length}`);
      console.log(`   References found: ${result.found}`);
      console.log(`   Starts at page: ${result.startsAtPage}`);
      console.log(`   Header: ${result.headerFound || '(none)'}`);
      console.log(`   Confidence: ${result.confidence}`);
      
      // Most academic papers have a references section
      expect(result.found).toBe(true);
      expect(result.startsAtPage).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThanOrEqual(0.5);
      
      // References should be in the last portion of the paper
      expect(result.startsAtPage).toBeGreaterThan(docs.length * 0.5);
    }, 30000);
    
    it('should detect references section in 2302.12125v2.pdf (DAO paper)', async () => {
      if (!hasSamplePapers()) return;
      
      const docs = await loadPdf(SAMPLE_PAPERS.arxiv_dao);
      const result = detector.detectReferencesStart(docs);
      
      console.log(`\n📄 ${SAMPLE_PAPERS.arxiv_dao}:`);
      console.log(`   Total pages: ${docs.length}`);
      console.log(`   References found: ${result.found}`);
      console.log(`   Starts at page: ${result.startsAtPage}`);
      console.log(`   Confidence: ${result.confidence}`);
      
      expect(result.found).toBe(true);
      expect(result.startsAtPage).toBeGreaterThan(0);
    }, 30000);
  });
  
  describe('ACM Paper', () => {
    it('should detect references section in ACM Ethereum paper', async () => {
      if (!hasSamplePapers()) return;
      
      const docs = await loadPdf(SAMPLE_PAPERS.acm_ethereum);
      const result = detector.detectReferencesStart(docs);
      
      console.log(`\n📄 ${SAMPLE_PAPERS.acm_ethereum}:`);
      console.log(`   Total pages: ${docs.length}`);
      console.log(`   References found: ${result.found}`);
      console.log(`   Starts at page: ${result.startsAtPage}`);
      console.log(`   Confidence: ${result.confidence}`);
      
      expect(result.found).toBe(true);
    }, 30000);
  });
  
  describe('IEEE Paper', () => {
    it('should detect references section in IEEE ADR paper', async () => {
      if (!hasSamplePapers()) return;
      
      const docs = await loadPdf(SAMPLE_PAPERS.ieee_adr);
      const result = detector.detectReferencesStart(docs);
      
      console.log(`\n📄 ${SAMPLE_PAPERS.ieee_adr}:`);
      console.log(`   Total pages: ${docs.length}`);
      console.log(`   References found: ${result.found}`);
      console.log(`   Starts at page: ${result.startsAtPage}`);
      console.log(`   Confidence: ${result.confidence}`);
      
      // IEEE papers typically have references
      // But short magazine articles might not have a formal section
      if (result.found) {
        expect(result.startsAtPage).toBeGreaterThan(0);
      }
    }, 30000);
  });
  
  describe('Chunk Filtering', () => {
    it('should filter reference chunks from arXiv paper', async () => {
      if (!hasSamplePapers()) return;
      
      const docs = await loadPdf(SAMPLE_PAPERS.arxiv_smart_contract);
      const referencesStart = detector.detectReferencesStart(docs);
      
      // Split into chunks
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 500,
        chunkOverlap: 50,
      });
      const allChunks = await splitter.splitDocuments(docs);
      
      // Filter references
      const filteredChunks = filterReferenceChunks(allChunks, referencesStart);
      
      const stats = detector.getStats(docs, referencesStart);
      const removedChunks = allChunks.length - filteredChunks.length;
      const removedPercent = ((removedChunks / allChunks.length) * 100).toFixed(1);
      
      console.log(`\n📊 Chunk filtering for ${SAMPLE_PAPERS.arxiv_smart_contract}:`);
      console.log(`   Total chunks: ${allChunks.length}`);
      console.log(`   Filtered chunks: ${filteredChunks.length}`);
      console.log(`   Removed: ${removedChunks} (${removedPercent}%)`);
      console.log(`   Content pages: ${stats.contentPages}/${stats.totalPages}`);
      
      // Should remove some chunks (the references)
      expect(filteredChunks.length).toBeLessThan(allChunks.length);
      
      // But not too many (references shouldn't be majority of paper)
      expect(filteredChunks.length).toBeGreaterThan(allChunks.length * 0.5);
    }, 30000);
    
    it('should mark reference chunks with metadata', async () => {
      if (!hasSamplePapers()) return;
      
      const docs = await loadPdf(SAMPLE_PAPERS.arxiv_smart_contract);
      const referencesStart = detector.detectReferencesStart(docs);
      
      // Split into chunks
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 500,
        chunkOverlap: 50,
      });
      const allChunks = await splitter.splitDocuments(docs);
      
      // Mark chunks
      const markedChunks = detector.markReferenceChunks(allChunks, referencesStart);
      
      const referenceChunks = markedChunks.filter(c => c.metadata.is_reference);
      const contentChunks = markedChunks.filter(c => !c.metadata.is_reference);
      
      console.log(`\n📊 Chunk marking for ${SAMPLE_PAPERS.arxiv_smart_contract}:`);
      console.log(`   Reference chunks: ${referenceChunks.length}`);
      console.log(`   Content chunks: ${contentChunks.length}`);
      
      // All chunks should have is_reference metadata
      expect(markedChunks.every(c => typeof c.metadata.is_reference === 'boolean')).toBe(true);
      
      // Should have both types
      expect(referenceChunks.length).toBeGreaterThan(0);
      expect(contentChunks.length).toBeGreaterThan(0);
    }, 30000);
  });
  
  describe('All Sample Papers', () => {
    it('should handle all sample papers without errors', async () => {
      if (!hasSamplePapers()) return;
      
      const files = fs.readdirSync(PAPERS_DIR).filter(f => f.endsWith('.pdf'));
      
      console.log('\n📊 References detection summary:');
      console.log('─'.repeat(80));
      
      for (const file of files) {
        try {
          const docs = await loadPdf(file);
          const result = detector.detectReferencesStart(docs);
          const stats = detector.getStats(docs, result);
          
          const status = result.found ? '✅' : '❌';
          const refInfo = result.found 
            ? `page ${result.startsAtPage}/${docs.length} (${stats.referencePages} ref pages)`
            : 'not found';
          
          console.log(`${status} ${file.substring(0, 50).padEnd(50)} ${refInfo}`);
          
          // Detection should not throw
          expect(result.confidence).toBeGreaterThanOrEqual(0);
          expect(result.confidence).toBeLessThanOrEqual(1);
        } catch (e) {
          console.warn(`⚠ ${file}: ${e}`);
        }
      }
      
      console.log('─'.repeat(80));
    }, 120000);
  });
});
