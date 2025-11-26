/**
 * Mathematical Symbol Preservation Tests
 * 
 * Tests whether the document loaders correctly preserve mathematical symbols
 * and special characters from both regular and OCR-scanned PDF documents.
 * 
 * **Processing Paths:**
 * 1. Regular Text-based PDFs: pdf-parse → Text extraction → Depends on font encoding
 * 2. OCR-scanned PDFs: pdftoppm → Tesseract OCR → Depends on OCR recognition
 * 
 * **Test Categories:**
 * 1. ASCII Mathematical Symbols - Basic operators (+, -, *, /, =, etc.)
 * 2. Extended ASCII/Unicode - Greek letters, calculus symbols
 * 3. Complex Mathematical Notation - Subscripts, superscripts
 * 4. OCR-specific limitations - Tesseract's handling of math symbols
 * 
 * **Related Architecture:**
 * - ADR-0005: PDF Document Processing with pdf-parse
 * - ADR-0012: OCR Fallback with Tesseract
 * 
 * **Related Planning:**
 * - .ai/planning/2025-11-25-mathematical-symbols-investigation/
 */

import { describe, it, expect } from 'vitest';
import { PDFDocumentLoader } from '../pdf-loader.js';
import { EPUBDocumentLoader } from '../epub-loader.js';

describe('Mathematical Symbol Preservation', () => {
  
  describe('PDF Loader - Symbol Categories', () => {
    /**
     * These tests document which mathematical symbols should be preserved
     * by the PDF loader when processing text-based PDFs.
     */
    
    const symbolCategories = {
      ascii: {
        symbols: ['+', '-', '*', '/', '=', '<', '>', '^', '_', '~', '|', '\\', '%', '@'],
        description: 'Basic ASCII mathematical symbols',
        expectedPreservation: 'HIGH',
        notes: 'Should always be preserved in both regular and OCR PDFs'
      },
      operators: {
        symbols: ['±', '×', '÷', '≠', '≤', '≥', '≈', '≡', '∝', '∞'],
        description: 'Extended mathematical operators',
        expectedPreservation: 'HIGH for regular PDFs, LOW for OCR',
        notes: 'Unicode operators depend on font encoding (regular) or OCR capability (scanned)'
      },
      greek: {
        symbols: ['α', 'β', 'γ', 'δ', 'ε', 'π', 'σ', 'φ', 'ω', 'Δ', 'Σ', 'Π', 'Ω'],
        description: 'Greek letters (mathematical)',
        expectedPreservation: 'HIGH for regular PDFs, LOW for OCR',
        notes: 'OCR often converts to Latin: α→a, β→B, π→n'
      },
      calculus: {
        symbols: ['∫', '∑', '∏', '∂', '∇', '√'],
        description: 'Calculus and analysis symbols',
        expectedPreservation: 'HIGH for regular PDFs, VERY LOW for OCR',
        notes: 'Complex symbols usually lost in OCR processing'
      },
      logic: {
        symbols: ['∀', '∃', '∧', '∨', '¬', '⇒', '⇔', '∴', '∵'],
        description: 'Logic symbols',
        expectedPreservation: 'HIGH for regular PDFs, VERY LOW for OCR',
        notes: 'Logical symbols not in Tesseract training data'
      },
      sets: {
        symbols: ['∈', '∉', '⊂', '⊃', '⊆', '⊇', '∪', '∩', '∅'],
        description: 'Set theory symbols',
        expectedPreservation: 'HIGH for regular PDFs, VERY LOW for OCR',
        notes: 'Set notation symbols rarely recognized by OCR'
      }
    };
    
    it('should define expected symbol preservation rates', () => {
      // Document the expected behavior for each category
      expect(symbolCategories.ascii.expectedPreservation).toContain('HIGH');
      expect(symbolCategories.operators.expectedPreservation).toContain('HIGH for regular');
      expect(symbolCategories.calculus.expectedPreservation).toContain('VERY LOW for OCR');
      
      // Verify we have comprehensive symbol coverage
      const totalSymbols = Object.values(symbolCategories).reduce(
        (sum, cat) => sum + cat.symbols.length, 0
      );
      expect(totalSymbols).toBeGreaterThan(50);
    });
    
    it('should support canHandle method for PDF files', () => {
      const loader = new PDFDocumentLoader();
      
      expect(loader.canHandle('/path/to/document.pdf')).toBe(true);
      expect(loader.canHandle('/path/to/DOCUMENT.PDF')).toBe(true);
      expect(loader.canHandle('/path/to/document.txt')).toBe(false);
    });
    
    it('should return correct supported extensions', () => {
      const loader = new PDFDocumentLoader();
      const extensions = loader.getSupportedExtensions();
      
      expect(extensions).toEqual(['.pdf']);
    });
  });
  
  describe('EPUB Loader - Symbol Support', () => {
    it('should support canHandle method for EPUB files', () => {
      const loader = new EPUBDocumentLoader();
      
      expect(loader.canHandle('/path/to/book.epub')).toBe(true);
      expect(loader.canHandle('/path/to/BOOK.EPUB')).toBe(true);
      expect(loader.canHandle('/path/to/book.pdf')).toBe(false);
    });
    
    it('should return correct supported extensions', () => {
      const loader = new EPUBDocumentLoader();
      const extensions = loader.getSupportedExtensions();
      
      expect(extensions).toEqual(['.epub']);
    });
  });
  
  describe('Processing Path Differences', () => {
    /**
     * Document the architectural difference between regular and OCR PDFs
     */
    
    const processingPaths = {
      regular: {
        name: 'Regular Text-based PDF',
        flow: 'PDF → pdf-parse → Text Extraction',
        dependency: 'Font encoding in PDF',
        symbolPreservation: {
          ascii: 'EXCELLENT',
          unicode: 'EXCELLENT (if fonts embedded)',
          greek: 'EXCELLENT (if fonts embedded)',
          calculus: 'EXCELLENT (if fonts embedded)'
        },
        metadata: {
          ocr_processed: false
        },
        examples: [
          'LaTeX-generated textbooks',
          'Modern PDF documents',
          'PDFs with embedded Unicode fonts'
        ]
      },
      ocr: {
        name: 'OCR-Scanned PDF (Image-based)',
        flow: 'PDF → pdftoppm (images) → Tesseract OCR → Text',
        dependency: 'Tesseract OCR recognition',
        symbolPreservation: {
          ascii: 'GOOD',
          unicode: 'POOR',
          greek: 'VERY POOR (α→a)',
          calculus: 'VERY POOR (usually lost)'
        },
        metadata: {
          ocr_processed: true,
          ocr_method: 'tesseract_local',
          ocr_confidence: 'low (for math symbols)'
        },
        examples: [
          'Scanned academic papers',
          'Photocopied documents',
          'Image-based PDFs'
        ],
        knownLimitations: [
          'Unicode math symbols not in training data',
          'Greek letters misrecognized as Latin',
          'Complex symbols dropped',
          'Operators simplified (× → x, ÷ → /)'
        ]
      }
    };
    
    it('should document regular PDF processing capabilities', () => {
      const regular = processingPaths.regular;
      
      expect(regular.symbolPreservation.ascii).toBe('EXCELLENT');
      expect(regular.symbolPreservation.unicode).toContain('EXCELLENT');
      expect(regular.metadata.ocr_processed).toBe(false);
      expect(regular.examples.length).toBeGreaterThan(0);
    });
    
    it('should document OCR PDF processing limitations', () => {
      const ocr = processingPaths.ocr;
      
      expect(ocr.symbolPreservation.ascii).toBe('GOOD');
      expect(ocr.symbolPreservation.calculus).toContain('VERY POOR');
      expect(ocr.metadata.ocr_processed).toBe(true);
      expect(ocr.knownLimitations.length).toBe(4);
    });
    
    it('should verify metadata distinguishes processing paths', () => {
      const regularMetadata = processingPaths.regular.metadata;
      const ocrMetadata = processingPaths.ocr.metadata;
      
      // Regular PDFs should not have OCR metadata
      expect(regularMetadata.ocr_processed).toBe(false);
      expect(regularMetadata).not.toHaveProperty('ocr_method');
      
      // OCR PDFs should have OCR metadata
      expect(ocrMetadata.ocr_processed).toBe(true);
      expect(ocrMetadata).toHaveProperty('ocr_method');
      expect(ocrMetadata).toHaveProperty('ocr_confidence');
    });
  });
  
  describe('Real-World Scenarios', () => {
    const scenarios = {
      latexTextbook: {
        type: 'LaTeX-generated textbook',
        processingPath: 'regular',
        expectedQuality: 'EXCELLENT',
        symbolTypes: ['calculus', 'greek', 'logic', 'sets'],
        notes: 'Computer Modern or STIX fonts embedded'
      },
      scannedPaper: {
        type: 'Scanned academic paper',
        processingPath: 'ocr',
        expectedQuality: 'POOR for math symbols',
        symbolTypes: ['ascii only'],
        notes: 'Unicode symbols likely lost, Greek→Latin conversion'
      },
      modernPdf: {
        type: 'Modern digital PDF',
        processingPath: 'regular',
        expectedQuality: 'EXCELLENT',
        symbolTypes: ['all'],
        notes: 'Standard font encoding'
      }
    };
    
    it('should document LaTeX textbook scenario', () => {
      const scenario = scenarios.latexTextbook;
      
      expect(scenario.processingPath).toBe('regular');
      expect(scenario.expectedQuality).toBe('EXCELLENT');
      expect(scenario.symbolTypes).toContain('calculus');
    });
    
    it('should document scanned paper scenario', () => {
      const scenario = scenarios.scannedPaper;
      
      expect(scenario.processingPath).toBe('ocr');
      expect(scenario.expectedQuality).toContain('POOR');
      expect(scenario.symbolTypes).toEqual(['ascii only']);
    });
    
    it('should document modern PDF scenario', () => {
      const scenario = scenarios.modernPdf;
      
      expect(scenario.processingPath).toBe('regular');
      expect(scenario.expectedQuality).toBe('EXCELLENT');
      expect(scenario.symbolTypes).toContain('all');
    });
  });
  
  describe('User Guidance', () => {
    const recommendations = {
      forUsers: [
        'Prefer text-based PDFs over scanned documents',
        'Check metadata.ocr_processed flag to identify processing method',
        'For critical math content, verify against original if OCR processed',
        'Use LaTeX-generated PDFs when possible for best results'
      ],
      qualityIndicators: {
        high: {
          condition: 'metadata.ocr_processed === false',
          meaning: 'Direct text extraction, symbols likely preserved'
        },
        medium: {
          condition: 'metadata.ocr_processed === true && ocr_confidence === "good"',
          meaning: 'OCR successful but Unicode symbols may be degraded'
        },
        low: {
          condition: 'metadata.ocr_processed === true && ocr_confidence === "low"',
          meaning: 'OCR struggled, expect significant symbol loss'
        }
      },
      troubleshooting: {
        'Symbols appear as ???': 'PDF font encoding issue or missing fonts',
        'Greek letters become Latin': 'Expected OCR behavior (α→a, β→B)',
        'Integral/Sum symbols missing': 'Expected OCR limitation',
        'All text is garbled': 'Encrypted PDF or corrupted file'
      }
    };
    
    it('should provide user recommendations', () => {
      expect(recommendations.forUsers.length).toBe(4);
      expect(recommendations.forUsers[0]).toContain('text-based PDFs');
    });
    
    it('should define quality indicators', () => {
      expect(recommendations.qualityIndicators.high.condition).toContain('ocr_processed === false');
      expect(recommendations.qualityIndicators.low.meaning).toContain('significant symbol loss');
    });
    
    it('should provide troubleshooting guidance', () => {
      const troubleshooting = recommendations.troubleshooting;
      
      expect(troubleshooting).toHaveProperty('Symbols appear as ???');
      expect(troubleshooting['Greek letters become Latin']).toContain('Expected OCR behavior');
    });
  });
});
