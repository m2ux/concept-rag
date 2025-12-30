/**
 * Test script for slugify utilities
 */

import { 
  slugifyDocument, 
  extractAuthorSurname, 
  extractShortTitle, 
  extractYear, 
  formatVisualFilename 
} from '../src/infrastructure/utils/slugify.js';

// Test cases
const tests = [
  {
    input: { title: 'Clean Architecture', author: 'Robert C. Martin', year: 2017 },
    expected: 'martin_clean-architecture_2017'
  },
  {
    // Subtitles after : are removed by design
    input: { title: 'Design Patterns: Elements of Reusable Object-Oriented Software', author: 'Gamma, Erich et al.', year: 1994 },
    expected: 'gamma_design-patterns_1994'
  },
  {
    input: { title: 'The Art of War', author: 'Sun Tzu' },
    expected: 'tzu_art-of-war_undated'
  },
  {
    // Subtitles after : are removed by design
    input: { title: 'Bitcoin: A Peer-to-Peer Electronic Cash System', author: 'Satoshi Nakamoto', year: '2008' },
    expected: 'nakamoto_bitcoin_2008'
  },
  {
    input: { title: 'Cosmos Blockchain Overview', year: 2023 },
    expected: 'unknown_cosmos-blockchain-overview_2023'
  },
  {
    // Test with first name last name format
    input: { title: 'Domain-Driven Design', author: 'Eric Evans', year: 2003 },
    expected: 'evans_domain-driven-design_2003'
  }
];

console.log('Testing slugifyDocument:\n');
let passed = 0;
let failed = 0;

for (const test of tests) {
  const result = slugifyDocument(test.input);
  const pass = result === test.expected;
  if (pass) {
    console.log(`  ✅ ${test.input.title}`);
    console.log(`     → ${result}`);
    passed++;
  } else {
    console.log(`  ❌ ${test.input.title}`);
    console.log(`     Expected: ${test.expected}`);
    console.log(`     Got:      ${result}`);
    failed++;
  }
}

console.log('\nTesting formatVisualFilename:\n');
const fnTests = [
  { page: 1, index: 0, expected: 'p001_v0.png' },
  { page: 42, index: 2, expected: 'p042_v2.png' },
  { page: 100, index: 0, expected: 'p100_v0.png' },
];

for (const test of fnTests) {
  const result = formatVisualFilename(test.page, test.index);
  const pass = result === test.expected;
  if (pass) {
    console.log(`  ✅ Page ${test.page}, index ${test.index} → ${result}`);
    passed++;
  } else {
    console.log(`  ❌ Page ${test.page}, index ${test.index}`);
    console.log(`     Expected: ${test.expected}`);
    console.log(`     Got:      ${result}`);
    failed++;
  }
}

console.log(`\n${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}

