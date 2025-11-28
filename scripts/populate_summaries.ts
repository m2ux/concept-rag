#!/usr/bin/env npx tsx
/**
 * Populate summary fields for concepts and categories
 * 
 * Uses grok-4-fast to generate one-sentence summaries in batches
 * 
 * RESUME SUPPORT: The script automatically resumes from where it left off
 * by finding items that already have summaries and skipping them.
 * Progress is saved after each batch for crash recovery.
 * 
 * Usage:
 *   # Suppress LanceDB warnings for clean progress bar:
 *   RUST_LOG=error npx tsx scripts/populate_summaries.ts [db-path]
 *   
 *   # Example:
 *   RUST_LOG=error npx tsx scripts/populate_summaries.ts ~/.concept_rag
 *   
 * Options:
 *   --concepts-only    Only populate concept summaries
 *   --categories-only  Only populate category summaries
 *   --batch-size=N     Number of items per LLM request (default: 20)
 *   --dry-run          Show what would be done without making changes
 *   --force            Regenerate ALL summaries (ignore existing)
 */

import { connect, Table } from '@lancedb/lancedb';
import * as path from 'path';

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const MODEL = "x-ai/grok-4-fast";
const DEFAULT_BATCH_SIZE = 20;
const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests

interface SummaryResult {
  name: string;
  summary: string;
}

let lastRequestTime = 0;

async function rateLimitDelay(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const delayNeeded = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    await new Promise(resolve => setTimeout(resolve, delayNeeded));
  }
  lastRequestTime = Date.now();
}

/**
 * Generate ASCII progress bar
 */
function progressBar(current: number, total: number, width: number = 30): string {
  const percentage = Math.round((current / total) * 100);
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

async function generateSummaries(
  items: string[],
  type: 'concept' | 'category',
  apiKey: string
): Promise<SummaryResult[]> {
  await rateLimitDelay();
  
  const prompt = type === 'concept' 
    ? `Generate a one-sentence summary for each of the following concepts. The summary should be a clear, concise definition that would help someone understand what the concept means.

Format your response as JSON array:
[{"name": "concept name", "summary": "one sentence summary"}]

Concepts to summarize:
${items.map((item, i) => `${i + 1}. ${item}`).join('\n')}

Return ONLY the JSON array, no other text.`
    : `Generate a one-sentence summary for each of the following categories/domains. The summary should describe what topics and subjects fall under this category.

Format your response as JSON array:
[{"name": "category name", "summary": "one sentence summary"}]

Categories to summarize:
${items.map((item, i) => `${i + 1}. ${item}`).join('\n')}

Return ONLY the JSON array, no other text.`;

  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/concept-rag',
        'X-Title': 'Concept-RAG Summary Generation'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';
    
    // Parse JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('  ⚠️  Failed to parse JSON from response:', content.substring(0, 200));
      return [];
    }
    
    const results: SummaryResult[] = JSON.parse(jsonMatch[0]);
    return results;
  } catch (error) {
    console.error('  ❌ Error generating summaries:', error);
    return [];
  }
}

/**
 * Convert Arrow Vectors and other LanceDB types to native arrays
 */
function toArray(val: any): string[] {
  if (!val) return [''];
  if (Array.isArray(val)) return val.length > 0 ? val : [''];
  if (typeof val === 'object' && 'toArray' in val) {
    const arr = Array.from(val.toArray()) as string[];
    return arr.length > 0 ? arr : [''];
  }
  return [''];
}

function toNumberArray(val: any): number[] {
  if (!val) return [0];
  if (Array.isArray(val)) return val.length > 0 ? val : [0];
  if (typeof val === 'object' && 'toArray' in val) {
    const arr = Array.from(val.toArray()) as number[];
    return arr.length > 0 ? arr : [0];
  }
  return [0];
}

function toVectorArray(val: any): number[] {
  if (Array.isArray(val)) return val;
  if (typeof val === 'object' && 'toArray' in val) {
    return Array.from(val.toArray()) as number[];
  }
  return [];
}

/**
 * Save concepts table with updated summaries (incremental save)
 */
async function saveConceptsIncremental(
  db: any,
  allConcepts: any[],
  updates: Map<number, string>
): Promise<void> {
  const migratedConcepts = allConcepts.map(row => {
    const updatedSummary = updates.get(row.id);
    return {
      id: row.id,
      name: row.name || row.concept || '',  // Support both 'name' (new) and 'concept' (legacy)
      summary: updatedSummary ?? row.summary ?? '',
      catalog_ids: toNumberArray(row.catalog_ids),
      chunk_ids: toNumberArray(row.chunk_ids),
      related_concept_ids: toNumberArray(row.related_concept_ids),
      synonyms: toArray(row.synonyms),
      broader_terms: toArray(row.broader_terms),
      narrower_terms: toArray(row.narrower_terms),
      weight: row.weight || 0,
      vector: toVectorArray(row.vector)
    };
  });
  
  await db.dropTable('concepts');
  await db.createTable('concepts', migratedConcepts, { mode: 'overwrite' });
}

/**
 * Save categories table with updated summaries (incremental save)
 */
async function saveCategoriesIncremental(
  db: any,
  allCategories: any[],
  updates: Map<number, string>
): Promise<void> {
  const migratedCategories = allCategories.map(row => {
    const updatedSummary = updates.get(row.id);
    return {
      id: row.id,
      category: row.category || '',
      description: row.description || '',
      summary: updatedSummary ?? row.summary ?? '',
      parent_category_id: row.parent_category_id ?? null,
      aliases: toArray(row.aliases),
      related_categories: toNumberArray(row.related_categories),
      document_count: row.document_count || 0,
      chunk_count: row.chunk_count || 0,
      concept_count: row.concept_count || 0,
      vector: toVectorArray(row.vector)
    };
  });
  
  await db.dropTable('categories');
  await db.createTable('categories', migratedCategories, { mode: 'overwrite' });
}

async function populateSummaries(
  dbPath: string,
  options: {
    conceptsOnly?: boolean;
    categoriesOnly?: boolean;
    batchSize?: number;
    dryRun?: boolean;
    force?: boolean;
  } = {}
) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error('❌ OPENROUTER_API_KEY environment variable not set');
    process.exit(1);
  }

  const batchSize = options.batchSize || DEFAULT_BATCH_SIZE;
  
  console.log('\n📝 POPULATE SUMMARIES');
  console.log('='.repeat(70));
  console.log(`Database: ${dbPath}`);
  console.log(`Model: ${MODEL}`);
  console.log(`Batch size: ${batchSize}`);
  if (options.dryRun) console.log('🔍 DRY RUN MODE - no changes will be made');
  if (options.force) console.log('⚠️  FORCE MODE - regenerating ALL summaries');
  console.log('💾 Progress saved after each batch (resume-safe)');
  if (!process.env.RUST_LOG) {
    console.log('💡 Tip: Run with RUST_LOG=error to suppress LanceDB warnings');
  }
  console.log('');

  const db = await connect(dbPath);

  // ========== CONCEPTS ==========
  if (!options.categoriesOnly) {
    console.log('🧠 Processing concepts...');
    const conceptsTable = await db.openTable('concepts');
    const allConcepts = await conceptsTable.query().limit(100000).toArray();
    
    // Find concepts without summaries (or all if --force)
    const needsSummary = options.force 
      ? allConcepts 
      : allConcepts.filter(c => !c.summary || c.summary === '');
    
    const alreadyDone = allConcepts.length - needsSummary.length;
    
    if (alreadyDone > 0 && !options.force) {
      console.log(`  ✓ Already have summaries: ${alreadyDone}/${allConcepts.length}`);
      console.log(`  → Resuming from item ${alreadyDone + 1}...`);
    }
    console.log(`  📋 Need to process: ${needsSummary.length} concepts`);
    
    if (needsSummary.length > 0 && !options.dryRun) {
      const updates = new Map<number, string>();
      const totalBatches = Math.ceil(needsSummary.length / batchSize);
      
      for (let i = 0; i < needsSummary.length; i += batchSize) {
        const batch = needsSummary.slice(i, i + batchSize);
        const names = batch.map(c => c.concept);
        const batchNum = Math.floor(i / batchSize) + 1;
        const processed = Math.min(i + batchSize, needsSummary.length);
        
        // Show progress bar
        const bar = progressBar(processed, needsSummary.length);
        process.stdout.write(`\r  🧠 [${bar}] ${processed}/${needsSummary.length} (batch ${batchNum}/${totalBatches})  `);
        
        const results = await generateSummaries(names, 'concept', apiKey);
        
        // Match results back to concepts
        for (const result of results) {
          const concept = batch.find(c => 
            c.concept.toLowerCase() === result.name.toLowerCase()
          );
          if (concept && result.summary) {
            updates.set(concept.id, result.summary);
          }
        }
        
        // Save progress after each batch
        if (updates.size > 0) {
          await saveConceptsIncremental(db, allConcepts, updates);
          // Refresh allConcepts with updated data
          const refreshedTable = await db.openTable('concepts');
          const refreshedData = await refreshedTable.query().limit(100000).toArray();
          allConcepts.length = 0;
          allConcepts.push(...refreshedData);
        }
      }
      
      // Clear progress bar and show completion
      process.stdout.write('\r' + ' '.repeat(80) + '\r');
      console.log(`  ✅ Generated ${updates.size} concept summaries`);
    } else if (needsSummary.length === 0) {
      console.log(`  ✅ All ${allConcepts.length} concepts already have summaries`);
    }
  }

  // ========== CATEGORIES ==========
  if (!options.conceptsOnly) {
    console.log('\n📁 Processing categories...');
    const categoriesTable = await db.openTable('categories');
    const allCategories = await categoriesTable.query().limit(10000).toArray();
    
    // Find categories without summaries (or all if --force)
    const needsSummary = options.force
      ? allCategories
      : allCategories.filter(c => !c.summary || c.summary === '');
    
    const alreadyDone = allCategories.length - needsSummary.length;
    
    if (alreadyDone > 0 && !options.force) {
      console.log(`  ✓ Already have summaries: ${alreadyDone}/${allCategories.length}`);
      console.log(`  → Resuming from item ${alreadyDone + 1}...`);
    }
    console.log(`  📋 Need to process: ${needsSummary.length} categories`);
    
    if (needsSummary.length > 0 && !options.dryRun) {
      const updates = new Map<number, string>();
      const totalBatches = Math.ceil(needsSummary.length / batchSize);
      let lastSavedBatch = 0;
      
      for (let i = 0; i < needsSummary.length; i += batchSize) {
        const batch = needsSummary.slice(i, i + batchSize);
        const names = batch.map(c => c.category);
        const batchNum = Math.floor(i / batchSize) + 1;
        const processed = Math.min(i + batchSize, needsSummary.length);
        
        // Show progress bar
        const bar = progressBar(processed, needsSummary.length);
        process.stdout.write(`\r  📂 [${bar}] ${processed}/${needsSummary.length} (batch ${batchNum}/${totalBatches})  `);
        
        const results = await generateSummaries(names, 'category', apiKey);
        
        // Match results back to categories
        for (const result of results) {
          const category = batch.find(c => 
            c.category.toLowerCase() === result.name.toLowerCase()
          );
          if (category && result.summary) {
            updates.set(category.id, result.summary);
          }
        }
        
        // Save progress every N batches (or on last batch)
        const isLastBatch = i + batchSize >= needsSummary.length;
        const shouldSave = (batchNum - lastSavedBatch >= SAVE_EVERY_N_BATCHES) || isLastBatch;
        
        if (shouldSave && updates.size > 0) {
          // Clear line and show save message
          process.stdout.write(`\r  💾 Saving ${updates.size} summaries...` + ' '.repeat(50));
          
          await saveCategoriesIncremental(db, allCategories, updates);
          lastSavedBatch = batchNum;
          
          // Refresh allCategories with updated data
          const refreshedTable = await db.openTable('categories');
          const refreshedData = await refreshedTable.query().limit(10000).toArray();
          allCategories.length = 0;
          allCategories.push(...refreshedData);
          
          // Restore progress bar
          process.stdout.write(`\r  📂 [${bar}] ${processed}/${needsSummary.length} (batch ${batchNum}/${totalBatches})  `);
        }
      }
      
      // Clear progress bar and show completion
      process.stdout.write('\r' + ' '.repeat(80) + '\r');
      console.log(`  ✅ Generated ${updates.size} category summaries`);
    } else if (needsSummary.length === 0) {
      console.log(`  ✅ All ${allCategories.length} categories already have summaries`);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ Summary population complete!');
}

// Parse arguments
const args = process.argv.slice(2);
const dbPath = args.find(a => !a.startsWith('--')) || path.join(process.env.HOME || '', '.concept_rag');
const options = {
  conceptsOnly: args.includes('--concepts-only'),
  categoriesOnly: args.includes('--categories-only'),
  batchSize: parseInt(args.find(a => a.startsWith('--batch-size='))?.split('=')[1] || '') || DEFAULT_BATCH_SIZE,
  dryRun: args.includes('--dry-run'),
  force: args.includes('--force')
};

populateSummaries(dbPath, options)
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
