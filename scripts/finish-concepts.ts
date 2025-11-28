#!/usr/bin/env npx tsx
/**
 * Finish creating the concepts table from existing catalog data.
 * Use this when seeding was interrupted after catalog/chunks were created.
 */

import * as lancedb from '@lancedb/lancedb';
import { ConceptRecord } from '../src/concepts/concept_index.js';
import { ConceptEnricher } from '../src/concepts/concept_enricher.js';
import { hashToId } from '../src/infrastructure/utils/hash.js';
import { createSimpleEmbedding } from '../src/lancedb/hybrid_search_client.js';

// Parse array from LanceDB (may be Arrow Vector)
function parseArray(value: any): any[] {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'object' && 'toArray' in value) {
        return Array.from(value.toArray());
    }
    return [];
}

async function main() {
    const dbPath = process.argv[2] || './test_db';
    const skipWordNet = !process.argv.includes('--with-wordnet');
    
    console.log(`📂 Database: ${dbPath}`);
    console.log(`🔍 WordNet enrichment: ${skipWordNet ? 'SKIPPED' : 'ENABLED'}`);
    
    // Connect to database
    const db = await lancedb.connect(dbPath);
    const tables = await db.tableNames();
    
    console.log(`📊 Existing tables: ${tables.join(', ')}`);
    
    if (!tables.includes('catalog')) {
        console.error('❌ No catalog table found. Run full seeding first.');
        process.exit(1);
    }
    
    // Check if concepts table already exists
    if (tables.includes('concepts')) {
        console.log('⚠️  Concepts table already exists. Dropping and recreating...');
        await db.dropTable('concepts');
    }
    
    // Read catalog to extract concept metadata
    const catalogTable = await db.openTable('catalog');
    const catalogRecords = await catalogTable.query().toArray();
    
    console.log(`📚 Found ${catalogRecords.length} catalog entries`);
    
    // Build source -> catalog ID mapping
    const sourceToCatalogId = new Map<string, number>();
    const sourceToCatalogTitle = new Map<string, string>();
    
    for (const record of catalogRecords) {
        sourceToCatalogId.set(record.source, record.id);
        sourceToCatalogTitle.set(record.source, record.title || record.source.split('/').pop() || '');
    }
    
    // Build concept records directly from catalog concept_names
    const conceptMap = new Map<string, ConceptRecord>();
    
    for (const record of catalogRecords) {
        // Parse concept_names from catalog
        const conceptNames = parseArray(record.concept_names).filter((n: any) => n && typeof n === 'string' && n.trim());
        
        // Add concepts to map
        for (const name of conceptNames) {
            const key = name.toLowerCase().trim();
            if (!key) continue;
            
            if (!conceptMap.has(key)) {
                conceptMap.set(key, {
                    name: key,
                    summary: '',
                    catalog_ids: [],
                    catalog_titles: [],
                    chunk_ids: [],
                    related_concepts: [],
                    adjacent_ids: [],
                    related_ids: [],
                    synonyms: [],
                    broader_terms: [],
                    narrower_terms: [],
                    embeddings: createSimpleEmbedding(key),
                    weight: 0
                });
            }
            
            const concept = conceptMap.get(key)!;
            if (!concept.catalog_ids!.includes(record.id)) {
                concept.catalog_ids!.push(record.id);
                const title = sourceToCatalogTitle.get(record.source) || '';
                if (title && !concept.catalog_titles!.includes(title)) {
                    concept.catalog_titles!.push(title);
                }
            }
            concept.weight! += 1;
        }
    }
    
    console.log(`✅ Built ${conceptMap.size} unique concept records`);
    
    // Build concept -> chunk_ids mapping from chunks table
    if (tables.includes('chunks')) {
        console.log('🔗 Building concept → chunk_ids mapping...');
        const chunksTable = await db.openTable('chunks');
        const allChunks = await chunksTable.query().toArray();
        
        let totalMappings = 0;
        for (const chunk of allChunks) {
            const chunkConceptNames = parseArray(chunk.concept_names).filter((n: any) => n && typeof n === 'string' && n.trim());
            
            for (const name of chunkConceptNames) {
                const key = name.toLowerCase().trim();
                const concept = conceptMap.get(key);
                if (concept) {
                    if (!concept.chunk_ids!.includes(chunk.id)) {
                        concept.chunk_ids!.push(chunk.id);
                        totalMappings++;
                    }
                }
            }
        }
        
        const mappedCount = Array.from(conceptMap.values()).filter(c => c.chunk_ids && c.chunk_ids.length > 0).length;
        console.log(`  ✅ Mapped ${mappedCount} concepts to ${allChunks.length} chunks (${totalMappings} total mappings)`);
    }
    
    let conceptRecords = Array.from(conceptMap.values());
    
    // WordNet enrichment (optional)
    if (!skipWordNet) {
        const enricher = new ConceptEnricher();
        conceptRecords = await enricher.enrichConcepts(conceptRecords);
    } else {
        console.log('⏭️  Skipping WordNet enrichment');
    }
    
    // Create concepts table - ensure no empty arrays (LanceDB needs type inference)
    console.log('📝 Creating concepts table...');
    const conceptData = conceptRecords.map(concept => ({
        id: hashToId(concept.name.toLowerCase().trim()),
        name: concept.name,
        summary: concept.summary || '',
        catalog_ids: concept.catalog_ids?.length ? concept.catalog_ids : [0],
        catalog_titles: concept.catalog_titles?.length ? concept.catalog_titles : [''],
        chunk_ids: concept.chunk_ids?.length ? concept.chunk_ids : [0],
        related_concepts: concept.related_concepts?.length ? concept.related_concepts : [''],
        adjacent_ids: concept.adjacent_ids?.length ? concept.adjacent_ids : [0],
        related_ids: concept.related_ids?.length ? concept.related_ids : [0],
        synonyms: concept.synonyms?.length ? concept.synonyms : [''],
        broader_terms: concept.broader_terms?.length ? concept.broader_terms : [''],
        narrower_terms: concept.narrower_terms?.length ? concept.narrower_terms : [''],
        vector: concept.embeddings || createSimpleEmbedding(concept.name),
        weight: concept.weight || 1
    }));
    
    await db.createTable('concepts', conceptData, { mode: 'overwrite' });
    console.log('✅ Concepts table created successfully');
    
    // Show summary
    const conceptsTable = await db.openTable('concepts');
    const count = await conceptsTable.countRows();
    console.log(`📊 Total concepts in table: ${count}`);
    
    // Show top concepts
    const topConcepts = conceptRecords
        .sort((a, b) => (b.catalog_ids?.length || 0) - (a.catalog_ids?.length || 0))
        .slice(0, 5);
    
    console.log('\n🏆 Top concepts by document coverage:');
    for (const c of topConcepts) {
        console.log(`   • "${c.name}" - ${c.catalog_ids?.length || 0} docs, ${c.chunk_ids?.length || 0} chunks`);
    }
    
    console.log('\n✅ Done!');
}

main().catch(console.error);
