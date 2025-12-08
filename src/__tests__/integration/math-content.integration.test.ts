/**
 * Integration Tests: Mathematical Content Handling
 * 
 * Tests math detection, recovery, and cleaning on real sample papers.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { MathContentHandler } from '../../infrastructure/document-loaders/math-content-handler.js';
import * as fs from 'fs';
import * as path from 'path';

describe('Math Content Handling - Integration', () => {
  const handler = new MathContentHandler();
  const papersDir = './sample-docs/Papers';
  
  // Check if sample papers exist
  const hasSamplePapers = fs.existsSync(papersDir) && 
    fs.readdirSync(papersDir).some(f => f.endsWith('.pdf'));
  
  describe.skipIf(!hasSamplePapers)('Sample Paper Analysis', () => {
    describe('p1739-arun.pdf (contains garbled math)', () => {
      let pages: Array<{ pageContent: string }>;
      
      beforeAll(async () => {
        const pdfPath = path.join(papersDir, 'p1739-arun.pdf');
        if (!fs.existsSync(pdfPath)) {
          return;
        }
        const loader = new PDFLoader(pdfPath);
        pages = await loader.load();
      });
      
      it('should detect pages with math content', () => {
        if (!pages) return;
        
        let pagesWithMath = 0;
        for (const page of pages) {
          const result = handler.analyze(page.pageContent);
          if (result.hasMath) {
            pagesWithMath++;
          }
        }
        
        // This paper has significant math content
        expect(pagesWithMath).toBeGreaterThan(5);
      });
      
      it('should detect garbled math extraction issues', () => {
        if (!pages) return;
        
        let pagesWithIssues = 0;
        for (const page of pages) {
          const result = handler.analyze(page.pageContent);
          if (result.hasExtractionIssues) {
            pagesWithIssues++;
          }
        }
        
        // This paper has garbled math characters
        expect(pagesWithIssues).toBeGreaterThan(0);
      });
      
      it('should recover garbled math characters', () => {
        if (!pages) return;
        
        // Find a page with garbled math
        const pageWithMath = pages.find(p => {
          const result = handler.analyze(p.pageContent);
          return result.mathTypes.includes('garbled_math');
        });
        
        expect(pageWithMath).toBeDefined();
        
        if (pageWithMath) {
          const original = pageWithMath.pageContent;
          const recovered = handler.recoverGarbledMath(original);
          
          // Recovered text should be different (characters fixed)
          expect(recovered).not.toBe(original);
          
          // Should contain Mathematical Alphanumeric characters
          const mathAlphaPattern = /[\u{1D400}-\u{1D7FF}]/u;
          expect(mathAlphaPattern.test(recovered)).toBe(true);
        }
      });
      
      it('should clean math to ASCII for searchability', () => {
        if (!pages) return;
        
        const pageWithMath = pages.find(p => {
          const result = handler.analyze(p.pageContent);
          return result.mathTypes.includes('garbled_math');
        });
        
        if (pageWithMath) {
          const { cleanedText, cleanedCount } = handler.clean(pageWithMath.pageContent);
          
          // Should have cleaned issues
          expect(cleanedCount).toBeGreaterThan(0);
          
          // Cleaned text should not have garbled chars
          const garbledPattern = /[\uD400-\uD7FF]/;
          expect(garbledPattern.test(cleanedText)).toBe(false);
          
          // Should not have Math Alphanumeric (normalized to ASCII)
          const mathAlphaPattern = /[\u{1D400}-\u{1D7FF}]/u;
          expect(mathAlphaPattern.test(cleanedText)).toBe(false);
        }
      });
    });
    
    describe('All sample papers', () => {
      it('should analyze all papers without errors', async () => {
        const files = fs.readdirSync(papersDir).filter(f => f.endsWith('.pdf'));
        
        const results: Array<{
          file: string;
          pages: number;
          pagesWithMath: number;
          hasExtractionIssues: boolean;
        }> = [];
        
        for (const file of files) {
          try {
            const loader = new PDFLoader(path.join(papersDir, file));
            const docs = await loader.load();
            
            let pagesWithMath = 0;
            let hasIssues = false;
            
            for (const doc of docs) {
              const result = handler.analyze(doc.pageContent);
              if (result.hasMath) pagesWithMath++;
              if (result.hasExtractionIssues) hasIssues = true;
            }
            
            results.push({
              file: file.substring(0, 40),
              pages: docs.length,
              pagesWithMath,
              hasExtractionIssues: hasIssues
            });
          } catch (error) {
            // Skip files that can't be loaded
            console.warn(`Could not load ${file}: ${error}`);
          }
        }
        
        // Should have analyzed multiple papers
        expect(results.length).toBeGreaterThan(0);
        
        // Log results for visibility
        console.log('\n=== Math Content Analysis Summary ===');
        for (const r of results) {
          const issueFlag = r.hasExtractionIssues ? ' ⚠️' : '';
          console.log(`${r.file}: ${r.pagesWithMath}/${r.pages} pages with math${issueFlag}`);
        }
      });
    });
  });
  
  describe('Recovery correctness', () => {
    it('should correctly map garbled chars to Math Italic', () => {
      // Known mappings from p1739-arun.pdf
      const testCases = [
        { garbled: '푅', expectedCode: 0x1D445, name: 'R' },
        { garbled: '푁', expectedCode: 0x1D441, name: 'N' },
        { garbled: '푓', expectedCode: 0x1D453, name: 'f' },
        { garbled: '퐵', expectedCode: 0x1D435, name: 'B' },
      ];
      
      for (const { garbled, expectedCode, name } of testCases) {
        const recovered = handler.recoverGarbledMath(garbled);
        const actualCode = recovered.codePointAt(0);
        
        expect(actualCode).toBe(expectedCode);
      }
    });
    
    it('should preserve regular text during recovery', () => {
      const text = 'Normal text with numbers 123 and symbols @#$';
      const recovered = handler.recoverGarbledMath(text);
      
      expect(recovered).toBe(text);
    });
    
    it('should handle mixed garbled and regular content', () => {
      const mixed = 'BFT requires 3푓+1 replicas';
      const recovered = handler.recoverGarbledMath(mixed);
      
      // Regular parts preserved
      expect(recovered).toContain('BFT requires 3');
      expect(recovered).toContain('+1 replicas');
      
      // Garbled part recovered
      expect(recovered).toContain('𝑓'); // Math Italic f
    });
  });
});
