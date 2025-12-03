/**
 * FNV-1a hash function for generating stable integer IDs
 * 
 * Provides deterministic hash-based IDs that are stable across database rebuilds.
 * Same input always produces same output, ensuring concept and category IDs remain
 * constant over time without requiring external mapping files.
 */

const FNV_OFFSET_BASIS = 2166136261;
const FNV_PRIME = 16777619;

/**
 * Generate FNV-1a hash for a string
 * @param str Input string to hash
 * @returns 32-bit unsigned integer hash
 */
export function hashToId(str: string): number {
  let hash = FNV_OFFSET_BASIS;
  
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME);
  }
  
  // Convert to unsigned 32-bit integer
  return hash >>> 0;
}

/**
 * Generate stable ID with collision handling
 * @param str Input string to hash
 * @param existingIds Set of already used IDs to check for collisions
 * @returns Unique hash-based ID
 */
export function generateStableId(
  str: string,
  existingIds: Set<number>
): number {
  let hash = hashToId(str);
  let attempt = 0;
  
  // If collision detected, try with suffix until unique
  while (existingIds.has(hash)) {
    hash = hashToId(`${str}::${attempt++}`);
  }
  
  return hash;
}

/**
 * Generate stable IDs for an array of strings
 * @param strings Array of strings to hash
 * @returns Array of hash-based IDs (same order as input)
 */
export function generateStableIds(strings: string[]): number[] {
  const existingIds = new Set<number>();
  const ids: number[] = [];
  
  for (const str of strings) {
    const id = generateStableId(str, existingIds);
    existingIds.add(id);
    ids.push(id);
  }
  
  return ids;
}

/**
 * Test hash stability - verify same input produces same output
 * @param testCases Array of test strings
 * @returns true if all tests pass
 */
export function testHashStability(testCases: string[]): boolean {
  for (const testCase of testCases) {
    const id1 = hashToId(testCase);
    const id2 = hashToId(testCase);
    
    if (id1 !== id2) {
      console.error(`Hash instability detected for: ${testCase}`);
      return false;
    }
  }
  
  return true;
}
