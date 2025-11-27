#!/usr/bin/env tsx
/**
 * Link Related Concepts by Shared Words
 * 
 * Discovers concept relationships based on lexical overlap:
 * - "military strategy" ↔ "strategy pattern" (share "strategy")
 * - "feedback loops" ↔ "control loops" (share "loops")
 * 
 * This complements co-occurrence linking (adjacent_ids - concepts in same document)
 * with lexical linking (related_ids - concepts sharing significant words).
 * 
 * Usage:
 *   npx tsx scripts/link_related_concepts.ts [--db <path>] [--dry-run] [--min-word-length 5]
 */

import * as lancedb from '@lancedb/lancedb';
import { hashToId } from '../src/infrastructure/utils/hash.js';

// Stop words to exclude from matching
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
  'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need',
  'that', 'which', 'who', 'whom', 'this', 'these', 'those', 'it', 'its',
  'vs', 'etc', 'e.g', 'i.e', 'via', 'using', 'based', 'like', 'such'
]);

interface ConceptData {
  id: number;
  concept: string;
}

interface ConceptLink {
  conceptId: number;
  linkedConceptId: number;
  sharedWords: string[];
}

/**
 * Extract significant words from a concept name.
 */
function extractSignificantWords(concept: string, minLength: number): string[] {
  // Remove parenthetical content for cleaner matching
  const cleaned = concept
    .toLowerCase()
    .replace(/\([^)]*\)/g, '') // Remove (parenthetical notes)
    .replace(/[^a-z\s-]/g, ' ') // Keep letters, spaces, hyphens
    .replace(/-/g, ' ')         // Split hyphenated words
    .trim();
  
  const words = cleaned.split(/\s+/).filter(w => 
    w.length >= minLength && !STOP_WORDS.has(w)
  );
  
  return [...new Set(words)]; // Dedupe
}

/**
 * Build inverted index: word → concept IDs
 */
function buildWordIndex(
  concepts: ConceptData[],
  minWordLength: number
): Map<string, Set<number>> {
  const wordIndex = new Map<string, Set<number>>();
  
  for (const c of concepts) {
    const words = extractSignificantWords(c.concept, minWordLength);
    
    for (const word of words) {
      if (!wordIndex.has(word)) {
        wordIndex.set(word, new Set());
      }
      wordIndex.get(word)!.add(c.id);
    }
  }
  
  return wordIndex;
}

/**
 * Find concepts linked by shared words.
 * Returns a map: conceptId → [linked concept IDs]
 */
function findLexicalLinks(
  concepts: ConceptData[],
  wordIndex: Map<string, Set<number>>,
  minWordLength: number,
  maxLinksPerConcept: number = 20
): Map<number, number[]> {
  const linkMap = new Map<number, number[]>();
  
  for (const c of concepts) {
    const words = extractSignificantWords(c.concept, minWordLength);
    const linkedConcepts = new Map<number, string[]>(); // conceptId → shared words
    
    for (const word of words) {
      const relatedIds = wordIndex.get(word) || new Set();
      
      for (const relatedId of relatedIds) {
        if (relatedId === c.id) continue; // Skip self
        
        if (!linkedConcepts.has(relatedId)) {
          linkedConcepts.set(relatedId, []);
        }
        linkedConcepts.get(relatedId)!.push(word);
      }
    }
    
    // Sort by number of shared words (descending) and take top N
    const sortedLinks = Array.from(linkedConcepts.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, maxLinksPerConcept)
      .map(([id, _]) => id);
    
    if (sortedLinks.length > 0) {
      linkMap.set(c.id, sortedLinks);
    }
  }
  
  return linkMap;
}

async function main() {
  console.log('🔗 LEXICAL CONCEPT LINKING\n');
  console.log('='.repeat(70));
  
  // Parse args
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const dbPathIdx = args.indexOf('--db');
  const dbPath = dbPathIdx >= 0 ? args[dbPathIdx + 1] : './test_db';
  const minLengthIdx = args.indexOf('--min-word-length');
  const minWordLength = minLengthIdx >= 0 ? parseInt(args[minLengthIdx + 1]) : 5;
  
  console.log(`📂 Database: ${dbPath}`);
  console.log(`📏 Min word length: ${minWordLength}`);
  console.log(`🧪 Dry run: ${isDryRun}\n`);
  
  // Connect
  const db = await lancedb.connect(dbPath);
  const conceptsTable = await db.openTable('concepts');
  const allConcepts = await conceptsTable.query().limit(100000).toArray();
  
  console.log(`📊 Loaded ${allConcepts.length} concepts\n`);
  
  // Build concept data
  const concepts: ConceptData[] = allConcepts.map(c => ({ 
    id: c.id, 
    concept: c.concept 
  }));
  
  // Build word index
  const wordIndex = buildWordIndex(concepts, minWordLength);
  console.log(`📚 Built word index with ${wordIndex.size} unique words\n`);
  
  // Show most common linking words
  const wordCounts = Array.from(wordIndex.entries())
    .map(([word, ids]) => ({ word, count: ids.size }))
    .filter(w => w.count > 1) // Only words linking multiple concepts
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);
  
  console.log('🔝 Top linking words:');
  wordCounts.forEach(w => {
    console.log(`   "${w.word}" links ${w.count} concepts`);
  });
  
  // Find lexical links
  const linkMap = findLexicalLinks(concepts, wordIndex, minWordLength);
  
  // Count total links
  let totalLinks = 0;
  for (const links of linkMap.values()) {
    totalLinks += links.length;
  }
  
  console.log(`\n🔗 Found ${linkMap.size} concepts with lexical links`);
  console.log(`   Total link count: ${totalLinks}`);
  
  // Show sample links
  console.log('\n📋 Sample links (strategy-related):');
  const conceptMap = new Map(concepts.map(c => [c.id, c.concept]));
  
  // Find strategy concepts
  const strategyConcepts = concepts.filter(c => 
    c.concept.toLowerCase().includes('strategy')
  ).slice(0, 3);
  
  for (const c of strategyConcepts) {
    const links = linkMap.get(c.id) || [];
    console.log(`\n   "${c.concept}"`);
    console.log(`   → links to ${links.length} concepts:`);
    for (const linkedId of links.slice(0, 5)) {
      console.log(`      - "${conceptMap.get(linkedId)}"`);
    }
  }
  
  if (isDryRun) {
    console.log('\n🧪 DRY RUN - No changes made');
    console.log('Run without --dry-run to update related_ids in database');
    return;
  }
  
  // Update database
  console.log('\n💾 Updating database with related_ids...');
  
  // We need to recreate the table with the new field
  // LanceDB doesn't support in-place updates of array fields easily
  // So we'll load all data, add related_ids, and recreate
  
  const updatedData = allConcepts.map(row => {
    const conceptId = row.id;
    const relatedIds = linkMap.get(conceptId) || [];
    
    // Parse existing fields
    const parseArray = (val: any): any[] => {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      if (typeof val === 'object' && 'toArray' in val) {
        return Array.from(val.toArray());
      }
      return [];
    };
    
    // Ensure non-empty for LanceDB
    const ensureNonEmpty = <T>(arr: T[], placeholder: T): T[] => {
      return arr.length > 0 ? arr : [placeholder];
    };
    
    return {
      id: row.id,
      concept: row.concept,
      summary: row.summary || '',
      catalog_ids: ensureNonEmpty(parseArray(row.catalog_ids), 0),
      chunk_ids: ensureNonEmpty(parseArray(row.chunk_ids), 0),
      adjacent_ids: ensureNonEmpty(parseArray(row.adjacent_ids || row.related_concept_ids), 0),
      related_ids: ensureNonEmpty(relatedIds, 0),
      synonyms: ensureNonEmpty(parseArray(row.synonyms), ''),
      broader_terms: ensureNonEmpty(parseArray(row.broader_terms), ''),
      narrower_terms: ensureNonEmpty(parseArray(row.narrower_terms), ''),
      weight: row.weight || 0,
      vector: parseArray(row.vector || row.embeddings)
    };
  });
  
  // Drop and recreate table
  console.log('   Dropping old concepts table...');
  await db.dropTable('concepts');
  
  console.log('   Creating new concepts table with related_ids...');
  await db.createTable('concepts', updatedData, { mode: 'create' });
  
  // Stats
  const conceptsWithLinks = updatedData.filter(d => 
    d.related_ids.length > 1 || (d.related_ids.length === 1 && d.related_ids[0] !== 0)
  ).length;
  
  console.log(`\n✅ Done!`);
  console.log(`   ${conceptsWithLinks}/${allConcepts.length} concepts have lexical links`);
  console.log(`   Total related_ids entries: ${totalLinks}`);
}

main().catch(console.error);
