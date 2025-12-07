import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { MathContentHandler } from '../src/infrastructure/document-loaders/math-content-handler.js';

async function analyzeMathPaper() {
  const loader = new PDFLoader('./sample-docs/Papers/p1739-arun.pdf');
  const docs = await loader.load();
  const handler = new MathContentHandler();
  
  console.log('\n=== p1739-arun.pdf Math Content Analysis ===\n');
  console.log(`Total pages: ${docs.length}`);
  
  let totalMathScore = 0;
  let pagesWithMath = 0;
  let pagesWithExtractionIssues = 0;
  const mathExamples: Array<{page: number, score: number, types: string[], hasIssues: boolean, sample: string}> = [];
  
  for (let i = 0; i < docs.length; i++) {
    const text = docs[i].pageContent;
    const result = handler.analyze(text);
    totalMathScore += result.mathScore;
    
    if (result.hasMath) {
      pagesWithMath++;
      if (result.hasExtractionIssues) {
        pagesWithExtractionIssues++;
      }
      if (mathExamples.length < 3) {
        mathExamples.push({
          page: i + 1,
          score: result.mathScore,
          types: result.mathTypes,
          hasIssues: result.hasExtractionIssues,
          sample: text.substring(0, 400)
        });
      }
    }
  }
  
  console.log(`Pages with math: ${pagesWithMath}/${docs.length}`);
  console.log(`Pages with extraction issues: ${pagesWithExtractionIssues}/${docs.length}`);
  console.log(`Average math score: ${(totalMathScore / docs.length).toFixed(3)}`);
  
  console.log('\n--- Sample pages with math content ---\n');
  for (const ex of mathExamples) {
    const issueFlag = ex.hasIssues ? ' ⚠️ EXTRACTION ISSUES' : '';
    console.log(`Page ${ex.page} (score: ${ex.score}, types: ${ex.types.join(', ')})${issueFlag}:`);
    console.log(ex.sample + '...');
    console.log('---');
  }
  
  // Demonstrate recovery
  console.log('\n\n=== RECOVERY DEMONSTRATION ===\n');
  const page4 = docs[3].pageContent;
  const sample = page4.split('\n').slice(0, 12).join('\n');
  
  console.log('BEFORE (garbled):');
  console.log(sample);
  
  console.log('\n\nAFTER RECOVERY (proper Unicode math):');
  console.log(handler.recoverGarbledMath(sample));
  
  console.log('\n\nAFTER FULL CLEANING (ASCII normalized for search):');
  console.log(handler.clean(sample).cleanedText);
}

analyzeMathPaper().catch(console.error);
