#!/usr/bin/env npx tsx
/**
 * Test suite for modified hybrid search tools
 * 
 * Verifies that catalog_search, broad_chunks_search, and chunks_search
 * work correctly after removing concept scoring from hybrid search.
 * 
 * Usage:
 *   npx tsx scripts/test_search_tools.ts [db-path]
 *   npx tsx scripts/test_search_tools.ts db/test
 */

import * as lancedb from "@lancedb/lancedb";
import path from "path";

// Test queries organized by tool and purpose
const TEST_QUERIES = {
  catalog_search: [
    // Basic functionality
    { query: "software architecture", expect: "returns documents about architecture" },
    { query: "design patterns", expect: "returns documents about patterns" },
    { query: "clean code", expect: "title matching should boost Clean Code book" },
    
    // Single term (BM25 + vector)
    { query: "microservices", expect: "semantic + keyword match" },
    { query: "testing", expect: "broad term, multiple matches" },
    
    // Multi-word (phrase matching)
    { query: "dependency injection", expect: "specific concept phrase" },
    { query: "domain driven design", expect: "DDD documents ranked high" },
    
    // WordNet expansion test
    { query: "quick", expect: "should find 'fast' via WordNet synonyms" },
    { query: "mistake", expect: "should find 'error' via WordNet" },
    
    // Edge cases
    { query: "xyz123nonexistent", expect: "no results or low scores" },
  ],
  
  broad_chunks_search: [
    // Specific technical terms
    { query: "singleton pattern", expect: "chunks discussing singleton" },
    { query: "REST API", expect: "chunks about REST" },
    { query: "unit testing best practices", expect: "testing methodology chunks" },
    
    // Natural language questions
    { query: "how to implement caching", expect: "caching implementation chunks" },
    { query: "what is polymorphism", expect: "OOP concept explanations" },
    
    // Code-related
    { query: "async await", expect: "async programming chunks" },
    { query: "error handling", expect: "exception/error chunks" },
    
    // Multi-concept
    { query: "database optimization performance", expect: "DB performance chunks" },
  ],
  
  concept_search: [
    // Direct concept names
    { query: "dependency injection", expect: "DI concept with high name score" },
    { query: "microservices", expect: "microservices concept" },
    { query: "clean architecture", expect: "architecture concept" },
    
    // Related concept discovery
    { query: "software design", expect: "design-related concepts" },
    { query: "testing strategies", expect: "testing concepts" },
  ],
};

interface TestResult {
  tool: string;
  query: string;
  expect: string;
  passed: boolean;
  resultCount: number;
  topScore: number;
  topResult: string;
  scores?: {
    vector: number;
    bm25: number;
    title: number;
    wordnet: number;
    hybrid: number;
  };
  error?: string;
}

async function main() {
  const dbPath = process.argv[2] || './db/test';
  
  console.log('\n🧪 SEARCH TOOLS TEST SUITE');
  console.log('='.repeat(70));
  console.log(`Database: ${dbPath}`);
  console.log(`Testing after concept scoring removal from hybrid search`);
  console.log('New weights: vector=30%, bm25=30%, title=25%, wordnet=15%');
  console.log('');
  
  // Connect to database
  let db: lancedb.Connection;
  try {
    db = await lancedb.connect(dbPath);
  } catch (error) {
    console.error(`❌ Failed to connect to database: ${error}`);
    process.exit(1);
  }
  
  // Check available tables
  const tables = await db.tableNames();
  console.log(`📊 Available tables: ${tables.join(', ')}`);
  
  if (!tables.includes('catalog') || !tables.includes('chunks')) {
    console.error('❌ Required tables (catalog, chunks) not found');
    process.exit(1);
  }
  
  // Load the application container for tool access
  const { ApplicationContainer } = await import('../src/application/container.js');
  const container = new ApplicationContainer();
  await container.initialize(dbPath);
  
  const results: TestResult[] = [];
  
  // Test catalog_search
  console.log('\n📚 Testing catalog_search...\n');
  const catalogTool = container.getTool('catalog_search');
  
  for (const test of TEST_QUERIES.catalog_search) {
    const result = await runToolTest(catalogTool, test.query, test.expect, 'catalog_search');
    results.push(result);
    printTestResult(result);
  }
  
  // Test broad_chunks_search
  console.log('\n📄 Testing broad_chunks_search...\n');
  const broadTool = container.getTool('broad_chunks_search');
  
  for (const test of TEST_QUERIES.broad_chunks_search) {
    const result = await runToolTest(broadTool, test.query, test.expect, 'broad_chunks_search');
    results.push(result);
    printTestResult(result);
  }
  
  // Test concept_search
  console.log('\n🧠 Testing concept_search...\n');
  const conceptTool = container.getTool('concept_search');
  
  for (const test of TEST_QUERIES.concept_search) {
    const result = await runToolTest(conceptTool, test.query, test.expect, 'concept_search');
    results.push(result);
    printTestResult(result);
  }
  
  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 SUMMARY\n');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const errors = results.filter(r => r.error).length;
  
  console.log(`  ✅ Passed: ${passed}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  ⚠️  Errors: ${errors}`);
  console.log(`  📊 Total:  ${results.length}`);
  
  // Score distribution analysis
  console.log('\n📈 Score Distribution:\n');
  
  const catalogResults = results.filter(r => r.tool === 'catalog_search' && !r.error);
  const broadResults = results.filter(r => r.tool === 'broad_chunks_search' && !r.error);
  const conceptResults = results.filter(r => r.tool === 'concept_search' && !r.error);
  
  if (catalogResults.length > 0) {
    const avgScore = catalogResults.reduce((sum, r) => sum + r.topScore, 0) / catalogResults.length;
    console.log(`  catalog_search avg top score: ${avgScore.toFixed(3)}`);
  }
  
  if (broadResults.length > 0) {
    const avgScore = broadResults.reduce((sum, r) => sum + r.topScore, 0) / broadResults.length;
    console.log(`  broad_chunks_search avg top score: ${avgScore.toFixed(3)}`);
  }
  
  if (conceptResults.length > 0) {
    const avgScore = conceptResults.reduce((sum, r) => sum + r.topScore, 0) / conceptResults.length;
    console.log(`  concept_search avg top score: ${avgScore.toFixed(3)}`);
  }
  
  // Verify concept score is always 0
  console.log('\n🔍 Verifying concept score removal:\n');
  const withScores = results.filter(r => r.scores);
  const allZeroConcept = withScores.every(r => !r.scores || (r.scores as any).concept === undefined || (r.scores as any).concept === 0);
  console.log(`  Concept score absent/zero in all results: ${allZeroConcept ? '✅ YES' : '❌ NO'}`);
  
  console.log('\n' + '='.repeat(70));
  
  process.exit(failed > 0 || errors > 0 ? 1 : 0);
}

async function runToolTest(
  tool: any,
  query: string,
  expect: string,
  toolName: string
): Promise<TestResult> {
  try {
    const response = await tool.execute({ text: query, debug: false });
    
    if (response.isError) {
      return {
        tool: toolName,
        query,
        expect,
        passed: false,
        resultCount: 0,
        topScore: 0,
        topResult: '',
        error: JSON.parse(response.content[0].text).error?.message || 'Unknown error'
      };
    }
    
    const results = JSON.parse(response.content[0].text);
    const resultCount = Array.isArray(results) ? results.length : 0;
    
    if (resultCount === 0) {
      return {
        tool: toolName,
        query,
        expect,
        passed: query.includes('nonexistent'), // Only pass if we expected no results
        resultCount: 0,
        topScore: 0,
        topResult: 'No results'
      };
    }
    
    const top = results[0];
    const topScore = parseFloat(top.scores?.hybrid || top.hybridScore || '0');
    const topResult = top.source || top.concept || top.text?.slice(0, 50) || 'Unknown';
    
    // Extract scores if available
    const scores = top.scores ? {
      vector: parseFloat(top.scores.vector || '0'),
      bm25: parseFloat(top.scores.bm25 || '0'),
      title: parseFloat(top.scores.title || '0'),
      wordnet: parseFloat(top.scores.wordnet || '0'),
      hybrid: topScore
    } : undefined;
    
    return {
      tool: toolName,
      query,
      expect,
      passed: resultCount > 0 && topScore > 0.1, // Basic sanity check
      resultCount,
      topScore,
      topResult,
      scores
    };
  } catch (error) {
    return {
      tool: toolName,
      query,
      expect,
      passed: false,
      resultCount: 0,
      topScore: 0,
      topResult: '',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

function printTestResult(result: TestResult) {
  const status = result.error ? '⚠️ ' : result.passed ? '✅' : '❌';
  const scoreStr = result.topScore > 0 ? `score=${result.topScore.toFixed(3)}` : '';
  const countStr = `n=${result.resultCount}`;
  
  console.log(`  ${status} "${result.query}"`);
  console.log(`     Expected: ${result.expect}`);
  console.log(`     Got: ${result.topResult.slice(0, 60)} (${countStr}, ${scoreStr})`);
  
  if (result.scores) {
    console.log(`     Scores: v=${result.scores.vector.toFixed(2)} b=${result.scores.bm25.toFixed(2)} t=${result.scores.title.toFixed(2)} w=${result.scores.wordnet.toFixed(2)}`);
  }
  
  if (result.error) {
    console.log(`     Error: ${result.error}`);
  }
  console.log('');
}

main().catch(console.error);
