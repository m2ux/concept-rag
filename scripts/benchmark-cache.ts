#!/usr/bin/env tsx
/**
 * Cache Performance Benchmark
 * 
 * Quick benchmark script to measure cache effectiveness.
 * Run with: npm run benchmark:cache
 * 
 * or directly: tsx scripts/benchmark-cache.ts
 */

import { ApplicationContainer } from '../src/application/container.js';

interface BenchmarkResults {
  searchCacheHitRate: number;
  searchLatencyImprovement: number;
  embeddingCacheHitRate: number;
  avgQueryTime: number;
  throughput: number;
}

async function benchmarkCache(): Promise<BenchmarkResults> {
  console.log('🚀 Starting Cache Performance Benchmark...\n');
  
  const container = new ApplicationContainer();
  const dbPath = process.env.CONCEPT_RAG_DB || '~/.concept_rag';
  
  await container.initialize(dbPath);
  
  const catalogSearchTool = container.getTool('catalog_search');
  
  // Test 1: Cache Hit Rate
  console.log('📊 Test 1: Measuring Cache Hit Rate...');
  const queries = [
    'microservices',
    'api design',
    'distributed systems',
    'database optimization',
    'software architecture'
  ];
  
  // First pass - populate cache
  const firstPassTimes: number[] = [];
  for (const query of queries) {
    const start = performance.now();
    await catalogSearchTool.execute({ text: query, limit: 5 });
    firstPassTimes.push(performance.now() - start);
  }
  
  // Second pass - hit cache
  const secondPassTimes: number[] = [];
  for (const query of queries) {
    const start = performance.now();
    await catalogSearchTool.execute({ text: query, limit: 5 });
    secondPassTimes.push(performance.now() - start);
  }
  
  const avgFirst = firstPassTimes.reduce((a, b) => a + b) / firstPassTimes.length;
  const avgSecond = secondPassTimes.reduce((a, b) => a + b) / secondPassTimes.length;
  const latencyImprovement = ((avgFirst - avgSecond) / avgFirst) * 100;
  
  console.log(`  First pass avg:  ${avgFirst.toFixed(2)}ms`);
  console.log(`  Second pass avg: ${avgSecond.toFixed(2)}ms`);
  console.log(`  Improvement:     ${latencyImprovement.toFixed(1)}%\n`);
  
  // Test 2: Realistic Usage Pattern
  console.log('📊 Test 2: Realistic Usage Pattern (100 queries)...');
  
  const repeatedQueries = ['microservices', 'api gateway', 'database'];
  let totalTime = 0;
  let cacheHits = 0;
  
  for (let i = 0; i < 100; i++) {
    // 70% repeated, 30% unique
    const query = Math.random() < 0.7
      ? repeatedQueries[Math.floor(Math.random() * repeatedQueries.length)]
      : `unique query ${i}`;
    
    const start = performance.now();
    await catalogSearchTool.execute({ text: query, limit: 5 });
    const duration = performance.now() - start;
    
    totalTime += duration;
    if (duration < 10) cacheHits++; // Heuristic for cache hits
  }
  
  const hitRate = (cacheHits / 100) * 100;
  const avgQueryTime = totalTime / 100;
  const throughput = (100 / totalTime) * 1000;
  
  console.log(`  Estimated hit rate: ${hitRate.toFixed(1)}%`);
  console.log(`  Avg query time:     ${avgQueryTime.toFixed(2)}ms`);
  console.log(`  Throughput:         ${throughput.toFixed(1)} ops/sec\n`);
  
  await container.close();
  
  return {
    searchCacheHitRate: hitRate,
    searchLatencyImprovement: latencyImprovement,
    embeddingCacheHitRate: 0, // Would need instrumentation to measure
    avgQueryTime,
    throughput
  };
}

function printResults(results: BenchmarkResults): void {
  console.log('=' .repeat(60));
  console.log('📈 CACHE PERFORMANCE RESULTS');
  console.log('=' .repeat(60));
  
  console.log('\n🎯 Key Metrics:');
  console.log(`  Cache Hit Rate:          ${results.searchCacheHitRate.toFixed(1)}% (target: >60%)`);
  console.log(`  Latency Improvement:     ${results.searchLatencyImprovement.toFixed(1)}% (target: 40-60%)`);
  console.log(`  Avg Query Time:          ${results.avgQueryTime.toFixed(2)}ms`);
  console.log(`  Throughput:              ${results.throughput.toFixed(1)} ops/sec`);
  
  console.log('\n✅ Target Assessment:');
  
  const hitRateOk = results.searchCacheHitRate >= 60;
  const latencyOk = results.searchLatencyImprovement >= 40;
  
  console.log(`  ${hitRateOk ? '✓' : '✗'} Cache hit rate ${hitRateOk ? 'MEETS' : 'BELOW'} target (>60%)`);
  console.log(`  ${latencyOk ? '✓' : '✗'} Latency improvement ${latencyOk ? 'MEETS' : 'BELOW'} target (40-60%)`);
  
  if (hitRateOk && latencyOk) {
    console.log('\n🎉 All performance targets MET!');
  } else {
    console.log('\n⚠️  Some targets not met (may need warm-up queries or larger dataset)');
  }
  
  console.log('=' .repeat(60));
}

// Run benchmark
benchmarkCache()
  .then(printResults)
  .catch(error => {
    console.error('❌ Benchmark failed:', error);
    process.exit(1);
  });

