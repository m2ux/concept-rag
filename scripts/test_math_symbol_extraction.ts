/**
 * Test Mathematical Symbol Extraction
 * 
 * Loads test PDFs and reports which symbols were preserved.
 */

import { PDFDocumentLoader } from '../src/infrastructure/document-loaders/pdf-loader.js';
import * as path from 'path';

const TEST_SYMBOLS = {
  ascii: ['+', '-', '*', '/', '=', '<', '>'],
  operators: ['±', '×', '÷', '≠', '≤', '≥', '≈'],
  greek: ['α', 'β', 'γ', 'δ', 'π', 'σ', 'Σ', 'Π'],
  calculus: ['∫', '∑', '∏', '∂', '∇', '√', '∞']
};

async function testPdf(pdfPath: string, expectedType: string) {
  console.log(`\nTesting: ${path.basename(pdfPath)}`);
  console.log(`Expected type: ${expectedType}`);
  console.log('-'.repeat(60));
  
  try {
    const loader = new PDFDocumentLoader();
    const documents = await loader.load(pdfPath);
    
    console.log(`Pages loaded: ${documents.length}`);
    
    const fullText = documents.map(doc => doc.pageContent).join(' ');
    const metadata = documents[0]?.metadata || {};
    
    console.log(`OCR processed: ${metadata.ocr_processed || false}`);
    if (metadata.ocr_processed) {
      console.log(`OCR method: ${metadata.ocr_method}`);
      console.log(`OCR confidence: ${metadata.ocr_confidence}`);
    }
    
    console.log('\nSymbol preservation:');
    for (const [category, symbols] of Object.entries(TEST_SYMBOLS)) {
      const preserved = symbols.filter(s => fullText.includes(s));
      const rate = (preserved.length / symbols.length * 100).toFixed(0);
      console.log(`  ${category}: ${preserved.length}/${symbols.length} (${rate}%)`);
      console.log(`    Preserved: ${preserved.join(' ')}`);
    }
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
  }
}

async function main() {
  const testDir = path.join(process.cwd(), 'test-data', 'mathematical-symbols');
  
  // Test regular text-based PDF
  const regularPdf = path.join(testDir, 'math-symbols-regular.pdf');
  await testPdf(regularPdf, 'Regular text-based PDF');
  
  // Test OCR-scanned PDF (if exists)
  const ocrPdf = path.join(testDir, 'math-symbols-ocr-scanned.pdf');
  try {
    await testPdf(ocrPdf, 'OCR-scanned PDF');
  } catch {
    console.log('\nOCR test PDF not found. Create it using OCR_INSTRUCTIONS.md');
  }
}

main().catch(console.error);
