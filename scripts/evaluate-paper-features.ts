/**
 * Evaluate the efficacy of paper detection and metadata extraction features
 * on the expanded sample document set.
 */

import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { PaperDetector } from '../src/infrastructure/document-loaders/paper-detector';
import { PaperMetadataExtractor } from '../src/infrastructure/document-loaders/paper-metadata-extractor';
import { ReferencesDetector } from '../src/infrastructure/document-loaders/references-detector';
import { MathContentHandler } from '../src/infrastructure/document-loaders/math-content-handler';
import * as fs from 'fs';
import * as path from 'path';

interface DocumentAnalysis {
  filename: string;
  pageCount: number;
  documentType: string;
  confidence: number;
  signals: string[];
  metadata: {
    title: string | null;
    authors: string[] | null;
    abstract: string | null;
    doi: string | null;
    arxivId: string | null;
    venue: string | null;
    keywords: string[] | null;
  };
  references: {
    detected: boolean;
    startPage: number | null;
    endPage: number | null;
    refPages: number;
  };
  math: {
    hasMath: boolean;
    hasExtractionIssues: boolean;
    mathChunks: number;
  };
}

async function analyzeDocument(filePath: string): Promise<DocumentAnalysis> {
  const filename = path.basename(filePath);
  const loader = new PDFLoader(filePath);
  const docs = await loader.load();
  
  const detector = new PaperDetector();
  const extractor = new PaperMetadataExtractor();
  const refsDetector = new ReferencesDetector();
  const mathHandler = new MathContentHandler();
  
  // Document type detection
  const detection = detector.detect(docs, filename);
  
  // Metadata extraction
  const metadata = extractor.extract(docs);
  
  // References detection
  const refsResult = refsDetector.detectReferencesStart(docs);
  
  // Math content analysis
  let mathChunks = 0;
  let hasExtractionIssues = false;
  
  for (const doc of docs) {
    const mathAnalysis = mathHandler.analyze(doc.pageContent);
    if (mathAnalysis.hasMath) mathChunks++;
    if (mathAnalysis.hasExtractionIssues) hasExtractionIssues = true;
  }
  
  return {
    filename: filename.substring(0, 60) + (filename.length > 60 ? '...' : ''),
    pageCount: docs.length,
    documentType: detection.documentType,
    confidence: detection.confidence,
    signals: detection.signals,
    metadata: {
      title: metadata.title || null,
      authors: metadata.authors || null,
      abstract: metadata.abstract ? metadata.abstract.substring(0, 80) + '...' : null,
      doi: metadata.doi || null,
      arxivId: metadata.arxivId || null,
      venue: metadata.venue || null,
      keywords: metadata.keywords || null,
    },
    references: {
      detected: refsResult.found,
      startPage: refsResult.startsAtPage ?? null,
      endPage: refsResult.found ? docs.length : null,
      refPages: refsResult.found && refsResult.startsAtPage ? docs.length - refsResult.startsAtPage + 1 : 0,
    },
    math: {
      hasMath: mathChunks > 0,
      hasExtractionIssues,
      mathChunks,
    },
  };
}

async function main() {
  const papersDir = './sample-docs/Papers';
  const files = fs.readdirSync(papersDir)
    .filter(f => f.endsWith('.pdf'))
    .map(f => path.join(papersDir, f));
  
  console.log('='.repeat(80));
  console.log('PAPER FEATURES EVALUATION REPORT');
  console.log('='.repeat(80));
  console.log(`\nAnalyzing ${files.length} documents...\n`);
  
  const results: DocumentAnalysis[] = [];
  
  for (const file of files) {
    try {
      process.stdout.write(`  Processing: ${path.basename(file).substring(0, 50)}...`);
      const analysis = await analyzeDocument(file);
      results.push(analysis);
      console.log(' ✓');
    } catch (e: any) {
      console.log(` ✗ (${e.message})`);
    }
  }
  
  // Summary statistics
  console.log('\n' + '='.repeat(80));
  console.log('DOCUMENT TYPE CLASSIFICATION');
  console.log('='.repeat(80));
  
  const typeCounts: Record<string, number> = {};
  for (const r of results) {
    typeCounts[r.documentType] = (typeCounts[r.documentType] || 0) + 1;
  }
  
  console.log('\nDistribution:');
  for (const [type, count] of Object.entries(typeCounts).sort((a, b) => b[1] - a[1])) {
    const pct = ((count / results.length) * 100).toFixed(1);
    console.log(`  ${type.padEnd(10)}: ${count} (${pct}%)`);
  }
  
  console.log('\nPer-document breakdown:');
  console.log('-'.repeat(80));
  for (const r of results) {
    const conf = (r.confidence * 100).toFixed(0);
    console.log(`  ${r.documentType.padEnd(8)} (${conf}%) ${r.filename}`);
    if (r.signals.length > 0) {
      console.log(`           Signals: ${r.signals.slice(0, 5).join(', ')}${r.signals.length > 5 ? '...' : ''}`);
    }
  }
  
  // Metadata extraction
  console.log('\n' + '='.repeat(80));
  console.log('METADATA EXTRACTION');
  console.log('='.repeat(80));
  
  const fields = ['title', 'authors', 'abstract', 'doi', 'arxivId', 'venue', 'keywords'] as const;
  const fieldStats: Record<string, number> = {};
  
  for (const field of fields) {
    let count = 0;
    for (const r of results) {
      const val = r.metadata[field];
      if (val && (Array.isArray(val) ? val.length > 0 : true)) count++;
    }
    fieldStats[field] = count;
  }
  
  console.log('\nExtraction rates:');
  for (const field of fields) {
    const count = fieldStats[field];
    const pct = ((count / results.length) * 100).toFixed(0);
    const bar = '█'.repeat(Math.round(count / results.length * 20));
    console.log(`  ${field.padEnd(10)}: ${bar.padEnd(20)} ${count}/${results.length} (${pct}%)`);
  }
  
  // Missing metadata analysis
  console.log('\nDocuments with missing metadata:');
  for (const r of results) {
    const missing = fields.filter(f => {
      const val = r.metadata[f];
      return !val || (Array.isArray(val) && val.length === 0);
    });
    if (missing.length > 0) {
      console.log(`  ${r.filename.substring(0, 45).padEnd(45)} Missing: ${missing.join(', ')}`);
    }
  }
  
  // References detection
  console.log('\n' + '='.repeat(80));
  console.log('REFERENCES DETECTION');
  console.log('='.repeat(80));
  
  const withRefs = results.filter(r => r.references.detected);
  console.log(`\nDetected references in ${withRefs.length}/${results.length} documents (${((withRefs.length / results.length) * 100).toFixed(0)}%)`);
  
  if (withRefs.length > 0) {
    console.log('\nReference sections:');
    for (const r of withRefs) {
      console.log(`  ${r.filename.substring(0, 45).padEnd(45)} Pages ${r.references.startPage}-${r.references.endPage} (${r.references.refPages} pages)`);
    }
  }
  
  // Math content
  console.log('\n' + '='.repeat(80));
  console.log('MATHEMATICAL CONTENT');
  console.log('='.repeat(80));
  
  const withMath = results.filter(r => r.math.hasMath);
  const withIssues = results.filter(r => r.math.hasExtractionIssues);
  
  console.log(`\nDocuments with math: ${withMath.length}/${results.length} (${((withMath.length / results.length) * 100).toFixed(0)}%)`);
  console.log(`Documents with extraction issues: ${withIssues.length}/${results.length} (${((withIssues.length / results.length) * 100).toFixed(0)}%)`);
  
  if (withMath.length > 0) {
    console.log('\nMath content breakdown:');
    for (const r of withMath) {
      const issues = r.math.hasExtractionIssues ? ' ⚠️ ISSUES' : '';
      console.log(`  ${r.filename.substring(0, 45).padEnd(45)} ${r.math.mathChunks} pages with math${issues}`);
    }
  }
  
  // Overall summary
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  
  const paperCount = typeCounts['paper'] || 0;
  const articleCount = typeCounts['article'] || 0;
  const bookCount = typeCounts['book'] || 0;
  const unknownCount = typeCounts['unknown'] || 0;
  
  console.log(`
Total documents analyzed: ${results.length}

Document Types:
  ✓ Papers:   ${paperCount} (research papers with DOI/ArXiv/academic structure)
  ✓ Articles: ${articleCount} (professional magazine articles)
  ✓ Books:    ${bookCount} (long-form with chapters)
  ? Unknown:  ${unknownCount} (borderline cases)

Metadata Extraction:
  ✓ Title:    ${fieldStats['title']}/${results.length} (${((fieldStats['title'] / results.length) * 100).toFixed(0)}%)
  ✓ Authors:  ${fieldStats['authors']}/${results.length} (${((fieldStats['authors'] / results.length) * 100).toFixed(0)}%)
  ✓ Abstract: ${fieldStats['abstract']}/${results.length} (${((fieldStats['abstract'] / results.length) * 100).toFixed(0)}%)
  ✓ DOI:      ${fieldStats['doi']}/${results.length} (${((fieldStats['doi'] / results.length) * 100).toFixed(0)}%)
  ✓ Venue:    ${fieldStats['venue']}/${results.length} (${((fieldStats['venue'] / results.length) * 100).toFixed(0)}%)

Content Analysis:
  ✓ References detected: ${withRefs.length}/${results.length}
  ✓ Math content:        ${withMath.length}/${results.length}
  ⚠ Extraction issues:   ${withIssues.length}/${results.length}
`);
}

main().catch(console.error);

