import { connect } from '@lancedb/lancedb';

async function inspectDatabase() {
  const db = await connect('./db/test');
  
  console.log('\n📊 TEST DATABASE INSPECTION');
  console.log('='.repeat(80));
  
  const tables = await db.tableNames();
  console.log('\n📋 Tables:', tables.join(', '));
  
  // Check catalog
  if (tables.includes('catalog')) {
    const catalog = await db.openTable('catalog');
    const catalogSample = (await catalog.query().limit(1).toArray())[0];
    console.log('\n📄 CATALOG TABLE:');
    console.log('  Fields:', Object.keys(catalogSample).join(', '));
    console.log('  Has concept_categories?', 'concept_categories' in catalogSample);
    console.log('  Has category_ids?', 'category_ids' in catalogSample);
    console.log('  Has concepts?', 'concepts' in catalogSample);
    
    if (catalogSample.concepts) {
      try {
        const parsed = JSON.parse(catalogSample.concepts);
        console.log('  Concepts structure:', Object.keys(parsed).join(', '));
        if (parsed.categories) {
          console.log('  Categories found:', parsed.categories);
        }
      } catch (e) {
        console.log('  Error parsing concepts:', e);
      }
    }
    
    if (catalogSample.concept_categories) {
      console.log('  concept_categories value:', catalogSample.concept_categories);
    }
  }
  
  // Check chunks
  if (tables.includes('chunks')) {
    const chunks = await db.openTable('chunks');
    const chunkSample = (await chunks.query().limit(1).toArray())[0];
    console.log('\n📝 CHUNKS TABLE:');
    console.log('  Fields:', Object.keys(chunkSample).join(', '));
    console.log('  Has concept_categories?', 'concept_categories' in chunkSample);
    console.log('  Has category_ids?', 'category_ids' in chunkSample);
    
    if (chunkSample.category_ids) {
      console.log('  category_ids value:', chunkSample.category_ids);
    }
  }
  
  // Check concepts
  if (tables.includes('concepts')) {
    const concepts = await db.openTable('concepts');
    const conceptSample = (await concepts.query().limit(1).toArray())[0];
    console.log('\n🧠 CONCEPTS TABLE:');
    console.log('  Fields:', Object.keys(conceptSample).join(', '));
    console.log('  Has category?', 'category' in conceptSample);
    console.log('  Has category_id?', 'category_id' in conceptSample);
    
    if (conceptSample.category) {
      console.log('  category value:', conceptSample.category);
    }
  }
}

await inspectDatabase();

