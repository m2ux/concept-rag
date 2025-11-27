#!/usr/bin/env npx tsx
/**
 * Populate summary fields for concepts and categories
 * 
 * Uses grok-4-fast to generate one-sentence summaries in batches
 * 
 * Usage:
 *   npx tsx scripts/populate_summaries.ts [db-path]
 *   npx tsx scripts/populate_summaries.ts ~/.concept_rag
 *   
 * Options:
 *   --concepts-only    Only populate concept summaries
 *   --categories-only  Only populate category summaries
 *   --batch-size N     Number of items per LLM request (default: 20)
 *   --dry-run          Show what would be done without making changes
 */

import { connect } from '@lancedb/lancedb';
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

async function populateSummaries(
  dbPath: string,
  options: {
    conceptsOnly?: boolean;
    categoriesOnly?: boolean;
    batchSize?: number;
    dryRun?: boolean;
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
  console.log('');

  const db = await connect(dbPath);

  // ========== CONCEPTS ==========
  if (!options.categoriesOnly) {
    console.log('🧠 Processing concepts...');
    const conceptsTable = await db.openTable('concepts');
    const allConcepts = await conceptsTable.query().limit(100000).toArray();
    
    // Find concepts without summaries
    const needsSummary = allConcepts.filter(c => !c.summary || c.summary === '');
    console.log(`  Found ${needsSummary.length} concepts without summaries (of ${allConcepts.length} total)`);
    
    if (needsSummary.length > 0 && !options.dryRun) {
      let processed = 0;
      const updates: { id: number; summary: string }[] = [];
      
      for (let i = 0; i < needsSummary.length; i += batchSize) {
        const batch = needsSummary.slice(i, i + batchSize);
        const names = batch.map(c => c.concept);
        
        process.stdout.write(`  Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(needsSummary.length / batchSize)}...`);
        
        const results = await generateSummaries(names, 'concept', apiKey);
        
        // Match results back to concepts
        for (const result of results) {
          const concept = batch.find(c => 
            c.concept.toLowerCase() === result.name.toLowerCase()
          );
          if (concept && result.summary) {
            updates.push({ id: concept.id, summary: result.summary });
            processed++;
          }
        }
        
        console.log(` ✓ (${results.length} summaries)`);
      }
      
      // Update database
      if (updates.length > 0) {
        console.log(`  💾 Updating ${updates.length} concepts in database...`);
        
        // LanceDB doesn't support direct updates, so we need to rebuild
        const updatedConcepts = allConcepts.map(c => {
          const update = updates.find(u => u.id === c.id);
          if (update) {
            return { ...c, summary: update.summary };
          }
          return c;
        });
        
        // Convert Arrow Vectors to native arrays
        const migratedConcepts = updatedConcepts.map(row => {
          const toArray = (val: any) => {
            if (!val) return [''];
            if (Array.isArray(val)) return val.length > 0 ? val : [''];
            if (typeof val === 'object' && 'toArray' in val) {
              const arr = Array.from(val.toArray());
              return arr.length > 0 ? arr : [''];
            }
            return [''];
          };
          
          const toNumberArray = (val: any) => {
            if (!val) return [0];
            if (Array.isArray(val)) return val.length > 0 ? val : [0];
            if (typeof val === 'object' && 'toArray' in val) {
              const arr = Array.from(val.toArray()) as number[];
              return arr.length > 0 ? arr : [0];
            }
            return [0];
          };
          
          return {
            id: row.id,
            concept: row.concept || '',
            summary: row.summary || '',
            catalog_ids: toNumberArray(row.catalog_ids),
            related_concept_ids: toNumberArray(row.related_concept_ids),
            synonyms: toArray(row.synonyms),
            broader_terms: toArray(row.broader_terms),
            narrower_terms: toArray(row.narrower_terms),
            weight: row.weight || 0,
            vector: Array.isArray(row.vector) ? row.vector : Array.from(row.vector?.toArray?.() || [])
          };
        });
        
        await db.dropTable('concepts');
        await db.createTable('concepts', migratedConcepts, { mode: 'overwrite' });
        
        console.log(`  ✅ Updated ${updates.length} concept summaries`);
      }
    }
  }

  // ========== CATEGORIES ==========
  if (!options.conceptsOnly) {
    console.log('\n📁 Processing categories...');
    const categoriesTable = await db.openTable('categories');
    const allCategories = await categoriesTable.query().limit(10000).toArray();
    
    // Find categories without summaries
    const needsSummary = allCategories.filter(c => !c.summary || c.summary === '');
    console.log(`  Found ${needsSummary.length} categories without summaries (of ${allCategories.length} total)`);
    
    if (needsSummary.length > 0 && !options.dryRun) {
      let processed = 0;
      const updates: { id: number; summary: string }[] = [];
      
      for (let i = 0; i < needsSummary.length; i += batchSize) {
        const batch = needsSummary.slice(i, i + batchSize);
        const names = batch.map(c => c.category);
        
        process.stdout.write(`  Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(needsSummary.length / batchSize)}...`);
        
        const results = await generateSummaries(names, 'category', apiKey);
        
        // Match results back to categories
        for (const result of results) {
          const category = batch.find(c => 
            c.category.toLowerCase() === result.name.toLowerCase()
          );
          if (category && result.summary) {
            updates.push({ id: category.id, summary: result.summary });
            processed++;
          }
        }
        
        console.log(` ✓ (${results.length} summaries)`);
      }
      
      // Update database
      if (updates.length > 0) {
        console.log(`  💾 Updating ${updates.length} categories in database...`);
        
        const updatedCategories = allCategories.map(c => {
          const update = updates.find(u => u.id === c.id);
          if (update) {
            return { ...c, summary: update.summary };
          }
          return c;
        });
        
        // Convert Arrow Vectors to native arrays
        const migratedCategories = updatedCategories.map(row => {
          const toArray = (val: any) => {
            if (!val) return [''];
            if (Array.isArray(val)) return val.length > 0 ? val : [''];
            if (typeof val === 'object' && 'toArray' in val) {
              const arr = Array.from(val.toArray());
              return arr.length > 0 ? arr : [''];
            }
            return [''];
          };
          
          const toNumberArray = (val: any) => {
            if (!val) return [0];
            if (Array.isArray(val)) return val.length > 0 ? val : [0];
            if (typeof val === 'object' && 'toArray' in val) {
              const arr = Array.from(val.toArray()) as number[];
              return arr.length > 0 ? arr : [0];
            }
            return [0];
          };
          
          return {
            id: row.id,
            category: row.category || '',
            description: row.description || '',
            summary: row.summary || '',
            parent_category_id: row.parent_category_id ?? null,
            aliases: toArray(row.aliases),
            related_categories: toNumberArray(row.related_categories),
            document_count: row.document_count || 0,
            chunk_count: row.chunk_count || 0,
            concept_count: row.concept_count || 0,
            vector: Array.isArray(row.vector) ? row.vector : Array.from(row.vector?.toArray?.() || [])
          };
        });
        
        await db.dropTable('categories');
        await db.createTable('categories', migratedCategories, { mode: 'overwrite' });
        
        console.log(`  ✅ Updated ${updates.length} category summaries`);
      }
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
  dryRun: args.includes('--dry-run')
};

populateSummaries(dbPath, options)
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });

