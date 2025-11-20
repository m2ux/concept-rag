/**
 * Create Categories Table Script
 * 
 * Generates and populates the categories table with metadata, embeddings,
 * and relationships based on the extracted category mapping.
 * 
 * Usage:
 *   npx tsx scripts/create_categories_table.ts [--db-path <path>] [--mapping <path>]
 * 
 * Input:
 *   Category mapping JSON (from extract_categories.ts)
 * 
 * Output:
 *   categories.lance table in LanceDB with:
 *   - Category metadata
 *   - Vector embeddings
 *   - Hierarchy relationships
 *   - Statistics
 */

import { connect } from '@lancedb/lancedb';
import * as fs from 'fs';
import * as path from 'path';

// Create a simple in-process embedder using the MiniLM model
// This avoids external dependencies for the table creation
async function createEmbedder() {
  // Use dynamic import to load the transformers library
  const { pipeline } = await import('@xenova/transformers');
  
  // Create embedding pipeline with MiniLM model (same as used in main codebase)
  const embedPipeline = await pipeline(
    'feature-extraction',
    'Xenova/all-MiniLM-L6-v2'
  );
  
  return {
    async embed(text: string): Promise<number[]> {
      const output = await embedPipeline(text, {
        pooling: 'mean',
        normalize: true
      });
      
      // Extract the embedding array
      return Array.from(output.data as Float32Array);
    }
  };
}

/**
 * Generate description for a category
 */
function generateDescription(category: string): string {
  // Simple rule-based descriptions for common categories
  const descriptions: Record<string, string> = {
    'software architecture': 'Patterns, principles, and practices for designing and structuring software systems',
    'distributed systems': 'Systems with components on networked computers that coordinate their actions',
    'web development': 'Creation and maintenance of websites and web applications',
    'database design': 'Structuring, organizing, and managing data storage systems',
    'machine learning': 'AI systems that learn and improve from experience without explicit programming',
    'artificial intelligence': 'Computer systems that exhibit intelligent behavior and decision making',
    'cloud computing': 'Delivery of computing services over the internet including servers, storage, and applications',
    'microservices': 'Architectural style structuring applications as collections of loosely coupled services',
    'data science': 'Interdisciplinary field using scientific methods to extract insights from data',
    'devops': 'Practices combining software development and IT operations for faster delivery',
  };
  
  return descriptions[category.toLowerCase()] || `Concepts and practices related to ${category}`;
}

/**
 * Infer parent category using simple heuristics
 */
function inferParentCategory(category: string, allCategories: any[]): number | null {
  // Simple rule-based parent inference
  const parentRules: Record<string, string> = {
    'microservices': 'software architecture',
    'design patterns': 'software architecture',
    'api design': 'software architecture',
    'neural networks': 'machine learning',
    'deep learning': 'machine learning',
    'supervised learning': 'machine learning',
    'unsupervised learning': 'machine learning',
    'reinforcement learning': 'machine learning',
    'natural language processing': 'artificial intelligence',
    'computer vision': 'artificial intelligence',
    'kubernetes': 'cloud computing',
    'docker': 'cloud computing',
    'aws': 'cloud computing',
    'azure': 'cloud computing',
    'ci/cd': 'devops',
    'continuous integration': 'devops',
    'continuous deployment': 'devops',
  };
  
  const parentName = parentRules[category.toLowerCase()];
  if (parentName) {
    const parent = allCategories.find(c => c.category.toLowerCase() === parentName);
    return parent?.id || null;
  }
  
  return null;
}

/**
 * Generate aliases for a category
 */
function generateAliases(category: string): string[] {
  // Common aliases
  const aliases: Record<string, string[]> = {
    'machine learning': ['ML', 'statistical learning'],
    'artificial intelligence': ['AI'],
    'software architecture': ['software design', 'system architecture'],
    'distributed systems': ['distributed computing'],
    'database design': ['data modeling', 'schema design'],
    'web development': ['web engineering', 'frontend', 'backend'],
    'cloud computing': ['cloud services'],
    'natural language processing': ['NLP'],
    'deep learning': ['DL'],
    'devops': ['DevOps'],
    'continuous integration': ['CI'],
    'continuous deployment': ['CD'],
  };
  
  return aliases[category.toLowerCase()] || [];
}

/**
 * Find related categories based on co-occurrence
 */
async function findRelatedCategories(
  category: string,
  sources: string[],
  allCategories: any[]
): Promise<number[]> {
  // Find categories that appear in same documents
  const coOccurrence = new Map<number, number>();
  
  for (const otherCat of allCategories) {
    if (otherCat.category === category) continue;
    
    // Count overlapping sources
    const overlap = sources.filter(s => otherCat.sources.includes(s)).length;
    if (overlap > 0) {
      coOccurrence.set(otherCat.id, overlap);
    }
  }
  
  // Take top 5 most frequently co-occurring
  return Array.from(coOccurrence.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);
}

/**
 * Create categories table from mapping
 */
async function createCategoriesTable(
  dbPath: string = `${process.env.HOME}/.concept_rag`,
  mappingPath: string = '.ai/planning/2025-11-19-category-search-feature/category-mapping.json'
) {
  console.log(`\n📊 Creating categories table...`);
  console.log(`   Database: ${dbPath}`);
  console.log(`   Mapping: ${mappingPath}`);
  console.log('='.repeat(80));
  
  // Load category mapping
  if (!fs.existsSync(mappingPath)) {
    throw new Error(`Category mapping not found: ${mappingPath}`);
  }
  
  const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));
  console.log(`\n✅ Loaded mapping with ${mapping.total_categories} categories`);
  
  if (mapping.categories.length === 0) {
    console.log(`\n⚠️  No categories to create. Skipping table creation.`);
    return null;
  }
  
  // Connect to database
  const db = await connect(dbPath);
  
  // Create embedder
  console.log(`\n🔄 Initializing embedding model...`);
  const embedder = await createEmbedder();
  console.log(`   ✅ Embedder ready`);
  
  // Generate category records
  console.log(`\n🔄 Generating category records...`);
  const categoryRecords = [];
  
  for (const catData of mapping.categories) {
    // Generate description
    const description = generateDescription(catData.category);
    
    // Generate embedding
    const embeddingText = `${catData.category}: ${description}`;
    const vector = await embedder.embed(embeddingText);
    
    // Infer parent category
    const parentCategoryId = inferParentCategory(catData.category, mapping.categories);
    
    // Find related categories
    const relatedCategoryIds = await findRelatedCategories(
      catData.category,
      catData.sources || [],
      mapping.categories
    );
    
    categoryRecords.push({
      id: catData.id,
      category: catData.category,
      description: description,
      parent_category_id: parentCategoryId,
      aliases: JSON.stringify(generateAliases(catData.category)),
      related_categories: JSON.stringify(relatedCategoryIds),
      document_count: catData.documentCount || 0,
      chunk_count: catData.chunkCount || 0,
      concept_count: catData.conceptCount || 0,
      vector: vector
    });
    
    if (categoryRecords.length % 10 === 0) {
      console.log(`   Processed ${categoryRecords.length}/${mapping.categories.length} categories...`);
    }
  }
  
  console.log(`   ✅ Generated ${categoryRecords.length} category records`);
  
  // Create table
  console.log(`\n🔄 Creating categories table in database...`);
  const table = await db.createTable('categories', categoryRecords, {
    mode: 'overwrite'
  });
  
  console.log(`   ✅ Table created`);
  
  // Create vector index if enough categories
  if (categoryRecords.length >= 256) {
    console.log(`\n🔄 Creating vector index...`);
    await table.createIndex({
      column: 'vector',
      type: 'ivf_pq',
      num_partitions: Math.max(2, Math.ceil(categoryRecords.length / 100)),
      num_sub_vectors: 8
    });
    console.log(`   ✅ Vector index created`);
  } else {
    console.log(`\n⚠️  Skipping vector index (only ${categoryRecords.length} categories, need 256+ for IVF_PQ)`);
  }
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log(`✅ Categories table created successfully`);
  console.log(`   - Total categories: ${categoryRecords.length}`);
  console.log(`   - With parents: ${categoryRecords.filter(c => c.parent_category_id !== null).length}`);
  console.log(`   - With aliases: ${categoryRecords.filter(c => JSON.parse(c.aliases).length > 0).length}`);
  console.log(`   - With related: ${categoryRecords.filter(c => JSON.parse(c.related_categories).length > 0).length}`);
  
  return table;
}

// Parse command line arguments
const args = process.argv.slice(2);
let dbPath = `${process.env.HOME}/.concept_rag`;
let mappingPath = '.ai/planning/2025-11-19-category-search-feature/category-mapping.json';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--db-path' && i + 1 < args.length) {
    dbPath = args[i + 1];
    i++;
  } else if (args[i] === '--mapping' && i + 1 < args.length) {
    mappingPath = args[i + 1];
    i++;
  }
}

// Run table creation
try {
  await createCategoriesTable(dbPath, mappingPath);
} catch (error) {
  console.error('\n❌ Error creating categories table:', error);
  process.exit(1);
}

