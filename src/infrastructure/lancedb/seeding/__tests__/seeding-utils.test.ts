/**
 * Unit Tests for LanceDB Seeding Utilities
 */

import { describe, it, expect } from 'vitest';
import {
  calculatePartitions,
  MIN_VECTORS_FOR_INDEX,
  buildCategoryIdMap,
  extractCategoriesFromDocuments,
  buildCategoryStats
} from '../index.js';

describe('calculatePartitions', () => {
  it('should return 2 for very small datasets', () => {
    expect(calculatePartitions(50)).toBe(2);
    expect(calculatePartitions(99)).toBe(2);
  });
  
  it('should scale partitions with dataset size', () => {
    expect(calculatePartitions(100)).toBeGreaterThanOrEqual(2);
    expect(calculatePartitions(500)).toBeGreaterThanOrEqual(4);
    expect(calculatePartitions(1000)).toBeGreaterThanOrEqual(4);
    expect(calculatePartitions(5000)).toBeGreaterThanOrEqual(8);
    expect(calculatePartitions(10000)).toBeGreaterThanOrEqual(32);
    expect(calculatePartitions(50000)).toBeGreaterThanOrEqual(64);
  });
  
  it('should return 256 for very large datasets', () => {
    expect(calculatePartitions(100000)).toBe(256);
    expect(calculatePartitions(1000000)).toBe(256);
  });
});

describe('MIN_VECTORS_FOR_INDEX', () => {
  it('should be 256', () => {
    expect(MIN_VECTORS_FOR_INDEX).toBe(256);
  });
});

describe('buildCategoryIdMap', () => {
  it('should create unique IDs for each category', () => {
    // SETUP
    const categories = new Set(['Software Engineering', 'Machine Learning', 'Data Science']);
    
    // EXERCISE
    const idMap = buildCategoryIdMap(categories);
    
    // VERIFY
    expect(idMap.size).toBe(3);
    expect(idMap.has('Software Engineering')).toBe(true);
    expect(idMap.has('Machine Learning')).toBe(true);
    expect(idMap.has('Data Science')).toBe(true);
    
    // IDs should be unique
    const ids = Array.from(idMap.values());
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(3);
  });
  
  it('should produce consistent IDs across calls', () => {
    // SETUP
    const categories = new Set(['A', 'B', 'C']);
    
    // EXERCISE
    const idMap1 = buildCategoryIdMap(categories);
    const idMap2 = buildCategoryIdMap(categories);
    
    // VERIFY
    expect(idMap1.get('A')).toBe(idMap2.get('A'));
    expect(idMap1.get('B')).toBe(idMap2.get('B'));
    expect(idMap1.get('C')).toBe(idMap2.get('C'));
  });
  
  it('should handle empty set', () => {
    // SETUP
    const categories = new Set<string>();
    
    // EXERCISE
    const idMap = buildCategoryIdMap(categories);
    
    // VERIFY
    expect(idMap.size).toBe(0);
  });
});

describe('extractCategoriesFromDocuments', () => {
  it('should extract categories from concepts.categories', () => {
    // SETUP
    const documents = [
      { metadata: { concepts: { categories: ['AI', 'ML'] } } },
      { metadata: { concepts: { categories: ['ML', 'DL'] } } }
    ];
    
    // EXERCISE
    const categories = extractCategoriesFromDocuments(documents);
    
    // VERIFY
    expect(categories.size).toBe(3);
    expect(categories.has('AI')).toBe(true);
    expect(categories.has('ML')).toBe(true);
    expect(categories.has('DL')).toBe(true);
  });
  
  it('should extract categories from concept_categories', () => {
    // SETUP
    const documents = [
      { metadata: { concept_categories: ['Web', 'API'] } }
    ];
    
    // EXERCISE
    const categories = extractCategoriesFromDocuments(documents);
    
    // VERIFY
    expect(categories.size).toBe(2);
    expect(categories.has('Web')).toBe(true);
    expect(categories.has('API')).toBe(true);
  });
  
  it('should handle documents without categories', () => {
    // SETUP
    const documents = [
      { metadata: { title: 'No categories' } },
      { metadata: {} }
    ];
    
    // EXERCISE
    const categories = extractCategoriesFromDocuments(documents);
    
    // VERIFY
    expect(categories.size).toBe(0);
  });
});

describe('buildCategoryStats', () => {
  it('should count documents per category', () => {
    // SETUP
    const documents = [
      { metadata: { source: 'doc1.pdf', concepts: { categories: ['AI', 'ML'] } } },
      { metadata: { source: 'doc2.pdf', concepts: { categories: ['ML'] } } },
      { metadata: { source: 'doc3.pdf', concepts: { categories: ['AI'] } } }
    ];
    
    // EXERCISE
    const stats = buildCategoryStats(documents);
    
    // VERIFY
    expect(stats.get('AI')?.documentCount).toBe(2);
    expect(stats.get('ML')?.documentCount).toBe(2);
    
    expect(stats.get('AI')?.sources.size).toBe(2);
    expect(stats.get('ML')?.sources.size).toBe(2);
  });
  
  it('should track unique sources', () => {
    // SETUP
    const documents = [
      { metadata: { source: 'doc1.pdf', concepts: { categories: ['AI'] } } },
      { metadata: { source: 'doc1.pdf', concepts: { categories: ['AI'] } } } // Same source
    ];
    
    // EXERCISE
    const stats = buildCategoryStats(documents);
    
    // VERIFY
    expect(stats.get('AI')?.documentCount).toBe(2);
    expect(stats.get('AI')?.sources.size).toBe(1); // Only 1 unique source
  });
});

