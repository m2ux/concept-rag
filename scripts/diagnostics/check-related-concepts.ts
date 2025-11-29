import lancedb from "@lancedb/lancedb";

function parseArray(value: any): any[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'object' && 'toArray' in value) {
    return Array.from(value.toArray());
  }
  return [];
}

async function main() {
  const db = await lancedb.connect("./test_db");
  const concepts = await db.openTable("concepts");
  
  const allConcepts = await concepts.query().limit(100000).toArray();
  
  // Check which fields are populated
  let withRelatedConcepts = 0;
  let withSynonyms = 0;
  let withBroaderTerms = 0;
  let withNarrowerTerms = 0;
  let withAdjacentIds = 0;
  let withRelatedIds = 0;
  
  for (const c of allConcepts) {
    const relatedConcepts = parseArray(c.related_concepts).filter(x => x && x !== '');
    const synonyms = parseArray(c.synonyms).filter(x => x && x !== '');
    const broaderTerms = parseArray(c.broader_terms).filter(x => x && x !== '');
    const narrowerTerms = parseArray(c.narrower_terms).filter(x => x && x !== '');
    const adjacentIds = parseArray(c.adjacent_ids).filter(x => x && x !== 0);
    const relatedIds = parseArray(c.related_ids).filter(x => x && x !== 0);
    
    if (relatedConcepts.length > 0) withRelatedConcepts++;
    if (synonyms.length > 0) withSynonyms++;
    if (broaderTerms.length > 0) withBroaderTerms++;
    if (narrowerTerms.length > 0) withNarrowerTerms++;
    if (adjacentIds.length > 0) withAdjacentIds++;
    if (relatedIds.length > 0) withRelatedIds++;
  }
  
  console.log(`Total concepts: ${allConcepts.length}\n`);
  console.log("Field population:");
  console.log(`  related_concepts: ${withRelatedConcepts} concepts (${(withRelatedConcepts/allConcepts.length*100).toFixed(1)}%)`);
  console.log(`  synonyms: ${withSynonyms} concepts (${(withSynonyms/allConcepts.length*100).toFixed(1)}%)`);
  console.log(`  broader_terms: ${withBroaderTerms} concepts (${(withBroaderTerms/allConcepts.length*100).toFixed(1)}%)`);
  console.log(`  narrower_terms: ${withNarrowerTerms} concepts (${(withNarrowerTerms/allConcepts.length*100).toFixed(1)}%)`);
  console.log(`  adjacent_ids: ${withAdjacentIds} concepts (${(withAdjacentIds/allConcepts.length*100).toFixed(1)}%)`);
  console.log(`  related_ids: ${withRelatedIds} concepts (${(withRelatedIds/allConcepts.length*100).toFixed(1)}%)`);
  
  // Show a sample concept with related_concepts populated
  const sampleWithRelated = allConcepts.find(c => {
    const rc = parseArray(c.related_concepts).filter(x => x && x !== '');
    return rc.length > 0;
  });
  
  if (sampleWithRelated) {
    console.log("\n\nSample concept with related_concepts:");
    console.log(`  Name: ${sampleWithRelated.name}`);
    console.log(`  Related: ${parseArray(sampleWithRelated.related_concepts).filter(x => x).join(', ')}`);
  } else {
    console.log("\n\n⚠️ No concepts have related_concepts populated!");
  }
}

main().catch(console.error);
