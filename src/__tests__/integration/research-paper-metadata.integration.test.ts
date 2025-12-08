/**
 * Integration Tests for Research Paper Metadata Fields
 * 
 * Tests the new research paper metadata fields added to the catalog schema:
 * - document_type: 'book' | 'paper' | 'article' | 'unknown'
 * - doi: Digital Object Identifier
 * - arxiv_id: ArXiv identifier
 * - venue: Journal/conference name
 * - keywords: Paper keywords array
 * - abstract: Paper abstract (distinct from LLM summary)
 * - authors: Array of author names
 * 
 * @group integration
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as lancedb from '@lancedb/lancedb';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { LanceDBCatalogRepository } from '../../infrastructure/lancedb/repositories/lancedb-catalog-repository.js';
import { SimpleEmbeddingService } from '../../infrastructure/embeddings/simple-embedding-service.js';
import { ConceptualHybridSearchService } from '../../infrastructure/search/conceptual-hybrid-search-service.js';
import { QueryExpander } from '../../concepts/query_expander.js';
import { hashToId } from '../../infrastructure/utils/hash.js';
import { isSome } from '../../domain/functional/index.js';

describe('Research Paper Metadata Fields - Integration Tests', () => {
  let dbPath: string;
  let connection: lancedb.Connection;
  let catalogTable: lancedb.Table;
  let catalogRepo: LanceDBCatalogRepository;
  const embeddingService = new SimpleEmbeddingService();
  
  // Test data: one book and one research paper
  const testBook = {
    id: hashToId('/docs/books/clean-architecture.pdf'),
    source: '/docs/books/clean-architecture.pdf',
    title: 'Clean Architecture',
    summary: 'A comprehensive guide to clean architecture principles.',
    hash: 'book-hash-001',
    vector: embeddingService.generateEmbedding('clean architecture principles'),
    concept_ids: [hashToId('clean architecture')],
    concept_names: ['clean architecture'],
    category_ids: [hashToId('software architecture')],
    category_names: ['software architecture'],
    origin_hash: '',
    author: 'Robert C. Martin',
    year: 2017,
    publisher: 'Pearson',
    isbn: '9780134494166',
    // Research paper fields (empty/defaults for books)
    document_type: 'book',
    doi: '',
    arxiv_id: '',
    venue: '',
    keywords: [''],
    abstract: '',
    authors: ['']
  };
  
  const testPaper = {
    id: hashToId('/docs/papers/2204.11193v1.pdf'),
    source: '/docs/papers/2204.11193v1.pdf',
    title: 'Exploring Security Practices of Smart Contract Developers',
    summary: 'Study examining how developers approach smart contract security.',
    hash: 'paper-hash-001',
    vector: embeddingService.generateEmbedding('smart contract security blockchain'),
    concept_ids: [hashToId('smart contracts'), hashToId('blockchain security')],
    concept_names: ['smart contracts', 'blockchain security'],
    category_ids: [hashToId('blockchain')],
    category_names: ['blockchain'],
    origin_hash: '',
    author: 'Tanusree Sharma et al.',
    year: 2022,
    publisher: '',
    isbn: '',
    // Research paper fields (populated)
    document_type: 'paper',
    doi: '10.48550/arXiv.2204.11193',
    arxiv_id: '2204.11193v1',
    venue: 'arXiv preprint',
    keywords: ['smart contract', 'security', 'blockchain', 'developer study'],
    abstract: 'Smart contracts are self-executing programs that run on blockchains. This study examines developer security practices.',
    authors: ['Tanusree Sharma', 'Zhixuan Zhou', 'Andrew Miller', 'Yang Wang']
  };
  
  const testJournalPaper = {
    id: hashToId('/docs/papers/ieee-software-adrs.pdf'),
    source: '/docs/papers/ieee-software-adrs.pdf',
    title: 'Love Unrequited: Architecture Decision Records',
    summary: 'How ADRs brought architecture and agile together.',
    hash: 'paper-hash-002',
    vector: embeddingService.generateEmbedding('architecture decision records agile'),
    concept_ids: [hashToId('architecture decision records')],
    concept_names: ['architecture decision records'],
    category_ids: [hashToId('software architecture')],
    category_names: ['software architecture'],
    origin_hash: '',
    author: 'Michael Keeling, George Fairbanks',
    year: 2022,
    publisher: 'IEEE',
    isbn: '',
    // Research paper fields (populated)
    document_type: 'paper',
    doi: '10.1109/MS.2022.3166266',
    arxiv_id: '',
    venue: 'IEEE Software',
    keywords: ['ADR', 'architecture', 'agile', 'documentation'],
    abstract: 'Software architecture has long sought the attention of agile developers.',
    authors: ['Michael Keeling', 'George Fairbanks']
  };
  
  beforeAll(async () => {
    // Create temporary database
    dbPath = path.join(os.tmpdir(), `research-paper-test-${Date.now()}`);
    fs.mkdirSync(dbPath, { recursive: true });
    
    connection = await lancedb.connect(dbPath);
    
    // Create catalog table with test data
    catalogTable = await connection.createTable('catalog', [testBook, testPaper, testJournalPaper]);
    
    // Create minimal concepts table for QueryExpander
    const conceptsTable = await connection.createTable('concepts', [{
      id: hashToId('clean architecture'),
      name: 'clean architecture',
      summary: 'Software design approach',
      vector: embeddingService.generateEmbedding('clean architecture'),
      weight: 0.85,
      catalog_ids: [testBook.id],
      catalog_titles: ['Clean Architecture'],
      chunk_ids: [0],
      adjacent_ids: [0],
      related_ids: [0],
      synonyms: [''],
      broader_terms: [''],
      narrower_terms: ['']
    }]);
    
    // Create repository
    const queryExpander = new QueryExpander(conceptsTable, embeddingService);
    const hybridSearchService = new ConceptualHybridSearchService(embeddingService, queryExpander);
    catalogRepo = new LanceDBCatalogRepository(catalogTable, hybridSearchService);
  }, 30000);
  
  afterAll(async () => {
    // Cleanup
    if (fs.existsSync(dbPath)) {
      fs.rmSync(dbPath, { recursive: true, force: true });
    }
  });
  
  describe('document_type field', () => {
    it('should return document_type for books', async () => {
      const resultOpt = await catalogRepo.findById(testBook.id);
      
      expect(isSome(resultOpt)).toBe(true);
      if (isSome(resultOpt)) {
        expect(resultOpt.value.documentType).toBe('book');
      }
    });
    
    it('should return document_type for papers', async () => {
      const resultOpt = await catalogRepo.findById(testPaper.id);
      
      expect(isSome(resultOpt)).toBe(true);
      if (isSome(resultOpt)) {
        expect(resultOpt.value.documentType).toBe('paper');
      }
    });
  });
  
  describe('doi field', () => {
    it('should return empty doi for books', async () => {
      const resultOpt = await catalogRepo.findById(testBook.id);
      
      expect(isSome(resultOpt)).toBe(true);
      if (isSome(resultOpt)) {
        expect(resultOpt.value.doi).toBeUndefined();
      }
    });
    
    it('should return doi for journal papers', async () => {
      const resultOpt = await catalogRepo.findById(testJournalPaper.id);
      
      expect(isSome(resultOpt)).toBe(true);
      if (isSome(resultOpt)) {
        expect(resultOpt.value.doi).toBe('10.1109/MS.2022.3166266');
      }
    });
    
    it('should return doi for arxiv papers with DOI', async () => {
      const resultOpt = await catalogRepo.findById(testPaper.id);
      
      expect(isSome(resultOpt)).toBe(true);
      if (isSome(resultOpt)) {
        expect(resultOpt.value.doi).toBe('10.48550/arXiv.2204.11193');
      }
    });
  });
  
  describe('arxiv_id field', () => {
    it('should return empty arxiv_id for books', async () => {
      const resultOpt = await catalogRepo.findById(testBook.id);
      
      expect(isSome(resultOpt)).toBe(true);
      if (isSome(resultOpt)) {
        expect(resultOpt.value.arxivId).toBeUndefined();
      }
    });
    
    it('should return arxiv_id for arxiv papers', async () => {
      const resultOpt = await catalogRepo.findById(testPaper.id);
      
      expect(isSome(resultOpt)).toBe(true);
      if (isSome(resultOpt)) {
        expect(resultOpt.value.arxivId).toBe('2204.11193v1');
      }
    });
    
    it('should return empty arxiv_id for journal papers', async () => {
      const resultOpt = await catalogRepo.findById(testJournalPaper.id);
      
      expect(isSome(resultOpt)).toBe(true);
      if (isSome(resultOpt)) {
        expect(resultOpt.value.arxivId).toBeUndefined();
      }
    });
  });
  
  describe('venue field', () => {
    it('should return empty venue for books', async () => {
      const resultOpt = await catalogRepo.findById(testBook.id);
      
      expect(isSome(resultOpt)).toBe(true);
      if (isSome(resultOpt)) {
        expect(resultOpt.value.venue).toBeUndefined();
      }
    });
    
    it('should return venue for journal papers', async () => {
      const resultOpt = await catalogRepo.findById(testJournalPaper.id);
      
      expect(isSome(resultOpt)).toBe(true);
      if (isSome(resultOpt)) {
        expect(resultOpt.value.venue).toBe('IEEE Software');
      }
    });
    
    it('should return venue for arxiv papers', async () => {
      const resultOpt = await catalogRepo.findById(testPaper.id);
      
      expect(isSome(resultOpt)).toBe(true);
      if (isSome(resultOpt)) {
        expect(resultOpt.value.venue).toBe('arXiv preprint');
      }
    });
  });
  
  describe('keywords field', () => {
    it('should return undefined keywords for books without keywords', async () => {
      const resultOpt = await catalogRepo.findById(testBook.id);
      
      expect(isSome(resultOpt)).toBe(true);
      if (isSome(resultOpt)) {
        // Empty placeholder arrays should be filtered to undefined
        expect(resultOpt.value.keywords).toBeUndefined();
      }
    });
    
    it('should return keywords array for papers', async () => {
      const resultOpt = await catalogRepo.findById(testPaper.id);
      
      expect(isSome(resultOpt)).toBe(true);
      if (isSome(resultOpt)) {
        expect(resultOpt.value.keywords).toBeDefined();
        expect(Array.isArray(resultOpt.value.keywords)).toBe(true);
        expect(resultOpt.value.keywords).toContain('smart contract');
        expect(resultOpt.value.keywords).toContain('blockchain');
        expect(resultOpt.value.keywords!.length).toBe(4);
      }
    });
  });
  
  describe('abstract field', () => {
    it('should return empty abstract for books', async () => {
      const resultOpt = await catalogRepo.findById(testBook.id);
      
      expect(isSome(resultOpt)).toBe(true);
      if (isSome(resultOpt)) {
        expect(resultOpt.value.abstract).toBeUndefined();
      }
    });
    
    it('should return abstract for papers', async () => {
      const resultOpt = await catalogRepo.findById(testPaper.id);
      
      expect(isSome(resultOpt)).toBe(true);
      if (isSome(resultOpt)) {
        expect(resultOpt.value.abstract).toBeDefined();
        expect(resultOpt.value.abstract).toContain('Smart contracts');
      }
    });
    
    it('should keep abstract separate from summary', async () => {
      const resultOpt = await catalogRepo.findById(testPaper.id);
      
      expect(isSome(resultOpt)).toBe(true);
      if (isSome(resultOpt)) {
        // Abstract and summary should be different fields
        expect(resultOpt.value.abstract).not.toBe(resultOpt.value.text);
        expect(resultOpt.value.abstract).toContain('self-executing programs');
        expect(resultOpt.value.text).toContain('developer');
      }
    });
  });
  
  describe('authors field', () => {
    it('should return undefined authors for books without authors array', async () => {
      const resultOpt = await catalogRepo.findById(testBook.id);
      
      expect(isSome(resultOpt)).toBe(true);
      if (isSome(resultOpt)) {
        // Empty placeholder arrays should be filtered to undefined
        expect(resultOpt.value.authors).toBeUndefined();
      }
    });
    
    it('should return authors array for papers', async () => {
      const resultOpt = await catalogRepo.findById(testPaper.id);
      
      expect(isSome(resultOpt)).toBe(true);
      if (isSome(resultOpt)) {
        expect(resultOpt.value.authors).toBeDefined();
        expect(Array.isArray(resultOpt.value.authors)).toBe(true);
        expect(resultOpt.value.authors!.length).toBe(4);
        expect(resultOpt.value.authors).toContain('Tanusree Sharma');
        expect(resultOpt.value.authors).toContain('Andrew Miller');
      }
    });
    
    it('should handle two-author papers', async () => {
      const resultOpt = await catalogRepo.findById(testJournalPaper.id);
      
      expect(isSome(resultOpt)).toBe(true);
      if (isSome(resultOpt)) {
        expect(resultOpt.value.authors).toBeDefined();
        expect(resultOpt.value.authors!.length).toBe(2);
        expect(resultOpt.value.authors).toContain('Michael Keeling');
        expect(resultOpt.value.authors).toContain('George Fairbanks');
      }
    });
  });
  
  describe('search integration', () => {
    it('should include research paper fields in search results', async () => {
      const results = await catalogRepo.search({
        text: 'smart contract security',
        limit: 5
      });
      
      expect(results.length).toBeGreaterThan(0);
      
      // Find the arxiv paper in results
      const paper = results.find(r => r.source?.includes('2204.11193'));
      expect(paper).toBeDefined();
      
      if (paper) {
        expect(paper.documentType).toBe('paper');
        expect(paper.arxivId).toBe('2204.11193v1');
        expect(paper.keywords).toContain('smart contract');
      }
    }, 30000);  // Extended timeout for WordNet initialization
    
    it('should include all fields in search results for journal papers', async () => {
      const results = await catalogRepo.search({
        text: 'architecture decision records',
        limit: 5
      });
      
      expect(results.length).toBeGreaterThan(0);
      
      const paper = results.find(r => r.source?.includes('ieee-software'));
      expect(paper).toBeDefined();
      
      if (paper) {
        expect(paper.documentType).toBe('paper');
        expect(paper.doi).toBe('10.1109/MS.2022.3166266');
        expect(paper.venue).toBe('IEEE Software');
        expect(paper.authors?.length).toBe(2);
      }
    }, 30000);  // Extended timeout for WordNet initialization
  });
});
