/**
 * Live Integration Tests for Refactored Architecture
 * 
 * Tests all 5 MCP tools with real database to verify:
 * 1. Architecture refactoring preserved functionality
 * 2. All search modalities work correctly
 * 3. Dependency injection is properly wired
 */

import { ApplicationContainer } from '../../src/application/container.js';
import * as os from 'os';
import * as path from 'path';

// Database path
const DB_PATH = process.env.DB_PATH || path.join(os.homedir(), '.concept_rag');

console.log('🔒 SAFETY CHECK:');
console.log('   ✅ All search operations are READ-ONLY');
console.log('   ✅ No data will be modified or deleted');
console.log('   ✅ Testing refactored architecture with existing database');
console.log(`   📂 Database: ${DB_PATH}\n`);

async function runLiveTests() {
  console.log('🧪 Live Integration Tests - Refactored Architecture\n');
  console.log('=' .repeat(70));
  console.log(`Database: ${DB_PATH}`);
  console.log('=' .repeat(70) + '\n');
  
  // Initialize ApplicationContainer (our Composition Root)
  const container = new ApplicationContainer();
  await container.initialize(DB_PATH);
  
  let passedTests = 0;
  let totalTests = 0;
  
  try {
    // Test 1: concept_chunks - Find chunks by concept
    console.log('📊 Test 1: concept_chunks');
    console.log('-'.repeat(70));
    totalTests++;
    try {
      const tool = container.getTool('concept_chunks');
      const result = await tool.execute({ concept: 'healthcare', limit: 5 });
      
      const content = JSON.parse(result.content[0].text);
      if (content.results && Array.isArray(content.results)) {
        console.log(`✅ PASS: Found ${content.results.length} chunks`);
        console.log(`   Concept: ${content.concept}`);
        console.log(`   Total found: ${content.total_chunks_found}`);
        if (content.results.length > 0) {
          console.log(`   Sample: ${content.results[0].text.substring(0, 80)}...`);
        }
        passedTests++;
      } else {
        console.log('❌ FAIL: Invalid response format');
      }
    } catch (error: any) {
      console.log(`❌ FAIL: ${error.message}`);
    }
    console.log();
    
    // Test 2: catalog_search - Search document summaries
    console.log('📚 Test 2: catalog_search');
    console.log('-'.repeat(70));
    totalTests++;
    try {
      const tool = container.getTool('catalog_search');
      const result = await tool.execute({ text: 'health system', limit: 3 });
      
      const content = JSON.parse(result.content[0].text);
      if (Array.isArray(content) || (content.results && Array.isArray(content.results))) {
        const results = Array.isArray(content) ? content : content.results;
        console.log(`✅ PASS: Found ${results.length} documents`);
        if (results.length > 0) {
          console.log(`   Sample source: ${results[0].source}`);
          const hybridScore = results[0].scores?.hybrid || results[0].hybridScore || results[0]._hybrid_score;
          console.log(`   Hybrid score: ${hybridScore}`);
        }
        passedTests++;
      } else {
        console.log('❌ FAIL: Invalid response format');
      }
    } catch (error: any) {
      console.log(`❌ FAIL: ${error.message}`);
    }
    console.log();
    
    // Test 3: chunks_search - Search within specific document
    console.log('🔍 Test 3: chunks_search');
    console.log('-'.repeat(70));
    totalTests++;
    try {
      const tool = container.getTool('chunks_search');
      // First get a document source from catalog
      const catalogTool = container.getTool('catalog_search');
      const catalogResult = await catalogTool.execute({ text: 'health', limit: 1 });
      const catalogContent = JSON.parse(catalogResult.content[0].text);
      const source = Array.isArray(catalogContent) 
        ? catalogContent[0]?.source 
        : catalogContent.results?.[0]?.source;
      
      if (source) {
        const result = await tool.execute({ 
          text: 'patient', 
          source: source,
          limit: 3 
        });
        
        const content = JSON.parse(result.content[0].text);
        if (Array.isArray(content) || (content.results && Array.isArray(content.results))) {
          const results = Array.isArray(content) ? content : content.results;
          console.log(`✅ PASS: Found ${results.length} chunks in document`);
          console.log(`   Source: ${source.substring(0, 60)}...`);
          passedTests++;
        } else {
          console.log('❌ FAIL: Invalid response format');
        }
      } else {
        console.log('⚠️  SKIP: No document source available');
      }
    } catch (error: any) {
      console.log(`❌ FAIL: ${error.message}`);
    }
    console.log();
    
    // Test 4: broad_chunks_search - Search across all chunks
    console.log('🌐 Test 4: broad_chunks_search');
    console.log('-'.repeat(70));
    totalTests++;
    try {
      const tool = container.getTool('broad_chunks_search');
      const result = await tool.execute({ text: 'medical', limit: 5 });
      
      const content = JSON.parse(result.content[0].text);
      if (Array.isArray(content) || (content.results && Array.isArray(content.results))) {
        const results = Array.isArray(content) ? content : content.results;
        console.log(`✅ PASS: Found ${results.length} chunks across documents`);
        if (results.length > 0) {
          console.log(`   Sample: ${results[0].text.substring(0, 80)}...`);
        }
        passedTests++;
      } else {
        console.log('❌ FAIL: Invalid response format');
      }
    } catch (error: any) {
      console.log(`❌ FAIL: ${error.message}`);
    }
    console.log();
    
    // Test 5: extract_concepts - Get concepts from document
    console.log('📋 Test 5: extract_concepts');
    console.log('-'.repeat(70));
    totalTests++;
    try {
      const tool = container.getTool('extract_concepts');
      const result = await tool.execute({ document_query: 'health' });
      
      const content = JSON.parse(result.content[0].text);
      if (content.primary_concepts || content.document_summary) {
        console.log(`✅ PASS: Extracted concepts from document`);
        if (content.primary_concepts) {
          console.log(`   Primary concepts: ${content.primary_concepts.slice(0, 5).join(', ')}`);
        }
        if (content.document_summary) {
          console.log(`   Summary: ${content.document_summary.substring(0, 80)}...`);
        }
        passedTests++;
      } else {
        console.log('❌ FAIL: Invalid response format');
      }
    } catch (error: any) {
      console.log(`❌ FAIL: ${error.message}`);
    }
    console.log();
    
    // Summary
    console.log('=' .repeat(70));
    console.log(`📊 Test Results: ${passedTests}/${totalTests} passed`);
    console.log('=' .repeat(70));
    
    if (passedTests === totalTests) {
      console.log('✅ All tests PASSED! Architecture refactoring successful!');
      console.log('\n🎉 All search modalities working correctly with:');
      console.log('   - Clean Architecture (Domain → Application → Infrastructure)');
      console.log('   - Repository Pattern');
      console.log('   - Dependency Injection via ApplicationContainer');
      console.log('   - Performance optimizations (vector search)');
    } else {
      console.log(`⚠️  ${totalTests - passedTests} test(s) failed`);
    }
    
  } finally {
    // Clean shutdown
    await container.close();
    console.log('\n🛑 Database connection closed');
  }
  
  process.exit(passedTests === totalTests ? 0 : 1);
}

// Run tests
runLiveTests().catch(error => {
  console.error('❌ Test suite error:', error);
  process.exit(1);
});

