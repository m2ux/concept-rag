# Migration Plan: Category Search Feature

**Date**: 2025-11-19  
**Status**: Planning  
**Risk Level**: Medium  
**Estimated Duration**: 3-4 hours (AI agent work) + database rebuild time + user approval waits

## Executive Summary

This document outlines a phased, backward-compatible migration to implement categories as first-class entities with their own table and integer ID cross-references. The approach follows the proven patterns from [integer-id-optimization](../2025-11-19-integer-id-optimization/).

**Key principle**: Introduce new category infrastructure alongside existing fields, validate in parallel, maintain backward compatibility throughout.

## Migration Phases Overview

**Critical Safety Principle**: Test everything on sample-docs first, get user approval, then apply to main database.

### Phase 0: Pre-Migration (Preparation) ⏱️ ~15 minutes

#### 0.1 Backup and Validation

```bash
# Backup existing database
cp -r ~/.concept_rag ~/.concept_rag.backup.$(date +%Y%m%d_%H%M%S)

# Document current state
npx tsx -e "
  const lancedb = require('@lancedb/lancedb');
  const db = await lancedb.connect('~/.concept_rag');
  console.log('Tables:', await db.tableNames());
  for (const name of await db.tableNames()) {
    const table = await db.openTable(name);
    console.log(\`\${name}: \${await table.countRows()} rows\`);
  }
" > .engineering/artifacts/planning/2025-11-19-category-search-feature/pre-migration-state.txt
```

**Outputs**:
- Backup location: `~/.concept_rag.backup.YYYYMMDD_HHMMSS`
- State snapshot: `pre-migration-state.txt`

#### 0.2 Extract Current Categories

**File**: `scripts/extract_categories.ts`

```typescript
import { connect } from '@lancedb/lancedb';
import * as fs from 'fs';

async function extractCategories() {
  const db = await connect('~/.concept_rag');
  
  const categorySet = new Set<string>();
  const categoryStats = new Map<string, {
    documentCount: number;
    chunkCount: number;
    conceptCount: number;
    sources: Set<string>;
  }>();
  
  // Extract from catalog
  const catalogTable = await db.openTable('catalog');
  const catalogRows = await catalogTable.toArray();
  
  for (const row of catalogRows) {
    if (row.concept_categories) {
      const categories = JSON.parse(row.concept_categories);
      categories.forEach((cat: string) => {
        categorySet.add(cat);
        if (!categoryStats.has(cat)) {
          categoryStats.set(cat, {
            documentCount: 0,
            chunkCount: 0,
            conceptCount: 0,
            sources: new Set()
          });
        }
        const stats = categoryStats.get(cat)!;
        stats.documentCount++;
        stats.sources.add(row.source);
      });
    }
  }
  
  // Extract from chunks
  const chunksTable = await db.openTable('chunks');
  const chunkRows = await chunksTable.toArray();
  
  for (const row of chunkRows) {
    if (row.concept_categories) {
      const categories = JSON.parse(row.concept_categories);
      categories.forEach((cat: string) => {
        categorySet.add(cat);
        if (categoryStats.has(cat)) {
          categoryStats.get(cat)!.chunkCount++;
        }
      });
    }
  }
  
  // Extract from concepts
  const conceptsTable = await db.openTable('concepts');
  const conceptRows = await conceptsTable.toArray();
  
  for (const row of conceptRows) {
    if (row.category) {
      categorySet.add(row.category);
      if (categoryStats.has(row.category)) {
        categoryStats.get(row.category)!.conceptCount++;
      }
    }
  }
  
  // Sort for deterministic order
  const sortedCategories = Array.from(categorySet).sort();
  
  // Create stable ID mapping
  const categoryMapping = {
    categories: sortedCategories.map((cat, idx) => ({
      id: idx.toString(),
      category: cat,
      documentCount: categoryStats.get(cat)?.documentCount || 0,
      chunkCount: categoryStats.get(cat)?.chunkCount || 0,
      conceptCount: categoryStats.get(cat)?.conceptCount || 0,
      sources: Array.from(categoryStats.get(cat)?.sources || [])
    })),
    generated_at: new Date().toISOString(),
    total_categories: sortedCategories.length
  };
  
  // Save mapping
  fs.writeFileSync(
    '.engineering/artifacts/planning/2025-11-19-category-search-feature/category-mapping.json',
    JSON.stringify(categoryMapping, null, 2)
  );
  
  console.log(`✅ Extracted ${sortedCategories.length} categories`);
  console.log(`📊 Statistics: ${JSON.stringify(Array.from(categoryStats.entries()).slice(0, 5))}`);
  
  return categoryMapping;
}

await extractCategories();
```

**Run**:
```bash
npx tsx scripts/extract_categories.ts
```

**Validation**:
```bash
# Verify uniqueness
jq '.categories | length' .engineering/artifacts/planning/2025-11-19-category-search-feature/category-mapping.json
jq '.total_categories' .engineering/artifacts/planning/2025-11-19-category-search-feature/category-mapping.json
# Should match

# Check for duplicates
jq '.categories[].category' .engineering/artifacts/planning/2025-11-19-category-search-feature/category-mapping.json | sort | uniq -d
# Should be empty
```

#### 0.3 Analyze Storage

```typescript
// scripts/analyze_category_storage.ts
async function analyzeStorage() {
  // Calculate current storage used by concept_categories fields
  // Estimate savings with integer IDs
  // Output: storage-analysis.json
}
```

---

### Phase 0.5: TEST DATABASE WITH SAMPLE-DOCS ⏱️ ~30-45 minutes

**CRITICAL**: This phase tests the entire new schema on sample-docs BEFORE touching main database.

**🎯 Goal**: Validate new design works correctly, show results to user for approval

#### 0.5.1 Create Test Database

**Location**: `~/.concept_rag_test/` (separate from main `~/.concept_rag/`)

```bash
# Ensure clean test environment
rm -rf ~/.concept_rag_test

# Create test database marker
mkdir -p ~/.concept_rag_test
```

#### 0.5.2 Update Test Configuration

**File**: `scripts/test_category_migration.ts`

```typescript
import { connect } from '@lancedb/lancedb';
import * as fs from 'fs';
import * as path from 'path';

const TEST_DB_PATH = path.join(process.env.HOME!, '.concept_rag_test');
const SAMPLE_DOCS_PATH = './sample-docs';

async function testCategoryMigration() {
  console.log('🧪 TESTING CATEGORY MIGRATION ON SAMPLE-DOCS');
  console.log(`📁 Test DB: ${TEST_DB_PATH}`);
  console.log(`📚 Sample docs: ${SAMPLE_DOCS_PATH}`);
  console.log('=' .repeat(80));
  
  // Connect to test database
  const db = await connect(TEST_DB_PATH);
  
  // Get sample docs
  const sampleDocs = fs.readdirSync(SAMPLE_DOCS_PATH)
    .filter(f => f.endsWith('.pdf') || f.endsWith('.epub'))
    .map(f => path.join(SAMPLE_DOCS_PATH, f));
  
  console.log(`\n📖 Found ${sampleDocs.length} sample documents:`);
  sampleDocs.forEach(doc => console.log(`  - ${path.basename(doc)}`));
  
  // Run full ingestion with new schema
  console.log('\n🔄 Running ingestion with new schema...');
  // ... (use hybrid_fast_seed logic but with test DB)
  
  return { db, sampleDocs };
}
```

#### 0.5.3 Build Test Database with New Schema

Run modified ingestion that:
1. Uses `~/.concept_rag_test/` as database path
2. Processes only files in `sample-docs/` folder
3. Creates tables with new schema:
   - `categories` table (new)
   - `concepts` table with integer `id` (NO category_id - concepts are category-agnostic)
   - `catalog` table with integer `concept_ids` and `category_ids` (categories stored on documents)
   - `chunks` table with integer `concept_ids` and `category_ids` (inherited from catalog)

```bash
# Run test ingestion
npx tsx scripts/test_category_migration.ts --build

# Expected output:
# 🧪 TESTING CATEGORY MIGRATION
# 📚 Processing 6 sample documents
# ✅ Categories table: 12 categories created
# ✅ Concepts table: 450 concepts (NO category field)
# ✅ Catalog table: 6 documents with category_ids stored
# ✅ Chunks table: 320 chunks with category_ids inherited
```

#### 0.5.4 Validate Schema Structure

**File**: `scripts/validate_test_schema.ts`

```typescript
async function validateTestSchema() {
  const db = await connect(TEST_DB_PATH);
  
  console.log('\n🔍 SCHEMA VALIDATION');
  console.log('=' .repeat(80));
  
  // Check categories table exists
  const tables = await db.tableNames();
  console.log(`\n📋 Tables found: ${tables.join(', ')}`);
  
  if (!tables.includes('categories')) {
    throw new Error('❌ Categories table not found!');
  }
  console.log('✅ Categories table exists');
  
  // Validate categories table
  const categoriesTable = await db.openTable('categories');
  const sampleCategory = (await categoriesTable.limit(1).toArray())[0];
  
  console.log('\n📊 Categories table sample:');
  console.log(`  - id type: ${typeof sampleCategory.id} (should be: number)`);
  console.log(`  - category: ${sampleCategory.category}`);
  console.log(`  - document_count: ${sampleCategory.document_count}`);
  console.log(`  - parent_category_id type: ${typeof sampleCategory.parent_category_id}`);
  
  if (typeof sampleCategory.id !== 'number') {
    throw new Error('❌ Category ID is not a number!');
  }
  console.log('✅ Category IDs are native integers');
  
  // Validate concepts table
  const conceptsTable = await db.openTable('concepts');
  const sampleConcept = (await conceptsTable.limit(1).toArray())[0];
  
  console.log('\n🧠 Concepts table sample:');
  console.log(`  - id: ${sampleConcept.id}`);
  console.log(`  - concept: ${sampleConcept.concept}`);
  console.log(`  - catalog_ids: ${sampleConcept.catalog_ids}`);
  
  if (sampleConcept.category_id !== undefined) {
    throw new Error('❌ Concept should NOT have category_id field!');
  }
  console.log('✅ Concepts have NO category field (category-agnostic)');
  
  // Check catalog_ids are integers
  const catalogIds = JSON.parse(sampleConcept.catalog_ids || '[]');
  if (catalogIds.length > 0 && typeof catalogIds[0] !== 'number') {
    throw new Error('❌ catalog_ids are not integers!');
  }
  console.log('✅ Concept catalog_ids are native integers');
  
  // Validate catalog table
  const catalogTable = await db.openTable('catalog');
  const sampleDoc = (await catalogTable.limit(1).toArray())[0];
  
  console.log('\n📄 Catalog table sample:');
  console.log(`  - source: ${sampleDoc.source}`);
  console.log(`  - concept_ids: ${sampleDoc.concept_ids}`);
  console.log(`  - concept_categories: ${sampleDoc.concept_categories}`);
  
  // Verify concept_ids are integers
  const conceptIds = JSON.parse(sampleDoc.concept_ids || '[]');
  if (conceptIds.length > 0 && typeof conceptIds[0] !== 'number') {
    throw new Error('❌ Catalog concept_ids are not integers!');
  }
  console.log('✅ Catalog concept_ids are native integers');
  
  // Verify category_ids field exists (categories stored on documents)
  if (!sampleDoc.category_ids) {
    throw new Error('❌ Catalog missing category_ids field!');
  }
  const categoryIds = JSON.parse(sampleDoc.category_ids);
  if (categoryIds.length === 0 || typeof categoryIds[0] !== 'number') {
    throw new Error('❌ Catalog category_ids are not integers!');
  }
  console.log('✅ Catalog has category_ids field with integer IDs (stored on documents)');
  
  // Validate chunks table
  const chunksTable = await db.openTable('chunks');
  const sampleChunk = (await chunksTable.limit(1).toArray())[0];
  
  console.log('\n📝 Chunks table sample:');
  console.log(`  - id: ${sampleChunk.id}`);
  console.log(`  - concept_ids: ${sampleChunk.concept_ids}`);
  
  const chunkConceptIds = JSON.parse(sampleChunk.concept_ids || '[]');
  if (chunkConceptIds.length > 0 && typeof chunkConceptIds[0] !== 'number') {
    throw new Error('❌ Chunk concept_ids are not integers!');
  }
  console.log('✅ Chunk concept_ids are native integers');
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ ALL SCHEMA VALIDATIONS PASSED');
  
  return true;
}
```

Run validation:
```bash
npx tsx scripts/validate_test_schema.ts
```

#### 0.5.5 Test Category Derivation

**File**: `scripts/test_category_derivation.ts`

```typescript
async function testCategoryDerivation() {
  const db = await connect(TEST_DB_PATH);
  
  console.log('\n🧪 TESTING CATEGORY DERIVATION');
  console.log('=' .repeat(80));
  
  // Initialize caches
  const categoryCache = CategoryIdCache.getInstance();
  await categoryCache.initialize(categoryRepo, conceptRepo);
  
  console.log(`\n✅ CategoryIdCache initialized:`);
  console.log(`   - Categories: ${categoryCache.getStats().categoryCount}`);
  console.log(`   - Memory: ${Math.round(categoryCache.getStats().memorySizeEstimate / 1024)} KB`);
  
  // Test 1: Get categories for a document
  const catalogTable = await db.openTable('catalog');
  const testDoc = (await catalogTable.limit(1).toArray())[0];
  
  console.log(`\n📄 Test Document: ${path.basename(testDoc.source)}`);
  console.log(`   - concept_ids: ${testDoc.concept_ids}`);
  
  const conceptIds: number[] = JSON.parse(testDoc.concept_ids);
  const categoryIds = categoryCache.getCategoriesForConcepts(conceptIds);
  const categoryNames = categoryCache.getNames(categoryIds);
  
  console.log(`   - Derived categories: ${categoryNames.join(', ')}`);
  
  // Verify against old format (if present for comparison)
  if (testDoc.concept_categories && testDoc.concept_categories !== '[]') {
    const oldCategories = JSON.parse(testDoc.concept_categories);
    const match = categoryNames.sort().join(',') === oldCategories.sort().join(',');
    console.log(`   - Matches old format: ${match ? '✅ YES' : '❌ NO'}`);
  }
  
  // Test 2: Find documents in a category
  const testCategoryId = categoryIds[0];
  const testCategoryName = categoryNames[0];
  
  console.log(`\n🔍 Finding documents in category "${testCategoryName}" (id: ${testCategoryId})`);
  
  // Direct query on catalog.category_ids (categories stored on documents)
  const allDocs = await catalogTable.toArray();
  const docsInCategory = allDocs.filter(doc => {
    const docCategories: number[] = JSON.parse(doc.category_ids || '[]');
    return docCategories.includes(testCategoryId);
  });
  
  console.log(`   - Documents found: ${docsInCategory.length}`);
  docsInCategory.forEach(doc => {
    console.log(`     • ${path.basename(doc.source)}`);
  });
  
  // Test 3: List all categories with stats
  console.log(`\n📊 All Categories:`);
  const allCategories = categoryCache.exportAll();
  allCategories.sort((a, b) => b.documentCount - a.documentCount);
  
  allCategories.forEach(cat => {
    console.log(`   ${cat.id}. ${cat.category}`);
    console.log(`      - Documents: ${cat.documentCount}`);
    console.log(`      - Chunks: ${cat.chunkCount}`);
    console.log(`      - Concepts: ${cat.conceptCount}`);
    if (cat.parentCategoryId) {
      const parentName = categoryCache.getName(cat.parentCategoryId);
      console.log(`      - Parent: ${parentName}`);
    }
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ CATEGORY DERIVATION TESTS PASSED');
}
```

Run tests:
```bash
npx tsx scripts/test_category_derivation.ts
```

#### 0.5.6 Test Category Search Tool

```typescript
async function testCategorySearchTool() {
  console.log('\n🔧 TESTING CATEGORY SEARCH TOOL');
  console.log('=' .repeat(80));
  
  // Initialize repositories and cache
  const container = new Container(TEST_DB_PATH);
  const categoryCache = await container.getCategoryIdCache();
  const catalogRepo = await container.getCatalogRepository();
  const chunkRepo = await container.getChunkRepository();
  const conceptRepo = await container.getConceptRepository();
  
  // Test category_search tool
  const testCategory = categoryCache.getAllNames()[0];
  console.log(`\n🔍 Testing category_search for: "${testCategory}"`);
  
  const result = await categorySearch(
    { category: testCategory, limit: 5 },
    categoryCache,
    catalogRepo,
    chunkRepo,
    conceptRepo
  );
  
  console.log('\n📋 Tool Output:');
  console.log(result);
  
  // Verify result structure
  const parsed = JSON.parse(result);
  console.log('\n✅ Result Structure:');
  console.log(`   - Category ID: ${parsed.category.id} (type: ${typeof parsed.category.id})`);
  console.log(`   - Category name: ${parsed.category.name}`);
  console.log(`   - Documents: ${parsed.documents.length}`);
  console.log(`   - Concepts: ${parsed.concepts.length}`);
  console.log(`   - Statistics: ${JSON.stringify(parsed.statistics)}`);
  
  if (typeof parsed.category.id !== 'number') {
    throw new Error('❌ Category ID in result is not a number!');
  }
  
  console.log('\n✅ CATEGORY SEARCH TOOL WORKS CORRECTLY');
}
```

#### 0.5.7 Performance Benchmarks on Test Data

```typescript
async function benchmarkTestDatabase() {
  console.log('\n⚡ PERFORMANCE BENCHMARKS (Sample Docs)');
  console.log('=' .repeat(80));
  
  const db = await connect(TEST_DB_PATH);
  const categoryCache = CategoryIdCache.getInstance();
  
  // Benchmark 1: Category derivation speed
  const catalogTable = await db.openTable('catalog');
  const allDocs = await catalogTable.toArray();
  
  const start1 = Date.now();
  for (const doc of allDocs) {
    const conceptIds: number[] = JSON.parse(doc.concept_ids);
    const categoryIds = categoryCache.getCategoriesForConcepts(conceptIds);
  }
  const time1 = Date.now() - start1;
  
  console.log(`\n⏱️  Category Derivation:`);
  console.log(`   - ${allDocs.length} documents processed`);
  console.log(`   - Time: ${time1}ms`);
  console.log(`   - Per document: ${(time1 / allDocs.length).toFixed(2)}ms`);
  
  // Benchmark 2: Find documents in category
  const testCategoryId = 1;
  
  const start2 = Date.now();
  const docsInCategory = allDocs.filter(doc => {
    const docCategories: number[] = JSON.parse(doc.category_ids || '[]');
    return docCategories.includes(testCategoryId);
  });
  const time2 = Date.now() - start2;
  
  console.log(`\n⏱️  Category Filtering:`);
  console.log(`   - ${allDocs.length} documents scanned`);
  console.log(`   - ${docsInCategory.length} matches found`);
  console.log(`   - Time: ${time2}ms`);
  
  // Benchmark 3: List all categories
  const start3 = Date.now();
  const allCategories = categoryCache.exportAll();
  const time3 = Date.now() - start3;
  
  console.log(`\n⏱️  List Categories:`);
  console.log(`   - ${allCategories.length} categories`);
  console.log(`   - Time: ${time3}ms (cached)`);
  
  console.log('\n✅ PERFORMANCE BENCHMARKS COMPLETE');
}
```

#### 0.5.8 Generate Test Report

**File**: `scripts/generate_test_report.ts`

```typescript
async function generateTestReport() {
  const report = {
    timestamp: new Date().toISOString(),
    testDatabase: TEST_DB_PATH,
    sampleDocs: [],
    schemaValidation: {},
    categoryDerivation: {},
    performance: {},
    toolTests: {},
    storageAnalysis: {}
  };
  
  // Collect all test results
  // ... (aggregate from previous test runs)
  
  // Write report
  const reportPath = '.engineering/artifacts/planning/2025-11-19-category-search-feature/test-results.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Generate markdown summary
  const summary = `
# Category Search Test Results

**Test Date**: ${report.timestamp}
**Test Database**: ${TEST_DB_PATH}
**Sample Documents**: ${report.sampleDocs.length}

## Schema Validation
${report.schemaValidation.passed ? '✅ PASSED' : '❌ FAILED'}

## Category Derivation
${report.categoryDerivation.passed ? '✅ PASSED' : '❌ FAILED'}

## Performance
- Category derivation: ${report.performance.derivationTimeMs}ms avg
- Category filtering: ${report.performance.filteringTimeMs}ms
- List categories: ${report.performance.listTimeMs}ms

## Tool Tests
- category_search: ${report.toolTests.categorySearch ? '✅ PASSED' : '❌ FAILED'}
- list_categories: ${report.toolTests.listCategories ? '✅ PASSED' : '❌ FAILED'}

## Storage Analysis
- Categories table: ${report.storageAnalysis.categoriesSize}
- Catalog/chunks with category_ids: ${report.storageAnalysis.categoryIdsSize}
- Total savings vs old format: ${report.storageAnalysis.savingsPercent}%

## Recommendations
${report.schemaValidation.passed && report.categoryDerivation.passed && report.toolTests.categorySearch
  ? '✅ **READY TO PROCEED** with main database migration'
  : '⚠️  **ISSUES FOUND** - Review failures before proceeding'}
`;
  
  const summaryPath = '.engineering/artifacts/planning/2025-11-19-category-search-feature/test-results-summary.md';
  fs.writeFileSync(summaryPath, summary);
  
  console.log('\n📊 TEST REPORT GENERATED');
  console.log(`   - JSON: ${reportPath}`);
  console.log(`   - Summary: ${summaryPath}`);
  
  return report;
}
```

#### 0.5.9 Review Test Results & Get User Approval

**🛑 CHECKPOINT: WAIT FOR USER APPROVAL**

```bash
# Run complete test suite
npx tsx scripts/run_all_tests.ts

# Display summary
cat .engineering/artifacts/planning/2025-11-19-category-search-feature/test-results-summary.md
```

**Display to user**:
```
╔════════════════════════════════════════════════════════════════╗
║                  TEST RESULTS SUMMARY                          ║
║                                                                ║
║  ✅ Schema validation: PASSED                                 ║
║  ✅ Category derivation: PASSED                               ║
║  ✅ Integer IDs: PASSED (native integers confirmed)           ║
║  ✅ Category search tool: PASSED                              ║
║  ✅ Performance: Within acceptable range                      ║
║  ✅ Storage savings: 94% reduction achieved                   ║
║                                                                ║
║  📊 Test Database Statistics:                                 ║
║     - Documents: 6                                            ║
║     - Chunks: 320                                             ║
║     - Concepts: 450                                           ║
║     - Categories: 12                                          ║
║                                                                ║
║  ⚡ Performance (Sample Docs):                                ║
║     - Category derivation: 0.3ms per doc                      ║
║     - Category filtering: 5ms for 6 docs                      ║
║     - List categories: <1ms (cached)                          ║
║                                                                ║
║  💾 Storage Impact:                                           ║
║     - Old format (estimated): ~8 KB                           ║
║     - New format (actual): ~0.5 KB                            ║
║     - Savings: 94%                                            ║
║                                                                ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  🎯 RECOMMENDATION: Ready to proceed with main database       ║
║                                                                ║
║  ⚠️  USER APPROVAL REQUIRED TO CONTINUE                       ║
║                                                                ║
║  Type 'yes' to proceed with main database migration           ║
║  Type 'no' to review test results and make adjustments        ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
```

**User must explicitly approve before Phase 1 begins**

**If issues found**:
- Review test failures
- Fix implementation
- Re-run tests
- Get approval again

**Only proceed to Phase 1 after**:
- ✅ All tests pass
- ✅ User reviews results
- ✅ User types 'yes' to approve

---

### Phase 1: Infrastructure & Schema (Foundation) ⏱️ ~20-30 minutes

**⚠️ PREREQUISITE: Phase 0.5 tests passed and user approved**

#### 1.1 Create Category Domain Model

**File**: `src/domain/models/category.ts`

```typescript
export interface Category {
  id: number;  // Native integer
  category: string;
  description: string;
  parentCategoryId: number | null;  // Native integer
  aliases: string[];
  relatedCategories: number[];  // Array of native integers
  documentCount: number;
  chunkCount: number;
  conceptCount: number;
  embeddings: number[];
}
```

#### 1.2 Create CategoryRepository Interface

**File**: `src/domain/interfaces/category-repository.ts`

```typescript
import type { Category } from '../models/category';

export interface CategoryRepository {
  findAll(): Promise<Category[]>;
  findById(id: string): Promise<Category | null>;
  findByName(name: string): Promise<Category | null>;
  findByAlias(alias: string): Promise<Category | null>;
  findRootCategories(): Promise<Category[]>;
  findChildren(parentId: string): Promise<Category[]>;
  getTopCategories(limit: number): Promise<Category[]>;
  searchByName(query: string): Promise<Category[]>;
}
```

#### 1.3 Implement LanceDBCategoryRepository

**File**: `src/infrastructure/lancedb/repositories/lancedb-category-repository.ts`

```typescript
import type { Table } from '@lancedb/lancedb';
import type { CategoryRepository } from '../../../domain/interfaces/category-repository';
import type { Category } from '../../../domain/models/category';
import { parseJsonField } from '../utils/field-parsers';

export class LanceDBCategoryRepository implements CategoryRepository {
  constructor(private table: Table) {}

  async findAll(): Promise<Category[]> {
    const rows = await this.table.toArray();
    return rows.map(row => this.mapRowToCategory(row));
  }

  async findById(id: string): Promise<Category | null> {
    const rows = await this.table.where(`id = "${id}"`).limit(1).toArray();
    return rows.length > 0 ? this.mapRowToCategory(rows[0]) : null;
  }

  async findByName(name: string): Promise<Category | null> {
    const rows = await this.table
      .where(`category = "${name}"`)
      .limit(1)
      .toArray();
    return rows.length > 0 ? this.mapRowToCategory(rows[0]) : null;
  }

  async findByAlias(alias: string): Promise<Category | null> {
    // Linear scan (small table, acceptable performance)
    const all = await this.findAll();
    return all.find(cat => 
      cat.aliases.some(a => a.toLowerCase() === alias.toLowerCase())
    ) || null;
  }

  async findRootCategories(): Promise<Category[]> {
    const rows = await this.table
      .where('parent_category_id IS NULL')
      .toArray();
    return rows.map(row => this.mapRowToCategory(row));
  }

  async findChildren(parentId: string): Promise<Category[]> {
    const rows = await this.table
      .where(`parent_category_id = "${parentId}"`)
      .toArray();
    return rows.map(row => this.mapRowToCategory(row));
  }

  async getTopCategories(limit: number): Promise<Category[]> {
    const all = await this.findAll();
    return all
      .sort((a, b) => b.documentCount - a.documentCount)
      .slice(0, limit);
  }

  async searchByName(query: string): Promise<Category[]> {
    const lowerQuery = query.toLowerCase();
    const all = await this.findAll();
    return all.filter(cat => 
      cat.category.toLowerCase().includes(lowerQuery)
    );
  }

  private mapRowToCategory(row: any): Category {
    return {
      id: row.id,
      category: row.category,
      description: row.description || '',
      parentCategoryId: row.parent_category_id || null,
      aliases: parseJsonField(row.aliases),
      relatedCategories: parseJsonField(row.related_categories),
      documentCount: row.document_count || 0,
      chunkCount: row.chunk_count || 0,
      conceptCount: row.concept_count || 0,
      embeddings: row.vector || []
    };
  }
}
```

#### 1.4 Implement CategoryIdCache

**File**: `src/infrastructure/cache/category-id-cache.ts`

See [03-category-id-cache-design.md](./03-category-id-cache-design.md) for full implementation.

#### 1.5 Update Schema Validators

**File**: `src/infrastructure/lancedb/utils/schema-validators.ts`

```typescript
export function validateCategoryRow(row: any): void {
  if (typeof row.id !== 'string') {
    throw new Error('category.id must be string');
  }
  if (typeof row.category !== 'string' || row.category.trim() === '') {
    throw new Error('category.category must be non-empty string');
  }
  if (typeof row.description !== 'string') {
    throw new Error('category.description must be string');
  }
  if (row.parent_category_id !== null && typeof row.parent_category_id !== 'string') {
    throw new Error('category.parent_category_id must be string or null');
  }
  if (!Array.isArray(row.vector) || row.vector.length !== 384) {
    throw new Error('category.vector must be array of 384 numbers');
  }
}

// Update existing validators for new category_ids field
export function validateCatalogEntry(entry: any): void {
  // ... existing validations ...
  
  // NEW: category_ids is optional
  if (entry.category_ids !== undefined && typeof entry.category_ids !== 'string') {
    throw new Error('catalog.category_ids must be string (JSON array)');
  }
}

export function validateChunkRow(row: any): void {
  // ... existing validations ...
  
  // NEW: category_ids is optional
  if (row.category_ids !== undefined && typeof row.category_ids !== 'string') {
    throw new Error('chunk.category_ids must be string (JSON array)');
  }
}

export function validateConceptRow(row: any): void {
  // ... existing validations ...
  
  // Concepts should NOT have category_id field
  if (row.category_id !== undefined) {
    console.warn('⚠️  Concept has category_id field - concepts should be category-agnostic');
  }
}
```

#### 1.6 Update TypeScript Interfaces

**Key changes**:
- **Catalog**: Add `category_ids` field (hash-based integers, stored on documents)
- **Chunks**: Add `category_ids` field (inherited from parent catalog entry)
- **Concepts**: NO `category_id` field (concepts are category-agnostic)
- All ID references use `number` type, not `string`

**File**: `src/domain/models/catalog-entry.ts`
```typescript
export interface CatalogEntry {
  // ... existing fields ...
  concept_ids?: number[];   // Native integers (hash-based)
  category_ids?: number[];  // Native integers (hash-based, STORED on documents)
  filename_tags?: string[]; // Extracted from filename
}
```

**File**: `src/domain/models/chunk.ts`
```typescript
export interface Chunk {
  // ... existing fields ...
  concept_ids?: number[];   // Native integers
  category_ids?: number[];  // Native integers (inherited from parent)
}
```

**File**: `src/domain/models/concept.ts`
```typescript
export interface Concept {
  id: number;  // Hash-based
  // ... existing fields ...
  // NO category_id field - concepts are cross-domain!
  catalog_ids?: number[];  // Native integers (hash-based)
}
```

#### 1.7 Update Container for Dependency Injection

**File**: `src/application/container.ts`

```typescript
import { CategoryIdCache } from '../infrastructure/cache/category-id-cache';
import { LanceDBCategoryRepository } from '../infrastructure/lancedb/repositories/lancedb-category-repository';

export class Container {
  private categoryIdCache?: CategoryIdCache;
  private categoryRepository?: CategoryRepository;

  async getCategoryRepository(): Promise<CategoryRepository> {
    if (!this.categoryRepository) {
      const db = await this.getDatabase();
      const table = await db.openTable('categories');
      this.categoryRepository = new LanceDBCategoryRepository(table);
    }
    return this.categoryRepository;
  }

  async getCategoryIdCache(): Promise<CategoryIdCache> {
    if (!this.categoryIdCache) {
      this.categoryIdCache = CategoryIdCache.getInstance();
      const categoryRepo = await this.getCategoryRepository();
      await this.categoryIdCache.initialize(categoryRepo);
    }
    return this.categoryIdCache;
  }
}
```

---

### Phase 2: Categories Table Creation ⏱️ ~20-30 minutes

#### 2.1 Create Category Table Generation Script

**File**: `scripts/create_categories_table.ts`

```typescript
import { connect } from '@lancedb/lancedb';
import { createEmbedder } from '../src/infrastructure/embeddings/embedder-factory';
import * as fs from 'fs';

async function createCategoriesTable() {
  const db = await connect('~/.concept_rag');
  
  // Load category mapping from Phase 0
  const mappingFile = '.engineering/artifacts/planning/2025-11-19-category-search-feature/category-mapping.json';
  const mapping = JSON.parse(fs.readFileSync(mappingFile, 'utf-8'));
  
  const embedder = await createEmbedder();
  
  console.log(`📊 Creating categories table with ${mapping.categories.length} categories...`);
  
  const categoryRecords = [];
  
  for (const catData of mapping.categories) {
    // Generate description (simple for now, can be enhanced later)
    const description = await generateDescription(catData.category);
    
    // Generate embedding
    const embeddingText = `${catData.category}: ${description}`;
    const vector = await embedder.embed(embeddingText);
    
    // Infer parent category (rule-based for now)
    const parentCategoryId = inferParentCategory(catData.category, mapping.categories);
    
    // Find related categories (co-occurrence analysis)
    const relatedCategoryIds = await findRelatedCategories(catData.category, catData.sources, mapping);
    
    categoryRecords.push({
      id: catData.id,
      category: catData.category,
      description: description,
      parent_category_id: parentCategoryId,
      aliases: JSON.stringify(generateAliases(catData.category)),
      related_categories: JSON.stringify(relatedCategoryIds),
      document_count: catData.documentCount,
      chunk_count: catData.chunkCount,
      concept_count: catData.conceptCount,
      vector: vector
    });
  }
  
  // Create table
  const table = await db.createTable('categories', categoryRecords, {
    mode: 'overwrite'
  });
  
  // Create vector index
  if (categoryRecords.length >= 256) {
    await table.createIndex({
      column: 'vector',
      type: 'ivf_pq',
      num_partitions: Math.max(2, Math.ceil(categoryRecords.length / 100)),
      num_sub_vectors: 8
    });
  }
  
  console.log(`✅ Categories table created with ${categoryRecords.length} entries`);
  
  return table;
}

function generateDescription(category: string): string {
  // Simple rule-based descriptions for common categories
  const descriptions = {
    'software architecture': 'Patterns, principles, and practices for designing and structuring software systems',
    'distributed systems': 'Systems with components on networked computers that coordinate their actions',
    'web development': 'Creation and maintenance of websites and web applications',
    'database design': 'Structuring, organizing, and managing data storage systems',
    'machine learning': 'AI systems that learn and improve from experience without explicit programming',
    // Add more as needed
  };
  
  return descriptions[category] || `Concepts and practices related to ${category}`;
}

function inferParentCategory(category: string, allCategories: any[]): string | null {
  // Simple rule-based parent inference
  const parentRules = {
    'microservices': 'software architecture',
    'design patterns': 'software architecture',
    'API design': 'software architecture',
    'neural networks': 'machine learning',
    'deep learning': 'machine learning',
    // Add more as needed
  };
  
  const parentName = parentRules[category];
  if (parentName) {
    const parent = allCategories.find(c => c.category === parentName);
    return parent?.id || null;
  }
  
  return null;
}

function generateAliases(category: string): string[] {
  // Common aliases
  const aliases = {
    'machine learning': ['ML', 'statistical learning'],
    'artificial intelligence': ['AI'],
    'software architecture': ['software design', 'system architecture'],
    // Add more as needed
  };
  
  return aliases[category] || [];
}

async function findRelatedCategories(
  category: string,
  sources: string[],
  mapping: any
): Promise<string[]> {
  // Find categories that appear in same documents
  const coOccurrence = new Map<string, number>();
  
  for (const otherCat of mapping.categories) {
    if (otherCat.category === category) continue;
    
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

await createCategoriesTable();
```

**Run**:
```bash
npx tsx scripts/create_categories_table.ts
```

---

### Phase 3: Update Ingestion Pipeline ⏱️ ~30-40 minutes

#### 3.1 Update hybrid_fast_seed.ts

**Location**: `hybrid_fast_seed.ts` around lines 1000-1700

```typescript
// After concepts table created, create categories table
console.log('\n📊 Creating categories table...');
await createCategoriesTable(db);

// Initialize CategoryIdCache (now requires conceptRepo for reverse index)
const categoryCache = CategoryIdCache.getInstance();
await categoryCache.initialize(categoryRepository, conceptRepository);

// When enriching catalog entries
async function enrichCatalogEntry(entry: any, documentMetadata: any) {
  // Store concepts (hash-based IDs)
  const conceptNames = documentMetadata.primary_concepts || [];
  const conceptIds = conceptNames.map(name => hashToId(name));
  entry.concept_ids = JSON.stringify(conceptIds);
  
  // Store categories (hash-based IDs) - categories belong to documents
  const categoryNames = documentMetadata.categories || [];
  const categoryIds = categoryNames.map(name => hashToId(name));
  entry.category_ids = JSON.stringify(categoryIds);
  
  // Extract and store filename tags
  const filenameTags = extractFilenameTags(entry.source);
  entry.filename_tags = JSON.stringify(filenameTags);
  
  // Origin hash (reserved for ebook origin metadata, set to null for now)
  entry.origin_hash = null;
  
  // Bibliographic metadata (reserved for future, set to null for now)
  entry.author = null;
  entry.year = null;
  entry.publisher = null;
  entry.isbn = null;
  
  return entry;
}

// Helper: Extract tags from filename
function extractFilenameTags(source: string): string[] {
  const filename = path.basename(source, path.extname(source));
  const parts = filename.split('--').map(p => p.trim());
  
  // First part is name, rest are tags
  return parts.length > 1 ? parts.slice(1) : [];
}

// When creating chunks
async function createChunk(chunk: any, parentCatalog: any) {
  // Store concepts (hash-based IDs)
  const conceptIds = chunk.concept_ids;  // Already computed
  chunk.concept_ids = JSON.stringify(conceptIds);
  
  // Inherit categories from parent document
  chunk.category_ids = parentCatalog.category_ids;  // Copy from parent
  
  return chunk;
}

// When creating concepts (NO categories on concepts)
async function createConceptEntry(concept: any) {
  // ... existing fields ...
  
  // Concepts have NO category field
  // They are cross-domain entities that can appear in documents of any category
  
  return concept;
}
```

#### 3.2 Update Standalone Rebuild Scripts

Apply same patterns to:
- `scripts/rebuild_indexes.ts`
- `scripts/reenrich_chunks_with_concepts.ts`
- `rebuild_concept_index_standalone.ts`

---

### Phase 4: Repository Layer Updates ⏱️ ~20-30 minutes

#### 4.1 Update CatalogRepository

```typescript
// Add helper methods for category resolution
async getCategoryIds(entry: CatalogEntry): Promise<number[]> {
  // Categories already stored on document
  if (entry.category_ids) {
    return JSON.parse(entry.category_ids);
  }
  return [];
}

async getCategoryNames(entry: CatalogEntry): Promise<string[]> {
  const categoryIds = await this.getCategoryIds(entry);
  return this.categoryIdCache.getNames(categoryIds);
}

async findByCategory(categoryId: number): Promise<CatalogEntry[]> {
  // Direct query on catalog.category_ids (categories stored on documents)
  const rows = await this.table.toArray();
  return rows.filter(row => {
    if (row.category_ids) {
      const docCategories: number[] = JSON.parse(row.category_ids);
      return docCategories.includes(categoryId);
    }
    return false;
  }).map(row => this.mapRowToCatalogEntry(row));
}
```

#### 4.2 Update ChunkRepository

Similar pattern - add category resolution methods.

#### 4.3 Update ConceptRepository

**Note**: Concepts have NO categories in the corrected design.

No category-related methods needed for ConceptRepository. Concepts are category-agnostic and can appear in documents of any category.

---

### Phase 5: Category Search Tools ⏱️ ~20-25 minutes

#### 5.1 Implement category_search Tool

**File**: `src/tools/operations/category-search.ts`

```typescript
import type { CategoryIdCache } from '../../infrastructure/cache/category-id-cache';
import type { CatalogRepository } from '../../domain/interfaces/catalog-repository';
import type { ChunkRepository } from '../../domain/interfaces/chunk-repository';
import type { ConceptRepository } from '../../domain/interfaces/concept-repository';

export interface CategorySearchParams {
  category: string;  // Name, ID, or alias
  includeChildren?: boolean;  // Include child categories in hierarchy
  limit?: number;
}

export async function categorySearch(
  params: CategorySearchParams,
  categoryCache: CategoryIdCache,
  catalogRepo: CatalogRepository,
  chunkRepo: ChunkRepository,
  conceptRepo: ConceptRepository
): Promise<string> {
  // Resolve category ID
  const categoryId = categoryCache.getIdByAlias(params.category) 
    || categoryCache.getId(params.category);
  
  if (!categoryId) {
    return JSON.stringify({
      error: `Category not found: ${params.category}`,
      suggestion: 'Try listing all categories first'
    }, null, 2);
  }
  
  // Get category metadata
  const metadata = categoryCache.getMetadata(categoryId);
  const statistics = categoryCache.getStatistics(categoryId);
  
  // Determine which categories to search
  const categoryIdsToSearch = [categoryId];
  if (params.includeChildren) {
    const children = categoryCache.getChildren(categoryId);
    categoryIdsToSearch.push(...children);
  }
  
  // Find all entities in this category
  const documents = [];
  for (const id of categoryIdsToSearch) {
    const docs = await catalogRepo.findByCategory(id);
    documents.push(...docs);
  }
  
  const concepts = [];
  for (const id of categoryIdsToSearch) {
    const cons = await conceptRepo.findByCategory(id);
    concepts.push(...cons);
  }
  
  // Format results
  return JSON.stringify({
    category: {
      id: categoryId,
      name: metadata?.category,
      description: metadata?.description,
      hierarchy: categoryCache.getHierarchyPathNames(categoryId),
      aliases: metadata?.aliases || [],
      relatedCategories: (metadata?.relatedCategories || []).map(id => 
        categoryCache.getName(id)
      )
    },
    statistics: {
      totalDocuments: statistics?.documentCount || 0,
      totalChunks: statistics?.chunkCount || 0,
      totalConcepts: statistics?.conceptCount || 0
    },
    documents: documents.slice(0, params.limit || 10).map(doc => ({
      source: doc.source,
      preview: doc.text.substring(0, 200) + '...',
      concepts: doc.concepts?.slice(0, 5) || []
    })),
    concepts: concepts.slice(0, params.limit || 20).map(con => ({
      name: con.concept,
      type: con.conceptType,
      weight: con.weight,
      chunkCount: con.chunkCount
    }))
  }, null, 2);
}
```

#### 5.2 Register Tool in MCP Server

**File**: `src/tools/conceptual_registry.ts`

```typescript
server.tool(
  'category_search',
  'Search for documents, chunks, and concepts by category',
  {
    category: {
      type: 'string',
      description: 'Category name, ID, or alias to search for'
    },
    includeChildren: {
      type: 'boolean',
      description: 'Include child categories in hierarchy (default: false)',
      default: false
    },
    limit: {
      type: 'number',
      description: 'Maximum number of results per type (default: 10)',
      default: 10
    }
  },
  async (params) => {
    return await categorySearch(
      params,
      categoryIdCache,
      catalogRepository,
      chunkRepository,
      conceptRepository
    );
  }
);

server.tool(
  'list_concepts_in_category',
  'List all concepts appearing in documents of a specific category',
  {
    category: {
      type: 'string',
      description: 'Category name, ID, or alias'
    },
    sortBy: {
      type: 'string',
      enum: ['name', 'documentCount', 'weight'],
      description: 'Sort by: name, documentCount, or weight (default: documentCount)',
      default: 'documentCount'
    },
    limit: {
      type: 'number',
      description: 'Maximum number of concepts to return (default: 50)',
      default: 50
    }
  },
  async (params) => {
    return await listConceptsInCategory(
      params,
      categoryIdCache,
      catalogRepository,
      conceptRepository
    );
  }
);
```

---

### Phase 6: Testing & Validation ⏱️ ~30-40 minutes (writing tests) + test execution time

#### 6.1 Unit Tests

Create comprehensive tests for:
- CategoryIdCache
- LanceDBCategoryRepository
- Category search tool
- Category resolution in existing repositories

#### 6.2 Integration Tests

Test end-to-end workflows:
- Database seeding with categories table
- Category search across all entity types
- Backward compatibility with old format
- Category hierarchy navigation

#### 6.3 Migration Validation Script

```typescript
// scripts/validate_category_migration.ts
async function validateMigration() {
  // 1. Verify categories table exists
  // 2. Verify all catalog entries have category_ids
  // 3. Verify category IDs resolve to correct names
  // 4. Verify statistics are accurate
  // 5. Compare old vs new format results
}
```

---

### Phase 7: Main Database Migration ⏱️ ~20-30 minutes (agent work) + database rebuild time

**🛑 CRITICAL PREREQUISITE**: Phase 0.5 tests passed AND user approved

**⚠️  This phase modifies the production database (~/.concept_rag)**

#### 7.1 Pre-Migration Checklist

- [ ] **Phase 0.5 tests passed** with sample-docs
- [ ] **User approved** test results
- [ ] All code changes committed
- [ ] All unit tests passing
- [ ] Main database backed up
- [ ] Category mapping generated from main database
- [ ] Validation scripts tested on test database
- [ ] User confirmation received

**🛑 CHECKPOINT: Confirm user wants to proceed**

```bash
# Display confirmation prompt
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║          MAIN DATABASE MIGRATION ABOUT TO START                ║"
echo "║                                                                ║"
echo "║  This will modify your production database at:                ║"
echo "║  ~/.concept_rag                                               ║"
echo "║                                                                ║"
echo "║  ✅ Test database passed all validations                      ║"
echo "║  ✅ Backup will be created automatically                      ║"
echo "║  ✅ Rollback procedure available if needed                    ║"
echo "║                                                                ║"
echo "║  Type 'PROCEED' (all caps) to continue                        ║"
echo "║  Type anything else to abort                                  ║"
echo "╚════════════════════════════════════════════════════════════════╝"

read -p "Confirmation: " confirmation

if [ "$confirmation" != "PROCEED" ]; then
  echo "❌ Migration aborted by user"
  exit 1
fi

echo "✅ User confirmed - proceeding with migration"
```

#### 7.2 Execute Migration

```bash
# 1. Backup (CRITICAL - do not skip)
BACKUP_PATH=~/.concept_rag.backup.$(date +%Y%m%d_%H%M%S)
echo "📦 Creating backup at: $BACKUP_PATH"
cp -r ~/.concept_rag $BACKUP_PATH
echo "✅ Backup created"

# 2. Extract categories from MAIN database (not test)
echo "📊 Extracting categories from main database..."
npx tsx scripts/extract_categories.ts --source ~/.concept_rag

# 3. Generate categories table
echo "🏗️  Generating categories table..."
npx tsx scripts/create_categories_table.ts --source ~/.concept_rag

# 4. Rebuild MAIN database with new schema
echo "🔄 Rebuilding main database with new schema..."
echo "⚠️  This will take several minutes for large libraries..."
npx tsx hybrid_fast_seed.ts --overwrite --db-path ~/.concept_rag

# 5. Validate migration on MAIN database
echo "🔍 Validating main database migration..."
npx tsx scripts/validate_category_migration.ts --db-path ~/.concept_rag

# 6. Compare with test results
echo "📊 Comparing with test database results..."
npx tsx scripts/compare_test_vs_main.ts

# 7. Test category search on MAIN database
echo "🔧 Testing category search tool on main database..."
npx tsx scripts/test_main_database_tools.ts
```

#### 7.3 Post-Migration Validation

**Comprehensive validation checklist**:

```typescript
// scripts/validate_main_migration.ts
async function validateMainMigration() {
  console.log('\n🔍 VALIDATING MAIN DATABASE MIGRATION');
  console.log('=' .repeat(80));
  
  const mainDb = await connect('~/.concept_rag');
  const testDb = await connect('~/.concept_rag_test');
  
  // 1. Schema validation
  console.log('\n1️⃣  Schema Structure:');
  const tables = await mainDb.tableNames();
  console.log(`   ✅ Tables: ${tables.join(', ')}`);
  
  // 2. Row counts
  console.log('\n2️⃣  Row Counts:');
  for (const tableName of tables) {
    const table = await mainDb.openTable(tableName);
    const count = await table.countRows();
    console.log(`   - ${tableName}: ${count} rows`);
  }
  
  // 3. Category ID types
  console.log('\n3️⃣  ID Type Validation:');
  const categoriesTable = await mainDb.openTable('categories');
  const sampleCat = (await categoriesTable.limit(1).toArray())[0];
  console.log(`   - Category ID type: ${typeof sampleCat.id}`);
  if (typeof sampleCat.id !== 'number') {
    throw new Error('❌ Category IDs are not integers!');
  }
  console.log('   ✅ Category IDs are native integers');
  
  // 4. Category derivation
  console.log('\n4️⃣  Category Derivation:');
  const categoryCache = CategoryIdCache.getInstance();
  await categoryCache.initialize(categoryRepo, conceptRepo);
  
  const catalogTable = await mainDb.openTable('catalog');
  const testDoc = (await catalogTable.limit(1).toArray())[0];
  const conceptIds: number[] = JSON.parse(testDoc.concept_ids);
  const categoryIds = categoryCache.getCategoriesForConcepts(conceptIds);
  console.log(`   - Derived ${categoryIds.length} categories from ${conceptIds.length} concepts`);
  console.log('   ✅ Category derivation working');
  
  // 5. Storage comparison
  console.log('\n5️⃣  Storage Analysis:');
  const mainSize = await getDatabaseSize('~/.concept_rag');
  const backupSize = await getDatabaseSize(BACKUP_PATH);
  const savings = ((backupSize - mainSize) / backupSize * 100).toFixed(1);
  console.log(`   - Backup size: ${backupSize}`);
  console.log(`   - New size: ${mainSize}`);
  console.log(`   - Savings: ${savings}%`);
  
  // 6. Query performance
  console.log('\n6️⃣  Performance Check:');
  const start = Date.now();
  const categoryId = 1;
  const conceptsInCat = categoryCache.getConceptIdsForCategory(categoryId);
  const allDocs = await catalogTable.toArray();
  const filtered = allDocs.filter(doc => {
    const ids: number[] = JSON.parse(doc.concept_ids || '[]');
    return ids.some(id => conceptsInCat.has(id));
  });
  const elapsed = Date.now() - start;
  console.log(`   - Filtered ${allDocs.length} documents in ${elapsed}ms`);
  console.log(`   - Found ${filtered.length} matches`);
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ MAIN DATABASE VALIDATION COMPLETE');
  
  return {
    tablesValid: true,
    idsValid: typeof sampleCat.id === 'number',
    derivationWorks: categoryIds.length > 0,
    storageSavings: savings,
    performanceAcceptable: elapsed < 1000  // Should be <1s for most libraries
  };
}
```

**Run validation**:
```bash
npx tsx scripts/validate_main_migration.ts
```

**Expected output**:
```
✅ MAIN DATABASE VALIDATION COMPLETE

Summary:
  ✅ All tables present and valid
  ✅ Integer IDs confirmed throughout
  ✅ Category derivation working correctly
  ✅ Storage reduced by 28-30%
  ✅ Query performance within acceptable range
  
🎉 Migration successful!
```

#### 7.4 Side-by-Side Comparison (Test vs Main)

```bash
# Compare test database vs main database results
npx tsx scripts/compare_databases.ts

# Expected output:
# 📊 COMPARISON: Test DB vs Main DB
# 
# Categories:
#   Test: 12 categories
#   Main: 45 categories
#   ✅ Proportional to document count
# 
# Schema consistency:
#   ✅ Both use native integer IDs
#   ✅ Both derive categories from concepts
#   ✅ Both have categories table with same structure
# 
# Performance scaling:
#   Test (6 docs): 0.3ms per doc
#   Main (100 docs): 0.4ms per doc
#   ✅ Performance scales linearly
```

#### 7.5 Final User Approval & Migration Completion

**🛑 CHECKPOINT: Present results to user**

After validation passes, display migration summary:

```
╔════════════════════════════════════════════════════════════════╗
║              MAIN DATABASE MIGRATION COMPLETE                  ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  📊 Migration Statistics:                                     ║
║     - Documents processed: 100                                ║
║     - Categories created: 45                                  ║
║     - Concepts with category_id: 8,432                        ║
║     - Storage reduced: 28%                                    ║
║                                                                ║
║  ✅ All Validations Passed:                                   ║
║     ✓ Schema structure correct                                ║
║     ✓ Native integer IDs confirmed                            ║
║     ✓ Category derivation working                             ║
║     ✓ Query performance acceptable                            ║
║     ✓ Category search tool functional                         ║
║                                                                ║
║  💾 Backup Available:                                         ║
║     Location: ~/.concept_rag.backup.20251119_143022          ║
║     Size: 730 MB                                              ║
║     Rollback: Available if needed                             ║
║                                                                ║
║  📁 Test Database:                                            ║
║     Location: ~/.concept_rag_test                             ║
║     Status: Can be deleted (migration complete)               ║
║                                                                ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  🎯 NEXT STEPS:                                               ║
║                                                                ║
║  1. Review validation results above                           ║
║  2. Test category search: category_search tool                ║
║  3. Verify your documents are accessible                      ║
║  4. If satisfied, can delete:                                 ║
║     - Test database: ~/.concept_rag_test                      ║
║     - Old backup (after confirming new DB works)              ║
║                                                                ║
║  ⚠️  Keep backup for at least 7 days before deleting          ║
║                                                                ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  USER APPROVAL:                                               ║
║                                                                ║
║  Are you satisfied with the migration results?                ║
║                                                                ║
║  Type 'accept' to mark migration complete                     ║
║  Type 'rollback' to restore from backup                       ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

Your choice: _
```

**If user types 'accept'**:
```bash
# Mark migration as complete
touch ~/.concept_rag/.migration_complete_$(date +%Y%m%d)

echo "✅ Migration marked as complete"
echo "📝 Updating documentation..."

# Update README or changelog
echo "- $(date +%Y-%m-%d): Categories feature migrated successfully" >> CHANGELOG.md

echo ""
echo "🎉 MIGRATION SUCCESSFULLY COMPLETED!"
echo ""
echo "You can now use:"
echo "  - category_search tool"
echo "  - list_categories tool"
echo ""
echo "⚠️  Remember to keep backup for at least 7 days"
```

**If user types 'rollback'**:
```bash
# Execute rollback procedure (see section 7.6)
npx tsx scripts/rollback_migration.ts
```

#### 7.6 Rollback Procedure (If Needed)

If user is not satisfied with results:

```bash
# scripts/rollback_migration.ts
async function rollbackMigration() {
  console.log('\n⚠️  ROLLING BACK MIGRATION');
  console.log('=' .repeat(80));
  
  const BACKUP_PATH = await findLatestBackup();
  
  if (!BACKUP_PATH) {
    throw new Error('❌ No backup found!');
  }
  
  console.log(`\n📦 Backup found: ${BACKUP_PATH}`);
  console.log(`\n🔄 Restoring database...`);
  
  // 1. Stop any running services
  console.log('1️⃣  Stopping services...');
  // (if applicable)
  
  // 2. Remove current database
  console.log('2️⃣  Removing current database...');
  await fs.rm('~/.concept_rag', { recursive: true });
  
  // 3. Restore from backup
  console.log('3️⃣  Restoring from backup...');
  await fs.cp(BACKUP_PATH, '~/.concept_rag', { recursive: true });
  
  // 4. Verify restoration
  console.log('4️⃣  Verifying restoration...');
  const db = await connect('~/.concept_rag');
  const tables = await db.tableNames();
  console.log(`   ✅ Tables restored: ${tables.join(', ')}`);
  
  // 5. Test queries
  console.log('5️⃣  Testing queries...');
  const catalogTable = await db.openTable('catalog');
  const count = await catalogTable.countRows();
  console.log(`   ✅ Catalog accessible: ${count} documents`);
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ ROLLBACK COMPLETE');
  console.log('   Database restored to pre-migration state');
  console.log('   You can retry migration after reviewing issues');
}
```

---

## Migration Safety Summary

### Checkpoints Requiring User Approval

1. **🛑 Phase 0.5 Complete**: Test results reviewed, user approves proceeding
2. **🛑 Phase 7 Start**: User confirms ready to modify main database  
3. **🛑 Phase 7 Complete**: User reviews results and accepts or rolls back

### Rollback Points

- **Before Phase 7**: No changes to main DB, can abandon anytime
- **During Phase 7**: Automatic backup created, can rollback anytime
- **After Phase 7**: Backup available for 7+ days

### What Gets Tested First

✅ Schema structure (categories table, integer IDs)  
✅ Category derivation logic  
✅ Query performance  
✅ Category search tool  
✅ Storage savings  
✅ Backward compatibility  

**Nothing touches main database until all tests pass AND user approves**

---

## Success Criteria

### Must Have
- [ ] Categories table created successfully
- [ ] All catalog entries have `category_ids` (hash-based integers, stored)
- [ ] All chunk entries have `category_ids` (inherited from catalog)
- [ ] Concepts have NO `category_id` field (category-agnostic)
- [ ] CategoryIdCache working (ID ↔ name resolution)
- [ ] Category search tool functional (direct queries on catalog.category_ids)
- [ ] All existing tests pass
- [ ] Hash-based IDs working throughout (stable across rebuilds)
- [ ] Storage reduced by 50-60% for category fields

### Should Have
- [ ] Category statistics accurate
- [ ] Category hierarchy working
- [ ] Alias resolution functional
- [ ] Related categories computed
- [ ] Migration completes in <30 minutes

### Nice to Have
- [ ] Category descriptions generated
- [ ] Performance benchmarks show improvement
- [ ] Category-based recommendations

---

## Rollback Procedure

If migration fails:

```bash
# 1. Stop all services
# 2. Restore backup
rm -rf ~/.concept_rag
cp -r ~/.concept_rag.backup.YYYYMMDD_HHMMSS ~/.concept_rag

# 3. Revert code changes
git reset --hard HEAD~N  # Where N = number of migration commits

# 4. Rebuild
npm run build

# 5. Verify restoration
npx tsx scripts/validate_category_migration.ts
```

---

## Post-Migration Tasks

1. **Update Documentation**
   - README.md
   - USAGE.md
   - database-schema-reference.md
   - tool-selection-guide.md

2. **Performance Monitoring**
   - Track category search latency
   - Monitor cache hit rates
   - Measure storage savings

3. **User Communication**
   - Announce new category search feature
   - Provide usage examples
   - Document category hierarchy

---

**Status**: Ready for implementation  
**Next Steps**: Begin Phase 0 preparation  
**Date**: 2025-11-19

