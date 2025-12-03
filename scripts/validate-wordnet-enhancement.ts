/**
 * Validation script for WordNet Enhancement
 * 
 * Tests that the new WordNet capabilities are active and improving results.
 * Run with: npx tsx scripts/validate-wordnet-enhancement.ts
 */

import { WordNetService } from '../dist/wordnet/wordnet_service.js';
import { ContextAwareStrategy } from '../dist/wordnet/strategies/context-aware-strategy.js';
import { FirstSynsetStrategy } from '../dist/wordnet/strategies/first-synset-strategy.js';
import { analyzeQuery, getAdjustedChunkWeights, DEFAULT_WEIGHTS } from '../dist/infrastructure/search/dynamic-weights.js';

// ExpandedQuery type for reference (interfaces are erased during compilation)
interface ExpandedQuery {
  original_terms: string[];
  corpus_terms: string[];
  concept_terms: string[];
  wordnet_terms: string[];
  all_terms: string[];
  weights: Map<string, number>;
}

async function main() {
  console.log('🧪 WordNet Enhancement Validation\n');
  console.log('='.repeat(60));
  
  // Test 1: Context-Aware Synset Selection
  console.log('\n📋 Test 1: Context-Aware Synset Selection\n');
  
  const contextAwareService = new WordNetService(new ContextAwareStrategy());
  const firstSynsetService = new WordNetService(new FirstSynsetStrategy());
  
  const testWords = [
    { word: 'decorator', context: ['software', 'design', 'pattern'] },
    { word: 'factory', context: ['object', 'creation', 'class'] },
    { word: 'bridge', context: ['software', 'abstraction', 'implementation'] },
    { word: 'observer', context: ['event', 'listener', 'notification'] },
  ];
  
  for (const { word, context } of testWords) {
    const firstSynset = await firstSynsetService.getContextualSynset(word, { queryTerms: context });
    const contextSynset = await contextAwareService.getContextualSynset(word, { queryTerms: context });
    
    console.log(`  "${word}" with context [${context.join(', ')}]:`);
    console.log(`    First synset: ${firstSynset?.definition?.substring(0, 60) || 'N/A'}...`);
    console.log(`    Context-aware: ${contextSynset?.definition?.substring(0, 60) || 'N/A'}...`);
    
    const improved = firstSynset?.definition !== contextSynset?.definition;
    console.log(`    ${improved ? '✅ Different selection (potentially improved)' : '⚪ Same selection'}\n`);
  }
  
  // Test 2: Dynamic Weight Adjustment
  console.log('\n📋 Test 2: Dynamic Weight Adjustment\n');
  
  const testQueries = [
    { name: 'Single term, no concepts', original_terms: ['pattern'], concept_terms: [], wordnet_terms: ['design', 'template'] },
    { name: 'Single term, with concepts', original_terms: ['pattern'], concept_terms: ['design pattern', 'creational pattern'], wordnet_terms: ['design'] },
    { name: 'Multi-term, strong concepts', original_terms: ['software', 'design', 'patterns', 'best'], concept_terms: ['software architecture', 'design patterns', 'best practices', 'clean code'], wordnet_terms: ['program'] },
    { name: 'Multi-term, weak concepts', original_terms: ['quantum', 'computing'], concept_terms: [], wordnet_terms: ['calculation'] },
  ];
  
  for (const query of testQueries) {
    const expanded: ExpandedQuery = {
      original_terms: query.original_terms,
      corpus_terms: [],
      concept_terms: query.concept_terms,
      wordnet_terms: query.wordnet_terms,
      all_terms: [...query.original_terms, ...query.concept_terms, ...query.wordnet_terms],
      weights: new Map()
    };
    
    const analysis = analyzeQuery(expanded);
    const weights = getAdjustedChunkWeights(analysis);
    
    const defaultWordNet = DEFAULT_WEIGHTS.chunk.wordnetWeight;
    const adjustedWordNet = weights.wordnetWeight;
    const change = ((adjustedWordNet - defaultWordNet) / defaultWordNet * 100).toFixed(0);
    
    console.log(`  "${query.name}":`);
    console.log(`    Boost factor: ${analysis.wordnetBoostFactor}x`);
    console.log(`    Reason: ${analysis.boostReason}`);
    console.log(`    WordNet weight: ${(defaultWordNet * 100).toFixed(1)}% → ${(adjustedWordNet * 100).toFixed(1)}% (${change}%)`);
    console.log();
  }
  
  // Test 3: Query Expansion with Context-Aware Strategy
  console.log('\n📋 Test 3: Query Expansion Comparison\n');
  
  const expansionTests = ['decorator', 'observer', 'strategy'];
  
  for (const term of expansionTests) {
    const firstExpanded = await firstSynsetService.expandQuery([term], 3, 2);
    const contextExpanded = await contextAwareService.expandQuery([term], 3, 2);
    
    const firstSynonyms = [...firstExpanded.keys()].filter(k => k !== term);
    const contextSynonyms = [...contextExpanded.keys()].filter(k => k !== term);
    
    console.log(`  "${term}":`);
    console.log(`    First strategy: ${firstSynonyms.join(', ') || 'none'}`);
    console.log(`    Context-aware: ${contextSynonyms.join(', ') || 'none'}`);
    
    const different = JSON.stringify(firstSynonyms.sort()) !== JSON.stringify(contextSynonyms.sort());
    console.log(`    ${different ? '✅ Different expansion' : '⚪ Same expansion'}\n`);
  }
  
  // Summary
  console.log('='.repeat(60));
  console.log('\n📊 Summary\n');
  console.log('The WordNet enhancement is ACTIVE if you see:');
  console.log('  1. Different synset selections for technical terms');
  console.log('  2. Dynamic weight adjustments (boost factors ≠ 1.0)');
  console.log('  3. Different query expansions for ambiguous terms');
  console.log();
  console.log('To measure actual search quality improvement:');
  console.log('  1. Re-run the MCP tool test suite');
  console.log('  2. Compare wordnet scores before/after');
  console.log('  3. Check if results rank better for technical queries');
}

main().catch(console.error);

