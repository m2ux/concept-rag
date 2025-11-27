#!/usr/bin/env tsx
/**
 * Seed Pages Table with Page-Level Concept Extraction
 * 
 * This script:
 * 1. Creates the `pages` table if it doesn't exist
 * 2. Loads PDFs from source paths in catalog
 * 3. Extracts concepts with page numbers using LLM (gpt-5-mini)
 * 4. Creates page records with concept_ids, text_preview, and embeddings
 * 5. Supports resume from checkpoint if interrupted
 * 
 * Usage:
 *   npx tsx scripts/seed_pages_table.ts [--db <path>] [--batch-size <n>] [--resume]
 * 
 * Options:
 *   --db <path>       Database path (default: ~/.concept_rag or test_db)
 *   --batch-size <n>  Documents per checkpoint (default: 5)
 *   --resume          Resume from last checkpoint
 *   --test            Use test_db with sample-docs
 *   --dry-run         Show what would be processed without making changes
 */

import * as lancedb from '@lancedb/lancedb';
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { EPubLoader } from "@langchain/community/document_loaders/fs/epub";
import { Document } from "@langchain/core/documents";
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  MODEL: 'openai/gpt-5-mini',
  DEFAULT_DB_PATH: process.env.CONCEPT_RAG_DB || `${process.env.HOME}/.concept_rag`,
  TEST_DB_PATH: path.join(__dirname, '../test_db'),
  SAMPLE_DOCS_PATH: path.join(__dirname, '../sample-docs'),
  CHECKPOINT_FILE: 'data/pages_seed_checkpoint.json',
  DEFAULT_BATCH_SIZE: 5,
  MAX_RETRIES: 2,
  RETRY_DELAY_MS: 5000,
  RATE_LIMIT_MS: 3000,
  EMBEDDING_DIM: 384,
  TEXT_PREVIEW_LENGTH: 500,
};

// ============================================================================
// Types
// ============================================================================

interface PageRecord {
  id: number;
  catalog_id: number;
  page_number: number;
  concept_ids: number[];
  text_preview: string;
  vector: number[];
}

interface ConceptWithPages {
  concept: string;
  type: 'thematic' | 'methodological' | 'technical';
  pages: number[];
  confidence: 'high' | 'medium' | 'low';
}

interface ExtractionResult {
  concepts: ConceptWithPages[];
  categories: string[];
}

interface Checkpoint {
  processedCatalogIds: number[];
  lastProcessedAt: string;
  totalProcessed: number;
  totalFailed: number;
  failedSources: string[];
}

interface CatalogEntry {
  id: number;
  source: string;
  hash: string;
}

// ============================================================================
// Utilities
// ============================================================================

function hashToId(str: string): number {
  const hash = createHash('sha256').update(str.toLowerCase().trim()).digest('hex');
  return parseInt(hash.slice(0, 8), 16);
}

function generateSimpleEmbedding(text: string): number[] {
  // Simple deterministic embedding for local testing
  // In production, use a proper embedding service
  const hash = createHash('sha256').update(text).digest();
  const embedding = new Array(CONFIG.EMBEDDING_DIM).fill(0);
  
  for (let i = 0; i < CONFIG.EMBEDDING_DIM; i++) {
    embedding[i] = (hash[i % hash.length] / 255) * 2 - 1;
  }
  
  // Normalize
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => val / magnitude);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// Checkpoint Management
// ============================================================================

function loadCheckpoint(checkpointPath: string): Checkpoint {
  if (fs.existsSync(checkpointPath)) {
    const data = fs.readFileSync(checkpointPath, 'utf-8');
    return JSON.parse(data);
  }
  return {
    processedCatalogIds: [],
    lastProcessedAt: '',
    totalProcessed: 0,
    totalFailed: 0,
    failedSources: []
  };
}

function saveCheckpoint(checkpointPath: string, checkpoint: Checkpoint): void {
  const dir = path.dirname(checkpointPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(checkpointPath, JSON.stringify(checkpoint, null, 2));
}

// ============================================================================
// Document Loading (PDF & EPUB)
// ============================================================================

async function loadDocumentPages(docPath: string): Promise<Document[]> {
  if (!fs.existsSync(docPath)) {
    throw new Error(`Document not found: ${docPath}`);
  }
  
  const ext = path.extname(docPath).toLowerCase();
  
  if (ext === '.pdf') {
    const loader = new PDFLoader(docPath, { splitPages: true });
    return await loader.load();
  } else if (ext === '.epub') {
    const loader = new EPubLoader(docPath, { splitChapters: true });
    const docs = await loader.load();
    // Add page numbers based on chapter index for EPUBs
    return docs.map((doc, idx) => ({
      ...doc,
      metadata: {
        ...doc.metadata,
        loc: { pageNumber: idx + 1 }
      }
    }));
  } else {
    throw new Error(`Unsupported file format: ${ext}`);
  }
}

// ============================================================================
// LLM Extraction
// ============================================================================

let lastRequestTime = 0;

async function rateLimitDelay(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < CONFIG.RATE_LIMIT_MS) {
    await sleep(CONFIG.RATE_LIMIT_MS - timeSinceLastRequest);
  }
  lastRequestTime = Date.now();
}

function buildPageMarkedContent(pages: Document[]): string {
  const sections: string[] = [];
  
  for (const page of pages) {
    const pageNum = page.metadata.loc?.pageNumber || page.metadata.page || '?';
    const content = page.pageContent.trim();
    
    if (content.length > 50) {
      sections.push(`[PAGE ${pageNum}]\n${content}`);
    }
  }
  
  return sections.join('\n\n---\n\n');
}

function buildExtractionPrompt(markedContent: string, _validConcepts?: string[]): string {
  return `You are analyzing a document divided into pages marked with [PAGE N].

TASK: Extract significant concepts and indicate which page(s) each appears on.

DOCUMENT:
${markedContent}

INSTRUCTIONS:
1. Extract concepts at THREE levels:
   - THEMATIC: Core themes and principles
   - METHODOLOGICAL: Frameworks, approaches, theories
   - TECHNICAL: Specific terms, techniques, methods

2. For each concept, list PAGE NUMBERS where it appears or is discussed
   - Include pages where concept is implied, not just literally mentioned
   - A concept may span multiple pages

4. Rate confidence: "high" (explicit mention), "medium" (clear implication), "low" (inferred)

Return ONLY valid JSON:
{
  "concepts": [
    {"concept": "concept name", "type": "thematic|methodological|technical", "pages": [1,2,5], "confidence": "high"}
  ],
  "categories": ["domain1", "domain2"]
}

Extract 50-150 concepts. Be thorough with page numbers.`;
}

async function callLLM(prompt: string): Promise<string> {
  if (!CONFIG.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY not set');
  }
  
  await rateLimitDelay();
  
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CONFIG.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://github.com/concept-rag',
      'X-Title': 'Concept-RAG Pages Seeding'
    },
    body: JSON.stringify({
      model: CONFIG.MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 16000
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LLM API error: ${response.status} - ${error}`);
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}

function parseExtractionResult(response: string): ExtractionResult {
  let jsonText = response.trim();
  
  // Remove markdown code blocks if present
  if (jsonText.includes('```')) {
    const match = jsonText.match(/```json?\s*([\s\S]*?)\s*```/);
    if (match) jsonText = match[1].trim();
  }
  
  // Try to find JSON object in response if not starting with {
  if (!jsonText.startsWith('{')) {
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }
  }
  
  try {
    const parsed = JSON.parse(jsonText);
    return {
      concepts: parsed.concepts || [],
      categories: parsed.categories || []
    };
  } catch (e) {
    // Log first 200 chars of response for debugging
    console.error(`     JSON parse error. Response preview: ${response.slice(0, 200)}...`);
    throw e;
  }
}

// ============================================================================
// Page Record Creation
// ============================================================================

async function extractConceptsWithRetry(
  pages: Document[],
  maxRetries: number
): Promise<ExtractionResult> {
  const markedContent = buildPageMarkedContent(pages);
  const prompt = buildExtractionPrompt(markedContent);
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`     Retry ${attempt}/${maxRetries}...`);
        await sleep(CONFIG.RETRY_DELAY_MS * attempt);
      }
      
      const response = await callLLM(prompt);
      return parseExtractionResult(response);
    } catch (error) {
      lastError = error as Error;
      console.warn(`     Attempt ${attempt + 1} failed: ${lastError.message}`);
    }
  }
  
  throw lastError;
}

interface NewConceptRecord {
  id: number;
  concept: string;
  catalog_ids: number[];
  chunk_ids: number[];
  adjacent_ids: number[];
  related_ids: number[];
  synonyms: string[];
  broader_terms: string[];
  narrower_terms: string[];
  summary: string;
  weight: number;
  vector: number[];
}

interface CreatePageRecordsResult {
  pageRecords: PageRecord[];
  newConcepts: NewConceptRecord[];
}

function createPageRecords(
  catalogId: number,
  pages: Document[],
  extractionResult: ExtractionResult,
  conceptNameToId: Map<string, number>
): CreatePageRecordsResult {
  const pageRecords: PageRecord[] = [];
  const newConcepts: NewConceptRecord[] = [];
  const newConceptNames = new Set<string>(); // Track to avoid duplicates
  
  // Build page -> concepts map
  const pageConceptsMap = new Map<number, Set<number>>();
  let existingCount = 0;
  let newCount = 0;
  
  for (const concept of extractionResult.concepts) {
    const conceptKey = concept.concept.toLowerCase().trim();
    if (!conceptKey) continue;
    
    // Check if concept exists in table
    let conceptId = conceptNameToId.get(conceptKey);
    
    if (conceptId === undefined) {
      // NEW CONCEPT - generate ID and queue for insertion to concepts table
      conceptId = hashToId(conceptKey);
      
      // Only add once per document
      if (!newConceptNames.has(conceptKey)) {
        newConceptNames.add(conceptKey);
        newConcepts.push({
          id: conceptId,
          concept: conceptKey,
          catalog_ids: [catalogId],
          chunk_ids: [0],
          adjacent_ids: [0],
          related_ids: [0],
          synonyms: [''],
          broader_terms: [''],
          narrower_terms: [''],
          summary: '',
          weight: 1.0,
          vector: generateSimpleEmbedding(conceptKey)
        });
        // Add to map so subsequent documents can reference it
        conceptNameToId.set(conceptKey, conceptId);
      }
      newCount++;
    } else {
      existingCount++;
    }
    
    for (const pageNum of concept.pages) {
      if (!pageConceptsMap.has(pageNum)) {
        pageConceptsMap.set(pageNum, new Set());
      }
      pageConceptsMap.get(pageNum)!.add(conceptId);
    }
  }
  
  console.log(`   📊 Concepts: ${existingCount} existing, ${newCount} NEW → adding ${newConcepts.length} to concepts table`);
  
  // Create page records
  for (const page of pages) {
    const pageNum = page.metadata.loc?.pageNumber || page.metadata.page || 0;
    const pageText = page.pageContent.trim();
    
    if (pageText.length < 50) continue; // Skip nearly empty pages
    
    const conceptIds = Array.from(pageConceptsMap.get(pageNum) || []);
    const textPreview = pageText.substring(0, CONFIG.TEXT_PREVIEW_LENGTH);
    const pageIdString = `${catalogId}-${pageNum}`;
    
    pageRecords.push({
      id: hashToId(pageIdString),
      catalog_id: catalogId,
      page_number: pageNum,
      concept_ids: conceptIds.length > 0 ? conceptIds : [0], // Placeholder for empty
      text_preview: textPreview,
      vector: generateSimpleEmbedding(pageText)
    });
  }
  
  return { pageRecords, newConcepts };
}

// ============================================================================
// Database Operations
// ============================================================================

async function ensurePagesTable(db: lancedb.Connection): Promise<lancedb.Table> {
  const tables = await db.tableNames();
  
  if (tables.includes('pages')) {
    console.log('📄 Pages table exists, opening...');
    return await db.openTable('pages');
  }
  
  console.log('📄 Creating pages table...');
  
  // Create with initial placeholder record (LanceDB needs data for schema inference)
  const initialRecord: PageRecord = {
    id: 0,
    catalog_id: 0,
    page_number: 0,
    concept_ids: [0],
    text_preview: 'placeholder',
    vector: new Array(CONFIG.EMBEDDING_DIM).fill(0)
  };
  
  const table = await db.createTable('pages', [initialRecord], { mode: 'create' });
  
  // Delete placeholder
  await table.delete('id = 0');
  
  return table;
}

async function loadConceptNameToIdMap(db: lancedb.Connection): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  
  const tables = await db.tableNames();
  if (!tables.includes('concepts')) {
    return map;
  }
  
  const conceptsTable = await db.openTable('concepts');
  const concepts = await conceptsTable.query().limit(100000).toArray();
  
  for (const c of concepts) {
    map.set(c.concept.toLowerCase(), c.id);
  }
  
  console.log(`📚 Loaded ${map.size} concept name→ID mappings`);
  return map;
}

async function loadCatalogEntries(db: lancedb.Connection): Promise<CatalogEntry[]> {
  const tables = await db.tableNames();
  if (!tables.includes('catalog')) {
    return [];
  }
  
  const catalogTable = await db.openTable('catalog');
  const rows = await catalogTable.query().limit(100000).toArray();
  
  return rows.map(row => ({
    id: row.id,
    source: row.source,
    hash: row.hash
  }));
}

// ============================================================================
// Main Processing
// ============================================================================

interface ProcessDocumentResult {
  pageRecords: PageRecord[];
  newConcepts: NewConceptRecord[];
}

async function processDocument(
  entry: CatalogEntry,
  conceptNameToId: Map<string, number>
): Promise<ProcessDocumentResult> {
  const sourcePath = entry.source;
  const filename = path.basename(sourcePath);
  
  console.log(`\n📖 Processing: ${filename}`);
  console.log(`   Source: ${sourcePath}`);
  
  // Load document pages (PDF or EPUB)
  let pages: Document[];
  try {
    pages = await loadDocumentPages(sourcePath);
    console.log(`   Loaded ${pages.length} pages/chapters`);
  } catch (error) {
    throw new Error(`Failed to load document: ${(error as Error).message}`);
  }
  
  if (pages.length === 0) {
    console.log(`   ⚠️  No pages found, skipping`);
    return { pageRecords: [], newConcepts: [] };
  }
  
  // Extract concepts freely - LLM is the SOURCE of concepts
  console.log(`   🤖 Extracting concepts (LLM free extraction)...`);
  const extractionResult = await extractConceptsWithRetry(pages, CONFIG.MAX_RETRIES);
  console.log(`   ✅ Extracted ${extractionResult.concepts.length} concepts`);
  
  // Create page records AND collect new concepts for concepts table
  const { pageRecords, newConcepts } = createPageRecords(
    entry.id,
    pages,
    extractionResult,
    conceptNameToId
  );
  
  console.log(`   📄 Created ${pageRecords.length} page records`);
  
  // Stats
  const pagesWithConcepts = pageRecords.filter(p => 
    p.concept_ids.length > 0 && !(p.concept_ids.length === 1 && p.concept_ids[0] === 0)
  ).length;
  console.log(`   📊 Pages with concepts: ${pagesWithConcepts}/${pageRecords.length}`);
  
  return { pageRecords, newConcepts };
}

async function main() {
  console.log('🚀 PAGES TABLE SEEDING SCRIPT\n');
  console.log('='.repeat(60));
  
  // Parse arguments
  const args = process.argv.slice(2);
  const isTest = args.includes('--test');
  const isResume = args.includes('--resume');
  const isDryRun = args.includes('--dry-run');
  
  const dbPathIdx = args.indexOf('--db');
  const dbPath = dbPathIdx >= 0 ? args[dbPathIdx + 1] : 
                 isTest ? CONFIG.TEST_DB_PATH : CONFIG.DEFAULT_DB_PATH;
  
  const batchSizeIdx = args.indexOf('--batch-size');
  const batchSize = batchSizeIdx >= 0 ? parseInt(args[batchSizeIdx + 1]) : CONFIG.DEFAULT_BATCH_SIZE;
  
  console.log(`📂 Database: ${dbPath}`);
  console.log(`📦 Batch size: ${batchSize}`);
  console.log(`🔄 Resume: ${isResume}`);
  console.log(`🧪 Dry run: ${isDryRun}`);
  console.log('');
  
  // Validate API key
  if (!CONFIG.OPENROUTER_API_KEY) {
    console.error('❌ OPENROUTER_API_KEY not set');
    process.exit(1);
  }
  
  // Connect to database
  const db = await lancedb.connect(dbPath);
  
  // Load existing data
  const conceptNameToId = await loadConceptNameToIdMap(db);
  let catalogEntries = await loadCatalogEntries(db);
  
  // Open concepts table for adding new concepts
  let conceptsTable: lancedb.Table | null = null;
  try {
    conceptsTable = await db.openTable('concepts');
  } catch {
    console.log('⚠️  No concepts table found - will create new concepts');
  }
  
  console.log(`📚 Found ${catalogEntries.length} catalog entries`);
  
  // For test mode with empty catalog, use sample docs
  if (isTest && catalogEntries.length === 0) {
    console.log('\n🧪 Test mode: Creating catalog from sample-docs...');
    catalogEntries = await createTestCatalog(db);
  }
  
  // Load checkpoint
  const checkpointPath = path.join(dbPath, '..', CONFIG.CHECKPOINT_FILE);
  let checkpoint = isResume ? loadCheckpoint(checkpointPath) : {
    processedCatalogIds: [],
    lastProcessedAt: '',
    totalProcessed: 0,
    totalFailed: 0,
    failedSources: []
  };
  
  if (isResume && checkpoint.processedCatalogIds.length > 0) {
    console.log(`\n📋 Resuming from checkpoint:`);
    console.log(`   Previously processed: ${checkpoint.totalProcessed}`);
    console.log(`   Previously failed: ${checkpoint.totalFailed}`);
  }
  
  // Filter already processed
  const toProcess = catalogEntries.filter(e => 
    !checkpoint.processedCatalogIds.includes(e.id)
  );
  
  console.log(`\n📋 Documents to process: ${toProcess.length}`);
  
  if (toProcess.length === 0) {
    console.log('✅ All documents already processed!');
    return;
  }
  
  if (isDryRun) {
    console.log('\n🧪 DRY RUN - Would process:');
    toProcess.slice(0, 10).forEach(e => console.log(`   - ${path.basename(e.source)}`));
    if (toProcess.length > 10) console.log(`   ... and ${toProcess.length - 10} more`);
    return;
  }
  
  // Ensure pages table exists
  const pagesTable = await ensurePagesTable(db);
  
  // Process in batches
  let batchPageRecords: PageRecord[] = [];
  let batchNewConcepts: NewConceptRecord[] = [];
  let processedInBatch = 0;
  let totalNewConcepts = 0;
  
  for (let i = 0; i < toProcess.length; i++) {
    const entry = toProcess[i];
    
    try {
      const { pageRecords, newConcepts } = await processDocument(entry, conceptNameToId);
      batchPageRecords.push(...pageRecords);
      batchNewConcepts.push(...newConcepts);
      totalNewConcepts += newConcepts.length;
      
      checkpoint.processedCatalogIds.push(entry.id);
      checkpoint.totalProcessed++;
      processedInBatch++;
      
    } catch (error) {
      console.error(`   ❌ Failed: ${(error as Error).message}`);
      checkpoint.totalFailed++;
      checkpoint.failedSources.push(entry.source);
      checkpoint.processedCatalogIds.push(entry.id); // Mark as processed to skip on resume
    }
    
    // Save batch and checkpoint
    if (processedInBatch >= batchSize || i === toProcess.length - 1) {
      // Add new concepts to concepts table FIRST (they're the canonical source)
      if (batchNewConcepts.length > 0 && conceptsTable) {
        console.log(`\n💡 Adding ${batchNewConcepts.length} NEW concepts to concepts table...`);
        await conceptsTable.add(batchNewConcepts);
        batchNewConcepts = [];
      }
      
      // Add page records (which reference concept IDs)
      if (batchPageRecords.length > 0) {
        console.log(`💾 Saving batch: ${batchPageRecords.length} page records...`);
        await pagesTable.add(batchPageRecords);
        batchPageRecords = [];
      }
      
      checkpoint.lastProcessedAt = new Date().toISOString();
      saveCheckpoint(checkpointPath, checkpoint);
      console.log(`   ✅ Checkpoint saved (${checkpoint.totalProcessed}/${catalogEntries.length})`);
      
      processedInBatch = 0;
    }
  }
  
  // Final summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SEEDING COMPLETE\n');
  console.log(`Total processed: ${checkpoint.totalProcessed}`);
  console.log(`Total failed: ${checkpoint.totalFailed}`);
  console.log(`New concepts added: ${totalNewConcepts}`);
  
  const pagesCount = await pagesTable.countRows();
  console.log(`Pages table rows: ${pagesCount}`);
  
  if (conceptsTable) {
    const conceptsCount = await conceptsTable.countRows();
    console.log(`Concepts table rows: ${conceptsCount}`);
  }
  
  if (checkpoint.failedSources.length > 0) {
    console.log('\n⚠️  Failed sources:');
    checkpoint.failedSources.forEach(s => console.log(`   - ${path.basename(s)}`));
  }
}

// ============================================================================
// Test Mode Helpers
// ============================================================================

async function createTestCatalog(db: lancedb.Connection): Promise<CatalogEntry[]> {
  const sampleDocsPath = CONFIG.SAMPLE_DOCS_PATH;
  const entries: CatalogEntry[] = [];
  
  // Find all PDFs in sample-docs
  function findPdfs(dir: string): string[] {
    const files: string[] = [];
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        files.push(...findPdfs(fullPath));
      } else if (item.name.endsWith('.pdf')) {
        files.push(fullPath);
      }
    }
    return files;
  }
  
  const pdfs = findPdfs(sampleDocsPath);
  console.log(`   Found ${pdfs.length} PDFs in sample-docs`);
  
  // Create catalog entries
  const catalogRecords = pdfs.map((pdfPath, idx) => ({
    id: hashToId(pdfPath),
    source: pdfPath,
    hash: hashToId(pdfPath + '-hash').toString(),
    summary: `Sample document: ${path.basename(pdfPath)}`,
    vector: generateSimpleEmbedding(path.basename(pdfPath)),
    category_ids: [0]
  }));
  
  // Create catalog table
  const tables = await db.tableNames();
  if (tables.includes('catalog')) {
    await db.dropTable('catalog');
  }
  await db.createTable('catalog', catalogRecords, { mode: 'create' });
  
  console.log(`   Created catalog with ${catalogRecords.length} entries`);
  
  return catalogRecords.map(r => ({
    id: r.id,
    source: r.source,
    hash: r.hash
  }));
}

// Run
main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

