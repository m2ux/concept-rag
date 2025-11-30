/**
 * Integration test for concept index rebuild from normalized schema
 * 
 * Tests the fix for the bug where concept index was only built from 
 * newly processed documents instead of ALL catalog entries.
 * 
 * Bug: The code was filtering for legacy `r.concepts` field instead of
 * the normalized `r.concept_ids` and `r.concept_names` fields.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as lancedb from '@lancedb/lancedb';
import * as fs from 'fs';
import * as path from 'path';
import { Document } from '@langchain/core/documents';
import { hashToId } from '../../infrastructure/utils/hash.js';

const TEST_DB_PATH = './test_db_concept_rebuild';

describe('Concept Index Rebuild Integration', () => {
    let db: Awaited<ReturnType<typeof lancedb.connect>>;
    
    beforeAll(async () => {
        // Clean up any existing test db
        if (fs.existsSync(TEST_DB_PATH)) {
            fs.rmSync(TEST_DB_PATH, { recursive: true });
        }
        
        db = await lancedb.connect(TEST_DB_PATH);
    });
    
    afterAll(async () => {
        // Clean up
        if (fs.existsSync(TEST_DB_PATH)) {
            fs.rmSync(TEST_DB_PATH, { recursive: true });
        }
    });
    
    it('should load existing catalog records with normalized schema for concept index', async () => {
        // Create a catalog table with NORMALIZED schema (concept_ids, concept_names)
        // This simulates what the catalog table looks like after schema normalization
        const catalogRecords = [
            {
                id: 1,
                hash: 'hash1',
                vector: new Array(384).fill(0.1),
                source: '/docs/book1.pdf',
                summary: 'A book about software design patterns',
                concept_ids: [hashToId('design patterns'), hashToId('software architecture')],
                concept_names: ['design patterns', 'software architecture'],
                category_ids: [1],
                category_names: ['Programming']
            },
            {
                id: 2,
                hash: 'hash2',
                vector: new Array(384).fill(0.2),
                source: '/docs/book2.pdf',
                summary: 'A book about distributed systems',
                concept_ids: [hashToId('distributed systems'), hashToId('consensus')],
                concept_names: ['distributed systems', 'consensus'],
                category_ids: [2],
                category_names: ['Systems']
            },
            {
                id: 3,
                hash: 'hash3',
                vector: new Array(384).fill(0.3),
                source: '/docs/book3.pdf',
                summary: 'A book about clean code',
                concept_ids: [hashToId('clean code'), hashToId('refactoring')],
                concept_names: ['clean code', 'refactoring'],
                category_ids: [1],
                category_names: ['Programming']
            }
        ];
        
        // Create catalog table
        await db.createTable('catalog', catalogRecords, { mode: 'overwrite' });
        
        // Now simulate the FIXED loading logic from hybrid_fast_seed.ts
        const catalogTable = await db.openTable('catalog');
        const existingRecords = await catalogTable.query().limit(100000).toArray();
        
        // Helper to convert Arrow arrays to JS arrays (same as in fix)
        const toArray = (val: any): any[] => {
            if (!val) return [];
            if (Array.isArray(val)) return val;
            if (typeof val === 'object' && 'toArray' in val) return Array.from(val.toArray());
            return [];
        };
        
        // Apply the FIXED filtering logic
        const existingDocs = existingRecords
            .filter((r: any) => {
                // Check for normalized schema fields (THE FIX)
                const conceptIds = toArray(r.concept_ids);
                const conceptNames = toArray(r.concept_names);
                return r.source && (conceptIds.length > 0 || conceptNames.length > 0);
            })
            .map((r: any) => {
                // Reconstruct ConceptMetadata from normalized fields
                const conceptNames = toArray(r.concept_names);
                const categoryNames = toArray(r.category_names);
                
                // Create ConceptMetadata structure that ConceptIndexBuilder expects
                const concepts = {
                    primary_concepts: conceptNames.map((name: string) => ({ 
                        name: name, 
                        summary: '' // Summary not stored in normalized schema
                    })),
                    categories: categoryNames.length > 0 ? categoryNames : ['General']
                };
                
                return new Document({
                    pageContent: r.summary || '',  // FIX: catalog uses 'summary' not 'text'
                    metadata: {
                        source: r.source,
                        hash: r.hash,
                        concepts: concepts
                    }
                });
            })
            .filter((d: Document) => d.metadata.concepts?.primary_concepts?.length > 0);
        
        // ASSERTIONS
        // With the FIX, all 3 records should be loaded (they all have concept_ids/concept_names)
        expect(existingDocs.length).toBe(3);
        
        // Verify the concept metadata was properly reconstructed
        expect(existingDocs[0].metadata.concepts.primary_concepts).toHaveLength(2);
        expect(existingDocs[0].metadata.concepts.primary_concepts[0].name).toBe('design patterns');
        expect(existingDocs[0].metadata.concepts.primary_concepts[1].name).toBe('software architecture');
        expect(existingDocs[0].metadata.concepts.categories).toEqual(['Programming']);
        
        expect(existingDocs[1].metadata.concepts.primary_concepts).toHaveLength(2);
        expect(existingDocs[1].metadata.concepts.primary_concepts[0].name).toBe('distributed systems');
        expect(existingDocs[1].metadata.concepts.primary_concepts[1].name).toBe('consensus');
        
        expect(existingDocs[2].metadata.concepts.primary_concepts).toHaveLength(2);
        expect(existingDocs[2].metadata.concepts.primary_concepts[0].name).toBe('clean code');
        expect(existingDocs[2].metadata.concepts.primary_concepts[1].name).toBe('refactoring');
        
        // Verify that 'summary' field was used correctly (not 'text')
        expect(existingDocs[0].pageContent).toBe('A book about software design patterns');
    });
    
    it('should filter out records without concepts', async () => {
        // Simulate records with and without concepts
        // Note: LanceDB requires non-empty arrays for type inference, so we test the filter logic directly
        const mockRecords = [
            {
                source: '/docs/no-concepts.pdf',
                summary: 'A document that was not concept-extracted',
                concept_ids: [],  // No concepts
                concept_names: [],
            },
            {
                source: '/docs/with-concepts.pdf',
                summary: 'A document with concepts',
                concept_ids: [hashToId('testing')],
                concept_names: ['testing'],
            }
        ];
        
        const toArray = (val: any): any[] => {
            if (!val) return [];
            if (Array.isArray(val)) return val;
            if (typeof val === 'object' && 'toArray' in val) return Array.from(val.toArray());
            return [];
        };
        
        // Apply the fixed filtering logic
        const filteredDocs = mockRecords
            .filter((r: any) => {
                const conceptIds = toArray(r.concept_ids);
                const conceptNames = toArray(r.concept_names);
                return r.source && (conceptIds.length > 0 || conceptNames.length > 0);
            });
        
        // Only the document WITH concepts should pass the filter
        expect(filteredDocs.length).toBe(1);
        expect(filteredDocs[0].source).toBe('/docs/with-concepts.pdf');
    });
    
    it('should demonstrate the bug with OLD (broken) logic', async () => {
        // This test demonstrates what the BUG looked like
        // The OLD code filtered for `r.text && r.source && r.concepts`
        // But normalized schema has `summary` and `concept_ids`/`concept_names`
        
        const catalogTable = await db.openTable('catalog');
        const existingRecords = await catalogTable.query().limit(100000).toArray();
        
        // OLD BUGGY LOGIC - looking for 'text' and 'concepts' fields that don't exist
        const oldBuggyDocs = existingRecords
            .filter((r: any) => r.text && r.source && r.concepts);  // BUG: these fields don't exist!
        
        // With the OLD logic, 0 records would be found!
        expect(oldBuggyDocs.length).toBe(0);  // This was the bug!
        
        // Verify the fields that DO exist in the normalized schema
        expect(existingRecords[0]).toHaveProperty('summary');
        expect(existingRecords[0]).toHaveProperty('concept_ids');
        expect(existingRecords[0]).toHaveProperty('concept_names');
        expect(existingRecords[0]).not.toHaveProperty('text');    // NOT in normalized schema
        expect(existingRecords[0]).not.toHaveProperty('concepts'); // NOT in normalized schema
    });
});

