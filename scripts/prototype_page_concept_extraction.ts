#!/usr/bin/env tsx
/**
 * PROTOTYPE: Page-based Concept Extraction
 * 
 * This prototype tests a new approach where:
 * 1. Document content is marked with page numbers
 * 2. LLM extracts concepts AND reports which pages they appear on
 * 3. Page numbers are mapped back to chunks
 * 
 * This should solve the 58% missing chunk mapping problem by having the LLM
 * directly indicate concept locations rather than relying on fuzzy text matching.
 */

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "@langchain/core/documents";
import * as path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Types
interface ConceptWithPages {
  concept: string;
  type: 'thematic' | 'methodological' | 'technical';
  pages: number[];
  confidence: 'high' | 'medium' | 'low';
}

interface ExtractionResult {
  concepts: ConceptWithPages[];
  categories: string[];
  totalPages: number;
}

// Configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = 'openai/gpt-4o-mini';  // Good balance of cost/capability
const SAMPLE_DOC = path.join(__dirname, '../sample-docs/Philosophy/Sun Tzu - Art Of War.pdf');

/**
 * Load PDF and extract pages with metadata
 */
async function loadPdfWithPages(pdfPath: string): Promise<Document[]> {
  console.log(`📄 Loading PDF: ${path.basename(pdfPath)}`);
  
  const loader = new PDFLoader(pdfPath, {
    splitPages: true  // Keep pages separate initially
  });
  
  const pages = await loader.load();
  console.log(`   Found ${pages.length} pages`);
  
  return pages;
}

/**
 * Create chunks while preserving page number metadata
 */
async function createChunksWithPageInfo(pages: Document[]): Promise<Document[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 10,
  });
  
  const allChunks: Document[] = [];
  
  for (const page of pages) {
    const pageNumber = page.metadata.loc?.pageNumber || page.metadata.page || 0;
    const pageChunks = await splitter.splitDocuments([page]);
    
    // Add page number to each chunk
    for (const chunk of pageChunks) {
      chunk.metadata.pageNumber = pageNumber;
      allChunks.push(chunk);
    }
  }
  
  console.log(`   Created ${allChunks.length} chunks from ${pages.length} pages`);
  return allChunks;
}

/**
 * Build page-marked content for LLM extraction
 */
function buildPageMarkedContent(pages: Document[]): string {
  const sections: string[] = [];
  
  for (const page of pages) {
    const pageNum = page.metadata.loc?.pageNumber || page.metadata.page || '?';
    const content = page.pageContent.trim();
    
    if (content.length > 50) {  // Skip nearly empty pages
      sections.push(`[PAGE ${pageNum}]\n${content}`);
    }
  }
  
  return sections.join('\n\n---\n\n');
}

/**
 * Build the extraction prompt with page awareness
 */
function buildPageAwarePrompt(markedContent: string): string {
  return `You are analyzing a document that has been divided into pages marked with [PAGE N].

TASK: Extract ALL significant concepts from this document and indicate which page(s) each concept appears on.

${markedContent}

INSTRUCTIONS:
1. Extract concepts at THREE levels:
   - THEMATIC: Core themes (e.g., "strategic deception", "leadership principles")
   - METHODOLOGICAL: Frameworks and approaches (e.g., "terrain analysis", "force disposition")  
   - TECHNICAL: Specific terms and techniques (e.g., "flanking maneuver", "supply lines")

2. For each concept, list the PAGE NUMBERS where it appears or is discussed.
   - A concept may appear on multiple pages
   - Include pages where the concept is implied or discussed, not just literally mentioned

3. Rate your confidence: "high" if explicitly discussed, "medium" if clearly implied, "low" if inferred.

Return ONLY valid JSON in this exact format:
{
  "concepts": [
    {"concept": "strategic deception", "type": "thematic", "pages": [5, 12, 23], "confidence": "high"},
    {"concept": "terrain analysis", "type": "methodological", "pages": [7, 8, 9], "confidence": "high"},
    {"concept": "flanking maneuver", "type": "technical", "pages": [15], "confidence": "medium"}
  ],
  "categories": ["military strategy", "leadership", "philosophy"]
}

Extract 30-80 concepts covering all three levels. Be thorough but precise with page numbers.`;
}

/**
 * Call OpenRouter API for extraction
 */
async function callLLM(prompt: string): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY not set');
  }
  
  console.log(`🤖 Calling LLM (${MODEL})...`);
  console.log(`   Prompt length: ${prompt.length} chars (~${Math.ceil(prompt.length / 4)} tokens)`);
  
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://github.com/concept-rag',
      'X-Title': 'Concept-RAG Page Extraction Prototype'
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 8000
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LLM API error: ${response.status} - ${error}`);
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Parse LLM response into structured format
 */
function parseExtractionResult(response: string, totalPages: number): ExtractionResult {
  // Remove markdown code blocks if present
  let jsonText = response.trim();
  if (jsonText.includes('```')) {
    const match = jsonText.match(/```json?\s*([\s\S]*?)\s*```/);
    if (match) jsonText = match[1].trim();
  }
  
  const parsed = JSON.parse(jsonText);
  
  return {
    concepts: parsed.concepts || [],
    categories: parsed.categories || [],
    totalPages
  };
}

/**
 * Map page numbers to chunk indices
 */
function mapPagesToChunks(
  concepts: ConceptWithPages[],
  chunks: Document[]
): Map<string, number[]> {
  // Build page -> chunk indices map
  const pageToChunks = new Map<number, number[]>();
  
  chunks.forEach((chunk, idx) => {
    const pageNum = chunk.metadata.pageNumber;
    if (!pageToChunks.has(pageNum)) {
      pageToChunks.set(pageNum, []);
    }
    pageToChunks.get(pageNum)!.push(idx);
  });
  
  // Map each concept's pages to chunk indices
  const conceptToChunks = new Map<string, number[]>();
  
  for (const concept of concepts) {
    const chunkIndices = new Set<number>();
    
    for (const pageNum of concept.pages) {
      const chunksOnPage = pageToChunks.get(pageNum) || [];
      chunksOnPage.forEach(idx => chunkIndices.add(idx));
    }
    
    conceptToChunks.set(concept.concept, Array.from(chunkIndices).sort((a, b) => a - b));
  }
  
  return conceptToChunks;
}

/**
 * Verify concept-chunk mappings by checking if concept text appears in chunks
 */
function verifyMappings(
  conceptToChunks: Map<string, number[]>,
  chunks: Document[]
): { verified: number; unverified: number; verificationRate: number } {
  let verified = 0;
  let unverified = 0;
  
  for (const [concept, chunkIndices] of conceptToChunks) {
    const conceptLower = concept.toLowerCase();
    
    // Check if concept appears in ANY of its assigned chunks
    let found = false;
    for (const idx of chunkIndices) {
      if (chunks[idx].pageContent.toLowerCase().includes(conceptLower)) {
        found = true;
        break;
      }
    }
    
    // Also check if concept words appear (for multi-word concepts)
    if (!found) {
      const words = conceptLower.split(/\s+/).filter(w => w.length > 3);
      for (const idx of chunkIndices) {
        const text = chunks[idx].pageContent.toLowerCase();
        if (words.every(word => text.includes(word))) {
          found = true;
          break;
        }
      }
    }
    
    if (found) verified++;
    else unverified++;
  }
  
  return {
    verified,
    unverified,
    verificationRate: verified / (verified + unverified)
  };
}

/**
 * Main prototype execution
 */
async function main() {
  console.log('🧪 PAGE-BASED CONCEPT EXTRACTION PROTOTYPE\n');
  console.log('='.repeat(60));
  
  // Step 1: Load PDF
  const pages = await loadPdfWithPages(SAMPLE_DOC);
  
  // Step 2: Create chunks with page info
  const chunks = await createChunksWithPageInfo(pages);
  
  // Step 3: Build page-marked content
  console.log('\n📝 Building page-marked content...');
  const markedContent = buildPageMarkedContent(pages);
  console.log(`   Content length: ${markedContent.length} chars`);
  
  // Step 4: Build prompt and call LLM
  const prompt = buildPageAwarePrompt(markedContent);
  
  const startTime = Date.now();
  const response = await callLLM(prompt);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`   Response received in ${elapsed}s`);
  
  // Step 5: Parse results
  console.log('\n📊 Parsing extraction results...');
  const result = parseExtractionResult(response, pages.length);
  
  console.log(`   Extracted ${result.concepts.length} concepts`);
  console.log(`   Categories: ${result.categories.join(', ')}`);
  
  // Step 6: Map pages to chunks
  console.log('\n🔗 Mapping pages to chunks...');
  const conceptToChunks = mapPagesToChunks(result.concepts, chunks);
  
  // Stats
  let totalMappings = 0;
  let conceptsWithMappings = 0;
  
  for (const [concept, chunkIds] of conceptToChunks) {
    if (chunkIds.length > 0) {
      conceptsWithMappings++;
      totalMappings += chunkIds.length;
    }
  }
  
  console.log(`   Concepts with chunk mappings: ${conceptsWithMappings}/${result.concepts.length}`);
  console.log(`   Total concept-chunk links: ${totalMappings}`);
  console.log(`   Average chunks per concept: ${(totalMappings / conceptsWithMappings).toFixed(1)}`);
  
  // Step 7: Verify mappings
  console.log('\n✅ Verifying mappings (text presence check)...');
  const verification = verifyMappings(conceptToChunks, chunks);
  console.log(`   Verified (text found): ${verification.verified}`);
  console.log(`   Unverified (semantic only): ${verification.unverified}`);
  console.log(`   Verification rate: ${(verification.verificationRate * 100).toFixed(1)}%`);
  
  // Step 8: Show sample results
  console.log('\n' + '='.repeat(60));
  console.log('📋 SAMPLE RESULTS (first 10 concepts)\n');
  
  const sampleConcepts = result.concepts.slice(0, 10);
  for (const concept of sampleConcepts) {
    const chunkIds = conceptToChunks.get(concept.concept) || [];
    console.log(`"${concept.concept}" (${concept.type})`);
    console.log(`   Pages: [${concept.pages.join(', ')}]`);
    console.log(`   Chunks: [${chunkIds.slice(0, 5).join(', ')}${chunkIds.length > 5 ? '...' : ''}] (${chunkIds.length} total)`);
    console.log(`   Confidence: ${concept.confidence}`);
    console.log('');
  }
  
  // Summary
  console.log('='.repeat(60));
  console.log('📈 SUMMARY\n');
  console.log(`Total pages: ${pages.length}`);
  console.log(`Total chunks: ${chunks.length}`);
  console.log(`Concepts extracted: ${result.concepts.length}`);
  console.log(`Concepts with chunk links: ${conceptsWithMappings} (${(conceptsWithMappings / result.concepts.length * 100).toFixed(1)}%)`);
  console.log(`Verification rate: ${(verification.verificationRate * 100).toFixed(1)}%`);
  console.log(`\nCompare to current approach: ~42% chunk mapping rate`);
}

main().catch(console.error);

